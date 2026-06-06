import React from "react";
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from "../constants.js";
import { getClipboardText } from "../utils/clipboard.js";
import { useGridSelection } from "../hooks/useGridSelection.js";

const DataKokurikulerPage = ({
  students,
  settings,
  cocurricularData,
  onSettingsChange,
  onUpdateCocurricularData,
  showToast,
}) => {
  const currentSemester = settings?.semester || "Ganjil";
  const dimensionField = currentSemester === "Genap" ? "dimensionRatings_Genap" : "dimensionRatings";

  const {
      selectionStart,
      setSelectionStart,
      selectionEnd,
      setSelectionEnd,
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
      containerClass: 'cocurricular-table-container',
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
        e.clipboardData.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, students, cocurricularData, showToast]);

  const handleRatingChange = (studentId, dimensionId, value) => {
    // Convert empty string to null, otherwise keep value as is (text input)
    onUpdateCocurricularData(
      studentId,
      dimensionId,
      value === "" ? null : value.toUpperCase(),
    );
  };

  const handlePaste = async (e, startStudentId, startDimensionId) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);
    if (!pasteData) return;

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
        name: currentSemester === "Genap" ? "cocurricular_theme_Genap" : "cocurricular_theme",
        value: currentSemester === "Genap" ? (settings.cocurricular_theme_Genap || "") : (settings.cocurricular_theme || ""),
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
              className:
                "flex-1 overflow-auto select-none cocurricular-table-container",
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
                        "px-3 py-3 sticky left-0 z-40 bg-zinc-100 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-zinc-200/60 relative cursor-default select-none",
                      style: getSelectionStyle(-1, -2).selectionStyle,
                      onMouseDown: (e) => {
                        if (e.button !== 0) return;
                        if (e.shiftKey) e.preventDefault();
                        handleMouseDownCell(e, -1, -2, "cocurricular-cell");
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
                        "px-6 py-3 min-w-[200px] border-b border-zinc-200/60 relative cursor-default select-none",
                      style: getSelectionStyle(-1, -1).selectionStyle,
                      onMouseDown: (e) => {
                        if (e.button !== 0) return;
                        if (e.shiftKey) e.preventDefault();
                        handleMouseDownCell(e, -1, -1, "cocurricular-cell");
                      },
                      onMouseEnter: () => handleMouseEnterCell(-1, -1),
                    },
                    "Nama Siswa",
                  ),
                  COCURRICULAR_DIMENSIONS.map((dim, dimIndex) =>
                    React.createElement(
                      "th",
                      {
                        key: dim.id,
                        scope: "col",
                        className:
                          "px-3 py-2 w-[116px] min-w-[116px] text-center border-b border-zinc-200/60 align-bottom relative cursor-default select-none",
                        style: getSelectionStyle(-1, dimIndex).selectionStyle,
                        onMouseDown: (e) => {
                          if (e.target.tagName === "BUTTON") return;
                          if (e.button !== 0) return;
                          if (e.shiftKey) e.preventDefault();
                          handleMouseDownCell(e, -1, dimIndex, "cocurricular-cell");
                        },
                        onMouseEnter: () => handleMouseEnterCell(-1, dimIndex),
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
                students.map((student, index) => {
                  return React.createElement(
                    React.Fragment,
                    { key: student.id },
                    React.createElement(
                      "tr",
                      { className: "bg-white hover:bg-[#fafafa]" },
                      React.createElement(
                        "td",
                        {
                          id: `cocurricular-cell-${index}--2`,
                          tabIndex: -1,
                          className:
                            "px-3 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none",
                          style: getSelectionStyle(index, -2).selectionStyle,
                          onMouseDown: (e) => {
                            if (e.button !== 0) return;
                            if (e.shiftKey) e.preventDefault();
                            handleMouseDownCell(e, index, -2, "cocurricular-cell");
                          },
                          onMouseEnter: () => handleMouseEnterCell(index, -2),
                        },
                        index + 1,
                      ),
                      React.createElement(
                        "th",
                        {
                          id: `cocurricular-cell-${index}--1`,
                          tabIndex: -1,
                          scope: "row",
                          className:
                            "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap text-left border-b border-zinc-200/60 relative cursor-default select-none",
                          style: getSelectionStyle(index, -1).selectionStyle,
                          onMouseDown: (e) => {
                            if (e.button !== 0) return;
                            if (e.shiftKey) e.preventDefault();
                            handleMouseDownCell(e, index, -1, "cocurricular-cell");
                          },
                          onMouseEnter: () => handleMouseEnterCell(index, -1),
                        },
                        student.namaLengkap,
                      ),
                      COCURRICULAR_DIMENSIONS.map((dim, dimIndex) => {
                        const rating =
                          cocurricularData[student.id]?.[dimensionField]?.[
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

                        const {
                          isCellSelected,
                          selectionStyle,
                          isLeftmost,
                          isRightmost,
                          isTopmost,
                          isBottommost,
                          boxShadows,
                          showTransparentInput,
                        } = getSelectionStyle(index, dimIndex);

                        let isSelectionStartCell =
                          selectionStart &&
                          index === selectionStart.r &&
                          dimIndex === selectionStart.c;

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
                              handleMouseDownCell(e, index, dimIndex, "cocurricular-cell");
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
                            onFocus: () => handleFocusCell(index, dimIndex),
                            style: {
                              pointerEvents: "none",
                            },
                            className: `block w-11 mx-auto px-1 py-1 text-center text-sm uppercase rounded-md transition-all ${
                              showTransparentInput
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
                  );
                }),
              ),
            ),
          ),
        ),
  );
};

export default DataKokurikulerPage;
