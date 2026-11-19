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
import { flushRegisteredInputs } from "../utils/dataIntegrity";

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
    const latestSettingsState = useSettingsStore.getState();
    const latestCurriculumState = useCurriculumStore.getState();
    useNilaiStore.getState().bulkUpdateGrades(
      u,
      props.settings || latestSettingsState.settings,
      props.learningObjectives || latestCurriculumState.learningObjectives,
      props.predefinedCurriculum || latestCurriculumState.predefinedCurriculum,
      props.subjects || latestSettingsState.subjects
    );
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

  const inactiveButtonClass = "min-h-[44px] lg:min-h-0 whitespace-nowrap shrink-0 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer";
  const activeButtonClass = "min-h-[44px] lg:min-h-0 whitespace-nowrap shrink-0 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-sm cursor-pointer";

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

  const handleTabSelect = (nextTab: string) => {
    flushRegisteredInputs();
    if (onTabChange) {
      onTabChange(nextTab);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0 mb-1 sm:mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Nilai</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Kelola nilai sumatif per mata pelajaran.</p>
        </div>
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
          <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2 flex-shrink-0 scrollbar-hide">
            <button
              onClick={() => handleTabSelect("keseluruhan")}
              className={activeTab === "keseluruhan" ? activeButtonClass : inactiveButtonClass}
            >
              Keseluruhan
            </button>
            {activeSubjects.map((subject: any) => (
              <button
                key={subject.id}
                onClick={() => handleTabSelect(subject.id)}
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
