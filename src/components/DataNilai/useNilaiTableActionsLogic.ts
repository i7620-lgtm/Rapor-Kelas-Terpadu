import { generateSubjectDescription } from "../../utils/nilaiHelpers";
import { getClipboardText } from "../../utils/clipboard";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";
import { splitRowIntoColumns } from "../../utils/nilaiHelpers";

export const useNilaiTableActionsLogic = ({
  relevantStudents,
  grades,
  subject,
  settings,
  allSlms,
  objectivesForSubject,
  onBulkUpdateGrades,
  showToast,
  columnKeys,
}) => {
  const handleBulkGenerateDescriptions = () => {
    const updates = relevantStudents.map((student: any) => {
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = JSON.parse(
        JSON.stringify(
          studentGrade?.detailedGrades?.[subject.id] || {
            slm: [],
            sts1: null,
            sts2: null,
            sas1: null,
            sas2: null,
          }
        )
      );
      if (!detailedGrade.slm) detailedGrade.slm = [];

      const generated = generateSubjectDescription(
        student,
        detailedGrade,
        objectivesForSubject,
        settings,
        settings.slmVisibility?.[subject.id]
      );

      if (!detailedGrade.descriptions)
        detailedGrade.descriptions = { highest: "", lowest: "" };

      detailedGrade.descriptions.highest = generated.highest;
      detailedGrade.descriptions.lowest = generated.lowest;

      return {
        studentId: student.id,
        subjectId: subject.id,
        newDetailedGrade: detailedGrade,
      };
    });

    onBulkUpdateGrades(updates);
    showToast(
      `Deskripsi kompetensi berhasil digenerate untuk ${updates.length} siswa.`,
      "success"
    );
  };

  const handleAutoRegression = (slmId: string, tpIndex: number) => {
    const kkm = parseInt(settings.predikats.c, 10);
    if (isNaN(kkm)) {
      showToast("KKM (Predikat C) belum diatur di Pengaturan.", "error");
      return;
    }

    let minScore = 100;
    let scoresFound = false;

    relevantStudents.forEach((student: any) => {
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
      const slm = detailedGrade?.slm?.find((s: any) => s.id === slmId);
      const score = slm?.scores?.[tpIndex];
      if (score !== null && score !== undefined && score !== "") {
        const numScore = parseInt(score, 10);
        if (!isNaN(numScore)) {
          if (numScore < minScore) minScore = numScore;
          scoresFound = true;
        }
      }
    });

    if (!scoresFound) {
      showToast("Tidak ada nilai untuk diolah pada TP ini.", "error");
      return;
    }
    if (minScore >= 100) {
      showToast("Semua nilai sudah maksimal (100).", "info");
      return;
    }
    if (minScore >= kkm) {
      showToast("Nilai terendah sudah mencapai atau melampaui KKM.", "info");
      return;
    }

    const updates = relevantStudents.map((student: any) => {
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = JSON.parse(
        JSON.stringify(
          studentGrade?.detailedGrades?.[subject.id] || {
            slm: [],
            sts1: null,
            sts2: null,
            sas1: null,
            sas2: null,
          }
        )
      );
      if (!detailedGrade.slm) detailedGrade.slm = [];

      let slmToUpdate = detailedGrade.slm?.find((s: any) => s.id === slmId);
      if (!slmToUpdate) {
        slmToUpdate = {
          id: slmId,
          name: allSlms.find((s: any) => s.id === slmId)?.name,
          scores: [],
        };
        detailedGrade.slm.push(slmToUpdate);
      }
      while (slmToUpdate.scores.length <= tpIndex) {
        slmToUpdate.scores.push(null);
      }

      const oldScore = parseInt(slmToUpdate.scores[tpIndex], 10);
      if (!isNaN(oldScore)) {
        const newScore =
          oldScore + ((100 - oldScore) * (kkm - minScore)) / (100 - minScore);
        slmToUpdate.scores[tpIndex] = Math.round(newScore);
      }

      return {
        studentId: student.id,
        subjectId: subject.id,
        newDetailedGrade: detailedGrade,
      };
    });

    onBulkUpdateGrades(updates);
    showToast(
      `Nilai TP berhasil diolah otomatis menggunakan rumus regresi.`,
      "success"
    );
  };

  const handleAutoRegressionNonTP = (type: string) => {
    const kkm = parseInt(settings.predikats.c, 10);
    if (isNaN(kkm)) {
      showToast("KKM (Predikat C) belum diatur di Pengaturan.", "error");
      return;
    }

    let minScore = 100;
    let scoresFound = false;

    relevantStudents.forEach((student: any) => {
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
      const score = detailedGrade?.[type];

      if (score !== null && score !== undefined && score !== "") {
        const numScore = parseInt(score, 10);
        if (!isNaN(numScore)) {
          if (numScore < minScore) minScore = numScore;
          scoresFound = true;
        }
      }
    });

    if (!scoresFound) {
      showToast("Tidak ada nilai untuk diolah pada kolom ini.", "error");
      return;
    }
    if (minScore >= 100) {
      showToast("Semua nilai sudah maksimal (100).", "info");
      return;
    }
    if (minScore >= kkm) {
      showToast("Nilai terendah sudah mencapai atau melampaui KKM.", "info");
      return;
    }

    const updates = relevantStudents.map((student: any) => {
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = JSON.parse(
        JSON.stringify(
          studentGrade?.detailedGrades?.[subject.id] || {
            slm: [],
            sts1: null,
            sts2: null,
            sas1: null,
            sas2: null,
          }
        )
      );
      if (!detailedGrade.slm) detailedGrade.slm = [];

      const oldScore = parseInt(detailedGrade[type], 10);
      if (!isNaN(oldScore)) {
        const newScore =
          oldScore + ((100 - oldScore) * (kkm - minScore)) / (100 - minScore);
        detailedGrade[type] = Math.round(newScore);
      }

      return {
        studentId: student.id,
        subjectId: subject.id,
        newDetailedGrade: detailedGrade,
      };
    });

    onBulkUpdateGrades(updates);
    showToast(
      `Nilai berhasil diolah otomatis menggunakan rumus regresi.`,
      "success"
    );
  };

  const handlePaste = async (e: any, startStudentId: string, startKey: string) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);
    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }
    if (rows.length === 0) return;

    const startStudentIndex = relevantStudents.findIndex(
      (s: any) => s.id === startStudentId
    );
    const startColumnIndex = columnKeys.indexOf(startKey);

    if (startStudentIndex === -1 || startColumnIndex === -1) return;

    const updates: any[] = [];
    rows.forEach((row, rIndex) => {
      const currentStudentIndex = startStudentIndex + rIndex;
      if (currentStudentIndex >= relevantStudents.length) return;

      const student = relevantStudents[currentStudentIndex];
      const studentGrade = grades.find((g: any) => g.studentId === student.id);
      const detailedGrade = JSON.parse(
        JSON.stringify(
          studentGrade?.detailedGrades?.[subject.id] || {
            slm: [],
            sts1: null,
            sts2: null,
            sas1: null,
            sas2: null,
          }
        )
      );

      if (!detailedGrade.slm) {
        detailedGrade.slm = [];
      }

      let hasChanged = false;
      const columns = splitRowIntoColumns(row);

      columns.forEach((val, cIndex) => {
        const currentColumnIndex = startColumnIndex + cIndex;
        if (currentColumnIndex >= columnKeys.length) return;

        const key = columnKeys[currentColumnIndex];
        const cleanVal = val.trim();
        let finalVal: number | string | null = null;

        if (cleanVal !== "") {
          const upperVal = cleanVal.toUpperCase();
          if (QUALITATIVE_DESCRIPTORS[upperVal]) {
            finalVal = upperVal;
          } else {
            let numVal = parseFloat(cleanVal.replace(",", "."));
            if (!isNaN(numVal)) {
              numVal = Math.round(numVal);
              if (numVal >= 0 && numVal <= 100) {
                finalVal = numVal;
              }
            }
          }
        }

        if (key.startsWith("tp|")) {
          const [, slmId, tpIndexStr] = key.split("|");
          const tpIndex = parseInt(tpIndexStr, 10);

          let slm = detailedGrade.slm?.find((s: any) => s.id === slmId);
          if (!slm) {
            slm = {
              id: slmId,
              name: allSlms.find((s: any) => s.id === slmId)?.name,
              scores: [],
            };
            detailedGrade.slm.push(slm);
          }
          while (slm.scores.length <= tpIndex) {
            slm.scores.push(null);
          }
          slm.scores[tpIndex] = finalVal;
          hasChanged = true;
        } else if (
          ["sts1", "sts2", "sas1", "sas2", "sts", "sas"].includes(key) &&
          (typeof finalVal === "number" ||
            finalVal === null ||
            typeof finalVal === "string")
        ) {
          detailedGrade[key] = finalVal;
          hasChanged = true;
        }
      });

      if (hasChanged) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
      showToast(`${updates.length} baris berhasil ditempel.`, "success");
    }
  };

  return {
    handleBulkGenerateDescriptions,
    handleAutoRegression,
    handleAutoRegressionNonTP,
    handlePaste,
  };
};
