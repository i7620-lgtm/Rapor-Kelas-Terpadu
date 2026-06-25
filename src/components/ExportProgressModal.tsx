import React from 'react';
import { Loader2, FileDown } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  current: number;
  total: number;
  statusText?: string;
  title?: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  current,
  total,
  statusText = "Mempersiapkan dokumen...",
  title = "Sedang Mengunduh PDF"
}) => {
  if (!isOpen) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 p-8 max-w-md w-full text-center hover:shadow-2xl transition-all">
        {/* Animated Icon Container */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <FileDown className="w-8 h-8 animate-bounce" />
            </div>
            <div className="absolute -inset-1 rounded-full border border-indigo-100 animate-ping opacity-75"></div>
          </div>
        </div>

        {/* Title & Static Info */}
        <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-6">
          Sistem sedang mengubah tampilan rapor menjadi file PDF berkualitas tinggi. Mohon tunggu sejenak.
        </p>

        {/* Progress Card */}
        <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-150/80 mb-6">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 mb-2">
            <span>PROGRES</span>
            <span className="text-zinc-700 font-bold">{percentage}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden mb-3">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          {/* Detailed Indicator */}
          <div className="text-sm font-semibold text-zinc-800">
            {current} dari {total} halaman/siswa selesai
          </div>
        </div>

        {/* Instructive Helper message tailored for non-tech-savvy teachers */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-left text-xs mb-4">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
          <p className="leading-snug">
            <strong>Penting:</strong> Jangan menutup atau berpindah dari halaman ini agar proses pembuatan file tidak terputus.
          </p>
        </div>

        {/* Additional status message */}
        {statusText && (
          <div className="text-xs text-zinc-400 italic">
            Status: {statusText}
          </div>
        )}
      </div>
    </div>
  );
};
