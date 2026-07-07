import { useCallback } from "react";
import { generateSubjectDescription, splitRowIntoColumns } from "../../utils/nilaiHelpers";
import { getClipboardText } from "../../utils/clipboard";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";

export const useSummativeModalActionsLogic = ({
  relevantStudents,
  subject,
  settings,
  localObjectives,
  setLocalGrades,
  showToast,
  isSLM,
  item,
  slmName,
  type,
}) => {
  const handleBulkGenerateDescriptions = () => {
    setLocalGrades((prevGrades: any) => {
      const newGrades = { ...prevGrades };
      relevantStudents.forEach((student: any) => {
        if (!newGrades[student.id]) return;
        const detailedGrade = newGrades[student.id];

        const generated = generateSubjectDescription(
          student,
          detailedGrade,
          localObjectives,
          settings,
          settings.slmVisibility?.[subject.id]
        );

        if (!detailedGrade.descriptions)
          detailedGrade.descriptions = { highest: "", lowest: "" };

        detailedGrade.descriptions.highest = generated.highest;
        detailedGrade.descriptions.lowest = generated.lowest;
      });
      return newGrades;
    });
    showToast("Deskripsi kompetensi berhasil digenerate otomatis.", "success");
  };

  const handlePaste = useCallback(
    async (e: any, startStudentId: string, tpIndex: number | null = null) => {
      e.preventDefault();
      const pasteData = await getClipboardText(e);
      let pastedRows = pasteData.split(/\r\n|\n|\r/);
      if (pastedRows.length > 0 && pastedRows[pastedRows.length - 1] === "") {
        pastedRows.pop();
      }
      if (pastedRows.length === 0) return;

      const studentIds = relevantStudents.map((s: any) => s.id);
      const startStudentIndex = studentIds.indexOf(startStudentId);

      if (startStudentIndex === -1) return;

      setLocalGrades((prevLocalGrades: any) => {
        const newLocalGrades = JSON.parse(JSON.stringify(prevLocalGrades));
        let updatedCount = 0;

        pastedRows.forEach((pastedValue, rowIndex) => {
          const currentStudentIndex = startStudentIndex + rowIndex;
          if (currentStudentIndex >= studentIds.length) return;

          const studentIdToUpdate = studentIds[currentStudentIndex];
          const studentGradeToUpdate = newLocalGrades[studentIdToUpdate];
          if (!studentGradeToUpdate) return;

          if (!studentGradeToUpdate.slm) {
            studentGradeToUpdate.slm = [];
          }

          const valuesInRow = splitRowIntoColumns(pastedValue);
          valuesInRow.forEach((val, colIndex) => {
            const gradeValueStr = val.trim();
            let currentTpIndex = tpIndex !== null ? tpIndex + colIndex : null;

            if (isSLM && currentTpIndex !== null && currentTpIndex >= localObjectives.length) return;

            if (gradeValueStr === "") {
              updatedCount++;
              if (isSLM) {
                let slm = studentGradeToUpdate.slm?.find(
                  (s: any) => s.id === item.id
                );
                if (!slm) {
                  slm = {
                    id: item.id,
                    name: slmName,
                    scores: Array(localObjectives.length).fill(null),
                  };
                  studentGradeToUpdate.slm.push(slm);
                }
                while (slm.scores.length < localObjectives.length) {
                  slm.scores.push(null);
                }
                if (
                  currentTpIndex !== null &&
                  currentTpIndex < slm.scores.length
                ) {
                  slm.scores[currentTpIndex] = null;
                }
              } else {
                if (colIndex === 0) {
                  studentGradeToUpdate[type] = null;
                }
              }
              return;
            }

            let finalValue: number | string | null = null;
            const qualitativeCode = gradeValueStr.toUpperCase();

            if (QUALITATIVE_DESCRIPTORS.hasOwnProperty(qualitativeCode)) {
              finalValue = qualitativeCode;
            } else {
              let numericValue = parseFloat(gradeValueStr.replace(",", "."));
              if (!isNaN(numericValue)) {
                numericValue = Math.round(numericValue);
                if (numericValue >= 0 && numericValue <= 100) {
                  finalValue = numericValue;
                }
              }
            }

            if (finalValue !== null) {
              updatedCount++;
              if (isSLM) {
                let slm = studentGradeToUpdate.slm?.find(
                  (s: any) => s.id === item.id
                );
                if (!slm) {
                  slm = {
                    id: item.id,
                    name: slmName,
                    scores: Array(localObjectives.length).fill(null),
                  };
                  studentGradeToUpdate.slm.push(slm);
                }
                while (slm.scores.length < localObjectives.length) {
                  slm.scores.push(null);
                }
                if (
                  currentTpIndex !== null &&
                  currentTpIndex < slm.scores.length
                ) {
                  slm.scores[currentTpIndex] = finalValue;
                }
              } else {
                if (colIndex === 0) {
                  studentGradeToUpdate[type] = finalValue;
                }
              }
            }
          });
        });

        if (updatedCount > 0) {
          showToast(`${updatedCount} nilai berhasil ditempel.`, "success");
        } else {
          showToast(
            "Tidak ada nilai valid yang ditemukan untuk ditempel.",
            "error"
          );
        }

        return newLocalGrades;
      });
    },
    [relevantStudents, isSLM, item, slmName, localObjectives, type, showToast, setLocalGrades]
  );

  return {
    handleBulkGenerateDescriptions,
    handlePaste,
  };
};
