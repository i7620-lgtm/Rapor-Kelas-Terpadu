import { useState, useMemo, useCallback } from "react";
import { getGradeNumber } from "../../utils/nilaiHelpers";

export const useNilaiCardViewLogic = ({
  subject,
  students,
  grades,
  settings,
  learningObjectives,
  predefinedCurriculum,
}) => {
  const [isSummativeModalOpen, setIsSummativeModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isManageSlmModalOpen, setIsManageSlmModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const gradeNumber = useMemo(
    () => getGradeNumber(settings.nama_kelas),
    [settings.nama_kelas],
  );

  const objectivesForSubject = useMemo(() => {
    const gradeKey = `Kelas ${gradeNumber}`;
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return (
      (learningObjectives &&
        learningObjectives[gradeKey] &&
        learningObjectives[gradeKey][curriculumKey]) ||
      []
    );
  }, [
    learningObjectives,
    gradeNumber,
    subject.curriculumKey,
    subject.fullName,
  ]);

  const predefinedSlms = useMemo(() => {
    if (!predefinedCurriculum) return [];
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return predefinedCurriculum[curriculumKey] || [];
  }, [predefinedCurriculum, subject]);

  const allSlms = useMemo(() => {
    const slmMap = new Map();

    predefinedSlms.forEach((pSlm, index) => {
      const slmId = `slm_predefined_${subject.id}_${index}`;
      slmMap.set(slmId, {
        id: slmId,
        name: pSlm.slm,
        tps: pSlm.tp.map((tpText) => ({ text: tpText, isEdited: false })),
      });
    });

    const userObjectivesBySlm = objectivesForSubject.reduce((acc, tp) => {
      if (!acc[tp.slmId]) acc[tp.slmId] = [];
      acc[tp.slmId].push({ text: tp.text, isEdited: tp.isEdited === true });
      return acc;
    }, {});

    Object.entries(userObjectivesBySlm).forEach(([slmId, tps]) => {
      if (slmMap.has(slmId)) {
        const existingSlm = slmMap.get(slmId);
        slmMap.set(slmId, { ...existingSlm, tps });
      } else {
        const slmNameFromGrades =
          grades.length > 0
            ? (grades[0].detailedGrades?.[subject.id]?.slm || []).find(
                (s) => s.id === slmId,
              )?.name
            : null;
        slmMap.set(slmId, {
          id: slmId,
          name: slmNameFromGrades || "Lingkup Materi Kustom",
          tps,
        });
      }
    });

    grades.forEach((grade) => {
      const subjectGrades = grade.detailedGrades?.[subject.id];
      if (subjectGrades && subjectGrades.slm) {
        subjectGrades.slm.forEach((slmGrade) => {
          if (!slmMap.has(slmGrade.id)) {
            slmMap.set(slmGrade.id, {
              id: slmGrade.id,
              name: slmGrade.name,
              tps: slmGrade.tps || [],
            });
          }
        });
      }
    });

    return Array.from(slmMap.values());
  }, [predefinedSlms, objectivesForSubject, subject.id, grades]);

  const activeSlmIds = useMemo(() => {
    const savedVisibility = settings.slmVisibility?.[subject.id];
    const allIds = allSlms.map((s) => s.id);
    if (savedVisibility && Array.isArray(savedVisibility)) {
      return savedVisibility.filter((id) => allIds.includes(id));
    }
    return allIds;
  }, [settings.slmVisibility, subject.id, allSlms]);

  const handleOpenModal = (type, item = null) => {
    setModalData({ type, item });
    setIsSummativeModalOpen(true);
  };

  const relevantStudents = useMemo(() => {
    const curriculumKey = subject.curriculumKey || subject.fullName;

    if (
      subject.id === "PAKTTMYME" ||
      curriculumKey.toLowerCase().includes("kepercayaan terhadap tuhan")
    ) {
      return students.filter(
        (s) =>
          String(s.agama || "")
            .trim()
            .toLowerCase() === "kepercayaan",
      );
    }

    if (curriculumKey.toLowerCase().startsWith("pendidikan agama")) {
      const religionMatch = curriculumKey.match(/\(([^)]+)\)/);
      if (religionMatch) {
        const religion = religionMatch[1].trim().toLowerCase();
        return students.filter(
          (s) => String(s.agama || "").toLowerCase() === religion,
        );
      }
    }

    return students;
  }, [students, subject.fullName, subject.curriculumKey, subject.id]);

  const getCompletionStatus = useCallback(
    (type, item) => {
      let filled = 0;
      let total = 0;

      relevantStudents.forEach((student) => {
        const studentGrades = grades.find((g) => g.studentId === student.id)
          ?.detailedGrades?.[subject.id];

        if (type === "slm" && studentGrades?.slm) {
          const slmData = studentGrades.slm.find((s) => s.id === item.id);
          if (slmData) {
            item.tps.forEach((_, tpIndex) => {
              total++;
              if (
                slmData.scores &&
                slmData.scores[tpIndex] !== undefined &&
                slmData.scores[tpIndex] !== null &&
                slmData.scores[tpIndex] !== ""
              ) {
                filled++;
              }
            });
          } else {
            total += item.tps.length;
          }
        } else if (
          ["sts1", "sts2", "sas1", "sas2"].includes(type) &&
          studentGrades
        ) {
          total++;
          if (
            studentGrades[type] !== undefined &&
            studentGrades[type] !== null &&
            studentGrades[type] !== ""
          ) {
            filled++;
          }
        } else if (["sts1", "sts2", "sas1", "sas2"].includes(type)) {
          total++;
        }
      });

      return {
        filled,
        total,
        percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      };
    },
    [relevantStudents, grades, subject.id],
  );

  return {
    isSummativeModalOpen,
    setIsSummativeModalOpen,
    modalData,
    isManageSlmModalOpen,
    setIsManageSlmModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    allSlms,
    activeSlmIds,
    gradeNumber,
    handleOpenModal,
    getCompletionStatus,
  };
};
