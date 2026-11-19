import React from 'react';
import { Users, FileSpreadsheet } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Belum ada data siswa",
  description = "Mulai kelola data dengan menambahkan siswa baru secara manual atau mengimpor data dari Excel.",
  primaryActionLabel = "Tambah Siswa",
  onPrimaryAction,
  secondaryActionLabel = "Import Excel",
  onSecondaryAction,
  icon = <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 text-center max-w-lg mx-auto my-6 shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="w-full sm:w-auto min-h-[44px] lg:min-h-0 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {primaryActionLabel}
          </button>
        )}
        
        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="w-full sm:w-auto min-h-[44px] lg:min-h-0 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
