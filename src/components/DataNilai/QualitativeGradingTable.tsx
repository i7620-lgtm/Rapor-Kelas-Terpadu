import React from "react";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";

export const QualitativeGradingTable = ({ settings }) => {
  const { predikats, qualitativeGradingMap } = settings;
  if (
    !predikats ||
    !qualitativeGradingMap ||
    Object.keys(qualitativeGradingMap).length === 0
  )
    return null;

  const valA = parseInt(predikats.a, 10);
  const valB = parseInt(predikats.b, 10);
  const valC = parseInt(predikats.c, 10);
  const valD = parseInt(predikats.d, 10);

  const data = [
    {
      code: "SB",
      descriptor: QUALITATIVE_DESCRIPTORS.SB,
      range: `${valA} - 100`,
      value: qualitativeGradingMap.SB,
    },
    {
      code: "BSH",
      descriptor: QUALITATIVE_DESCRIPTORS.BSH,
      range: `${valB} - ${valA - 1}`,
      value: qualitativeGradingMap.BSH,
    },
    {
      code: "MB",
      descriptor: QUALITATIVE_DESCRIPTORS.MB,
      range: `${valC} - ${valB - 1}`,
      value: qualitativeGradingMap.MB,
    },
    {
      code: "BB",
      descriptor: QUALITATIVE_DESCRIPTORS.BB,
      range: `${valD} - ${valC - 1}`,
      value: qualitativeGradingMap.BB,
    },
  ];

  return React.createElement(
    "div",
    { className: "mt-4" },
    React.createElement(
      "h4",
      { className: "text-md font-semibold text-slate-700 mb-2" },
      "Penilaian Kualitatif Otomatis (Hanya Baca)",
    ),
    React.createElement(
      "p",
      { className: "text-xs text-slate-500 mb-3" },
      "Nilai representatif ini dihitung otomatis dari nilai KKM dan rentang di atas.",
    ),
    React.createElement(
      "table",
      { className: "w-full text-sm border-collapse" },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          { className: "bg-slate-100" },
          React.createElement(
            "th",
            { className: "border p-2 text-left whitespace-nowrap" },
            "Deskriptor",
          ),
          React.createElement(
            "th",
            { className: "border p-2 text-center whitespace-nowrap" },
            "Rentang Nilai",
          ),
          React.createElement(
            "th",
            { className: "border p-2 text-center whitespace-nowrap" },
            "Nilai Representatif",
          ),
        ),
      ),
      React.createElement(
        "tbody",
        null,
        data.map((item) =>
          React.createElement(
            "tr",
            { key: item.code },
            React.createElement(
              "td",
              { className: "border p-2 whitespace-nowrap" },
              `${item.code} (${item.descriptor})`,
            ),
            React.createElement(
              "td",
              { className: "border p-2 text-center whitespace-nowrap" },
              item.range,
            ),
            React.createElement(
              "td",
              {
                className:
                  "border p-2 text-center font-bold text-indigo-700 whitespace-nowrap",
              },
              item.value,
            ),
          ),
        ),
      ),
    ),
  );
};
