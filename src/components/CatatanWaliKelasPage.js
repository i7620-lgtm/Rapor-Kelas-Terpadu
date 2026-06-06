import React from "react";
import { useGridSelection } from '../hooks/useGridSelection';
import { getClipboardText } from "../utils/clipboard";

const CatatanWaliKelasPage = ({
  students,
  notes,
  onUpdateNote,
  grades,
  subjects,
  settings,
  showToast,
}) => {
  const currentSemester = settings?.semester || 'Ganjil';
  const getNoteKey = (studentId) => currentSemester === 'Genap' ? studentId + '_Genap' : studentId;
  const handleGenerateNote = (student) => {
    const nickname =
      student.namaPanggilan || (student.namaLengkap || "").split(" ")[0];
    const activeSubjects = subjects.filter((s) => s.active);

    // --- STEP 1: Calculate Rank for the current student ---
    const studentAverages = students.map((s) => {
      const sGradeData = grades.find((g) => g.studentId === s.id);
      if (!sGradeData || !sGradeData.finalGrades) return { id: s.id, avg: 0 };

      let totalScore = 0;
      let count = 0;

      activeSubjects.forEach((sub) => {
        const score = sGradeData.finalGrades[sub.id];
        if (typeof score === "number") {
          totalScore += score;
          count++;
        }
      });

      return {
        id: s.id,
        avg: count > 0 ? totalScore / count : 0,
      };
    });

    // Sort descending by average score
    studentAverages.sort((a, b) => b.avg - a.avg);

    // Find current student's rank (1-based index)
    const rankIndex = studentAverages.findIndex((s) => s.id === student.id);
    const rank = rankIndex + 1;

    // --- STEP 2: Find Highest Grade(s) & Subject Names ---
    const studentGradeData = grades.find((g) => g.studentId === student.id);
    const finalGrades = studentGradeData ? studentGradeData.finalGrades : {};

    let maxScore = -1;
    // Find max
    activeSubjects.forEach((s) => {
      const grade = finalGrades[s.id];
      if (typeof grade === "number" && grade > maxScore) {
        maxScore = grade;
      }
    });

    let subjectsString = "";

    if (maxScore > 0) {
      const topSubjects = activeSubjects.filter(
        (s) => finalGrades[s.id] === maxScore,
      );

      // Format subject names
      const subjectNames = topSubjects.map((s) => {
        const name = s.fullName;
        const id = s.id;

        if (id === "PJOK") return "PJOK";
        if (id === "IPAS") return "IPAS";

        if (name.startsWith("Pendidikan Agama")) {
          const match = name.match(/\(([^)]+)\)/);
          if (match) return `Agama ${match[1]}`;
          return "Pendidikan Agama";
        }

        if (name.startsWith("Muatan Lokal")) {
          const match = name.match(/\(([^)]+)\)/);
          return match ? match[1] : "Muatan Lokal";
        }

        if (name.startsWith("Seni Budaya")) {
          const match = name.match(/\(([^)]+)\)/);
          return match ? match[1] : name;
        }

        return name;
      });

      // Join names grammatically
      if (subjectNames.length === 1) {
        subjectsString = subjectNames[0];
      } else if (subjectNames.length === 2) {
        subjectsString = `${subjectNames[0]} dan ${subjectNames[1]}`;
      } else {
        const last = subjectNames.pop();
        subjectsString = `${subjectNames.join(", ")}, dan ${last}`;
      }
    } else {
      // Fallback if no grades
      subjectsString = "berbagai kegiatan";
    }

    // --- STEP 3: Determine Mastery Description based on Predicate ---
    const predA = parseInt(settings.predikats?.a || 90, 10);
    const predB = parseInt(settings.predikats?.b || 80, 10);
    const predC = parseInt(settings.predikats?.c || 70, 10);

    let masteryDescription = "menunjukkan kemampuan dalam"; // Default fallback

    if (maxScore >= predA) {
      masteryDescription = "sangat baik dalam";
    } else if (maxScore >= predB) {
      masteryDescription = "baik dalam";
    } else if (maxScore >= predC) {
      masteryDescription = "cukup baik dalam";
    }

    // --- STEP 4: Generate Description based on Rank using "Ia" ---
    let note = "";

    if (rank <= 10) {
      // Top 10: Excellence, Leadership, Maintenance
      note = `${nickname} menunjukkan prestasi akademik yang sangat membanggakan dan konsisten sepanjang semester. Ia ${masteryDescription} mata pelajaran ${subjectsString}. Pertahankan semangat belajar yang luar biasa ini, rendah hati, dan jadilah inspirasi bagi teman-teman di kelas.`;
    } else if (rank <= 20) {
      // 11-20: Good Progress, Potential, Detail-oriented
      note = `${nickname} menunjukkan perkembangan akademik yang positif dan stabil. Potensinya terlihat kuat, dimana ia ${masteryDescription} mata pelajaran ${subjectsString}. Dengan meningkatkan ketelitian dan lebih aktif berdiskusi di kelas, Ibu/Bapak yakin ia dapat meraih hasil yang lebih maksimal di semester depan.`;
    } else if (rank <= 30) {
      // 21-30: Effort, Motivation, Focus
      note = `${nickname} telah berusaha mengikuti kegiatan pembelajaran dengan cukup baik. Capaiannya ${masteryDescription} mata pelajaran ${subjectsString}. Untuk meningkatkan prestasi secara keseluruhan, ia perlu lebih fokus saat di kelas, berani bertanya, dan menambah waktu belajar mandiri di rumah.`;
    } else {
      // > 30: Support, Discipline, Spirit
      note = `${nickname} memiliki bakat yang unik. Ia ${masteryDescription} mata pelajaran ${subjectsString}. Namun, ia perlu lebih disiplin dan tekun dalam mengejar ketertinggalan di mata pelajaran lainnya. Jangan mudah menyerah, dengan bimbingan yang tepat dan kemauan yang kuat, ia pasti bisa lebih baik lagi.`;
    }

    onUpdateNote(student.id, note);
  };

  const {
      selectionStart,
      isSelecting,
      setIsSelecting,
      getSelectionBounds,
      getSelectionStyle,
      handleMouseDownCell,
      handleMouseEnterCell,
      handleFocusCell
  } = useGridSelection({
      rowsCount: students.length,
      colsCount: 1,
      minColIndex: -2,
      containerClass: 'catatan-table-container',
      onDeleteSelection: (bounds) => {
        let updatedCount = 0;
        const currentSemester = settings?.semester || "Ganjil";
        
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
            for (let c = bounds.minC; c <= bounds.maxC; c++) {
                if (r >= 0 && c === 0) {
                    const student = students[r];
                    if (student) {
                        const noteKey = currentSemester === "Genap" ? student.id + "_Genap" : student.id;
                        if (notes[noteKey]) {
                            onUpdateNote(student.id, "");
                            updatedCount++;
                        }
                    }
                }
            }
        }
        
        if (updatedCount > 0 && showToast) {
            showToast(`${updatedCount} catatan berhasil dihapus.`, "success");
        }
      }
  });

  React.useEffect(() => {
      const handleCopyGlobal = (e) => {
          const bounds = getSelectionBounds();
          if (!bounds) return;

          if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
              if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
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
                      else if (c === 0) rowData.push("Catatan Wali Kelas");
                  } else {
                      const student = students[r];
                      if (student) {
                          if (c === -2) {
                              rowData.push(r + 1);
                          } else if (c === -1) {
                              rowData.push(student.namaLengkap);
                          } else {
                              // newlines might break tsv so we replace or leave, tsv requires quotes if newlines exist, let's keep it simple
                              let noteStr = notes[getNoteKey(student.id)] || "";
                              noteStr = noteStr.replace(/[\n\t]/g, " ");
                              rowData.push(noteStr);
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
  }, [getSelectionBounds, students, notes, showToast]);

  const handleNoteChange = (studentId, note) => {
    onUpdateNote(studentId, note);
  };

  const handlePaste = async (e, startStudentId) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);

    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }

    if (rows.length === 0) return;

    const studentIndex = students.findIndex((s) => s.id === startStudentId);
    if (studentIndex === -1) return;

    let updatedCount = 0;

    rows.forEach((row, rIndex) => {
      let currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;

      const student = students[currentStudentIndex];
      const columns = row.includes("\t") ? row.split("\t") : (row.includes(";") ? row.split(";") : [row]);

      // Transpose horizontal data if pasting a single row with multiple columns
      if (rows.length === 1 && columns.length > 1) {
        columns.forEach((colVal, cIndex) => {
          const transposedStudentIndex = studentIndex + cIndex;
          if (transposedStudentIndex >= students.length) return;
          const targetStudent = students[transposedStudentIndex];
          onUpdateNote(targetStudent.id, colVal);
          updatedCount++;
        });
        return; // skip the regular logic
      }

      const noteValue = columns[0];
      onUpdateNote(student.id, noteValue);
      updatedCount++;
    });

    if (updatedCount > 0) {
      showToast &&
        showToast(`${updatedCount} catatan berhasil ditempel.`, "success");
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
                        "px-6 py-3 w-16 sticky left-0 z-40 bg-zinc-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-zinc-200/60 relative cursor-default select-none",
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
                        "px-6 py-3 border-b border-zinc-200/60 min-w-[250px] relative cursor-default select-none",
                      style: getSelectionStyle(-1, -1).selectionStyle,
                      onMouseDown: (e) => {
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
                      onMouseDown: (e) => {
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
                students.map((student, index) => {
                  const {
                      isCellSelected,
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
                        id: `cell-${index}--1`,
                        tabIndex: -1,
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
                    React.createElement(
                      "td",
                      { 
                        className: "px-6 py-4 border-b border-zinc-200/60 relative cursor-default select-none",
                        style: selectionStyle,
                        onMouseDown: (e) => {
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
                        onMouseDown: (e) => {
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
