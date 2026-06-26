import { useState, useCallback, useEffect, useRef } from "react";
import localforage from "localforage";

localforage.config({
  name: "ERaporApp",
  version: 1.0,
  storeName: "erapor_data",
  description: "E-Rapor Application Data",
});

import { NAV_ITEMS } from "./constants";
import useServiceWorker from "./hooks/useServiceWorker";
import useWindowDimensions from "./hooks/useWindowDimensions";

import { useAppStorage } from "./hooks/useAppStorage";
import { getGradeNumber } from "./utils/nilaiHelpers";
import { calculateFinalGrade } from "./utils/gradeCalculations";

import { useSemesterManager } from "./hooks/useSemesterManager";
import { useExcelManager } from "./hooks/useExcelManager";

import Navigation from "./components/Navigation";
import ActivePageRenderer from "./components/ActivePageRenderer";
import ERaporProcessorModal from "./components/ERaporProcessorModal";
import SemesterChangeModal from "./components/SemesterChangeModal";
import Toast from "./components/Toast";

const App = () => {
  useServiceWorker();
  const [activePage, setActivePage] = useState("DASHBOARD");
  const [targetSection, setTargetSection] = useState(null);
  const mainRef = useRef(null);

  const handleNavigate = useCallback((page, target = null) => {
    setActivePage(page);
    setTargetSection(target);
  }, []);

  useEffect(() => {
    if (targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el && mainRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activePage, targetSection]);

  const { isMobile } = useWindowDimensions();

  const {
    toast, setToast, showToast,
    isLoading, setIsLoading,
    activeNilaiTab, setActiveNilaiTab,
    isMobileMenuOpen, setIsMobileMenuOpen,
    isERaporModalOpen, setIsERaporModalOpen,
    pendingSemester,
    showSemesterModal, setShowSemesterModal,
    isDataLoaded,
    settings, setSettings,
    students, setStudents,
    grades, setGrades,
    notes, setNotes,
    cocurricularData, setCocurricularData,
    attendance, setAttendance,
    extracurriculars, setExtracurriculars,
    studentExtracurriculars, setStudentExtracurriculars,
    subjects, setSubjects,
    learningObjectives, setLearningObjectives,
    formativeJournal, setFormativeJournal,
    predefinedCurriculum
  } = useAppStorage();

  // Handle grade autocalculations based on students array size
  useEffect(() => {
    if (isDataLoaded && students.length > 0 && grades.length < students.length) {
      const newGrades = [...grades];
      let hasChanges = false;
      students.forEach((student) => {
        if (!newGrades.some((g) => g.studentId === student.id)) {
          newGrades.push({
            studentId: student.id,
            detailedGrades: {},
            finalGrades: {},
          });
          hasChanges = true;
        }
      });
      if (hasChanges) setGrades(newGrades);
    }
  }, [students.length, isDataLoaded]);

  // Handle auto calculations when settings or parameters change
  useEffect(() => {
    if (!isDataLoaded) return;
    setGrades((currentGrades) => {
      let anyChanged = false;
      const newGrades = currentGrades.map((studentGrade) => {
        const newFinalGrades = { ...studentGrade.finalGrades };
        let studentChanged = false;
        subjects.forEach((subj) => {
          const detailed = studentGrade.detailedGrades?.[subj.id];
          if (detailed) {
            const config = settings.gradeCalculation?.[subj.id] || { method: "rata-rata" };
            const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "5"}`;
            const curriculumKey = subj.curriculumKey || subj.fullName;
            const calculated = calculateFinalGrade(
              detailed, config, settings, subj.id, learningObjectives, gradeKey, curriculumKey, predefinedCurriculum
            );
            if (calculated !== newFinalGrades[subj.id]) {
              newFinalGrades[subj.id] = calculated;
              studentChanged = true;
            }
          }
        });
        if (studentChanged) {
          anyChanged = true;
          return { ...studentGrade, finalGrades: newFinalGrades };
        }
        return studentGrade;
      });
      return anyChanged ? newGrades : currentGrades;
    });
  }, [
    settings.gradeCalculation, settings.predikats, settings.qualitativeGradingMap,
    settings.slmVisibility, settings.semester, settings.nama_kelas,
    learningObjectives, subjects, predefinedCurriculum, isDataLoaded
  ]);

  // Place custom hooks
  const { handleExportAll, handleImportAll } = useExcelManager({
    settings,
    setSettings,
    students,
    setStudents,
    grades,
    setGrades,
    attendance,
    setAttendance,
    studentExtracurriculars,
    setStudentExtracurriculars,
    notes,
    setNotes,
    cocurricularData,
    setCocurricularData,
    subjects,
    setSubjects,
    extracurriculars,
    setExtracurriculars,
    learningObjectives,
    setLearningObjectives,
    formativeJournal,
    setFormativeJournal,
    setIsLoading,
    showToast,
    predefinedCurriculum,
  });

  const { handleSemesterChangeConfirm } = useSemesterManager({
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
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navigation
          activePage={activePage}
          setActivePage={handleNavigate}
          onExport={handleExportAll}
          onImport={handleImportAll}
          onIsiERapor={() => setIsERaporModalOpen(true)}
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          currentPageName={NAV_ITEMS.find((i) => i.id === activePage)?.label || "Dashboard"}
        />
        <main ref={mainRef} className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto px-4 pb-4 sm:px-8 sm:pb-8 pt-0">
          {isLoading ? (
            "Memuat..."
          ) : (
            <ActivePageRenderer
              activePage={activePage}
              handleNavigate={handleNavigate}
              activeNilaiTab={activeNilaiTab}
              setActiveNilaiTab={setActiveNilaiTab}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {isERaporModalOpen && (
        <ERaporProcessorModal
          isOpen={isERaporModalOpen}
          onClose={() => setIsERaporModalOpen(false)}
          settings={settings}
          students={students}
          grades={grades}
          attendance={attendance}
          notes={notes}
          studentExtracurriculars={studentExtracurriculars}
          cocurricularData={cocurricularData}
          subjects={subjects}
          extracurriculars={extracurriculars}
          learningObjectives={learningObjectives}
          formativeJournal={formativeJournal}
          predefinedCurriculum={predefinedCurriculum}
          onImportSettings={setSettings}
          onImportStudents={setStudents}
          onImportGrades={setGrades}
          onImportAttendance={setAttendance}
          onImportNotes={setNotes}
          onImportStudentExtracurriculars={setStudentExtracurriculars}
          onImportCocurricularData={setCocurricularData}
          onImportSubjects={setSubjects}
          onImportExtracurriculars={setExtracurriculars}
          onImportLearningObjectives={setLearningObjectives}
          onImportFormativeJournal={setFormativeJournal}
          showToast={showToast}
        />
      )}

      {showSemesterModal && (
        <SemesterChangeModal
          isOpen={showSemesterModal}
          currentSemester={settings.semester || "Ganjil"}
          pendingSemester={pendingSemester}
          onClose={() => setShowSemesterModal(false)}
          students={students}
          grades={grades}
          attendance={attendance}
          notes={notes}
          cocurricularData={cocurricularData}
          studentExtracurriculars={studentExtracurriculars}
          formativeJournal={formativeJournal}
          onConfirm={handleSemesterChangeConfirm}
        />
      )}
    </div>
  );
};

export default App;
