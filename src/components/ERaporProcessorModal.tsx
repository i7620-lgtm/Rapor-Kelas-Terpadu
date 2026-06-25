import React from 'react';
import { ConfirmationModal } from './ERapor/ConfirmationModal';
import { useERaporProcessor } from './ERapor/useERaporProcessor';

interface ERaporProcessorModalProps {
  onClose: () => void;
  students: any[];
  grades: any[];
  subjects: any[];
  settings: any;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  learningObjectives: any;
}

const ERaporProcessorModal: React.FC<ERaporProcessorModalProps> = ({
  onClose,
  students,
  grades,
  subjects,
  settings,
  showToast,
  learningObjectives,
}) => {
  const {
    file,
    fileName,
    isLoading,
    confirmationData,
    fileInputRef,
    handleFileChange,
    handleAreaClick,
    handleProcessFile,
    handleConfirmAndFill,
    handleClose,
    setConfirmationData,
  } = useERaporProcessor({
    students,
    grades,
    subjects,
    settings,
    learningObjectives,
    showToast,
    onClose,
  });

  return (
    <>
      {confirmationData && (
        <ConfirmationModal
          isOpen={!!confirmationData}
          onClose={() => setConfirmationData(null)}
          onConfirm={handleConfirmAndFill}
          confirmationData={confirmationData}
          allSubjects={subjects.filter((s) => s.active)}
        />
      )}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b">
            <h3 className="text-xl font-bold text-zinc-800">Isi Format E-Rapor</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Unggah format Excel e-Rapor kosong untuk diisi secara otomatis.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300/60 border-dashed rounded-lg cursor-pointer hover:bg-[#fafafa] transition-colors"
              onClick={handleAreaClick}
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-zinc-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-transparent rounded-lg font-medium text-zinc-900 hover:text-zinc-500 focus-within:outline-none"
                  >
                    <span>Unggah file</span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">atau seret dan lepas file di sini</p>
                </div>
                <p className="text-xs text-zinc-500">XLSX, XLS</p>
              </div>
            </div>
            {fileName && (
              <p className="text-sm font-medium text-zinc-700 text-center">
                File terpilih: {fileName}
              </p>
            )}
          </div>
          <div className="flex justify-end p-4 bg-[#fafafa] rounded-b-lg">
            <button
              onClick={handleClose}
              className="bg-white py-2 px-4 border border-zinc-300/60 rounded-lg text-sm font-medium text-zinc-700 hover:bg-[#fafafa]"
            >
              Batal
            </button>
            <button
              onClick={handleProcessFile}
              disabled={!file || isLoading}
              className="ml-3 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" />
              ) : (
                'Analisis & Lanjutkan'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ERaporProcessorModal;
