import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import localforage from "localforage";

localforage.config({
  name: "ERaporApp",
  version: 1.0,
  storeName: "erapor_data",
  description: "E-Rapor Application Data",
});
import * as XLSX from "xlsx";
import {
  NAV_ITEMS,
  COCURRICULAR_DIMENSIONS,
  defaultSubjects,
  initialSettings,
  initialStudents,
  initialGrades,
  initialNotes,
  initialCocurricularData,
  initialAttendance,
  initialStudentExtracurriculars,
  initialFormativeJournal,
  initialLearningObjectives,
} from "./constants.js";
import Navigation from "./components/Navigation.js";
import Dashboard from "./components/Dashboard.js";
import PlaceholderPage from "./components/PlaceholderPage.js";
import SettingsPage from "./components/SettingsPage.js";
import PanduanPage from "./components/PanduanPage.js";
import DataSiswaPage from "./components/DataSiswaPage.js";
import DataNilaiPage, { getGradeNumber } from "./components/DataNilaiPage.js";
import DataKokurikulerPage from "./components/DataKokurikulerPage.js";
import CatatanWaliKelasPage from "./components/CatatanWaliKelasPage.js";
import DataAbsensiPage from "./components/DataAbsensiPage.js";
import DataEkstrakurikulerPage from "./components/DataEkstrakurikulerPage.js";
import PrintRaporPage from "./components/PrintRaporPage.js";
import PrintPiagamPage from "./components/PrintPiagamPage.js";
import PrintLegerPage from "./components/PrintLegerPage.js";
import JurnalFormatifPage from "./components/JurnalFormatifPage.js";
import Toast from "./components/Toast.js";
import useServiceWorker from "./hooks/useServiceWorker.js";
import useWindowDimensions from "./hooks/useWindowDimensions.js";
import ERaporProcessorModal from "./components/ERaporProcessorModal.js";
import SemesterChangeModal from "./components/SemesterChangeModal.js";
import LockScreen from "./components/LockScreen.js";
import {
  IMAGE_KEYS,
  loadAllImagesFromDB,
  saveImageToDB,
  deleteImageFromDB,
  processAndCompressImage,
  getImageDimensions,
} from "./utils/imageDB.js";
import { loadDataSafeAsync } from "./utils/storage.js";
import { calculateFinalGrade } from "./utils/gradeCalculations.js";
import {
  exportToExcelBlob,
  parseExcelBlob,
  sanitizeGrades,
  sanitizeNotes,
  sanitizeAttendance,
  sanitizeStudentExtracurriculars,
  sanitizeCocurricularData,
  sanitizeLearningObjectives,
  sanitizeFormativeJournal,
  sanitizeSettings
} from "./utils/excel.js";

