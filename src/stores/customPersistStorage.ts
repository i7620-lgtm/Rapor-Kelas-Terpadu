import { PersistStorage, StorageValue } from "zustand/middleware";
import localforage from "localforage";
import { computeQualitativeGradingMap, isValidQualitativeGradingMap } from "../utils/nilaiHelpers";
import { IMAGE_KEYS } from "../utils/imageDB";

// Memory cache to serve instant reads of pending debounced queues
const memoryCache: Record<string, any> = {};
const pendingTimers: Record<string, any> = {};
const writeGeneration: Record<string, number> = {};
const inFlightFlushes: Record<string, Promise<void>> = {};

// Strip transient blob: URLs from persisted settings JSON without mutating runtime state
const stripBlobImageUrlsFromSettings = (settingsObj: any): any => {
  if (!settingsObj || typeof settingsObj !== "object") return settingsObj;
  let hasBlob = false;
  for (const key of IMAGE_KEYS) {
    if (typeof settingsObj[key] === "string" && settingsObj[key].startsWith("blob:")) {
      hasBlob = true;
      break;
    }
  }
  if (!hasBlob) return settingsObj;
  const cleaned = { ...settingsObj };
  for (const key of IMAGE_KEYS) {
    if (typeof cleaned[key] === "string" && cleaned[key].startsWith("blob:")) {
      cleaned[key] = null;
    }
  }
  return cleaned;
};

const stripBlobStudentPhotoUrls = (studentsList: any[]): any[] => {
  if (!Array.isArray(studentsList)) return studentsList;
  let hasBlob = false;
  for (const s of studentsList) {
    if (typeof s?.foto === "string" && s.foto.startsWith("blob:")) {
      hasBlob = true;
      break;
    }
  }
  if (!hasBlob) return studentsList;
  return studentsList.map((s) =>
    typeof s?.foto === "string" && s.foto.startsWith("blob:")
      ? { ...s, foto: "" }
      : s
  );
};

const preparePayloadForPersistence = (name: string, value: any): any => {
  if (!value || typeof value !== "object") return value;
  if (name === "appSettingsCompound" && value.state?.settings) {
    const cleanedSettings = stripBlobImageUrlsFromSettings(value.state.settings);
    if (cleanedSettings === value.state.settings) return value;
    return {
      ...value,
      state: {
        ...value.state,
        settings: cleanedSettings,
      },
    };
  }
  if (name === "appStudents" && Array.isArray(value.state?.students)) {
    const cleanedStudents = stripBlobStudentPhotoUrls(value.state.students);
    if (cleanedStudents === value.state.students) return value;
    return {
      ...value,
      state: {
        ...value.state,
        students: cleanedStudents,
      },
    };
  }
  return value;
};

// Helper to flush a specific debounced save safely using writeGeneration to prevent race deletions
const flushQueue = async (name: string): Promise<void> => {
  if (pendingTimers[name]) {
    clearTimeout(pendingTimers[name]);
    delete pendingTimers[name];
  }

  if (inFlightFlushes[name]) {
    await inFlightFlushes[name];
    if (!memoryCache[name]) return;
  }

  const runFlush = async () => {
    while (memoryCache[name] !== undefined) {
      const genAtStart = writeGeneration[name] || 0;
      const snapshot = preparePayloadForPersistence(name, memoryCache[name]);
      try {
        await localforage.setItem(name, snapshot);

        // Sync back to individual flat keys for backwards-compatibility
        if (name === "appSettingsCompound" && snapshot?.state) {
          const state = snapshot.state as any;
          if (state.settings) {
            await localforage.setItem("appSettings", state.settings);
          }
          if (state.subjects) {
            await localforage.setItem("appSubjects", state.subjects);
          }
          if (state.extracurriculars) {
            await localforage.setItem("appExtracurriculars", state.extracurriculars);
          }
        }
      } catch (err) {
        console.error(`Error flushing debounced persistence for "${name}":`, err);
        break;
      }

      if ((writeGeneration[name] || 0) === genAtStart) {
        delete memoryCache[name];
        break;
      }
      // A newer write happened while localforage.setItem was awaiting; loop again to persist it
    }
  };

  const promise = runFlush().finally(() => {
    if (inFlightFlushes[name] === promise) {
      delete inFlightFlushes[name];
    }
  });
  inFlightFlushes[name] = promise;
  await promise;
};

export const flushAllPendingWrites = async (): Promise<void> => {
  const keys = Array.from(
    new Set([...Object.keys(memoryCache), ...Object.keys(inFlightFlushes)])
  );
  if (keys.length === 0) return;
  await Promise.all(keys.map((name) => flushQueue(name)));
};

// Global fallback listeners to flush the queue when user moves/closes the page
if (typeof window !== "undefined") {
  const flushAllSyncTrigger = () => {
    void flushAllPendingWrites();
  };
  window.addEventListener("beforeunload", flushAllSyncTrigger);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushAllSyncTrigger();
    }
  });
}

