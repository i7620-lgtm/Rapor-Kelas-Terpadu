import React from "react";
import { GradeSettingsModal } from "./GradeSettingsModal";
import { ManageSlmModal } from "./ManageSlmModal";
import { NilaiTableHeader } from "./NilaiTableHeader";
import { NilaiTableRow } from "./NilaiTableRow";
import { NilaiTableToolbar } from "./NilaiTableToolbar";
import { NilaiTableTooltip } from "./NilaiTableTooltip";
import { useNilaiTableViewLogic } from "./useNilaiTableViewLogic";

export interface NilaiTableViewProps {
  subject: any;
  students: any[];
  grades: any[];
  settings: any;
  learningObjectives: any;
  onUpdateLearningObjectives: (gradeKey: string, subjectKey: string, list: any[]) => void;
  onBulkUpdateGrades: (updates: any[]) => void;
  onUpdateGradeCalculation: (subjectId: string, config: any) => void;
  onUpdatePredikats: (predikats: any) => void;
  onUpdateSlmVisibility?: (subjectId: string, activeIds: string[]) => void;
  mode: "kualitatif" | "kuantitatif";
  showToast?: (message: string, type?: string) => void;
  onUpdateDisplayMode?: (mode: string) => void;
  predefinedCurriculum?: any;
  subjects?: any[];
}

const TableHeadContent = () => (
  <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" />
);

export const NilaiTableView: React.FC<NilaiTableViewProps> = (props) => {
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
    selectionBounds,
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
    headerRowSpan,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    handleUndo,
    handleRedo,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  } = logic;

  return (
    <div
      ref={tableContainerRef}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden relative"
    >
      {isManageSlmModalOpen && (
        <ManageSlmModal
          isOpen={isManageSlmModalOpen}
          onClose={() => setIsManageSlmModalOpen(false)}
          onSave={{ onSaveSlmSettings: handleSaveSlmSettings, settings }}
          subject={subject}
          students={students}
          grades={grades}
          learningObjectives={learningObjectives}
          onUpdateLearningObjectives={onUpdateLearningObjectives}
          onBulkUpdateGrades={onBulkUpdateGrades}
          allSlms={allSlms}
          initialActiveIds={activeSlmIds}
          showToast={showToast}
          gradeNumber={gradeNumber}
          predefinedCurriculum={predefinedCurriculum}
        />
      )}
      <GradeSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        subject={subject}
        settings={settings}
        onUpdatePredikats={props.onUpdatePredikats}
        onUpdateGradeCalculation={onUpdateGradeCalculation}
        onUpdateDisplayMode={onUpdateDisplayMode}
      />
      <NilaiTableTooltip
        visible={tooltip.visible}
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
      />
      <NilaiTableToolbar
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenManageSlm={() => setIsManageSlmModalOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        undoLabel={undoLabel}
        redoLabel={redoLabel}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto mapel-table-container nilai-table-container focus:outline-none"
      >
        {relevantStudents.length > 0 ? (
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
            <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 shadow-sm sticky top-0 z-30">
              <NilaiTableHeader
                headerRowSpan={headerRowSpan}
                getSelectionStyle={getSelectionStyle}
                handleMouseDownCell={handleMouseDownCell}
                handleMouseEnterCell={handleMouseEnterCell}
                slmHeaders={slmHeaders}
                tpHeaders={tpHeaders}
                isWeighting={isWeighting}
                settings={settings}
                weights={weights}
                handleWeightChange={handleWeightChange}
                handleAutoRegression={handleAutoRegression}
                handleAutoRegressionNonTP={handleAutoRegressionNonTP}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                slmTextRefs={slmTextRefs}
                isCapaianPinned={isCapaianPinned}
                handleToggleCapaianPinned={handleToggleCapaianPinned}
                handleBulkGenerateDescriptions={handleBulkGenerateDescriptions}
                gradeNumber={gradeNumber}
              />
            </thead>
            <tbody
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                const targetEl = e.target as HTMLElement;
                const td = targetEl.closest("td");
                if (!td || !td.id) return;
                const targetTagName = targetEl.tagName;
                if (
                  targetTagName === "INPUT" ||
                  targetTagName === "TEXTAREA" ||
                  targetTagName === "SELECT"
                )
                  return;

                const match = td.id.match(/^nilai-cell-(\d+)-(.+)$/);
                if (match) {
                  const rowIndex = parseInt(match[1], 10);
                  const colIdx = Number(match[2]);
                  if (!Number.isNaN(colIdx)) {
                    handleMouseDownCell(e, rowIndex, colIdx, "nilai-cell");
                  }
                }
              }}
              onMouseOver={(e) => {
                const td = (e.target as HTMLElement).closest("td");
                if (!td || !td.id) return;
                const match = td.id.match(/^nilai-cell-(\d+)-(.+)$/);
                if (match) {
                  const rowIndex = parseInt(match[1], 10);
                  const colIdx = Number(match[2]);
                  if (!Number.isNaN(colIdx)) {
                    handleMouseEnterCell(rowIndex, colIdx);
                  }
                }
              }}
            >
              {topSpacerHeight > 0 && (
                <tr key="__top-spacer__" aria-hidden={true} className="pointer-events-none">
                  <td
                    colSpan={tpHeaders.length + 6}
                    style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }}
                  />
                </tr>
              )}
              {relevantStudents.slice(startIndex, endIndex + 1).map((student, sliceIdx) => {
                const index = startIndex + sliceIdx;
                return (
                  <NilaiTableRow
                    key={student.id}
                    student={student}
                    index={index}
                    subject={subject}
                    objectivesForSubject={objectivesForSubject}
                    settings={settings}
                    activeSlmIds={activeSlmIds}
                    tpHeaders={tpHeaders}
                    selectionBounds={selectionBounds}
                    getSelectionStyle={getSelectionStyle}
                    handleMouseDownCell={handleMouseDownCell}
                    handleMouseEnterCell={handleMouseEnterCell}
                    handleSingleGradeChange={handleSingleGradeChange}
                    handleFocusCell={handleFocusCell}
                    handlePaste={handlePaste}
                    handleDescriptionChange={handleDescriptionChange}
                    isCapaianPinned={isCapaianPinned}
                    mode={mode}
                    onRowRef={measureRow}
                  />
                );
              })}
              {bottomSpacerHeight > 0 && (
                <tr key="__bottom-spacer__" aria-hidden={true} className="pointer-events-none">
                  <td
                    colSpan={tpHeaders.length + 6}
                    style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }}
                  />
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left text-slate-500 border-separate border-spacing-0">
            <TableHeadContent />
            <tbody>
              <tr>
                <td
                  colSpan={columnKeys.length + (isCapaianPinned ? 2 : 1) + 2}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Tidak ada data siswa
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
