import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface CocurricularState {
  cocurricularData: Record<string, any>;
  isLoaded: boolean;

  // Actions
  initCocurricularData: (data: Record<string, any>) => void;
  setCocurricularData: (dataAction: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  updateCocurricularData: (
    studentId: string,
    dimensionId: string,
    value: any,
    semester: string
  ) => void;
}

export const useCocurricularStore = create<CocurricularState>()(
  persist(
    (set) => ({
      cocurricularData: {},
      isLoaded: false,

      initCocurricularData: (data) => {
        set({ cocurricularData: data, isLoaded: true });
      },

      setCocurricularData: (dataAction) => {
        set((state) => {
          const next = typeof dataAction === 'function' ? dataAction(state.cocurricularData) : dataAction;
          return { cocurricularData: next };
        });
      },

      updateCocurricularData: (studentId, dimensionId, value, semester) => {
        set((state) => {
          const fieldName = semester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
          const updatedStudent = {
            ...state.cocurricularData[studentId],
            [fieldName]: {
              ...(state.cocurricularData[studentId]?.[fieldName] || {}),
              [dimensionId]: value,
            },
          };

          const next = {
            ...state.cocurricularData,
            [studentId]: updatedStudent,
          };

          return { cocurricularData: next };
        });
      },
    }),
    {
      name: 'appCocurricularData',
      storage: createCustomPersistStorage<CocurricularState>('cocurricularData'),
      partialize: (state) => ({ cocurricularData: state.cocurricularData }) as any,
    }
  )
);

