import React, {
  useMemo,
} from "react";
import { useShallow } from "zustand/react/shallow";

import {
  getGradeNumber,
  getNumericValue,
  getQualitativeCode,
  splitRowIntoColumns,
  capitalize,
  lowercaseFirst,
  generateSubjectDescription,
} from "../utils/nilaiHelpers";

// Re-export helpers for backward compatibility
export {
  getGradeNumber,
  getNumericValue,
  getQualitativeCode,
  splitRowIntoColumns,
  capitalize,
  lowercaseFirst,
  generateSubjectDescription,
};

import { NilaiCardView } from "./DataNilai/NilaiCardView";
import { NilaiTableView } from "./DataNilai/NilaiTableView";
import { NilaiKeseluruhanView } from "./DataNilai/NilaiKeseluruhanView";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useStudentsStore } from "../stores/useStudentsStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";
import { EmptyState } from "./EmptyState";

const DataNilaiPage = ({
  activeTab = "keseluruhan",
  onTabChange,
  ...props
}) => {
  const { storeSubjects, storeSettings } = useSettingsStore(
    useShallow((state) => ({
      storeSubjects: state.subjects,
      storeSettings: state.settings,
    }))
  );
  const storeGrades = useNilaiStore(useShallow((state) => state.grades));
  const storeStudents = useStudentsStore(useShallow((state) => state.students));
  const { storeLearningObjectives, storePredefinedCurriculum } = useCurriculumStore(
    useShallow((state) => ({
      storeLearningObjectives: state.learningObjectives,
      storePredefinedCurriculum: state.predefinedCurriculum,
    }))
  );

  const subjects = props.subjects || storeSubjects;
  const settings = props.settings || storeSettings;
  const grades = props.grades || storeGrades;
  const students = props.students || storeStudents;
  const learningObjectives = props.learningObjectives || storeLearningObjectives;
  const predefinedCurriculum = props.predefinedCurriculum || storePredefinedCurriculum;

  const onUpdatePredikats = props.onUpdatePredikats || ((p) => {
    useSettingsStore.getState().setSettings((s: any) => ({ ...s, predikats: p }));
  });

  const onUpdateGradeCalculation = props.onUpdateGradeCalculation || ((sid, conf) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      gradeCalculation: {
        ...s.gradeCalculation,
        [sid]: conf,
      },
    }));
  });

  const onUpdateSlmVisibility = props.onUpdateSlmVisibility || ((sid, vis) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      slmVisibility: {
        ...s.slmVisibility,
        [sid]: vis,
      },
    }));
  });

  const onUpdateDisplayMode = props.onUpdateDisplayMode || ((mode) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      nilaiDisplayMode: mode,
    }));
  });

  const onBulkAddSlm = props.onBulkAddSlm || ((subId, slm) => {
    useNilaiStore.getState().bulkAddSlm(subId, slm);
  });

  const onBulkUpdateGrades = props.onBulkUpdateGrades || ((u) => {
    useNilaiStore.getState().bulkUpdateGrades(u, settings, learningObjectives, predefinedCurriculum, subjects);
  });

  const onUpdateLearningObjectives = props.onUpdateLearningObjectives || ((u) => {
      useCurriculumStore.getState().setLearningObjectives(u);
  });

  const mergedProps = {
    ...props,
    subjects,
    settings,
    grades,
    students,
    learningObjectives,
    predefinedCurriculum,
    onUpdatePredikats,
    onUpdateGradeCalculation,
    onUpdateSlmVisibility,
    onUpdateDisplayMode,
    onBulkAddSlm,
    onBulkUpdateGrades,
    onUpdateLearningObjectives
  };

  const activeSubjects = useMemo(
    () => subjects.filter((s) => s.active),
    [subjects],
  );
  const selectedSubject = useMemo(
    () => activeSubjects.find((s) => s.id === activeTab),
    [activeTab, activeSubjects],
  );

  const inactiveButtonClass =
    "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors";
  const activeButtonClass =
    "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-md";

  const renderSubjectView = () => {
    if (!selectedSubject) return null;

    const displayMode = settings.nilaiDisplayMode || "kuantitatif saja";

    switch (displayMode) {
      case "kuantitatif saja":
        return React.createElement(NilaiTableView, {
          ...mergedProps,
          subject: selectedSubject,
          key: selectedSubject.id,
          mode: "kuantitatif",
        });
      case "kualitatif saja":
        return React.createElement(NilaiTableView, {
          ...mergedProps,
          subject: selectedSubject,
          key: selectedSubject.id,
          mode: "kualitatif",
        });
      default:
        return React.createElement(NilaiCardView, {
          ...mergedProps,
          subject: selectedSubject,
          key: selectedSubject.id,
        });
    }
  };

  return React.createElement(
    "div",
    { className: "flex flex-col gap-4 pt-4 sm:pt-8" },
    React.createElement(
      "div",
      { className: "flex-shrink-0" },
      React.createElement(
        "h2",
        { className: "text-3xl font-bold text-slate-800" },
        "Data Nilai",
      ),
      React.createElement(
        "p",
        { className: "mt-1 text-slate-600" },
        "Kelola nilai sumatif siswa per mata pelajaran untuk perhitungan nilai rapor.",
        React.createElement("br", null),
        React.createElement(
          "span",
          { className: "text-sm text-indigo-600" },
          "💡 Tips: Anda dapat copy-paste nilai dari Excel ke kolom-kolom nilai mata pelajaran, serta menyeleksi/memblok grid pada 'Nilai Keseluruhan' untuk disalin (copy) kembali ke Excel.",
        ),
      ),
    ),

    students.length === 0
      ? React.createElement(EmptyState, {
          title: "Belum ada data siswa",
          description: "Data nilai tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu.",
          primaryActionLabel: "Isi Data Siswa",
          onPrimaryAction: () => props.setActivePage && props.setActivePage('DATA_SISWA')
        })
      : React.createElement(
          "div",
          { className: "flex flex-col" },
          React.createElement(
            "div",
            {
              className:
                "flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 flex-shrink-0",
            },
            React.createElement(
              "button",
              {
                onClick: () => onTabChange("keseluruhan"),
                className:
                  activeTab === "keseluruhan"
                    ? activeButtonClass
                    : inactiveButtonClass,
              },
              "Nilai Keseluruhan",
            ),
            activeSubjects.map((subject) =>
              React.createElement(
                "button",
                {
                  key: subject.id,
                  onClick: () => onTabChange(subject.id),
                  className:
                    activeTab === subject.id
                      ? activeButtonClass
                      : inactiveButtonClass,
                },
                subject.label,
              ),
            ),
          ),
          React.createElement(
            "div",
            { className: "pt-4" },
            activeTab === "keseluruhan"
              ? React.createElement(NilaiKeseluruhanView, mergedProps)
              : renderSubjectView(),
          ),
        ),
  );
};

export default DataNilaiPage;
