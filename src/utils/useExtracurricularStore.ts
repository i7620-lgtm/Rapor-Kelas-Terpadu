import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface StudentExtracurricularItem {
  studentId: string;
  semester?: string;
  assignedActivities: (string | null)[];
  descriptions: Record<string, string>;
}

interface ExtracurricularState {
  studentExtracurriculars: StudentExtracurricularItem[];
  isLoaded: boolean;

  // Actions
  initStudentExtracurriculars: (data: StudentExtracurricularItem[]) => void;
  setStudentExtracurriculars: (
    dataAction:
      | StudentExtracurricularItem[]
      | ((prev: StudentExtracurricularItem[]) => StudentExtracurricularItem[])
  ) => void;
  updateStudentExtracurricular: (
    studentId: string,
    assignedActivities: (string | null)[],
    descriptions: Record<string, string>,
    semester?: string
  ) => void;
}

export const useExtracurricularStore = create<ExtracurricularState>()(
  persist(
    (set) => ({
      studentExtracurriculars: [],
      isLoaded: false,

      initStudentExtracurriculars: (data) => {
        set({ studentExtracurriculars: data, isLoaded: true });
      },

      setStudentExtracurriculars: (dataAction) => {
        set((state) => {
          const next =
            typeof dataAction === 'function'
              ? dataAction(state.studentExtracurriculars)
              : dataAction;
          return { studentExtracurriculars: next };
        });
      },

      updateStudentExtracurricular: (studentId, assignedActivities, descriptions) => {
        set((state) => {
          const updatedItem: StudentExtracurricularItem = {
            studentId,
            assignedActivities,
            descriptions,
          };

          const filtered = state.studentExtracurriculars.filter(
            (se) => se.studentId !== studentId
          );

          const next = [...filtered, updatedItem];
          return { studentExtracurriculars: next };
        });
      },
    }),
    {
      name: 'appStudentExtracurriculars',
      storage: createCustomPersistStorage<ExtracurricularState>('studentExtracurriculars'),
      partialize: (state) => ({ studentExtracurriculars: state.studentExtracurriculars }) as any,
    }
  )
);
