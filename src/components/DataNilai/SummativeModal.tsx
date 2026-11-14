import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";


import { TPSelectionModal } from "./TPSelectionModal";
import { SummativeTableHeader } from "./SummativeTableHeader";
import { SummativeTableRow } from "./SummativeTableRow";

import { useSummativeModalLogic } from './useSummativeModalLogic';
export const SummativeModal = (props) => {
  const { isOpen, onClose, settings, subject, showToast: _showToast } = props;
  
  if (!isOpen) return null;

  const logic = useSummativeModalLogic(props);
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
    gradeNumber
  } = logic;

return React.createElement(
    React.Fragment,
    null,
    React.createElement(TPSelectionModal, {
      isOpen: isTpSelectionModalOpen,
      onClose: () => setIsTpSelectionModalOpen(false),
      onApply: handleTpSelectionModalClose,
      subject: subject,
      availableTPs: availableTPsForSelection,
      isLoading: !predefinedCurriculum,
      currentGrade: gradeNumber,
    }),
    React.createElement(
      "div",
      {
        className:
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-6xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800",
        },
        React.createElement(
          "div",
          {
            className:
              "p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3",
          },
          isSLM
            ? React.createElement("input", {
                type: "text",
                value: slmName,
                onChange: (e) => setSlmName(e.target.value),
                placeholder: "Nama Lingkup Materi",
                className: `text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 border-b-2 outline-none flex-grow bg-transparent py-1 ${slmName && slmName.trim() !== "" ? "border-green-500" : "border-red-500"}`,
              })
            : React.createElement(
                "h3",
                { className: "text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100" },
                `Input Nilai ${type.toUpperCase()}`,
              ),
          React.createElement(
            "div",
            { className: "flex flex-wrap items-center gap-2" },
            React.createElement(
              "button",
              {
                onClick: onClose,
                className:
                  "px-4 py-2 min-h-[44px] lg:min-h-0 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
              },
              "Batal",
            ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: handleAddManualTp,
                  className:
                    "px-3 py-2 min-h-[44px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors",
                },
                "Ketik TP Manual",
              ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: () => setIsTpSelectionModalOpen(true),
                  className:
                    "px-3 py-2 min-h-[44px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors",
                },
                "Pilih TP dari Data",
              ),
            React.createElement(
              "button",
              {
                onClick: handleSave,
                className:
                  "px-4 py-2 min-h-[44px] lg:min-h-0 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors",
              },
              "Simpan & Tutup",
            ),
          ),
        ),

        React.createElement(
          "div",
          { className: "flex-1 overflow-auto" },
          isSLM &&
            React.createElement(
              "div",
              { className: "p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-2" },
              localObjectives.map((tp, index) =>
                React.createElement(
                  "div",
                  { key: tp.id, className: "flex items-start gap-2" },
                  React.createElement(
                    "span",
                    { className: "font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 tabular-nums shrink-0" },
                    `TP ${index + 1}:`,
                  ),
                  React.createElement(AutoSizingTextarea, {
                    value: tp.text,
                    onChange: (e) => handleUpdateTpText(tp.id, e.target.value),
                    placeholder: "Deskripsi Tujuan Pembelajaran",
                    className: `flex-grow p-2 border rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none overflow-hidden ${tp.text && tp.text.trim() !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
                    rows: "1",
                  }),
                  React.createElement(
                    "button",
                    {
                      onClick: () => handleDeleteTp(tp.id, index),
                      "aria-label": `Hapus TP ${index + 1}`,
                      className:
                        "text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 text-2xl leading-none flex-shrink-0 mt-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30",
                    },
                    "×",
                  ),
                ),
              ),
            ),

          React.createElement(
            "div",
            { className: "overflow-x-auto nilai-table-container focus:outline-none" },
            React.createElement(
              "table",
              { className: "w-full text-sm text-left" },
              React.createElement(SummativeTableHeader, {
                isSLM,
                isWeighting,
                headerRowSpan,
                getSelectionStyle,
                handleMouseDownCell,
                handleMouseEnterCell,
                localObjectives,
                type,
                weights,
                item,
                handleWeightChange,
                handleBulkGenerateDescriptions,
              }),
              React.createElement(
                "tbody",
                null,
                relevantStudents.map((student, index) => {
                  const studentGrade = localGrades[student.id] || {};
                  return React.createElement(SummativeTableRow, {
                    key: student.id,
                    student,
                    index,
                    studentGrade,
                    currentObjectives,
                    settings,
                    subject,
                    isSLM,
                    item,
                    type,
                    qualitativeGradingMap,
                    activeInput,
                    getSelectionStyle,
                    handleMouseDownCell,
                    handleMouseEnterCell,
                    handleFocusCell,
                    handlePaste,
                    handleLocalGradeChange,
                    handleLocalDescriptionChange,
                  });
                })
              )
            )
          ),
        ),
      ),
    ),
  );
};

