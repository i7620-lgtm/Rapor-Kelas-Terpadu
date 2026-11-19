import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { initialSettings, defaultSubjects } from '../constants';
import { createCustomPersistStorage } from './customPersistStorage';
import { computeQualitativeGradingMap, isValidQualitativeGradingMap } from '../utils/nilaiHelpers';

const ensureQualitativeMapSynced = (settingsObj: any, prevPredikats?: any) => {
  if (!settingsObj || typeof settingsObj !== 'object') return settingsObj;
  const predikatsChanged = prevPredikats !== undefined && settingsObj.predikats !== prevPredikats;
  if (predikatsChanged || !isValidQualitativeGradingMap(settingsObj.qualitativeGradingMap)) {
    return {
      ...settingsObj,
      qualitativeGradingMap: computeQualitativeGradingMap(settingsObj.predikats),
    };
  }
  return settingsObj;
};

interface SettingsState {
  settings: any;
  subjects: any[];
  extracurriculars: any[];
  isLoaded: boolean;

  // Actions
  initSettingsData: (settings: any, subjects: any[], extracurriculars: any[]) => void;
  setSettings: (settings: any | ((prev: any) => any)) => void;
  setSubjects: (subjects: any[] | ((prev: any[]) => any[])) => void;
  setExtracurriculars: (extracurriculars: any[] | ((prev: any[]) => any[])) => void;
  updateSettingValue: (key: string, value: any) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: initialSettings,
      subjects: defaultSubjects,
      extracurriculars: [],
      isLoaded: false,

      initSettingsData: (settings, subjects, extracurriculars) => {
        set({
          settings: ensureQualitativeMapSynced(settings),
          subjects,
          extracurriculars,
          isLoaded: true,
        });
      },

      setSettings: (settingsAction) => {
        set((state) => {
          const rawSettings = typeof settingsAction === 'function' ? settingsAction(state.settings) : settingsAction;
          const newSettings = ensureQualitativeMapSynced(rawSettings, state.settings?.predikats);
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

            if (parts[0] === 'predikats' || !isValidQualitativeGradingMap(state.settings.qualitativeGradingMap)) {
              state.settings.qualitativeGradingMap = computeQualitativeGradingMap(state.settings.predikats);
            }
          } else {
            state.settings[key] = value;
            if (key === 'predikats' || !isValidQualitativeGradingMap(state.settings.qualitativeGradingMap)) {
              state.settings.qualitativeGradingMap = computeQualitativeGradingMap(state.settings.predikats);
            }
          }
        }));
      },
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
