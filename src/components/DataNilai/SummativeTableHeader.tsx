import React from "react";

export const SummativeTableHeader = ({
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
}) => {
  return React.createElement(
    "thead",
    {
      className:
        "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-[30]",
    },
    React.createElement(
      "tr",
      null,
      React.createElement(
        "th",
        {
          rowSpan: headerRowSpan,
          className:
            "p-2 text-center sticky top-0 z-20 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle border-b border-r box-border select-none cursor-default",
          style: {
            left: 0,
            top: 0,
            width: "50px",
            minWidth: "50px",
            maxWidth: "50px",
            ...getSelectionStyle(-1, -2).selectionStyle,
          },
          onMouseDown: (e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, -2);
          },
          onMouseEnter: () => handleMouseEnterCell(-1, -2),
        },
        "No"
      ),
      React.createElement(
        "th",
        {
          rowSpan: headerRowSpan,
          className:
            "p-2 align-middle border-b border-r sticky top-0 z-20 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px] max-w-[300px] box-border select-none cursor-default",
          style: {
            left: "50px",
            top: 0,
            ...getSelectionStyle(-1, -1).selectionStyle,
          },
          onMouseDown: (e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, -1);
          },
          onMouseEnter: () => handleMouseEnterCell(-1, -1),
        },
        "Nama Siswa"
      ),
      isSLM
        ? localObjectives.map((_, i) =>
            React.createElement(
              "th",
              {
                key: `tp-header-${i}`,
                colSpan: 2,
                className:
                  "px-2 py-3 text-center border-b border-l select-none cursor-default",
                style: getSelectionStyle(-1, i * 2).selectionStyle,
                onMouseDown: (e) => {
                  if (e.button !== 0) return;
                  if (e.shiftKey) e.preventDefault();
                  handleMouseDownCell(e, -1, i * 2);
                },
                onMouseEnter: () => handleMouseEnterCell(-1, i * 2),
              },
              `TP ${i + 1}`
            )
          )
        : React.createElement(
            "th",
            {
              rowSpan: headerRowSpan,
              className:
                "px-2 py-3 text-center align-middle border-b select-none cursor-default",
              style: getSelectionStyle(-1, 0).selectionStyle,
              onMouseDown: (e) => {
                if (e.button !== 0) return;
                if (e.shiftKey) e.preventDefault();
                handleMouseDownCell(e, -1, 0);
              },
              onMouseEnter: () => handleMouseEnterCell(-1, 0),
            },
            `Nilai ${type.toUpperCase()}`
          ),
      isSLM &&
        React.createElement(
          "th",
          {
            rowSpan: headerRowSpan,
            className:
              "px-4 py-3 text-center bg-slate-200 align-middle border-b border-l",
          },
          "Rata-rata"
        ),
      React.createElement(
        "th",
        {
          rowSpan: headerRowSpan,
          className:
            "px-4 py-3 text-center align-middle border-b border-l min-w-[600px]",
        },
        React.createElement(
          "div",
          { className: "flex flex-col items-center gap-2" },
          "Capaian Kompetensi",
          React.createElement(
            "button",
            {
              onClick: handleBulkGenerateDescriptions,
              className:
                "px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-300 font-bold",
            },
            "Generate Otomatis"
          )
        )
      )
    ),
    isSLM &&
      isWeighting &&
      React.createElement(
        "tr",
        null,
        localObjectives.map((_, i) =>
          React.createElement(
            "th",
            {
              key: `weight-header-${i}`,
              colSpan: 2,
              className:
                "px-2 py-1 bg-indigo-50 align-middle text-center border-b border-l",
            },
            React.createElement(
              "div",
              {
                className: "flex items-center justify-center gap-1",
              },
              React.createElement(
                "span",
                {
                  className: "text-indigo-900 text-[10px] font-bold",
                },
                "BOBOT"
              ),
              React.createElement("input", {
                type: "number",
                min: 0,
                max: 100,
                value: weights.TP?.[item.id]?.[i] ?? "",
                onChange: (e) =>
                  handleWeightChange("TP", e.target.value, item.id, i),
                className: `w-16 p-1 text-center border rounded-md shadow-sm ${weights.TP?.[item.id]?.[i] !== null && weights.TP?.[item.id]?.[i] !== undefined && weights.TP?.[item.id]?.[i] !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
              })
            )
          )
        )
      ),
    isSLM &&
      React.createElement(
        "tr",
        null,
        localObjectives.map((_, i) =>
          React.createElement(
            React.Fragment,
            { key: `sub-header-${i}` },
            React.createElement(
              "th",
              {
                className:
                  "px-2 py-2 text-center font-normal border-b border-l",
              },
              "Kuantitatif"
            ),
            React.createElement(
              "th",
              {
                className: "px-2 py-2 text-center font-normal border-b",
              },
              "Kualitatif"
            )
          )
        )
      ),
    !isSLM &&
      isWeighting &&
      React.createElement(
        "tr",
        null,
        React.createElement(
          "th",
          {
            className:
              "px-2 py-1 bg-indigo-50 align-middle text-center border-b",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-center gap-1" },
            React.createElement(
              "span",
              {
                className: "text-indigo-900 text-[10px] font-bold",
              },
              "BOBOT"
            ),
            React.createElement("input", {
              type: "number",
              min: 0,
              max: 100,
              value: weights[type.toUpperCase()] ?? "",
              onChange: (e) =>
                handleWeightChange(type.toUpperCase(), e.target.value),
              className: `w-20 p-2 text-center border rounded-md shadow-sm ${weights[type.toUpperCase()] !== null && weights[type.toUpperCase()] !== undefined && weights[type.toUpperCase()] !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
            })
          )
        )
      )
  );
};
