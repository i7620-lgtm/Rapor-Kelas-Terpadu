import React, { useState } from 'react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectExit: () => Promise<void> | void;
  onDownloadAndExit: () => Promise<boolean>;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onDirectExit,
  onDownloadAndExit,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDirectExit = async () => {
    setIsProcessing(true);
    try {
      await onDirectExit();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAndExit = async () => {
    setIsProcessing(true);
    try {
      await onDownloadAndExit();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="exit-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Keluar dari Aplikasi?
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Pastikan Anda telah mencadangkan (backup) data RKT ke file Excel agar seluruh data nilai, siswa, dan pengaturan tetap aman jika browser dibersihkan.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] lg:min-h-0 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleDirectExit}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] lg:min-h-0 text-sm font-semibold rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Langsung Keluar
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleDownloadAndExit}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] lg:min-h-0 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{isProcessing ? 'Mengunduh...' : 'Download & Keluar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
