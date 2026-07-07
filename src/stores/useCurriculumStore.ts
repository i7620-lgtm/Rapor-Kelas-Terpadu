import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface CurriculumState {
  learningObjectives: any;
  predefinedCurriculum: any;
  isLoaded: boolean;

  initLearningObjectives: (data: any) => void;
  setLearningObjectives: (
    dataAction: any | ((prev: any) => any)
  ) => void;
  setPredefinedCurriculum: (options: any) => void;
}

export const useCurriculumStore = create<CurriculumState>()(
  persist(
    (set) => ({
      learningObjectives: {},
      predefinedCurriculum: null,
      isLoaded: false,

      initLearningObjectives: (data) => {
        set({ learningObjectives: data, isLoaded: true });
      },

      setLearningObjectives: (dataAction) => {
        set((state) => {
          const next =
            typeof dataAction === 'function'
              ? dataAction(state.learningObjectives)
              : dataAction;
          return { learningObjectives: next };
        });
      },

      setPredefinedCurriculum: (options) => {
        set({ predefinedCurriculum: options });
      },
    }),
    {
      name: 'appLearningObjectives',
      storage: createCustomPersistStorage<CurriculumState>('learningObjectives'),
      partialize: (state) => ({ learningObjectives: state.learningObjectives }) as any,
    }
  )
);
