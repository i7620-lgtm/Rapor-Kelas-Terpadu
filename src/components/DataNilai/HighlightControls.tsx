import React from "react";

export const HighlightControls = ({
  showIncompleteHighlight,
  setShowIncompleteHighlight,
  showBelowKkmHighlight,
  setShowBelowKkmHighlight,
  showMaxHighlight,
  setShowMaxHighlight,
  showMinHighlight,
  setShowMinHighlight,
  sortBy,
  setSortBy,
}) => {
  return React.createElement(
    "div",
    {
      className:
        "px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 flex-wrap gap-2",
    },
    React.createElement(
      "div",
      { className: "flex items-center gap-2 sm:gap-3 text-xs font-semibold select-none flex-wrap" },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowIncompleteHighlight(!showIncompleteHighlight);
          },
          className: `min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showIncompleteHighlight
              ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`,
        },
        React.createElement("span", {
          className: `w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
            showIncompleteHighlight ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
          }`,
        }),
        React.createElement("span", null, "Nilai Tidak Lengkap")
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setShowBelowKkmHighlight) {
              setShowBelowKkmHighlight(!showBelowKkmHighlight);
            }
          },
          className: `min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showBelowKkmHighlight
              ? "bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`,
        },
        React.createElement("span", {
          className: `w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
            showBelowKkmHighlight ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"
          }`,
        }),
        React.createElement("span", null, "Nilai di Bawah KKM")
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMaxHighlight(!showMaxHighlight);
          },
          className: `min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showMaxHighlight
              ? "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`,
        },
        React.createElement("span", {
          className: `w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
            showMaxHighlight ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
          }`,
        }),
        React.createElement("span", null, "Nilai Tertinggi")
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMinHighlight(!showMinHighlight);
          },
          className: `min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showMinHighlight
              ? "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`,
        },
        React.createElement("span", {
          className: `w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
            showMinHighlight ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-600"
          }`,
        }),
        React.createElement("span", null, "Nilai Terendah")
      )
    ),
    React.createElement(
      "div",
      { className: "flex items-center flex-wrap gap-2" },
      React.createElement(
        "span",
        { className: "text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mr-1 sm:mr-2" },
        "Urutkan:",
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-3 sm:gap-4" },
        React.createElement(
          "label",
          { className: "min-h-[44px] lg:min-h-0 flex items-center cursor-pointer py-1" },
          React.createElement("input", {
            type: "radio",
            name: "sort",
            value: "no",
            checked: sortBy === "no",
            onChange: () => setSortBy("no"),
            className: "h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600",
          }),
          React.createElement(
            "span",
            { className: "ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300" },
            "No. Absen",
          ),
        ),
        React.createElement(
          "label",
          { className: "min-h-[44px] lg:min-h-0 flex items-center cursor-pointer py-1" },
          React.createElement("input", {
            type: "radio",
            name: "sort",
            value: "rank",
            checked: sortBy === "rank",
            onChange: () => setSortBy("rank"),
            className: "h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600",
          }),
          React.createElement(
            "span",
            { className: "ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300" },
            "Peringkat (Rank)",
          ),
        )
      )
    )
  );
};
