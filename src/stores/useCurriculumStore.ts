import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface CurriculumState {
  learningObjectives: any;
  predefinedCurriculum: any;
  activeGradeNumber: number;
  gradeCache: Record<number, any>;
  isLoadingPredefined: boolean;
  isLoaded: boolean;

  initLearningObjectives: (data: any) => void;
  setLearningObjectives: (
    dataAction: any | ((prev: any) => any)
  ) => void;
  setPredefinedCurriculum: (options: any) => void;
  loadPredefinedCurriculum: (grade: number) => Promise<any>;
}

export const useCurriculumStore = create<CurriculumState>()(
  persist(
    (set, get) => ({
      learningObjectives: {},
      predefinedCurriculum: null,
      activeGradeNumber: 5,
      gradeCache: {},
      isLoadingPredefined: false,
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

      loadPredefinedCurriculum: async (grade: number) => {
        const validGrade = Math.max(1, Math.min(12, grade || 5));
        const cache = get().gradeCache;
        if (cache[validGrade]) {
          set({
            predefinedCurriculum: cache[validGrade],
            activeGradeNumber: validGrade,
            isLoadingPredefined: false,
          });
          return cache[validGrade];
        }

        set({ isLoadingPredefined: true, activeGradeNumber: validGrade });
        try {
          const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
          const tpUrl = baseUrl.endsWith('/') ? `${baseUrl}tp${validGrade}.json` : `${baseUrl}/tp${validGrade}.json`;
          
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(tpUrl, { signal: controller.signal });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              set((state) => ({
                gradeCache: { ...state.gradeCache, [validGrade]: data },
                predefinedCurriculum: data,
                isLoadingPredefined: false,
              }));
              return data;
            }
          }
        } catch (err) {
          console.warn(`Failed loading tp${validGrade}.json:`, err);
        }

        // Resilient fallback so modal is NEVER stuck loading
        const fallbackData = get().predefinedCurriculum || {};
        set((state) => ({
          gradeCache: { ...state.gradeCache, [validGrade]: fallbackData },
          predefinedCurriculum: fallbackData,
          isLoadingPredefined: false,
        }));
        return fallbackData;
      },
    }),
    {
      name: 'appLearningObjectives',
      storage: createCustomPersistStorage<CurriculumState>('learningObjectives'),
      partialize: (state) => ({ learningObjectives: state.learningObjectives }) as any,
    }
  )
);
