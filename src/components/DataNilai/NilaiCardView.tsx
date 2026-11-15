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
          "p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4",
      },
      React.createElement(
        "div",
        { className: "flex flex-wrap items-center gap-2" },
        React.createElement(
          "button",
          {
            onClick: () => setIsSettingsModalOpen(true),
            className:
              "min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer inline-flex items-center justify-center",
          },
          "Rentang Nilai & Pengolahan",
        ),
        React.createElement(
          "button",
          {
            onClick: () => setIsManageSlmModalOpen(true),
            className:
              "min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 cursor-pointer inline-flex items-center justify-center",
          },
          "Atur Lingkup Materi & TP",
        ),
      ),
      React.createElement(
        "p",
        { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400" },
        "Klik pada kartu untuk menginput atau mengedit nilai.",
      ),
    ),

    React.createElement(
      "div",
      { className: "p-4 space-y-6 bg-slate-50 dark:bg-slate-950/50 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700" },
      React.createElement(
        "section",
        null,
        React.createElement(
          "h3",
          {
            className:
              "text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1.5",
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
              "text-sm font-semibold text-slate-700 mb-2 border-b pb-1.5",
          },
          "Sumatif Tengah & Akhir Semester",
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement(AssessmentCard, {
            title:
              settings.semester === "Genap"
                ? "Sumatif Tengah Semester II (Genap)"
                : "Sumatif Tengah Semester I (Ganjil)",
            type: "sts",
            item: {},
            getCompletionStatus,
            handleOpenModal,
          }),
          React.createElement(AssessmentCard, {
            title:
              settings.semester === "Genap"
                ? gradeNumber === 6
                  ? "US"
                  : "Sumatif Akhir Semester II (Genap)"
                : "Sumatif Akhir Semester I (Ganjil)",
            type: "sas",
            item: {},
            getCompletionStatus,
            handleOpenModal,
          }),
        ),
      ),
    ),
  );
};

