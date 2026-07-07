import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCustomPersistStorage } from './customPersistStorage';

interface NotesState {
  notes: Record<string, string>;
  isLoaded: boolean;

  // Actions
  initNotes: (notes: Record<string, string>) => void;
  setNotes: (notesAction: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  updateNote: (studentId: string, note: string, semester: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},
      isLoaded: false,

      initNotes: (notes) => {
        set({ notes, isLoaded: true });
      },

      setNotes: (notesAction) => {
        set((state) => {
          const next = typeof notesAction === 'function' ? notesAction(state.notes) : notesAction;
          return { notes: next };
        });
      },

      updateNote: (studentId, note, semester) => {
        set((state) => {
          const noteKey = semester === 'Genap' ? studentId + '_Genap' : studentId;
          const next = {
            ...state.notes,
            [noteKey]: note,
          };
          return { notes: next };
        });
      },
    }),
    {
      name: 'appNotes',
      storage: createCustomPersistStorage<NotesState>('notes'),
      partialize: (state) => ({ notes: state.notes }) as any,
    }
  )
);
