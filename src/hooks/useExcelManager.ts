import { useCallback } from "react";
import { exportExcelWithWorker } from "../workers/workerManager";
import { validateAndSanitizeImportedData } from "../utils/excelValidator";
import {
  IMAGE_KEYS,
  blobToDataURL,
  cleanupUnusedStudentPhotosInDB,
  convertDataUrlToWebPBlob,
  dataURLToBlob,
  deleteImageFromDB,
  deleteStudentPhotoFromDB,
  getImageDimensions,
  loadImageFromDB,
  loadStudentPhotoDataURL,
  processAndCompressImage,
  saveImageToDB,
  saveStudentPhotoBlob,
} from "../utils/imageDB";
import { getDynamicRKTFileName } from "../utils/helpers";
import { flushAllPendingWrites } from "../stores/customPersistStorage";
import { flushRegisteredInputs } from "../utils/dataIntegrity";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useStudentsStore } from "../stores/useStudentsStore";
import { useNilaiStore } from "../stores/useNilaiStore";
import { useAttendanceStore } from "../stores/useAttendanceStore";
import { useExtracurricularStore } from "../stores/useExtracurricularStore";
import { useNotesStore } from "../stores/useNotesStore";
import { useCocurricularStore } from "../stores/useCocurricularStore";
import { useFormativeStore } from "../stores/useFormativeStore";
import { useCurriculumStore } from "../stores/useCurriculumStore";
import { useSummaryStore } from "../stores/useSummaryStore";
import { useNilaiHistoryStore } from "../stores/useNilaiHistoryStore";

