import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";
import {
  getNumericValue,
  getQualitativeCode,
  generateSubjectDescription
} from "../../utils/nilaiHelpers";
import { SummativeRowScoreCells } from "./SummativeRowParts";

export const SummativeTableRow = React.memo(({
  student,
  index,
  studentGrade,
  currentObjectives,
  settings,
  subject,
  isSLM,
  item,
  type,
  qualitativeGradingMap,
  activeInput,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleFocusCell,
  handlePaste,
  handleLocalGradeChange,
  handleLocalDescriptionChange,
}) => {
  const savedDescriptions = studentGrade?.descriptions;
  const needsHighest = !savedDescriptions?.highest || !savedDescriptions.highest.trim();
  const needsLowest = !savedDescriptions?.lowest || !savedDescriptions.lowest.trim();
  let descriptions = savedDescriptions;
  if (needsHighest || needsLowest) {
    const generated = generateSubjectDescription(
      student,
      studentGrade,
      currentObjectives,
      settings,
      settings.slmVisibility?.[subject.id]
    );
    descriptions = {
      highest: needsHighest ? generated.highest : savedDescriptions.highest,
      lowest: needsLowest ? generated.lowest : savedDescriptions.lowest,
    };
  }

  let average = null;
  if (isSLM) {
    const slmData = studentGrade.slm?.find((s) => s.id === item.id);
    const scores = slmData?.scores || [];
    const numericScores = scores
      .map((s) => getNumericValue(s, qualitativeGradingMap))
      .filter((s) => s !== null);
    if (numericScores.length > 0) {
      average = (
        numericScores.reduce((a, b) => a + b, 0) /
        numericScores.length
      ).toFixed(1);
    }
  }

  return (
    <tr key={student.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-within:bg-slate-50 dark:focus-within:bg-slate-800/60 group">
      <td
        id={`cell-${index}--2`}
        tabIndex={-1}
        className="p-1.5 sm:p-2 text-center tabular-nums sticky z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/60 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none align-top border-r border-slate-200 dark:border-slate-700 w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] box-border select-none cursor-default text-slate-700 dark:text-slate-300"
        style={{
          left: 0,
          ...getSelectionStyle(index, -2).selectionStyle,
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, index, -2);
        }}
        onMouseEnter={() => handleMouseEnterCell(index, -2)}
      >
        {index + 1}
      </td>
      <td
        id={`cell-${index}--1`}
        tabIndex={-1}
        className="p-1.5 sm:p-2 font-medium static lg:sticky lg:left-[50px] lg:z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/60 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] align-top border-r border-slate-200 dark:border-slate-700 box-border select-none cursor-default w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal text-xs sm:text-sm text-slate-800 dark:text-slate-100"
        style={{
          ...getSelectionStyle(index, -1).selectionStyle,
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, index, -1);
        }}
        onMouseEnter={() => handleMouseEnterCell(index, -1)}
      >
        {student.namaLengkap}
      </td>

      <SummativeRowScoreCells
        isSLM={isSLM}
        item={item}
        student={student}
        index={index}
        getSelectionStyle={getSelectionStyle}
        handleMouseDownCell={handleMouseDownCell}
        handleMouseEnterCell={handleMouseEnterCell}
        handleFocusCell={handleFocusCell}
        handlePaste={handlePaste}
        handleLocalGradeChange={handleLocalGradeChange}
        settings={settings}
        studentGrade={studentGrade}
        activeInput={activeInput}
        qualitativeGradingMap={qualitativeGradingMap}
        type={type}
        getNumericValue={getNumericValue}
        getQualitativeCode={getQualitativeCode}
      />
      {isSLM && (
        <td className="px-3 sm:px-4 py-2 text-center font-bold tabular-nums bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-slate-700 align-top pt-3">
          {average ?? "-"}
        </td>
      )}

      <td className="px-2 py-2 border-l border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-2">
          <AutoSizingTextarea
            value={descriptions.highest}
            onChange={(e) => handleLocalDescriptionChange(student.id, "highest", e.target.value)}
            placeholder="Deskripsi Tinggi"
            className={`w-full sm:w-1/2 p-2 text-xs border rounded resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-green-500 ${
              descriptions.highest && descriptions.highest.trim() !== ""
                ? "border-green-500 ring-1 ring-green-500"
                : "border-red-500 ring-1 ring-red-500"
            }`}
            rows={2}
          />
          <AutoSizingTextarea
            value={descriptions.lowest}
            onChange={(e) => handleLocalDescriptionChange(student.id, "lowest", e.target.value)}
            placeholder="Deskripsi Rendah"
            className={`w-full sm:w-1/2 p-2 text-xs border rounded resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-yellow-500 ${
              descriptions.lowest && descriptions.lowest.trim() !== ""
                ? "border-green-500 ring-1 ring-green-500"
                : "border-red-500 ring-1 ring-red-500"
            }`}
            rows={2}
          />
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  if (prev.student.id !== next.student.id) return false;
  if (prev.index !== next.index) return false;
  if (prev.subject?.id !== next.subject?.id) return false;
  if (prev.isSLM !== next.isSLM) return false;
  if (prev.item?.id !== next.item?.id) return false;
  if (prev.type !== next.type) return false;
  if (prev.currentObjectives !== next.currentObjectives) return false;
  if (prev.settings !== next.settings) return false;

  if (JSON.stringify(prev.studentGrade) !== JSON.stringify(next.studentGrade)) return false;

  const activeKeys = Object.keys(prev.activeInput);
  const nextActiveKeys = Object.keys(next.activeInput);
  if (activeKeys.length !== nextActiveKeys.length) return false;
  if (activeKeys.some(key => prev.activeInput[key] !== next.activeInput[key])) return false;

  const maxCols = prev.isSLM ? (prev.item?.scores?.length || 0) * 2 + 2 : 3;
  for (let c = -2; c < maxCols; c++) {
    const prevStyle = prev.getSelectionStyle(prev.index, c);
    const nextStyle = next.getSelectionStyle(next.index, c);
    if (
        prevStyle.isCellSelected !== nextStyle.isCellSelected ||
        prevStyle.showTransparentInput !== nextStyle.showTransparentInput ||
        prevStyle.selectionStyle?.backgroundColor !== nextStyle.selectionStyle?.backgroundColor ||
        prevStyle.selectionStyle?.boxShadow !== nextStyle.selectionStyle?.boxShadow
    ) {
        return false;
    }
  }

  return true;
});