// Helper to perform deep state schema validation and sanitization during hydration,
// preventing potential runtime white-screens in case of corrupt state data.
const sanitizeRestoredState = (name: string, state: any): any => {
  if (!state || typeof state !== "object") return state;

  if (name.includes("Students") || name.includes("students")) {
    if (!Array.isArray(state.students)) {
      state.students = [];
    }
  }

  if (name.includes("Nilai") || name.includes("grades") || name.includes("Grades")) {
    if (!Array.isArray(state.grades)) {
      state.grades = [];
    }
  }

  if (name.includes("Formative") || name.includes("formative")) {
    if (!state.formativeJournal || typeof state.formativeJournal !== "object") {
      state.formativeJournal = {};
    }
  }

  if (name.includes("Settings") || name.includes("settings") || name.includes("appSettingsCompound")) {
    if (!state.settings || typeof state.settings !== "object") {
      state.settings = {};
    } else {
      const booleanSettingKeys = [
        "show_aksara_bali",
        "enableExitWarning",
        "enableAutoRegression",
        "show_photo",
        "show_nip_kepsek",
        "show_nis_cover",
        "show_nisn_cover",
        "show_alamat_cover",
        "show_rt_rw",
        "use_clean_piagam_text",
      ];
      booleanSettingKeys.forEach((key) => {
        if (typeof state.settings[key] === "string") {
          const normalized = state.settings[key].trim().toLowerCase();
          if (normalized === "true") state.settings[key] = true;
          else if (normalized === "false") state.settings[key] = false;
        }
      });

      // Heal stray flat predikat keys if previously persisted by dotted input names
      ["a", "b", "c", "d"].forEach((subKey) => {
        const flatKey = `predikats.${subKey}`;
        if (flatKey in state.settings) {
          delete state.settings[flatKey];
        }
      });

      // Ensure predikats exists and heal missing or legacy-formatted qualitativeGradingMap
      if (!state.settings.predikats || typeof state.settings.predikats !== "object") {
        state.settings.predikats = { a: "90", b: "80", c: "70", d: "0" };
      }
      if (!isValidQualitativeGradingMap(state.settings.qualitativeGradingMap)) {
        state.settings.qualitativeGradingMap = computeQualitativeGradingMap(state.settings.predikats);
      }

      // Strip expired blob: URLs from hydrated JSON before RKT_ImagesDB loads fresh URLs
      state.settings = stripBlobImageUrlsFromSettings(state.settings);
    }
    if (!Array.isArray(state.subjects)) {
      state.subjects = [];
    }
    if (!Array.isArray(state.extracurriculars)) {
      state.extracurriculars = [];
    }
  }

  if (name.includes("Attendance") || name.includes("attendance")) {
    if (!Array.isArray(state.attendance)) {
      state.attendance = [];
    }
  }

  if (name.includes("Notes") || name.includes("notes")) {
    if (!state.notes || typeof state.notes !== "object") {
      state.notes = {};
    }
  }

  if (name.includes("Extracurricular") || name.includes("extracurricular")) {
    if (!Array.isArray(state.studentExtracurriculars)) {
      state.studentExtracurriculars = [];
    }
  }

  if (name.includes("Cocurricular") || name.includes("cocurricular")) {
    if (!state.cocurricularData || typeof state.cocurricularData !== "object") {
      state.cocurricularData = {};
    }
  }

  return state;
};

export const createCustomPersistStorage = <T extends object>(
  storeKeyName: string
): PersistStorage<T> => {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      try {
        // Serve from active memory cache first so the UI reads latest hot modifications instantly
        if (memoryCache[name]) {
          return memoryCache[name] as StorageValue<T>;
        }

        const value = await localforage.getItem<any>(name);
        
        // Settings store fallback loading from legacy individual keys
        if (name === "appSettingsCompound" && value === null) {
          const appSettings = await localforage.getItem<any>("appSettings");
          if (appSettings === null) return null; // No saved data at all yet

          const restoredState: any = {
            settings: appSettings,
            isLoaded: true,
          };

          const rawSubjects = await localforage.getItem("appSubjects");
          if (rawSubjects) restoredState.subjects = rawSubjects;
          
          const rawExtracurriculars = await localforage.getItem("appExtracurriculars");
          if (rawExtracurriculars) restoredState.extracurriculars = rawExtracurriculars;

          const sanitized = sanitizeRestoredState(name, restoredState);

          return {
            state: sanitized as T,
            version: 0,
          };
        }

        if (value === null) return null;

        // If already wrapping in standard Zustand persist package: { state, version }
        if (typeof value === "object" && value !== null && "state" in value) {
          const wrapped = value as StorageValue<any>;
          wrapped.state = sanitizeRestoredState(name, {
            ...wrapped.state,
            isLoaded: true,
          });
          return wrapped as StorageValue<T>;
        }

        // Handle legacy un-wrapped state formatting stored raw inside localforage
        const restoredState: any = {};
        restoredState[storeKeyName] = value;
        restoredState.isLoaded = true;

        const sanitized = sanitizeRestoredState(name, restoredState);

        return {
          state: sanitized as T,
          version: 0,
        };
      } catch (err) {
        console.error(`Error loading state from localforage for key "${name}":`, err);
        return null;
      }
    },
    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      try {
        // Set hot memory cache representation and bump generation counter
        memoryCache[name] = value;
        writeGeneration[name] = (writeGeneration[name] || 0) + 1;

        // Clear existing queue timers for the current key
        if (pendingTimers[name]) {
          clearTimeout(pendingTimers[name]);
        }

        // Setup a 1500ms debouncing interval. 
        // Highly dynamic keys like grades and formative typing will update visually instantly, 
        // but commit to IndexedDB only once typing slows down, freeing up CPU/memory loops on low-end devices.
        pendingTimers[name] = setTimeout(() => {
          void flushQueue(name);
        }, 1500);

      } catch (err) {
        console.error(`Error scheduling debounced save for key "${name}":`, err);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        if (pendingTimers[name]) {
          clearTimeout(pendingTimers[name]);
          delete pendingTimers[name];
        }
        delete memoryCache[name];

        await localforage.removeItem(name);
        if (name === "appSettingsCompound") {
          await localforage.removeItem("appSettings");
          await localforage.removeItem("appSubjects");
          await localforage.removeItem("appExtracurriculars");
        }
      } catch (err) {
        console.error(`Error removing state from localforage for key "${name}":`, err);
      }
    },
  };
};
