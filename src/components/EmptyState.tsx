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
  icon = <Users className="w-16 h-16 text-zinc-300 mx-auto" />
}) => {
  return (
    <div className="bg-white border border-zinc-200/60 rounded-xl p-12 text-center max-w-2xl mx-auto my-12 shadow-sm">
      <div className="bg-zinc-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-800 mb-2">{title}</h3>
      <p className="text-zinc-500 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            {primaryActionLabel}
          </button>
        )}
        
        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
