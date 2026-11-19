import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';
import { deleteStudentPhotoFromDB } from '../utils/imageDB';

interface Student {
  id: string;
  namaLengkap: string;
  [key: string]: any;
}

interface StudentsState {
  students: Student[];
  isLoaded: boolean;
  // Transient runtime-only blob: URLs backed by RKT_ImagesDB (excluded from persistence)
  studentPhotoUrls: Record<string, string>;

  // Actions
  initStudents: (students: Student[]) => void;
  setStudents: (students: Student[] | ((prev: Student[]) => Student[])) => void;
  addStudents: (newStudents: Student[]) => void;
  deleteStudent: (studentId: string) => void;
  updateStudent: (studentId: string, updatedFields: Partial<Student>) => void;
  setStudentPhotoUrl: (studentId: string, url: string) => void;
  removeStudentPhotoUrl: (studentId: string) => void;
  setAllStudentPhotoUrls: (urls: Record<string, string>) => void;
}

const revokeIfBlobUrl = (url: unknown) => {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore invalid or already revoked URLs
    }
  }
};

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set) => ({
      students: [],
      isLoaded: false,
      studentPhotoUrls: {},

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
        void deleteStudentPhotoFromDB(studentId);
        set((state) => {
          const next = state.students.filter((s) => s.id !== studentId);
          const oldUrl = state.studentPhotoUrls[studentId];
          if (oldUrl) {
            revokeIfBlobUrl(oldUrl);
            const nextPhotoUrls = { ...state.studentPhotoUrls };
            delete nextPhotoUrls[studentId];
            return { students: next, studentPhotoUrls: nextPhotoUrls };
          }
          return { students: next };
        });
      },

      updateStudent: (studentId, updatedFields) => {
        set((state) => {
          const next = state.students.map((s) => {
            if (s.id === studentId) {
              return { ...s, ...updatedFields };
            }
            return s;
          });
          return { students: next };
        });
      },

      setStudentPhotoUrl: (studentId, url) => {
        set((state) => {
          const prevUrl = state.studentPhotoUrls[studentId];
          if (prevUrl && prevUrl !== url) {
            revokeIfBlobUrl(prevUrl);
          }
          return {
            studentPhotoUrls: {
              ...state.studentPhotoUrls,
              [studentId]: url,
            },
          };
        });
      },

      removeStudentPhotoUrl: (studentId) => {
        set((state) => {
          const prevUrl = state.studentPhotoUrls[studentId];
          if (!prevUrl) return state;
          revokeIfBlobUrl(prevUrl);
          const nextPhotoUrls = { ...state.studentPhotoUrls };
          delete nextPhotoUrls[studentId];
          return { studentPhotoUrls: nextPhotoUrls };
        });
      },

      setAllStudentPhotoUrls: (urls) => {
        set((state) => {
          const newValues = new Set(Object.values(urls));
          Object.values(state.studentPhotoUrls).forEach((oldUrl) => {
            if (!newValues.has(oldUrl)) {
              revokeIfBlobUrl(oldUrl);
            }
          });
          return { studentPhotoUrls: { ...urls } };
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

