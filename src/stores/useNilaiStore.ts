import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { calculateFinalGrade } from "../utils/gradeCalculations";
import { getGradeNumber } from "../utils/nilaiHelpers";
import { createCustomPersistStorage } from './customPersistStorage';

interface GradeItem {
  studentId: string;
  detailedGrades?: any;
  finalGrades?: any;
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
    tpIndex?: number
  ) => void;
  
  updateFinalGrades: (
    subjectId: string, 
    calculatetionFn: (studentId: string, detailedGrade: any) => number | null
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

      updateSingleGrade: (studentId, subjectId, value, type, slmId, tpIndex) => {
        set(produce((state: NilaiState) => {
          const gradeIndex = state.grades.findIndex((g) => g.studentId === studentId);
          if (gradeIndex === -1) return;

          const grade = state.grades[gradeIndex];
          grade.detailedGrades = grade.detailedGrades ?? {};
          grade.detailedGrades[subjectId] = grade.detailedGrades[subjectId] ?? { slm: [] };
          const subjectGrades = grade.detailedGrades[subjectId];

          if (type === "tp" && slmId !== undefined && tpIndex !== undefined) {
            subjectGrades.slm = subjectGrades.slm ?? [];
            let slmObj = subjectGrades.slm.find((s: any) => s.id === slmId);
            
            if (!slmObj) {
              slmObj = { id: slmId, scores: [] };
              subjectGrades.slm.push(slmObj);
            }
            
            slmObj.scores[tpIndex] = value;
          } else {
            subjectGrades[type] = value;
          }
          state.gradesByStudentId[studentId] = grade;
        }));
      },

      updateFinalGrades: (subjectId, calculateFn) => {
        set(produce((state: NilaiState) => {
          state.grades.forEach((grade) => {
            const finalVal = calculateFn(grade.studentId, grade.detailedGrades?.[subjectId]);
            
            if (grade.finalGrades?.[subjectId] !== finalVal) {
              grade.finalGrades = grade.finalGrades ?? {};
              grade.finalGrades[subjectId] = finalVal;
              if (grade.studentId) {
                state.gradesByStudentId[grade.studentId] = grade;
              }
            }
          });
        }));
      },

      bulkUpdateGrades: (updates, settings, learningObjectives, predefinedCurriculum, subjects) => {
        set(produce((state: NilaiState) => {
          const updateMap: Record<string, any> = {};
          updates.forEach((x) => {
            updateMap[x.studentId] = x;
          });

          state.grades.forEach((item) => {
            const update = updateMap[item.studentId];
            if (update) {
              item.detailedGrades = item.detailedGrades ?? {};
              item.detailedGrades[update.subjectId] = update.newDetailedGrade;
              
              const subject = subjects.find((s) => s.id === update.subjectId);
              const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "6"}`;
              const curriculumKey = subject ? subject.curriculumKey || subject.fullName : null;
              
              item.finalGrades = item.finalGrades ?? {};
              item.finalGrades[update.subjectId] = calculateFinalGrade(
                update.newDetailedGrade,
                settings.gradeCalculation[update.subjectId] || { method: "rata-rata" },
                settings,
                update.subjectId,
                learningObjectives,
                gradeKey,
                curriculumKey,
                predefinedCurriculum,
              );
              state.gradesByStudentId[item.studentId] = item;
              
              // remove from map so we only append remaining later
              delete updateMap[item.studentId];
            }
          });

          Object.values(updateMap).forEach((update: any) => {
            const subject = subjects.find((s) => s.id === update.subjectId);
            const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "6"}`;
            const curriculumKey = subject ? subject.curriculumKey || subject.fullName : null;
            
            const finalGradeVal = calculateFinalGrade(
              update.newDetailedGrade,
              settings.gradeCalculation[update.subjectId] || { method: "rata-rata" },
              settings,
              update.subjectId,
              learningObjectives,
              gradeKey,
              curriculumKey,
              predefinedCurriculum,
            );
            
            const newItem: GradeItem = {
              studentId: update.studentId,
              detailedGrades: {
                [update.subjectId]: update.newDetailedGrade,
              },
              finalGrades: {
                [update.subjectId]: finalGradeVal,
              },
            };
            state.grades.push(newItem);
            state.gradesByStudentId[update.studentId] = newItem;
          });
        }));
      },

      bulkAddSlm: (subjectId, slm) => {
        set(produce((state: NilaiState) => {
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
              if (g.studentId) {
                state.gradesByStudentId[g.studentId] = g;
              }
            }
          });
        }));
      }
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
