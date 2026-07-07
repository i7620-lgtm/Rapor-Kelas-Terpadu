import { create } from "zustand";

interface ToastItem {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UiState {
  toast: ToastItem | null;
  isLoading: boolean;
  activeNilaiTab: string;
  isMobileMenuOpen: boolean;
  isERaporModalOpen: boolean;
  
  // Actions
  setToast: (toast: ToastItem | null) => void;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveNilaiTab: (activeNilaiTab: string) => void;
  setIsMobileMenuOpen: (isMobileMenuOpen: boolean) => void;
  setIsERaporModalOpen: (isERaporModalOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => {
  let toastTimer: any = null;

  return {
    toast: null,
    isLoading: true,
    activeNilaiTab: "keseluruhan",
    isMobileMenuOpen: false,
    isERaporModalOpen: false,

    setToast: (toast) => set({ toast }),

    showToast: (message, type = "info") => {
      if (toastTimer) {
        clearTimeout(toastTimer);
      }
      set({ toast: { message, type } });
      toastTimer = setTimeout(() => {
        set({ toast: null });
        toastTimer = null;
      }, 3000);
    },

    setIsLoading: (isLoading) => set({ isLoading }),
    setActiveNilaiTab: (activeNilaiTab) => set({ activeNilaiTab }),
    setIsMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    setIsERaporModalOpen: (isERaporModalOpen) => set({ isERaporModalOpen }),
  };
});
