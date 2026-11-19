import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface FormativeNote {
  id: string;
  date: string;
  description: string;
  semester?: string;
  [key: string]: any;
}

interface FormativeState {
  formativeJournal: Record<string, FormativeNote[]>;
  isLoaded: boolean;

  initFormativeJournal: (data: Record<string, FormativeNote[]>) => void;
  setFormativeJournal: (
    dataAction:
      | Record<string, FormativeNote[]>
      | ((prev: Record<string, FormativeNote[]>) => Record<string, FormativeNote[]>)
  ) => void;
}

export const useFormativeStore = create<FormativeState>()(
  persist(
    (set) => ({
      formativeJournal: {},
      isLoaded: false,

      initFormativeJournal: (data) => {
        set({ formativeJournal: data, isLoaded: true });
      },

      setFormativeJournal: (dataAction) => {
        set((state) => {
          const next =
            typeof dataAction === 'function'
              ? dataAction(state.formativeJournal)
              : dataAction;
          return { formativeJournal: next };
        });
      },
    }),
    {
      name: 'appFormativeJournal',
      storage: createCustomPersistStorage<FormativeState>('formativeJournal'),
      partialize: (state) => ({ formativeJournal: state.formativeJournal }) as any,
    }
  )
);
