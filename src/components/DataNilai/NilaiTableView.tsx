import React from "react";
import { GradeSettingsModal } from "./GradeSettingsModal";
import { ManageSlmModal } from "./ManageSlmModal";
import { NilaiTableHeader } from "./NilaiTableHeader";
import { NilaiTableRow } from "./NilaiTableRow";
import { NilaiTableToolbar } from "./NilaiTableToolbar";
import { NilaiTableTooltip } from "./NilaiTableTooltip";
import { useNilaiTableViewLogic } from "./useNilaiTableViewLogic";

export const NilaiTableView = (props) => {
  const {
    subject,
    students,
    grades,
    settings,
    learningObjectives,
    onUpdateLearningObjectives,
    onBulkUpdateGrades,
    onUpdateGradeCalculation,
    mode,
    showToast,
    onUpdateDisplayMode,
    predefinedCurriculum,
  } = props;

  const logic = useNilaiTableViewLogic(props);
  
  const {
    isManageSlmModalOpen,
    setIsManageSlmModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    tooltip,
    isCapaianPinned,
    handleToggleCapaianPinned,
    tableContainerRef,
    gradeNumber,
    slmTextRefs,
    isWeighting,
    weights,
    objectivesForSubject,
    allSlms,
    activeSlmIds,
    relevantStudents,
    slmHeaders,
    tpHeaders,
    columnKeys,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleSaveSlmSettings,
    handleSingleGradeChange,
    handleDescriptionChange,
    handleBulkGenerateDescriptions,
    handleAutoRegression,
    handleAutoRegressionNonTP,
    handleWeightChange,
    handlePaste,
    showTooltip,
    hideTooltip,
    headerRowSpan
  } = logic;

  return React.createElement(
    "div",
    {
      ref: tableContainerRef,
      className:
        "bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden relative",
    },
    isManageSlmModalOpen &&
      React.createElement(ManageSlmModal, {
        isOpen: isManageSlmModalOpen,
        onClose: () => setIsManageSlmModalOpen(false),
        onSave: { onSaveSlmSettings: handleSaveSlmSettings, settings },
        subject,
        students,
        grades,
        learningObjectives,
        onUpdateLearningObjectives,
        onBulkUpdateGrades,
        allSlms,
        initialActiveIds: activeSlmIds,
        showToast,
        gradeNumber,
        predefinedCurriculum,
      }),
    React.createElement(GradeSettingsModal, {
      isOpen: isSettingsModalOpen,
      onClose: () => setIsSettingsModalOpen(false),
      subject: subject,
      settings: settings,
      onUpdatePredikats: props.onUpdatePredikats,
      onUpdateGradeCalculation: onUpdateGradeCalculation,
      onUpdateDisplayMode: onUpdateDisplayMode,
    }),
    React.createElement(NilaiTableTooltip, {
      visible: tooltip.visible,
      content: tooltip.content,
      x: tooltip.x,
      y: tooltip.y,
    }),
    React.createElement(NilaiTableToolbar, {
      onOpenSettings: () => setIsSettingsModalOpen(true),
      onOpenManageSlm: () => setIsManageSlmModalOpen(true),
    }),
    React.createElement(
      "div",
      { className: "flex-1 overflow-auto mapel-table-container focus:outline-none h-[70vh]" },
      relevantStudents.length > 0 ? (
          React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
            React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 shadow-sm sticky top-0 z-30" },
                React.createElement(NilaiTableHeader, {
                  headerRowSpan,
                  getSelectionStyle,
                  handleMouseDownCell,
                  handleMouseEnterCell,
                  slmHeaders,
                  tpHeaders,
                  isWeighting,
                  settings,
                  weights,
                  handleWeightChange,
                  handleAutoRegression,
                  handleAutoRegressionNonTP,
                  showTooltip,
                  hideTooltip,
                  slmTextRefs,
                  isCapaianPinned,
                  handleToggleCapaianPinned,
                  handleBulkGenerateDescriptions,
                  gradeNumber,
                })
            ),
            React.createElement('tbody', {
                onMouseDown: (e) => {
                  if (e.button !== 0) return;
                  const td = (e.target as HTMLElement).closest('td');
                  if (!td || !td.id) return;
                  const targetTagName = (e.target as HTMLElement).tagName;
                  if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT') return;
                  
                  const match = td.id.match(/^nilai-cell-(\d+)-(.+)$/);
                  if (match) {
                    const rowIndex = parseInt(match[1], 10);
                    const colIdxStr = match[2];
                    const colIdx = isNaN(Number(colIdxStr)) ? colIdxStr : Number(colIdxStr);
                    handleMouseDownCell(e, rowIndex, colIdx, "nilai-cell");
                  }
                },
                onMouseOver: (e) => {
                  const td = (e.target as HTMLElement).closest('td');
                  if (!td || !td.id) return;
                  const match = td.id.match(/^nilai-cell-(\d+)-(.+)$/);
                  if (match) {
                    const rowIndex = parseInt(match[1], 10);
                    const colIdxStr = match[2];
                    const colIdx = isNaN(Number(colIdxStr)) ? colIdxStr : Number(colIdxStr);
                    handleMouseEnterCell(rowIndex, colIdx);
                  }
                }
              },
                relevantStudents.map((student, index) => 
                    React.createElement(NilaiTableRow, {
                      key: student.id,
                      student,
                      index,
                      subject,
                      objectivesForSubject,
                      settings,
                      activeSlmIds,
                      tpHeaders,
                      getSelectionStyle,
                      handleMouseDownCell,
                      handleMouseEnterCell,
                      handleSingleGradeChange,
                      handleFocusCell,
                      handlePaste,
                      handleDescriptionChange,
                      isCapaianPinned,
                      mode,
                    })
                )
            )
          )
      ) : (
          React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
            React.createElement(TableHeadContent, null),
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { colSpan: columnKeys.length + (isCapaianPinned ? 2 : 1) + 2, className: "px-4 py-8 text-center text-slate-500" }, "Tidak ada data siswa")
                )
            )
          )
      )
    )
  );
};
// Helper to render just header for empty state
const TableHeadContent = () => { return React.createElement('thead', {className: 'text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30'}); }
