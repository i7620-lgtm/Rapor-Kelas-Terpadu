import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface Student {
  id: string;
  namaLengkap: string;
  [key: string]: any;
}

interface StudentsState {
  students: Student[];
  isLoaded: boolean;

  // Actions
  initStudents: (students: Student[]) => void;
  setStudents: (students: Student[] | ((prev: Student[]) => Student[])) => void;
  addStudents: (newStudents: Student[]) => void;
  deleteStudent: (studentId: string) => void;
  updateStudent: (studentId: string, updatedFields: Partial<Student>) => void;
}

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set) => ({
      students: [],
      isLoaded: false,

      initStudents: (students) => {
        set({ students, isLoaded: true });
      },

      setStudents: (studentsAction) => {
        set((state) => {
          const next = typeof studentsAction === 'function' ? studentsAction(state.students) : studentsAction;
          return { students: next };
        });
      },

      addStudents: (newStudents) => {
        set((state) => {
          const next = [...state.students, ...newStudents];
          return { students: next };
        });
      },

      deleteStudent: (studentId) => {
        set((state) => {
          const next = state.students.filter(s => s.id !== studentId);
          return { students: next };
        });
      },

      updateStudent: (studentId, updatedFields) => {
        set((state) => {
          const next = state.students.map(s => {
            if (s.id === studentId) {
              return { ...s, ...updatedFields };
            }
            return s;
          });
          return { students: next };
        });
      },
    }),
    {
      name: 'appStudents',
      storage: createCustomPersistStorage<StudentsState>('students'),
      partialize: (state) => ({ students: state.students }) as any,
    }
  )
);
