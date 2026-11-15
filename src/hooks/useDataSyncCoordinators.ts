import { useEffect } from "react";
import { getGradeNumber } from "../utils/nilaiHelpers";
import { calculateFinalGrade } from "../utils/gradeCalculations";
import { useStudentsStore } from "../stores/useStudentsStore";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";

const ensureMissingGradeRows = () => {
  const students = useStudentsStore.getState().students;
  if (!students || students.length === 0) return;

  const currentGrades = useNilaiStore.getState().grades;
  const existingIds = new Set(currentGrades.map((g) => g.studentId));
  let hasMissing = false;
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    if (s?.id && !existingIds.has(s.id)) {
      hasMissing = true;
      break;
    }
  }
  if (!hasMissing) return;

  useNilaiStore.getState().setGrades((prevGrades) => {
    const prevIds = new Set(prevGrades.map((g) => g.studentId));
    const additions = students
      .filter((s) => s?.id && !prevIds.has(s.id))
      .map((s) => ({
        studentId: s.id,
        detailedGrades: {},
        finalGrades: {},
      }));
    return additions.length > 0 ? [...prevGrades, ...additions] : prevGrades;
  });
};

const recalculateFinalGradesForSubjects = (targetSubjectIds?: Set<string> | null) => {
  const { settings, subjects } = useSettingsStore.getState();
  const { learningObjectives, predefinedCurriculum } = useCurriculumStore.getState();
  const currentGrades = useNilaiStore.getState().grades;
  if (!currentGrades || currentGrades.length === 0 || !subjects || subjects.length === 0) return;

  const targetSubjects = targetSubjectIds
    ? subjects.filter((subj) => targetSubjectIds.has(subj.id))
    : subjects;
  if (targetSubjects.length === 0) return;

  const gradeKey = `Kelas ${getGradeNumber(settings?.nama_kelas) || "6"}`;

  useNilaiStore.getState().setGrades((latestGrades) => {
    let anyChanged = false;
    const newGrades = latestGrades.map((studentGrade) => {
      let studentChanged = false;
      let newFinalGrades: Record<string, any> | null = null;

      for (let i = 0; i < targetSubjects.length; i++) {
        const subj = targetSubjects[i];
        const detailed = studentGrade.detailedGrades?.[subj.id];
        if (!detailed) continue;

        const config = settings?.gradeCalculation?.[subj.id] || { method: "rata-rata" };
        const curriculumKey = subj.curriculumKey || subj.fullName;
        const calculated = calculateFinalGrade(
          detailed,
          config,
          settings,
          subj.id,
          learningObjectives,
          gradeKey,
          curriculumKey,
          predefinedCurriculum
        );

        const prevVal = (newFinalGrades ?? studentGrade.finalGrades)?.[subj.id];
        if (calculated !== prevVal) {
          if (!newFinalGrades) {
            newFinalGrades = { ...(studentGrade.finalGrades || {}) };
          }
          newFinalGrades[subj.id] = calculated;
          studentChanged = true;
        }
      }

      if (studentChanged && newFinalGrades) {
        anyChanged = true;
        return { ...studentGrade, finalGrades: newFinalGrades };
      }
      return studentGrade;
    });

    return anyChanged ? newGrades : latestGrades;
  });
};

const getChangedMapKeys = (
  prevMap: Record<string, any> | undefined,
  nextMap: Record<string, any> | undefined
): Set<string> => {
  const changed = new Set<string>();
  const prevObj = prevMap || {};
  const nextObj = nextMap || {};
  const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);
  keys.forEach((key) => {
    if (prevObj[key] !== nextObj[key]) {
      changed.add(key);
    }
  });
  return changed;
};

/**
 * Headless store-subscription coordinator for grade row provisioning and
 * automatic final-grade recalculation. Keeps root App JSX free of reactive data subscriptions.
 */
export const useDataSyncCoordinators = (isDataLoaded: boolean) => {
  useEffect(() => {
    if (!isDataLoaded) return;

    ensureMissingGradeRows();
    recalculateFinalGradesForSubjects(null);

    const unsubStudents = useStudentsStore.subscribe((state, prevState) => {
      if (state.students !== prevState.students) {
        ensureMissingGradeRows();
      }
    });

    const unsubGradesLength = useNilaiStore.subscribe((state, prevState) => {
      if (state.grades.length !== prevState.grades.length) {
        ensureMissingGradeRows();
      }
    });

    const unsubSettings = useSettingsStore.subscribe((state, prevState) => {
      const s = state.settings;
      const ps = prevState.settings;
      const globalChanged =
        state.subjects !== prevState.subjects ||
        s?.predikats !== ps?.predikats ||
        s?.qualitativeGradingMap !== ps?.qualitativeGradingMap ||
        s?.semester !== ps?.semester ||
        s?.nama_kelas !== ps?.nama_kelas;

      if (globalChanged) {
        recalculateFinalGradesForSubjects(null);
        return;
      }

      const calcChanged = s?.gradeCalculation !== ps?.gradeCalculation;
      const visChanged = s?.slmVisibility !== ps?.slmVisibility;
      if (!calcChanged && !visChanged) return;

      const changedSubjectIds = new Set<string>();
      if (calcChanged) {
        getChangedMapKeys(ps?.gradeCalculation, s?.gradeCalculation).forEach((id) =>
          changedSubjectIds.add(id)
        );
      }
      if (visChanged) {
        getChangedMapKeys(ps?.slmVisibility, s?.slmVisibility).forEach((id) =>
          changedSubjectIds.add(id)
        );
      }

      if (changedSubjectIds.size > 0) {
        recalculateFinalGradesForSubjects(changedSubjectIds);
      }
    });

    const unsubCurriculum = useCurriculumStore.subscribe((state, prevState) => {
      if (
        state.learningObjectives !== prevState.learningObjectives ||
        state.predefinedCurriculum !== prevState.predefinedCurriculum
      ) {
        recalculateFinalGradesForSubjects(null);
      }
    });

    return () => {
      unsubStudents();
      unsubGradesLength();
      unsubSettings();
      unsubCurriculum();
    };
  }, [isDataLoaded]);
};
