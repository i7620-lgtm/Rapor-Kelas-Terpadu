import React, { useState, useMemo } from "react";
import { QualitativeGradingTable } from "./QualitativeGradingTable";

export const GradeSettingsModal = ({
  isOpen,
  onClose,
  subject,
  settings,
  onUpdatePredikats,
  onUpdateGradeCalculation,
  onUpdateDisplayMode,
}) => {
  if (!isOpen) return null;

  const [localPredikats, setLocalPredikats] = useState(settings.predikats);
  const calculationConfig = useMemo(
    () => settings.gradeCalculation?.[subject.id] || { method: "rata-rata" },
    [settings.gradeCalculation, subject.id],
  );
  const [localMethod, setLocalMethod] = useState(calculationConfig.method);
  const [localDisplayMode, setLocalDisplayMode] = useState(
    settings.nilaiDisplayMode || "kuantitatif saja",
  );

  const handleSave = () => {
    onUpdatePredikats(localPredikats);
    onUpdateGradeCalculation(subject.id, {
      ...calculationConfig,
      method: localMethod,
    });
    if (onUpdateDisplayMode) onUpdateDisplayMode(localDisplayMode);
    onClose();
  };

  return React.createElement(
    "div",
    {
      className:
        "fixed inset-0 bg-black bg-opacity-60 z-[90] flex items-center justify-center p-4",
    },
    React.createElement(
      "div",
      {
        className:
          "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col",
      },
      React.createElement(
        "div",
        { className: "p-5 border-b flex-shrink-0" },
        React.createElement(
          "h3",
          { className: "text-xl font-bold text-slate-800" },
          "Pengaturan Nilai & Perhitungan Rapor",
        ),
        React.createElement(
          "p",
          { className: "text-sm text-slate-500 mt-1" },
          `Pengaturan untuk mata pelajaran: ${subject.fullName}`,
        ),
      ),
      React.createElement(
        "div",
        { className: "p-4 space-y-4 overflow-y-auto" },
        React.createElement(
          "section",
          null,
          React.createElement(
            "h4",
            {
              className: "text-sm font-bold text-slate-700 mb-2 border-b pb-1",
            },
            "Tampilan Input Nilai",
          ),
          React.createElement(
            "div",
            { className: "space-y-2" },
            [
              "kuantitatif saja",
              "kualitatif saja",
              "kuantitatif & kualitatif",
            ].map((mode) => {
              const labels = {
                "kuantitatif saja": "1. Tampilan Tabel Kuantitatif (Default)",
                "kualitatif saja": "2. Tampilan Tabel Kualitatif",
                "kuantitatif & kualitatif":
                  "3. Tampilan Kartu (Nilai Kuantitatif dan Kualitatif)",
              };
              return React.createElement(
                "label",
                {
                  key: mode,
                  className:
                    "flex items-center p-2 border rounded-md cursor-pointer hover:bg-slate-100",
                },
                React.createElement("input", {
                  type: "radio",
                  name: "display-mode",
                  value: mode,
                  checked: localDisplayMode === mode,
                  onChange: () => setLocalDisplayMode(mode),
                  className: "h-4 w-4 text-indigo-600",
                }),
                React.createElement(
                  "span",
                  { className: "ml-3 text-sm font-medium text-slate-700" },
                  labels[mode],
                ),
              );
            }),
          ),
        ),
        React.createElement(
          "div",
          { className: "mt-4 w-full" },
          React.createElement(
            "h4",
            {
              className: "text-md font-semibold text-slate-700 mb-2",
            },
            "Rentang Nilai (Predikat)",
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5 w-full max-w-[340px]" },
            ["a", "b", "c", "d"].map((p) =>
              React.createElement(
                "div",
                { key: p, className: "flex items-center justify-between" },
                React.createElement(
                  "label",
                  { className: "font-medium text-xs text-slate-600" },
                  `Predikat ${p.toUpperCase()} (mulai dari)`,
                ),
                React.createElement("input", {
                  type: "number",
                  value: localPredikats[p],
                  onChange: (e) =>
                    setLocalPredikats((prev) => ({
                      ...prev,
                      [p]: e.target.value,
                    })),
                  className: `w-16 p-1 border rounded text-center text-xs ${p === "d" ? "bg-slate-100" : ""}`,
                  readOnly: p === "d",
                }),
              ),
            ),
            React.createElement(
              "p",
              {
                className: "text-left text-[10px] text-slate-400 pt-1",
              },
              "Berlaku untuk semua mapel.",
            ),
          ),
        ),
        React.createElement(QualitativeGradingTable, { settings: settings }),
        React.createElement(
          "section",
          null,
          React.createElement(
            "h4",
            {
              className: "text-md font-semibold text-slate-700 mb-2",
            },
            "Cara Pengolahan Nilai Akhir Mapel",
          ),
          React.createElement(
            "div",
            { className: "space-y-2" },
            ["rata-rata", "pembobotan", "persentase"].map((method) =>
              React.createElement(
                "label",
                {
                  key: method,
                  className:
                    "flex items-center p-2 border rounded-md cursor-pointer hover:bg-slate-100",
                },
                React.createElement("input", {
                  type: "radio",
                  name: "calc-method",
                  value: method,
                  checked: localMethod === method,
                  onChange: () => setLocalMethod(method),
                  className: "h-4 w-4 text-indigo-600",
                }),
                React.createElement(
                  "span",
                  { className: "ml-3 text-sm font-medium text-slate-700" },
                  method === "rata-rata"
                    ? "Opsi Rata-Rata"
                    : method === "pembobotan"
                      ? "Opsi Pembobotan"
                      : "Opsi Persentase Ketuntasan",
                ),
              ),
            ),
          ),
        ),
      ),
      React.createElement(
        "div",
        {
          className:
            "flex justify-end p-4 bg-slate-50 rounded-b-lg border-t flex-shrink-0",
        },
        React.createElement(
          "button",
          {
            onClick: onClose,
            className:
              "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50",
          },
          "Batal",
        ),
        React.createElement(
          "button",
          {
            onClick: handleSave,
            className:
              "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700",
          },
          "Simpan Pengaturan",
        ),
      ),
    ),
  );
};
