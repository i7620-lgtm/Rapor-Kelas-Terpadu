import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
// ... (imports remain unchanged)
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

// ... (constants and db helper remain unchanged)
const GOOGLE_CLIENT_ID = window.RKT_CONFIG?.GOOGLE_CLIENT_ID || null;
if (!GOOGLE_CLIENT_ID) {
    console.warn(
        "Gagal mendapatkan GOOGLE_CLIENT_ID dari 'window.RKT_CONFIG'. " +
        "Fitur sinkronisasi Google Drive akan dinaktifkan. " +
        "Ini biasanya berarti variabel environment 'RKT_GOOGLE_CLIENT_ID' tidak diatur dengan benar di Vercel, atau build script gagal membuat file 'config.js'."
    );
}

const RKT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('RKT_OfflineDB', 1);
    request.onerror = () => reject("Error opening IndexedDB.");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingSyncs')) {
            db.createObjectStore('pendingSyncs', { keyPath: 'id' });
        }
    };
});

const db = {
    get: async (storeName, key) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    put: async (storeName, value) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    delete: async (storeName, key) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

const defaultSubjects = [
    { id: 'PAIslam', fullName: 'Pendidikan Agama dan Budi Pekerti (Islam)', label: 'PA Islam', active: true },
    { id: 'PAKristen', fullName: 'Pendidikan Agama dan Budi Pekerti (Kristen)', label: 'PA Kristen', active: true },
    { id: 'PAKatolik', fullName: 'Pendidikan Agama dan Budi Pekerti (Katolik)', label: 'PA Katolik', active: false },
    { id: 'PAHindu', fullName: 'Pendidikan Agama dan Budi Pekerti (Hindu)', label: 'PA Hindu', active: true },
    { id: 'PABuddha', fullName: 'Pendidikan Agama dan Budi Pekerti (Buddha)', label: 'PA Buddha', active: false },
    { id: 'PAKhonghucu', fullName: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)', label: 'PA Khonghucu', active: false },
    { id: 'PP', fullName: 'Pendidikan Pancasila', label: 'PP', active: true },
    { id: 'BIndo', fullName: 'Bahasa Indonesia', label: 'B. Indo', active: true },
    { id: 'MTK', fullName: 'Matematika', label: 'MTK', active: true },
    { id: 'IPAS', fullName: 'Ilmu Pengetahuan Alam dan Sosial', label: 'IPAS', active: true },
    { id: 'SeniMusik', fullName: 'Seni Budaya (Seni Musik)', label: 'S. Musik', active: false },
    { id: 'SeniRupa', fullName: 'Seni Budaya (Seni Rupa)', label: 'S. Rupa', active: true },
    { id: 'SeniTari', fullName: 'Seni Budaya (Seni Tari)', label: 'S. Tari', active: false },
    { id: 'SeniTeater', fullName: 'Seni Budaya (Seni Teater)', label: 'S. Teater', active: false },
    { id: 'PJOK', fullName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', label: 'PJOK', active: true },
    { id: 'BIng', fullName: 'Bahasa Inggris', label: 'B. Ing', active: true },
    { id: 'BSunda', fullName: 'Muatan Lokal (Bahasa Sunda)', label: 'B. Sunda', active: false },
    { id: 'BBali', fullName: 'Muatan Lokal (Bahasa Bali)', label: 'B. Bali', active: true },
];

const initialSettings = {
  nama_dinas_pendidikan: '', nama_sekolah: '', npsn: '', alamat_sekolah: '', desa_kelurahan: '',
  kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '', email_sekolah: '',
  telepon_sekolah: '', website_sekolah: '', faksimile: '', logo_sekolah: null,
  logo_dinas: null, logo_cover: null, piagam_background: null,
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  cocurricular_theme: '',
  predikats: { a: '90', b: '80', c: '70', d: '0' },
  gradeCalculation: {},
  qualitativeGradingMap: {},
  kop_layout: [],
  piagam_layout: [],
};

const initialStudents = [];
const initialGrades = [];
const initialNotes = {};
const initialCocurricularData = {};
const initialAttendance = [];
const initialStudentExtracurriculars = [];
const initialFormativeJournal = {};

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

const calculateFinalGrade = (detailed, config, settings) => {
    // ... (unchanged)
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
        const sasScore = getNumericScore(detailed.sas);
        if(stsScore !== null) allSummatives.push(stsScore);
        if(sasScore !== null) allSummatives.push(sasScore);
        
        if (allSummatives.length > 0) finalScore = (allSummatives.filter(s => s >= kkm).length / allSummatives.length) * 100;
    }

    return finalScore === null ? null : Math.round(finalScore);
};

// Helper function to calculate data completeness percentage
// UPDATED: Strictly filters out empty/ghost students before calculating.
const calculateDataCompleteness = (data) => {
    const { students, grades, subjects, attendance, notes, studentExtracurriculars } = data;
    
    // 1. FILTER VALID STUDENTS (Ignore ghost rows/empty names)
    // This is the key fix requested. Only count rows with actual names.
    const validStudents = (students || []).filter(s => s.namaLengkap && s.namaLengkap.toString().trim() !== '');
    
    if (validStudents.length === 0) return 0;

    const totalValidStudents = validStudents.length;
    const activeSubjects = (subjects || []).filter(s => s.active);
    
    // 1. Student Data (20% weight)
    const requiredStudentFields = ['nis', 'nisn', 'namaLengkap']; 
    let filledStudentDataCount = 0;
    validStudents.forEach(s => {
        if (requiredStudentFields.every(k => s[k] && s[k].toString().trim() !== '')) {
            filledStudentDataCount++;
        }
    });
    const studentScore = (filledStudentDataCount / totalValidStudents) * 20;

    // 2. Grades (40% weight)
    let totalGradeSlots = totalValidStudents * activeSubjects.length;
    let filledGradeSlots = 0;
    
    const hasData = (val) => val !== null && val !== '' && val !== undefined;

    if (grades && grades.length > 0 && totalGradeSlots > 0) {
        validStudents.forEach(student => {
            const studentGrade = grades.find(g => g.studentId === student.id);
            if (studentGrade && studentGrade.detailedGrades) {
                activeSubjects.forEach(sub => {
                    const details = studentGrade.detailedGrades[sub.id];
                    if (details) {
                        const hasSts = hasData(details.sts);
                        const hasSas = hasData(details.sas);
                        let hasTp = false;
                        if (details.slm && Array.isArray(details.slm)) {
                            hasTp = details.slm.some(s => s.scores && s.scores.some(sc => hasData(sc)));
                        }

                        if (hasSas || hasSts || hasTp) {
                            filledGradeSlots++;
                        }
                    }
                });
            }
        });
    }
    const gradesScore = totalGradeSlots > 0 ? (filledGradeSlots / totalGradeSlots) * 40 : 0;

    // 3. Attendance (10% weight)
    let filledAttendance = 0;
    if (attendance) {
        validStudents.forEach(s => {
            const att = attendance.find(a => a.studentId === s.id);
            if (att && (att.sakit != null || att.izin != null || att.alpa != null)) filledAttendance++;
        });
    }
    const attendanceScore = (filledAttendance / totalValidStudents) * 10;

    // 4. Notes (15% weight)
    let filledNotes = 0;
    if (notes) {
        validStudents.forEach(s => {
            if (notes[s.id] && notes[s.id].trim() !== '') filledNotes++;
        });
    }
    const notesScore = (filledNotes / totalValidStudents) * 15;

    // 5. Extracurriculars (15% weight)
    let filledExtra = 0;
    if (studentExtracurriculars) {
        validStudents.forEach(s => {
            const extra = studentExtracurriculars.find(se => se.studentId === s.id);
            if (extra && extra.assignedActivities && extra.assignedActivities.some(a => a !== null)) filledExtra++;
        });
    }
    const extraScore = (filledExtra / totalValidStudents) * 15;

    const total = Math.round(studentScore + gradesScore + attendanceScore + notesScore + extraScore);
    return isNaN(total) ? 0 : total;
};


const App = () => {
  // ... (App component logic remains same, just ensuring parseExcelBlob uses strict filtering too)
  const { isUpdateAvailable, updateAssets } = useServiceWorker();
  // ... (state hooks)
  const [activePage, setActivePage] = useState('DASHBOARD');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState(null);
  const [dataNilaiInitialTab, setDataNilaiInitialTab] = useState('keseluruhan');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isMobile } = useWindowDimensions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
  const isInitialMount = useRef(true);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  const { isSignedIn, userProfile, googleToken, signIn, signOut,
          uploadFile, downloadFile, findRKTFileId, createRKTFile, findAllRKTFiles, deleteFile } = useGoogleAuth(GOOGLE_CLIENT_ID);
  
  const prevUserProfile = useRef(userProfile);
  
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);
  const [driveConflictData, setDriveConflictData] = useState(null); 

  const [googleDriveFileId, setGoogleDriveFileId] = useState(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);

  // ... (isDefaultAppData, state initializers)
  
  const isDefaultAppData = useCallback((data, currentPresets, defaultSubjects) => {
      const defaultExtracurriculars = currentPresets?.extracurriculars || [];
      return JSON.stringify(data.settings) === JSON.stringify(initialSettings) &&
             JSON.stringify(data.students) === JSON.stringify(initialStudents) &&
             JSON.stringify(data.grades) === JSON.stringify(initialGrades) &&
             JSON.stringify(data.notes) === JSON.stringify(initialNotes) &&
             JSON.stringify(data.cocurricularData) === JSON.stringify(initialCocurricularData) &&
             JSON.stringify(data.attendance) === JSON.stringify(initialAttendance) &&
             JSON.stringify(data.extracurriculars) === JSON.stringify(defaultExtracurriculars) &&
             JSON.stringify(data.studentExtracurriculars) === JSON.stringify(initialStudentExtracurriculars) &&
             JSON.stringify(data.subjects) === JSON.stringify(defaultSubjects) &&
             JSON.stringify(data.learningObjectives) === JSON.stringify({}) &&
             JSON.stringify(data.formativeJournal) === JSON.stringify(initialFormativeJournal);
  }, []);

  const [settings, setSettings] = useState(() => {
    try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...initialSettings,
                ...parsed,
                predikats: { ...initialSettings.predikats, ...(parsed.predikats || {}) },
                gradeCalculation: parsed.gradeCalculation || {},
            };
        }
        return initialSettings;
    } catch (e) { return initialSettings; }
  });
  const [students, setStudents] = useState(() => {
    try {
        const saved = localStorage.getItem('appStudents');
        return saved ? JSON.parse(saved) : initialStudents;
    } catch (e) { return initialStudents; }
  });
  const [grades, setGrades] = useState(() => {
    try {
        const saved = localStorage.getItem('appGrades');
        return saved ? JSON.parse(saved) : initialGrades;
    } catch (e) { return initialGrades; }
  });
  const [notes, setNotes] = useState(() => {
      try {
          const saved = localStorage.getItem('appNotes');
          return saved ? JSON.parse(saved) : initialNotes;
      } catch (e) { return initialNotes; }
  });
  const [cocurricularData, setCocurricularData] = useState(() => {
      try {
          const saved = localStorage.getItem('appCocurricularData');
          return saved ? JSON.parse(saved) : initialCocurricularData;
      } catch (e) { return initialCocurricularData; }
  });
  const [attendance, setAttendance] = useState(() => {
      try {
          const saved = localStorage.getItem('appAttendance');
          const parsed = saved ? JSON.parse(saved) : initialAttendance;
          return parsed.map(att => ({
              studentId: att.studentId,
              sakit: att.sakit === 0 ? 0 : (att.sakit ?? null),
              izin: att.izin === 0 ? 0 : (att.izin ?? null),
              alpa: att.alpa === 0 ? 0 : (att.alpa ?? null)
          }));
      } catch (e) { return initialAttendance; }
  });
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [studentExtracurriculars, setStudentExtracurriculars] = useState(() => {
      try {
          const saved = localStorage.getItem('appStudentExtracurriculars');
          return saved ? JSON.parse(saved) : initialStudentExtracurriculars;
    } catch (e) { return initialStudentExtracurriculars; }
  });
  const [subjects, setSubjects] = useState(() => {
    try {
        const saved = localStorage.getItem('appSubjects');
        return saved ? JSON.parse(saved) : defaultSubjects;
    } catch (e) { return defaultSubjects; }
  });
  const [learningObjectives, setLearningObjectives] = useState(() => {
      try {
          const saved = localStorage.getItem('appLearningObjectives');
          return saved ? JSON.parse(saved) : {};
      } catch (e) { return {}; }
  });
  const [formativeJournal, setFormativeJournal] = useState(() => {
      try {
          const saved = localStorage.getItem('appFormativeJournal');
          return saved ? JSON.parse(saved) : initialFormativeJournal;
      } catch (e) { return initialFormativeJournal; }
  });
  
  useEffect(() => {
    const { a, b, c, d } = settings.predikats;
    const valA = parseInt(a, 10);
    const valB = parseInt(b, 10);
    const valC = parseInt(c, 10);
    const valD = parseInt(d, 10);

    if (![valA, valB, valC, valD].some(isNaN)) {
        const newMap = {
            SB: Math.round((valA + 100) / 2),
            BSH: Math.round((valB + (valA - 1)) / 2),
            MB: Math.round((valC + (valB - 1)) / 2),
            BB: Math.round((valD + (valC - 1)) / 2),
        };
        // Only update state if the map has actually changed to prevent infinite loops.
        if (JSON.stringify(newMap) !== JSON.stringify(settings.qualitativeGradingMap)) {
            setSettings(prev => ({...prev, qualitativeGradingMap: newMap}));
        }
    }
  }, [settings.predikats, settings.qualitativeGradingMap]);

  const appData = useMemo(() => getAppData(settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal), [
      settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal
  ]);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);
    
    useEffect(() => {
        const initializeApp = async () => {
            try {
                const response = await fetch('/presets.json');
                if (!response.ok) throw new Error('Failed to fetch presets');
                const presetsData = await response.json();
                setPresets(presetsData);

                const savedExtracurricularsJSON = localStorage.getItem('appExtracurriculars');
                let extrasToLoad = [];
                if (savedExtracurricularsJSON) {
                    try {
                        const parsedExtras = JSON.parse(savedExtracurricularsJSON);
                        if (Array.isArray(parsedExtras) && parsedExtras.length > 0) {
                            extrasToLoad = parsedExtras;
                        }
                    } catch (e) { console.error("Error parsing extracurriculars from localStorage", e); }
                }
                
                if (extrasToLoad.length === 0) {
                    extrasToLoad = presetsData.extracurriculars || [];
                }
                setExtracurriculars(extrasToLoad);

            } catch (error) {
                console.error("Error during app initialization:", error);
                showToast('Gagal memuat data preset ekstrakurikuler.', 'error');
                setExtracurriculars([]);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, [showToast]);

  const exportToExcelBlob = useCallback(() => {
    // ... (unchanged export logic)
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
        return null;
    }
    try {
        const wb = XLSX.utils.book_new();
        // ... (standard export logic)
        const petunjukData = [
            ["Petunjuk Penggunaan Template RKT"],
            ["1. Jangan mengubah nama-nama sheet (lembar kerja) yang sudah ada."],
            // ...
        ];
        const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
        XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

        // Sheet 2: Pengaturan
        const settingsData = Object.entries(initialSettings)
            .filter(([key]) => !['predikats', 'gradeCalculation', 'kop_layout', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'piagam_layout', 'qualitativeGradingMap'].includes(key))
            .map(([key, _]) => [key, settings[key] || '']);
        settingsData.unshift(["Kunci Pengaturan", "Nilai"]);
        
        settingsData.push([]);
        settingsData.push(["Pengaturan Rentang Nilai (Predikat)"]);
        settingsData.push(["Predikat", "Nilai Minimum"]);
        settingsData.push(['A', settings.predikats.a]);
        settingsData.push(['B', settings.predikats.b]);
        settingsData.push(['C', settings.predikats.c]);
        settingsData.push(['D', settings.predikats.d]);

        settingsData.push([]);
        settingsData.push(["Pengaturan Cara Pengolahan Nilai Rapor"]);
        const gradeCalcHeader = ["ID Mata Pelajaran", "Metode Perhitungan", "Bobot (JSON)"];
        settingsData.push(gradeCalcHeader);
        Object.entries(settings.gradeCalculation).forEach(([subjectId, config]) => {
            const weightsString = config.weights ? JSON.stringify(config.weights) : '';
            settingsData.push([ subjectId, config.method, weightsString ]);
        });
        const wsPengaturan = XLSX.utils.aoa_to_sheet(settingsData);
        XLSX.utils.book_append_sheet(wb, wsPengaturan, "Pengaturan");

        // Sheets 3 & 4
        const subjectsData = subjects.map(s => ({ "ID Internal (Jangan Diubah)": s.id, "Nama Lengkap": s.fullName, "Singkatan": s.label, "Status Aktif": s.active ? 'Aktif' : 'Tidak Aktif' }));
        const wsSubjects = XLSX.utils.json_to_sheet(subjectsData);
        XLSX.utils.book_append_sheet(wb, wsSubjects, "Mata Pelajaran");
        
        const extraData = extracurriculars.map(e => ({ "ID Unik (Jangan Diubah)": e.id, "Nama Ekstrakurikuler": e.name, "Status Aktif": e.active ? 'Aktif' : 'Tidak Aktif' }));
        const wsExtra = XLSX.utils.json_to_sheet(extraData);
        XLSX.utils.book_append_sheet(wb, wsExtra, "Ekstrakurikuler");
        
        // Sheet 5: Daftar Siswa
        const studentsData = students.map(s => ({
          'ID Siswa (Otomatis)': s.id, 'Nama Lengkap': s.namaLengkap, 'Nama Panggilan': s.namaPanggilan, 'NIS': s.nis, 'NISN': s.nisn, 'Tempat, Tanggal Lahir': s.ttl, 'Jenis Kelamin': s.jenisKelamin, 'Agama': s.agama, 'Asal TK': s.asalTk, 'Alamat Siswa': s.alamatSiswa, 'Diterima di Kelas': s.diterimaDiKelas, 'Diterima Tanggal': s.diterimaTanggal, 'Nama Ayah': s.namaAyah, 'Nama Ibu': s.namaIbu, 'Pekerjaan Ayah': s.pekerjaanAyah, 'Pekerjaan Ibu': s.pekerjaanIbu, 'Alamat Orang Tua': s.alamatOrangTua, 'Telepon Orang Tua': s.teleponOrangTua, 'Nama Wali': s.namaWali, 'Pekerjaan Wali': s.pekerjaanWali, 'Alamat Wali': s.alamatWali, 'Telepon Wali': s.teleponWali,
        }));
        const wsStudents = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, wsStudents, "Daftar Siswa");

        // Sheet 6: Tujuan Pembelajaran
        const tpExportData = [];
        const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas)}`;
        const objectivesForClass = learningObjectives[gradeKey] || {};

        const gradedTpIdentifiers = new Set();
        grades.forEach(studentGrade => {
            Object.entries(studentGrade.detailedGrades).forEach(([subjectId, subjectData]) => {
                (subjectData.slm || []).forEach(slm => {
                    (slm.scores || []).forEach((score, tpIndex) => {
                        if (score !== null && score !== undefined && score !== '') {
                            const identifier = `${subjectId}|${slm.id}|${tpIndex}`;
                            gradedTpIdentifiers.add(identifier);
                        }
                    });
                });
            });
        });
        
        for (const subjectFullName in objectivesForClass) {
            const subject = subjects.find(s => s.fullName === subjectFullName);
            if (!subject) continue;

            const objectivesForSubject = objectivesForClass[subjectFullName] || [];
            const slmsInGrades = grades.length > 0 ? (grades[0].detailedGrades?.[subject.id]?.slm || []) : [];

            const tpsBySlm = objectivesForSubject.reduce((acc, obj) => {
                if (!acc[obj.slmId]) acc[obj.slmId] = [];
                acc[obj.slmId].push(obj.text);
                return acc;
            }, {});

            for (const slmId in tpsBySlm) {
                const tpTexts = tpsBySlm[slmId];
                tpTexts.forEach((tpText, tpIndex) => {
                    const identifier = `${subject.id}|${slmId}|${tpIndex}`;
                    if (gradedTpIdentifiers.has(identifier)) {
                        const slmInfo = slmsInGrades.find(s => s.id === slmId);
                        tpExportData.push({
                            "ID Mata Pelajaran": subject.id,
                            "Nama Mata Pelajaran": subject.fullName,
                            "ID SLM": slmId,
                            "Nama SLM": slmInfo?.name || "Nama SLM tidak ditemukan",
                            "Deskripsi Tujuan Pembelajaran (TP)": tpText,
                        });
                    }
                });
            }
        }
        
        const wsTP = XLSX.utils.json_to_sheet(tpExportData, {header: ["ID Mata Pelajaran", "Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Deskripsi Tujuan Pembelajaran (TP)"]});
        XLSX.utils.book_append_sheet(wb, wsTP, "Tujuan Pembelajaran");

        // Sheets 7...N: Nilai per Mapel
        const activeSubjects = subjects.filter(s => s.active);
        activeSubjects.forEach(subject => {
            const nilaiSheetData = [];
            const header = ["ID Siswa", "Nama Siswa"];
            
            const objectivesForSubject = (objectivesForClass || {})[subject.fullName] || [];
            const slmsForSubject = grades.length > 0 ? (grades[0].detailedGrades?.[subject.id]?.slm || []) : [];

            slmsForSubject.forEach(slm => {
                const tpCount = objectivesForSubject.filter(o => o.slmId === slm.id).length;
                for (let i = 1; i <= tpCount; i++) header.push(`${slm.id}_TP${i}`);
            });
            header.push("STS", "SAS");
            nilaiSheetData.push(header);

            students.forEach(student => {
                const row = { "ID Siswa": student.id, "Nama Siswa": student.namaLengkap };
                const studentGrade = grades.find(g => g.studentId === student.id);
                const detailedGrade = studentGrade?.detailedGrades?.[subject.id];

                slmsForSubject.forEach(slm => {
                    const tpCount = objectivesForSubject.filter(o => o.slmId === slm.id).length;
                    const slmData = detailedGrade?.slm?.find(s => s.id === slm.id);
                    for (let i = 0; i < tpCount; i++) row[`${slm.id}_TP${i + 1}`] = slmData?.scores?.[i] ?? '';
                });
                row["STS"] = detailedGrade?.sts ?? '';
                row["SAS"] = detailedGrade?.sas ?? '';
                
                nilaiSheetData.push(header.map(h => row[h]));
            });
            
            const wsNilai = XLSX.utils.aoa_to_sheet(nilaiSheetData);
            XLSX.utils.book_append_sheet(wb, wsNilai, `Nilai_${subject.id}`);
        });

        // Other Data Sheets
        const attendanceData = attendance.map(a => ({ studentId: a.studentId, Sakit: a.sakit, Izin: a.izin, Alpa: a.alpa }));
        const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(wb, wsAttendance, "Absensi");

        const studentExtraData = studentExtracurriculars.flatMap(se => {
            return (se.assignedActivities || []).map((activityId, index) => {
                if (!activityId) return null;
                return { "ID Siswa": se.studentId, "Nama Siswa": students.find(s => s.id === se.studentId)?.namaLengkap || '', "Urutan Ekstra": index + 1, "ID Ekstrakurikuler": activityId, "Deskripsi": se.descriptions?.[activityId] || '' };
            }).filter(Boolean);
        });
        const wsStudentExtra = XLSX.utils.json_to_sheet(studentExtraData);
        XLSX.utils.book_append_sheet(wb, wsStudentExtra, "Data Ekstra");

        const notesData = Object.entries(notes).map(([studentId, note]) => ({ "ID Siswa": studentId, "Catatan Wali Kelas": note }));
        const wsNotes = XLSX.utils.json_to_sheet(notesData);
        XLSX.utils.book_append_sheet(wb, wsNotes, "Catatan Wali Kelas");

        const cocurricularSheetData = [];
        const cocurricHeader = ["ID Siswa", "Nama Siswa", ...COCURRICULAR_DIMENSIONS.map(d => d.id)];
        cocurricularSheetData.push(cocurricHeader);
        students.forEach(student => {
            const row = { "ID Siswa": student.id, "Nama Siswa": student.namaLengkap };
            const studentCoData = cocurricularData[student.id];
            COCURRICULAR_DIMENSIONS.forEach(dim => {
                row[dim.id] = studentCoData?.dimensionRatings?.[dim.id] || '';
            });
            cocurricularSheetData.push(cocurricHeader.map(h => row[h]));
        });
        const wsCocurricular = XLSX.utils.aoa_to_sheet(cocurricularSheetData);
        XLSX.utils.book_append_sheet(wb, wsCocurricular, "Data Kokurikuler");

        const formativeJournalData = [];
        const journalHeader = ["ID Siswa", "Nama Siswa", "ID Catatan", "Tanggal", "Topik", "Jenis", "Catatan"];
        formativeJournalData.push(journalHeader);
        Object.entries(formativeJournal).forEach(([studentId, notesArray]) => {
            const studentName = students.find(s => s.id === studentId)?.namaLengkap || '';
            notesArray.forEach(note => {
                formativeJournalData.push([studentId, studentName, note.id, note.date, note.topic, note.type, note.note]);
            });
        });
        const wsFormativeJournal = XLSX.utils.aoa_to_sheet(formativeJournalData);
        XLSX.utils.book_append_sheet(wb, wsFormativeJournal, "Jurnal Formatif");

        const imageAssetsData = [];
        const imageKeys = ['logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background'];
        const CHUNK_SIZE = 32000;

        imageKeys.forEach(key => {
            const base64String = settings[key];
            if (base64String && typeof base64String === 'string') {
                if (base64String.length > CHUNK_SIZE) {
                    for (let i = 0; i < base64String.length; i += CHUNK_SIZE) {
                        const chunk = base64String.substring(i, i + CHUNK_SIZE);
                        const partKey = `${key}_part_${Math.floor(i / CHUNK_SIZE) + 1}`;
                        imageAssetsData.push([partKey, chunk]);
                    }
                } else {
                    imageAssetsData.push([key, base64String]);
                }
            }
        });

        if (imageAssetsData.length > 0) {
            imageAssetsData.unshift(["Kunci Aset", "Data Base64"]);
            const wsImageAssets = XLSX.utils.aoa_to_sheet(imageAssetsData);
            XLSX.utils.book_append_sheet(wb, wsImageAssets, "Aset Gambar");
        }

        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        return new Blob([wbout], { type: 'application/octet-stream' });
    } catch (error) {
        console.error("Gagal mengekspor data:", error);
        showToast(`Gagal mengekspor data: ${error.message}`, 'error');
        return null;
    }
  }, [settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, formativeJournal, showToast]);

    // Function to parse Excel data *without* setting state immediately.
    // Returns the data object or throws an error.
    const parseExcelBlob = useCallback(async (blob) => {
        if (typeof XLSX === 'undefined') {
            throw new Error('Pustaka impor (SheetJS) tidak termuat.');
        }
        
        const data = await blob.arrayBuffer();
        const workbook = XLSX.read(data);

        // Prepare return object
        const parsedData = {
            settings: { ...initialSettings },
            students: [],
            subjects: defaultSubjects,
            extracurriculars: presets?.extracurriculars || [],
            attendance: initialAttendance,
            notes: initialNotes,
            cocurricularData: initialCocurricularData,
            studentExtracurriculars: initialStudentExtracurriculars,
            learningObjectives: {},
            grades: initialGrades,
            formativeJournal: initialFormativeJournal
        };

        let newSettings = { ...initialSettings };
        let newStudents = [];
        let newSubjects = defaultSubjects; // Use defaults initially
        let newExtracurriculars = presets?.extracurriculars || []; // Use defaults initially
        let newAttendance = [];
        let newNotes = {};
        let newCocurricularData = {};
        let newStudentExtracurriculars = [];
        let newLearningObjectives = {};
        let newGrades = [];
        let newFormativeJournal = {};
        const subjectStructureMap = new Map();

        // 1. Parse Pengaturan
        const wsPengaturan = workbook.Sheets["Pengaturan"];
        if (wsPengaturan) {
            const pengaturanData = XLSX.utils.sheet_to_json(wsPengaturan, { header: 1 });
            let isCalcSection = false;
            for (const row of pengaturanData) {
                if (row[0] === 'Pengaturan Cara Pengolahan Nilai Rapor') { isCalcSection = true; continue; }
                if (!isCalcSection) {
                    if (row[0] in newSettings) newSettings[row[0]] = row[1];
                    if (row[0] === 'A') newSettings.predikats.a = String(row[1]);
                    if (row[0] === 'B') newSettings.predikats.b = String(row[1]);
                    if (row[0] === 'C') newSettings.predikats.c = String(row[1]);
                    if (row[0] === 'D') newSettings.predikats.d = String(row[1]);
                } else {
                    if (row[0] === 'ID Mata Pelajaran') continue;
                    const [subjectId, method, weightsString] = row;
                    if (subjectId) {
                        let weights = {};
                        try {
                            if(weightsString) weights = JSON.parse(weightsString);
                        } catch(e) { console.error(`Gagal mem-parsing bobot JSON untuk ${subjectId}:`, e)}
                        newSettings.gradeCalculation[subjectId] = { method: method || 'rata-rata', weights: weights };
                    }
                }
            }
        }

        // 2 & 3. Parse Mata Pelajaran & Ekstrakurikuler
        const wsSubjects = workbook.Sheets["Mata Pelajaran"];
        if (wsSubjects) {
            // If the sheet exists, overwrite the default subjects
            newSubjects = XLSX.utils.sheet_to_json(wsSubjects).map(s => {
                const status = (s["Status Aktif"] || '').toString().trim().toLowerCase();
                // More robust active status check
                const isActive = ['aktif', 'active', 'true', 'ya', 'yes'].includes(status);
                
                return {
                    id: s["ID Internal (Jangan Diubah)"],
                    fullName: s["Nama Lengkap"],
                    label: s["Singkatan"],
                    active: isActive
                }
            });
        }
        
        const wsExtra = workbook.Sheets["Ekstrakurikuler"];
        if (wsExtra) {
            newExtracurriculars = XLSX.utils.sheet_to_json(wsExtra).map(e => {
                const status = (e["Status Aktif"] || '').toString().trim().toLowerCase();
                const isActive = ['aktif', 'active', 'true', 'ya', 'yes'].includes(status);
                return {
                    id: e["ID Unik (Jangan Diubah)"],
                    name: e["Nama Ekstrakurikuler"],
                    active: isActive
                }
            });
        }

        // 4. Parse Daftar Siswa and ensure unique IDs
        const wsStudents = workbook.Sheets["Daftar Siswa"];
        if (wsStudents) {
            let importCounter = 0;
            // STRICT FILTERING: Only accept students with a name
            newStudents = XLSX.utils.sheet_to_json(wsStudents).map(s => {
                importCounter++;
                return {
                    id: s['ID Siswa (Otomatis)'] || `imported_student_${Date.now()}_${importCounter}`,
                    namaLengkap: s['Nama Lengkap'], namaPanggilan: s['Nama Panggilan'], nis: s['NIS'], nisn: s['NISN'], 
                    ttl: s['Tempat, Tanggal Lahir'], jenisKelamin: s['Jenis Kelamin'], 
                    agama: s['Agama'], asalTk: s['Asal TK'], alamatSiswa: s['Alamat Siswa'], 
                    diterimaDiKelas: s['Diterima di Kelas'], diterimaTanggal: s['Diterima Tanggal'], 
                    namaAyah: s['Nama Ayah'], namaIbu: s['Nama Ibu'], pekerjaanAyah: s['Pekerjaan Ayah'], 
                    pekerjaanIbu: s['Pekerjaan Ibu'], alamatOrangTua: s['Alamat Orang Tua'], 
                    teleponOrangTua: s['Telepon Orang Tua'], namaWali: s['Nama Wali'], pekerjaanWali: s['Pekerjaan Wali'], 
                    alamatWali: s['Alamat Wali'], teleponWali: s['Telepon Wali'],
                };
            }).filter(s => s.namaLengkap && s.namaLengkap.trim() !== ''); // REMOVE GHOST ROWS
        }
        
        // 5. Parse Tujuan Pembelajaran
        const gradeKey = `Kelas ${getGradeNumber(newSettings.nama_kelas)}`;
        newLearningObjectives[gradeKey] = {};
        const wsTP = workbook.Sheets["Tujuan Pembelajaran"];
        if (wsTP) {
            const tpData = XLSX.utils.sheet_to_json(wsTP);
            tpData.forEach(row => {
                const subjectId = row["ID Mata Pelajaran"], subjectFullName = row["Nama Mata Pelajaran"], slmId = row["ID SLM"], slmName = row["Nama SLM"], tpText = row["Deskripsi Tujuan Pembelajaran (TP)"];
                if (!newLearningObjectives[gradeKey][subjectFullName]) newLearningObjectives[gradeKey][subjectFullName] = [];
                newLearningObjectives[gradeKey][subjectFullName].push({ slmId: slmId, text: tpText });
                
                if (!subjectStructureMap.has(subjectId)) subjectStructureMap.set(subjectId, { slms: new Map() });
                const slmsMap = subjectStructureMap.get(subjectId).slms;
                if (!slmsMap.has(slmId)) slmsMap.set(slmId, { id: slmId, name: slmName, tpCount: 0 });
                slmsMap.get(slmId).tpCount++;
            });
        }
        
        // 6. Initialize Grades structure
        newGrades = newStudents.map(student => {
            const gradeEntry = { studentId: student.id, detailedGrades: {}, finalGrades: {} };
            newSubjects.filter(s => s.active).forEach(subject => {
                const structure = subjectStructureMap.get(subject.id);
                const slms = structure ? Array.from(structure.slms.values()).map(slm => ({ id: slm.id, name: slm.name, scores: Array(slm.tpCount).fill(null) })) : [];
                gradeEntry.detailedGrades[subject.id] = { slm: slms, sts: null, sas: null };
            });
            return gradeEntry;
        });
        const gradesMap = new Map(newGrades.map(g => [g.studentId, g]));

        // 7. Parse Nilai sheets
        workbook.SheetNames.forEach(sheetName => {
            if (sheetName.startsWith("Nilai_")) {
                const sheetNameParts = sheetName.split('_');
                // Handle cases where ID might have underscores, though ideally it shouldn't. 
                // Currently strictly takes part [1]. If ID has _, logic might fail. 
                // Assuming standard "Nilai_ID" format.
                const subjectId = sheetNameParts.length > 1 ? sheetName.substring(6) : ''; // "Nilai_".length = 6
                
                const wsNilai = workbook.Sheets[sheetName];
                const nilaiData = XLSX.utils.sheet_to_json(wsNilai);

                nilaiData.forEach(row => {
                    const studentId = row["ID Siswa"];
                    const studentGrade = gradesMap.get(studentId);
                    
                    // If student grade entry exists but subject entry doesn't (e.g. subject marked inactive in 'Mata Pelajaran' but sheet exists)
                    // We should probably initialize it to capture the data.
                    if (studentGrade && !studentGrade.detailedGrades[subjectId]) {
                         studentGrade.detailedGrades[subjectId] = { slm: [], sts: null, sas: null };
                    }

                    if (!studentGrade || !studentGrade.detailedGrades[subjectId]) return;
                    
                    const detailedGrade = studentGrade.detailedGrades[subjectId];
                    Object.keys(row).forEach(header => {
                        if (header.includes("_TP")) {
                            // Split carefully to handle if SLM ID contains _TP (unlikely but safe)
                            const parts = header.split('_TP');
                            const tpPart = parts.pop(); // The last part is the TP number
                            const slmId = parts.join('_TP'); // Rejoin the rest as ID
                            
                            const tpIndex = parseInt(tpPart, 10) - 1;
                            let slmEntry = detailedGrade.slm.find(s => s.id === slmId);
                            
                            // Important: If SLM entry doesn't exist (because it wasn't in "Tujuan Pembelajaran" sheet), create it dynamically.
                            if (!slmEntry) {
                                slmEntry = { id: slmId, name: slmId, scores: [] };
                                detailedGrade.slm.push(slmEntry);
                            }
                            
                            // Ensure scores array is big enough
                            while (slmEntry.scores.length <= tpIndex) {
                                slmEntry.scores.push(null);
                            }

                            if (tpIndex >= 0) slmEntry.scores[tpIndex] = row[header] === '' ? null : Number(row[header]);
                        } else if (header === 'STS') {
                            detailedGrade.sts = row[header] === '' ? null : Number(row[header]);
                        } else if (header === 'SAS') {
                            detailedGrade.sas = row[header] === '' ? null : Number(row[header]);
                        }
                    });
                });
            }
        });
        newGrades = Array.from(gradesMap.values());
        
        // 8. Re-calculate final grades after all data is parsed.
        const { a, b, c, d } = newSettings.predikats;
        const tempQualitativeMap = {
            SB: Math.round((parseInt(a, 10) + 100) / 2),
            BSH: Math.round((parseInt(b, 10) + (parseInt(a, 10) - 1)) / 2),
            MB: Math.round((parseInt(c, 10) + (parseInt(b, 10) - 1)) / 2),
            BB: Math.round((parseInt(d, 10) + (parseInt(c, 10) - 1)) / 2),
        };
        const settingsForCalc = { ...newSettings, qualitativeGradingMap: tempQualitativeMap };

        newGrades = newGrades.map(studentGrade => {
            const newFinalGrades = {};
            for (const subjectId in studentGrade.detailedGrades) {
                const detailed = studentGrade.detailedGrades[subjectId];
                const config = newSettings.gradeCalculation[subjectId] || { method: 'rata-rata' };
                const finalScore = calculateFinalGrade(detailed, config, settingsForCalc);
                newFinalGrades[subjectId] = finalScore;
            }
            return { ...studentGrade, finalGrades: newFinalGrades };
        });

        // 9. Parse other sheets
        const wsAttendance = workbook.Sheets["Absensi"];
        if (wsAttendance) newAttendance = XLSX.utils.sheet_to_json(wsAttendance).map(a => ({ studentId: a.studentId, Sakit: a.Sakit, Izin: a.Izin, Alpa: a.Alpa }));
        const wsNotes = workbook.Sheets["Catatan Wali Kelas"];
        if (wsNotes) newNotes = XLSX.utils.sheet_to_json(wsNotes).reduce((acc, n) => { acc[n["ID Siswa"]] = n["Catatan Wali Kelas"]; return acc; }, {});
        
        const wsCocurricular = workbook.Sheets["Data Kokurikuler"];
        if (wsCocurricular) {
            const coDataJSON = XLSX.utils.sheet_to_json(wsCocurricular);
            coDataJSON.forEach(row => {
                const studentId = row["ID Siswa"];
                if (studentId) {
                    const dimensionRatings = {};
                    COCURRICULAR_DIMENSIONS.forEach(dim => {
                        if (row[dim.id]) {
                            dimensionRatings[dim.id] = row[dim.id];
                        }
                    });
                    newCocurricularData[studentId] = { dimensionRatings };
                }
            });
        }

        const wsStudentExtra = workbook.Sheets["Data Ekstra"];
        if (wsStudentExtra) {
            const tempStudentExtra = {};
            XLSX.utils.sheet_to_json(wsStudentExtra).forEach(row => {
                const sid = row["ID Siswa"];
                if (!tempStudentExtra[sid]) tempStudentExtra[sid] = { studentId: sid, assignedActivities: [], descriptions: {} };
                const activityId = row["ID Ekstrakurikuler"];
                if (activityId) { tempStudentExtra[sid].assignedActivities.push(activityId); tempStudentExtra[sid].descriptions[activityId] = row["Deskripsi"]; }
            });
            newStudentExtracurriculars = Object.values(tempStudentExtra);
        }

        const wsFormativeJournal = workbook.Sheets["Jurnal Formatif"];
        if (wsFormativeJournal) {
            const journalData = XLSX.utils.sheet_to_json(wsFormativeJournal);
            journalData.forEach(row => {
                const studentId = row["ID Siswa"];
                if (studentId) {
                    if (!newFormativeJournal[studentId]) {
                        newFormativeJournal[studentId] = [];
                    }
                    newFormativeJournal[studentId].push({
                        id: row["ID Catatan"],
                        date: row["Tanggal"],
                        topic: row["Topik"],
                        type: row["Jenis"],
                        note: row["Catatan"],
                    });
                }
            });
        }

        // 10. Parse Aset Gambar (dengan rekombinasi chunk)
        const wsImageAssets = workbook.Sheets["Aset Gambar"];
        if (wsImageAssets) {
            const imageAssets = XLSX.utils.sheet_to_json(wsImageAssets, { header: 1 });
            const reconstructedAssets = {};
            const partRegex = /^(.*)_part_(\d+)$/;

            imageAssets.slice(1).forEach(([key, data]) => {
                if (!key || !data) return;
                const match = key.match(partRegex);
                if (match) {
                    const baseKey = match[1];
                    const partNumber = parseInt(match[2], 10);
                    if (!reconstructedAssets[baseKey]) {
                        reconstructedAssets[baseKey] = [];
                    }
                    reconstructedAssets[baseKey][partNumber - 1] = data;
                } else {
                    if (key in newSettings) {
                         newSettings[key] = data;
                    }
                }
            });

            for (const baseKey in reconstructedAssets) {
                if (reconstructedAssets[baseKey] && baseKey in newSettings) {
                    newSettings[baseKey] = reconstructedAssets[baseKey].join('');
                }
            }
        }

        return {
            settings: newSettings,
            subjects: newSubjects,
            extracurriculars: newExtracurriculars,
            students: newStudents,
            learningObjectives: newLearningObjectives,
            grades: newGrades,
            attendance: newAttendance,
            notes: newNotes,
            cocurricularData: newCocurricularData,
            studentExtracurriculars: newStudentExtracurriculars,
            formativeJournal: newFormativeJournal
        };
    }, [presets]);

    // ... (rest of App component)
    const importFromExcelBlob = useCallback(async (blob) => {
        setIsLoading(true);
        try {
            const newData = await parseExcelBlob(blob);
            
            // Apply data to state
            setSettings(newData.settings);
            setSubjects(newData.subjects);
            setExtracurriculars(newData.extracurriculars);
            setStudents(newData.students);
            setLearningObjectives(newData.learningObjectives);
            setGrades(newData.grades);
            setAttendance(newData.attendance);
            setNotes(newData.notes);
            setCocurricularData(newData.cocurricularData);
            setStudentExtracurriculars(newData.studentExtracurriculars);
            setFormativeJournal(newData.formativeJournal);
            
            showToast('Data berhasil diimpor dari file!', 'success');
        } catch (error) {
            console.error("Gagal mengimpor data:", error);
            showToast(`Format file tidak valid atau rusak: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, parseExcelBlob]);

    const handleExportAll = useCallback(() => {
        const blob = exportToExcelBlob();
        if (!blob) { showToast('Gagal membuat file ekspor.', 'error'); return; }
        const fileName = getDynamicRKTFileName(settings);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast('File template berhasil diunduh!', 'success');
    }, [exportToExcelBlob, settings, showToast]);

    const handleImportAll = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            importFromExcelBlob(file);
        };
        input.click();
    }, [importFromExcelBlob]);

    const autoSaveToDrive = useCallback(async () => {
        if (!isDirty || !isSignedIn || !googleToken) { setSyncStatus(isDirty ? 'unsaved' : 'idle'); return; }
        if (!isOnline) {
            setSyncStatus('offline_pending');
            const blob = exportToExcelBlob();
            const fileName = getDynamicRKTFileName(settings);
            
            if (blob && fileName) {
                await db.put('pendingSyncs', { id: 'unsynced_data', blob, fileName, fileId: googleDriveFileId });
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    navigator.serviceWorker.ready.then(sw => { sw.sync.register('sync-rkt-drive').catch(err => console.error("Background sync registration failed:", err)); });
                }
            }
            return; 
        }

        setSyncStatus('saving');
        const currentDynamicFileName = getDynamicRKTFileName(settings);

        try {
            let fileToOperateId = googleDriveFileId;
            
            const foundFile = await findRKTFileId(currentDynamicFileName, settings);
            
            if (foundFile) {
                fileToOperateId = foundFile.id;
                if (googleDriveFileId !== foundFile.id) {
                    console.log(`Beralih untuk memperbarui file yang ada dengan ID: ${foundFile.id}`);
                    setGoogleDriveFileId(foundFile.id);
                }
            } else {
                fileToOperateId = null; 
            }
    
            const blob = exportToExcelBlob();
            if (!blob) throw new Error("Gagal membuat data Excel untuk diunggah.");
    
            if (fileToOperateId) {
                await uploadFile(fileToOperateId, currentDynamicFileName, blob, RKT_MIME_TYPE);
            } else {
                const newFile = await createRKTFile(currentDynamicFileName, blob, RKT_MIME_TYPE);
                setGoogleDriveFileId(newFile.id);
            }
    
            const newTimestamp = new Date().toISOString();
            setLastSyncTimestamp(newTimestamp);
            setIsDirty(false);
            setSyncStatus('saved');
            setTimeout(() => setSyncStatus('idle'), 3000);
    
        } catch (error) {
            console.error("Gagal sinkronisasi online dengan Google Drive:", error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus(isDirty ? 'unsaved' : 'idle'), 5000);
            if (error.message.includes("File not found") || (error.result?.error?.code === 404)) {
                setGoogleDriveFileId(null);
            }
        }
    }, [isDirty, isSignedIn, isOnline, googleToken, googleDriveFileId, settings, exportToExcelBlob, findRKTFileId, uploadFile, createRKTFile]);
    
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(appData.settings));
        localStorage.setItem('appStudents', JSON.stringify(appData.students));
        localStorage.setItem('appGrades', JSON.stringify(appData.grades));
        localStorage.setItem('appNotes', JSON.stringify(appData.notes));
        localStorage.setItem('appCocurricularData', JSON.stringify(appData.cocurricularData));
        localStorage.setItem('appAttendance', JSON.stringify(appData.attendance));
        localStorage.setItem('appExtracurriculars', JSON.stringify(appData.extracurriculars));
        localStorage.setItem('appStudentExtracurriculars', JSON.stringify(appData.studentExtracurriculars));
        localStorage.setItem('appSubjects', JSON.stringify(appData.subjects));
        if (Object.keys(appData.learningObjectives).length > 0) localStorage.setItem('appLearningObjectives', JSON.stringify(appData.learningObjectives));
        localStorage.setItem('appFormativeJournal', JSON.stringify(appData.formativeJournal));

        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (isSignedIn) {
            setIsDirty(true);
            setSyncStatus('unsaved');
        }
    }, [appData, isSignedIn]);

    useEffect(() => {
        if (isSignedIn && isDirty) {
            console.log("Navigasi halaman terdeteksi, memulai penyimpanan otomatis...");
            autoSaveToDrive();
        }
    }, [activePage, isSignedIn, isDirty, autoSaveToDrive]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isDirty && isSignedIn) {
                console.log("Aplikasi disembunyikan, menyimpan perubahan...");
                autoSaveToDrive();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isDirty, isSignedIn, autoSaveToDrive]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty && isSignedIn) {
                e.preventDefault();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isSignedIn]);

    const handleSettingsChange = useCallback((e) => {
        const { name, value, type, files } = e.target;
    
        if (type === 'file') {
            if (files && files[0]) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newValue = reader.result;
                    setSettings(prev => {
                        if (name === 'nama_kelas') {
                            const oldGradeNumber = getGradeNumber(prev.nama_kelas);
                            const newGradeNumber = getGradeNumber(newValue);
                            if (oldGradeNumber !== null && newGradeNumber !== null && oldGradeNumber !== newGradeNumber) {
                                setLearningObjectives({});
                                setGrades(initialGrades);
                                showToast('Data nilai & TP direset karena jenjang kelas berubah.', 'info');
                            }
                        }
                        return { ...prev, [name]: newValue };
                    });
                };
                reader.readAsDataURL(files[0]);
            }
        } else if (type === 'file_processed') {
            setSettings(prev => ({ ...prev, [name]: value }));
        } else {
            setSettings(prev => {
                if (name.includes('.')) {
                    const [parent, key] = name.split('.');
                    return {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [key]: value
                        }
                    };
                }

                if (name === 'nama_kelas') {
                    const oldGradeNumber = getGradeNumber(prev.nama_kelas);
                    const newGradeNumber = getGradeNumber(value);
                    if (oldGradeNumber !== null && newGradeNumber !== null && oldGradeNumber !== newGradeNumber) {
                        setLearningObjectives({});
                        setGrades(initialGrades);
                        showToast('Data nilai & TP direset karena jenjang kelas berubah.', 'info');
                    }
                }
                return { ...prev, [name]: value };
            });
        }
    }, [showToast]);

    const saveSettings = useCallback(() => console.log("Settings saved to state."), []);
    const onUpdateSubjects = useCallback((newSubjects) => setSubjects(newSubjects), []);
    const onUpdateExtracurriculars = useCallback((newExtracurriculars) => setExtracurriculars(newExtracurriculars), []);
    const handleSaveStudent = useCallback((studentData) => {
        if (studentData.id) {
            setStudents(prev => prev.map(s => s.id === studentData.id ? studentData : s));
            showToast('Data siswa berhasil diperbarui.', 'success');
        } else {
            const newStudent = { ...studentData, id: `student_${Date.now()}` };
            setStudents(prev => [...prev, newStudent]);
            setGrades(prev => [...prev, { studentId: newStudent.id, detailedGrades: {}, finalGrades: {} }]);
            setAttendance(prev => [...prev, { studentId: newStudent.id, sakit: null, izin: null, alpa: null }]);
            setFormativeJournal(prev => ({ ...prev, [newStudent.id]: [] }));
            showToast('Siswa baru berhasil ditambahkan.', 'success');
        }
    }, [showToast]);
    const handleBulkSaveStudents = useCallback((newStudents) => setStudents(newStudents), []);
    const handleDeleteStudent = useCallback((studentId) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setGrades(prev => prev.filter(g => g.studentId !== studentId));
        setNotes(prev => { const newNotes = {...prev}; delete newNotes[studentId]; return newNotes; });
        setCocurricularData(prev => { const newData = {...prev}; delete newData[studentId]; return newData; });
        setAttendance(prev => prev.filter(a => a.studentId !== studentId));
        setStudentExtracurriculars(prev => prev.filter(se => se.studentId !== studentId));
        setFormativeJournal(prev => { const newJournal = {...prev}; delete newJournal[studentId]; return newJournal; });
    }, []);
    const handleUpdateAttendance = useCallback((studentId, type, value) => {
        setAttendance(prev => {
            const index = prev.findIndex(a => a.studentId === studentId);
            const numValue = value === '' ? null : parseInt(value, 10);
            if (index > -1) {
                const newAttendance = [...prev];
                newAttendance[index] = { ...newAttendance[index], [type]: isNaN(numValue) ? null : numValue };
                return newAttendance;
            }
            return [...prev, { studentId, sakit: null, izin: null, alpa: null, [type]: isNaN(numValue) ? null : numValue }];
        });
    }, []);
    const handleBulkUpdateAttendance = useCallback((newAttendance) => setAttendance(newAttendance), []);
    const handleUpdateNote = useCallback((studentId, note) => setNotes(prev => ({ ...prev, [studentId]: note })), []);
    const handleUpdateCocurricularData = useCallback((studentId, dimensionId, rating) => {
      setCocurricularData(prev => {
        const studentData = prev[studentId] || { dimensionRatings: {} };
        const newRatings = { ...studentData.dimensionRatings, [dimensionId]: rating };
        return { ...prev, [studentId]: { dimensionRatings: newRatings } };
      });
    }, []);
    const handleUpdateStudentExtracurriculars = useCallback((newStudentExtracurriculars) => setStudentExtracurriculars(newStudentExtracurriculars), []);
    const handleUpdatePredikats = useCallback((newPredikats) => setSettings(prev => ({ ...prev, predikats: newPredikats })), []);
    
    const handleUpdateGradeCalculation = useCallback((subjectId, newConfig) => {
        setSettings(prevSettings => {
            const updatedSettings = {
                ...prevSettings,
                gradeCalculation: {
                    ...prevSettings.gradeCalculation,
                    [subjectId]: newConfig,
                },
            };

            setGrades(prevGrades => {
                return prevGrades.map(studentGrade => {
                    const detailedGrade = studentGrade.detailedGrades[subjectId];
                    if (detailedGrade) {
                        const newFinalScore = calculateFinalGrade(detailedGrade, newConfig, updatedSettings);
                        const newFinalGrades = {
                            ...studentGrade.finalGrades,
                            [subjectId]: newFinalScore,
                        };
                        return { ...studentGrade, finalGrades: newFinalGrades };
                    }
                    return studentGrade;
                });
            });

            return updatedSettings;
        });
    }, []);

    const handleBulkUpdateGrades = useCallback((updates) => {
        setGrades(prevGrades => {
            const newGrades = [...prevGrades];
            const gradesMap = new Map(newGrades.map(g => [g.studentId, g]));

            updates.forEach(update => {
                const { studentId, subjectId, newDetailedGrade } = update;
                let studentGrade = gradesMap.get(studentId);
                if (!studentGrade) {
                    studentGrade = { studentId, detailedGrades: {}, finalGrades: {} };
                    newGrades.push(studentGrade);
                    gradesMap.set(studentId, studentGrade);
                }
                
                studentGrade.detailedGrades = { ...studentGrade.detailedGrades, [subjectId]: newDetailedGrade };
                
                const config = settings.gradeCalculation[subjectId] || { method: 'rata-rata' };
                const finalScore = calculateFinalGrade(newDetailedGrade, config, settings);
                studentGrade.finalGrades = { ...studentGrade.finalGrades, [subjectId]: finalScore };
            });
            
            return newGrades;
        });
    }, [settings]);

    const handleBulkAddSlm = useCallback((subjectId, slmTemplate) => {
        setGrades(prevGrades => {
            return prevGrades.map(studentGrade => {
                const detailedGradesForSubject = studentGrade.detailedGrades[subjectId] || { slm: [], sts: null, sas: null };
                const slmExists = detailedGradesForSubject.slm.some(s => s.id === slmTemplate.id);
    
                if (!slmExists) {
                    const newSlms = [...detailedGradesForSubject.slm, slmTemplate];
                    const newDetailedGradesForSubject = { ...detailedGradesForSubject, slm: newSlms };
                    
                    return {
                        ...studentGrade,
                        detailedGrades: {
                            ...studentGrade.detailedGrades,
                            [subjectId]: newDetailedGradesForSubject
                        }
                    };
                }
                
                return studentGrade;
            });
        });
        showToast('Lingkup Materi baru ditambahkan.', 'success');
    }, [showToast]);

    const handleUpdateFormativeJournal = useCallback((studentId, noteData) => {
        setFormativeJournal(prev => {
            const studentNotes = prev[studentId] ? [...prev[studentId]] : [];
            const existingNoteIndex = studentNotes.findIndex(note => note.id === noteData.id);
            if (existingNoteIndex > -1) {
                studentNotes[existingNoteIndex] = noteData;
            } else {
                studentNotes.unshift({ ...noteData, id: `note_${Date.now()}` }); // Add to the top
            }
            return { ...prev, [studentId]: studentNotes };
        });
    }, []);
    
    const handleDeleteFormativeNote = useCallback((studentId, noteId) => {
        setFormativeJournal(prev => {
            const studentNotes = prev[studentId] ? prev[studentId].filter(note => note.id !== noteId) : [];
            return { ...prev, [studentId]: studentNotes };
        });
    }, []);

    
    const handleUpdateLearningObjectives = useCallback((newObjectives) => setLearningObjectives(newObjectives), []);
    const handleUpdateKopLayout = useCallback((newLayout) => setSettings(prev => ({ ...prev, kop_layout: newLayout })), []);
    const handleUpdatePiagamLayout = useCallback((newLayout) => setSettings(prev => ({ ...prev, piagam_layout: newLayout })), []);
    
    const handleDriveFileSelection = async (fileId) => {
        if (!fileId) { setIsDriveModalOpen(false); setDriveConflictData(null); return; }
        
        setIsLoading(true);
        showToast("Mengunduh data untuk verifikasi...", 'info');
        try {
            // 1. Process Remote File
            const blob = await downloadFile(fileId);
            const remoteData = await parseExcelBlob(blob);
            const remoteScore = calculateDataCompleteness(remoteData);
            
            // 2. Process Local Data (Apple-to-Apple Comparison)
            // Instead of calculating from state directly, we export to Excel and parse it back.
            // This ensures both datasets go through the exact same parsing logic/sanitization.
            const localBlob = exportToExcelBlob();
            const localDataParsed = await parseExcelBlob(localBlob);
            const localScore = calculateDataCompleteness(localDataParsed);
            
            const selectedFile = driveFiles.find(f => f.id === fileId);
            const remoteTimestamp = selectedFile?.modifiedTime || new Date().toISOString();
            
            // Set conflict data for modal to display
            setDriveConflictData({
                fileId,
                local: {
                    score: localScore,
                    timestamp: lastSyncTimestamp || new Date().toISOString(),
                },
                remote: {
                    score: remoteScore,
                    timestamp: remoteTimestamp,
                    blob: blob, // Keep blob ready to load
                    data: remoteData // Keep parsed data
                }
            });
            // Don't close modal yet, it will switch views based on driveConflictData prop
            
        } catch (error) {
            console.error("Gagal memproses file Drive:", error);
            showToast(`Gagal: ${error.message}`, 'error');
            setIsDriveModalOpen(false);
        } finally { setIsLoading(false); }
    };
    
    const handleConfirmSyncAction = async (action, payload) => {
        setIsLoading(true);
        try {
            if (action === 'overwrite_local') {
                // User chose to download Drive data
                const blob = payload;
                await importFromExcelBlob(blob);
                setGoogleDriveFileId(driveConflictData.fileId);
                setLastSyncTimestamp(driveConflictData.remote.timestamp);
                setDriveConflictData(null);
                setIsDriveModalOpen(false);
                showToast("Data perangkat berhasil diperbarui dari Drive.", 'success');
            } else if (action === 'overwrite_drive') {
                // User chose to upload Local data
                const fileId = payload;
                const blob = exportToExcelBlob();
                const fileName = getDynamicRKTFileName(settings);
                await uploadFile(fileId, fileName, blob, RKT_MIME_TYPE);
                
                // Update local sync state
                setGoogleDriveFileId(fileId);
                const newTime = new Date().toISOString();
                setLastSyncTimestamp(newTime);
                setIsDirty(false);
                setSyncStatus('saved');
                
                setDriveConflictData(null);
                setIsDriveModalOpen(false);
                showToast("Data Drive berhasil diperbarui dengan data perangkat.", 'success');
            }
        } catch (error) {
            console.error("Sync Action Failed:", error);
            showToast(`Gagal melakukan sinkronisasi: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDriveFileDelete = async (fileId, fileName) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus file "${fileName}" secara permanen dari Google Drive Anda? Tindakan ini tidak dapat diurungkan.`)) {
            return;
        }

        try {
            await deleteFile(fileId);
            showToast(`File "${fileName}" berhasil dihapus.`, 'success');
            // Refresh the file list
            setDriveFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
            // If the deleted file was the one currently synced, clear the ID
            if (googleDriveFileId === fileId) {
                setGoogleDriveFileId(null);
                setLastSyncTimestamp(null);
            }
        } catch (error) {
            console.error("Gagal menghapus file:", error);
            showToast(`Gagal menghapus file: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        const justGotProfile = !prevUserProfile.current && userProfile;
        prevUserProfile.current = userProfile;
        const handleSignInAction = async () => {
            if (!isSignedIn || !userProfile) return;
            showToast(`Selamat datang, ${userProfile.given_name || userProfile.email}!`, 'success');
            setIsCheckingDrive(true);
            setIsDriveModalOpen(true);
            try {
                const allFiles = await findAllRKTFiles();
                setDriveFiles(allFiles || []);
            } catch (error) {
                console.error("Error checking Drive on sign-in:", error);
                showToast(`Gagal memeriksa Google Drive: ${error.message}`, 'error');
                setDriveFiles([]);
                setIsDriveModalOpen(false);
            } finally { setIsCheckingDrive(false); }
        };

        if (isSignedIn && justGotProfile) handleSignInAction();
        else if (!isSignedIn) {
            setGoogleDriveFileId(null);
            setLastSyncTimestamp(null);
            setDriveFiles([]);
            setIsDirty(false);
            setSyncStatus('idle');
        }
    }, [isSignedIn, userProfile, showToast, findAllRKTFiles]);
    useEffect(() => {
        setGoogleDriveFileId(null);
        setLastSyncTimestamp(null);
    }, [settings.nama_sekolah, settings.nama_kelas, settings.tahun_ajaran, settings.semester]);

  const handleNavigateToNilai = useCallback((subjectId) => {
    setDataNilaiInitialTab(subjectId);
    setActivePage('DATA_NILAI');
  }, []);

  const renderPage = () => {
    if (isLoading) {
        return React.createElement('div', { className: "flex items-center justify-center h-full w-full" }, React.createElement('div', { className: 'flex flex-col items-center gap-4' }, React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }), React.createElement('p', { className: 'text-slate-600' }, 'Memuat data...')));
    }

    switch (activePage) {
      case 'DASHBOARD': return React.createElement(Dashboard, { setActivePage: setActivePage, onNavigateToNilai: handleNavigateToNilai, settings, students, grades, subjects, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars });
      case 'DATA_SISWA': return React.createElement(DataSiswaPage, { students, namaKelas: settings.nama_kelas, onSaveStudent: handleSaveStudent, onBulkSaveStudents: handleBulkSaveStudents, onDeleteStudent: handleDeleteStudent, showToast: showToast });
      case 'JURNAL_FORMATIF': return React.createElement(JurnalFormatifPage, { students, formativeJournal, subjects, grades, learningObjectives, settings, onUpdate: handleUpdateFormativeJournal, onDelete: handleDeleteFormativeNote, showToast });
      case 'DATA_NILAI': return React.createElement(DataNilaiPage, { students, grades, settings, onUpdateGradeCalculation: handleUpdateGradeCalculation, onBulkUpdateGrades: handleBulkUpdateGrades, onBulkAddSlm: handleBulkAddSlm, learningObjectives, onUpdateLearningObjectives: handleUpdateLearningObjectives, subjects, onUpdatePredikats: handleUpdatePredikats, showToast: showToast, initialTab: dataNilaiInitialTab });
      case 'DATA_KOKURIKULER': return React.createElement(DataKokurikulerPage, { students, settings, onSettingsChange: handleSettingsChange, cocurricularData, onUpdateCocurricularData: handleUpdateCocurricularData, showToast: showToast });
      case 'DATA_ABSENSI': return React.createElement(DataAbsensiPage, { students, attendance, onUpdateAttendance: handleUpdateAttendance, onBulkUpdateAttendance: handleBulkUpdateAttendance, showToast: showToast });
      case 'CATATAN_WALI_KELAS': return React.createElement(CatatanWaliKelasPage, { students, notes, onUpdateNote: handleUpdateNote, grades, subjects, settings, showToast: showToast });
      case 'DATA_EKSTRAKURIKULER': return React.createElement(DataEkstrakurikulerPage, { students, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars: handleUpdateStudentExtracurriculars, showToast: showToast });
      case 'PENGATURAN': return React.createElement(SettingsPage, { settings, onSettingsChange: handleSettingsChange, onSave: saveSettings, onUpdateKopLayout: handleUpdateKopLayout, subjects, onUpdateSubjects: onUpdateSubjects, extracurriculars, onUpdateExtracurriculars: onUpdateExtracurriculars, showToast: showToast });
      case 'PRINT_RAPOR': return React.createElement(PrintRaporPage, { students, settings, grades, attendance, notes, cocurricularData, subjects, learningObjectives, studentExtracurriculars, extracurriculars, showToast: showToast });
      case 'PRINT_PIAGAM': return React.createElement(PrintPiagamPage, { students, settings, grades, subjects, onUpdatePiagamLayout: handleUpdatePiagamLayout, showToast: showToast });
      case 'PRINT_LEGER': return React.createElement(PrintLegerPage, { students, settings, grades, subjects, showToast: showToast });
      default:
        const navItem = NAV_ITEMS.find(item => item.id === activePage);
        return React.createElement(PlaceholderPage, { title: navItem ? navItem.label : 'Halaman' });
    }
  };
  
  const pagesWithOwnScroll = ['DATA_NILAI', 'DATA_KOKURIKULER', 'DATA_EKSTRAKURIKULER', 'DATA_SISWA', 'DATA_ABSENSI', 'CATATAN_WALI_KELAS'];
  const shouldDisableMainScroll = !isMobile && pagesWithOwnScroll.includes(activePage);

  const mainLayoutClass = isMobile
    ? "bg-slate-100 font-sans" // Removed flex properties to use normal flow
    : "flex h-screen bg-slate-100 font-sans";
    
  return React.createElement(React.Fragment, null,
      isUpdateAvailable && React.createElement('div', { className: "fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 p-3 text-center z-[101] shadow-lg flex justify-center items-center gap-4 print-hidden" }, React.createElement('p', { className: 'font-semibold' }, 'Versi baru aplikasi tersedia.'), React.createElement('button', { onClick: updateAssets, className: 'px-4 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-bold' }, 'Perbarui Sekarang')),
      React.createElement(DriveDataSelectionModal, { 
          isOpen: isDriveModalOpen, 
          onClose: () => { setIsDriveModalOpen(false); setDriveConflictData(null); }, 
          onConfirm: handleDriveFileSelection, 
          files: driveFiles, 
          isLoading: isCheckingDrive, 
          onDelete: handleDriveFileDelete,
          conflictData: driveConflictData,
          onConfirmAction: handleConfirmSyncAction
      }),
      React.createElement('div', { className: mainLayoutClass },
        React.createElement(Navigation, { 
            activePage, 
            setActivePage, 
            onExport: handleExportAll, 
            onImport: handleImportAll, 
            isSignedIn, 
            userEmail: userProfile?.email, 
            isOnline, 
            lastSyncTimestamp, 
            syncStatus, 
            onSignInClick: signIn, 
            onSignOutClick: signOut,
            isMobile,
            isMobileMenuOpen,
            setIsMobileMenuOpen,
            currentPageName: NAV_ITEMS.find(item => item.id === activePage)?.label || 'Dashboard'
        }),
        React.createElement('main', { className: `${isMobile ? 'flex-1' : (shouldDisableMainScroll ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto')} p-4 sm:p-6 lg:p-8` }, renderPage())
      ),
      toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) })
    );
};

export default App;
