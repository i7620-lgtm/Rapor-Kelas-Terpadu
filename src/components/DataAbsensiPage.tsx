import React from "react";
import { EmptyState } from "./EmptyState";
import { useDataAbsensiPageLogic } from "./DataAbsensi/useDataAbsensiPageLogic";

const DataAbsensiPage = (props: any) => {
  const {
    students,
    getAttendanceForStudent,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleAttendanceChange,
    handlePaste,
  } = useDataAbsensiPageLogic(props);

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
      ? React.createElement(EmptyState, {
          title: "Belum ada data siswa",
          description: "Data absensi tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
        })
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
                        "w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 text-center sticky left-0 top-0 z-40 bg-zinc-100  border-b border-zinc-200/60 relative cursor-default select-none",
                      style: getSelectionStyle(-1, -2).selectionStyle,
                      onMouseDown: (e: any) => {
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
                        "px-6 py-3 border-b border-zinc-200/60 min-w-[200px] sticky left-[50px] top-0 z-40 bg-zinc-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none",
                      style: getSelectionStyle(-1, -1).selectionStyle,
                      onMouseDown: (e: any) => {
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
                        onMouseDown: (e: any) => {
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
                      onMouseDown: (e: any) => {
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
                students.map((student: any, index: number) => {
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
                        id: `cell-${index}--2`,
                        tabIndex: -1,
                        className:
                          "w-[50px] min-w-[50px] max-w-[50px] px-2 py-4 text-center sticky left-0 z-20 bg-white  border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(index, -2).selectionStyle,
                        onMouseDown: (e: any) => {
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
                        id: `cell-${index}--1`,
                        tabIndex: -1,
                        scope: "row",
                        className:
                          "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap border-b border-zinc-200/60 sticky left-[50px] z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none group-hover:bg-[#fafafa]",
                        style: getSelectionStyle(index, -1).selectionStyle,
                        onMouseDown: (e: any) => {
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
                          onMouseDown: (e: any) => {
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
                          value: studentAtt[field as keyof typeof studentAtt] ?? "",
                          onChange: (e: any) => {
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
                          onFocus: () => handleFocusCell(index, cIndex),
                          onPaste: (e) => handlePaste(e, student.id, field),
                          className: `w-20 p-2 text-center rounded-lg transition-all relative z-10 ${
                            showTransparentInput
                              ? "bg-transparent border-transparent shadow-none focus:outline-none focus:ring-0"
                              : `bg-white border shadow-sm focus:ring-zinc-900 focus:border-zinc-900 ${
                                  studentAtt[field as keyof typeof studentAtt] !== null &&
                                  studentAtt[field as keyof typeof studentAtt] !== undefined &&
                                  studentAtt[field as keyof typeof studentAtt] !== ""
                                    ? "border-green-500 ring-1 ring-green-500"
                                    : "border-red-500 ring-1 ring-red-500"
                                }`
                          }`,
                          "aria-label": `Jumlah ${field} untuk ${student.namaLengkap}`,
                          onMouseDown: (e: any) => {
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
                        id: `cell-${index}-3`,
                        tabIndex: -1,
                        className:
                          "px-6 py-4 text-center font-semibold text-zinc-800 border-b border-zinc-200/60 relative cursor-default select-none",
                        style: getSelectionStyle(index, 3).selectionStyle,
                        onMouseDown: (e: any) => {
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
