import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";


import { TPSelectionModal } from "./TPSelectionModal";
import { SummativeTableHeader } from "./SummativeTableHeader";
import { SummativeTableRow } from "./SummativeTableRow";

import { useSummativeModalLogic } from './useSummativeModalLogic';
export const SummativeModal = (props) => {
  const { isOpen, onClose, _settings, subject, showToast } = props;
  
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
    availableTPsForSelection
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
    }),
    React.createElement(
      "div",
      {
        className:
          "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col",
        },
        React.createElement(
          "div",
          {
            className:
              "p-5 border-b flex-shrink-0 flex justify-between items-center",
          },
          isSLM
            ? React.createElement("input", {
                type: "text",
                value: slmName,
                onChange: (_e) => setSlmName(e.target.value),
                placeholder: "Nama Lingkup Materi",
                className: `text-xl font-bold text-slate-800 border-b-2 outline-none flex-grow bg-transparent ${slmName && slmName.trim() !== "" ? "border-green-500" : "border-red-500"}`,
              })
            : React.createElement(
                "h3",
                { className: "text-xl font-bold text-slate-800" },
                `Input Nilai ${type.toUpperCase()}`,
              ),
          React.createElement(
            "div",
            { className: "flex items-center gap-2" },
            React.createElement(
              "button",
              {
                onClick: onClose,
                className:
                  "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50",
              },
              "Batal",
            ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: handleAddManualTp,
                  className:
                    "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200",
                },
                "Ketik TP Manual",
              ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: () => setIsTpSelectionModalOpen(true),
                  className:
                    "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200",
                },
                "Pilih TP dari Data",
              ),
            React.createElement(
              "button",
              {
                onClick: handleSave,
                className:
                  "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700",
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
              { className: "p-4 border-b space-y-2" },
              localObjectives.map((tp, index) =>
                React.createElement(
                  "div",
                  { key: tp.id, className: "flex items-start gap-2" },
                  React.createElement(
                    "span",
                    { className: "font-bold text-sm text-slate-500 pt-2" },
                    `TP ${index + 1}:`,
                  ),
                  React.createElement(AutoSizingTextarea, {
                    value: tp.text,
                    onChange: (_e) => handleUpdateTpText(tp.id, e.target.value),
                    placeholder: "Deskripsi Tujuan Pembelajaran",
                    className: `flex-grow p-2 border rounded-md text-sm resize-none overflow-hidden ${tp.text && tp.text.trim() !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
                    rows: "1",
                  }),
                  React.createElement(
                    "button",
                    {
                      onClick: () => handleDeleteTp(tp.id, index),
                      className:
                        "text-red-500 hover:text-red-700 p-1 text-2xl leading-none flex-shrink-0 mt-1",
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
                    _settings,
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

