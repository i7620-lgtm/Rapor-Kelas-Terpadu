import React, { useEffect, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSubject: any) => void;
  confirmationData: {
    analysis: {
      studentMap: Map<number, string>;
      [key: string]: any;
    };
    matchedSubject: any;
  } | null;
  allSubjects: any[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  confirmationData,
  allSubjects,
}) => {
  if (!confirmationData) return null;

  const { analysis, matchedSubject } = confirmationData;
  const [selectedSubject, setSelectedSubject] = useState(matchedSubject);

  useEffect(() => {
    setSelectedSubject(matchedSubject);
  }, [matchedSubject]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedSubject) {
      onConfirm(selectedSubject);
    }
  };

  const renderContent = () => {
    if (matchedSubject) {
      return (
        <>
          <p>File terdeteksi sebagai format untuk mata pelajaran:</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">{matchedSubject.fullName}</p>
          <p className="mt-4">
            Aplikasi akan mengisi data untuk{' '}
            <strong className="tabular-nums">{analysis.studentMap.size} siswa</strong> yang cocok:
          </p>
          <ul className="list-disc list-inside pl-4 text-slate-500 dark:text-slate-400 text-sm">
            <li>Nilai Rapor (Nilai Akhir)</li>
            <li>Penanda Ketercapaian (T/R) untuk deskripsi</li>
          </ul>
        </>
      );
    } else {
      return (
        <>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Deteksi Otomatis Gagal</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Aplikasi tidak dapat menentukan mata pelajaran secara otomatis.
            Silakan pilih mata pelajaran yang benar dari daftar di bawah ini.
          </p>
          <select
            value={selectedSubject?.id || ''}
            onChange={(e) => {
              const subjectId = e.target.value;
              const subjectObj = allSubjects.find((s) => s.id === subjectId);
              setSelectedSubject(subjectObj);
            }}
            className="mt-4 w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 max-h-[92dvh] flex flex-col overflow-hidden">
        <div className="p-5 sm:p-6 overflow-y-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60">
              <svg
                className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-slate-100">
                Konfirmasi Pengisian Data
              </h3>
              <div className="mt-2">
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">{renderContent()}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 px-5 sm:px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center items-center rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm px-4 py-2 min-h-[44px] lg:min-h-0 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedSubject}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 min-h-[44px] lg:min-h-0 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto disabled:bg-indigo-300 dark:disabled:bg-indigo-900 disabled:cursor-not-allowed"
          >
            Lanjutkan & Isi File
          </button>
        </div>
      </div>
    </div>
  );
};
