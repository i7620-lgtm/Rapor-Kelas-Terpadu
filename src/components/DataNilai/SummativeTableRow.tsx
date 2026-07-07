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
  let descriptions = studentGrade.descriptions;
  if (!descriptions) {
    const generated = generateSubjectDescription(
      student,
      studentGrade,
      currentObjectives,
      settings,
      settings.slmVisibility?.[subject.id]
    );
    descriptions = {
      highest: generated.highest,
      lowest: generated.lowest,
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
    <tr key={student.id} className="border-b hover:bg-slate-50">
      <td
        id={`cell-${index}--2`}
        tabIndex={-1}
        className="p-2 text-center sticky z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top border-r box-border select-none cursor-default"
        style={{
          left: 0,
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
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
        className="p-2 font-medium lg:sticky lg:z-10 bg-white lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top border-r box-border select-none cursor-default"
        style={{
          left: "50px",
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
        <td className="px-4 py-2 text-center font-bold bg-slate-100 border-l align-top pt-3">
          {average ?? "-"}
        </td>
      )}

      <td className="px-2 py-2 border-l">
        <div className="flex flex-row gap-2">
          <AutoSizingTextarea
            value={descriptions.highest}
            onChange={(e) => handleLocalDescriptionChange(student.id, "highest", e.target.value)}
            placeholder="Deskripsi Tinggi"
            className={`w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-green-500 ${
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
            className={`w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-yellow-500 ${
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

