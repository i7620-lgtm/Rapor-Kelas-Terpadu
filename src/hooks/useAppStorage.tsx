import { useState, useEffect } from "react";
import {
  defaultSubjects,
} from "../constants";
import { getGradeNumber } from "../utils/nilaiHelpers";
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
import { loadAllImagesFromDB } from "../utils/imageDB";

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

  const pendingSemester = useSettingsStore((state) => state.pendingSemester);
  const setPendingSemester = useSettingsStore((state) => state.setPendingSemester);
  const showSemesterModal = useSettingsStore((state) => state.showSemesterModal);
  const setShowSemesterModal = useSettingsStore((state) => state.setShowSemesterModal);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const students = useStudentsStore((state) => state.students);
  const setStudents = useStudentsStore((state) => state.setStudents);
  const grades = useNilaiStore((state) => state.grades);
  const setGrades = useNilaiStore((state) => state.setGrades);
  const notes = useNotesStore((state) => state.notes);
  const setNotes = useNotesStore((state) => state.setNotes);
  const cocurricularData = useCocurricularStore((state) => state.cocurricularData);
  const setCocurricularData = useCocurricularStore((state) => state.setCocurricularData);
  const attendance = useAttendanceStore((state) => state.attendance);
  const setAttendance = useAttendanceStore((state) => state.setAttendance);
  const extracurriculars = useSettingsStore((state) => state.extracurriculars);
  const setExtracurriculars = useSettingsStore((state) => state.setExtracurriculars);
  const studentExtracurriculars = useExtracurricularStore((state) => state.studentExtracurriculars);
  const setStudentExtracurriculars = useExtracurricularStore((state) => state.setStudentExtracurriculars);
  const subjects = useSettingsStore((state) => state.subjects);
  const setSubjects = useSettingsStore((state) => state.setSubjects);
  
  const learningObjectives = useCurriculumStore((state) => state.learningObjectives);
  const setLearningObjectives = useCurriculumStore((state) => state.setLearningObjectives);
  const predefinedCurriculum = useCurriculumStore((state) => state.predefinedCurriculum);
  
  const formativeJournal = useFormativeStore((state) => state.formativeJournal);
  const setFormativeJournal = useFormativeStore((state) => state.setFormativeJournal);

  const [hasHydratedAll, setHasHydratedAll] = useState(false);

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
        const currentSubjects = useSettingsStore.getState().subjects || [];
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
          setSubjects(newSubjects);
        }

        try {
          const storedImages = await loadAllImagesFromDB();
          if (isMounted) {
            setSettings((prev) => ({ ...prev, ...storedImages }));
          }
        } catch (imgErr) {
          console.error("Failed to restore images on startup", imgErr);
        }

        if (isMounted) {
          setIsDataLoaded(true);

          try {
            const baseUrl = import.meta.env.BASE_URL;
            const response = await fetch(`${baseUrl}presets.json`);
            if (response.ok) {
              const presetsData = await response.json();
              const currentExtracurriculars = useSettingsStore.getState().extracurriculars || [];
              if (currentExtracurriculars.length === 0) {
                setExtracurriculars(presetsData.extracurriculars || []);
              }
            }
          } catch (e) {
            console.error("Failed to load presets", e);
          }

          // Cascade load active grade level curriculum templates to avoid empty state on startup
          const currentSettings = useSettingsStore.getState().settings;
          const activeGradeNumber = getGradeNumber(currentSettings?.nama_kelas);
          if (activeGradeNumber && activeGradeNumber >= 1 && activeGradeNumber <= 6) {
            try {
              const baseUrl = import.meta.env.BASE_URL;
              const tpRes = await fetch(`${baseUrl}tp${activeGradeNumber}.json`);
              if (tpRes.ok) {
                const tpData = await tpRes.json();
                if (tpData) {
                  useCurriculumStore.getState().setPredefinedCurriculum(tpData);
                }
              }
            } catch (tpErr) {
              console.error(`Failed to load TP preset on startup for Grade ${activeGradeNumber}`, tpErr);
            }
          }

          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to setup merged settings", e);
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAllData();
    return () => { isMounted = false; };
  }, [hasHydratedAll, setSubjects, setExtracurriculars, setIsLoading]);

  return {
    toast, setToast, showToast,
    isLoading, setIsLoading,
    activeNilaiTab, setActiveNilaiTab,
    isMobileMenuOpen, setIsMobileMenuOpen,
    isERaporModalOpen, setIsERaporModalOpen,
    pendingSemester, setPendingSemester,
    showSemesterModal, setShowSemesterModal,
    isDataLoaded,
    settings, setSettings,
    students, setStudents,
    grades, setGrades,
    notes, setNotes,
    cocurricularData, setCocurricularData,
    attendance, setAttendance,
    extracurriculars, setExtracurriculars,
    studentExtracurriculars, setStudentExtracurriculars,
    subjects, setSubjects,
    learningObjectives, setLearningObjectives,
    formativeJournal, setFormativeJournal,
    predefinedCurriculum
  };
};
