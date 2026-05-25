import React, { useCallback } from "react";
import { useGridSelection } from "../hooks/useGridSelection";
import { getClipboardText } from "../utils/clipboard.js";

const splitRowIntoColumns = (row) => {
  if (typeof row !== "string") return [row];
  const trimmed = row.trim();
  if (trimmed.includes("\t")) {
    return trimmed.split("\t");
  }
  if (trimmed.includes(";")) {
    return trimmed.split(";");
  }
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length > 1) {
    const isProbablySpaceSeparated = spaceParts.every((part) => {
      const clean = part.toUpperCase().trim();
      return (
        clean === "" ||
        clean === "-" ||
        !isNaN(parseFloat(clean.replace(",", ".")))
      );
    });
    if (isProbablySpaceSeparated) {
      return spaceParts;
    }
  }
  return [row];
};

const parsePastedData = (pasteData) => {
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

const DataAbsensiPage = ({
  students,
  attendance,
  onUpdateAttendance,
  onBulkUpdateAttendance,
  showToast,
  settings,
}) => {
  const getAttendanceForStudent = useCallback(
    (studentId) => {
      const sem = settings?.semester || 'Ganjil';
      const studentAtt = attendance.find((a) => a.studentId === studentId && (a.semester || 'Ganjil') === sem);
      return {
        studentId,
        semester: sem,
        sakit: studentAtt?.sakit ?? null,
        izin: studentAtt?.izin ?? null,
        alpa: studentAtt?.alpa ?? null,
      };
    },
    [attendance, settings?.semester],
  );

  const fields = ["sakit", "izin", "alpa"];
  const {
    isSelecting,
    setIsSelecting,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
  } = useGridSelection({
    rowsCount: students.length,
    colsCount: 4, // sakit, izin, alpa, total -> index 0,1,2,3
    containerClass: "absensi-table-container",
  });

  React.useEffect(() => {
    const handleCopyGlobal = (e) => {
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
                const val = studentAtt[fields[c]];
                rowData.push(val ?? "");
              }
            }
          }
        }
        tsv += rowData.join("\t") + "\n";
      }

      if (tsv) {
        e.preventDefault();
        e.clipboardData.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, students, getAttendanceForStudent, showToast]);

  const handleAttendanceChange = (studentId, type, value) => {
    onUpdateAttendance(studentId, type, value);
  };

  const handlePaste = async (e, startStudentId, startFieldType) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);

    const { grid } = parsePastedData(pasteData);
    if (grid.length === 0) return;

    const studentIndex = students.findIndex((s) => s.id === startStudentId);
    if (studentIndex === -1) return;

    // Define field order for column mapping
    const fields = ["sakit", "izin", "alpa"];
    const startFieldIndex = fields.indexOf(startFieldType);

    if (startFieldIndex === -1) return;

    const sem = settings?.semester || 'Ganjil';
    // Create a map of existing attendance to avoid O(N^2) lookups
    const attendanceMap = new Map();
    attendance.forEach((a) => {
      if ((a.semester || 'Ganjil') === sem) {
        attendanceMap.set(a.studentId, a);
      }
    });
    const newAttendanceList = [];
    let updatedCount = 0;

    grid.forEach((columns, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;

      const student = students[currentStudentIndex];
      // Use existing record or create new empty one
      let record = attendanceMap.get(student.id) || {
        studentId: student.id,
        semester: sem,
        sakit: null,
        izin: null,
        alpa: null,
      };

      let rowUpdated = false;
      columns.forEach((value, cIndex) => {
        const currentFieldIndex = startFieldIndex + cIndex;
        if (currentFieldIndex < fields.length) {
          const fieldName = fields[currentFieldIndex];
          // Convert empty string to null, otherwise parse int
          const cleanValue =
            value.trim() === "" ? null : parseInt(value.trim(), 10);

          // Update if value is valid number or null (clearing)
          if (cleanValue === null || !isNaN(cleanValue)) {
            record = { ...record, [fieldName]: cleanValue };
            rowUpdated = true;
          }
        }
      });

      if (rowUpdated) {
        newAttendanceList.push(record);
        // Update map to ensure subsequent logic uses latest if needed (though we push to list)
        attendanceMap.set(student.id, record);
        updatedCount++;
      }
    });

    const bounds = getSelectionBounds();
    if (bounds) {
      // Apply bounds handling if needed, but for paste we generally handle from a specific start point.
      // DataKokurikuler limits paste to selection if multi-select, wait, DataKokurikuler didn't do grid restriction on paste. It just pasted starting from the selected cell!
    }

    if (newAttendanceList.length > 0) {
      // Merge new records with existing ones that weren't touched
      const finalAttendance = attendance.map((a) => {
        const updated = newAttendanceList.find(
          (u) => u.studentId === a.studentId && (u.semester || 'Ganjil') === (a.semester || 'Ganjil'),
        );
        return updated || a;
      });

      // Add records for students who didn't have attendance yet but were in the paste list
      newAttendanceList.forEach((newItem) => {
        if (!finalAttendance.some((a) => a.studentId === newItem.studentId && (a.semester || 'Ganjil') === (newItem.semester || 'Ganjil'))) {
          finalAttendance.push(newItem);
        }
      });

      onBulkUpdateAttendance(finalAttendance);
      showToast &&
        showToast(`${updatedCount} data absensi berhasil ditempel.`, "success");
    }
  };

  return React.createElement(
    "div",
    { className: "flex flex-col gap-4 pt-4 sm:pt-8" },
    React.createElement(
      "div",
      { className: "flex-shrink-0" },
      React.createElement(
        "h2",
        { className: "text-3xl font-bold text-zinc-800" },
        "Data Absensi",
      ),
      React.createElement(
        "p",
        { className: "mt-1 text-zinc-600" },
        "Catat jumlah ketidakhadiran siswa selama satu semester. Kosongkan kolom jika tidak ada ketidakhadiran.",
        React.createElement("br", null),
        React.createElement(
          "span",
          { className: "text-sm text-zinc-900" },
          "💡 Tips: Anda dapat copy-paste data dari Excel ke kolom Sakit, Izin, atau Alpa.",
        ),
      ),
    ),
    students.length === 0
      ? React.createElement(
          "div",
          {
            className:
              "bg-white p-10 rounded-xl shadow-sm border border-zinc-200/60 text-center flex items-center justify-center min-h-[400px]",
          },
          React.createElement(
            "div",
            null,
            React.createElement(
              "h3",
              { className: "text-lg font-semibold mb-2 text-zinc-800" },
              "Belum ada data siswa",
            ),
            React.createElement(
              "p",
              { className: "text-zinc-500" },
              "Silakan tambahkan siswa di halaman 'Data Siswa'.",
            ),
          ),
        )
      : React.createElement(
          "div",
          {
            className:
              "bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden",
            onMouseLeave: () => {
              if (isSelecting) setIsSelecting(false);
            },
          },
          React.createElement(
            "div",
            {
              className:
                "flex-1 overflow-auto select-none absensi-table-container",
            },
            React.createElement(
              "table",
              {
                className:
                  "w-full text-sm text-left text-zinc-500 border-separate border-spacing-0",
              },
              React.createElement(
                "thead",
                {
                  className:
                    "text-xs text-zinc-700 uppercase bg-zinc-100 sticky top-0 z-30",
                },
                React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "th",
                    {
                      scope: "col",
                      className:
                        "px-6 py-3 sticky left-0 z-40 bg-zinc-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-zinc-200/60 relative cursor-default select-none",
                      style: getSelectionStyle(-1, -2).selectionStyle,
                      onMouseDown: (e) => {
                        if (e.button !== 0) return;
                        handleMouseDownCell(e, -1, -2);
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, -2),
                    },
                    "No",
                  ),
                  React.createElement(
                    "th",
                    {
                      scope: "col",
                      className:
                        "px-6 py-3 border-b border-zinc-200/60 min-w-[200px] relative cursor-default select-none",
                      style: getSelectionStyle(-1, -1).selectionStyle,
                      onMouseDown: (e) => {
                        if (e.button !== 0) return;
                        handleMouseDownCell(e, -1, -1);
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, -1),
                    },
                    "Nama Lengkap",
                  ),
                  ["Sakit (S)", "Izin (I)", "Alpa (A)"].map((colName, cIndex) =>
                    React.createElement(
                      "th",
                      {
                        key: colName,
                        scope: "col",
                        className:
                          "px-4 py-3 text-center border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(-1, cIndex).selectionStyle,
                        onMouseDown: (e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, cIndex);
                        },
                        onMouseEnter: () => handleMouseEnterCell(-1, cIndex),
                      },
                      colName,
                    ),
                  ),
                  React.createElement(
                    "th",
                    {
                      scope: "col",
                      className:
                        "px-6 py-3 text-center border-b border-zinc-200/60 relative cursor-default select-none",
                      style: getSelectionStyle(-1, 3).selectionStyle,
                      onMouseDown: (e) => {
                        if (e.button !== 0) return;
                        handleMouseDownCell(e, -1, 3);
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, 3),
                    },
                    "Total",
                  ),
                ),
              ),
              React.createElement(
                "tbody",
                null,
                students.map((student, index) => {
                  const studentAtt = getAttendanceForStudent(student.id);
                  const total =
                    (studentAtt.sakit ?? 0) +
                    (studentAtt.izin ?? 0) +
                    (studentAtt.alpa ?? 0);
                  return React.createElement(
                    "tr",
                    {
                      key: student.id,
                      className: "bg-white hover:bg-[#fafafa]",
                    },
                    React.createElement(
                      "td",
                      {
                        className:
                          "px-6 py-4 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(index, -2).selectionStyle,
                        onMouseDown: (e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -2);
                        },
                        onMouseEnter: () => handleMouseEnterCell(index, -2),
                      },
                      index + 1,
                    ),
                    React.createElement(
                      "th",
                      {
                        scope: "row",
                        className:
                          "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(index, -1).selectionStyle,
                        onMouseDown: (e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -1);
                        },
                        onMouseEnter: () => handleMouseEnterCell(index, -1),
                      },
                      student.namaLengkap,
                    ),
                    ["sakit", "izin", "alpa"].map((field, cIndex) => {
                      const {
                        selectionStyle,
                        showTransparentInput,
                      } = getSelectionStyle(index, cIndex);

                      return React.createElement(
                        "td",
                        {
                          key: field,
                          className:
                            "px-4 py-2 text-center border-b border-zinc-200/60 relative cursor-default select-none",
                          style: selectionStyle,
                          onMouseDown: (e) => {
                            if (e.target.tagName === "INPUT") return;
                            if (e.button !== 0) return;
                            handleMouseDownCell(e, index, cIndex);
                          },
                          onMouseEnter: () =>
                            handleMouseEnterCell(index, cIndex),
                        },
                        React.createElement("input", {
                          id: `cell-${index}-${cIndex}`,
                          type: "text",
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          value: studentAtt[field] ?? "",
                          onChange: (e) => {
                            const val = e.target.value;
                            const hasSeparators = /[\n\r\t;]/.test(val) || (/\s+/.test(val.trim()) && val.trim().split(/\s+/).length > 1);
                            if (hasSeparators) {
                              handlePaste({
                                preventDefault: () => {},
                                clipboardData: {
                                  getData: () => val
                                }
                              }, student.id, field);
                              return;
                            }
                            if (val === "" || /^\d*$/.test(val)) {
                              handleAttendanceChange(
                                student.id,
                                field,
                                val,
                              );
                            }
                          },
                          onPaste: (e) => handlePaste(e, student.id, field),
                          className: `w-20 p-2 text-center rounded-lg transition-all relative z-10 ${
                            showTransparentInput
                              ? "bg-transparent border-transparent shadow-none focus:outline-none focus:ring-0"
                              : `bg-white border shadow-sm focus:ring-zinc-900 focus:border-zinc-900 ${
                                  studentAtt[field] !== null &&
                                  studentAtt[field] !== undefined &&
                                  studentAtt[field] !== ""
                                    ? "border-green-500 ring-1 ring-green-500"
                                    : "border-red-500 ring-1 ring-red-500"
                                }`
                          }`,
                          "aria-label": `Jumlah ${field} untuk ${student.namaLengkap}`,
                          onMouseDown: (e) => {
                            if (e.shiftKey) {
                              e.preventDefault();
                              handleMouseDownCell(e, index, cIndex);
                            }
                          },
                        }),
                      );
                    }),
                    React.createElement(
                      "td",
                      {
                        className:
                          "px-6 py-4 text-center font-semibold text-zinc-800 border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(index, 3).selectionStyle,
                        onMouseDown: (e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, 3);
                        },
                        onMouseEnter: () => handleMouseEnterCell(index, 3),
                      },
                      total,
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
  );
};

export default DataAbsensiPage;
