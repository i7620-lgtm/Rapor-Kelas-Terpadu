import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";
import { TPSelectionModal } from "./TPSelectionModal";
import { SummativeTableHeader } from "./SummativeTableHeader";
import { SummativeTableRow } from "./SummativeTableRow";
import { useSummativeModalLogic } from "./useSummativeModalLogic";

export interface SummativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData?: any;
  type?: string;
  item?: any;
  subject: any;
  students: any[];
  grades: any[];
  settings: any;
  objectives?: any;
  learningObjectives?: any;
  onUpdateObjectives?: any;
  onBulkUpdateGrades?: any;
  onUpdateGradeCalculation?: any;
  gradeNumber?: number;
  onSave?: (data: any) => void;
  showToast?: (message: string, type?: string) => void;
  predefinedCurriculum?: any;
  [key: string]: any;
}

export const SummativeModal: React.FC<SummativeModalProps> = (props) => {
  const { isOpen, onClose, settings, subject } = props;
  const logic = useSummativeModalLogic(props);

  if (!isOpen) return null;
  const {
    isSLM,
    type,
    item,
    isWeighting,
    weights,
    qualitativeGradingMap,
    currentObjectives,
    slmName,
    setSlmName,
    localObjectives,
    isTpSelectionModalOpen,
    setIsTpSelectionModalOpen,
    localGrades,
    activeInput,
    relevantStudents,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleSave,
    handleLocalGradeChange,
    handleLocalDescriptionChange,
    handleBulkGenerateDescriptions,
    handlePaste,
    handleWeightChange,
    handleAddManualTp,
    handleUpdateTpText,
    handleDeleteTp,
    headerRowSpan,
    handleTpSelectionModalClose,
    predefinedCurriculum,
    availableTPsForSelection,
    gradeNumber,
  } = logic;

  return (
    <>
      <TPSelectionModal
        isOpen={isTpSelectionModalOpen}
        onClose={() => setIsTpSelectionModalOpen(false)}
        onApply={handleTpSelectionModalClose}
        subject={subject}
        availableTPs={availableTPsForSelection}
        isLoading={!predefinedCurriculum}
        currentGrade={gradeNumber}
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-6xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
          <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            {isSLM ? (
              <input
                type="text"
                value={slmName}
                onChange={(e) => setSlmName(e.target.value)}
                placeholder="Nama Lingkup Materi"
                className={`text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 border-b-2 outline-none flex-grow bg-transparent py-1 ${
                  slmName && slmName.trim() !== ""
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />
            ) : (
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                {type === "sts"
                  ? settings?.semester === "Genap"
                    ? "Input Nilai STS II"
                    : "Input Nilai STS I"
                  : type === "sas"
                    ? settings?.semester === "Genap"
                      ? gradeNumber === 6
                        ? "Input Nilai US"
                        : "Input Nilai SAS II"
                      : "Input Nilai SAS I"
                    : `Input Nilai ${type.toUpperCase()}`}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] lg:min-h-0 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              {isSLM && (
                <button
                  type="button"
                  onClick={handleAddManualTp}
                  className="px-3 py-2 min-h-[44px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  Ketik TP Manual
                </button>
              )}
              {isSLM && (
                <button
                  type="button"
                  onClick={() => setIsTpSelectionModalOpen(true)}
                  className="px-3 py-2 min-h-[44px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  Pilih TP dari Data
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 min-h-[44px] lg:min-h-0 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isSLM && (
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
                {localObjectives.map((tp: any, index: number) => (
                  <div key={tp.id} className="flex items-start gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 tabular-nums shrink-0">
                      {`TP ${index + 1}:`}
                    </span>
                    <AutoSizingTextarea
                      value={tp.text}
                      onChange={(e) => handleUpdateTpText(tp.id, e.target.value)}
                      placeholder="Deskripsi Tujuan Pembelajaran"
                      className={`flex-grow p-2 border rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none overflow-hidden ${
                        tp.text && tp.text.trim() !== ""
                          ? "border-green-500 ring-1 ring-green-500"
                          : "border-red-500 ring-1 ring-red-500"
                      }`}
                      rows={1}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTp(tp.id, index)}
                      aria-label={`Hapus TP ${index + 1}`}
                      className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 text-2xl leading-none flex-shrink-0 mt-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto nilai-table-container focus:outline-none">
              <table className="w-full text-sm text-left">
                <SummativeTableHeader
                  isSLM={isSLM}
                  isWeighting={isWeighting}
                  headerRowSpan={headerRowSpan}
                  getSelectionStyle={getSelectionStyle}
                  handleMouseDownCell={handleMouseDownCell}
                  handleMouseEnterCell={handleMouseEnterCell}
                  localObjectives={localObjectives}
                  type={type}
                  weights={weights}
                  item={item}
                  handleWeightChange={handleWeightChange}
                  handleBulkGenerateDescriptions={handleBulkGenerateDescriptions}
                />
                <tbody>
                  {relevantStudents.map((student: any, index: number) => {
                    const studentGrade = localGrades[student.id] || {};
                    return (
                      <SummativeTableRow
                        key={student.id}
                        student={student}
                        index={index}
                        studentGrade={studentGrade}
                        currentObjectives={currentObjectives}
                        settings={settings}
                        subject={subject}
                        isSLM={isSLM}
                        item={item}
                        type={type}
                        qualitativeGradingMap={qualitativeGradingMap}
                        activeInput={activeInput}
                        getSelectionStyle={getSelectionStyle}
                        handleMouseDownCell={handleMouseDownCell}
                        handleMouseEnterCell={handleMouseEnterCell}
                        handleFocusCell={handleFocusCell}
                        handlePaste={handlePaste}
                        handleLocalGradeChange={handleLocalGradeChange}
                        handleLocalDescriptionChange={handleLocalDescriptionChange}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
