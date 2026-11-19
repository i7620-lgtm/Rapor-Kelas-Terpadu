import { generateSubjectDescription } from "../../utils/nilaiHelpers";
import { getClipboardText } from "../../utils/clipboard";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";
import { splitRowIntoColumns } from "../../utils/nilaiHelpers";
import { useNilaiStore } from "../../stores/useNilaiStore";
import {
  areDetailedGradesEqual,
  cloneDetailedGrade,
  GradeSnapshotChange,
  useNilaiHistoryStore,
} from "../../stores/useNilaiHistoryStore";

export const useNilaiTableActionsLogic = ({
  relevantStudents,
  grades: _grades,
  subject,
  settings,
  allSlms,
  objectivesForSubject,
  onBulkUpdateGrades,
  showToast,
  columnKeys,
}) => {
  const getStudentDetailedGrade = (studentId: string) => {
    const nilaiState = useNilaiStore.getState();
    const studentGrade =
      nilaiState.gradesByStudentId[studentId] ||
      nilaiState.grades.find((g: any) => g.studentId === studentId);
    return studentGrade?.detailedGrades?.[subject.id];
  };

  const handleBulkGenerateDescriptions = () => {
    const updates: any[] = [];
    const historyChanges: GradeSnapshotChange[] = [];

    relevantStudents.forEach((student: any) => {
      const beforeRaw = getStudentDetailedGrade(student.id);
      const before = cloneDetailedGrade(beforeRaw);

      const detailedGrade = cloneDetailedGrade(beforeRaw) || {
        slm: [],
        sts: null,
        sas: null,
      };
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

      if (!areDetailedGradesEqual(before, detailedGrade)) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
        historyChanges.push({
          studentId: student.id,
          before,
          after: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
      useNilaiHistoryStore
        .getState()
        .recordHistory(subject.id, "Generate deskripsi", historyChanges);
      showToast(
        `Deskripsi kompetensi berhasil digenerate untuk ${updates.length} siswa.`,
        "success"
      );
    } else {
      showToast("Semua deskripsi kompetensi sudah sesuai.", "info");
    }
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
      const detailedGrade = getStudentDetailedGrade(student.id);
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

    const updates: any[] = [];
    const historyChanges: GradeSnapshotChange[] = [];

    relevantStudents.forEach((student: any) => {
      const beforeRaw = getStudentDetailedGrade(student.id);
      const before = cloneDetailedGrade(beforeRaw);

      const detailedGrade = cloneDetailedGrade(beforeRaw) || {
        slm: [],
        sts: null,
        sas: null,
      };
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

      if (!areDetailedGradesEqual(before, detailedGrade)) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
        historyChanges.push({
          studentId: student.id,
          before,
          after: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
      useNilaiHistoryStore
        .getState()
        .recordHistory(subject.id, "Olah nilai regresi TP", historyChanges);
      showToast(
        `Nilai TP berhasil diolah otomatis menggunakan rumus regresi.`,
        "success"
      );
    }
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
      const detailedGrade = getStudentDetailedGrade(student.id);
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

    const updates: any[] = [];
    const historyChanges: GradeSnapshotChange[] = [];

    relevantStudents.forEach((student: any) => {
      const beforeRaw = getStudentDetailedGrade(student.id);
      const before = cloneDetailedGrade(beforeRaw);

      const detailedGrade = cloneDetailedGrade(beforeRaw) || {
        slm: [],
        sts: null,
        sas: null,
      };
      if (!detailedGrade.slm) detailedGrade.slm = [];

      const oldScore = parseInt(detailedGrade[type], 10);
      if (!isNaN(oldScore)) {
        const newScore =
          oldScore + ((100 - oldScore) * (kkm - minScore)) / (100 - minScore);
        detailedGrade[type] = Math.round(newScore);
      }

      if (!areDetailedGradesEqual(before, detailedGrade)) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
        historyChanges.push({
          studentId: student.id,
          before,
          after: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
      useNilaiHistoryStore
        .getState()
        .recordHistory(
          subject.id,
          `Olah nilai regresi ${type.toUpperCase()}`,
          historyChanges
        );
      showToast(
        `Nilai berhasil diolah otomatis menggunakan rumus regresi.`,
        "success"
      );
    }
  };

  const handlePaste = async (e: any, startStudentId: string, startKey: string) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);
    const rows = pasteData.split(/\r\n|\n|\r/);
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
    const historyChanges: GradeSnapshotChange[] = [];

    rows.forEach((row, rIndex) => {
      const currentStudentIndex = startStudentIndex + rIndex;
      if (currentStudentIndex >= relevantStudents.length) return;

      const student = relevantStudents[currentStudentIndex];
      const beforeRaw = getStudentDetailedGrade(student.id);
      const before = cloneDetailedGrade(beforeRaw);

      const detailedGrade = cloneDetailedGrade(beforeRaw) || {
        slm: [],
        sts: null,
        sas: null,
      };

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
          if (slm.scores[tpIndex] !== finalVal) {
            slm.scores[tpIndex] = finalVal;
            hasChanged = true;
          }
        } else if (
          ["sts1", "sts2", "sas1", "sas2", "sts", "sas"].includes(key) &&
          (typeof finalVal === "number" ||
            finalVal === null ||
            typeof finalVal === "string")
        ) {
          if ((detailedGrade[key] ?? null) !== finalVal) {
            detailedGrade[key] = finalVal;
            hasChanged = true;
          }
        }
      });

      if (hasChanged && !areDetailedGradesEqual(before, detailedGrade)) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
        historyChanges.push({
          studentId: student.id,
          before,
          after: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
      useNilaiHistoryStore
        .getState()
        .recordHistory(
          subject.id,
          `Tempel nilai (${updates.length} siswa)`,
          historyChanges
        );
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
