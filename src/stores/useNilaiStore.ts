import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { calculateFinalGrade } from "../utils/gradeCalculations";
import { getGradeNumber } from "../utils/nilaiHelpers";
import { createCustomPersistStorage } from './customPersistStorage';
import { cloneDetailedGrade, type GradeSnapshotChange } from './useNilaiHistoryStore';

export interface GradeItem {
  studentId: string;
  detailedGrades?: Record<string, any>;
  finalGrades?: Record<string, any>;
}

export interface GradeCalcContext {
  settings: any;
  learningObjectives: any;
  predefinedCurriculum: any;
  subjects: any[];
}

const buildGradesIndex = (grades: GradeItem[]): Record<string, GradeItem> => {
  const index: Record<string, GradeItem> = {};
  if (!Array.isArray(grades)) return index;
  for (const g of grades) {
    if (g?.studentId) {
      index[g.studentId] = g;
    }
  }
  return index;
};

const getOrCreateDraftStudentGrade = (state: NilaiState, studentId: string): GradeItem => {
  let item = state.gradesByStudentId[studentId];
  if (!item) {
    const idx = state.grades.findIndex((g) => g.studentId === studentId);
    if (idx !== -1) {
      item = state.grades[idx];
      state.gradesByStudentId[studentId] = item;
    } else {
      item = { studentId, detailedGrades: {}, finalGrades: {} };
      state.grades.push(item);
      state.gradesByStudentId[studentId] = item;
    }
  }
  return item;
};

const recomputeStudentSubjectFinal = (
  item: GradeItem,
  subjectId: string,
  calcContext?: GradeCalcContext
) => {
  if (!calcContext) return;
  const { settings, learningObjectives, predefinedCurriculum, subjects } = calcContext;
  const detailed = item.detailedGrades?.[subjectId];
  item.finalGrades = item.finalGrades ?? {};
  if (!detailed) {
    item.finalGrades[subjectId] = null;
    return;
  }
  const subject = (subjects || []).find((s) => s.id === subjectId);
  const gradeKey = `Kelas ${getGradeNumber(settings?.nama_kelas) || "6"}`;
  const curriculumKey = subject ? subject.curriculumKey || subject.fullName : null;

  item.finalGrades[subjectId] = calculateFinalGrade(
    detailed,
    settings?.gradeCalculation?.[subjectId] || { method: "rata-rata" },
    settings,
    subjectId,
    learningObjectives,
    gradeKey,
    curriculumKey,
    predefinedCurriculum
  );
};

interface NilaiState {
  grades: GradeItem[];
  gradesByStudentId: Record<string, GradeItem>;
  isLoaded: boolean;

  // Actions
  setGrades: (grades: GradeItem[] | ((prev: GradeItem[]) => GradeItem[])) => void;
  initGrades: (grades: GradeItem[]) => void;

  updateSingleGrade: (
    studentId: string,
    subjectId: string,
    value: any,
    type: string,
    slmId?: string,
    tpIndex?: number,
    slmName?: string,
    calcContext?: GradeCalcContext
  ) => void;

  updateSingleDescription: (
    studentId: string,
    subjectId: string,
    descType: 'highest' | 'lowest',
    value: string,
    fallbackDescriptions?: { highest?: string; lowest?: string }
  ) => void;

  applyHistoryChanges: (
    subjectId: string,
    changes: GradeSnapshotChange[],
    direction: 'undo' | 'redo',
    calcContext?: GradeCalcContext
  ) => void;

  updateFinalGrades: (
    subjectId: string,
    calculationFn: (studentId: string, detailedGrade: any) => number | null
  ) => void;

  bulkUpdateGrades: (
    updates: Array<{ studentId: string; subjectId: string; newDetailedGrade: any }>,
    settings: any,
    learningObjectives: any,
    predefinedCurriculum: any,
    subjects: any[]
  ) => void;

  bulkAddSlm: (
    subjectId: string,
    slm: { id: string; label: string; ratio: number; maxTps: number; scores: any[] }
  ) => void;
}

