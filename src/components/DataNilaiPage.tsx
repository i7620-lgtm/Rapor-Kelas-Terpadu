import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { NilaiCardView } from "./DataNilai/NilaiCardView";
import { NilaiTableView } from "./DataNilai/NilaiTableView";
import { NilaiKeseluruhanView } from "./DataNilai/NilaiKeseluruhanView";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useStudentsStore } from "../stores/useStudentsStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";
import { EmptyState } from "./EmptyState";

const DataNilaiPage = ({ activeTab = "keseluruhan", onTabChange, ...props }: any) => {
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

  const onUpdatePredikats = props.onUpdatePredikats || ((p: any) => {
    useSettingsStore.getState().setSettings((s: any) => ({ ...s, predikats: p }));
  });

  const onUpdateGradeCalculation = props.onUpdateGradeCalculation || ((sid: any, conf: any) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      gradeCalculation: {
        ...s.gradeCalculation,
        [sid]: conf,
      },
    }));
  });

  const onUpdateSlmVisibility = props.onUpdateSlmVisibility || ((sid: any, vis: any) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      slmVisibility: {
        ...s.slmVisibility,
        [sid]: vis,
      },
    }));
  });

  const onUpdateDisplayMode = props.onUpdateDisplayMode || ((mode: any) => {
    useSettingsStore.getState().setSettings((s: any) => ({
      ...s,
      nilaiDisplayMode: mode,
    }));
  });

  const onBulkAddSlm = props.onBulkAddSlm || ((subId: any, slm: any) => {
    useNilaiStore.getState().bulkAddSlm(subId, slm);
  });

  const onBulkUpdateGrades = props.onBulkUpdateGrades || ((u: any) => {
    useNilaiStore.getState().bulkUpdateGrades(u, settings, learningObjectives, predefinedCurriculum, subjects);
  });

  const onUpdateLearningObjectives = props.onUpdateLearningObjectives || ((u: any) => {
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

  const activeSubjects = useMemo(() => subjects.filter((s: any) => s.active), [subjects]);
  const selectedSubject = useMemo(() => activeSubjects.find((s: any) => s.id === activeTab), [activeTab, activeSubjects]);

  const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors";
  const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-md";

  const renderSubjectView = () => {
    if (!selectedSubject) return null;

    const displayMode = settings.nilaiDisplayMode || "kuantitatif saja";

    switch (displayMode) {
      case "kuantitatif saja":
        return <NilaiTableView {...mergedProps} subject={selectedSubject} key={selectedSubject.id} mode="kuantitatif" />;
      case "kualitatif saja":
        return <NilaiTableView {...mergedProps} subject={selectedSubject} key={selectedSubject.id} mode="kualitatif" />;
      default:
        return <NilaiCardView {...mergedProps} subject={selectedSubject} key={selectedSubject.id} />;
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-4 sm:pt-8">
      <div className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800">Data Nilai</h2>
        <p className="mt-1 text-slate-600">Kelola nilai sumatif siswa per mata pelajaran untuk perhitungan nilai rapor.</p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Data nilai tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 flex-shrink-0">
            <button
              onClick={() => onTabChange("keseluruhan")}
              className={activeTab === "keseluruhan" ? activeButtonClass : inactiveButtonClass}
            >
              Nilai Keseluruhan
            </button>
            {activeSubjects.map((subject: any) => (
              <button
                key={subject.id}
                onClick={() => onTabChange(subject.id)}
                className={activeTab === subject.id ? activeButtonClass : inactiveButtonClass}
              >
                {subject.label}
              </button>
            ))}
          </div>
          <div className="pt-4">
            {activeTab === "keseluruhan" ? (
              <NilaiKeseluruhanView {...mergedProps} />
            ) : (
              renderSubjectView()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataNilaiPage;
