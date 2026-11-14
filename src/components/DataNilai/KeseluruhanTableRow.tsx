import React from "react";

export const KeseluruhanTableRow = React.memo(({
  data,
  rowIndex,
  predikats,
  sortBy,
  displaySubjects,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleFocusCell,
  subjectStats,
  showIncompleteHighlight,
  showBelowKkmHighlight,
  showMaxHighlight,
  showMinHighlight,
}) => {
  const predicateCValue = parseInt(predikats?.c, 10);
  const isStudentMissing = data.hasMissingGrade && showIncompleteHighlight;
  const isStudentFailing = data.hasFailingGrade && showBelowKkmHighlight;
  const studentHighlightClass = isStudentMissing
    ? "bg-amber-100 text-amber-900 font-bold dark:bg-amber-900/40 dark:text-amber-200"
    : isStudentFailing
      ? "bg-rose-100 text-red-700 font-bold dark:bg-rose-900/40 dark:text-red-200"
      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70";

  return React.createElement(
    "tr",
    { key: data.id, id: data.id, className: "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 focus-within:bg-slate-50 dark:focus-within:bg-slate-800/70 group" },
    React.createElement(
      "td",
      {
        id: `keseluruhan-cell-${rowIndex}-0`,
        tabIndex: -1,
        className:
          `w-[42px] min-w-[42px] max-w-[42px] sm:w-[60px] sm:min-w-[60px] sm:max-w-[60px] p-1.5 sm:p-2 text-center font-medium tabular-nums sticky z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none border-b border-r border-slate-200 dark:border-slate-700 box-border cursor-default select-none ${studentHighlightClass}`,
        style: {
          left: 0,
          ...getSelectionStyle(rowIndex, 0).selectionStyle,
        },
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          handleMouseDownCell(e, rowIndex, 0, "keseluruhan-cell");
        },
        onMouseEnter: () => handleMouseEnterCell(rowIndex, 0),
        onFocus: () => handleFocusCell(rowIndex, 0),
      },
      sortBy === "rank" ? data.rank : data.no,
    ),
    React.createElement(
      "th",
      {
        id: `keseluruhan-cell-${rowIndex}-1`,
        tabIndex: -1,
        className: `p-1.5 sm:p-2 font-medium w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal border-b border-r border-slate-200 dark:border-slate-700 static lg:sticky lg:left-[60px] lg:z-20 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] box-border ${studentHighlightClass} cursor-default select-none`,
        style: {
          ...getSelectionStyle(rowIndex, 1).selectionStyle,
        },
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          handleMouseDownCell(e, rowIndex, 1, "keseluruhan-cell");
        },
        onMouseEnter: () => handleMouseEnterCell(rowIndex, 1),
        onFocus: () => handleFocusCell(rowIndex, 1),
      },
      data.namaLengkap,
    ),
    ...displaySubjects.map((subject, colSubjIdx) => {
      const colIndex = 2 + colSubjIdx;
      const { selectionStyle } = getSelectionStyle(rowIndex, colIndex);
      const grade = data.grades[subject.id];
      const isBelowC =
        !isNaN(predicateCValue) &&
        typeof grade === "number" &&
        grade < predicateCValue;

      const stats = subjectStats[subject.id];
      let highlightClass = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200";
      if (grade === undefined || grade === null || grade === "") {
        if (showIncompleteHighlight) {
          highlightClass = "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-600 dark:text-red-200 font-extrabold shadow-inner ring-1 ring-red-400";
        }
      } else if (isBelowC && showBelowKkmHighlight) {
        highlightClass = "bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 font-extrabold shadow-inner ring-1 ring-rose-400";
      } else if (
        stats &&
        stats.hasMultipleValues &&
        grade !== undefined &&
        grade !== null &&
        grade !== ""
      ) {
        const numGrade =
          typeof grade === "string" ? parseFloat(grade) : grade;
        if (!isNaN(numGrade)) {
          if (numGrade === stats.maxVal && showMaxHighlight) {
            highlightClass = "highlight-highest shadow-inner font-extrabold";
          } else if (numGrade === stats.minVal && showMinHighlight) {
            highlightClass = "highlight-lowest shadow-inner font-extrabold";
          }
        }
      }

      return React.createElement(
        "td",
        {
          key: subject.id,
          id: `keseluruhan-cell-${rowIndex}-${colIndex}`,
          tabIndex: -1,
          className:
            "px-1.5 sm:px-2 py-1 border-b border-slate-200 dark:border-slate-700 text-center cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70",
          style: selectionStyle,
          onMouseDown: (e) => {
            if (e.button !== 0) return;
            handleMouseDownCell(e, rowIndex, colIndex, "keseluruhan-cell");
          },
          onMouseEnter: () => handleMouseEnterCell(rowIndex, colIndex),
          onFocus: () => handleFocusCell(rowIndex, colIndex),
        },
        React.createElement(
          "div",
          {
            className: `w-12 sm:w-14 mx-auto py-1.5 text-center rounded-md border text-xs font-semibold tabular-nums ${highlightClass} ${
              isBelowC ? "text-red-600 dark:text-red-300 font-extrabold" : ""
            }`,
          },
          grade !== null && grade !== undefined && grade !== "" ? grade : "-",
        ),
      );
    }),
    React.createElement(
      "td",
      {
        id: `keseluruhan-cell-${rowIndex}-${2 + displaySubjects.length}`,
        tabIndex: -1,
        className:
          "px-2 py-2 text-center font-semibold tabular-nums text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70",
        style: getSelectionStyle(rowIndex, 2 + displaySubjects.length)
          .selectionStyle,
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          handleMouseDownCell(
            e,
            rowIndex,
            2 + displaySubjects.length,
            "keseluruhan-cell",
          );
        },
        onMouseEnter: () =>
          handleMouseEnterCell(rowIndex, 2 + displaySubjects.length),
        onFocus: () => handleFocusCell(rowIndex, 2 + displaySubjects.length),
      },
      data.total,
    ),
    React.createElement(
      "td",
      {
        id: `keseluruhan-cell-${rowIndex}-${2 + displaySubjects.length + 1}`,
        tabIndex: -1,
        className:
          "px-2 py-2 text-center font-semibold tabular-nums text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70",
        style: getSelectionStyle(rowIndex, 2 + displaySubjects.length + 1)
          .selectionStyle,
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          handleMouseDownCell(
            e,
            rowIndex,
            2 + displaySubjects.length + 1,
            "keseluruhan-cell",
          );
        },
        onMouseEnter: () =>
          handleMouseEnterCell(rowIndex, 2 + displaySubjects.length + 1),
        onFocus: () =>
          handleFocusCell(rowIndex, 2 + displaySubjects.length + 1),
      },
      data.average,
    ),
  );
}, (prev, next) => {
  if (prev.data.id !== next.data.id) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.predikats !== next.predikats) return false;
  if (prev.sortBy !== next.sortBy) return false;
  if (prev.displaySubjects !== next.displaySubjects) return false;
  if (prev.subjectStats !== next.subjectStats) return false;
  if (prev.showIncompleteHighlight !== next.showIncompleteHighlight) return false;
  if (prev.showBelowKkmHighlight !== next.showBelowKkmHighlight) return false;
  if (prev.showMaxHighlight !== next.showMaxHighlight) return false;
  if (prev.showMinHighlight !== next.showMinHighlight) return false;

  // Let's compare data object strictly just in case! 
  // It has grades, total, average, rank, no
  if (JSON.stringify(prev.data) !== JSON.stringify(next.data)) return false;

  // Compare selection styles for all columns (0 to 2 + displaySubjects.length + 1)
  const maxCols = 2 + prev.displaySubjects.length + 2; 
  for (let c = 0; c < maxCols; c++) {
    const prevStyle = prev.getSelectionStyle(prev.rowIndex, c);
    const nextStyle = next.getSelectionStyle(next.rowIndex, c);
    if (
        prevStyle.isCellSelected !== nextStyle.isCellSelected ||
        prevStyle.selectionStyle?.backgroundColor !== nextStyle.selectionStyle?.backgroundColor ||
        prevStyle.selectionStyle?.boxShadow !== nextStyle.selectionStyle?.boxShadow
    ) {
        return false;
    }
  }

  return true;
});
