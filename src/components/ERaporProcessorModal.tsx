import React from 'react';
import { ConfirmationModal } from './ERapor/ConfirmationModal';
import { useERaporProcessor } from './ERapor/useERaporProcessor';
import { useStudentsStore } from '../stores/useStudentsStore';
import { useNilaiStore } from '../stores/useNilaiStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useCurriculumStore } from '../stores/useCurriculumStore';

interface ERaporProcessorModalProps {
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  students?: any[];
  grades?: any[];
  subjects?: any[];
  settings?: any;
  learningObjectives?: any;
}

const ERaporProcessorModal: React.FC<ERaporProcessorModalProps> = ({
  onClose,
  students: propStudents,
  grades: propGrades,
  subjects: propSubjects,
  settings: propSettings,
  showToast,
  learningObjectives: propLearningObjectives,
}) => {
  const storeStudents = useStudentsStore((s) => s.students);
  const storeGrades = useNilaiStore((s) => s.grades);
  const storeSubjects = useSettingsStore((s) => s.subjects);
  const storeSettings = useSettingsStore((s) => s.settings);
  const storeLearningObjectives = useCurriculumStore((s) => s.learningObjectives);

  const students = propStudents ?? storeStudents;
  const grades = propGrades ?? storeGrades;
  const subjects = propSubjects ?? storeSubjects;
  const settings = propSettings ?? storeSettings;
  const learningObjectives = propLearningObjectives ?? storeLearningObjectives;

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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 max-h-[92dvh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Isi Format E-Rapor</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Unggah format Excel e-Rapor kosong untuk diisi secara otomatis.
            </p>
          </div>
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
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
                <div className="flex flex-wrap justify-center text-sm text-slate-600 dark:text-slate-300">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-transparent rounded-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">XLSX, XLS</p>
              </div>
            </div>
            {fileName && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
                File terpilih: {fileName}
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl">
            <button
              onClick={handleClose}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 py-2 px-4 min-h-[44px] lg:min-h-0 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleProcessFile}
              disabled={!file || isLoading}
              className="w-full sm:w-auto py-2 px-4 min-h-[44px] lg:min-h-0 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900"
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
