import React from 'react';
import { NilaiTableGradingCell } from "./NilaiTableGradingCell";

export const StsSasCells = ({
  student,
  index,
  detailedGrade,
  mode,
  settings,
  tpHeadersLength,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleSingleGradeChange,
  handlePaste,
  handleFocusCell
}: any) => {
  const stsColIdx = tpHeadersLength;
  const sasColIdx = tpHeadersLength + 1;
  const { selectionStyle: stsStyle, showTransparentInput: showStsTrans } = getSelectionStyle(index, stsColIdx);
  const { selectionStyle: sasStyle, showTransparentInput: showSasTrans } = getSelectionStyle(index, sasColIdx);
  const stsValue = detailedGrade?.sts ?? null;
  const sasValue = detailedGrade?.sas ?? null;

  return (
    <>
      <td
        className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
        style={stsStyle}
        onMouseDown={(e) => handleMouseDownCell(e, index, stsColIdx, "nilai-cell")}
        onMouseEnter={() => handleMouseEnterCell(index, stsColIdx)}
      >
        <NilaiTableGradingCell
          id={`nilai-cell-${index}-${stsColIdx}`}
          value={stsValue}
          mode={mode}
          settings={settings}
          onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sts")}
          onPaste={(e) => handlePaste(e, student.id, "sts")}
          onFocus={() => handleFocusCell(index, stsColIdx)}
          showTransparentInput={showStsTrans}
          className="w-full p-2 text-center border rounded-md"
        />
      </td>
      <td
        className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
        style={sasStyle}
        onMouseDown={(e) => handleMouseDownCell(e, index, sasColIdx, "nilai-cell")}
        onMouseEnter={() => handleMouseEnterCell(index, sasColIdx)}
      >
        <NilaiTableGradingCell
          id={`nilai-cell-${index}-${sasColIdx}`}
          value={sasValue}
          mode={mode}
          settings={settings}
          onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sas")}
          onPaste={(e) => handlePaste(e, student.id, "sas")}
          onFocus={() => handleFocusCell(index, sasColIdx)}
          showTransparentInput={showSasTrans}
          className="w-full p-2 text-center border rounded-md"
        />
      </td>
    </>
  );
};

export const StsSasHeaders = ({
  settings,
  tpHeadersLength,
  headerRowSpan,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleAutoRegressionNonTP,
  gradeNumber
}: any) => {
  const isGenap = settings?.semester === "Genap";
  const stsLabel = isGenap ? "STS II" : "STS I";
  const sasLabel = isGenap ? (gradeNumber === 6 ? "US" : "SAS II") : "SAS I";

  return (
    <>
      <th
        rowSpan={headerRowSpan}
        className="p-1.5 sm:p-2 text-center border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] select-none cursor-default"
        style={getSelectionStyle(-1, tpHeadersLength).selectionStyle}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, -1, tpHeadersLength, "nilai-cell");
        }}
        onMouseEnter={() => handleMouseEnterCell(-1, tpHeadersLength)}
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <span>{stsLabel}</span>
          {settings.enableAutoRegression && (
            <button
              onClick={() => handleAutoRegressionNonTP("sts")}
              title="Olah Nilai Otomatis (Regresi)"
              className="min-w-[32px] min-h-[32px] lg:min-w-0 lg:min-h-0 inline-flex items-center justify-center p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 lg:w-3 lg:h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </button>
          )}
        </div>
      </th>

      <th
        rowSpan={headerRowSpan}
        className="p-1.5 sm:p-2 text-center border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] select-none cursor-default"
        style={getSelectionStyle(-1, tpHeadersLength + 1).selectionStyle}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, -1, tpHeadersLength + 1, "nilai-cell");
        }}
        onMouseEnter={() => handleMouseEnterCell(-1, tpHeadersLength + 1)}
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <span>{sasLabel}</span>
          {settings.enableAutoRegression && (
            <button
              onClick={() => handleAutoRegressionNonTP("sas")}
              title="Olah Nilai Otomatis (Regresi)"
              className="min-w-[32px] min-h-[32px] lg:min-w-0 lg:min-h-0 inline-flex items-center justify-center p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 lg:w-3 lg:h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </button>
          )}
        </div>
      </th>
    </>
  );
};