import { getDynamicRKTFileName, chunkString } from "./utils/helpers.js";

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
          // Don't set targetSection to null here, otherwise it triggers the else block
        }
      }, 100);
    } else if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activePage, targetSection]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNilaiTab, setActiveNilaiTab] = useState("keseluruhan");
  const { isMobile } = useWindowDimensions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);

  const isInitialMount = useRef(true);

  const [isERaporModalOpen, setIsERaporModalOpen] = useState(false);
  const [pendingSemester, setPendingSemester] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activePartition, setActivePartition] = useState("");

  useEffect(() => {
    let isMounted = true;
    const initializeAllData = async () => {
      let settingsData = await loadDataSafeAsync(
        "appSettings",
        initialSettings,
      );

      let unlocked = true;
      if (
        settingsData?.appLock?.enabled &&
        settingsData?.appLock?.pin?.length === 6
      ) {
        unlocked = sessionStorage.getItem("appUnlocked") === "true";
      }

      const studentsData = await loadDataSafeAsync(
        "appStudents",
        initialStudents,
        Array.isArray,
      );
      const gradesData = await loadDataSafeAsync(
        "appGrades",
        initialGrades,
        Array.isArray,
      );
      const notesData = await loadDataSafeAsync("appNotes", initialNotes, null);
      const cocurricularDataData = await loadDataSafeAsync(
        "appCocurricularData",
        initialCocurricularData,
        null,
      );

      let attendanceData = await loadDataSafeAsync(
        "appAttendance",
        initialAttendance,
        Array.isArray,
      );
      attendanceData = attendanceData.map((att) => ({
        studentId: att.studentId,
        semester: att.semester || "Ganjil",
        sakit: att.sakit === 0 || att.sakit ? Number(att.sakit) : null,
        izin: att.izin === 0 || att.izin ? Number(att.izin) : null,
        alpa: att.alpa === 0 || att.alpa ? Number(att.alpa) : null,
      }));

      const extracurricularsData = await loadDataSafeAsync(
        "appExtracurriculars",
        [],
        Array.isArray,
      );
      const studentExData = await loadDataSafeAsync(
        "appStudentExtracurriculars",
        initialStudentExtracurriculars,
        Array.isArray,
      );

      const loadedSubjects = await loadDataSafeAsync(
        "appSubjects",
        defaultSubjects,
        Array.isArray,
      );
      const newSubjects = [...loadedSubjects];
      let hasUpdates = false;
      defaultSubjects.forEach((ds) => {
        if (!newSubjects.find((s) => s.id === ds.id)) {
          newSubjects.push({ ...ds, active: false });
          hasUpdates = true;
        }
      });
      newSubjects.forEach((s) => {
        const ds = defaultSubjects.find((d) => d.id === s.id);
        if (ds && (!s.curriculumKey || s.curriculumKey !== ds.curriculumKey)) {
          s.curriculumKey = ds.curriculumKey;
          hasUpdates = true;
        }
      });
      if (hasUpdates) await localforage.setItem("appSubjects", newSubjects);

      const loData = await loadDataSafeAsync(
        "appLearningObjectives",
        initialLearningObjectives,
        null,
      );
      const fjData = await loadDataSafeAsync(
        "appFormativeJournal",
        initialFormativeJournal,
        null,
      );

      if (isMounted) {
        setSettings(settingsData);
        setStudents(studentsData);
        setGrades(gradesData);
        setNotes(notesData);
        setCocurricularData(cocurricularDataData);
        setAttendance(attendanceData);
        setExtracurriculars(extracurricularsData);
        setStudentExtracurriculars(studentExData);
        setSubjects(newSubjects);
        setLearningObjectives(loData);
        setFormativeJournal(fjData);
        setIsDataLoaded(true);
        setIsUnlocked(unlocked);
        setIsLoading(false); // remove the general isLoading
      }
    };
    initializeAllData();
    return () => {
      isMounted = false;
    };
  }, []);

  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const initImages = async () => {
      const updates = {};

      // 1. Check for Base64 images in localStorage and migrate them
      for (const key of IMAGE_KEYS) {
        if (
          settings[key] &&
          typeof settings[key] === "string" &&
          settings[key].startsWith("data:image")
        ) {
          try {
            const res = await fetch(settings[key]);
            const blob = await res.blob();
            const dims = getImageDimensions(key);
            const compressedBlob = await processAndCompressImage(
              blob,
              dims.width,
              dims.height,
            );
            await saveImageToDB(key, compressedBlob);
            updates[key] = URL.createObjectURL(compressedBlob);
          } catch (e) {
            console.error(`Failed to migrate image ${key}`, e);
          }
        }
      }

      // 2. Load remaining images from IndexedDB
      const dbImages = await loadAllImagesFromDB();
      for (const key of IMAGE_KEYS) {
        if (!updates[key] && dbImages[key]) {
          updates[key] = dbImages[key];
        }
      }

      if (Object.keys(updates).length > 0) {
        setSettings((prev) => ({ ...prev, ...updates }));
      }
    };

    initImages();
  }, []);

  const [students, setStudents] = useState([]);

  const [grades, setGrades] = useState([]);

  const [notes, setNotes] = useState({});

  const [cocurricularData, setCocurricularData] = useState({});

  const [attendance, setAttendance] = useState([]);

  const [extracurriculars, setExtracurriculars] = useState([]);

  const [studentExtracurriculars, setStudentExtracurriculars] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [learningObjectives, setLearningObjectives] = useState({});
  const [formativeJournal, setFormativeJournal] = useState({});
  const [predefinedCurriculum, setPredefinedCurriculum] = useState(null);
  const gradeNumber = useMemo(
    () => getGradeNumber(settings.nama_kelas),
    [settings.nama_kelas],
  );

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const handleSettingsChange = useCallback(
    (e) => {
      const { name, value, type, files } = e.target;
      if (type === "remove_image") {
        deleteImageFromDB(name)
          .then(() => {
            setSettings((prev) => ({ ...prev, [name]: null }));
          })
          .catch((err) => {
            console.error("Failed to delete image", err);
            showToast("Gagal menghapus gambar", "error");
          });
        return;
      }
      if (type === "file") {
        const file = files && files[0];
        if (file) {
          if (!file.type.startsWith("image/")) {
            showToast("File harus berupa gambar", "error");
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            showToast("Ukuran gambar terlalu besar. Maksimal 5MB.", "error");
            return;
          }
          const dims = getImageDimensions(name);
          processAndCompressImage(file, dims.width, dims.height)
            .then((blob) => {
              saveImageToDB(name, blob).then(() => {
                const objectUrl = URL.createObjectURL(blob);
                setSettings((prev) => ({ ...prev, [name]: objectUrl }));
              });
            })
            .catch((err) => {
              console.error("Failed to process image", err);
              showToast("Gagal memproses gambar", "error");
            });
        }
        return;
      }
      if (type === "file_processed") {
        fetch(value)
          .then((res) => res.blob())
          .then((blob) => {
            const dims = getImageDimensions(name);
            return processAndCompressImage(blob, dims.width, dims.height);
          })
          .then((compressedBlob) => {
            saveImageToDB(name, compressedBlob).then(() => {
              const objectUrl = URL.createObjectURL(compressedBlob);
              setSettings((prev) => ({ ...prev, [name]: objectUrl }));
            });
          })
          .catch((err) => {
            console.error("Failed to save processed image", err);
            showToast("Gagal menyimpan gambar", "error");
          });
        return;
      }
      if (name && name.startsWith("predikats.")) {
        const predikatKey = name.split(".")[1];
        setSettings((prev) => {
          const newPredikats = { ...prev.predikats, [predikatKey]: value };
          const valA = parseInt(newPredikats.a, 10);
          const valB = parseInt(newPredikats.b, 10);
          const valC = parseInt(newPredikats.c, 10);
          if (!isNaN(valA) && !isNaN(valB) && !isNaN(valC)) {
            const newQualitativeMap = {
              SB: Math.round((valA + 100) / 2),
              BSH: Math.round((valB + valA - 1) / 2),
              MB: Math.round((valC + valB - 1) / 2),
              BB: Math.round((0 + valC - 1) / 2),
            };
            return {
              ...prev,
              predikats: newPredikats,
              qualitativeGradingMap: newQualitativeMap,
            };
          }
          return { ...prev, predikats: newPredikats };
        });
        return;
      }
      if (type === "class_change_confirmed") {
        setSettings((prev) => ({ ...prev, nama_kelas: value }));
        setGrades((prevGrades) =>
          prevGrades.map((g) => ({
            studentId: g.studentId,
            detailedGrades: {},
            finalGrades: {},
          })),
        );
        setSettings((prev) => ({ ...prev, slmVisibility: {} }));
        showToast(
          `Kelas diubah ke Kelas ${getGradeNumber(value)}. Semua data nilai telah direset.`,
          "success",
        );
        return;
      }
      if (type === "checkbox") {
        setSettings((prev) => ({ ...prev, [name]: value }));
        return;
      }
      if (name === "semester" && value !== settings.semester) {
        const hasData = students.length > 0 || 
                        grades.some(g => Object.keys(g?.detailedGrades || {}).length > 0) || 
                        Object.keys(notes || {}).length > 0 || 
                        attendance.length > 0 || 
                        Object.keys(cocurricularData || {}).length > 0 || 
                        (studentExtracurriculars || []).length > 0 || 
                        Object.keys(formativeJournal || {}).length > 0;
        if (hasData) {
          setPendingSemester(value);
          setShowSemesterModal(true);
          return;
        }
      }
      if (name) {
        setSettings((prev) => {
          const newSettings = { ...prev, [name]: value };
          const ctxMatch = name.match(/^(.*?)_ctx_[^_]+_[^_]+_[^_]+$/);
          if (ctxMatch) {
            newSettings[ctxMatch[1]] = value;
          }
          return newSettings;
        });
      }
    },
    [
      showToast,
      settings.semester,
      students,
      grades,
      notes,
      attendance,
      cocurricularData,
      studentExtracurriculars,
      formativeJournal
    ],
  );

  const handleConfirmSemesterChange = useCallback((retainedCategories) => {
    if (!pendingSemester) return;
    const oldSem = settings.semester || "Ganjil";
    const newSem = pendingSemester;

    if (!retainedCategories.students) {
      setStudents([]);
    }

    if (!retainedCategories.grades) {
      setGrades([]);
    } else {
      setGrades((prev) =>
        prev.map((g) => {
          const newDet = { ...(g.detailedGrades || {}) };
          Object.values(newDet).forEach((det) => {
            if (oldSem === "Ganjil" && newSem === "Genap") {
              det.sts2 = det.sts1;
              det.sas2 = det.sas1;
              det.descriptions_Genap = JSON.parse(
                JSON.stringify(det.descriptions || {}),
              );
            } else if (oldSem === "Genap" && newSem === "Ganjil") {
              det.sts1 = det.sts2;
              det.sas1 = det.sas2;
              det.descriptions = JSON.parse(
                JSON.stringify(det.descriptions_Genap || {}),
              );
            }
          });
          return { ...g, detailedGrades: newDet };
        }),
      );
    }

    if (!retainedCategories.formativeJournal) {
      setFormativeJournal({});
    } else {
      setFormativeJournal((prev) => {
        const nextJournal = {};
        Object.entries(prev || {}).forEach(([sid, list]) => {
          if (Array.isArray(list)) {
            nextJournal[sid] = list.map((item) => ({ ...item, semester: newSem }));
          }
        });
        return nextJournal;
      });
    }

    if (!retainedCategories.cocurricularData) {
      setCocurricularData({});
    } else {
      setCocurricularData((prev) => {
        const nextCo = {};
        Object.entries(prev || {}).forEach(([sid, data]) => {
          const sData = { ...data };
          if (oldSem === "Ganjil" && newSem === "Genap" && sData.dimensionRatings) {
            sData.dimensionRatings_Genap = JSON.parse(
              JSON.stringify(sData.dimensionRatings),
            );
          } else if (oldSem === "Genap" && newSem === "Ganjil" && sData.dimensionRatings_Genap) {
            sData.dimensionRatings = JSON.parse(
              JSON.stringify(sData.dimensionRatings_Genap),
            );
          }
          nextCo[sid] = sData;
        });
        return nextCo;
      });
    }

    if (!retainedCategories.studentExtracurriculars) {
      setStudentExtracurriculars([]);
    } else {
      setStudentExtracurriculars((prev) =>
        (prev || []).map((se) => ({ ...se, semester: newSem })),
      );
    }

    if (!retainedCategories.attendance) {
      setAttendance([]);
    } else {
      setAttendance((prev) =>
        (prev || []).map((a) => ({ ...a, semester: newSem })),
      );
    }

    if (!retainedCategories.notes) {
      setNotes({});
    } else {
      setNotes((prev) => {
        const nextNotes = {};
        Object.entries(prev || {}).forEach(([key, val]) => {
          const baseId = key.replace("_Genap", "");
          if (newSem === "Genap") {
            nextNotes[`${baseId}_Genap`] = val;
          } else {
            nextNotes[baseId] = val;
          }
        });
        return nextNotes;
      });
    }

    setSettings((prev) => ({
      ...prev,
      semester: newSem
    }));
    showToast(
      `Semester berhasil diubah ke ${newSem} dan data disesuaikan.`,
      "success",
    );
    setPendingSemester(null);
    setShowSemesterModal(false);
  }, [
    pendingSemester,
    settings.semester,
    showToast
  ]);

  const handleCancelSemesterChange = useCallback(() => {
    setPendingSemester(null);
    setShowSemesterModal(false);
  }, []);

  useEffect(() => {
    if (gradeNumber) {
      fetch(`/tp${gradeNumber}.json`)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              `Curriculum file for grade ${gradeNumber} not found.`,
            );
          return res.json();
        })
        .then((data) => setPredefinedCurriculum(data))
        .catch((err) => {
          console.warn(err);
          setPredefinedCurriculum({});
        });
    } else {
      setPredefinedCurriculum(null);
    }
  }, [gradeNumber]);

  useEffect(() => {
    if (students.length > 0) {
      let hasChanges = false;
      const newGrades = [...grades];
      students.forEach((s) => {
        if (!newGrades.find((g) => g.studentId === s.id)) {
          newGrades.push({
            studentId: s.id,
            detailedGrades: {},
            finalGrades: {},
          });
          hasChanges = true;
        }
      });
      if (hasChanges) setGrades(newGrades);
    }
  }, [students.length]);

  useEffect(() => {
    setGrades((currentGrades) => {
      let anyChanged = false;
      const newGrades = currentGrades.map((studentGrade) => {
        const newFinalGrades = { ...studentGrade.finalGrades };
        let studentChanged = false;
        subjects.forEach((subj) => {
          const detailed = studentGrade.detailedGrades?.[subj.id];
          if (detailed) {
            const config = settings.gradeCalculation?.[subj.id] || {
              method: "rata-rata",
            };
            const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "5"}`;
            const curriculumKey = subj.curriculumKey || subj.fullName;
            const calculated = calculateFinalGrade(
              detailed,
              config,
              settings,
              subj.id,
              learningObjectives,
              gradeKey,
              curriculumKey,
              predefinedCurriculum,
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
    settings.gradeCalculation,
    settings.predikats,
    settings.qualitativeGradingMap,
    settings.slmVisibility,
    settings.semester,
    settings.nama_kelas,
    learningObjectives,
    subjects,
    predefinedCurriculum,
  ]);

  const learningObjectivesRef = useRef(learningObjectives);
  useEffect(() => {
    learningObjectivesRef.current = learningObjectives;
  }, [learningObjectives]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch("/presets.json");
        if (!response.ok) throw new Error("Failed to fetch presets");
        const presetsData = await response.json();
        setExtracurriculars((prev) =>
          prev.length === 0 ? presetsData.extracurriculars || [] : prev,
        );
      } catch (error) {
        console.error("Error initialization:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const importFromExcelBlob = useCallback(
    async (blob) => {
      setIsLoading(true);
      try {
        const d = await parseExcelBlob(blob, predefinedCurriculum);

        // Process images from imported settings
        const settingsToApply = { ...d.settings };
        for (const key of IMAGE_KEYS) {
          if (
            settingsToApply[key] &&
            typeof settingsToApply[key] === "string" &&
            settingsToApply[key].startsWith("data:image")
          ) {
            try {
              const res = await fetch(settingsToApply[key]);
              const imgBlob = await res.blob();
              const dims = getImageDimensions(key);
              const compressedBlob = await processAndCompressImage(
                imgBlob,
                dims.width,
                dims.height,
              );
              await saveImageToDB(key, compressedBlob);
              settingsToApply[key] = URL.createObjectURL(compressedBlob);
            } catch (e) {
              console.error(
                `Failed to process and save imported image ${key} to DB`,
                e,
              );
            }
          }
        }

        setSettings(settingsToApply);
        setStudents(d.students);
        setAttendance(d.attendance);
        setNotes(d.notes);
        setStudentExtracurriculars(d.studentExtracurriculars);
        setCocurricularData(d.cocurricularData);
        setGrades(d.grades);
        setSubjects(d.subjects);
        setExtracurriculars(d.extracurriculars);
        setLearningObjectives(d.learningObjectives);
        setFormativeJournal(d.formativeJournal);
        showToast("Data berhasil diimpor (Format Lengkap)!", "success");
      } catch (error) {
        console.error("Import Failure:", error);
        showToast(`Gagal mengimpor: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [parseExcelBlob, showToast],
  );

  const handleExportAll = useCallback(async () => {
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
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getDynamicRKTFileName(settings) + ".xlsx";
    link.click();
    showToast("File berhasil diunduh (Format Lengkap)!", "success");
  }, [
    exportToExcelBlob,
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
    input.accept = ".xlsx, .xls";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
          showToast("Ukuran file terlalu besar. Maksimal 10MB.", "error");
          return;
        }
        importFromExcelBlob(file);
      }
    };
    input.click();
  }, [importFromExcelBlob, showToast]);

  useEffect(() => {
    if (!isDataLoaded || isLoading) return;
    const sem = settings.semester || "Ganjil";

    setSettings((prev) => {
      const sanitized = sanitizeSettings(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setGrades((prev) => {
      const sanitized = sanitizeGrades(prev, sem, learningObjectives, settings.nama_kelas, subjects);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setNotes((prev) => {
      const sanitized = sanitizeNotes(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setAttendance((prev) => {
      const sanitized = sanitizeAttendance(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setStudentExtracurriculars((prev) => {
      const sanitized = sanitizeStudentExtracurriculars(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setCocurricularData((prev) => {
      const sanitized = sanitizeCocurricularData(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setLearningObjectives((prev) => {
      const sanitized = sanitizeLearningObjectives(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });

    setFormativeJournal((prev) => {
      const sanitized = sanitizeFormativeJournal(prev, sem);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });
  }, [
    settings.semester,
    isDataLoaded,
    isLoading,
    settings.nama_kelas,
    subjects,
    learningObjectives
  ]);

  useEffect(() => {
    let settingsToSave = { ...settings };
    IMAGE_KEYS.forEach((key) => {
      if (
        settingsToSave[key] &&
        typeof settingsToSave[key] === "string" &&
        settingsToSave[key].startsWith("blob:")
      ) {
        delete settingsToSave[key];
      }
    });
    if (isDataLoaded && !isLoading) {
      settingsToSave = sanitizeSettings(settingsToSave, settings.semester || "Ganjil");
      localforage.setItem("appSettings", settingsToSave);
    }
  }, [settings, isDataLoaded, isLoading]);

  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appStudents", students);
  }, [students, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading) localforage.setItem("appGrades", grades);
  }, [grades, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading) localforage.setItem("appNotes", notes);
  }, [notes, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appAttendance", attendance);
  }, [attendance, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appCocurricularData", cocurricularData);
  }, [cocurricularData, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem(
        "appStudentExtracurriculars",
        studentExtracurriculars,
      );
  }, [studentExtracurriculars, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appSubjects", subjects);
  }, [subjects, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appExtracurriculars", extracurriculars);
  }, [extracurriculars, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appLearningObjectives", learningObjectives);
  }, [learningObjectives, isDataLoaded, isLoading]);
  useEffect(() => {
    if (isDataLoaded && !isLoading)
      localforage.setItem("appFormativeJournal", formativeJournal);
  }, [formativeJournal, isDataLoaded, isLoading]);

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (settings.enableExitWarning) {
        e.preventDefault();
        e.returnValue = ""; // Standard way to trigger the browser's exit warning
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [settings.enableExitWarning]);

  const isLocked =
    settings.appLock?.enabled &&
    settings.appLock?.pin?.length === 6 &&
    !isUnlocked;

  return React.createElement(
    React.Fragment,
    null,
    toast &&
      React.createElement(Toast, {
        message: toast.message,
        type: toast.type,
        onClose: () => setToast(null),
      }),
    isLocked
      ? React.createElement(LockScreen, {
          appLock: settings.appLock,
          onUnlock: () => {
            sessionStorage.setItem("appUnlocked", "true");
            setIsUnlocked(true);
          },
        })
      : React.createElement(
          React.Fragment,
          null,
          isERaporModalOpen &&
            React.createElement(ERaporProcessorModal, {
              onClose: () => setIsERaporModalOpen(false),
              students,
              grades,
              subjects,
              settings,
              showToast,
              predefinedCurriculum,
              learningObjectives,
            }),
          showSemesterModal &&
            React.createElement(SemesterChangeModal, {
              isOpen: showSemesterModal,
              currentSemester: settings.semester || "Ganjil",
              pendingSemester: pendingSemester,
              onClose: handleCancelSemesterChange,
              onConfirm: handleConfirmSemesterChange,
              students,
              grades,
              attendance,
              notes,
              cocurricularData,
              studentExtracurriculars,
              formativeJournal,
            }),
          React.createElement(
            "div",
            {
              className:
                "flex flex-col xl:flex-row h-[100dvh] w-full bg-slate-100 overflow-hidden",
            },
            React.createElement(Navigation, {
              activePage,
              setActivePage: handleNavigate,
              onExport: handleExportAll,
              onImport: handleImportAll,
              onIsiERapor: () => setIsERaporModalOpen(true),
              isMobile,
              isMobileMenuOpen,
              setIsMobileMenuOpen,
              currentPageName:
                NAV_ITEMS.find((i) => i.id === activePage)?.label ||
                "Dashboard",
            }),
            React.createElement(
              "main",
              {
                ref: mainRef,
                className:
                  "flex-1 flex flex-col min-h-0 min-w-0 overflow-auto px-4 pb-4 sm:px-8 sm:pb-8 pt-0",
              },
              isLoading
                ? "Memuat..."
                : activePage === "DASHBOARD"
                  ? React.createElement(Dashboard, {
                      setActivePage: handleNavigate,
                      settings,
                      students,
                      grades,
                      subjects,
                      notes,
                      attendance,
                      studentExtracurriculars,
                      cocurricularData,
                      onNavigateToNilai: (id) => {
                        setActiveNilaiTab(id);
                        handleNavigate("DATA_NILAI");
                      },
                    })
                  : activePage === "PANDUAN"
                    ? React.createElement(PanduanPage, {
                        setActivePage: handleNavigate,
                      })
                    : activePage === "DATA_SISWA"
                      ? React.createElement(DataSiswaPage, {
                          students,
                          namaKelas: settings.nama_kelas,
                          onBulkSaveStudents: setStudents,
                          onDeleteStudent: (id) => {
                            setStudents((prev) =>
                              prev.filter((s) => s.id !== id),
                            );
                            setGrades((prev) =>
                              prev.filter((g) => g.studentId !== id),
                            );
                            setAttendance((prev) =>
                              prev.filter((a) => a.studentId !== id),
                            );
                            setNotes((prev) => {
                              const newNotes = { ...prev };
                              delete newNotes[id];
                              return newNotes;
                            });
                            setStudentExtracurriculars((prev) =>
                              prev.filter((e) => e.studentId !== id),
                            );
                            setCocurricularData((prev) => {
                              const newData = { ...prev };
                              delete newData[id];
                              return newData;
                            });
                            setFormativeJournal((prev) => {
                              const newJournal = { ...prev };
                              delete newJournal[id];
                              return newJournal;
                            });
                          },
                          showToast,
                        })
                      : activePage === "DATA_NILAI"
                        ? React.createElement(DataNilaiPage, {
                            students,
                            grades,
                            settings,
                            onBulkUpdateGrades: (u) =>
                              setGrades((prev) => {
                                // Create a map of updates by studentId for faster lookup
                                const updateMap = {};
                                u.forEach((x) => {
                                  updateMap[x.studentId] = x;
                                });

                                const next = prev.map((item) => {
                                  const update = updateMap[item.studentId];
                                  if (update) {
                                    const newDetailedGrades = {
                                      ...item.detailedGrades,
                                      [update.subjectId]:
                                        update.newDetailedGrade,
                                    };
                                    const subject = subjects.find(
                                      (s) => s.id === update.subjectId,
                                    );
                                    const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "5"}`;
                                    const curriculumKey = subject
                                      ? subject.curriculumKey ||
                                        subject.fullName
                                      : null;
                                    const newFinalGrades = {
                                      ...item.finalGrades,
                                      [update.subjectId]: calculateFinalGrade(
                                        update.newDetailedGrade,
                                        settings.gradeCalculation[
                                          update.subjectId
                                        ] || { method: "rata-rata" },
                                        settings,
                                        update.subjectId,
                                        learningObjectives,
                                        gradeKey,
                                        curriculumKey,
                                        predefinedCurriculum,
                                      ),
                                    };
                                    return {
                                      ...item,
                                      detailedGrades: newDetailedGrades,
                                      finalGrades: newFinalGrades,
                                    };
                                  }
                                  return item;
                                });

                                // Handle students in updates that were not present in previous grades list
                                u.forEach((x) => {
                                  if (
                                    !next.some(
                                      (ng) => ng.studentId === x.studentId,
                                    )
                                  ) {
                                    const subject = subjects.find(
                                      (s) => s.id === x.subjectId,
                                    );
                                    const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || "5"}`;
                                    const curriculumKey = subject
                                      ? subject.curriculumKey ||
                                        subject.fullName
                                      : null;
                                    const finalGradeVal = calculateFinalGrade(
                                      x.newDetailedGrade,
                                      settings.gradeCalculation[
                                        x.subjectId
                                      ] || { method: "rata-rata" },
                                      settings,
                                      x.subjectId,
                                      learningObjectives,
                                      gradeKey,
                                      curriculumKey,
                                      predefinedCurriculum,
                                    );
                                    next.push({
                                      studentId: x.studentId,
                                      detailedGrades: {
                                        [x.subjectId]: x.newDetailedGrade,
                                      },
                                      finalGrades: {
                                        [x.subjectId]: finalGradeVal,
                                      },
                                    });
                                  }
                                });
                                return next;
                              }),
                            learningObjectives,
                            onUpdateLearningObjectives: setLearningObjectives,
                            subjects,
                            onUpdatePredikats: (p) =>
                              setSettings((s) => ({ ...s, predikats: p })),
                            activeTab: activeNilaiTab,
                            onTabChange: setActiveNilaiTab,
                            onUpdateGradeCalculation: (sid, conf) =>
                              setSettings((s) => ({
                                ...s,
                                gradeCalculation: {
                                  ...s.gradeCalculation,
                                  [sid]: conf,
                                },
                              })),
                            onUpdateSlmVisibility: (sid, vis) =>
                              setSettings((s) => ({
                                ...s,
                                slmVisibility: {
                                  ...s.slmVisibility,
                                  [sid]: vis,
                                },
                              })),
                            onUpdateDisplayMode: (mode) =>
                              setSettings((s) => ({
                                ...s,
                                nilaiDisplayMode: mode,
                              })),
                            onBulkAddSlm: (subId, slm) => {
                              setGrades((prev) =>
                                prev.map((g) => {
                                  const d = g.detailedGrades?.[subId] || {
                                    slm: [],
                                    sts1: null,
                                    sts2: null,
                                    sas1: null,
                                    sas2: null,
                                  };
                                  if (!d.slm.some((s) => s.id === slm.id))
                                    d.slm.push({
                                      ...slm,
                                      scores: [...slm.scores],
                                    });
                                  return {
                                    ...g,
                                    detailedGrades: {
                                      ...g.detailedGrades,
                                      [subId]: d,
                                    },
                                  };
                                }),
                              );
                            },
                            predefinedCurriculum,
                            showToast,
                          })
                        : activePage === "DATA_KOKURIKULER"
                          ? React.createElement(DataKokurikulerPage, {
                              students,
                              settings,
                              cocurricularData,
                              onSettingsChange: handleSettingsChange,
                              onUpdateCocurricularData: (sid, did, val) =>
                                setCocurricularData((prev) => {
                                  const fieldName =
                                    settings.semester === "Genap"
                                      ? "dimensionRatings_Genap"
                                      : "dimensionRatings";
                                  return {
                                    ...prev,
                                    [sid]: {
                                      ...prev[sid],
                                      [fieldName]: {
                                        ...(prev[sid]?.[fieldName] || {}),
                                        [did]: val,
                                      },
                                    },
                                  };
                                }),
                              showToast,
                            })
                          : activePage === "PENGATURAN"
                            ? React.createElement(SettingsPage, {
                                settings,
                                onSettingsChange: handleSettingsChange,
                                onSave: () => {},
                                onUpdateKopLayout: (l) =>
                                  setSettings((s) => {
                                    const currentSemester =
                                      s.semester || "Ganjil";
                                    const layoutField =
                                      currentSemester === "Genap"
                                        ? "kop_layout_Genap"
                                        : "kop_layout";
                                    return { ...s, [layoutField]: l };
                                  }),
                                subjects,
                                onUpdateSubjects: setSubjects,
                                extracurriculars,
                                onUpdateExtracurriculars: setExtracurriculars,
                                showToast,
                              })
                            : activePage === "DATA_ABSENSI"
                              ? React.createElement(DataAbsensiPage, {
                                  students,
                                  settings,
                                  attendance,
                                  onUpdateAttendance: (sid, t, v) =>
                                    setAttendance((prev) => {
                                      const n = [...prev];
                                      const sem = settings.semester || "Ganjil";
                                      const i = n.findIndex(
                                        (a) =>
                                          a.studentId === sid &&
                                          (a.semester || "Ganjil") === sem,
                                      );
                                      if (i > -1)
                                        n[i][t] = v === "" ? null : parseInt(v);
                                      else
                                        n.push({
                                          studentId: sid,
                                          semester: sem,
                                          [t]: v === "" ? null : parseInt(v),
                                        });
                                      return n;
                                    }),
                                  onBulkUpdateAttendance: setAttendance,
                                  showToast,
                                })
                              : activePage === "CATATAN_WALI_KELAS"
                                ? React.createElement(CatatanWaliKelasPage, {
                                    students,
                                    notes,
                                    onUpdateNote: (sid, note) =>
                                      setNotes((prev) => {
                                        const key =
                                          settings.semester === "Genap"
                                            ? sid + "_Genap"
                                            : sid;
                                        return { ...prev, [key]: note };
                                      }),
                                    grades,
                                    subjects,
                                    settings,
                                    showToast,
                                  })
                                : activePage === "DATA_EKSTRAKURIKULER"
                                  ? React.createElement(
                                      DataEkstrakurikulerPage,
                                      {
                                        students,
                                        settings,
                                        extracurriculars,
                                        studentExtracurriculars,
                                        onUpdateStudentExtracurriculars:
                                          setStudentExtracurriculars,
                                        showToast,
                                      },
                                    )
                                  : activePage === "PRINT_RAPOR"
                                    ? React.createElement(PrintRaporPage, {
                                        students,
                                        settings,
                                        grades,
                                        attendance,
                                        notes,
                                        studentExtracurriculars,
                                        extracurriculars,
                                        subjects,
                                        learningObjectives,
                                        cocurricularData,
                                        onUpdateDescription: (
                                          sid,
                                          subId,
                                          type,
                                          val,
                                          currentDescriptions,
                                        ) => {
                                          setGrades((prev) => {
                                            const currentSemester =
                                              settings?.semester || "Ganjil";
                                            const descField =
                                              currentSemester === "Genap"
                                                ? "descriptions_Genap"
                                                : "descriptions";

                                            const n = JSON.parse(
                                              JSON.stringify(prev),
                                            );
                                            const g = n.find(
                                              (x) => x.studentId === sid,
                                            );
                                            if (g) {
                                              if (!g.detailedGrades[subId])
                                                g.detailedGrades[subId] = {
                                                  slm: [],
                                                  sts1: null,
                                                  sts2: null,
                                                  sas1: null,
                                                  sas2: null,
                                                };
                                              if (
                                                !g.detailedGrades[subId][
                                                  descField
                                                ]
                                              ) {
                                                // If descriptions don't exist in DB, use the current ones (which might be auto-generated)
                                                g.detailedGrades[subId][
                                                  descField
                                                ] = currentDescriptions || {
                                                  highest: "",
                                                  lowest: "",
                                                };
                                              }
                                              g.detailedGrades[subId][
                                                descField
                                              ][type] = val;
                                            }
                                            return n;
                                          });
                                        },
                                        onUpdateStudent: (id, k, v) =>
                                          setStudents((prev) =>
                                            prev.map((s) =>
                                              s.id === id
                                                ? { ...s, [k]: v }
                                                : s,
                                            ),
                                          ),
                                        onUpdateSettings: (k, v) =>
                                          setSettings((s) => {
                                            const newS = { ...s, [k]: v };
                                            const ctxMatch = k.match(
                                              /^(.*?)_ctx_[^_]+_[^_]+_[^_]+$/,
                                            );
                                            if (ctxMatch) newS[ctxMatch[1]] = v;
                                            return newS;
                                          }),
                                        onUpdateNote: (sid, v) =>
                                          setNotes((n) => {
                                            const key =
                                              settings?.semester === "Genap"
                                                ? sid + "_Genap"
                                                : sid;
                                            return { ...n, [key]: v };
                                          }),
                                        onUpdateAttendance: (sid, k, v) =>
                                          setAttendance((prev) => {
                                            const n = [...prev];
                                            const sem =
                                              settings?.semester || "Ganjil";
                                            const i = n.findIndex(
                                              (a) =>
                                                a.studentId === sid &&
                                                (a.semester || "Ganjil") ===
                                                  sem,
                                            );
                                            if (i > -1)
                                              n[i][k] =
                                                v === "" ? null : parseInt(v);
                                            else
                                              n.push({
                                                studentId: sid,
                                                semester: sem,
                                                [k]:
                                                  v === "" ? null : parseInt(v),
                                              });
                                            return n;
                                          }),
                                        onUpdateExtraDescription: (
                                          sid,
                                          eid,
                                          v,
                                        ) =>
                                          setStudentExtracurriculars((prev) =>
                                            prev.map((s) => {
                                              const sem =
                                                settings?.semester || "Ganjil";
                                              if (
                                                s.studentId === sid &&
                                                (s.semester || "Ganjil") === sem
                                              ) {
                                                return {
                                                  ...s,
                                                  descriptions: {
                                                    ...s.descriptions,
                                                    [eid]: v,
                                                  },
                                                };
                                              }
                                              return s;
                                            }),
                                          ),
                                        onUpdateCocurricularManual: (sid, v) =>
                                          setCocurricularData((prev) => {
                                            const currentSemester =
                                              settings?.semester || "Ganjil";
                                            const fieldName =
                                              currentSemester === "Genap"
                                                ? "dimensionRatings_Genap"
                                                : "dimensionRatings";
                                            return {
                                              ...prev,
                                              [sid]: {
                                                ...prev[sid],
                                                [fieldName]: {
                                                  ...(prev[sid]?.[fieldName] ||
                                                    {}),
                                                  manualDescription: v,
                                                },
                                              },
                                            };
                                          }),
                                        showToast,
                                      })
                                    : activePage === "PRINT_PIAGAM"
                                      ? React.createElement(PrintPiagamPage, {
                                          students,
                                          settings,
                                          grades,
                                          subjects,
                                          onUpdatePiagamLayout: (l) =>
                                            setSettings((s) => {
                                              const currentSemester =
                                                s.semester || "Ganjil";
                                              const layoutField =
                                                currentSemester === "Genap"
                                                  ? "piagam_layout_Genap"
                                                  : "piagam_layout";
                                              return { ...s, [layoutField]: l };
                                            }),
                                          showToast,
                                        })
                                      : activePage === "PRINT_LEGER"
                                        ? React.createElement(PrintLegerPage, {
                                            students,
                                            settings,
                                            grades,
                                            subjects,
                                            showToast,
                                          })
                                        : activePage === "JURNAL_FORMATIF"
                                          ? React.createElement(
                                              JurnalFormatifPage,
                                              {
                                                students,
                                                formativeJournal,
                                                onUpdate: (sid, data) =>
                                                  setFormativeJournal(
                                                    (prev) => {
                                                      const next = { ...prev };
                                                      if (!next[sid])
                                                        next[sid] = [];
                                                      const idx = next[
                                                        sid
                                                      ].findIndex(
                                                        (n) => n.id === data.id,
                                                      );
                                                      if (idx > -1)
                                                        next[sid][idx] = data;
                                                      else
                                                        next[sid].push({
                                                          ...data,
                                                          id: Date.now(),
                                                        });
                                                      return next;
                                                    },
                                                  ),
                                                onDelete: (sid, id) =>
                                                  setFormativeJournal(
                                                    (prev) => ({
                                                      ...prev,
                                                      [sid]: prev[sid].filter(
                                                        (n) => n.id !== id,
                                                      ),
                                                    }),
                                                  ),
                                                showToast,
                                                subjects,
                                                grades,
                                                settings,
                                                predefinedCurriculum,
                                              },
                                            )
                                          : React.createElement(
                                              PlaceholderPage,
                                              { title: activePage },
                                            ),
            ),
          ),
        ),
  );
};

export default App;
