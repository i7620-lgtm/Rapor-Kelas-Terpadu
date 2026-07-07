import { useState, useEffect, useMemo } from "react";
import { useGridSelection } from "../../hooks/useGridSelection";

export const useNilaiKeseluruhanLogic = ({
  students,
  grades,
  subjects,
  predikats: propPredikats,
  settings,
  showToast,
}) => {
  const predikats = propPredikats || settings?.predikats;
  const [sortBy, setSortBy] = useState("no");
  const [showIncompleteHighlight, setShowIncompleteHighlight] = useState(true);
  const [showMaxHighlight, setShowMaxHighlight] = useState(true);
  const [showMinHighlight, setShowMinHighlight] = useState(true);
  const activeSubjects = useMemo(
    () => subjects.filter((s) => s.active),
    [subjects],
  );

  const displaySubjects = useMemo(() => {
    const finalDisplaySubjects = [];
    const addedGroupPrefixes = new Set();
    const groups = [
      {
        prefix: "Pendidikan Agama dan Budi Pekerti",
        base: {
          id: "PABP",
          label: "PABP",
          fullName: "Pendidikan Agama dan Budi Pekerti",
          active: true,
        },
      },
      {
        prefix: "Seni Budaya",
        base: {
          id: "SB",
          label: "S. Rupa",
          fullName: "Seni Budaya",
          active: true,
        },
      },
      {
        prefix: "Muatan Lokal",
        base: {
          id: "Mulok",
          label: "B. Bali",
          fullName: "Muatan Lokal",
          active: true,
        },
      },
    ];
    for (const subject of activeSubjects) {
      let group = groups.find((g) => subject.fullName.startsWith(g.prefix));

      // Map Kepercayaan to PABP group
      if (
        !group &&
        (subject.id === "PAKTTMYME" ||
          subject.fullName.toLowerCase().includes("kepercayaan terhadap tuhan"))
      ) {
        group = groups.find((g) => g.base.id === "PABP");
      }

      if (group) {
        if (!addedGroupPrefixes.has(group.prefix)) {
          finalDisplaySubjects.push(group.base);
          addedGroupPrefixes.add(group.prefix);
        }
      } else finalDisplaySubjects.push(subject);
    }
    const sortOrder = {
      PABP: 1,
      PP: 2,
      BIndo: 3,
      MTK: 4,
      IPAS: 5,
      SB: 6,
      PJOK: 7,
      BIng: 8,
      Mulok: 9,
    };
    finalDisplaySubjects.sort(
      (a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99),
    );
    return finalDisplaySubjects;
  }, [activeSubjects]);

  const processedData = useMemo(() => {
    const predicateCValue = parseInt(predikats?.c, 10);

    const dataWithCalculations = students.map((student, index) => {
      const studentGrades = grades.find((g) => g.studentId === student.id) || {
        studentId: student.id,
        detailedGrades: {},
        finalGrades: {},
      };

      let hasFailingGrade = false;
      let hasMissingGrade = false;
      
      const studentReligionLower = String(student.agama || "")
        .trim()
        .toLowerCase();

      const relevantSubjectsForCheck = activeSubjects.filter((subject) => {
        const subjectFullNameLower = subject.fullName.toLowerCase();

        // Handle Kepercayaan explicitly
        if (
          subject.id === "PAKTTMYME" ||
          subjectFullNameLower.includes("kepercayaan terhadap tuhan")
        ) {
          return studentReligionLower === "kepercayaan";
        }

        if (subjectFullNameLower.startsWith("pendidikan agama")) {
          if (!studentReligionLower) return false;

          const religionMatch = subjectFullNameLower.match(/\(([^)]+)\)/);
          if (religionMatch) {
            return (
              religionMatch[1].trim().toLowerCase() === studentReligionLower
            );
          }
          return false;
        }
        return true;
      });

      for (const subject of relevantSubjectsForCheck) {
        const grade = studentGrades.finalGrades?.[subject.id];
        if (
          grade === undefined ||
          grade === null ||
          grade === ""
        ) {
          hasMissingGrade = true;
        } else if (
          !isNaN(predicateCValue) &&
          typeof grade === "number" &&
          grade < predicateCValue
        ) {
          hasFailingGrade = true;
        }
      }

      let total = 0,
        subjectCount = 0;
      const displayGrades = displaySubjects.reduce((acc, displaySubject) => {
        let grade;
        if (displaySubject.id === "PABP") {
          const studentReligionLower = String(student.agama || "")
            .trim()
            .toLowerCase();
          if (studentReligionLower) {
            let matchedSubject = null;
            if (studentReligionLower === "kepercayaan") {
              matchedSubject = activeSubjects.find((s) => s.id === "PAKTTMYME");
            } else {
              matchedSubject = activeSubjects.find(
                (s) =>
                  s.fullName.startsWith("Pendidikan Agama dan Budi Pekerti") &&
                  s.fullName
                    .toLowerCase()
                    .includes(`(${studentReligionLower})`),
              );
            }
            if (matchedSubject) {
              grade = studentGrades.finalGrades?.[matchedSubject.id];
            }
          }
        } else if (["SB", "Mulok"].includes(displaySubject.id)) {
          const memberSubjects = activeSubjects.filter((s) =>
            s.fullName.startsWith(displaySubject.fullName),
          );
          for (const member of memberSubjects) {
            const memberGrade = studentGrades.finalGrades?.[member.id];
            if (memberGrade !== undefined && memberGrade !== null) {
              grade = memberGrade;
              break;
            }
          }
        } else {
          grade = studentGrades.finalGrades?.[displaySubject.id];
        }

        if (typeof grade === "number") {
          total += grade;
          subjectCount++;
        }
        acc[displaySubject.id] = grade;
        return acc;
      }, {});

      return {
        ...student,
        no: index + 1,
        grades: displayGrades,
        total,
        average: subjectCount > 0 ? (total / subjectCount).toFixed(2) : "0.00",
        hasFailingGrade,
        hasMissingGrade,
      };
    });

    const rankedData = [...dataWithCalculations]
      .sort((a, b) => b.total - a.total)
      .reduce((acc, student, index) => {
        const rank =
          index > 0 && student.total === acc[index - 1].total
            ? acc[index - 1].rank
            : index + 1;
        acc.push({ ...student, rank: student.total > 0 ? rank : "-" });
        return acc;
      }, []);

    const dataWithRanks = dataWithCalculations.map((d) => {
      const studentWithRank = rankedData.find((s) => s.id === d.id);
      return { ...d, rank: studentWithRank?.rank || "-" };
    });

    if (sortBy === "rank") {
      return dataWithRanks.sort((a, b) =>
        a.rank === "-"
          ? 1
          : b.rank === "-"
            ? -1
            : a.rank - b.rank || a.no - b.no,
      );
    }
    return dataWithRanks.sort((a, b) => a.no - b.no);
  }, [students, grades, sortBy, activeSubjects, displaySubjects, predikats, settings]);

  const subjectStats = useMemo(() => {
    const stats = {};
    for (const subject of displaySubjects) {
      const validGrades = processedData
        .map((d) => d.grades[subject.id])
        .filter((g) => g !== undefined && g !== null && g !== "" && !isNaN(g))
        .map((g) => (typeof g === "string" ? parseFloat(g) : g));

      if (validGrades.length > 0) {
        const maxVal = Math.max(...validGrades);
        const minVal = Math.min(...validGrades);
        stats[subject.id] = {
          maxVal,
          minVal,
          hasMultipleValues: maxVal !== minVal,
        };
      } else {
        stats[subject.id] = {
          maxVal: null,
          minVal: null,
          hasMultipleValues: false,
        };
      }
    }
    return stats;
  }, [processedData, displaySubjects]);

  const colsCount = 2 + displaySubjects.length + 2;

  const {
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  } = useGridSelection({
    rowsCount: processedData.length,
    colsCount: colsCount,
    containerClass: "keseluruhan-table-container",
  });

  useEffect(() => {
    const handleCopyGlobal = (e) => {
      const bounds = getSelectionBounds();
      if (!bounds) return;

      if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.tagName === "SELECT")
        ) {
          return;
        }
      }

      const isGridActive =
        document.activeElement?.tagName === "BODY" ||
        document.querySelector(".keseluruhan-table-container")?.contains(document.activeElement);
      if (!isGridActive) return;

      let tsv = "";
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        if (r < 0 || r >= processedData.length) continue;
        const row = processedData[r];
        let rowData = [];

        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (c < 0 || c >= colsCount) continue;

          if (c === 0) {
            rowData.push(sortBy === "rank" ? row.rank : row.no);
          } else if (c === 1) {
            rowData.push(row.namaLengkap);
          } else if (c >= 2 && c < 2 + displaySubjects.length) {
            const subjectId = displaySubjects[c - 2].id;
            const grade = row.grades[subjectId];
            rowData.push(grade !== null && grade !== undefined && grade !== "" ? grade : "-");
          } else if (c === 2 + displaySubjects.length) {
            rowData.push(row.total);
          } else if (c === 2 + displaySubjects.length + 1) {
            rowData.push(row.average);
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
  }, [getSelectionBounds, processedData, displaySubjects, sortBy, colsCount, showToast]);

  return {
    predikats,
    sortBy,
    setSortBy,
    showIncompleteHighlight,
    setShowIncompleteHighlight,
    showMaxHighlight,
    setShowMaxHighlight,
    showMinHighlight,
    setShowMinHighlight,
    displaySubjects,
    processedData,
    subjectStats,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  };
};
