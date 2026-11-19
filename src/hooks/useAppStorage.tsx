import { useState, useEffect, useRef } from "react";
import { defaultSubjects } from "../constants";
import { getGradeNumber } from "../utils/nilaiHelpers";
import { cleanupOrphanedRecords, normalizeSingleSemesterState } from "../utils/dataIntegrity";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useStudentsStore } from "../stores/useStudentsStore";
import { useAttendanceStore } from "../stores/useAttendanceStore";
import { useCocurricularStore } from "../stores/useCocurricularStore";
import { useNotesStore } from "../stores/useNotesStore";
import { useExtracurricularStore } from "../stores/useExtracurricularStore";
import { useFormativeStore } from "../stores/useFormativeStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";
import { useUiStore } from "../stores/useUiStore";
import { initSummarySync } from "../stores/useSummaryStore";
import { useNilaiHistoryStore } from "../stores/useNilaiHistoryStore";
import {
  cleanupUnusedStudentPhotosInDB,
  convertDataUrlToWebPBlob,
  deleteStudentPhotoFromDB,
  loadAllImagesFromDB,
  loadAllStudentPhotosFromDB,
  saveStudentPhotoBlob,
} from "../utils/imageDB";

export const useAppStorage = () => {
  const toast = useUiStore((state) => state.toast);
  const setToast = useUiStore((state) => state.setToast);
  const showToast = useUiStore((state) => state.showToast);
  const isLoading = useUiStore((state) => state.isLoading);
  const setIsLoading = useUiStore((state) => state.setIsLoading);
  const activeNilaiTab = useUiStore((state) => state.activeNilaiTab);
  const setActiveNilaiTab = useUiStore((state) => state.setActiveNilaiTab);
  const isMobileMenuOpen = useUiStore((state) => state.isMobileMenuOpen);
  const setIsMobileMenuOpen = useUiStore((state) => state.setIsMobileMenuOpen);
  const isERaporModalOpen = useUiStore((state) => state.isERaporModalOpen);
  const setIsERaporModalOpen = useUiStore((state) => state.setIsERaporModalOpen);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasHydratedAll, setHasHydratedAll] = useState(false);
  const prevStudentIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const checkHydration = () => {
      const allHydrated =
        useSettingsStore.persist.hasHydrated() &&
        useStudentsStore.persist.hasHydrated() &&
        useNilaiStore.persist.hasHydrated() &&
        useNotesStore.persist.hasHydrated() &&
        useCocurricularStore.persist.hasHydrated() &&
        useAttendanceStore.persist.hasHydrated() &&
        useExtracurricularStore.persist.hasHydrated() &&
        useCurriculumStore.persist.hasHydrated() &&
        useFormativeStore.persist.hasHydrated();

      if (allHydrated) {
        setHasHydratedAll(true);
      }
    };

    checkHydration();

    const unsubSettings = useSettingsStore.persist.onFinishHydration(checkHydration);
    const unsubStudents = useStudentsStore.persist.onFinishHydration(checkHydration);
    const unsubNilai = useNilaiStore.persist.onFinishHydration(checkHydration);
    const unsubNotes = useNotesStore.persist.onFinishHydration(checkHydration);
    const unsubCocurricular = useCocurricularStore.persist.onFinishHydration(checkHydration);
    const unsubAttendance = useAttendanceStore.persist.onFinishHydration(checkHydration);
    const unsubExtracurricular = useExtracurricularStore.persist.onFinishHydration(checkHydration);
    const unsubCurriculum = useCurriculumStore.persist.onFinishHydration(checkHydration);
    const unsubFormative = useFormativeStore.persist.onFinishHydration(checkHydration);

    return () => {
      unsubSettings();
      unsubStudents();
      unsubNilai();
      unsubNotes();
      unsubCocurricular();
      unsubAttendance();
      unsubExtracurricular();
      unsubCurriculum();
      unsubFormative();
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedAll) return;

    let isMounted = true;
    const initializeAllData = async () => {
      try {
        const settingsActions = useSettingsStore.getState();
        const studentsActions = useStudentsStore.getState();
        const nilaiActions = useNilaiStore.getState();
        const attendanceActions = useAttendanceStore.getState();
        const notesActions = useNotesStore.getState();
        const cocurricularActions = useCocurricularStore.getState();
        const extraActions = useExtracurricularStore.getState();
        const formativeActions = useFormativeStore.getState();
        const curriculumActions = useCurriculumStore.getState();

        const currentSubjects = settingsActions.subjects || [];
        const newSubjects = [...currentSubjects];
        let hasUpdates = false;

        defaultSubjects.forEach((ds) => {
          if (!newSubjects.find((s) => s.id === ds.id)) {
            newSubjects.push({ ...ds, active: false });
            hasUpdates = true;
          }
        });

        newSubjects.forEach((s) => {
          const ds = defaultSubjects.find((d) => d.id === s.id);
          if (ds && (!s.curriculumKey || s.curriculumKey !== ds.curriculumKey)) {
            s.curriculumKey = ds.curriculumKey;
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          settingsActions.setSubjects(newSubjects);
        }

        // Normalize legacy dual-semester / _Genap structures & remove orphaned records cleanly on startup
        const normalized = normalizeSingleSemesterState({
          settings: settingsActions.settings,
          students: studentsActions.students,
          grades: nilaiActions.grades,
          attendance: attendanceActions.attendance,
          notes: notesActions.notes,
          cocurricularData: cocurricularActions.cocurricularData,
          studentExtracurriculars: extraActions.studentExtracurriculars,
          formativeJournal: formativeActions.formativeJournal,
          learningObjectives: curriculumActions.learningObjectives,
        });

        // Auto-migrate legacy inline base64 student photos to RKT_ImagesDB binary storage
        const migratedPhotoUrls: Record<string, string> = {};
        let hasStrippedLegacyPhotos = false;
        const cleanedStudents = await Promise.all(
          (normalized.students || []).map(async (s: any) => {
            if (!s || typeof s !== "object") return s;
            const rawFoto = typeof s.foto === "string" ? s.foto : "";
            if (!rawFoto) return s;

            hasStrippedLegacyPhotos = true;
            if (s.id && rawFoto.startsWith("data:image")) {
              try {
                const blob = await convertDataUrlToWebPBlob(rawFoto, 354, 472, 0.9);
                migratedPhotoUrls[String(s.id)] = await saveStudentPhotoBlob(String(s.id), blob);
              } catch (err) {
                console.error(`Failed to migrate inline photo for student ${s.id}`, err);
              }
            }
            const rest = { ...s };
            delete rest.foto;
            return rest;
          })
        );

        if (!isMounted) return;

        if (normalized.changed.students || hasStrippedLegacyPhotos) {
          studentsActions.setStudents(cleanedStudents);
        }
        if (normalized.changed.grades) nilaiActions.setGrades(normalized.grades);
        if (normalized.changed.attendance) attendanceActions.setAttendance(normalized.attendance);
        if (normalized.changed.notes) notesActions.setNotes(normalized.notes);
        if (normalized.changed.cocurricularData) cocurricularActions.setCocurricularData(normalized.cocurricularData);
        if (normalized.changed.studentExtracurriculars) extraActions.setStudentExtracurriculars(normalized.studentExtracurriculars);
        if (normalized.changed.formativeJournal) formativeActions.setFormativeJournal(normalized.formativeJournal);
        if (normalized.changed.learningObjectives) curriculumActions.setLearningObjectives(normalized.learningObjectives);

        const validStudentIdSet = new Set<string>(
          cleanedStudents.filter((s: any) => s?.id).map((s: any) => String(s.id))
        );
        prevStudentIdsRef.current = validStudentIdSet;

        const currentSettings = normalized.settings;
        const activeGradeNumber = getGradeNumber(currentSettings?.nama_kelas) || 6;
        const baseUrl = import.meta.env.BASE_URL || "/";
        const presetsUrl = baseUrl.endsWith("/") ? `${baseUrl}presets.json` : `${baseUrl}/presets.json`;

        const [imagesResult, studentPhotosResult, presetsResult] = await Promise.allSettled([
          loadAllImagesFromDB(),
          loadAllStudentPhotosFromDB(validStudentIdSet),
          (async () => {
            const response = await fetch(presetsUrl);
            if (response.ok) {
              return await response.json();
            }
            return null;
          })(),
          cleanupUnusedStudentPhotosInDB(validStudentIdSet),
          activeGradeNumber >= 1 && activeGradeNumber <= 12
            ? curriculumActions.loadPredefinedCurriculum(activeGradeNumber)
            : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        const restoredImages =
          imagesResult.status === "fulfilled" && imagesResult.value ? imagesResult.value : {};
        if (imagesResult.status === "rejected") {
          console.error("Failed to restore images on startup", imagesResult.reason);
        }

        const restoredStudentPhotos =
          studentPhotosResult.status === "fulfilled" && studentPhotosResult.value
            ? studentPhotosResult.value
            : {};
        if (studentPhotosResult.status === "rejected") {
          console.error("Failed to restore student photos on startup", studentPhotosResult.reason);
        }

        // Revoke any DB-loaded URL if superseded by a freshly migrated URL for the same student
        Object.keys(migratedPhotoUrls).forEach((sid) => {
          const oldUrl = restoredStudentPhotos[sid];
          if (typeof oldUrl === "string" && oldUrl.startsWith("blob:") && oldUrl !== migratedPhotoUrls[sid]) {
            URL.revokeObjectURL(oldUrl);
          }
        });
        useStudentsStore
          .getState()
          .setAllStudentPhotoUrls({ ...restoredStudentPhotos, ...migratedPhotoUrls });

        if (normalized.changed.settings || Object.keys(restoredImages).length > 0) {
          useSettingsStore.getState().setSettings((prev) => {
            const base = normalized.changed.settings ? normalized.settings : prev;
            return { ...base, ...restoredImages };
          });
        }

        if (presetsResult.status === "fulfilled" && presetsResult.value) {
          const currentExtracurriculars = useSettingsStore.getState().extracurriculars || [];
          if (currentExtracurriculars.length === 0) {
            useSettingsStore.getState().setExtracurriculars(presetsResult.value.extracurriculars || []);
          }
        } else if (presetsResult.status === "rejected") {
          console.error("Failed to load presets", presetsResult.reason);
        }

        initSummarySync();
        setIsDataLoaded(true);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to setup merged settings", e);
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAllData();
    return () => {
      isMounted = false;
    };
  }, [hasHydratedAll, setIsLoading]);

  // Automatic orphan cleanup (including student 3x4 photos in RKT_ImagesDB) via store subscription
  useEffect(() => {
    if (!isDataLoaded) return;

    const unsub = useStudentsStore.subscribe((state, prevState) => {
      if (state.students === prevState.students) return;

      const currentStudents = state.students || [];
      const currentIds = new Set(
        currentStudents.filter((s: any) => s?.id).map((s: any) => String(s.id))
      );
      const prevIds = prevStudentIdsRef.current;
      prevStudentIdsRef.current = currentIds;

      if (!prevIds) return;
      const removedIds: string[] = [];
      for (const id of prevIds) {
        if (!currentIds.has(id)) {
          removedIds.push(id);
        }
      }

      if (removedIds.length === 0) return;

      removedIds.forEach((removedId) => {
        useStudentsStore.getState().removeStudentPhotoUrl(removedId);
        void deleteStudentPhotoFromDB(removedId);
      });

      const cleaned = cleanupOrphanedRecords({
        students: currentStudents,
        grades: useNilaiStore.getState().grades,
        attendance: useAttendanceStore.getState().attendance,
        notes: useNotesStore.getState().notes,
        cocurricularData: useCocurricularStore.getState().cocurricularData,
        studentExtracurriculars: useExtracurricularStore.getState().studentExtracurriculars,
        formativeJournal: useFormativeStore.getState().formativeJournal,
      });

      if (cleaned.changed.grades) useNilaiStore.getState().setGrades(cleaned.grades);
      if (cleaned.changed.attendance) useAttendanceStore.getState().setAttendance(cleaned.attendance);
      if (cleaned.changed.notes) useNotesStore.getState().setNotes(cleaned.notes);
      if (cleaned.changed.cocurricularData) useCocurricularStore.getState().setCocurricularData(cleaned.cocurricularData);
      if (cleaned.changed.studentExtracurriculars) useExtracurricularStore.getState().setStudentExtracurriculars(cleaned.studentExtracurriculars);
      if (cleaned.changed.formativeJournal) useFormativeStore.getState().setFormativeJournal(cleaned.formativeJournal);

      if (currentIds.size === 0) {
        useNilaiHistoryStore.getState().clearAllHistory();
      } else {
        useNilaiHistoryStore.getState().pruneStudentsFromHistory(currentIds);
      }
    });

    return () => unsub();
  }, [isDataLoaded]);

  return {
    toast,
    setToast,
    showToast,
    isLoading,
    setIsLoading,
    activeNilaiTab,
    setActiveNilaiTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isERaporModalOpen,
    setIsERaporModalOpen,
    isDataLoaded,
  };
};

