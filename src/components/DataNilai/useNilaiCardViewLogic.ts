import { useState, useMemo, useCallback, useRef } from "react";
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
    () => getGradeNumber(settings.nama_kelas) ?? 6,
    [settings.nama_kelas],
  );

  const objectivesForSubject = useMemo(() => {
    const gradeKey = `Kelas ${gradeNumber || 6}`;
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

  const prevSlmsRef = useRef<any[]>([]);

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

    const nextList = Array.from(slmMap.values());
    const prevList = prevSlmsRef.current;
    let isEqual = prevList.length === nextList.length;
    if (isEqual) {
      for (let i = 0; i < nextList.length; i++) {
        const a = prevList[i];
        const b = nextList[i];
        const tpsA = a.tps || [];
        const tpsB = b.tps || [];
        if (a.id !== b.id || a.name !== b.name || tpsA.length !== tpsB.length) {
          isEqual = false;
          break;
        }
        for (let j = 0; j < tpsA.length; j++) {
          if (tpsA[j]?.text !== tpsB[j]?.text || tpsA[j]?.isEdited !== tpsB[j]?.isEdited) {
            isEqual = false;
            break;
          }
        }
        if (!isEqual) break;
      }
    }
    if (isEqual) {
      return prevList;
    }
    prevSlmsRef.current = nextList;
    return nextList;
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

  const gradeByStudentIdMap = useMemo(() => {
    const map = new Map<string, any>();
    (grades || []).forEach((g) => {
      if (g?.studentId) map.set(String(g.studentId), g);
    });
    return map;
  }, [grades]);

  const getCompletionStatus = useCallback(
    (type, item) => {
      let filled = 0;
      let total = 0;

      relevantStudents.forEach((student) => {
        const studentGrades = gradeByStudentIdMap.get(String(student.id))
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
        } else if ((type === "sts" || type === "sas") && studentGrades) {
          total++;
          const scoreVal =
            studentGrades[type] ??
            (type === "sts"
              ? (studentGrades.sts2 ?? studentGrades.sts1)
              : (studentGrades.sas2 ?? studentGrades.sas1));
          if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
            filled++;
          }
        } else if (type === "sts" || type === "sas") {
          total++;
        }
      });

      return {
        filled,
        total,
        percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      };
    },
    [relevantStudents, gradeByStudentIdMap, subject.id],
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
