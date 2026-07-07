import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface AttendanceItem {
  studentId: string;
  semester: string;
  sakit?: number | null;
  izin?: number | null;
  alpa?: number | null;
  [key: string]: any;
}

interface AttendanceState {
  attendance: AttendanceItem[];
  isLoaded: boolean;

  // Actions
  initAttendance: (attendance: AttendanceItem[]) => void;
  setAttendance: (attendance: AttendanceItem[] | ((prev: AttendanceItem[]) => AttendanceItem[])) => void;
  updateAttendance: (
    studentId: string,
    field: string,
    value: any,
    semester: string
  ) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set) => ({
      attendance: [],
      isLoaded: false,

      initAttendance: (attendance) => {
        set({ attendance, isLoaded: true });
      },

      setAttendance: (attendanceAction) => {
        set((state) => {
          const next = typeof attendanceAction === 'function' ? attendanceAction(state.attendance) : attendanceAction;
          return { attendance: next };
        });
      },

      updateAttendance: (studentId, field, value, semester) => {
        set((state) => {
          const sem = semester || 'Ganjil';
          const cleanValue = (value === "" || value === null || value === undefined)
            ? null 
            : typeof value === 'string' ? parseInt(value, 10) : value;

          let found = false;
          const next = state.attendance.map((item) => {
            if (item.studentId === studentId && (item.semester || 'Ganjil') === sem) {
              found = true;
              return {
                ...item,
                [field]: (cleanValue === null || isNaN(cleanValue)) ? null : cleanValue
              };
            }
            return item;
          });

          if (!found) {
            next.push({
              studentId,
              semester: sem,
              sakit: null,
              izin: null,
              alpa: null,
              [field]: (cleanValue === null || isNaN(cleanValue)) ? null : cleanValue
            });
          }

          return { attendance: next };
        });
      }
    }),
    {
      name: 'appAttendance',
      storage: createCustomPersistStorage<AttendanceState>('attendance'),
      partialize: (state) => ({ attendance: state.attendance }) as any,
    }
  )
);
