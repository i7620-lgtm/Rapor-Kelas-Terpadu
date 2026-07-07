import { PersistStorage, StorageValue } from "zustand/middleware";
import localforage from "localforage";

// Memory cache to serve instant reads of pending debounced queues
const memoryCache: Record<string, any> = {};
const pendingTimers: Record<string, any> = {};

// Helper to flush a specific debounced save instantly
const flushQueue = async (name: string, value: any): Promise<void> => {
  try {
    if (pendingTimers[name]) {
      clearTimeout(pendingTimers[name]);
      delete pendingTimers[name];
    }
    await localforage.setItem(name, value);
    
    // Sync back to individual flat keys for full backwards-compatibility
    if (name === "appSettingsCompound") {
      const state = value.state as any;
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
    delete memoryCache[name];
  } catch (err) {
    console.error(`Error flushing debounced persistence for "${name}":`, err);
  }
};

// Global fallback listeners to flush the queue when user moves/closes the page
if (typeof window !== "undefined") {
  const flushAll = () => {
    for (const [name, value] of Object.entries(memoryCache)) {
      if (pendingTimers[name]) {
        clearTimeout(pendingTimers[name]);
        delete pendingTimers[name];
      }
      // Trigger instant save
      localforage.setItem(name, value).catch(() => {});
      if (name === "appSettingsCompound") {
        const state = value?.state as any;
        if (state?.settings) localforage.setItem("appSettings", state.settings).catch(() => {});
        if (state?.subjects) localforage.setItem("appSubjects", state.subjects).catch(() => {});
        if (state?.extracurriculars) localforage.setItem("appExtracurriculars", state.extracurriculars).catch(() => {});
      }
    }
  };
  window.addEventListener("beforeunload", flushAll);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushAll();
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
        // Set hot memory cache representation to keep state instantaneous
        memoryCache[name] = value;

        // Clear existing queue timers for the current key
        if (pendingTimers[name]) {
          clearTimeout(pendingTimers[name]);
        }

        // Setup a 1500ms debouncing interval. 
        // Highly dynamic keys like grades and formative typing will update visually instantly, 
        // but commit to IndexedDB only once typing slows down, freeing up CPU/memory loops on low-end devices.
        pendingTimers[name] = setTimeout(() => {
          flushQueue(name, value);
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
