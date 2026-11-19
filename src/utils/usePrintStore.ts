import { create } from 'zustand';

interface PrintPages {
  cover: boolean;
  schoolIdentity: boolean;
  studentIdentity: boolean;
  academic: boolean;
}

interface PrintOptions {
  showPrincipalSignature: boolean;
  showTeacherSignature: boolean;
}

interface PrintState {
  paperSize: string;
  selectedStudentId: string;
  rankingOption: string;
  selectedPages: PrintPages;
  hideGradesForFaseA: boolean;
  printOptions: PrintOptions;
  isPrinting: boolean;

  // Actions
  setPaperSize: (size: string) => void;
  setSelectedStudentId: (id: string) => void;
  setRankingOption: (option: string) => void;
  setSelectedPages: (pages: Partial<PrintPages> | ((prev: PrintPages) => PrintPages)) => void;
  setHideGradesForFaseA: (hide: boolean) => void;
  setPrintOptions: (options: Partial<PrintOptions> | ((prev: PrintOptions) => PrintOptions)) => void;
  setIsPrinting: (isPrinting: boolean) => void;
}

export const usePrintStore = create<PrintState>((set) => ({
  paperSize: 'A4',
  selectedStudentId: 'all',
  rankingOption: 'none',
  selectedPages: {
    cover: true,
    schoolIdentity: true,
    studentIdentity: true,
    academic: true,
  },
  hideGradesForFaseA: true,
  printOptions: {
    showPrincipalSignature: true,
    showTeacherSignature: true,
  },
  isPrinting: false,

  setPaperSize: (paperSize) => set({ paperSize }),
  setSelectedStudentId: (selectedStudentId) => set({ selectedStudentId }),
  setRankingOption: (rankingOption) => set({ rankingOption }),
  setSelectedPages: (pagesUpdate) => set((state) => {
    const updated = typeof pagesUpdate === 'function' ? pagesUpdate(state.selectedPages) : { ...state.selectedPages, ...pagesUpdate };
    return { selectedPages: updated };
  }),
  setHideGradesForFaseA: (hideGradesForFaseA) => set({ hideGradesForFaseA }),
  setPrintOptions: (optionsUpdate) => set((state) => {
    const updated = typeof optionsUpdate === 'function' ? optionsUpdate(state.printOptions) : { ...state.printOptions, ...optionsUpdate };
    return { printOptions: updated };
  }),
  setIsPrinting: (isPrinting) => set({ isPrinting }),
}));