interface UseExcelManagerProps {
  setIsLoading: (loading: boolean) => void;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export const useExcelManager = ({ setIsLoading, showToast }: UseExcelManagerProps) => {
  const applyImportedData = useCallback(
    async (d: any) => {
      if (!d || typeof d !== "object") {
        throw new Error("Format file tidak dikenali atau rusak.");
      }

      const settingsActions = useSettingsStore.getState();
      const studentsActions = useStudentsStore.getState();
      const currentSettings = settingsActions.settings;
      const currentSubjects = settingsActions.subjects;

      // Execute deep data-type schema validation, single-semester migration & orphan cleanup
      const { sanitized, report } = validateAndSanitizeImportedData(d, currentSubjects);

      if (!sanitized.settings || typeof sanitized.settings !== "object") {
        throw new Error("File tidak memiliki struktur pengaturan data RKT.");
      }
      if (!Array.isArray(sanitized.students)) {
        throw new Error("Data daftar siswa tidak valid atau hilang.");
      }

      const settingsToApply = { ...sanitized.settings };
      for (const key of IMAGE_KEYS) {
        const oldRuntimeUrl = currentSettings?.[key];
        if (typeof oldRuntimeUrl === "string" && oldRuntimeUrl.startsWith("blob:")) {
          URL.revokeObjectURL(oldRuntimeUrl);
        }

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
            const compressedBlob = await processAndCompressImage(imgBlob, dims.width, dims.height);
            await saveImageToDB(key, compressedBlob);
            settingsToApply[key] = URL.createObjectURL(compressedBlob);
          } catch (e) {
            console.error(`Failed to process and save imported image ${key} to DB`, e);
          }
        } else {
          // Delete stale images in RKT_ImagesDB that are absent in the imported package
          settingsToApply[key] = null;
          try {
            await deleteImageFromDB(key);
          } catch (e) {
            console.error(`Failed to delete stale image ${key} from DB`, e);
          }
        }
      }

      // Migrate imported student 3x4 photos into RKT_ImagesDB and strip inline strings from students JSON
      const rawStudentPhotoMap: Record<string, string> =
        d.studentPhotos && typeof d.studentPhotos === "object" ? { ...d.studentPhotos } : {};
      const nextStudentPhotoUrls: Record<string, string> = {};
      const validImportedStudentIds = new Set<string>();

      const cleanStudentsForStore = await Promise.all(
        sanitized.students.map(async (student: any) => {
          const sid = String(student.id);
          validImportedStudentIds.add(sid);
          const candidateFoto =
            (typeof rawStudentPhotoMap[sid] === "string" && rawStudentPhotoMap[sid]) ||
            (typeof student.foto === "string" && student.foto) ||
            "";

          if (candidateFoto.startsWith("data:image")) {
            try {
              const compressedBlob = await convertDataUrlToWebPBlob(candidateFoto, 354, 472, 0.9);
              nextStudentPhotoUrls[sid] = await saveStudentPhotoBlob(sid, compressedBlob);
            } catch (err) {
              console.error(`Failed to save imported photo for student ${sid}`, err);
            }
          } else {
            await deleteStudentPhotoFromDB(sid);
          }

          const cleanStudent = { ...student };
          delete cleanStudent.foto;
          return cleanStudent;
        })
      );

      await cleanupUnusedStudentPhotosInDB(validImportedStudentIds);

      settingsActions.setSettings(settingsToApply);
      settingsActions.setSubjects(sanitized.subjects);
      settingsActions.setExtracurriculars(sanitized.extracurriculars);
      studentsActions.setAllStudentPhotoUrls(nextStudentPhotoUrls);
      studentsActions.setStudents(cleanStudentsForStore);
      useAttendanceStore.getState().setAttendance(sanitized.attendance);
      useNotesStore.getState().setNotes(sanitized.notes);
      useExtracurricularStore.getState().setStudentExtracurriculars(sanitized.studentExtracurriculars);
      useCocurricularStore.getState().setCocurricularData(sanitized.cocurricularData);
      useNilaiStore.getState().setGrades(sanitized.grades);
      useCurriculumStore.getState().setLearningObjectives(sanitized.learningObjectives);
      useFormativeStore.getState().setFormativeJournal(sanitized.formativeJournal);

      useNilaiHistoryStore.getState().clearAllHistory();
      useSummaryStore.getState().recomputeSummary();

      if (report.repairedCount > 0 || report.skippedOrphanedCount > 0) {
        console.warn("Excel Import Data Sanitization and Repair Logs:", report.logs);
        showToast(
          `Impor selesai dengan perbaikan: ${report.repairedCount} kolom kosong/rusak diperbaiki & ${report.skippedOrphanedCount} baris yatim dibersihkan.`,
          "warning"
        );
      } else {
        showToast("Data berhasil diimpor & Struktur Penyimpanan Tervalidasi Aman!", "success");
      }
    },
    [showToast]
  );

  const importFromExcelBlob = useCallback(
    async (blob: Blob) => {
      setIsLoading(true);
      try {
        const { parseExcelBlob } = await import("../utils/excelImport");
        const predefinedCurriculum = useCurriculumStore.getState().predefinedCurriculum;
        const d = await parseExcelBlob(blob, predefinedCurriculum);
        await applyImportedData(d);
      } catch (error: any) {
        console.error("Import Failure:", error);
        showToast(`Gagal mengimpor: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, showToast, applyImportedData]
  );

  const handleExportAll = useCallback(async (): Promise<boolean> => {
    const handleBeforeUnload = (evt: BeforeUnloadEvent) => {
      evt.preventDefault();
      evt.returnValue = "Proses pembuatan file Excel sedang berlangsung. Yakin ingin meninggalkan halaman?";
      return evt.returnValue;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    try {
      showToast("Menyiapkan file Excel di latar belakang...", "info");
      flushRegisteredInputs();
      await flushAllPendingWrites();

      const { settings, subjects, extracurriculars } = useSettingsStore.getState();
      const { students: latestStudents, studentPhotoUrls } = useStudentsStore.getState();
      const grades = useNilaiStore.getState().grades;
      const attendance = useAttendanceStore.getState().attendance;
      const studentExtracurriculars = useExtracurricularStore.getState().studentExtracurriculars;
      const notes = useNotesStore.getState().notes;
      const cocurricularData = useCocurricularStore.getState().cocurricularData;
      const learningObjectives = useCurriculumStore.getState().learningObjectives;
      const formativeJournal = useFormativeStore.getState().formativeJournal;

      const settingsForExport = { ...settings };
      for (const key of IMAGE_KEYS) {
        const currentVal = settingsForExport[key];
        if (!currentVal) continue;
        if (typeof currentVal === "string" && currentVal.startsWith("data:image")) {
          continue;
        }
        try {
          const storedBlob = await loadImageFromDB(key);
          if (storedBlob) {
            settingsForExport[key] = await blobToDataURL(storedBlob);
          } else if (typeof currentVal === "string" && currentVal.startsWith("blob:")) {
            const resp = await fetch(currentVal);
            const blob = await resp.blob();
            settingsForExport[key] = await blobToDataURL(blob);
          }
        } catch (err) {
          console.error(`Failed to convert image ${key} to DataURL for export`, err);
        }
      }

      // Hydrate student 3x4 photos on demand from RKT_ImagesDB (with runtime fallback)
      const studentPhotosForExport: Record<string, string> = {};
      await Promise.all(
        latestStudents.map(async (st: any) => {
          if (!st?.id) return;
          if (typeof st.foto === "string" && st.foto.startsWith("data:image")) {
            studentPhotosForExport[st.id] = st.foto;
            return;
          }
          const fromDb = await loadStudentPhotoDataURL(String(st.id));
          if (fromDb) {
            studentPhotosForExport[st.id] = fromDb;
            return;
          }
          const runtimeUrl = studentPhotoUrls?.[st.id];
          if (typeof runtimeUrl === "string" && runtimeUrl.startsWith("blob:")) {
            try {
              const resp = await fetch(runtimeUrl);
              const blob = await resp.blob();
              studentPhotosForExport[st.id] = await blobToDataURL(blob);
            } catch (err) {
              console.error(`Failed to convert runtime photo for student ${st.id}`, err);
            }
          }
        })
      );

      const blob = await exportExcelWithWorker({
        settings: settingsForExport,
        students: latestStudents,
        studentPhotos: studentPhotosForExport,
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
      a.download = getDynamicRKTFileName(settingsForExport);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Data berhasil diekspor!", "success");
      return true;
    } catch (e: any) {
      console.error("Export error", e);
      showToast(`Gagal mengekspor: ${e?.message || "Terjadi kesalahan"}`, "error");
      return false;
    } finally {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    }
  }, [showToast]);

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

