import React from "react";
import { NilaiTableGradingCell } from "./NilaiTableGradingCell";
import { NilaiTableCapaianCell } from "./NilaiTableCapaianCell";
import { generateSubjectDescription } from "../../utils/nilaiHelpers";
import { useNilaiStore } from "../../stores/useNilaiStore";
import { StsSasCells } from "./NilaiTableRowParts";

interface NilaiTableRowProps {
  student: {
    id: string;
    namaLengkap: string;
  };
  index: number;
  subject: {
    id: string;
  };
  objectivesForSubject: any[];
  settings: any;
  activeSlmIds: any;
  tpHeaders: Array<{
    slmId: string;
    tpIndex: number;
    text: string;
    displayIndex: string;
  }>;
  getSelectionStyle: (
    row: number,
    col: number
  ) => { selectionStyle?: React.CSSProperties; showTransparentInput: boolean };
  handleMouseDownCell: (
    e: React.MouseEvent,
    row: number,
    col: number,
    type: string
  ) => void;
  handleMouseEnterCell: (row: number, col: number) => void;
  handleSingleGradeChange: (
    studentId: string,
    value: any,
    type: string,
    slmId?: string,
    tpIndex?: number
  ) => void;
  handleFocusCell: (row: number, col: number) => void;
  handlePaste: (e: React.ClipboardEvent, studentId: string, key: string) => void;
  handleDescriptionChange: (
    studentId: string,
    field: "highest" | "lowest",
    value: string
  ) => void;
  isCapaianPinned: boolean;
  mode: "kualitatif" | "kuantitatif";
}

export const NilaiTableRow: React.FC<NilaiTableRowProps> = React.memo(({ ...props }) => {
  const {
    student,
    index,
    subject,
    objectivesForSubject,
    settings,
    activeSlmIds,
    tpHeaders,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleSingleGradeChange,
    handleFocusCell,
    handlePaste,
    handleDescriptionChange,
    isCapaianPinned,
    mode,
  } = props;
  
  const studentGrade = useNilaiStore(state => state.grades.find((g) => g.studentId === student.id));

  const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
  const generated = generateSubjectDescription(
    student,
    detailedGrade || {
      slm: [],
      sts1: null,
      sts2: null,
      sas1: null,
      sas2: null,
    },
    objectivesForSubject,
    settings,
    activeSlmIds,
  );

  const descriptions = {
    highest:
      detailedGrade?.descriptions?.highest &&
      detailedGrade.descriptions.highest.trim()
        ? detailedGrade.descriptions.highest
        : generated.highest,
    lowest:
      detailedGrade?.descriptions?.lowest &&
      detailedGrade.descriptions.lowest.trim()
        ? detailedGrade.descriptions.lowest
        : generated.lowest,
  };

  let total = "-";
  if (detailedGrade) {
    const finalVal = studentGrade?.finalGrades?.[subject.id];
    if (finalVal !== null && finalVal !== undefined) {
      total = String(finalVal);
    }
  }

  return (
    <tr id={student.id} className="border-b hover:bg-slate-50 group">
      {/* 1. Row Index Number */}
      <td
        id={`nilai-cell-${index}--2`}
        tabIndex={-1}
        className="p-2 text-center border-b border-r border-slate-200 sticky z-20 bg-white group-hover:bg-slate-50  align-top box-border select-none cursor-default"
        style={{
          left: 0,
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
          ...getSelectionStyle(index, -2).selectionStyle,
        }}
        onMouseDown={(e) => handleMouseDownCell(e, index, -2, "nilai-cell")}
        onMouseEnter={() => handleMouseEnterCell(index, -2)}
      >
        {index + 1}
      </td>

      {/* 2. Student Full Name */}
      <td
        id={`nilai-cell-${index}--1`}
        tabIndex={-1}
        className="p-2 border-b border-r border-slate-200 align-top lg:sticky lg:z-20 bg-white group-hover:bg-slate-50 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] box-border select-none cursor-default"
        style={{
          left: "50px",
          ...getSelectionStyle(index, -1).selectionStyle,
        }}
        onMouseDown={(e) => handleMouseDownCell(e, index, -1, "nilai-cell")}
        onMouseEnter={() => handleMouseEnterCell(index, -1)}
      >
        {student.namaLengkap}
      </td>

      {/* 3. Render TP Grades */}
      {tpHeaders.map((h, colIdx) => {
        const { selectionStyle: style, showTransparentInput: showTrans } = getSelectionStyle(index, colIdx);
        const cellValue = detailedGrade?.slm?.find((s) => s.id === h.slmId)?.scores?.[h.tpIndex] ?? null;

        return (
          <td
            key={`${student.id}-${h.slmId}-${h.tpIndex}`}
            className="p-1 border-b border-l border-slate-200 w-20 min-w-[5rem] align-top relative cursor-default select-none"
            style={style}
            onMouseDown={(e) => handleMouseDownCell(e, index, colIdx, "nilai-cell")}
            onMouseEnter={() => handleMouseEnterCell(index, colIdx)}
          >
            <NilaiTableGradingCell
              id={`nilai-cell-${index}-${colIdx}`}
              value={cellValue}
              mode={mode}
              settings={settings}
              onChange={(newVal) => handleSingleGradeChange(student.id, newVal, "tp", h.slmId, h.tpIndex)}
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "tp", h.slmId, h.tpIndex)}
              onPaste={(e) => handlePaste(e, student.id, `tp|${h.slmId}|${h.tpIndex}`)}
              onFocus={() => handleFocusCell(index, colIdx)}
              
              showTransparentInput={showTrans}
              className="w-full p-2 text-center"
            />
          </td>
        );
      })}

      <StsSasCells
        student={student}
        index={index}
        detailedGrade={detailedGrade}
        mode={mode}
        settings={settings}
        tpHeadersLength={tpHeaders.length}
        getSelectionStyle={getSelectionStyle}
        handleMouseDownCell={handleMouseDownCell}
        handleMouseEnterCell={handleMouseEnterCell}
        handleSingleGradeChange={handleSingleGradeChange}
        handlePaste={handlePaste}
        handleFocusCell={handleFocusCell}
      />
      {/* 6. Nilai Akhir */}
      <td className="p-1 border-b border-l border-slate-200 w-20 min-w-[5rem] text-center font-bold align-top pt-3 select-none">
        {total}
      </td>

      {/* 7. Capaian Kompetensi */}
      <NilaiTableCapaianCell
        studentId={student.id}
        descriptions={descriptions}
        handleDescriptionChange={handleDescriptionChange}
        isCapaianPinned={isCapaianPinned}
      />
    </tr>
  );
}, (prev, next) => {
  if (prev.student.id !== next.student.id) return false;
  if (prev.student.namaLengkap !== next.student.namaLengkap) return false;
  if (prev.index !== next.index) return false;
  if (prev.subject.id !== next.subject.id) return false;
  if (prev.objectivesForSubject !== next.objectivesForSubject) return false;
  if (prev.settings !== next.settings) return false;
  if (prev.activeSlmIds !== next.activeSlmIds) return false;
  if (prev.tpHeaders !== next.tpHeaders) return false;
  if (prev.isCapaianPinned !== next.isCapaianPinned) return false;
  if (prev.mode !== next.mode) return false;

  // Compare selection styles for all columns (including -1, -2 and up to tpHeaders.length + 2)
  const maxCols = prev.tpHeaders.length + 2; 
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

  return true; // No changes to display, safe to skip re-render
});;
