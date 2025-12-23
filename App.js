
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { NAV_ITEMS, COCURRICULAR_DIMENSIONS, QUALITATIVE_DESCRIPTORS, FORMATIVE_ASSESSMENT_TYPES } from './constants.js';
import Navigation from './components/Navigation.js';
import Dashboard from './components/Dashboard.js';
import PlaceholderPage from './components/PlaceholderPage.js';
import SettingsPage from './components/SettingsPage.js';
import DataSiswaPage from './components/DataSiswaPage.js';
import DataNilaiPage, { getGradeNumber } from './components/DataNilaiPage.js';
import DataKokurikulerPage from './components/DataKokurikulerPage.js';
import CatatanWaliKelasPage from './components/CatatanWaliKelasPage.js';
import DataAbsensiPage from './components/DataAbsensiPage.js';
import DataEkstrakurikulerPage from './components/DataEkstrakurikulerPage.js';
import PrintRaporPage from './components/PrintRaporPage.js';
import PrintPiagamPage from './components/PrintPiagamPage.js';
import PrintLegerPage from './components/PrintLegerPage.js';
import JurnalFormatifPage from './components/JurnalFormatifPage.js';
import Toast from './components/Toast.js';
import useServiceWorker from './hooks/useServiceWorker.js';
import useGoogleAuth from './hooks/useGoogleAuth.js';
import DriveDataSelectionModal from './components/DriveDataSelectionModal.js';
import useWindowDimensions from './hooks/useWindowDimensions.js';

const GOOGLE_CLIENT_ID = window.RKT_CONFIG?.GOOGLE_CLIENT_ID || null;
const RKT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('RKT_OfflineDB', 2);
    request.onerror = () => reject("Error opening IndexedDB.");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingSyncs')) {
            db.createObjectStore('pendingSyncs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('backups')) {
            db.createObjectStore('backups', { keyPath: 'id' });
        }
    };
});

const defaultSubjects = [
    { id: 'PAIslam', fullName: 'Pendidikan Agama dan Budi Pekerti (Islam)', label: 'PA Islam', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Islam)' },
    { id: 'PAKristen', fullName: 'Pendidikan Agama dan Budi Pekerti (Kristen)', label: 'PA Kristen', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Kristen)' },
    { id: 'PAKatolik', fullName: 'Pendidikan Agama dan Budi Pekerti (Katolik)', label: 'PA Katolik', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Katolik)' },
    { id: 'PAHindu', fullName: 'Pendidikan Agama dan Budi Pekerti (Hindu)', label: 'PA Hindu', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Hindu)' },
    { id: 'PABuddha', fullName: 'Pendidikan Agama dan Budi Pekerti (Buddha)', label: 'PA Buddha', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Buddha)' },
    { id: 'PAKhonghucu', fullName: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)', label: 'PA Khonghucu', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)' },
    { id: 'PAKTTMYME', fullName: 'Pendidikan Kepercayaan Terhadap Tuhan Yang Maha Esa dan Budi Pekerti', label: 'Kepercayaan', active: true, curriculumKey: 'Pendidikan Kepercayaan Terhadap Tuhan Yang Maha Esa dan Budi Pekerti' },
    { id: 'PP', fullName: 'Pendidikan Pancasila', label: 'PP', active: true, curriculumKey: 'Pendidikan Pancasila' },
    { id: 'BIndo', fullName: 'Bahasa Indonesia', label: 'B. Indo', active: true, curriculumKey: 'Bahasa Indonesia' },
    { id: 'MTK', fullName: 'Matematika', label: 'MTK', active: true, curriculumKey: 'Matematika' },
    { id: 'IPAS', fullName: 'Ilmu Pengetahuan Alam dan Sosial', label: 'IPAS', active: true, curriculumKey: 'Ilmu Pengetahuan Alam dan Sosial' },
    { id: 'SeniMusik', fullName: 'Seni Budaya (Seni Musik)', label: 'S. Musik', active: false, curriculumKey: 'Seni Budaya (Seni Musik)' },
    { id: 'SeniRupa', fullName: 'Seni Budaya (Seni Rupa)', label: 'S. Rupa', active: true, curriculumKey: 'Seni Budaya (Seni Rupa)' },
    { id: 'SeniTari', fullName: 'Seni Budaya (Seni Tari)', label: 'S. Tari', active: false, curriculumKey: 'Seni Budaya (Seni Tari)' },
    { id: 'SeniTeater', fullName: 'Seni Budaya (Seni Teater)', label: 'S. Teater', active: false, curriculumKey: 'Seni Budaya (Seni Teater)' },
    { id: 'PJOK', fullName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', label: 'PJOK', active: true, curriculumKey: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' },
    { id: 'BIng', fullName: 'Bahasa Inggris', label: 'B. Ing', active: true, curriculumKey: 'Bahasa Inggris' },
    { id: 'BBali', fullName: 'Muatan Lokal (Bahasa Bali)', label: 'B. Bali', active: true, curriculumKey: 'Muatan Lokal (Bahasa Bali)' },
    { id: 'KodingAI', fullName: 'Koding dan Kecerdasan Artifisial', label: 'KKA', active: true, curriculumKey: 'Koding dan Kecerdasan Artifisial' },
];

const initialSettings = {
  nama_dinas_pendidikan: '', nama_sekolah: '', npsn: '', alamat_sekolah: '', desa_kelurahan: '',
  kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '', email_sekolah: '',
  telepon_sekolah: '', website_sekolah: '', faksimile: '', logo_sekolah: null,
  logo_dinas: null, logo_cover: null, piagam_background: null,
  ttd_kepala_sekolah: null, ttd_wali_kelas: null,
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  cocurricular_theme: '',
  predikats: { a: '90', b: '80', c: '70', d: '0' },
  gradeCalculation: {},
  qualitativeGradingMap: {},
  slmVisibility: {}, 
  kop_layout: [],
  piagam_layout: [],
  nilaiDisplayMode: 'kuantitatif saja', 
};

const initialStudents = [];
const initialGrades = [];
const initialNotes = {};
const initialCocurricularData = {};
const initialAttendance = [];
const initialStudentExtracurriculars = [];
const initialFormativeJournal = {};

/**
 * Safely loads data from localStorage with validation and default fallback.
 */
const loadDataSafe = (key, fallbackValue, validator = null) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallbackValue;
        const parsed = JSON.parse(saved);
        
        // Custom validation if provided
        if (validator && !validator(parsed)) {
            console.warn(`Data validation failed for key: ${key}. Reverting to fallback.`);
            return fallbackValue;
        }
        
        // For arrays, ensure it is an array
        if (Array.isArray(fallbackValue) && !Array.isArray(parsed)) {
            return fallbackValue;
        }
        
        // For objects, merge with fallback to ensure all keys exist (deep merge simple level)
        if (typeof fallbackValue === 'object' && !Array.isArray(fallbackValue) && fallbackValue !== null) {
             return { ...fallbackValue, ...parsed };
        }

        return parsed;
    } catch (e) {
        console.error(`Error loading ${key} from storage:`, e);
        return fallbackValue;
    }
};

