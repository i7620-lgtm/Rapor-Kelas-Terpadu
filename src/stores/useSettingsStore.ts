import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { initialSettings, defaultSubjects } from '../constants';
import { createCustomPersistStorage } from './customPersistStorage';

interface SettingsState {
  settings: any;
  subjects: any[];
  extracurriculars: any[];
  isLoaded: boolean;
  pendingSemester: any;
  showSemesterModal: boolean;

  // Actions
  initSettingsData: (settings: any, subjects: any[], extracurriculars: any[]) => void;
  setSettings: (settings: any | ((prev: any) => any)) => void;
  setSubjects: (subjects: any[] | ((prev: any[]) => any[])) => void;
  setExtracurriculars: (extracurriculars: any[] | ((prev: any[]) => any[])) => void;
  updateSettingValue: (key: string, value: any) => void;
  setPendingSemester: (val: any) => void;
  setShowSemesterModal: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: initialSettings,
      subjects: defaultSubjects,
      extracurriculars: [],
      isLoaded: false,
      pendingSemester: null,
      showSemesterModal: false,

      initSettingsData: (settings, subjects, extracurriculars) => {
        set({ settings, subjects, extracurriculars, isLoaded: true });
      },

      setSettings: (settingsAction) => {
        set((state) => {
          const newSettings = typeof settingsAction === 'function' ? settingsAction(state.settings) : settingsAction;
          return { settings: newSettings };
        });
      },

      setSubjects: (subjectsAction) => {
        set((state) => {
          const newSubjects = typeof subjectsAction === 'function' ? subjectsAction(state.subjects) : subjectsAction;
          return { subjects: newSubjects };
        });
      },

      setExtracurriculars: (extracurricularsAction) => {
        set((state) => {
          const newExtracurriculars = typeof extracurricularsAction === 'function' ? extracurricularsAction(state.extracurriculars) : extracurricularsAction;
          return { extracurriculars: newExtracurriculars };
        });
      },

      updateSettingValue: (key, value) => {
        set(produce((state: SettingsState) => {
          const parts = key.split('.');
          if (parts.length > 1) {
            let pointer = state.settings;
            for (let i = 0; i < parts.length - 1; i++) {
              pointer[parts[i]] = pointer[parts[i]] || {};
              pointer = pointer[parts[i]];
            }
            pointer[parts[parts.length - 1]] = value;

            // If updating predikats, also sync qualitativeGradingMap
            if (parts[0] === 'predikats') {
              const valA = parseInt(state.settings.predikats?.a || "90", 10);
              const valB = parseInt(state.settings.predikats?.b || "80", 10);
              const valC = parseInt(state.settings.predikats?.c || "70", 10);
              const valD = parseInt(state.settings.predikats?.d || "0", 10);

              state.settings.qualitativeGradingMap = {
                A: { min: valA, max: 100 },
                B: { min: valB, max: valA - 1 },
                C: { min: valC, max: valB - 1 },
                D: { min: valD, max: valC - 1 },
              };
            }
          } else {
            state.settings[key] = value;
          }
        }));
      },

      setPendingSemester: (val) => set({ pendingSemester: val }),
      setShowSemesterModal: (val) => set({ showSemesterModal: val }),
    }),
    {
      name: 'appSettingsCompound',
      storage: createCustomPersistStorage<SettingsState>('settings'),
      partialize: (state) => ({
        settings: state.settings,
        subjects: state.subjects,
        extracurriculars: state.extracurriculars,
      }) as any,
    }
  )
);
