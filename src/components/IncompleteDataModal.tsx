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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-800">{modalTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto">
          <p className="text-slate-600 mb-4">
            {modalDescription}
          </p>

          <div className="space-y-3">
            {incompleteChecks.map((check, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{check.title}</h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">{check.message || check.description}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    check.onActionClick();
                  }}
                  className="whitespace-nowrap inline-flex items-center justify-center rounded-lg text-xs font-semibold px-4 py-2 bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shrink-0"
                >
                  {check.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 mt-auto">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onClose();
              onContinue();
            }}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
          >
            Lanjutkan Cetak
          </button>
        </div>
      </div>
    </div>
  );
};
