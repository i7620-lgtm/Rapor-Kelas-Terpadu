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
  showMaxHighlight,
  showMinHighlight,
}) => {
  const predicateCValue = parseInt(predikats?.c, 10);

  return React.createElement(
    "tr",
    { key: data.id, className: "bg-white hover:bg-slate-50" },
    React.createElement(
      "td",
      {
        id: `keseluruhan-cell-${rowIndex}-0`,
        tabIndex: -1,
        className:
          `p-2 text-center font-medium sticky z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-r border-slate-200 box-border cursor-default select-none ${(data.hasMissingGrade && showIncompleteHighlight) ? "bg-red-100 text-red-700 font-bold" : "bg-white text-slate-900"}`,
        style: {
          left: 0,
          width: "60px",
          minWidth: "60px",
          maxWidth: "60px",
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
        className: `p-2 font-medium whitespace-nowrap border-b border-r border-slate-200 lg:sticky lg:z-20 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] box-border ${(data.hasMissingGrade && showIncompleteHighlight) ? "bg-red-100 text-red-700 font-bold" : data.hasFailingGrade ? "bg-white text-red-600 font-bold" : "bg-white text-slate-900"} cursor-default select-none`,
        style: {
          left: "60px",
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
      let highlightClass = "bg-slate-100 border-slate-200 text-slate-700";
      let highlightStyle = {};
      if (grade === undefined || grade === null || grade === "") {
        if (showIncompleteHighlight) {
          highlightClass = "bg-red-100 border-red-300 text-red-600 font-extrabold shadow-inner shadow-red-200/50 ring-1 ring-red-400";
        }
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
            highlightClass = "shadow-inner font-extrabold";
            highlightStyle = {
              backgroundColor: "#dbeafe",
              borderColor: "#60a5fa",
              color: "#1d4ed8",
            };
          } else if (numGrade === stats.minVal && showMinHighlight) {
            highlightClass = "shadow-inner font-extrabold";
            highlightStyle = {
              backgroundColor: "#ffedd5",
              borderColor: "#fb923c",
              color: "#c2410c",
            };
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
            "px-2 py-1 border-b border-slate-200 text-center cursor-default select-none",
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
            className: `w-14 mx-auto py-1.5 text-center rounded-md border text-xs font-semibold ${highlightClass} ${
              isBelowC ? "text-red-600 font-extrabold" : ""
            }`,
            style: highlightStyle,
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
          "px-2 py-2 text-center font-semibold text-slate-800 border-b border-slate-200 cursor-default select-none",
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
          "px-2 py-2 text-center font-semibold text-slate-800 border-b border-slate-200 cursor-default select-none",
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
