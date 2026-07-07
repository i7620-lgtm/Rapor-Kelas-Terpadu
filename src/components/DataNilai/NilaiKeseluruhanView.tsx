import React from "react";
import { HighlightControls } from "./HighlightControls";
import { KeseluruhanTableHeader } from "./KeseluruhanTableHeader";
import { KeseluruhanTableRow } from "./KeseluruhanTableRow";
import { useNilaiKeseluruhanLogic } from "./useNilaiKeseluruhanLogic";

export const NilaiKeseluruhanView = ({ students, grades, subjects, predikats: propPredikats, settings, showToast }) => {
  const {
    predikats,
    sortBy,
    setSortBy,
    showIncompleteHighlight,
    setShowIncompleteHighlight,
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
    handleFocusCell
  } = useNilaiKeseluruhanLogic({ students, grades, subjects, predikats: propPredikats, settings, showToast });

  return React.createElement(
    "div",
    {
      className:
        "bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden",
    },
    React.createElement(HighlightControls, {
      showIncompleteHighlight,
      setShowIncompleteHighlight,
      showMaxHighlight,
      setShowMaxHighlight,
      showMinHighlight,
      setShowMinHighlight,
      sortBy,
      setSortBy,
    }),
    React.createElement(
      "div",
      { className: "flex-1 overflow-auto keseluruhan-table-container outline-none focus:outline-none", tabIndex: 0 },
      React.createElement(
        "table",
        {
          className:
            "w-full text-sm text-left text-slate-500 border-separate border-spacing-0",
        },
        React.createElement(KeseluruhanTableHeader, {
          sortBy,
          displaySubjects,
        }),
        React.createElement(
          "tbody",
          null,
          processedData.map((data, rowIndex) =>
            React.createElement(KeseluruhanTableRow, {
              key: data.id,
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
            })
          ),
        ),
      ),
    ),
  );
};

