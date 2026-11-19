import React from "react";
import { HighlightControls } from "./HighlightControls";
import { KeseluruhanTableHeader } from "./KeseluruhanTableHeader";
import { KeseluruhanTableRow } from "./KeseluruhanTableRow";
import { useNilaiKeseluruhanLogic } from "./useNilaiKeseluruhanLogic";

export interface NilaiKeseluruhanViewProps {
  students: any[];
  grades: any[];
  subjects: any[];
  predikats?: any;
  settings: any;
  showToast?: (message: string, type?: string) => void;
}

export const NilaiKeseluruhanView: React.FC<NilaiKeseluruhanViewProps> = ({
  students,
  grades,
  subjects,
  predikats: propPredikats,
  settings,
  showToast,
}) => {
  const {
    predikats,
    sortBy,
    setSortBy,
    showIncompleteHighlight,
    setShowIncompleteHighlight,
    showBelowKkmHighlight,
    setShowBelowKkmHighlight,
    showMaxHighlight,
    setShowMaxHighlight,
    showMinHighlight,
    setShowMinHighlight,
    displaySubjects,
    processedData,
    subjectStats,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  } = useNilaiKeseluruhanLogic({
    students,
    grades,
    subjects,
    predikats: propPredikats,
    settings,
    showToast,
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden">
      <HighlightControls
        showIncompleteHighlight={showIncompleteHighlight}
        setShowIncompleteHighlight={setShowIncompleteHighlight}
        showBelowKkmHighlight={showBelowKkmHighlight}
        setShowBelowKkmHighlight={setShowBelowKkmHighlight}
        showMaxHighlight={showMaxHighlight}
        setShowMaxHighlight={setShowMaxHighlight}
        showMinHighlight={showMinHighlight}
        setShowMinHighlight={setShowMinHighlight}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto keseluruhan-table-container outline-none focus:outline-none"
        tabIndex={0}
      >
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
          <KeseluruhanTableHeader sortBy={sortBy} displaySubjects={displaySubjects} />
          <tbody>
            {topSpacerHeight > 0 && (
              <tr key="__top-spacer__" aria-hidden={true} className="pointer-events-none">
                <td
                  colSpan={4 + displaySubjects.length}
                  style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }}
                />
              </tr>
            )}
            {processedData.slice(startIndex, endIndex + 1).map((data, sliceIdx) => {
              const rowIndex = startIndex + sliceIdx;
              return (
                <KeseluruhanTableRow
                  key={data.id}
                  data={data}
                  rowIndex={rowIndex}
                  predikats={predikats}
                  sortBy={sortBy}
                  displaySubjects={displaySubjects}
                  getSelectionStyle={getSelectionStyle}
                  handleMouseDownCell={handleMouseDownCell}
                  handleMouseEnterCell={handleMouseEnterCell}
                  handleFocusCell={handleFocusCell}
                  subjectStats={subjectStats}
                  showIncompleteHighlight={showIncompleteHighlight}
                  showBelowKkmHighlight={showBelowKkmHighlight}
                  showMaxHighlight={showMaxHighlight}
                  showMinHighlight={showMinHighlight}
                  onRowRef={measureRow}
                />
              );
            })}
            {bottomSpacerHeight > 0 && (
              <tr key="__bottom-spacer__" aria-hidden={true} className="pointer-events-none">
                <td
                  colSpan={4 + displaySubjects.length}
                  style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
