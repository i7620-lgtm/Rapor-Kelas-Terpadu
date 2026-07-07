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
          <p className="font-bold text-zinc-800">{matchedSubject.fullName}</p>
          <p className="mt-4">
            Aplikasi akan mengisi data untuk{' '}
            <strong>{analysis.studentMap.size} siswa</strong> yang cocok:
          </p>
          <ul className="list-disc list-inside pl-4 text-zinc-500 text-sm">
            <li>Nilai Rapor (Nilai Akhir)</li>
            <li>Penanda Ketercapaian (T/R) untuk deskripsi</li>
          </ul>
        </>
      );
    } else {
      return (
        <>
          <p className="font-semibold text-amber-800">Deteksi Otomatis Gagal</p>
          <p className="mt-2 text-zinc-600">
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
            className="mt-4 w-full p-2 border border-zinc-300/60 rounded-lg focus:ring-zinc-900 focus:border-zinc-900"
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="h-6 w-6 text-indigo-600"
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
              <h3 className="text-lg leading-6 font-bold text-zinc-900">
                Konfirmasi Pengisian Data
              </h3>
              <div className="mt-2">
                <div className="text-sm text-zinc-600 space-y-2">{renderContent()}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#fafafa] px-6 py-3 flex flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedSubject}
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Lanjutkan & Isi File
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-zinc-300/60 shadow-sm px-4 py-2 bg-white text-base font-medium text-zinc-700 hover:bg-[#fafafa] sm:mt-0 sm:w-auto sm:text-sm"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
