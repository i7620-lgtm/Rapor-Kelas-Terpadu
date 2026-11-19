import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface IncompleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  incompleteChecks: any[];
}

export const IncompleteDataModal: React.FC<IncompleteDataModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  incompleteChecks,
}) => {
  if (!isOpen) return null;

  const hasKkmWarning = incompleteChecks.some(check => 
    (check.message && check.message.includes('KKM')) || 
    (check.description && check.description.includes('KKM'))
  );

  const modalTitle = hasKkmWarning 
    ? "Perhatian: Data Belum Lengkap / Nilai di Bawah KKM" 
    : "Perhatian: Data Belum Lengkap";

  const modalDescription = hasKkmWarning
    ? "Terdapat data yang belum lengkap atau siswa dengan nilai di bawah KKM sebelum Anda melanjutkan proses pencetakan. Apakah Anda yakin ingin melanjutkan cetak?"
    : "Terdapat data yang belum lengkap sebelum Anda melanjutkan proses pencetakan. Apakah Anda yakin ingin melanjutkan cetak dengan data yang belum lengkap?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3.5 sm:p-4 overflow-y-auto">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3">
            {modalDescription}
          </p>

          <div className="space-y-3">
            {incompleteChecks.map((check, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{check.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-relaxed">{check.message || check.description}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    check.onActionClick();
                  }}
                  className="whitespace-nowrap inline-flex items-center justify-center rounded-lg text-xs font-semibold px-4 py-2 min-h-[44px] lg:min-h-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shrink-0"
                >
                  {check.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-auto">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] lg:min-h-0 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onClose();
              onContinue();
            }}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
          >
            Lanjutkan Cetak
          </button>
        </div>
      </div>
    </div>
  );
};
