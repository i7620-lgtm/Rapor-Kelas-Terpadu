import { useCallback } from "react";
import { parseExcelBlob, exportToExcelBlob } from "../utils/excel";
import { validateAndSanitizeImportedData } from "../utils/excelValidator";
import { IMAGE_KEYS, getImageDimensions, processAndCompressImage, saveImageToDB, dataURLToBlob } from "../utils/imageDB";
import { getDynamicRKTFileName } from "../utils/helpers";

export const useExcelManager = ({
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
}) => {
  const applyImportedData = useCallback(async (d) => {
    if (!d || typeof d !== 'object') {
        throw new Error("Format file tidak dikenali atau rusak.");
    }

    // Execute deep data-type schema validation & data repairs
    const { sanitized, report } = validateAndSanitizeImportedData(d, subjects);

    if (!sanitized.settings || typeof sanitized.settings !== 'object') {
        throw new Error("File tidak memiliki struktur pengaturan data RKT.");
    }
    if (!Array.isArray(sanitized.students)) {
        throw new Error("Data daftar siswa tidak valid atau hilang.");
    }

    const settingsToApply = { ...sanitized.settings };
    for (const key of IMAGE_KEYS) {
      if (
        settingsToApply[key] &&
        typeof settingsToApply[key] === "string" &&
        settingsToApply[key].startsWith("data:image")
      ) {
        try {
          let imgBlob: Blob;
          try {
            imgBlob = dataURLToBlob(settingsToApply[key]);
          } catch {
            const res = await fetch(settingsToApply[key]);
            imgBlob = await res.blob();
          }
          const dims = getImageDimensions(key);
          const compressedBlob = await processAndCompressImage(
            imgBlob,
            dims.width,
            dims.height
          );
          await saveImageToDB(key, compressedBlob);
          settingsToApply[key] = URL.createObjectURL(compressedBlob);
        } catch (e) {
          console.error(
            `Failed to process and save imported image ${key} to DB`,
            e
          );
        }
      }
    }
    setSettings(settingsToApply);
    setStudents(sanitized.students);
    setAttendance(sanitized.attendance);
    setNotes(sanitized.notes);
    setStudentExtracurriculars(sanitized.studentExtracurriculars);
    setCocurricularData(sanitized.cocurricularData);
    setGrades(sanitized.grades);
    setSubjects(sanitized.subjects);
    setExtracurriculars(sanitized.extracurriculars);
    setLearningObjectives(sanitized.learningObjectives);
    setFormativeJournal(sanitized.formativeJournal);

    if (report.repairedCount > 0 || report.skippedOrphanedCount > 0) {
      console.warn("Excel Import Data Sanitization and Repair Logs:", report.logs);
      showToast(
        `Impor selesai dengan perbaikan: ${report.repairedCount} kolom kosong/rusak diperbaiki & ${report.skippedOrphanedCount} baris yatim dibersihkan.`,
        "warning"
      );
    } else {
      showToast("Data berhasil diimpor & Struktur Penyimpanan Tervalidasi Aman!", "success");
    }
  }, [subjects, showToast, setSettings, setStudents, setAttendance, setNotes, setStudentExtracurriculars, setCocurricularData, setGrades, setSubjects, setExtracurriculars, setLearningObjectives, setFormativeJournal]);

  const importFromExcelBlob = useCallback(async (blob) => {
    setIsLoading(true);
    try {
      const d = await parseExcelBlob(blob, predefinedCurriculum);
      await applyImportedData(d);
    } catch (error: any) {
      console.error("Import Failure:", error);
      showToast(`Gagal mengimpor: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [parseExcelBlob, predefinedCurriculum, setIsLoading, showToast, applyImportedData]);

  const handleExportAll = useCallback(async () => {
    try {
      const blob = await exportToExcelBlob({
        settings,
        students,
        grades,
        attendance,
        studentExtracurriculars,
        notes,
        cocurricularData,
        subjects,
        extracurriculars,
        learningObjectives,
        formativeJournal,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getDynamicRKTFileName(settings);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Data berhasil diekspor!", "success");
    } catch (e) {
      console.error("Export error", e);
      showToast(`Gagal mengekspor: ${e.message}`, "error");
    }
  }, [
    settings,
    students,
    grades,
    attendance,
    studentExtracurriculars,
    notes,
    cocurricularData,
    subjects,
    extracurriculars,
    learningObjectives,
    formativeJournal,
    showToast,
  ]);

  const handleImportAll = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) importFromExcelBlob(file);
    };
    input.click();
  }, [importFromExcelBlob]);

  return {
    importFromExcelBlob,
    handleExportAll,
    handleImportAll,
  };
};
