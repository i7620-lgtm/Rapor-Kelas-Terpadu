import React, { useState, useMemo, useEffect } from "react";
import { QualitativeGradingTable } from "./QualitativeGradingTable";
import { computeQualitativeGradingMap } from "../../utils/nilaiHelpers";

export const GradeSettingsModal = ({
  isOpen,
  onClose,
  subject,
  settings,
  onUpdatePredikats,
  onUpdateGradeCalculation,
  onUpdateDisplayMode,
}) => {
  const defaultPredikats = settings?.predikats || { a: "90", b: "80", c: "70", d: "0" };
  const [localPredikats, setLocalPredikats] = useState(defaultPredikats);
  const calculationConfig = useMemo(
    () => settings?.gradeCalculation?.[subject?.id] || { method: "rata-rata" },
    [settings?.gradeCalculation, subject?.id],
  );
  const [localMethod, setLocalMethod] = useState(calculationConfig.method);
  const [localDisplayMode, setLocalDisplayMode] = useState(
    settings?.nilaiDisplayMode || "kuantitatif saja",
  );

  useEffect(() => {
    if (isOpen) {
      setLocalPredikats(settings?.predikats || { a: "90", b: "80", c: "70", d: "0" });
      setLocalMethod(calculationConfig.method || "rata-rata");
      setLocalDisplayMode(settings?.nilaiDisplayMode || "kuantitatif saja");
    }
  }, [
    isOpen,
    subject?.id,
    settings?.predikats,
    calculationConfig.method,
    settings?.nilaiDisplayMode,
  ]);

  if (!isOpen) return null;

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
        "fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-2 sm:p-4",
    },
    React.createElement(
      "div",
      {
        className:
          "bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800",
      },
      React.createElement(
        "div",
        { className: "p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0" },
        React.createElement(
          "h3",
          { className: "text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100" },
          "Pengaturan Nilai & Perhitungan Rapor",
        ),
        React.createElement(
          "p",
          { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1" },
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
              className: "text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1",
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
                    "flex items-center p-2.5 min-h-[44px] lg:min-h-0 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors",
                },
                React.createElement("input", {
                  type: "radio",
                  name: "display-mode",
                  value: mode,
                  checked: localDisplayMode === mode,
                  onChange: () => setLocalDisplayMode(mode),
                  className: "h-4 w-4 text-indigo-600 shrink-0",
                }),
                React.createElement(
                  "span",
                  { className: "ml-3 text-sm font-medium text-slate-700 dark:text-slate-200" },
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
              className: "text-md font-semibold text-slate-700 dark:text-slate-200 mb-2",
            },
            "Rentang Nilai (Predikat)",
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5 w-full max-w-[340px]" },
            ["a", "b", "c", "d"].map((p) =>
              React.createElement(
                "div",
                { key: p, className: "flex items-center justify-between gap-2" },
                React.createElement(
                  "label",
                  { className: "font-medium text-xs text-slate-600 dark:text-slate-300" },
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
                  className: `w-16 p-1.5 border border-slate-300 dark:border-slate-700 rounded text-center text-xs tabular-nums ${p === "d" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"}`,
                  readOnly: p === "d",
                }),
              ),
            ),
            React.createElement(
              "p",
              {
                className: "text-left text-xs text-slate-400 dark:text-slate-500 pt-1",
              },
              "Berlaku untuk semua mapel.",
            ),
          ),
        ),
        React.createElement(QualitativeGradingTable, {
          settings: {
            ...settings,
            predikats: localPredikats,
            qualitativeGradingMap: computeQualitativeGradingMap(localPredikats),
          },
        }),
        React.createElement(
          "section",
          null,
          React.createElement(
            "h4",
            {
              className: "text-md font-semibold text-slate-700 dark:text-slate-200 mb-2",
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
                    "flex items-center p-2.5 min-h-[44px] lg:min-h-0 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors",
                },
                React.createElement("input", {
                  type: "radio",
                  name: "calc-method",
                  value: method,
                  checked: localMethod === method,
                  onChange: () => setLocalMethod(method),
                  className: "h-4 w-4 text-indigo-600 shrink-0",
                }),
                React.createElement(
                  "span",
                  { className: "ml-3 text-sm font-medium text-slate-700 dark:text-slate-200" },
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
            "flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex-shrink-0",
        },
        React.createElement(
          "button",
          {
            onClick: onClose,
            className:
              "w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700",
          },
          "Batal",
        ),
        React.createElement(
          "button",
          {
            onClick: handleSave,
            className:
              "w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700",
          },
          "Simpan Pengaturan",
        ),
      ),
    ),
  );
};
