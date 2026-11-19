import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGridSelection } from "../../hooks/useGridSelection";
import { useTableVirtualizer } from "../../hooks/useTableVirtualizer";
import { getClipboardText } from "../../utils/clipboard";
import { useStudentsStore } from "../../stores/useStudentsStore";
import { useAttendanceStore } from "../../stores/useAttendanceStore";
import { useSettingsStore } from "../../stores/useSettingsStore";

const parsePastedData = (pasteData: string) => {
  if (!pasteData || typeof pasteData !== "string") {
    return { isHorizontal: false, grid: [] };
  }
  const trimmed = pasteData.trim();
  if (!trimmed) {
    return { isHorizontal: false, grid: [] };
  }

  // Case 1: Has newlines -> standard vertical rows
  if (/[\r\n]/.test(trimmed)) {
    const lines = trimmed.split(/\r\n|\n|\r/);
    if (lines.length > 1 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    const grid = lines.map((line) => {
      if (line.includes("\t")) return line.split("\t");
      if (line.includes(";")) return line.split(";");
      return [line];
    });
    return { isHorizontal: false, grid };
  }

  // Case 2: No newlines, but contains tabs -> horizontal spreadsheet columns
  if (trimmed.includes("\t")) {
    return { isHorizontal: true, grid: [trimmed.split("\t")] };
  }

  // Case 3: No newlines, contains semicolons -> vertical list
  if (trimmed.includes(";")) {
    const parts = trimmed.split(";").map((p) => p.trim());
    return { isHorizontal: false, grid: parts.map((p) => [p]) };
  }

  // Case 4: No newlines, contains commas -> check if list or decimal
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    let isDecimal = false;
    if (parts.length === 2) {
      const firstPart = parts[0];
      const secondPart = parts[1];
      if (/^\d$/.test(secondPart) && /^\d+$/.test(firstPart)) {
        isDecimal = true;
      }
    }
    if (!isDecimal) {
      return { isHorizontal: false, grid: parts.map((p) => [p]) };
    }
  }

  // Case 5: No newlines, contains spaces -> vertical list
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length > 1) {
    return { isHorizontal: false, grid: spaceParts.map((p) => [p]) };
  }

  // Case 6: Single value
  return { isHorizontal: false, grid: [[trimmed]] };
};

