import React, { useEffect } from "react";
import { COCURRICULAR_DIMENSIONS } from "../../constants";
import { getClipboardText } from "../../utils/clipboard";
import { useGridSelection } from "../../hooks/useGridSelection";
import { useStudentsStore } from "../../stores/useStudentsStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useCocurricularStore } from "../../stores/useCocurricularStore";

export const useDataKokurikulerPageLogic = (props: any) => {
  const storeStudents = useStudentsStore((state) => state.students);
  const storeSettings = useSettingsStore((state) => state.settings);
  const storeCocurricularData = useCocurricularStore((state) => state.cocurricularData);

  const students = props.students || storeStudents;
  const settings = props.settings || storeSettings;
  const cocurricularData = props.cocurricularData || storeCocurricularData;
  const showToast = props.showToast;

  const onUpdateCocurricularData = props.onUpdateCocurricularData || ((sid: string, did: string, val: any) => {
    useCocurricularStore.getState().updateCocurricularData(sid, did, val, settings?.semester);
  });

  const onSettingsChange = props.onSettingsChange || ((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    useSettingsStore.getState().updateSettingValue(name, value);
  });

  const currentSemester = settings?.semester || "Ganjil";
  const dimensionField = currentSemester === "Genap" ? "dimensionRatings_Genap" : "dimensionRatings";

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
    colsCount: COCURRICULAR_DIMENSIONS.length,
    minColIndex: -2,
    containerClass: "cocurricular-table-container",
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r >= 0 && c >= 0) {
            const student = students[r];
            const dim = COCURRICULAR_DIMENSIONS[c];
            if (student && dim) {
              const currentVal = cocurricularData[student.id]?.[dimensionField]?.[dim.id];
              if (currentVal !== null && currentVal !== undefined && currentVal !== "") {
                onUpdateCocurricularData(student.id, dim.id, null);
                updatedCount++;
              }
            }
          }
        }
      }
      if (updatedCount > 0 && showToast) {
        showToast(`${updatedCount} data berhasil dihapus.`, "success");
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
            else if (c === -1) rowData.push("Nama Siswa");
            else rowData.push(COCURRICULAR_DIMENSIONS[c]?.label || "");
          } else {
            const student = students[r];
            if (student) {
              if (c === -2) {
                rowData.push(r + 1);
              } else if (c === -1) {
                rowData.push(student.namaLengkap);
              } else {
                const dim = COCURRICULAR_DIMENSIONS[c];
                const val =
                  cocurricularData[student.id]?.[dimensionField]?.[dim.id] ||
                  "";
                rowData.push(val);
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
  }, [getSelectionBounds, students, cocurricularData, dimensionField, showToast]);

  const handleRatingChange = (studentId: string, dimensionId: string, value: string) => {
    onUpdateCocurricularData(
      studentId,
      dimensionId,
      value === "" ? null : value.toUpperCase(),
    );
  };

  const handlePaste = async (e: any, startStudentId: string, startDimensionId: string) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);
    if (!pasteData) return;

    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }

    if (rows.length === 0) return;

    const studentIndex = students.findIndex((s: any) => s.id === startStudentId);
    const dimensionIndex = COCURRICULAR_DIMENSIONS.findIndex(
      (d) => d.id === startDimensionId,
    );

    if (studentIndex === -1 || dimensionIndex === -1) return;

    let updatedCount = 0;

    rows.forEach((row, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;
      const student = students[currentStudentIndex];

      let columns = row.split("\t");
      if (!row.includes("\t") && row.includes(";")) {
        columns = row.split(";");
      } else if (!row.includes("\t") && !row.includes(";")) {
        const spaceParts = row.trim().split(/\s+/);
        if (spaceParts.length > 1) {
          const isProbablySpaceSeparated = spaceParts.every((part) => {
            const clean = part.toUpperCase().trim();
            return (
              clean === "" ||
              clean === "-" ||
              ["SB", "BSH", "MB", "BB"].includes(clean)
            );
          });
          if (isProbablySpaceSeparated) {
            columns = spaceParts;
          }
        }
      }
      if (
        columns.length > 0 &&
        columns[0].trim().toLowerCase() === student.namaLengkap.toLowerCase()
      ) {
        columns = columns.slice(1);
      }

      columns.forEach((val, cIndex) => {
        const currentDimIndex = dimensionIndex + cIndex;
        if (currentDimIndex >= COCURRICULAR_DIMENSIONS.length) return;
        const dim = COCURRICULAR_DIMENSIONS[currentDimIndex];

        let cleanVal = val.trim();
        const upperVal = cleanVal.toUpperCase();
        if (["BB", "MB", "BSH", "SB", "-"].includes(upperVal)) {
          cleanVal = upperVal;
        }

        const finalVal = cleanVal === "" ? null : cleanVal;

        onUpdateCocurricularData(student.id, dim.id, finalVal);
        updatedCount++;
      });
    });

    if (updatedCount > 0 && showToast) {
      showToast(`${updatedCount} nilai berhasil ditempel.`, "success");
    }
  };

  const handleSetAllRatings = (dimensionId: string, rating: string) => {
    students.forEach((student: any) => {
      onUpdateCocurricularData(student.id, dimensionId, rating);
    });
    if (showToast) {
      showToast(
        `Nilai ${rating} diterapkan ke semua siswa untuk dimensi ini.`,
        "success",
      );
    }
  };

  return {
    students,
    settings,
    cocurricularData,
    currentSemester,
    dimensionField,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleRatingChange,
    handlePaste,
    handleSetAllRatings,
    onSettingsChange,
  };
};