const getAppData = (settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal) => ({
    settings,
    students,
    grades,
    notes,
    cocurricularData,
    attendance,
    extracurriculars,
    studentExtracurriculars,
    subjects,
    learningObjectives,
    formativeJournal
});

const getDynamicRKTFileName = (currentSettings) => {
    const sanitize = (str) => String(str || '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    const schoolName = sanitize(currentSettings.nama_sekolah || 'Nama Sekolah');
    const className = sanitize(currentSettings.nama_kelas || 'Kelas');
    const academicYear = sanitize(currentSettings.tahun_ajaran || 'TA').replace(/\//g, '-');
    const semester = sanitize(currentSettings.semester || 'Semester');
    return `RKT_${schoolName}_${className}_${academicYear}_${semester}.xlsx`.toUpperCase();
};

const excelRound = (num) => {
    if (num === null || typeof num === 'undefined') return null;
    return Math.round(num + Number.EPSILON);
};

const calculateFinalGrade = (detailed, config, settings) => {
    if (!detailed) return null;
    let finalScore = null;
    const { predikats, qualitativeGradingMap } = settings;
    const kkm = parseInt(predikats.c, 10);

    const getNumericScore = (score) => {
        if (typeof score === 'number') return score;
        if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
            return qualitativeGradingMap[score];
        }
        return null;
    };
    
    if (config.method === 'rata-rata') {
        const slmAvgScores = (detailed.slm || []).map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const stsScore = getNumericScore(detailed.sts);
        const sasScore = getNumericScore(detailed.sas);
        const avgOfSlms = slmAvgScores.length > 0 ? slmAvgScores.reduce((a, b) => a + b, 0) / slmAvgScores.length : null;
        
        const components = [avgOfSlms, stsScore, sasScore].filter(s => s !== null);
        if (components.length > 0) finalScore = components.reduce((a, b) => a + b, 0) / components.length;

    } else if (config.method === 'pembobotan') {
        let totalWeightedScore = 0;
        let totalWeightUsed = 0;
        const weights = config.weights || {};
        const tpWeights = weights.TP || {};
        const stsWeight = weights.STS || 0;
        const sasWeight = weights.SAS || 0;

        (detailed.slm || []).forEach(slm => {
            const slmTpWeights = tpWeights[slm.id] || [];
            (slm.scores || []).forEach((score, index) => {
                const numericScore = getNumericScore(score);
                const weight = slmTpWeights[index] || 0;
                if (numericScore !== null && weight > 0) {
                    totalWeightedScore += numericScore * (weight / 100);
                    totalWeightUsed += weight;
                }
            });
        });
        
        const stsScore = getNumericScore(detailed.sts);
        if (stsScore !== null && stsWeight > 0) {
            totalWeightedScore += stsScore * (stsWeight / 100);
            totalWeightUsed += stsWeight;
        }

        const sasScore = getNumericScore(detailed.sas);
        if (sasScore !== null && sasWeight > 0) {
            totalWeightedScore += sasScore * (sasWeight / 100);
            totalWeightUsed += sasWeight;
        }
        
        finalScore = totalWeightUsed > 0 ? totalWeightedScore : null;

    } else if (config.method === 'persentase' && !isNaN(kkm)) {
        const slmAvgScores = (detailed.slm || []).map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const allSummatives = [...slmAvgScores];
        const stsScore = getNumericScore(detailed.sts);
        const sasScore = getNumericScore(detailed.sts);
        if(stsScore !== null) allSummatives.push(stsScore);
        if(sasScore !== null) allSummatives.push(sasScore);
        
        if (allSummatives.length > 0) finalScore = (allSummatives.filter(s => s >= kkm).length / allSummatives.length) * 100;
    }

    return finalScore === null ? null : excelRound(finalScore);
};

// Helper: Chunk string for Excel
const chunkString = (str, len) => {
    const size = Math.ceil(str.length / len);
    const r = Array(size);
    for (let i = 0; i < size; i++) {
        r[i] = str.substr(i * len, len);
    }
    return r;
};

const App = () => {
  const { isUpdateAvailable, updateAssets } = useServiceWorker();
  const [activePage, setActivePage] = useState('DASHBOARD');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState(null);
  const [activeNilaiTab, setActiveNilaiTab] = useState('keseluruhan'); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isMobile } = useWindowDimensions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null); 
    
  const isInitialMount = useRef(true);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  const { isSignedIn, userProfile, googleToken, signIn, signOut,
          uploadFile, downloadFile, findRKTFileId, createRKTFile, findAllRKTFiles, deleteFile } = useGoogleAuth(GOOGLE_CLIENT_ID);
  
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);
  const [driveConflictData, setDriveConflictData] = useState(null); 

  // --- STATE INITIALIZATION WITH ROBUST LOADING ---
  const [settings, setSettings] = useState(() => {
      const loaded = loadDataSafe('appSettings', initialSettings);
      return {
          ...initialSettings,
          ...loaded,
          predikats: { ...initialSettings.predikats, ...(loaded.predikats || {}) },
      };
  });

  const [students, setStudents] = useState(() => 
      loadDataSafe('appStudents', initialStudents, Array.isArray)
  );

  const [grades, setGrades] = useState(() => 
      loadDataSafe('appGrades', initialGrades, Array.isArray)
  );

  const [notes, setNotes] = useState(() => 
      loadDataSafe('appNotes', initialNotes)
  );

  const [cocurricularData, setCocurricularData] = useState(() => 
      loadDataSafe('appCocurricularData', initialCocurricularData)
  );

  const [attendance, setAttendance] = useState(() => {
      const loaded = loadDataSafe('appAttendance', initialAttendance, Array.isArray);
      // Data scrubbing: ensure numeric fields are numbers or null
      return loaded.map(att => ({
          studentId: att.studentId,
          sakit: (att.sakit === 0 || att.sakit) ? Number(att.sakit) : null,
          izin: (att.izin === 0 || att.izin) ? Number(att.izin) : null,
          alpa: (att.alpa === 0 || att.alpa) ? Number(att.alpa) : null
      }));
  });

  const [extracurriculars, setExtracurriculars] = useState(() => 
      loadDataSafe('appExtracurriculars', [], Array.isArray)
  );

  const [studentExtracurriculars, setStudentExtracurriculars] = useState(() => 
      loadDataSafe('appStudentExtracurriculars', initialStudentExtracurriculars, Array.isArray)
  );

  const [subjects, setSubjects] = useState(() => 
      loadDataSafe('appSubjects', defaultSubjects, Array.isArray)
  );

  const [learningObjectives, setLearningObjectives] = useState(() => 
      loadDataSafe('appLearningObjectives', {})
  );

  const [formativeJournal, setFormativeJournal] = useState(() => 
      loadDataSafe('appFormativeJournal', initialFormativeJournal)
  );
  
  const [predefinedCurriculum, setPredefinedCurriculum] = useState(null);
  const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);

  const showToast = useCallback((message, type) => { setToast({ message, type }); }, []);
  
  const handleSettingsChange = useCallback((e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
        const file = files && files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, [name]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
        return;
    }
    
    if (type === 'file_processed') {
         setSettings(prev => ({ ...prev, [name]: value }));
         return;
    }
    
    if (name && name.startsWith('predikats.')) {
        const predikatKey = name.split('.')[1];
        setSettings(prev => {
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
                return { ...prev, predikats: newPredikats, qualitativeGradingMap: newQualitativeMap };
            }
            return { ...prev, predikats: newPredikats };
        });
        return;
    }
    
    if (type === 'class_change_confirmed') {
        const newGradeNumber = getGradeNumber(value);

        // Update the class name
        setSettings(prev => ({ ...prev, nama_kelas: value }));

        // Reset grades
        setGrades(prevGrades => prevGrades.map(g => ({
            studentId: g.studentId,
            detailedGrades: {},
            finalGrades: {}
        })));
        
        // Also reset SLM visibility as the SLMs will be different
        setSettings(prev => ({ ...prev, slmVisibility: {} }));
        
        showToast(`Kelas diubah ke Kelas ${newGradeNumber}. Semua data nilai telah direset.`, 'success');
        return;
    }
    
    if (name) { // Standard input change
        setSettings(prev => ({ ...prev, [name]: value }));
    }
}, [showToast]);

  useEffect(() => {
      if (gradeNumber) {
          fetch(`/tp${gradeNumber}.json`)
              .then(res => {
                  if (!res.ok) throw new Error(`Curriculum file for grade ${gradeNumber} not found.`);
                  return res.json();
              })
              .then(data => setPredefinedCurriculum(data))
              .catch(err => {
                  console.warn(err);
                  setPredefinedCurriculum({});
              });
      } else {
          setPredefinedCurriculum(null);
      }
  }, [gradeNumber]);

  // Data Integrity Check: Ensure every student has a corresponding entry in grades/attendance/etc
  // This prevents crashes in sub-pages if data is partially loaded or corrupt.
  useEffect(() => {
      if (students.length > 0) {
          let hasChanges = false;
          
          // 1. Repair Grades
          const newGrades = [...grades];
          students.forEach(s => {
              if (!newGrades.find(g => g.studentId === s.id)) {
                  newGrades.push({ studentId: s.id, detailedGrades: {}, finalGrades: {} });
                  hasChanges = true;
              }
          });
          if (hasChanges) setGrades(newGrades);

          // 2. Repair Attendance
          // (Logic handled in DataAbsensiPage mostly, but good to init here)
      }
  }, [students.length]); // Only run when student count changes

  // --- AUTOMATIC RECALCULATION EFFECT ---
  // Calculates final grades whenever settings (like KKM, calculation method) or subjects change.
  // This ensures data consistency on load and after settings updates.
  useEffect(() => {
      setGrades(currentGrades => {
          let anyChanged = false;
          const newGrades = currentGrades.map(studentGrade => {
              const newFinalGrades = { ...studentGrade.finalGrades };
              let studentChanged = false;

              subjects.forEach(subj => {
                  const detailed = studentGrade.detailedGrades?.[subj.id];
                  if (detailed) {
                      const config = settings.gradeCalculation?.[subj.id] || { method: 'rata-rata' };
                      const calculated = calculateFinalGrade(detailed, config, settings);
                      
                      // Check if calculation differs from stored (or if stored is missing)
                      // Be careful with 0 vs null comparison
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
  }, [settings.gradeCalculation, settings.predikats, settings.qualitativeGradingMap, subjects]);

  const learningObjectivesRef = useRef(learningObjectives);
  useEffect(() => { learningObjectivesRef.current = learningObjectives; }, [learningObjectives]);

  const appData = useMemo(() => getAppData(settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal), [
      settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal
  ]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const response = await fetch('/presets.json');
                if (!response.ok) throw new Error('Failed to fetch presets');
                const presetsData = await response.json();
                setPresets(presetsData);
                // If local extracurriculars are empty, seed from presets
                setExtracurriculars(prev => prev.length === 0 ? presetsData.extracurriculars || [] : prev);
            } catch (error) {
                console.error("Error initialization:", error);
                // Non-blocking error
            } finally { setIsLoading(false); }
        };
        initializeApp();
    }, []);

  const exportToExcelBlob = useCallback(async () => {
    if (typeof XLSX === 'undefined') return null;
    try {
        const wb = XLSX.utils.book_new();
        
        // --- 1. Sheet: Petunjuk ---
        const wsPetunjuk = XLSX.utils.aoa_to_sheet([
            ["Petunjuk Penggunaan Template RKT"],
            ["1. Jangan mengubah nama-nama sheet (lembar kerja) yang sudah ada."],
            ["2. Jangan mengubah header (baris pertama) pada setiap sheet."],
            ["3. Untuk kolom tanggal, gunakan format YYYY-MM-DD atau DD/MM/YYYY."],
            ["4. Simpan file ini dan unggah kembali ke aplikasi RKT untuk mengembalikan data."]
        ]);
        XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

        // --- 2. Sheet: Pengaturan ---
        // Exclude specific heavy keys to handle them separately or in other sheets
        const excludeKeys = ['predikats', 'gradeCalculation', 'kop_layout', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'piagam_layout', 'qualitativeGradingMap', 'slmVisibility', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
        
        const settingsRows = [
            ["Kunci Pengaturan", "Nilai"],
            ["format_version", "2"], // <-- Mark as new format
            ...Object.entries(settings).filter(([key]) => !excludeKeys.includes(key)).map(([key, val]) => [key, val || '']),
            [],
            ["Pengaturan Rentang Nilai (Predikat)"],
            ["Predikat", "Nilai Minimum"],
            ["A", settings.predikats.a],
            ["B", settings.predikats.b],
            ["C", settings.predikats.c],
            ["D", settings.predikats.d],
            [],
            ["Pengaturan Cara Pengolahan Nilai Rapor"],
            ["ID Mata Pelajaran", "Metode Perhitungan", "Bobot (JSON)", "SLM Visibility (JSON)"]
        ];

        subjects.forEach(s => {
            const config = settings.gradeCalculation?.[s.id] || {};
            const visibility = settings.slmVisibility?.[s.id] || [];
            settingsRows.push([
                s.id,
                config.method || 'rata-rata',
                JSON.stringify(config.weights || {}),
                JSON.stringify(visibility)
            ]);
        });

        const wsSettings = XLSX.utils.aoa_to_sheet(settingsRows);
        XLSX.utils.book_append_sheet(wb, wsSettings, "Pengaturan");

        // --- 3. Sheet: Mata Pelajaran (Format 1: . | Nama Lengkap | Singkatan | Status Aktif) ---
        const mapelHeader = [".", "Nama Lengkap", "Singkatan", "Status Aktif", "Kunci Kurikulum"];
        const mapelRows = [mapelHeader, ...subjects.map(s => [s.id, s.fullName, s.label, s.active ? "Aktif" : "Tidak Aktif", s.curriculumKey || s.fullName])];
        const wsMapel = XLSX.utils.aoa_to_sheet(mapelRows);
        XLSX.utils.book_append_sheet(wb, wsMapel, "Mata Pelajaran");

        // --- 4. Sheet: Ekstrakurikuler ---
        const ekstraHeader = ["ID Unik (Jangan Diubah)", "Nama Ekstrakurikuler", "Status Aktif"];
        const ekstraRows = [ekstraHeader, ...extracurriculars.map(e => [e.id, e.name, e.active ? "Aktif" : "Tidak Aktif"])];
        const wsEkstra = XLSX.utils.aoa_to_sheet(ekstraRows);
        XLSX.utils.book_append_sheet(wb, wsEkstra, "Ekstrakurikuler");

        // --- 5. Sheet: Daftar Siswa ---
        const siswaHeader = ["ID Siswa (Otomatis)", "Nama Lengkap", "Nama Panggilan", "NIS", "NISN", "Tempat, Tanggal Lahir", "Jenis Kelamin", "Agama", "Asal TK", "Alamat Siswa", "Diterima di Kelas", "Diterima Tanggal", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Alamat Orang Tua", "Telepon Orang Tua", "Nama Wali", "Pekerjaan Wali", "Alamat Wali", "Telepon Wali"];
        const siswaRows = [siswaHeader, ...students.map(s => [
            s.id, s.namaLengkap, s.namaPanggilan, s.nis, s.nisn, s.ttl, s.jenisKelamin, s.agama, s.asalTk, s.alamatSiswa, s.diterimaDiKelas, s.diterimaTanggal, s.namaAyah, s.namaIbu, s.pekerjaanAyah, s.pekerjaanIbu, s.alamatOrangTua, s.teleponOrangTua, s.namaWali, s.pekerjaanWali, s.alamatWali, s.teleponWali
        ])];
        const wsSiswa = XLSX.utils.aoa_to_sheet(siswaRows);
        XLSX.utils.book_append_sheet(wb, wsSiswa, "Daftar Siswa");

        // --- 6. Sheet: Tujuan Pembelajaran (Reconstruction) ---
        const gradeNumber = getGradeNumber(settings.nama_kelas);
        const gradeKey = `Kelas ${gradeNumber}`;
        const masterCurriculum = new Map();

        if (predefinedCurriculum) {
            subjects.filter(s => s.active).forEach(subject => {
                const curriculumKey = subject.curriculumKey || subject.fullName;
                const predefinedData = predefinedCurriculum[curriculumKey];
                if (predefinedData) {
                    const slms = predefinedData.map((slm, slmIndex) => ({
                        id: `slm_predefined_${subject.id}_${slmIndex}`,
                        name: slm.slm,
                        tps: slm.tp.map(tpText => ({ text: tpText }))
                    }));
                    masterCurriculum.set(subject.id, slms);
                }
            });
        }
        
        if (learningObjectives[gradeKey]) {
            subjects.filter(s => s.active).forEach(subject => {
                const curriculumKey = subject.curriculumKey || subject.fullName;
                const userTpsForSubject = learningObjectives[gradeKey][curriculumKey];
                if (!userTpsForSubject) return;

                let subjectSlms = masterCurriculum.get(subject.id) || [];
                const userTpsBySlm = userTpsForSubject.reduce((acc, tp) => {
                    if (!acc[tp.slmId]) acc[tp.slmId] = [];
                    acc[tp.slmId].push({ text: tp.text });
                    return acc;
                }, {});

                Object.entries(userTpsBySlm).forEach(([slmId, tps]) => {
                    const existingSlmIndex = subjectSlms.findIndex(s => s.id === slmId);
                    if (existingSlmIndex > -1) {
                        subjectSlms[existingSlmIndex].tps = tps;
                        const slmNameFromGrades = grades[0]?.detailedGrades?.[subject.id]?.slm.find(s => s.id === slmId)?.name;
                        if (slmNameFromGrades) subjectSlms[existingSlmIndex].name = slmNameFromGrades;
                    } else {
                        const slmName = grades[0]?.detailedGrades?.[subject.id]?.slm.find(s => s.id === slmId)?.name || 'Lingkup Materi Kustom';
                        subjectSlms.push({ id: slmId, name: slmName, tps: tps });
                    }
                });
                masterCurriculum.set(subject.id, subjectSlms);
            });
        }
        
        const tpHeader = ["ID Mata Pelajaran", "Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Deskripsi Tujuan Pembelajaran (TP)"];
        const tpRows = [tpHeader];
        masterCurriculum.forEach((slms, subjectId) => {
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                const curriculumKey = subject.curriculumKey || subject.fullName;
                slms.forEach(slm => {
                    slm.tps.forEach(tp => {
                        tpRows.push([subject.id, curriculumKey, slm.id, slm.name, tp.text]);
                    });
                });
            }
        });
        const wsTP = XLSX.utils.aoa_to_sheet(tpRows);
        XLSX.utils.book_append_sheet(wb, wsTP, "Tujuan Pembelajaran");

        // --- 7. Sheets: Nilai_{MapelID} ---
        subjects.filter(s => s.active).forEach(sub => {
            const subjectSlms = masterCurriculum.get(sub.id);
            const headers = ["ID Siswa", "Nama Siswa"];
            const colMap = [];

            if (subjectSlms) {
                subjectSlms.forEach(slm => {
                    slm.tps.forEach((tp, idx) => {
                        headers.push(`${slm.id}_TP${idx + 1}`);
                        colMap.push({ type: 'tp', slmId: slm.id, index: idx });
                    });
                });
            }
            headers.push("STS", "SAS");
            
            const sheetRows = [headers];
            students.forEach(st => {
                const sGrade = grades.find(g => g.studentId === st.id)?.detailedGrades?.[sub.id];
                const row = [st.id, st.namaLengkap];
                
                colMap.forEach(map => {
                    const slm = sGrade?.slm?.find(s => s.id === map.slmId);
                    const val = slm?.scores?.[map.index];
                    row.push(val !== undefined && val !== null ? val : '');
                });
                
                row.push(sGrade?.sts ?? '', sGrade?.sas ?? '');
                sheetRows.push(row);
            });
            const wsNilai = XLSX.utils.aoa_to_sheet(sheetRows);
            XLSX.utils.book_append_sheet(wb, wsNilai, `Nilai_${sub.id}`);
        });

        // --- 8. Sheet: Absensi (Format 1: No Name Column) ---
        const absensiHeader = ["ID Siswa", "Sakit", "Izin", "Alpa"];
        const absensiRows = [absensiHeader];
        students.forEach(s => {
            const att = attendance.find(a => a.studentId === s.id);
            absensiRows.push([s.id, att?.sakit ?? '', att?.izin ?? '', att?.alpa ?? '']);
        });
        const wsAbsensi = XLSX.utils.aoa_to_sheet(absensiRows);
        XLSX.utils.book_append_sheet(wb, wsAbsensi, "Absensi");

        // --- 9. Sheet: Data Ekstra ---
        // Flatten the structure: one row per assigned extra per student
        const dataEkstraHeader = ["ID Siswa", "Nama Siswa", "Urutan Ekstra", "ID Ekstrakurikuler", "Deskripsi"];
        const dataEkstraRows = [dataEkstraHeader];
        studentExtracurriculars.forEach(se => {
            const student = students.find(s => s.id === se.studentId);
            if (!student) return;
            
            (se.assignedActivities || []).forEach((actId, idx) => {
                if (actId) {
                    const desc = se.descriptions?.[actId] || '';
                    dataEkstraRows.push([se.studentId, student.namaLengkap, idx + 1, actId, desc]);
                }
            });
        });
        const wsDataEkstra = XLSX.utils.aoa_to_sheet(dataEkstraRows);
        XLSX.utils.book_append_sheet(wb, wsDataEkstra, "Data Ekstra");

        // --- 10. Sheet: Data Kokurikuler (Format 1: Headers are keys/IDs) ---
        const kokurHeader = ["ID Siswa", "Nama Siswa", ...COCURRICULAR_DIMENSIONS.map(d => d.id)];
        const kokurRows = [kokurHeader];
        students.forEach(s => {
            const coData = cocurricularData[s.id]?.dimensionRatings || {};
            const row = [s.id, s.namaLengkap];
            COCURRICULAR_DIMENSIONS.forEach(d => row.push(coData[d.id] || ''));
            kokurRows.push(row);
        });
        const wsKokur = XLSX.utils.aoa_to_sheet(kokurRows);
        XLSX.utils.book_append_sheet(wb, wsKokur, "Data Kokurikuler");

        // --- 11. Sheet: Catatan Wali Kelas (Format 1: No Name Column) ---
        const catatanHeader = ["ID Siswa", "Catatan Wali Kelas"];
        const catatanRows = [catatanHeader];
        students.forEach(s => {
            catatanRows.push([s.id, notes[s.id] || '']);
        });
        const wsCatatan = XLSX.utils.aoa_to_sheet(catatanRows);
        XLSX.utils.book_append_sheet(wb, wsCatatan, "Catatan Wali Kelas");

        // --- 12. Sheet: Jurnal Formatif ---
        const jurnalHeader = ["ID Siswa", "ID Catatan", "Tanggal", "Tipe", "Mapel ID", "SLM ID", "TP ID", "Topik", "Isi Catatan"];
        const jurnalRows = [jurnalHeader];
        Object.entries(formativeJournal).forEach(([studentId, notes]) => {
            notes.forEach(note => {
                jurnalRows.push([
                    studentId,
                    note.id,
                    note.date,
                    note.type,
                    note.subjectId || '',
                    note.slmId || '',
                    note.tpId || '',
                    note.topic || '',
                    note.note || ''
                ]);
            });
        });
        const wsJurnal = XLSX.utils.aoa_to_sheet(jurnalRows);
        XLSX.utils.book_append_sheet(wb, wsJurnal, "Jurnal Formatif");

        // --- 13. Sheet: Aset Gambar (Chunked) ---
        const asetHeader = ["Kunci Aset", "Data Base64"];
        const asetRows = [asetHeader];
        const assetsToSave = {
            'logo_sekolah': settings.logo_sekolah,
            'logo_dinas': settings.logo_dinas,
            'logo_cover': settings.logo_cover,
            'piagam_background': settings.piagam_background,
            'ttd_kepala_sekolah': settings.ttd_kepala_sekolah,
            'ttd_wali_kelas': settings.ttd_wali_kelas
        };

        Object.entries(assetsToSave).forEach(([key, base64Str]) => {
            if (base64Str && typeof base64Str === 'string' && base64Str.length > 0) {
                const chunks = chunkString(base64Str, 30000); // 30k char limit safe for Excel cell
                chunks.forEach((chunk, idx) => {
                    asetRows.push([`${key}_part_${idx}`, chunk]);
                });
            }
        });
        const wsAset = XLSX.utils.aoa_to_sheet(asetRows);
        XLSX.utils.book_append_sheet(wb, wsAset, "Aset Gambar");

        return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/octet-stream' });
    } catch (e) { 
        console.error("Export Error:", e);
        return null; 
    }
  }, [settings, students, grades, notes, attendance, studentExtracurriculars, subjects, cocurricularData, extracurriculars, learningObjectives, formativeJournal, predefinedCurriculum]);

    const parseExcelBlob = useCallback(async (blob) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        
        let news = { ...initialSettings };
        let nStud = [];
        let nAtt = [];
        let nNot = {};
        let nStEx = [];
        let nCo = {};
        let nGr = []; 
        let nSub = [...defaultSubjects];
        let nEx = [];
        let nLO = {};
        let nFJ = {}; // Jurnal Formatif

        const findSheet = (names) => {
            for (const name of names) {
                const found = workbook.SheetNames.find(sn => sn.toLowerCase().trim() === name.toLowerCase() || sn.toLowerCase().trim() === name.toLowerCase().replace(/\s/g, '_'));
                if (found) return workbook.Sheets[found];
            }
            return null;
        };

        const normalizeKey = (k) => String(k || '').toLowerCase().trim();

        // 1. Aset Gambar (Reassemble first so Settings can use them)
        const wsAset = findSheet(["Aset Gambar", "Images", "Assets"]);
        const assetMap = {};
        if (wsAset) {
            const assetData = XLSX.utils.sheet_to_json(wsAset, { header: 1 });
            // Group by key prefix
            const chunksByKey = {};
            assetData.forEach(row => {
                const keyPart = row[0];
                const data = row[1];
                if (keyPart && data) {
                    const match = keyPart.match(/^(.*)_part_(\d+)$/);
                    if (match) {
                        const realKey = match[1];
                        const idx = parseInt(match[2], 10);
                        if (!chunksByKey[realKey]) chunksByKey[realKey] = [];
                        chunksByKey[realKey][idx] = data;
                    }
                }
            });
            // Rejoin
            Object.entries(chunksByKey).forEach(([key, chunks]) => {
                assetMap[key] = chunks.join('');
            });
        }

        // 2. Settings
        const wsP = findSheet(["Pengaturan", "Settings", "Info Sekolah"]);
        if (wsP) {
            const data = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            data.forEach(r => {
                if (r[0] && r[0] !== 'ID Mata Pelajaran') { // Skip config table headers
                    if (['A', 'B', 'C', 'D'].includes(String(r[0]).toUpperCase())) {
                        news.predikats[String(r[0]).toLowerCase()] = String(r[1]);
                    } else if (r[0] in news) {
                        news[r[0]] = r[1];
                    }
                }
                // Restore Config Table Logic
                // Columns: [ID Mapel, Method, WeightsJSON, VisibilityJSON]
                // We detect this by checking if r[0] matches a subject ID
                const subjectId = r[0];
                // Simple heuristic: if it looks like a subject ID
                if (defaultSubjects.some(ds => ds.id === subjectId)) {
                    try {
                        const weights = r[2] ? JSON.parse(r[2]) : {};
                        const visibility = r[3] ? JSON.parse(r[3]) : [];
                        
                        if (!news.gradeCalculation) news.gradeCalculation = {};
                        news.gradeCalculation[subjectId] = {
                            method: r[1] || 'rata-rata',
                            weights: weights
                        };
                        
                        if (!news.slmVisibility) news.slmVisibility = {};
                        news.slmVisibility[subjectId] = visibility;
                    } catch (e) { console.warn("Failed parsing config for", subjectId, e); }
                }
            });
            // Merge assets
            news = { ...news, ...assetMap };
        }

        // 3. Mata Pelajaran
        const wsMapel = findSheet(["Mata Pelajaran"]);
        if (wsMapel) {
            const rawMapel = XLSX.utils.sheet_to_json(wsMapel);
            // Merge with defaults or replace? Better to merge active status.
            nSub = defaultSubjects.map(ds => {
                // Try ID (Format 1: Column ".")
                const found = rawMapel.find(r => r['.'] === ds.id || r['ID'] === ds.id);
                if (found) {
                    return { ...ds, active: found['Status Aktif'] === 'Aktif', curriculumKey: found['Kunci Kurikulum'] || ds.fullName };
                }
                return ds;
            });
            // Also add any custom subjects if ID not in default
            rawMapel.forEach(r => {
                const id = r['.'] || r['ID'];
                if (id && !defaultSubjects.some(ds => ds.id === id)) {
                    nSub.push({
                        id: id,
                        fullName: r['Nama Lengkap'] || r['Nama Mata Pelajaran'] || id, // Fallback to ID if name missing
                        label: r['Singkatan'] || id,
                        active: r['Status Aktif'] === 'Aktif',
                        curriculumKey: r['Kunci Kurikulum'] || r['Nama Lengkap']
                    });
                }
            });
        }

        // 4. Ekstrakurikuler
        const wsEkstraDef = findSheet(["Ekstrakurikuler"]);
        if (wsEkstraDef) {
            nEx = XLSX.utils.sheet_to_json(wsEkstraDef).map(r => ({
                id: r['ID Unik (Jangan Diubah)'],
                name: r['Nama Ekstrakurikuler'],
                active: r['Status Aktif'] === 'Aktif'
            }));
        }

        // 5. Daftar Siswa
        const wsS = findSheet(["Daftar Siswa", "Students", "Siswa", "Data Siswa"]);
        if (wsS) {
            nStud = XLSX.utils.sheet_to_json(wsS).map((s, idx) => {
                const findVal = (key) => s[key] || '';
                return {
                    id: String(s['ID Siswa (Otomatis)'] || `s_${Date.now()}_${idx}`),
                    namaLengkap: findVal('Nama Lengkap'),
                    namaPanggilan: findVal('Nama Panggilan'),
                    nis: findVal('NIS'),
                    nisn: findVal('NISN'),
                    ttl: findVal('Tempat, Tanggal Lahir'),
                    jenisKelamin: findVal('Jenis Kelamin'),
                    agama: findVal('Agama'),
                    asalTk: findVal('Asal TK'),
                    alamatSiswa: findVal('Alamat Siswa'),
                    diterimaDiKelas: findVal('Diterima di Kelas'),
                    diterimaTanggal: findVal('Diterima Tanggal'),
                    namaAyah: findVal('Nama Ayah'),
                    namaIbu: findVal('Nama Ibu'),
                    pekerjaanAyah: findVal('Pekerjaan Ayah'),
                    pekerjaanIbu: findVal('Pekerjaan Ibu'),
                    alamatOrangTua: findVal('Alamat Orang Tua'),
                    teleponOrangTua: findVal('Telepon Orang Tua'),
                    namaWali: findVal('Nama Wali'),
                    pekerjaanWali: findVal('Pekerjaan Wali'),
                    alamatWali: findVal('Alamat Wali'),
                    teleponWali: findVal('Telepon Wali')
                };
            });
        }

        // 6. Tujuan Pembelajaran (Restoring TPs)
        const wsTP = findSheet(["Tujuan Pembelajaran"]);
        if (wsTP) {
            const tpData = XLSX.utils.sheet_to_json(wsTP);
            const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '?'}`;
            nLO[gradeKey] = {};
            
            tpData.forEach(row => {
                const subjName = row['Nama Mata Pelajaran'];
                if (subjName) { // Check existence
                    if (!nLO[gradeKey][subjName]) nLO[gradeKey][subjName] = [];
                    nLO[gradeKey][subjName].push({
                        slmId: row['ID SLM'],
                        text: row['Deskripsi Tujuan Pembelajaran (TP)'],
                        isEdited: true 
                    });
                }
            });
        }

        // 7. Grades
        nGr = nStud.map(st => ({ studentId: st.id, detailedGrades: {}, finalGrades: {} }));
        
        workbook.SheetNames.forEach(name => {
            if (name.startsWith("Nilai_")) {
                const subIdRaw = name.split('_')[1];
                let subId = subIdRaw;
                // Correct common typos in Sheet names from legacy data
                if (subId === 'Blng' && !nSub.some(s => s.id === 'Blng') && nSub.some(s => s.id === 'BIng')) {
                    subId = 'BIng';
                }

                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
                
                rows.forEach(row => {
                    // Robust ID matching: Match exact, match if row ID contains missing prefix, or match suffix
                    const sid = String(row['ID Siswa'] || row['ID'] || row['a'] || '').trim();
                    let studentEntry = nGr.find(g => g.studentId === sid);
                    
                    if (!studentEntry) {
                        // Try adding 'student' prefix (e.g. _123 -> student_123)
                        studentEntry = nGr.find(g => g.studentId === 'student' + sid);
                    }
                    if (!studentEntry) {
                        // Try matching suffix (e.g. sid is '_123', real is 'student_123')
                        studentEntry = nGr.find(g => g.studentId.endsWith(sid) || sid.endsWith(g.studentId));
                    }

                    if (studentEntry) {
                        const detailed = studentEntry.detailedGrades[subId] || { slm: [], sts: row['STS'], sas: row['SAS'] };
                        // Parse dynamic SLM columns with whitespace trimming
                        Object.keys(row).forEach(rawHeader => {
                            const header = rawHeader.trim(); // Trim header to remove trailing spaces like '_TP1 '
                            // Match regex: {ANYTHING}_TP{DIGITS}
                            const match = header.match(/^(.*)_TP(\d+)$/);
                            if (match) {
                                const slmId = match[1];
                                const tpIndex = parseInt(match[2]) - 1;
                                
                                let slm = detailed.slm.find(s => s.id === slmId);
                                if (!slm) {
                                    slm = { id: slmId, name: 'Lingkup Materi', scores: [] };
                                    detailed.slm.push(slm);
                                }
                                slm.scores[tpIndex] = row[rawHeader];
                            }
                        });
                        studentEntry.detailedGrades[subId] = detailed;
                    }
                });
            }
        });

        // 8. Absensi
        const wsAtt = findSheet(["Absensi"]);
        if (wsAtt) {
            nAtt = XLSX.utils.sheet_to_json(wsAtt).map(r => ({
                studentId: String(r['ID Siswa']),
                sakit: r['Sakit'],
                izin: r['Izin'],
                alpa: r['Alpa']
            }));
        }

        // 9. Data Ekstra (Flattened to Nested)
        const wsDE = findSheet(["Data Ekstra"]);
        if (wsDE) {
            const deData = XLSX.utils.sheet_to_json(wsDE);
            const map = {};
            deData.forEach(row => {
                const sid = String(row['ID Siswa']);
                if (!map[sid]) map[sid] = { studentId: sid, assignedActivities: [], descriptions: {} };
                
                const idx = (row['Urutan Ekstra'] || 1) - 1;
                const actId = row['ID Ekstrakurikuler'];
                const desc = row['Deskripsi'];
                
                map[sid].assignedActivities[idx] = actId;
                if (actId) map[sid].descriptions[actId] = desc;
            });
            nStEx = Object.values(map);
        }

        // 10. Kokurikuler
        const wsKo = findSheet(["Data Kokurikuler"]);
        if (wsKo) {
            const koData = XLSX.utils.sheet_to_json(wsKo);
            koData.forEach(row => {
                const sid = String(row['ID Siswa']);
                const ratings = {};
                COCURRICULAR_DIMENSIONS.forEach(dim => {
                    // Try ID first (Format 1: keys like 'keimanan'), then Label (Old format fallback)
                    ratings[dim.id] = row[dim.id] || row[dim.label];
                });
                nCo[sid] = { dimensionRatings: ratings };
            });
        }

        // 11. Catatan
        const wsCat = findSheet(["Catatan Wali Kelas"]);
        if (wsCat) {
            XLSX.utils.sheet_to_json(wsCat).forEach(row => {
                const sid = String(row['ID Siswa']);
                nNot[sid] = row['Catatan Wali Kelas'];
            });
        }

        // 12. Jurnal Formatif
        const wsJF = findSheet(["Jurnal Formatif"]);
        if (wsJF) {
            const jfData = XLSX.utils.sheet_to_json(wsJF);
            jfData.forEach(row => {
                const sid = String(row['ID Siswa']);
                if (!nFJ[sid]) nFJ[sid] = [];
                nFJ[sid].push({
                    id: row['ID Catatan'] || Date.now(),
                    date: row['Tanggal'],
                    type: row['Tipe'],
                    subjectId: row['Mapel ID'],
                    slmId: row['SLM ID'],
                    tpId: row['TP ID'],
                    topic: row['Topik'],
                    note: row['Isi Catatan']
                });
            });
        }

        // --- RECALCULATE FINAL GRADES ---
        // Ensure final grades are populated based on the imported raw scores and settings
        nGr.forEach(studentGrade => {
            nSub.forEach(subj => {
                const detailed = studentGrade.detailedGrades[subj.id];
                if (detailed) {
                    const config = news.gradeCalculation?.[subj.id] || { method: 'rata-rata' };
                    // Recalculate using the imported logic and settings
                    studentGrade.finalGrades[subj.id] = calculateFinalGrade(detailed, config, news);
                }
            });
        });

        return { 
            settings: news, 
            students: nStud, 
            attendance: nAtt, 
            notes: nNot, 
            studentExtracurriculars: nStEx, 
            cocurricularData: nCo, 
            grades: nGr,
            subjects: nSub,
            extracurriculars: nEx,
            learningObjectives: nLO,
            formativeJournal: nFJ
        };
    }, [predefinedCurriculum]);

    const importFromExcelBlob = useCallback(async (blob) => {
        setIsLoading(true);
        try {
            const d = await parseExcelBlob(blob);
            // Multi-state update with force reload effect
            setSettings(d.settings);
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
            
            showToast('Data berhasil diimpor (Format Lengkap)!', 'success');
        } catch (error) {
            console.error("Import Failure:", error);
            showToast(`Gagal mengimpor: ${error.message}`, 'error');
        } finally { setIsLoading(false); }
    }, [parseExcelBlob, showToast]);

    const handleExportAll = useCallback(async () => {
        const blob = await exportToExcelBlob();
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = getDynamicRKTFileName(settings);
        link.click();
        showToast('File berhasil diunduh (Format Lengkap)!', 'success');
    }, [exportToExcelBlob, settings, showToast]);

    const handleImportAll = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = (e) => {
            if (e.target.files?.[0]) importFromExcelBlob(e.target.files[0]);
        };
        input.click();
    }, [importFromExcelBlob]);

    const autoSaveToDrive = useCallback(async () => {
        if (!isDirty || !isSignedIn || !isOnline) return;
        setSyncStatus('saving');
        try {
            const fileName = getDynamicRKTFileName(settings);
            const found = await findRKTFileId(fileName, settings);
            const blob = await exportToExcelBlob();
            if (found) await uploadFile(found.id, fileName, blob, RKT_MIME_TYPE);
            else await createRKTFile(fileName, blob, RKT_MIME_TYPE);
            setIsDirty(false); setSyncStatus('saved');
        } catch (e) { setSyncStatus('error'); }
    }, [isDirty, isSignedIn, isOnline, settings, exportToExcelBlob, findRKTFileId, uploadFile, createRKTFile]);
    
    // Save to LocalStorage effects
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(appData.settings));
        localStorage.setItem('appStudents', JSON.stringify(appData.students));
        localStorage.setItem('appGrades', JSON.stringify(appData.grades));
        localStorage.setItem('appNotes', JSON.stringify(appData.notes));
        localStorage.setItem('appAttendance', JSON.stringify(appData.attendance));
        localStorage.setItem('appCocurricularData', JSON.stringify(appData.cocurricularData));
        localStorage.setItem('appStudentExtracurriculars', JSON.stringify(appData.studentExtracurriculars));
        localStorage.setItem('appSubjects', JSON.stringify(appData.subjects));
        localStorage.setItem('appExtracurriculars', JSON.stringify(appData.extracurriculars));
        localStorage.setItem('appLearningObjectives', JSON.stringify(appData.learningObjectives));
        localStorage.setItem('appFormativeJournal', JSON.stringify(appData.formativeJournal));
        if (!isInitialMount.current && isSignedIn) { setIsDirty(true); setSyncStatus('unsaved'); }
        isInitialMount.current = false;
    }, [appData, isSignedIn]);

    useEffect(() => { if (isSignedIn && isDirty) autoSaveToDrive(); }, [activePage, isSignedIn, isDirty, autoSaveToDrive]);

  return React.createElement(React.Fragment, null,
      toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }),
      React.createElement('div', { className: isMobile ? "bg-slate-100" : "flex h-screen bg-slate-100" },
        React.createElement(Navigation, { 
            activePage, setActivePage, 
            onExport: handleExportAll, onImport: handleImportAll,
            isSignedIn, userEmail: userProfile?.email, isOnline, 
            syncStatus, onSignInClick: signIn, onSignOutClick: signOut, 
            isMobile, isMobileMenuOpen, setIsMobileMenuOpen, 
            currentPageName: NAV_ITEMS.find(i => i.id === activePage)?.label || 'Dashboard' 
        }),
        React.createElement('main', { className: "flex-1 overflow-auto p-4 sm:p-8" }, 
            isLoading ? "Memuat..." : 
            activePage === 'DASHBOARD' ? React.createElement(Dashboard, { setActivePage, settings, students, grades, subjects, notes, attendance, extracurriculars, studentExtracurriculars, cocurricularData, onNavigateToNilai: (subjectId) => { setActiveNilaiTab(subjectId); setActivePage('DATA_NILAI'); } }) :
            activePage === 'DATA_SISWA' ? React.createElement(DataSiswaPage, { students, namaKelas: settings.nama_kelas, onBulkSaveStudents: setStudents, onDeleteStudent: id => setStudents(prev => prev.filter(s => s.id !== id)), showToast }) :
            activePage === 'DATA_NILAI' ? React.createElement(DataNilaiPage, { 
                students, grades, settings, 
                onBulkUpdateGrades: (u) => setGrades(prev => {
                    const next = [...prev];
                    u.forEach(x => {
                        let g = next.find(ng => ng.studentId === x.studentId);
                        if(!g) { g = { studentId: x.studentId, detailedGrades: {}, finalGrades: {} }; next.push(g); }
                        g.detailedGrades[x.subjectId] = x.newDetailedGrade;
                        g.finalGrades[x.subjectId] = calculateFinalGrade(x.newDetailedGrade, settings.gradeCalculation[x.subjectId] || {method: 'rata-rata'}, settings);
                    });
                    return next;
                }), 
                learningObjectives, onUpdateLearningObjectives: setLearningObjectives, 
                subjects, 
                onUpdatePredikats: p => setSettings(s => ({...s, predikats: p})), 
                activeTab: activeNilaiTab, onTabChange: setActiveNilaiTab, 
                onUpdateGradeCalculation: (sid, conf) => setSettings(s => ({ ...s, gradeCalculation: { ...s.gradeCalculation, [sid]: conf } })),
                onUpdateSlmVisibility: (sid, vis) => setSettings(s => ({ ...s, slmVisibility: { ...s.slmVisibility, [sid]: vis } })),
                onUpdateDisplayMode: (mode) => setSettings(s => ({ ...s, nilaiDisplayMode: mode })),
                onBulkAddSlm: (subjectId, slm) => {
                    setGrades(prev => prev.map(g => {
                        const d = g.detailedGrades?.[subjectId] || { slm: [], sts: null, sas: null };
                        if (!d.slm.some(s => s.id === slm.id)) {
                            d.slm.push({ ...slm, scores: [...slm.scores] });
                        }
                        return { ...g, detailedGrades: { ...g.detailedGrades, [subjectId]: d } };
                    }));
                },
                predefinedCurriculum: predefinedCurriculum,
                showToast 
            }) :
            activePage === 'DATA_KOKURIKULER' ? React.createElement(DataKokurikulerPage, { students, settings, cocurricularData, onSettingsChange: handleSettingsChange, onUpdateCocurricularData: (sid, did, val) => setCocurricularData(prev => ({...prev, [sid]: { ...prev[sid], dimensionRatings: { ...(prev[sid]?.dimensionRatings || {}), [did]: val } } })), showToast }) :
            activePage === 'PENGATURAN' ? React.createElement(SettingsPage, { settings, onSettingsChange: handleSettingsChange, onSave: () => setIsDirty(true), onUpdateKopLayout: (l) => setSettings(s => ({...s, kop_layout: l})), subjects, onUpdateSubjects: setSubjects, extracurriculars, onUpdateExtracurriculars: setExtracurriculars, showToast }) :
            activePage === 'DATA_ABSENSI' ? React.createElement(DataAbsensiPage, { students, attendance, onUpdateAttendance: (sid, t, v) => setAttendance(prev => {
                const n = [...prev]; const i = n.findIndex(a => a.studentId === sid);
                if(i>-1) n[i][t] = v===''?null:parseInt(v); else n.push({studentId:sid, [t]: v===''?null:parseInt(v)}); return n;
            }), onBulkUpdateAttendance: setAttendance, showToast }) :
            activePage === 'CATATAN_WALI_KELAS' ? React.createElement(CatatanWaliKelasPage, { students, notes, onUpdateNote: (sid, note) => setNotes(prev => ({...prev, [sid]: note})), grades, subjects, settings, showToast }) :
            activePage === 'DATA_EKSTRAKURIKULER' ? React.createElement(DataEkstrakurikulerPage, { students, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars: setStudentExtracurriculars, showToast }) :
            activePage === 'PRINT_RAPOR' ? React.createElement(PrintRaporPage, { 
                students, settings, grades, attendance, notes, studentExtracurriculars, extracurriculars, subjects, learningObjectives, cocurricularData, 
                onUpdateDescription: (sid, subId, type, val) => {
                    setGrades(prev => {
                        const n = [...prev];
                        const g = n.find(x => x.studentId === sid);
                        if(g && g.detailedGrades[subId]) {
                            if(!g.detailedGrades[subId].descriptions) g.detailedGrades[subId].descriptions = {};
                            g.detailedGrades[subId].descriptions[type] = val;
                        }
                        return n;
                    });
                },
                onUpdateStudent: (id, key, val) => setStudents(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s)),
                onUpdateSettings: (key, val) => setSettings(s => ({ ...s, [key]: val })),
                onUpdateNote: (sid, val) => setNotes(n => ({ ...n, [sid]: val })),
                onUpdateAttendance: (sid, key, val) => setAttendance(prev => {
                    const n = [...prev]; const i = n.findIndex(a => a.studentId === sid);
                    if(i>-1) n[i][key] = val; else n.push({studentId:sid, [key]: val}); return n;
                }),
                onUpdateExtraDescription: (sid, eid, val) => setStudentExtracurriculars(prev => prev.map(s => s.studentId === sid ? { ...s, descriptions: { ...s.descriptions, [eid]: val } } : s)),
                onUpdateCocurricularManual: (sid, val) => setCocurricularData(prev => ({ ...prev, [sid]: { ...prev[sid], manualDescription: val } })),
                showToast 
            }) :
            activePage === 'PRINT_PIAGAM' ? React.createElement(PrintPiagamPage, { students, settings, grades, subjects, onUpdatePiagamLayout: (l) => setSettings(s => ({...s, piagam_layout: l})), showToast }) :
            activePage === 'PRINT_LEGER' ? React.createElement(PrintLegerPage, { students, settings, grades, subjects, showToast }) :
            activePage === 'JURNAL_FORMATIF' ? React.createElement(JurnalFormatifPage, { students, formativeJournal, onUpdate: (sid, data) => setFormativeJournal(prev => {
                const next = { ...prev }; if(!next[sid]) next[sid] = [];
                const idx = next[sid].findIndex(n => n.id === data.id);
                if(idx > -1) next[sid][idx] = data; else next[sid].push({ ...data, id: Date.now() });
                return next;
            }), onDelete: (sid, id) => setFormativeJournal(prev => ({...prev, [sid]: prev[sid].filter(n => n.id !== id)})), showToast, subjects, grades, settings, predefinedCurriculum: predefinedCurriculum }) :
            React.createElement(PlaceholderPage, { title: activePage })
        )
      )
  );
};

export default App;
