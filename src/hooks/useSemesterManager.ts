import { useCallback } from "react";

export const useSemesterManager = ({
  settings,
  pendingSemester,
  setSettings,
  setShowSemesterModal,
  setStudents,
  setGrades,
  setAttendance,
  setNotes,
  setCocurricularData,
  setStudentExtracurriculars,
  setFormativeJournal,
  showToast,
}) => {
  const handleSemesterChangeConfirm = useCallback((options) => {
    setSettings((prev) => ({ ...prev, semester: pendingSemester }));

    if (!options.students) {
      setStudents([]);
    }

    if (!options.grades) {
      setGrades([]);
    } else if (pendingSemester === "Genap") {
      setGrades((prev) =>
        prev.map((g) => {
          const newG = { ...g, detailedGrades: { ...g.detailedGrades } };
          Object.keys(newG.detailedGrades).forEach((subId) => {
            const d = { ...newG.detailedGrades[subId] };
            if (d.descriptions && !d.descriptions_Genap) {
              d.descriptions_Genap = { ...d.descriptions };
            }
            newG.detailedGrades[subId] = d;
          });
          return newG;
        })
      );
    }

    if (!options.attendance) {
      setAttendance([]);
    } else {
      setAttendance((prev) => {
        const currentSem = settings.semester || "Ganjil";
        const currentSemData = prev.filter(
          (a) => (a.semester || "Ganjil") === currentSem
        );
        const newSemData = currentSemData.map((a) => ({
          ...a,
          semester: pendingSemester,
        }));
        const rest = prev.filter(
          (a) => (a.semester || "Ganjil") !== pendingSemester
        );
        return [...rest, ...newSemData];
      });
    }

    if (!options.notes) {
      setNotes({});
    } else {
      setNotes((prev) => {
        const newNotes = { ...prev };
        Object.keys(newNotes).forEach((k) => {
          if (
            settings.semester !== "Genap" &&
            !k.endsWith("_Genap") &&
            pendingSemester === "Genap"
          ) {
            newNotes[k + "_Genap"] = newNotes[k];
          } else if (
            settings.semester === "Genap" &&
            k.endsWith("_Genap") &&
            pendingSemester !== "Genap"
          ) {
            newNotes[k.replace("_Genap", "")] = newNotes[k];
          }
        });
        return newNotes;
      });
    }

    if (!options.cocurricularData) {
      setCocurricularData({});
    } else {
      setCocurricularData((prev) => {
        const newData = { ...prev };
        Object.keys(newData).forEach((sid) => {
          if (pendingSemester === "Genap" && newData[sid].dimensionRatings) {
            newData[sid].dimensionRatings_Genap = {
              ...newData[sid].dimensionRatings,
            };
          } else if (
            pendingSemester !== "Genap" &&
            newData[sid].dimensionRatings_Genap
          ) {
            newData[sid].dimensionRatings = {
              ...newData[sid].dimensionRatings_Genap,
            };
          }
        });
        return newData;
      });
    }

    if (!options.studentExtracurriculars) {
      setStudentExtracurriculars([]);
    } else {
      setStudentExtracurriculars((prev) => {
        const currentSem = settings.semester || "Ganjil";
        const currentSemData = prev.filter(
          (s) => (s.semester || "Ganjil") === currentSem
        );
        const newSemData = currentSemData.map((s) => ({
          ...s,
          semester: pendingSemester,
        }));
        const rest = prev.filter(
          (s) => (s.semester || "Ganjil") !== pendingSemester
        );
        return [...rest, ...newSemData];
      });
    }

    if (!options.formativeJournal) {
      setFormativeJournal({});
    }

    setShowSemesterModal(false);
    showToast("Semester berhasil diubah.");
  }, [
    settings.semester,
    pendingSemester,
    setSettings,
    setStudents,
    setGrades,
    setAttendance,
    setNotes,
    setCocurricularData,
    setStudentExtracurriculars,
    setFormativeJournal,
    setShowSemesterModal,
    showToast,
  ]);

  return { handleSemesterChangeConfirm };
};