export const useDataAbsensiPageLogic = (props: any) => {
  const storeStudents = useStudentsStore((state) => state.students);
  const storeAttendance = useAttendanceStore((state) => state.attendance);
  const storeSettings = useSettingsStore((state) => state.settings);

  const students = props.students || storeStudents;
  const attendance = props.attendance || storeAttendance;
  const settings = props.settings || storeSettings;
  const showToast = props.showToast;

  const onUpdateAttendance = props.onUpdateAttendance || ((sid: string, field: string, val: string) => {
    useAttendanceStore.getState().updateAttendance(sid, field, val);
  });

  const onBulkUpdateAttendance = props.onBulkUpdateAttendance || ((newAttendance: any) => {
    useAttendanceStore.getState().setAttendance(newAttendance);
  });

  const attendanceByStudentIdMap = useMemo(() => {
    const map = new Map<string, any>();
    (attendance || []).forEach((a: any) => {
      if (a?.studentId && !map.has(a.studentId)) {
        map.set(a.studentId, a);
      }
    });
    return map;
  }, [attendance]);

  const getAttendanceForStudent = useCallback(
    (studentId: string) => {
      const studentAtt = attendanceByStudentIdMap.get(studentId);
      return {
        studentId,
        sakit: studentAtt?.sakit ?? null,
        izin: studentAtt?.izin ?? null,
        alpa: studentAtt?.alpa ?? null,
      };
    },
    [attendanceByStudentIdMap],
  );

  const fields = ["sakit", "izin", "alpa"];
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const getAbsensiRowKey = useCallback(
    (idx: number) => students[idx]?.id ?? idx,
    [students],
  );

  const {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
    scrollToIndex,
  } = useTableVirtualizer({
    count: students.length,
    scrollContainerRef,
    estimateRowHeight: 64,
    overscan: 8,
    getItemKey: getAbsensiRowKey,
  });

  const {
    isSelecting,
    setIsSelecting,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  } = useGridSelection({
    rowsCount: students.length,
    colsCount: 4, // sakit, izin, alpa, total -> index 0,1,2,3
    minColIndex: -2,
    containerClass: "absensi-table-container",
    onEnsureRowVisible: scrollToIndex,
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      const newAttendance = [...attendance];
      
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r >= 0 && c >= 0 && c < fields.length) {
            const student = students[r];
            const field = fields[c];
            if (student) {
              const idx = newAttendance.findIndex(a => a.studentId === student.id);
              if (idx > -1 && newAttendance[idx][field] !== null && newAttendance[idx][field] !== undefined) {
                newAttendance[idx] = { ...newAttendance[idx], [field]: null };
                updatedCount++;
              }
            }
          }
        }
      }
      if (updatedCount > 0) {
        onBulkUpdateAttendance(newAttendance);
        if (showToast) showToast(`${updatedCount} data berhasil dihapus.`, "success");
      }
    }
  });

  useEffect(() => {
    const handleCopyGlobal = (e: ClipboardEvent) => {
      const bounds = getSelectionBounds();
      if (!bounds) return;

      if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA")
        ) {
          return;
        }
      }

      let tsv = "";
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        let rowData = [];
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r === -1) {
            if (c === -2) rowData.push("No");
            else if (c === -1) rowData.push("Nama Lengkap");
            else if (c === 0) rowData.push("Sakit (S)");
            else if (c === 1) rowData.push("Izin (I)");
            else if (c === 2) rowData.push("Alpa (A)");
            else if (c === 3) rowData.push("Total");
          } else {
            const student = students[r];
            if (student) {
              if (c === -2) {
                rowData.push(r + 1);
              } else if (c === -1) {
                rowData.push(student.namaLengkap);
              } else if (c === 3) {
                const studentAtt = getAttendanceForStudent(student.id);
                const total =
                  (studentAtt.sakit ?? 0) +
                  (studentAtt.izin ?? 0) +
                  (studentAtt.alpa ?? 0);
                rowData.push(total);
              } else {
                const studentAtt = getAttendanceForStudent(student.id);
                const val: any = studentAtt[fields[c] as keyof typeof studentAtt];
                rowData.push(val ?? "");
              }
            }
          }
        }
        tsv += rowData.join("\t") + "\n";
      }

      if (tsv) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, students, getAttendanceForStudent, showToast]);

  const handleAttendanceChange = (studentId: string, type: string, value: string) => {
    onUpdateAttendance(studentId, type, value);
  };

  const handlePaste = async (e: any, startStudentId: string, startFieldType: string) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    const pasteData = await getClipboardText(e);

    const { grid } = parsePastedData(pasteData);
    if (grid.length === 0) return;

    const studentIndex = students.findIndex((s: any) => s.id === startStudentId);
    if (studentIndex === -1) return;

    const startFieldIndex = fields.indexOf(startFieldType);
    if (startFieldIndex === -1) return;

    const attendanceMap = new Map();
    attendance.forEach((a: any) => {
      if (a?.studentId && !attendanceMap.has(a.studentId)) {
        attendanceMap.set(a.studentId, a);
      }
    });
    const newAttendanceList: any[] = [];
    let updatedCount = 0;

    grid.forEach((columns, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;

      const student = students[currentStudentIndex];
      let record = attendanceMap.get(student.id) || {
        studentId: student.id,
        sakit: null,
        izin: null,
        alpa: null,
      };

      let rowUpdated = false;
      columns.forEach((value, cIndex) => {
        const currentFieldIndex = startFieldIndex + cIndex;
        if (currentFieldIndex < fields.length) {
          const fieldName = fields[currentFieldIndex];
          const cleanValue =
            value.trim() === "" ? null : parseInt(value.trim(), 10);

          if (cleanValue === null || !isNaN(cleanValue)) {
            record = { ...record, [fieldName]: cleanValue };
            rowUpdated = true;
          }
        }
      });

      if (rowUpdated) {
        newAttendanceList.push(record);
        attendanceMap.set(student.id, record);
        updatedCount++;
      }
    });

    if (newAttendanceList.length > 0) {
      const finalAttendance = attendance.map((a: any) => {
        const updated = newAttendanceList.find(
          (u) => u.studentId === a.studentId,
        );
        return updated || a;
      });

      newAttendanceList.forEach((newItem) => {
        if (!finalAttendance.some((a: any) => a.studentId === newItem.studentId)) {
          finalAttendance.push(newItem);
        }
      });

      onBulkUpdateAttendance(finalAttendance);
      if (showToast) {
        showToast(`${updatedCount} data absensi berhasil ditempel.`, "success");
      }
    }
  };

  return {
    students,
    attendance,
    settings,
    getAttendanceForStudent,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleAttendanceChange,
    handlePaste,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  };
};