export const useNilaiStore = create<NilaiState>()(
  persist(
    (set) => ({
      grades: [],
      gradesByStudentId: {},
      isLoaded: false,

      initGrades: (grades) => {
        set({ grades, gradesByStudentId: buildGradesIndex(grades), isLoaded: true });
      },

      setGrades: (gradesAction) => {
        set((state) => {
          const newGrades = typeof gradesAction === 'function' ? gradesAction(state.grades) : gradesAction;
          return { grades: newGrades, gradesByStudentId: buildGradesIndex(newGrades) };
        });
      },

      updateSingleGrade: (
        studentId,
        subjectId,
        value,
        type,
        slmId,
        tpIndex,
        slmName,
        calcContext
      ) => {
        set(
          produce((state: NilaiState) => {
            const grade = getOrCreateDraftStudentGrade(state, studentId);
            grade.detailedGrades = grade.detailedGrades ?? {};
            grade.detailedGrades[subjectId] = grade.detailedGrades[subjectId] ?? {
              slm: [],
              sts: null,
              sas: null,
            };
            const subjectGrades = grade.detailedGrades[subjectId];

            if (type === "tp" && slmId !== undefined && tpIndex !== undefined && tpIndex !== null) {
              subjectGrades.slm = subjectGrades.slm ?? [];
              let slmObj = subjectGrades.slm.find((s: any) => s.id === slmId);

              if (!slmObj) {
                slmObj = { id: slmId, name: slmName, scores: [] };
                subjectGrades.slm.push(slmObj);
              }
              if (!Array.isArray(slmObj.scores)) {
                slmObj.scores = [];
              }
              while (slmObj.scores.length <= tpIndex) {
                slmObj.scores.push(null);
              }
              slmObj.scores[tpIndex] = value;
            } else {
              subjectGrades[type] = value;
            }

            recomputeStudentSubjectFinal(grade, subjectId, calcContext);
          })
        );
      },

      updateSingleDescription: (
        studentId,
        subjectId,
        descType,
        value,
        fallbackDescriptions
      ) => {
        set(
          produce((state: NilaiState) => {
            const grade = getOrCreateDraftStudentGrade(state, studentId);
            grade.detailedGrades = grade.detailedGrades ?? {};
            grade.detailedGrades[subjectId] = grade.detailedGrades[subjectId] ?? {
              slm: [],
              sts: null,
              sas: null,
            };
            const subjectGrades = grade.detailedGrades[subjectId];

            if (!subjectGrades.descriptions || typeof subjectGrades.descriptions !== 'object') {
              subjectGrades.descriptions = {
                highest: fallbackDescriptions?.highest ?? '',
                lowest: fallbackDescriptions?.lowest ?? '',
              };
            } else {
              if (
                (!subjectGrades.descriptions.highest || !String(subjectGrades.descriptions.highest).trim()) &&
                fallbackDescriptions?.highest
              ) {
                subjectGrades.descriptions.highest = fallbackDescriptions.highest;
              }
              if (
                (!subjectGrades.descriptions.lowest || !String(subjectGrades.descriptions.lowest).trim()) &&
                fallbackDescriptions?.lowest
              ) {
                subjectGrades.descriptions.lowest = fallbackDescriptions.lowest;
              }
            }

            subjectGrades.descriptions[descType] = value;
          })
        );
      },

      applyHistoryChanges: (subjectId, changes, direction, calcContext) => {
        set(
          produce((state: NilaiState) => {
            for (const change of changes) {
              if (!change?.studentId) continue;

              if (change.kind === 'cell') {
                const targetValue = direction === 'undo' ? change.prevValue : change.nextValue;
                const grade = getOrCreateDraftStudentGrade(state, change.studentId);
                grade.detailedGrades = grade.detailedGrades ?? {};
                grade.detailedGrades[subjectId] = grade.detailedGrades[subjectId] ?? {
                  slm: [],
                  sts: null,
                  sas: null,
                };
                const subjectGrades = grade.detailedGrades[subjectId];

                if (change.field === 'desc' && change.descType) {
                  if (direction === 'undo' && change.prevDescriptionsExisted === false) {
                    delete subjectGrades.descriptions;
                  } else {
                    if (!subjectGrades.descriptions || typeof subjectGrades.descriptions !== 'object') {
                      subjectGrades.descriptions = {
                        highest: '',
                        lowest: '',
                        ...(change.baselineOtherDescType
                          ? { [change.baselineOtherDescType]: change.baselineOtherDescValue ?? '' }
                          : {}),
                      };
                    }
                    subjectGrades.descriptions[change.descType] = targetValue ?? '';
                  }
                } else if (
                  change.field === 'tp' &&
                  change.slmId !== undefined &&
                  change.tpIndex !== undefined
                ) {
                  subjectGrades.slm = subjectGrades.slm ?? [];
                  let slmObj = subjectGrades.slm.find((s: any) => s.id === change.slmId);
                  if (!slmObj) {
                    slmObj = { id: change.slmId, name: change.slmName, scores: [] };
                    subjectGrades.slm.push(slmObj);
                  }
                  if (!Array.isArray(slmObj.scores)) {
                    slmObj.scores = [];
                  }
                  while (slmObj.scores.length <= change.tpIndex) {
                    slmObj.scores.push(null);
                  }
                  slmObj.scores[change.tpIndex] = targetValue ?? null;
                  recomputeStudentSubjectFinal(grade, subjectId, calcContext);
                } else {
                  subjectGrades[change.field] = targetValue ?? null;
                  recomputeStudentSubjectFinal(grade, subjectId, calcContext);
                }
              } else {
                const targetSnapshot = direction === 'undo' ? change.before : change.after;
                const clonedSnapshot = cloneDetailedGrade(targetSnapshot);
                const grade = state.gradesByStudentId[change.studentId] ??
                  state.grades.find((g) => g.studentId === change.studentId);

                if (clonedSnapshot === undefined || clonedSnapshot === null) {
                  if (grade) {
                    if (grade.detailedGrades) {
                      delete grade.detailedGrades[subjectId];
                    }
                    if (grade.finalGrades) {
                      grade.finalGrades[subjectId] = null;
                    }
                  }
                } else {
                  const targetGrade = grade ?? getOrCreateDraftStudentGrade(state, change.studentId);
                  targetGrade.detailedGrades = targetGrade.detailedGrades ?? {};
                  targetGrade.detailedGrades[subjectId] = clonedSnapshot;
                  recomputeStudentSubjectFinal(targetGrade, subjectId, calcContext);
                }
              }
            }
          })
        );
      },

      updateFinalGrades: (subjectId, calculateFn) => {
        set(
          produce((state: NilaiState) => {
            state.grades.forEach((grade) => {
              const finalVal = calculateFn(grade.studentId, grade.detailedGrades?.[subjectId]);

              if (grade.finalGrades?.[subjectId] !== finalVal) {
                grade.finalGrades = grade.finalGrades ?? {};
                grade.finalGrades[subjectId] = finalVal;
              }
            });
          })
        );
      },

      bulkUpdateGrades: (updates, settings, learningObjectives, predefinedCurriculum, subjects) => {
        set(
          produce((state: NilaiState) => {
            const calcContext: GradeCalcContext = {
              settings,
              learningObjectives,
              predefinedCurriculum,
              subjects,
            };

            for (const update of updates) {
              if (!update?.studentId) continue;

              const existing =
                state.gradesByStudentId[update.studentId] ??
                state.grades.find((g) => g.studentId === update.studentId);

              if (update.newDetailedGrade === undefined || update.newDetailedGrade === null) {
                if (existing) {
                  if (existing.detailedGrades) {
                    delete existing.detailedGrades[update.subjectId];
                  }
                  if (existing.finalGrades) {
                    existing.finalGrades[update.subjectId] = null;
                  }
                }
                continue;
              }

              const targetItem = existing ?? getOrCreateDraftStudentGrade(state, update.studentId);
              targetItem.detailedGrades = targetItem.detailedGrades ?? {};
              targetItem.detailedGrades[update.subjectId] = update.newDetailedGrade;
              recomputeStudentSubjectFinal(targetItem, update.subjectId, calcContext);
            }
          })
        );
      },

      bulkAddSlm: (subjectId, slm) => {
        set(
          produce((state: NilaiState) => {
            state.grades.forEach((g) => {
              g.detailedGrades = g.detailedGrades ?? {};
              g.detailedGrades[subjectId] = g.detailedGrades[subjectId] ?? {
                slm: [],
                sts: null,
                sas: null,
              };

              const d = g.detailedGrades[subjectId];
              d.slm = d.slm ?? [];

              if (!d.slm.some((s: any) => s.id === slm.id)) {
                d.slm.push({
                  ...slm,
                  scores: [...slm.scores],
                });
              }
            });
          })
        );
      },
    }),
    {
      name: 'appGrades',
      storage: createCustomPersistStorage<NilaiState>('grades'),
      partialize: (state) => ({ grades: state.grades }) as any,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.gradesByStudentId = buildGradesIndex(state.grades || []);
        }
      },
    }
  )
);
