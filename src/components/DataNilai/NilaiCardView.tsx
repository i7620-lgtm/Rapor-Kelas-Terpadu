import React from "react";
import { GradeSettingsModal } from "./GradeSettingsModal";
import { ManageSlmModal } from "./ManageSlmModal";
import { SummativeModal } from "./SummativeModal";
import { useNilaiCardViewLogic } from "./useNilaiCardViewLogic";
import { AssessmentCard } from "./AssessmentCard";

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

  const {
    isSummativeModalOpen,
    setIsSummativeModalOpen,
    modalData,
    isManageSlmModalOpen,
    setIsManageSlmModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    allSlms,
    gradeNumber,
    handleOpenModal,
    getCompletionStatus,
  } = useNilaiCardViewLogic(props);

  const handleSaveSlmSettings = (newActiveIds) => {
    if (onUpdateSlmVisibility) {
      onUpdateSlmVisibility(subject.id, newActiveIds);
    }
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
                    getCompletionStatus,
                    handleOpenModal,
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
              getCompletionStatus,
              handleOpenModal,
            }),
          settings.semester === "Genap" &&
            React.createElement(AssessmentCard, {
              title: "Sumatif Tengah Semester II (Genap)",
              type: "sts2",
              item: {},
              getCompletionStatus,
              handleOpenModal,
            }),
          (!settings.semester || settings.semester === "Ganjil") &&
            React.createElement(AssessmentCard, {
              title: "Sumatif Akhir Semester I (Ganjil)",
              type: "sas1",
              item: {},
              getCompletionStatus,
              handleOpenModal,
            }),
          settings.semester === "Genap" &&
            React.createElement(AssessmentCard, {
              title:
                gradeNumber === 6 ? "US" : "Sumatif Akhir Semester II (Genap)",
              type: "sas2",
              item: {},
              getCompletionStatus,
              handleOpenModal,
            }),
        ),
      ),
    ),
  );
};

