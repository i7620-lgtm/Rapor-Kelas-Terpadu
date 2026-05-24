import React from "react";
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from "../constants.js";

const DataKokurikulerPage = ({
  students,
  settings,
  cocurricularData,
  onSettingsChange,
  onUpdateCocurricularData,
  showToast,
}) => {
  const [selectionStart, setSelectionStart] = React.useState(null);
  const [selectionEnd, setSelectionEnd] = React.useState(null);
  const [isSelecting, setIsSelecting] = React.useState(false);

  const handleMouseDownCell = (e, rowIndex, colIndex) => {
    if (e.shiftKey && selectionStart) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    } else {
      setIsSelecting(true);
      setSelectionStart({ r: rowIndex, c: colIndex });
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }
  };

  const handleMouseEnterCell = (rowIndex, colIndex) => {
    if (isSelecting) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }
  };

  React.useEffect(() => {
    const handleMouseUpGlobal = () => setIsSelecting(false);
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
  }, []);

  const getSelectionBounds = () => {
    if (!selectionStart || !selectionEnd) return null;
    return {
      minR: Math.min(selectionStart.r, selectionEnd.r),
      maxR: Math.max(selectionStart.r, selectionEnd.r),
      minC: Math.min(selectionStart.c, selectionEnd.c),
      maxC: Math.max(selectionStart.c, selectionEnd.c),
    };
  };

  const handleCopy = (e) => {
    const bounds = getSelectionBounds();
    if (!bounds) return;

    // Do not override standard copy if only one cell is selected,
    // to allow normal text selection within the input.
    if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
      return;
    }

    let tsv = "";
    for (let r = bounds.minR; r <= bounds.maxR; r++) {
      const student = students[r];
      let rowData = [];
      for (let c = bounds.minC; c <= bounds.maxC; c++) {
        const dim = COCURRICULAR_DIMENSIONS[c];
        const val =
          cocurricularData[student.id]?.dimensionRatings?.[dim.id] || "";
        rowData.push(val);
      }
      tsv += rowData.join("\t") + "\n";
    }

    if (tsv) {
      e.cancelBubble = true;
      e.preventDefault();
      e.clipboardData.setData("text/plain", tsv.trimEnd());
      showToast("Berhasil disalin ke clipboard", "success");
    }
  };

  const handleRatingChange = (studentId, dimensionId, value) => {
    // Convert empty string to null, otherwise keep value as is (text input)
    onUpdateCocurricularData(
      studentId,
      dimensionId,
      value === "" ? null : value.toUpperCase(),
    );
  };

  const handlePaste = (e, startStudentId, startDimensionId) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");

    // Split rows by newline, PRESERVING empty rows to maintain index alignment
    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }

    if (rows.length === 0) return;

    const studentIndex = students.findIndex((s) => s.id === startStudentId);
    const dimensionIndex = COCURRICULAR_DIMENSIONS.findIndex(
      (d) => d.id === startDimensionId,
    );

    if (studentIndex === -1 || dimensionIndex === -1) return;

    let updatedCount = 0;

    rows.forEach((row, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;
      const student = students[currentStudentIndex];

      const columns = row.split("\t");
      columns.forEach((val, cIndex) => {
        const currentDimIndex = dimensionIndex + cIndex;
        if (currentDimIndex >= COCURRICULAR_DIMENSIONS.length) return;
        const dim = COCURRICULAR_DIMENSIONS[currentDimIndex];

        let cleanVal = val.trim();
        // Auto-uppercase if it matches standard codes to help consistency
        const upperVal = cleanVal.toUpperCase();
        if (["BB", "MB", "BSH", "SB", "-"].includes(upperVal)) {
          cleanVal = upperVal;
        }

        const finalVal = cleanVal === "" ? null : cleanVal;

        // Call update function for each cell
        onUpdateCocurricularData(student.id, dim.id, finalVal);
        updatedCount++;
      });
    });

    if (updatedCount > 0 && showToast) {
      showToast(`${updatedCount} nilai berhasil ditempel.`, "success");
    }
  };

  const handleSetAllRatings = (dimensionId, rating) => {
    students.forEach((student) => {
      onUpdateCocurricularData(student.id, dimensionId, rating);
    });
    if (showToast) {
      showToast(
        `Nilai ${rating} diterapkan ke semua siswa untuk dimensi ini.`,
        "success",
      );
    }
  };

  const bounds = getSelectionBounds();

  return React.createElement(
    "div",
    { className: "flex flex-col gap-4 pt-4 sm:pt-8" },
    React.createElement(
      "div",
      { className: "flex-shrink-0" },
      React.createElement(
        "h2",
        { className: "text-3xl font-bold text-zinc-800" },
        "Data Kokurikuler",
      ),
      React.createElement(
        "p",
        { className: "mt-1 text-zinc-600" },
        "Isi tema kegiatan dan berikan penilaian capaian kokurikuler siswa yang berfokus pada perkembangan dimensi profil lulusan.",
        React.createElement("br", null),
        React.createElement(
          "span",
          { className: "text-sm text-zinc-900" },
          "💡 Tips: Anda dapat menyalin nilai (BB, MB, BSH, SB) dari Excel dan menempelkannya (paste) ke tabel di bawah.",
        ),
      ),
    ),

    React.createElement(
      "div",
      {
        className:
          "bg-white p-6 rounded-xl shadow-sm border border-zinc-200/60 flex-shrink-0",
      },
      React.createElement(
        "h3",
        { className: "text-xl font-bold text-zinc-800" },
        "Tema Kegiatan",
      ),
      React.createElement(
        "p",
        { className: "mt-1 text-sm text-zinc-600 mb-4" },
        "Masukkan nama tema kegiatan kokurikuler yang dilaksanakan pada semester ini. Tema ini akan muncul pada deskripsi di rapor.",
      ),
      React.createElement("input", {
        type: "text",
        name: "cocurricular_theme",
        value: settings.cocurricular_theme || "",
        onChange: onSettingsChange,
        placeholder: "Contoh: Kearifan Lokal",
        className:
          "w-full max-w-lg px-3 py-2 bg-white border border-zinc-300/60 rounded-lg shadow-sm focus:ring-zinc-900 focus:border-zinc-900",
      }),
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
          },
          React.createElement(
            "div",
            {
              className:
                "p-6 border-b border-zinc-200/60 flex-shrink-0 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4",
            },
            React.createElement(
              "div",
              null,
              React.createElement(
                "h3",
                { className: "text-xl font-bold text-zinc-800" },
                "Penilaian Dimensi Profil",
              ),
              React.createElement(
                "p",
                { className: "text-sm text-zinc-500 mt-1" },
                "Masukkan kode penilaian pada kolom dimensi yang sesuai.",
              ),
            ),
            // Legend Panel
            React.createElement(
              "div",
              {
                className:
                  "flex flex-wrap gap-x-4 gap-y-2 text-xs bg-[#fafafa] p-3 rounded-xl border border-zinc-200/60",
              },
              Object.entries(COCURRICULAR_RATINGS).map(([code, desc]) =>
                React.createElement(
                  "div",
                  { key: code, className: "flex items-center gap-1.5" },
                  React.createElement(
                    "span",
                    {
                      className:
                        "font-bold text-zinc-800 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/60",
                    },
                    code,
                  ),
                  React.createElement(
                    "span",
                    { className: "text-zinc-600" },
                    desc,
                  ),
                ),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              className: "flex-1 overflow-auto select-none",
              onCopy: handleCopy,
              onMouseLeave: () => {
                if (isSelecting) setIsSelecting(false);
              },
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
                        "px-3 py-3 sticky left-0 z-40 bg-zinc-100 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-zinc-200/60",
                    },
                    "No",
                  ),
                  React.createElement(
                    "th",
                    {
                      scope: "col",
                      className:
                        "px-6 py-3 min-w-[200px] border-b border-zinc-200/60",
                    },
                    "Nama Siswa",
                  ),
                  COCURRICULAR_DIMENSIONS.map((dim) =>
                    React.createElement(
                      "th",
                      {
                        key: dim.id,
                        scope: "col",
                        className:
                          "px-3 py-2 w-[116px] min-w-[116px] text-center border-b border-zinc-200/60 align-bottom",
                      },
                      React.createElement(
                        "div",
                        {
                          className:
                            "mb-1 text-[10px] leading-tight flex items-end justify-center min-h-[28px] pb-1",
                        },
                        dim.label,
                      ),
                      React.createElement(
                        "div",
                        {
                          className:
                            "flex justify-center flex-nowrap gap-1 mt-1",
                        },
                        ["BB", "MB", "BSH", "SB"].map((rating) =>
                          React.createElement(
                            "button",
                            {
                              key: rating,
                              onClick: () =>
                                handleSetAllRatings(dim.id, rating),
                              className:
                                "px-1 py-0.5 text-[8px] font-bold text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-100 hover:text-zinc-900 transition-colors whitespace-nowrap",
                              title: `Set semua siswa menjadi ${rating}`,
                            },
                            rating,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              React.createElement(
                "tbody",
                null,
                students.map((student, index) =>
                  React.createElement(
                    "tr",
                    {
                      key: student.id,
                      className: "bg-white hover:bg-[#fafafa]",
                    },
                    React.createElement(
                      "td",
                      {
                        className:
                          "px-3 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                      },
                      index + 1,
                    ),
                    React.createElement(
                      "th",
                      {
                        scope: "row",
                        className:
                          "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap text-left border-b border-zinc-200/60",
                      },
                      student.namaLengkap,
                    ),
                    COCURRICULAR_DIMENSIONS.map((dim, dimIndex) => {
                      const rating =
                        cocurricularData[student.id]?.dimensionRatings?.[
                          dim.id
                        ] || "";
                      // Check validity for styling
                      const isValidRating = [
                        "BB",
                        "MB",
                        "BSH",
                        "SB",
                        "-",
                      ].includes(rating);

                      let selectionStyle = {};
                      let isCellSelected = false;
                      let isLeftmost = false;
                      let isRightmost = false;
                      let isTopmost = false;
                      let isBottommost = false;
                      let boxShadows = [];

                      if (bounds) {
                        isCellSelected =
                          index >= bounds.minR &&
                          index <= bounds.maxR &&
                          dimIndex >= bounds.minC &&
                          dimIndex <= bounds.maxC;

                        if (isCellSelected) {
                          selectionStyle.backgroundColor =
                            "rgba(79, 70, 229, 0.12)"; // indigo transparent
                          if (index === bounds.minR) {
                            boxShadows.push("inset 0 2px 0 0 #4f46e5");
                            isTopmost = true;
                          }
                          if (index === bounds.maxR) {
                            boxShadows.push("inset 0 -2px 0 0 #4f46e5");
                            isBottommost = true;
                          }
                          if (dimIndex === bounds.minC) {
                            boxShadows.push("inset 2px 0 0 0 #4f46e5");
                            isLeftmost = true;
                          }
                          if (dimIndex === bounds.maxC) {
                            boxShadows.push("inset -2px 0 0 0 #4f46e5");
                            isRightmost = true;
                          }
                        }
                      }
                      if (boxShadows.length > 0) {
                        selectionStyle.boxShadow = boxShadows.join(", ");
                      }

                      return React.createElement(
                        "td",
                        {
                          key: dim.id,
                          className:
                            "relative px-3 py-2 border-b border-zinc-200/60 text-center align-middle transition-colors",
                          style: selectionStyle,
                          onMouseDown: (e) => {
                            if (e.button !== 0) return; // Only left click
                            if (e.shiftKey) e.preventDefault();
                            handleMouseDownCell(e, index, dimIndex);
                          },
                          onMouseEnter: () =>
                            handleMouseEnterCell(index, dimIndex),
                        },
                        React.createElement("input", {
                          type: "text",
                          id: `cocurricular-cell-${index}-${dimIndex}`,
                          value: rating,
                          onChange: (e) =>
                            handleRatingChange(
                              student.id,
                              dim.id,
                              e.target.value,
                            ),
                          onPaste: (e) => handlePaste(e, student.id, dim.id),
                          onKeyDown: (e) => {
                            if (
                              e.shiftKey &&
                              [
                                "ArrowUp",
                                "ArrowDown",
                                "ArrowLeft",
                                "ArrowRight",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                              if (!selectionStart) {
                                setSelectionStart({ r: index, c: dimIndex });
                              }
                              setSelectionEnd((prev) => {
                                let newR = prev ? prev.r : index;
                                let newC = prev ? prev.c : dimIndex;
                                if (e.key === "ArrowUp")
                                  newR = Math.max(0, newR - 1);
                                if (e.key === "ArrowDown")
                                  newR = Math.min(
                                    students.length - 1,
                                    newR + 1,
                                  );
                                if (e.key === "ArrowLeft")
                                  newC = Math.max(0, newC - 1);
                                if (e.key === "ArrowRight")
                                  newC = Math.min(
                                    COCURRICULAR_DIMENSIONS.length - 1,
                                    newC + 1,
                                  );

                                return { r: newR, c: newC };
                              });
                            } else if (
                              !e.shiftKey &&
                              ["ArrowUp", "ArrowDown"].includes(e.key)
                            ) {
                              e.preventDefault();
                              let newR = index;
                              if (e.key === "ArrowUp")
                                newR = Math.max(0, newR - 1);
                              if (e.key === "ArrowDown")
                                newR = Math.min(students.length - 1, newR + 1);
                              setTimeout(() => {
                                const nextInput = document.getElementById(
                                  `cocurricular-cell-${newR}-${dimIndex}`,
                                );
                                if (nextInput) {
                                  nextInput.focus();
                                  nextInput.select();
                                }
                              }, 0);
                            }
                          },
                          onFocus: () => {
                            if (
                              !isSelecting &&
                              (!selectionStart ||
                                selectionStart.r !== index ||
                                selectionStart.c !== dimIndex ||
                                selectionEnd.r !== index ||
                                selectionEnd.c !== dimIndex)
                            ) {
                              setSelectionStart({ r: index, c: dimIndex });
                              setSelectionEnd({ r: index, c: dimIndex });
                            }
                          },
                          style: {
                            pointerEvents: isSelecting ? "none" : "auto",
                          },
                          className: `block w-11 mx-auto px-1 py-1 text-center text-sm uppercase rounded-md transition-all ${
                            isCellSelected &&
                            bounds &&
                            (bounds.maxR > bounds.minR ||
                              bounds.maxC > bounds.minC)
                              ? "bg-transparent border-transparent shadow-none border focus:outline-none"
                              : `bg-white shadow-sm border focus:ring-zinc-900 focus:border-zinc-900 ${
                                  isValidRating
                                    ? "border-green-500 ring-1 ring-green-500"
                                    : rating && !isValidRating
                                      ? "border-red-500 ring-1 ring-red-500 bg-rose-50 text-rose-800"
                                      : "border-red-500 ring-1 ring-red-500"
                                }`
                          }`,
                          placeholder: "-",
                        }),
                        isBottommost &&
                          isRightmost &&
                          React.createElement("div", {
                            className:
                              "absolute bottom-[-3px] right-[-3px] w-2 h-2 bg-indigo-600 border border-white z-10",
                          }),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
  );
};

export default DataKokurikulerPage;
