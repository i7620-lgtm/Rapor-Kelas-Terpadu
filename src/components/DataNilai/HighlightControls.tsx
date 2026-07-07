import React from "react";

export const HighlightControls = ({
  showIncompleteHighlight,
  setShowIncompleteHighlight,
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
        "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 flex-wrap gap-2",
    },
    React.createElement(
      "div",
      { className: "flex items-center gap-3 text-xs font-semibold select-none flex-wrap" },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowIncompleteHighlight(!showIncompleteHighlight);
          },
          className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer",
          style: showIncompleteHighlight
            ? { backgroundColor: "#fee2e2", borderColor: "#fca5a5", color: "#b91c1c" }
            : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }
        },
        React.createElement("span", {
          className: "w-2.5 h-2.5 rounded-full inline-block shadow-sm",
          style: showIncompleteHighlight ? { backgroundColor: "#ef4444" } : { backgroundColor: "#cbd5e1" }
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
            setShowMaxHighlight(!showMaxHighlight);
          },
          className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer",
          style: showMaxHighlight
            ? { backgroundColor: "#dbeafe", borderColor: "#bfdbfe", color: "#1d4ed8" }
            : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }
        },
        React.createElement("span", {
          className: "w-2.5 h-2.5 rounded-full inline-block shadow-sm",
          style: showMaxHighlight ? { backgroundColor: "#3b82f6" } : { backgroundColor: "#cbd5e1" }
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
          className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer",
          style: showMinHighlight
            ? { backgroundColor: "#ffedd5", borderColor: "#fed7aa", color: "#c2410c" }
            : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }
        },
        React.createElement("span", {
          className: "w-2.5 h-2.5 rounded-full inline-block shadow-sm",
          style: showMinHighlight ? { backgroundColor: "#f97316" } : { backgroundColor: "#cbd5e1" }
        }),
        React.createElement("span", null, "Nilai Terendah")
      )
    ),
    React.createElement(
      "div",
      { className: "flex items-center gap-2" },
      React.createElement(
        "span",
        { className: "text-sm font-medium text-slate-700 mr-2" },
        "Urutkan:",
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-4" },
        React.createElement(
          "label",
          { className: "flex items-center cursor-pointer" },
          React.createElement("input", {
            type: "radio",
            name: "sort",
            value: "no",
            checked: sortBy === "no",
            onChange: () => setSortBy("no"),
            className: "h-4 w-4 text-indigo-600 border-slate-300",
          }),
          React.createElement(
            "span",
            { className: "ml-2 text-sm text-slate-600" },
            "No. Absen",
          ),
        ),
        React.createElement(
          "label",
          { className: "flex items-center cursor-pointer" },
          React.createElement("input", {
            type: "radio",
            name: "sort",
            value: "rank",
            checked: sortBy === "rank",
            onChange: () => setSortBy("rank"),
            className: "h-4 w-4 text-indigo-600 border-slate-300",
          }),
          React.createElement(
            "span",
            { className: "ml-2 text-sm text-slate-600" },
            "Peringkat (Rank)",
          ),
        )
      )
    )
  );
};
