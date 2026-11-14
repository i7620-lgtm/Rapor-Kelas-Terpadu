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
  return (
    <>
      {(!settings.semester || settings.semester === "Ganjil") && (() => {
        const colIdx = tpHeadersLength;
        const { selectionStyle: style, showTransparentInput: showTrans } = getSelectionStyle(index, colIdx);
        const cellValue = detailedGrade?.["sts1"] ?? null;
        return (
          <td
            className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
            style={style}
            onMouseDown={(e) => handleMouseDownCell(e, index, colIdx, "nilai-cell")}
            onMouseEnter={() => handleMouseEnterCell(index, colIdx)}
          >
            <NilaiTableGradingCell
              id={`nilai-cell-${index}-${colIdx}`}
              value={cellValue}
              mode={mode}
              settings={settings}
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sts1")}
              onPaste={(e) => handlePaste(e, student.id, "sts1")}
              onFocus={() => handleFocusCell(index, colIdx)}
              showTransparentInput={showTrans}
              className="w-full p-2 text-center border rounded-md"
            />
          </td>
        );
      })()}
      {settings.semester === "Genap" && (() => {
        const colIdx = tpHeadersLength;
        const { selectionStyle: style, showTransparentInput: showTrans } = getSelectionStyle(index, colIdx);
        const cellValue = detailedGrade?.["sts2"] ?? null;
        return (
          <td
            className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
            style={style}
            onMouseDown={(e) => handleMouseDownCell(e, index, colIdx, "nilai-cell")}
            onMouseEnter={() => handleMouseEnterCell(index, colIdx)}
          >
            <NilaiTableGradingCell
              id={`nilai-cell-${index}-${colIdx}`}
              value={cellValue}
              mode={mode}
              settings={settings}
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sts2")}
              onPaste={(e) => handlePaste(e, student.id, "sts2")}
              onFocus={() => handleFocusCell(index, colIdx)}
              showTransparentInput={showTrans}
              className="w-full p-2 text-center border rounded-md"
            />
          </td>
        );
      })()}

      {(!settings.semester || settings.semester === "Ganjil") && (() => {
        const colIdx = tpHeadersLength + 1;
        const { selectionStyle: style, showTransparentInput: showTrans } = getSelectionStyle(index, colIdx);
        const cellValue = detailedGrade?.["sas1"] ?? null;
        return (
          <td
            className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
            style={style}
            onMouseDown={(e) => handleMouseDownCell(e, index, colIdx, "nilai-cell")}
            onMouseEnter={() => handleMouseEnterCell(index, colIdx)}
          >
            <NilaiTableGradingCell
              id={`nilai-cell-${index}-${colIdx}`}
              value={cellValue}
              mode={mode}
              settings={settings}
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sas1")}
              onPaste={(e) => handlePaste(e, student.id, "sas1")}
              onFocus={() => handleFocusCell(index, colIdx)}
              showTransparentInput={showTrans}
              className="w-full p-2 text-center border rounded-md"
            />
          </td>
        );
      })()}
      {settings.semester === "Genap" && (() => {
        const colIdx = tpHeadersLength + 1;
        const { selectionStyle: style, showTransparentInput: showTrans } = getSelectionStyle(index, colIdx);
        const cellValue = detailedGrade?.["sas2"] ?? null;
        return (
          <td
            className="p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] align-top relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
            style={style}
            onMouseDown={(e) => handleMouseDownCell(e, index, colIdx, "nilai-cell")}
            onMouseEnter={() => handleMouseEnterCell(index, colIdx)}
          >
            <NilaiTableGradingCell
              id={`nilai-cell-${index}-${colIdx}`}
              value={cellValue}
              mode={mode}
              settings={settings}
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "sas2")}
              onPaste={(e) => handlePaste(e, student.id, "sas2")}
              onFocus={() => handleFocusCell(index, colIdx)}
              showTransparentInput={showTrans}
              className="w-full p-2 text-center border rounded-md"
            />
          </td>
        );
      })()}
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
  return (
    <>
      {(!settings.semester || settings.semester === "Ganjil") && (
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
            <span>STS I</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sts1")}
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
      )}
      {settings.semester === "Genap" && (
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
            <span>STS II</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sts2")}
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
      )}
      
      {(!settings.semester || settings.semester === "Ganjil") && (
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
            <span>SAS I</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sas1")}
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
      )}
      {settings.semester === "Genap" && (
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
            <span>{gradeNumber === 6 ? "US" : "SAS II"}</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sas2")}
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
      )}
    </>
  );
};
