import React, { useEffect } from "react";
import { useGridSelection } from '../../hooks/useGridSelection';
import { getClipboardText } from "../../utils/clipboard";
import { useStudentsStore } from "../../stores/useStudentsStore";
import { useNotesStore } from "../../stores/useNotesStore";
import { useNilaiStore } from "../../stores/useNilaiStore";
import { useSettingsStore } from "../../stores/useSettingsStore";

export const useCatatanWaliKelasPageLogic = (props: any) => {
  const storeStudents = useStudentsStore((state) => state.students);
  const storeNotes = useNotesStore((state) => state.notes);
  const storeGrades = useNilaiStore((state) => state.grades);
  const storeSubjects = useSettingsStore((state) => state.subjects);
  const storeSettings = useSettingsStore((state) => state.settings);

  const students = props.students || storeStudents;
  const notes = props.notes || storeNotes;
  const grades = props.grades || storeGrades;
  const subjects = props.subjects || storeSubjects;
  const settings = props.settings || storeSettings;
  const showToast = props.showToast;

  const onUpdateNote = props.onUpdateNote || ((sid: string, note: string) => {
    useNotesStore.getState().updateNote(sid, note, settings?.semester);
  });

  const currentSemester = settings?.semester || 'Ganjil';
  const getNoteKey = (studentId: string) => currentSemester === 'Genap' ? studentId + '_Genap' : studentId;

  const handleGenerateNote = (student: any) => {
    const nickname =
      student.namaPanggilan || (student.namaLengkap || "").split(" ")[0];
    const activeSubjects = subjects.filter((s: any) => s.active);

    // --- STEP 1: Calculate Rank for the current student ---
    const studentAverages = students.map((s) => {
      const sGradeData = grades.find((g) => g.studentId === s.id);
      if (!sGradeData || !sGradeData.finalGrades) return { id: s.id, avg: 0 };

      let totalScore = 0;
      let count = 0;

      activeSubjects.forEach((sub: any) => {
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
    activeSubjects.forEach((s: any) => {
      const grade = finalGrades[s.id];
      if (typeof grade === "number" && grade > maxScore) {
        maxScore = grade;
      }
    });

    let subjectsString = "";

    if (maxScore > 0) {
      const topSubjects = activeSubjects.filter(
        (s: any) => finalGrades[s.id] === maxScore,
      );

      // Format subject names
      const subjectNames = topSubjects.map((s: any) => {
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
      note = `${nickname} menunjukkan prestasi akademik yang sangat membanggakan dan konsisten sepanjang semester. Ia ${masteryDescription} mata pelajaran ${subjectsString}. Pertahankan semangat belajar yang luar biasa ini, rendah hati, dan jadilah inspirasi bagi teman-teman di kelas.`;
    } else if (rank <= 20) {
      note = `${nickname} menunjukkan perkembangan akademik yang positif dan stabil. Potensinya terlihat kuat, dimana ia ${masteryDescription} mata pelajaran ${subjectsString}. Dengan meningkatkan ketelitian dan lebih aktif berdiskusi di kelas, Ibu/Bapak yakin ia dapat meraih hasil yang lebih maksimal di semester depan.`;
    } else if (rank <= 30) {
      note = `${nickname} telah berusaha mengikuti kegiatan pembelajaran dengan cukup baik. Capaiannya ${masteryDescription} mata pelajaran ${subjectsString}. Untuk meningkatkan prestasi secara keseluruhan, ia perlu lebih fokus saat di kelas, berani bertanya, dan menambah waktu belajar mandiri di rumah.`;
    } else {
      note = `${nickname} memiliki bakat yang unik. Ia ${masteryDescription} mata pelajaran ${subjectsString}. Namun, ia perlu lebih disiplin dan tekun dalam mengejar ketertinggalan di mata pelajaran lainnya. Jangan mudah menyerah, dengan bimbingan yang tepat dan kemauan yang kuat, ia pasti bisa lebih baik lagi.`;
    }

    onUpdateNote(student.id, note);
  };

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
    colsCount: 1,
    minColIndex: -2,
    containerClass: 'catatan-table-container',
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      const currentSemesterSetting = settings?.semester || "Ganjil";
      
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r >= 0 && c === 0) {
            const student = students[r];
            if (student) {
              const noteKeyValue = currentSemesterSetting === "Genap" ? student.id + "_Genap" : student.id;
              if (notes[noteKeyValue]) {
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

  useEffect(() => {
    const handleCopyGlobal = (e: ClipboardEvent) => {
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
        e.clipboardData?.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, students, notes, showToast]);

  const handleNoteChange = (studentId: string, note: string) => {
    onUpdateNote(studentId, note);
  };

  const handlePaste = async (e: React.ClipboardEvent, startStudentId: string) => {
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

      if (rows.length === 1 && columns.length > 1) {
        columns.forEach((colVal, cIndex) => {
          const transposedStudentIndex = studentIndex + cIndex;
          if (transposedStudentIndex >= students.length) return;
          const targetStudent = students[transposedStudentIndex];
          onUpdateNote(targetStudent.id, colVal);
          updatedCount++;
        });
        return;
      }

      const noteValue = columns[0];
      onUpdateNote(student.id, noteValue);
      updatedCount++;
    });

    if (updatedCount > 0 && showToast) {
      showToast(`${updatedCount} catatan berhasil ditempel.`, "success");
    }
  };

  return {
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
  };
};
