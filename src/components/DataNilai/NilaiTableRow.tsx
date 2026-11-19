import React, { useMemo } from "react";
import { NilaiTableGradingCell } from "./NilaiTableGradingCell";
import { NilaiTableCapaianCell } from "./NilaiTableCapaianCell";
import { generateSubjectDescription } from "../../utils/nilaiHelpers";
import { useNilaiStore } from "../../stores/useNilaiStore";
import { StsSasCells } from "./NilaiTableRowParts";
import type { GridSelectionBounds } from "../../hooks/useGridSelection";

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
    displayIndex: number | string;
  }>;
  selectionBounds?: GridSelectionBounds | null;
  getSelectionStyle: (
    row: number,
    col: number
  ) => { selectionStyle?: React.CSSProperties; showTransparentInput: boolean; isCellSelected?: boolean };
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
    slmId?: string | null,
    tpIndex?: number | null
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
  onRowRef?: (index: number, el: HTMLTableRowElement | null) => void;
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
    onRowRef,
  } = props;
  
  const detailedGrade = useNilaiStore(
    (state) => state.gradesByStudentId[student.id]?.detailedGrades?.[subject.id]
  );
  const finalVal = useNilaiStore(
    (state) => state.gradesByStudentId[student.id]?.finalGrades?.[subject.id]
  );

  const slmScoresMap = useMemo(() => {
    const map = new Map<string, any[]>();
    const slmList = detailedGrade?.slm;
    if (Array.isArray(slmList)) {
      for (let i = 0; i < slmList.length; i++) {
        const item = slmList[i];
        if (item?.id) {
          map.set(item.id, item.scores || []);
        }
      }
    }
    return map;
  }, [detailedGrade?.slm]);

  const savedDescriptions = detailedGrade?.descriptions;
  const descriptions = useMemo(() => {
    const hasSavedHighest = Boolean(
      savedDescriptions?.highest && savedDescriptions.highest.trim()
    );
    const hasSavedLowest = Boolean(
      savedDescriptions?.lowest && savedDescriptions.lowest.trim()
    );

    if (hasSavedHighest && hasSavedLowest) {
      return {
        highest: savedDescriptions!.highest,
        lowest: savedDescriptions!.lowest,
      };
    }

    const generated = generateSubjectDescription(
      student,
      detailedGrade || {
        slm: [],
        sts: null,
        sas: null,
      },
      objectivesForSubject,
      settings,
      activeSlmIds,
    );

    return {
      highest: hasSavedHighest ? savedDescriptions!.highest : generated.highest,
      lowest: hasSavedLowest ? savedDescriptions!.lowest : generated.lowest,
    };
  }, [student, detailedGrade, savedDescriptions, objectivesForSubject, settings, activeSlmIds]);

  let total = "-";
  let isFinalBelowKkm = false;
  let isFinalMissing = true;
  const kkmVal = parseInt(settings?.predikats?.c, 10);
  if (detailedGrade) {
    if (finalVal !== null && finalVal !== undefined && String(finalVal).trim() !== "") {
      total = String(finalVal);
      isFinalMissing = false;
      const numFinal = typeof finalVal === "number" ? finalVal : parseFloat(finalVal);
      if (!isNaN(numFinal) && !isNaN(kkmVal) && numFinal < kkmVal) {
        isFinalBelowKkm = true;
      }
    }
  }

  return (
    <tr
      ref={(el) => onRowRef?.(index, el)}
      id={student.id}
      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/70 focus-within:bg-slate-50 dark:focus-within:bg-slate-800/70 group"
    >
      {/* 1. Row Index Number */}
      <td
        id={`nilai-cell-${index}--2`}
        tabIndex={-1}
        className={`w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] p-1.5 sm:p-2 text-center tabular-nums border-b border-r border-slate-200 dark:border-slate-700 sticky z-20 align-top box-border select-none cursor-default shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none ${
          isFinalMissing
            ? "bg-amber-100 text-amber-900 font-bold dark:bg-amber-900/40 dark:text-amber-200"
            : isFinalBelowKkm
              ? "bg-rose-100 text-red-700 font-bold dark:bg-rose-900/40 dark:text-red-200"
              : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
        }`}
        style={{
          left: 0,
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
        className={`p-1.5 sm:p-2 border-b border-r border-slate-200 dark:border-slate-700 align-top static lg:sticky lg:left-[50px] lg:z-20 w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] box-border select-none cursor-default ${
          isFinalMissing
            ? "bg-amber-100 text-amber-900 font-medium dark:bg-amber-900/40 dark:text-amber-200"
            : isFinalBelowKkm
              ? "bg-rose-100 text-red-700 font-medium dark:bg-rose-900/40 dark:text-red-200"
              : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
        }`}
        style={{
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
        const cellValue = slmScoresMap.get(h.slmId)?.[h.tpIndex] ?? null;

        return (
          <td
            key={`${student.id}-${h.slmId}-${h.tpIndex}`}
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
              onCommit={(newVal) => handleSingleGradeChange(student.id, newVal, "tp", h.slmId, h.tpIndex)}
              onPaste={(e) => handlePaste(e, student.id, `tp|${h.slmId}|${h.tpIndex}`)}
              onFocus={() => handleFocusCell(index, colIdx)}
              
              showTransparentInput={showTrans}
              className="w-full p-2 text-center tabular-nums"
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
      <td className={`p-1 border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem] text-center font-bold tabular-nums align-top pt-3 select-none ${
        isFinalMissing
          ? "text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
          : isFinalBelowKkm
            ? "text-red-600 bg-rose-50 dark:bg-rose-900/30 dark:text-red-300"
            : "text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
      }`}>
        <span className={isFinalBelowKkm ? "px-1.5 py-0.5 rounded border border-red-300 dark:border-red-700 bg-rose-100 dark:bg-rose-900/50 inline-block font-extrabold text-red-600 dark:text-red-200 tabular-nums" : isFinalMissing ? "text-amber-600 dark:text-amber-300 font-bold" : "tabular-nums"}>
          {total}
        </span>
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

  if (prev.selectionBounds !== next.selectionBounds) {
    if (prev.selectionBounds !== undefined || next.selectionBounds !== undefined) {
      const prevInRow = Boolean(
        prev.selectionBounds &&
        prev.index >= prev.selectionBounds.minR &&
        prev.index <= prev.selectionBounds.maxR
      );
      const nextInRow = Boolean(
        next.selectionBounds &&
        next.index >= next.selectionBounds.minR &&
        next.index <= next.selectionBounds.maxR
      );
      if (!prevInRow && !nextInRow) {
        return true;
      }
    }
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
  }

  return true; // No changes to display, safe to skip re-render
});
