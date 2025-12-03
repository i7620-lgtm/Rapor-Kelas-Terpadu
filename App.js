import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
// ... (imports remain the same)
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

// ... (Constants and DB helper remain the same)
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
    // ... (No changes to calculateFinalGrade logic)
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
const calculateDataCompleteness = (data) => {
    const { students, grades, subjects, attendance, notes, studentExtracurriculars } = data;
    if (!students || students.length === 0) return 0;

    const totalStudents = students.length;
    const activeSubjects = (subjects || []).filter(s => s.active);
    
    // 1. Student Data (20% weight)
    const requiredStudentFields = ['nis', 'nisn', 'namaLengkap']; 
    let filledStudentData = 0;
    students.forEach(s => {
        if (requiredStudentFields.every(k => s[k] && s[k].toString().trim() !== '')) filledStudentData++;
    });
    const studentScore = (filledStudentData / totalStudents) * 20;

    // 2. Grades (40% weight)
    let totalGradeSlots = totalStudents * activeSubjects.length;
    let filledGradeSlots = 0;
    
    const hasData = (val) => val !== null && val !== '' && val !== undefined;

    if (grades && grades.length > 0 && totalGradeSlots > 0) {
        students.forEach(student => {
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
        students.forEach(s => {
            const att = attendance.find(a => a.studentId === s.id);
            if (att && (att.sakit != null || att.izin != null || att.alpa != null)) filledAttendance++;
        });
    }
    const attendanceScore = (filledAttendance / totalStudents) * 10;

    // 4. Notes (15% weight)
    let filledNotes = 0;
    if (notes) {
        students.forEach(s => {
            if (notes[s.id] && notes[s.id].trim() !== '') filledNotes++;
        });
    }
    const notesScore = (filledNotes / totalStudents) * 15;

    // 5. Extracurriculars (15% weight)
    let filledExtra = 0;
    if (studentExtracurriculars) {
        students.forEach(s => {
            const extra = studentExtracurriculars.find(se => se.studentId === s.id);
            if (extra && extra.assignedActivities && extra.assignedActivities.some(a => a !== null)) filledExtra++;
        });
    }
    const extraScore = (filledExtra / totalStudents) * 15;

    const total = Math.round(studentScore + gradesScore + attendanceScore + notesScore + extraScore);
    return isNaN(total) ? 0 : total;
};


const App = () => {
  // ... (Hooks and state remain the same)
  const { isUpdateAvailable, updateAssets } = useServiceWorker();
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
    // ... (No changes here, handled in existing file or truncated for brevity as request focuses on parsing logic)
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

    // ... (Rest of App.js functions: importFromExcelBlob, handleExportAll, autoSaveToDrive, effects, etc.)
    // Note: Truncated for brevity, assuming they remain unchanged except where noted in context.
    
    // ...
