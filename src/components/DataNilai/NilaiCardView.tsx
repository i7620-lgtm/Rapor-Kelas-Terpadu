import React, { useState, useMemo, useCallback } from "react";
import { GradeSettingsModal } from "./GradeSettingsModal";
import { 
  getGradeNumber
} from "../../utils/nilaiHelpers";

export const NilaiCardView = (props) => {
  const {
    subject,
    students,
    grades,
    settings,
    learningObjectives,
    onBulkUpdateGrades,
    onUpdateLearningObjectives,
    onUpdateGradeCalculation,
    showToast,
    onUpdateSlmVisibility,
    onUpdateDisplayMode,
    predefinedCurriculum,
  } = props;

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
      (grade.detailedGrades?.[subject.id]?.slm || []).forEach((gradeSlm) => {
        if (gradeSlm && gradeSlm.id) {
          if (!slmMap.has(gradeSlm.id)) {
            slmMap.set(gradeSlm.id, {
              id: gradeSlm.id,
              name: gradeSlm.name || "Lingkup Materi Lama",
              tps: (gradeSlm.scores || []).map(() => ({
                text: "TP dari data lama",
                isEdited: true,
              })),
            });
          } else {
            const existingSlm = slmMap.get(gradeSlm.id);
            if (gradeSlm.name && gradeSlm.name !== existingSlm.name) {
              slmMap.set(gradeSlm.id, { ...existingSlm, name: gradeSlm.name });
            }
          }
        }
      });
    });

    return Array.from(slmMap.values());
  }, [objectivesForSubject, grades, subject.id, predefinedSlms]);

  const handleOpenModal = (type, item) => {
    setModalData({ type, item });
    setIsSummativeModalOpen(true);
  };

  const handleSaveSlmSettings = (newActiveIds) => {
    if (onUpdateSlmVisibility) {
      onUpdateSlmVisibility(subject.id, newActiveIds);
    }
  };

  const getCompletionStatus = useCallback(
    (type, item) => {
      const totalStudents = students.length;
      if (totalStudents === 0) return { filled: 0, total: 0, percentage: 0 };

      let filledCount = 0;
      if (type === "slm") {
        grades.forEach((grade) => {
          const slm = grade.detailedGrades?.[subject.id]?.slm?.find(
            (s) => s.id === item.id,
          );
          if (
            slm &&
            slm.scores &&
            slm.scores.some((s) => s !== null && s !== undefined && s !== "")
          ) {
            filledCount++;
          }
        });
      } else {
        // sts or sas
        grades.forEach((grade) => {
          const score = grade.detailedGrades?.[subject.id]?.[type];
          if (score !== null && score !== undefined && score !== "") {
            filledCount++;
          }
        });
      }

      return {
        filled: filledCount,
        total: totalStudents,
        percentage:
          totalStudents > 0
            ? Math.round((filledCount / totalStudents) * 100)
            : 0,
      };
    },
    [students, grades, subject.id],
  );

  const AssessmentCard = ({ title, type, item }) => {
    const { filled, total, percentage } = getCompletionStatus(type, item);
    let statusColor = "bg-slate-200";
    if (percentage > 0) statusColor = "bg-yellow-400";
    if (percentage === 100) statusColor = "bg-green-500";

    return React.createElement(
      "div",
      {
        className:
          "bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between",
        onClick: () => handleOpenModal(type, item),
      },
      React.createElement(
        "div",
        { className: "p-4" },
        React.createElement(
          "h4",
          { className: "font-bold text-slate-800" },
          title,
        ),
        type === "slm" &&
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 mt-1" },
            `${item.tps?.length || 0} Tujuan Pembelajaran`,
          ),
      ),
      React.createElement(
        "div",
        { className: "p-4 bg-slate-50 rounded-b-lg border-t" },
        React.createElement(
          "div",
          {
            className:
              "flex justify-between items-center text-xs text-slate-600 mb-1",
          },
          React.createElement("span", null, "Kelengkapan Nilai"),
          React.createElement(
            "span",
            { className: "font-semibold" },
            `${filled}/${total}`,
          ),
        ),
        React.createElement(
          "div",
          { className: "w-full bg-slate-200 rounded-full h-2" },
          React.createElement("div", {
            className: `h-2 rounded-full ${statusColor}`,
            style: { width: `${percentage}%` },
          }),
        ),
      ),
    );
  };

  return React.createElement(
    "div",
    null,
    isSettingsModalOpen &&
      React.createElement(GradeSettingsModal, {
        isOpen: isSettingsModalOpen,
        onClose: () => setIsSettingsModalOpen(false),
        subject: subject,
        settings: settings,
        onUpdatePredikats: props.onUpdatePredikats,
        onUpdateGradeCalculation: onUpdateGradeCalculation,
        onUpdateDisplayMode: onUpdateDisplayMode,
      }),
    isManageSlmModalOpen &&
      React.createElement(ManageSlmModal, {
        isOpen: isManageSlmModalOpen,
        onClose: () => setIsManageSlmModalOpen(false),
        onSave: { onSaveSlmSettings: handleSaveSlmSettings, settings },
        subject,
        students,
        grades,
        learningObjectives,
        onUpdateLearningObjectives,
        onBulkUpdateGrades,
        allSlms,
        initialActiveIds:
          settings.slmVisibility?.[subject.id] || allSlms.map((s) => s.id),
        showToast,
        gradeNumber,
        predefinedCurriculum,
      }),
    isSummativeModalOpen &&
      React.createElement(SummativeModal, {
        isOpen: isSummativeModalOpen,
        onClose: () => setIsSummativeModalOpen(false),
        modalData: modalData,
        students: students,
        grades: grades,
        subject: subject,
        objectives: learningObjectives,
        onUpdateObjectives: onUpdateLearningObjectives,
        onBulkUpdateGrades: onBulkUpdateGrades,
        gradeNumber: gradeNumber,
        settings: settings,
        onUpdateGradeCalculation: onUpdateGradeCalculation,
        showToast: showToast,
        predefinedCurriculum: predefinedCurriculum,
      }),
    React.createElement(
      "div",
      {
        className:
          "p-4 border-b border-slate-200 bg-white rounded-t-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
      },
      React.createElement(
        "div",
        { className: "flex items-center gap-2" },
        React.createElement(
          "button",
          {
            onClick: () => setIsSettingsModalOpen(true),
            className:
              "px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700",
          },
          "Rentang Nilai & Pengolahan",
        ),
        React.createElement(
          "button",
          {
            onClick: () => setIsManageSlmModalOpen(true),
            className:
              "px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200",
          },
          "Atur Lingkup Materi & TP",
        ),
      ),
      React.createElement(
        "p",
        { className: "text-sm text-slate-500" },
        "Klik pada kartu untuk menginput atau mengedit nilai.",
      ),
    ),

    React.createElement(
      "div",
      { className: "p-4 space-y-6 bg-slate-50 rounded-b-xl" },
      React.createElement(
        "section",
        null,
        React.createElement(
          "h3",
          {
            className:
              "text-lg font-semibold text-slate-700 mb-3 border-b pb-2",
          },
          "Sumatif Lingkup Materi (SLM)",
        ),
        (() => {
          const visibleSlms = allSlms.filter(
            (slm) =>
              !settings.slmVisibility?.[subject.id] ||
              settings.slmVisibility[subject.id].includes(slm.id),
          );
          return visibleSlms.length > 0
            ? React.createElement(
                "div",
                {
                  className:
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
                },
                visibleSlms.map((slm) =>
                  React.createElement(AssessmentCard, {
                    key: slm.id,
                    title: slm.name,
                    type: "slm",
                    item: slm,
                  }),
                ),
              )
            : React.createElement(
                "p",
                { className: "text-sm text-slate-500" },
                "Belum ada Lingkup Materi yang diatur (atau ditampilkan) untuk mata pelajaran ini.",
              );
        })(),
      ),

      React.createElement(
        "section",
        null,
        React.createElement(
          "h3",
          {
            className:
              "text-lg font-semibold text-slate-700 mb-3 border-b pb-2",
          },
          "Sumatif Tengah & Akhir Semester",
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          (!settings.semester || settings.semester === "Ganjil") &&
            React.createElement(AssessmentCard, {
              title: "Sumatif Tengah Semester I (Ganjil)",
              type: "sts1",
              item: {},
            }),
          settings.semester === "Genap" &&
            React.createElement(AssessmentCard, {
              title: "Sumatif Tengah Semester II (Genap)",
              type: "sts2",
              item: {},
            }),
          (!settings.semester || settings.semester === "Ganjil") &&
            React.createElement(AssessmentCard, {
              title: "Sumatif Akhir Semester I (Ganjil)",
              type: "sas1",
              item: {},
            }),
          settings.semester === "Genap" &&
            React.createElement(AssessmentCard, {
              title:
                gradeNumber === 6 ? "US" : "Sumatif Akhir Semester II (Genap)",
              type: "sas2",
              item: {},
            }),
        ),
      ),
    ),
  );
};

