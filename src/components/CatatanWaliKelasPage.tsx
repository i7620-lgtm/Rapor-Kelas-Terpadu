import React from "react";
import { EmptyState } from "./EmptyState";
import { useCatatanWaliKelasPageLogic } from "./CatatanWaliKelas/useCatatanWaliKelasPageLogic";

const CatatanWaliKelasPage = (props: any) => {
  const {
    students,
    notes,
    getNoteKey,
    handleGenerateNote,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleNoteChange,
    handlePaste,
  } = useCatatanWaliKelasPageLogic(props);

  return React.createElement(
    "div",
    { className: "flex flex-col gap-4 pt-4 sm:pt-8" },
    React.createElement(
      "div",
      { className: "flex-shrink-0" },
      React.createElement(
        "h2",
        { className: "text-3xl font-bold text-zinc-800" },
        "Catatan Wali Kelas",
      ),
      React.createElement(
        "p",
        { className: "mt-1 text-zinc-600" },
        "Berikan catatan atau umpan balik mengenai perkembangan siswa selama satu semester.",
        React.createElement("br", null),
        React.createElement(
          "span",
          { className: "text-sm text-zinc-900" },
          "💡 Tips: Anda dapat copy-paste catatan dari Excel/Word ke kolom Catatan.",
        ),
      ),
    ),

    students.length === 0
      ? React.createElement(EmptyState, {
          title: "Belum ada data siswa",
          description: "Catatan wali kelas tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
        })
      : React.createElement(
          "div",
          {
            className:
              "bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden",
            onMouseLeave: () => {
              if (isSelecting) setIsSelecting(false);
            }
          },
          React.createElement(
            "div",
            { className: "flex-1 overflow-auto select-none catatan-table-container" },
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
                        "px-6 py-3 border-b border-zinc-200/60 min-w-[250px] sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-zinc-100 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none",
                      style: getSelectionStyle(-1, -1).selectionStyle,
                      onMouseDown: (e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, -1);
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, -1),
                    },
                    "Nama Lengkap",
                  ),
                  React.createElement(
                    "th",
                    {
                      scope: "col",
                      className:
                        "px-6 py-3 border-b border-zinc-200/60 min-w-[400px] relative cursor-default select-none",
                      style: getSelectionStyle(-1, 0).selectionStyle,
                      onMouseDown: (e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, 0);
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, 0),
                    },
                    "Catatan Wali Kelas",
                  ),
                ),
              ),
              React.createElement(
                "tbody",
                null,
                students.map((student: any, index: number) => {
                  const {
                      selectionStyle,
                      showTransparentInput,
                  } = getSelectionStyle(index, 0);

                  return React.createElement(
                    "tr",
                    {
                      key: student.id,
                      className: "bg-white hover:bg-[#fafafa] align-top",
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
                          "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap border-b border-zinc-200/60 lg:sticky lg:left-[50px] lg:z-20 bg-white lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none group-hover:bg-[#fafafa]",
                        style: getSelectionStyle(index, -1).selectionStyle,
                        onMouseDown: (e: any) => {
                            if (e.button !== 0) return;
                            handleMouseDownCell(e, index, -1);
                        },
                        onMouseEnter: () => handleMouseEnterCell(index, -1),
                      },
                      student.namaLengkap,
                    ),
                    React.createElement(
                      "td",
                      { 
                        className: "px-6 py-4 border-b border-zinc-200/60 relative cursor-default select-none",
                        style: selectionStyle,
                        onMouseDown: (e: any) => {
                            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
                            if (e.button !== 0) return;
                            handleMouseDownCell(e, index, 0);
                        },
                        onMouseEnter: () => handleMouseEnterCell(index, 0),
                      },
                      React.createElement("textarea", {
                        id: `cell-${index}-0`,
                        value: notes[getNoteKey(student.id)] || "",
                        onChange: (e) =>
                          handleNoteChange(student.id, e.target.value),
                        onFocus: () => handleFocusCell(index, 0),
                        onPaste: (e) => handlePaste(e, student.id),
                        placeholder: "Tulis catatan untuk siswa di sini...",
                        className: `w-full p-2 text-sm rounded-lg transition-all relative z-10 ${
                          showTransparentInput
                            ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                            : `bg-white border shadow-sm focus:ring-zinc-900 focus:border-zinc-900 ${
                                notes[getNoteKey(student.id)] && notes[getNoteKey(student.id)].trim() !== ""
                                  ? "border-green-500 ring-1 ring-green-500"
                                  : "border-red-500 ring-1 ring-red-500"
                              }`
                        }`,
                        rows: 4,
                        "aria-label": `Catatan wali kelas untuk ${student.namaLengkap}`,
                        onMouseDown: (e: any) => {
                            if (e.shiftKey) {
                                e.preventDefault();
                                handleMouseDownCell(e, index, 0);
                            }
                        }
                      }),
                      React.createElement(
                        "div",
                        { className: `flex justify-end mt-2 ${showTransparentInput ? 'opacity-0' : 'opacity-100'}` },
                        React.createElement(
                          "button",
                          {
                            onClick: () => handleGenerateNote(student),
                            className:
                              "px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors",
                            title:
                              "Buat catatan cerdas berdasarkan peringkat dan nilai siswa",
                          },
                          "Buat Catatan Otomatis",
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
  );
};

export default CatatanWaliKelasPage;
