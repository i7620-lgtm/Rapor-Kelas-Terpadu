import { useCallback } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";
import { getGradeNumber } from "../utils/nilaiHelpers";

/**
 * Custom hook to coordinate cascading changes when the Grade Level of a class changes.
 * This adheres to the Single Responsibility Principle (SRP) by separating the cascading 
 * business logic from visual presentation components.
 */
export const useClassChangeCascade = () => {
  const setSettings = useSettingsStore((state) => state.setSettings);
  const setGrades = useNilaiStore((state) => state.setGrades);
  const setPredefinedCurriculum = useCurriculumStore((state) => state.setPredefinedCurriculum);
  const setLearningObjectives = useCurriculumStore((state) => state.setLearningObjectives);

  /**
   * Fetches the predefined curriculum SLM and TP from public JSON presets based on grade level
   */
  const fetchAndLoadPredefinedCurriculum = useCallback(async (gradeNumber: number) => {
    if (!gradeNumber || gradeNumber < 1 || gradeNumber > 6) {
      setPredefinedCurriculum(null);
      return null;
    }
    
    try {
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}tp${gradeNumber}.json`);
      if (response.ok) {
        const data = await response.json();
        setPredefinedCurriculum(data);
        return data;
      } else {
        console.error(`Failed to fetch TP preset for Grade ${gradeNumber}: status ${response.status}`);
        setPredefinedCurriculum(null);
        return null;
      }
    } catch (e) {
      console.error(`Error fetching TP preset for Grade ${gradeNumber}`, e);
      setPredefinedCurriculum(null);
      return null;
    }
  }, [setPredefinedCurriculum]);

  /**
   * Executes the cascading orchestration when a class changes its grade or name
   */
  const executeClassChangeCascade = useCallback(async (
    newClassName: string,
    oldClassName: string,
    showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void
  ) => {
    const oldGrade = getGradeNumber(oldClassName);
    const newGrade = getGradeNumber(newClassName);

    // 1. Update the Class Name in Settings
    setSettings((prev: any) => ({ ...prev, nama_kelas: newClassName }));

    // 2. Check if Grade Level changed to evaluate cascading updates
    if (oldGrade !== null && newGrade !== null && oldGrade !== newGrade) {
      showToast(`Menyelaraskan tingkat kelas dari Kelas ${oldGrade} ke Kelas ${newGrade}...`, "info");

      // CLEAR grades cascade: to avoid mismatched grade criteria & assignments from previous level
      setGrades([]);

      // CLEAR learning objectives cascade: to clean up user edited objectives from previous level
      setLearningObjectives({});

      // LOAD predefined curriculum cascade: load matching curriculum preset of the new grade
      const loadedData = await fetchAndLoadPredefinedCurriculum(newGrade);
      if (loadedData) {
        showToast(`Kurikulum & TP untuk Kelas ${newGrade} berhasil disinkronkan secara otomatis!`, "success");
      } else {
        showToast(`Kelas diubah ke Kelas ${newGrade}, silakan lengkapi TP secara manual.`, "warning");
      }
    } else {
      showToast("Nama kelas berhasil disimpan.", "success");
    }
  }, [setSettings, setGrades, setLearningObjectives, fetchAndLoadPredefinedCurriculum]);

  return {
    fetchAndLoadPredefinedCurriculum,
    executeClassChangeCascade,
  };
};
