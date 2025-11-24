import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { NAV_ITEMS, COCURRICULAR_DIMENSIONS } from './constants.js';
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
import Toast from './components/Toast.js';
import useServiceWorker from './hooks/useServiceWorker.js';
import useGoogleAuth from './hooks/useGoogleAuth.js';
import DriveDataSelectionModal from './components/DriveDataSelectionModal.js';
import useWindowDimensions from './hooks/useWindowDimensions.js';

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
  predikats: { a: '90', b: '80', c: '70' },
  gradeCalculation: {},
  kop_layout: [],
  piagam_layout: [],
};

const initialStudents = [];
const initialGrades = [];
const initialNotes = {};
const initialCocurricularData = {};
const initialAttendance = [];
const initialStudentExtracurriculars = [];

const getAppData = (settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives) => ({
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
});

const getDynamicRKTFileName = (currentSettings) => {
    const sanitize = (str) => String(str || '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    const schoolName = sanitize(currentSettings.nama_sekolah || 'Nama Sekolah');
    const className = sanitize(currentSettings.nama_kelas || 'Kelas');
    const academicYear = sanitize(currentSettings.tahun_ajaran || 'TA').replace(/\//g, '-');
    const semester = sanitize(currentSettings.semester || 'Semester');
    return `RKT_${schoolName}_${className}_${academicYear}_${semester}.xlsx`.toUpperCase();
};

const calculateFinalGrade = (detailed, config, kkm) => {
    if (!detailed) return null;
    let finalScore = null;

    if (config.method === 'rata-rata') {
        const slmAvgScores = (detailed.slm || []).map(slm => {
            const validScores = (slm.scores || []).filter(s => typeof s === 'number');
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const stsScore = detailed.sts;
        const sasScore = detailed.sas;
        const avgOfSlms = slmAvgScores.length > 0 ? slmAvgScores.reduce((a, b) => a + b, 0) / slmAvgScores.length : null;
        const components = [avgOfSlms, stsScore, sasScore].filter(s => typeof s === 'number');
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
                const weight = slmTpWeights[index] || 0;
                if (typeof score === 'number' && weight > 0) {
                    totalWeightedScore += score * (weight / 100);
                    totalWeightUsed += weight;
                }
            });
        });

        if (typeof detailed.sts === 'number' && stsWeight > 0) {
            totalWeightedScore += detailed.sts * (stsWeight / 100);
            totalWeightUsed += stsWeight;
        }
        if (typeof detailed.sas === 'number' && sasWeight > 0) {
            totalWeightedScore += detailed.sas * (sasWeight / 100);
            totalWeightUsed += sasWeight;
        }
        
        finalScore = totalWeightUsed > 0 ? totalWeightedScore : null;

    } else if (config.method === 'persentase' && !isNaN(kkm)) {
        const slmAvgScores = (detailed.slm || []).map(slm => {
            const validScores = (slm.scores || []).filter(s => typeof s === 'number');
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        const allSummatives = [...slmAvgScores];
        if(typeof detailed.sts === 'number') allSummatives.push(detailed.sts);
        if(typeof detailed.sas === 'number') allSummatives.push(detailed.sas);
        if (allSummatives.length > 0) finalScore = (allSummatives.filter(s => s >= kkm).length / allSummatives.length) * 100;
    }

    return finalScore === null ? null : Math.round(finalScore);
};


const App = () => {
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
  const debounceTimeout = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  const { isSignedIn, userProfile, googleToken, signIn, signOut,
          uploadFile, downloadFile, findRKTFileId, createRKTFile, findAllRKTFiles, deleteFile } = useGoogleAuth(GOOGLE_CLIENT_ID);
  
  const prevUserProfile = useRef(userProfile);
  
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);

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
             JSON.stringify(data.learningObjectives) === JSON.stringify({});
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
  
  const appData = useMemo(() => getAppData(settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives), [
      settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives
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
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
        return null;
    }
    try {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Petunjuk
        const petunjukData = [
            ["Petunjuk Penggunaan Template RKT"],
            ["1. Jangan mengubah nama-nama sheet (lembar kerja) yang sudah ada."],
            ["2. Jangan mengubah header kolom (baris pertama) di setiap sheet."],
            ["3. Isi data sesuai dengan kolom yang tersedia."],
            ["4. Sheet 'Pengaturan', 'Mata Pelajaran', dan 'Ekstrakurikuler' digunakan untuk mengonfigurasi aplikasi."],
            ["5. Sheet 'Daftar Siswa' adalah tempat untuk memasukkan semua data identitas siswa."],
            ["6. Sheet 'Tujuan Pembelajaran' adalah tempat untuk mendefinisikan semua Sumatif Lingkup Materi (SLM) dan Tujuan Pembelajaran (TP)."],
            ["7. Sheet 'Nilai_[ID Mapel]' (contoh: Nilai_BIndo) adalah tempat untuk menginput nilai sumatif siswa per mata pelajaran."],
            ["8. Sheet 'Absensi', 'Data Ekstra', 'Catatan Wali Kelas', dan 'Data Kokurikuler' adalah untuk data pendukung rapor."],
            ["9. Setelah selesai, simpan file ini dan unggah kembali melalui menu 'Unggah dari Template' di aplikasi."],
        ];
        const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
        XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

        // Sheet 2: Pengaturan
        const settingsData = Object.entries(initialSettings)
            .filter(([key]) => !['predikats', 'gradeCalculation', 'kop_layout', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'piagam_layout'].includes(key))
            .map(([key, _]) => [key, settings[key] || '']);
        settingsData.unshift(["Kunci Pengaturan", "Nilai"]);
        
        settingsData.push([]);
        settingsData.push(["Pengaturan Rentang Nilai (Predikat)"]);
        settingsData.push(["Predikat", "Nilai Minimum"]);
        settingsData.push(['A', settings.predikats.a]);
        settingsData.push(['B', settings.predikats.b]);
        settingsData.push(['C', settings.predikats.c]);

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
          'ID Siswa (Otomatis)': s.id, 'Nama Lengkap': s.namaLengkap, 'Nama Panggilan': s.namaPanggilan, 'NIS': s.nis, 'NISN': s.nisn, 'Tempat Lahir': s.tempatLahir, 'Tanggal Lahir': s.tanggalLahir, 'Jenis Kelamin': s.jenisKelamin, 'Agama': s.agama, 'Asal TK': s.asalTk, 'Alamat Siswa': s.alamatSiswa, 'Diterima di Kelas': s.diterimaDiKelas, 'Diterima Tanggal': s.diterimaTanggal, 'Nama Ayah': s.namaAyah, 'Nama Ibu': s.namaIbu, 'Pekerjaan Ayah': s.pekerjaanAyah, 'Pekerjaan Ibu': s.pekerjaanIbu, 'Alamat Orang Tua': s.alamatOrangTua, 'Telepon Orang Tua': s.teleponOrangTua, 'Nama Wali': s.namaWali, 'Pekerjaan Wali': s.pekerjaanWali, 'Alamat Wali': s.alamatWali, 'Telepon Wali': s.teleponWali,
        }));
        const wsStudents = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, wsStudents, "Daftar Siswa");

        // Sheet 6: Tujuan Pembelajaran (Hanya yang ada nilainya)
        const tpExportData = [];
        const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas)}`;
        const objectivesForClass = learningObjectives[gradeKey] || {};

        // 1. Find all TPs that have been graded for at least one student
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
        
        // 2. Build export data based on the set of graded TPs
        for (const subjectFullName in objectivesForClass) {
            const subject = subjects.find(s => s.fullName === subjectFullName);
            if (!subject) continue;

            const objectivesForSubject = objectivesForClass[subjectFullName] || [];
            const slmsInGrades = grades.length > 0 ? (grades[0].detailedGrades?.[subject.id]?.slm || []) : [];

            // Group TPs by SLM to correctly determine their index
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

        // Sheet Tambahan: Aset Gambar (untuk menyimpan gambar base64 dengan chunking)
        const imageAssetsData = [];
        const imageKeys = ['logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background'];
        const CHUNK_SIZE = 32000; // Ukuran aman untuk sel Excel

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
  }, [settings, students, grades, notes, cocurricularData, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, showToast]);

    const importFromExcelBlob = useCallback(async (blob) => {
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka impor (SheetJS) tidak termuat.', 'error');
        return;
    }
    setIsLoading(true);
    try {
        const data = await blob.arrayBuffer();
        const workbook = XLSX.read(data);

        // --- Clear existing data before import ---
        setSettings(initialSettings);
        setStudents(initialStudents);
        setGrades(initialGrades);
        setNotes(initialNotes);
        setCocurricularData(initialCocurricularData);
        setAttendance(initialAttendance);
        setExtracurriculars(presets?.extracurriculars || []);
        setStudentExtracurriculars(initialStudentExtracurriculars);
        setSubjects(defaultSubjects);
        setLearningObjectives({});
        
        let newSettings = { ...initialSettings };
        let newStudents = [];
        let newSubjects = [];
        let newExtracurriculars = [];
        let newAttendance = [];
        let newNotes = {};
        let newCocurricularData = {};
        let newStudentExtracurriculars = [];
        let newLearningObjectives = {};
        let newGrades = [];
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
        if (wsSubjects) newSubjects = XLSX.utils.sheet_to_json(wsSubjects).map(s => ({ id: s["ID Internal (Jangan Diubah)"], fullName: s["Nama Lengkap"], label: s["Singkatan"], active: (s["Status Aktif"] || '').toLowerCase() === 'aktif' }));
        const wsExtra = workbook.Sheets["Ekstrakurikuler"];
        if (wsExtra) newExtracurriculars = XLSX.utils.sheet_to_json(wsExtra).map(e => ({ id: e["ID Unik (Jangan Diubah)"], name: e["Nama Ekstrakurikuler"], active: (e["Status Aktif"] || '').toLowerCase() === 'aktif' }));

        // 4. Parse Daftar Siswa and ensure unique IDs
        const wsStudents = workbook.Sheets["Daftar Siswa"];
        if (wsStudents) {
            let importCounter = 0;
            newStudents = XLSX.utils.sheet_to_json(wsStudents).map(s => {
                importCounter++;
                return {
                    id: s['ID Siswa (Otomatis)'] || `imported_student_${Date.now()}_${importCounter}`,
                    namaLengkap: s['Nama Lengkap'], namaPanggilan: s['Nama Panggilan'], nis: s['NIS'], nisn: s['NISN'], 
                    tempatLahir: s['Tempat Lahir'], tanggalLahir: s['Tanggal Lahir'], jenisKelamin: s['Jenis Kelamin'], 
                    agama: s['Agama'], asalTk: s['Asal TK'], alamatSiswa: s['Alamat Siswa'], 
                    diterimaDiKelas: s['Diterima di Kelas'], diterimaTanggal: s['Diterima Tanggal'], 
                    namaAyah: s['Nama Ayah'], namaIbu: s['Nama Ibu'], pekerjaanAyah: s['Pekerjaan Ayah'], 
                    pekerjaanIbu: s['Pekerjaan Ibu'], alamatOrangTua: s['Alamat Orang Tua'], 
                    teleponOrangTua: s['Telepon Orang Tua'], namaWali: s['Nama Wali'], pekerjaanWali: s['Pekerjaan Wali'], 
                    alamatWali: s['Alamat Wali'], teleponWali: s['Telepon Wali'],
                };
            });
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
                const subjectId = sheetName.split('_')[1];
                const wsNilai = workbook.Sheets[sheetName];
                const nilaiData = XLSX.utils.sheet_to_json(wsNilai);

                nilaiData.forEach(row => {
                    const studentId = row["ID Siswa"];
                    const studentGrade = gradesMap.get(studentId);
                    if (!studentGrade || !studentGrade.detailedGrades[subjectId]) return;
                    
                    const detailedGrade = studentGrade.detailedGrades[subjectId];
                    Object.keys(row).forEach(header => {
                        if (header.includes("_TP")) {
                            const [slmId, tpPart] = header.split('_TP');
                            const tpIndex = parseInt(tpPart, 10) - 1;
                            const slmEntry = detailedGrade.slm.find(s => s.id === slmId);
                            if (slmEntry && tpIndex >= 0) slmEntry.scores[tpIndex] = row[header] === '' ? null : Number(row[header]);
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

        // 8. Re-calculate final grades
        const kkm = parseInt(newSettings.predikats.c, 10);
        newGrades = newGrades.map(studentGrade => {
            const newFinalGrades = {};
            for (const subjectId in studentGrade.detailedGrades) {
                const detailed = studentGrade.detailedGrades[subjectId];
                const config = newSettings.gradeCalculation[subjectId] || { method: 'rata-rata' };
                const finalScore = calculateFinalGrade(detailed, config, kkm);
                newFinalGrades[subjectId] = finalScore;
            }
            return { ...studentGrade, finalGrades: newFinalGrades };
        });

        // 9. Parse other sheets
        const wsAttendance = workbook.Sheets["Absensi"];
        if (wsAttendance) newAttendance = XLSX.utils.sheet_to_json(wsAttendance).map(a => ({ studentId: a.studentId, sakit: a.Sakit, izin: a.Izin, alpa: a.Alpa }));
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


        setSettings(newSettings);
        setSubjects(newSubjects);
        setExtracurriculars(newExtracurriculars);
        setStudents(newStudents);
        setLearningObjectives(newLearningObjectives);
        setGrades(newGrades);
        setAttendance(newAttendance);
        setNotes(newNotes);
        setCocurricularData(newCocurricularData);
        setStudentExtracurriculars(newStudentExtracurriculars);
        
        showToast('Data berhasil diimpor dari file!', 'success');
        
    } catch (error) {
        console.error("Gagal mengimpor data:", error);
        showToast(`Format file tidak valid atau rusak: ${error.message}`, 'error');
    } finally {
        setIsLoading(false);
    }
    }, [showToast, presets]);

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
            
            // Gunakan pemeriksaan duplikat cerdas yang baru.
            // Sekarang memerlukan pengaturan saat ini untuk dibandingkan dengan konten file.
            const foundFile = await findRKTFileId(currentDynamicFileName, settings);
            
            if (foundFile) {
                // Duplikat sejati ditemukan. Gunakan ID-nya.
                fileToOperateId = foundFile.id;
                if (googleDriveFileId !== foundFile.id) {
                    console.log(`Beralih untuk memperbarui file yang ada dengan ID: ${foundFile.id}`);
                    setGoogleDriveFileId(foundFile.id);
                }
            } else {
                // Tidak ada duplikat sejati yang ditemukan (nama tidak ada, atau nama ada tetapi konten berbeda).
                // Ini akan memaksa pembuatan file baru.
                fileToOperateId = null; 
            }
    
            const blob = exportToExcelBlob();
            if (!blob) throw new Error("Gagal membuat data Excel untuk diunggah.");
    
            if (fileToOperateId) {
                // Perbarui file yang ada
                await uploadFile(fileToOperateId, currentDynamicFileName, blob, RKT_MIME_TYPE);
            } else {
                // Buat file baru
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

        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (isSignedIn) {
            setIsDirty(true);
            setSyncStatus('unsaved');
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            debounceTimeout.current = setTimeout(() => autoSaveToDrive(), 5000);
        }
    }, [appData, isSignedIn, autoSaveToDrive]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isDirty && isSignedIn) {
                if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
                autoSaveToDrive();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isDirty, isSignedIn, autoSaveToDrive]);

    const handleSettingsChange = useCallback((e) => {
        const { name, value, type, files } = e.target;
    
        if (type === 'file') {
            if (files && files[0]) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newValue = reader.result;
                    setSettings(prev => {
                        // Check for grade level change before updating state
                        if (name === 'nama_kelas') {
                            const oldGradeNumber = getGradeNumber(prev.nama_kelas);
                            const newGradeNumber = getGradeNumber(newValue);
                            if (oldGradeNumber !== null && newGradeNumber !== null && oldGradeNumber !== newGradeNumber) {
                                if (window.confirm('Mengubah jenjang kelas akan mereset data nilai dan TP. Lanjutkan?')) {
                                    setLearningObjectives({});
                                    setGrades(initialGrades);
                                    showToast('Data nilai & TP direset karena jenjang kelas berubah.', 'info');
                                } else {
                                    return prev; // Abort state update
                                }
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
                // Check for grade level change before updating state
                if (name === 'nama_kelas') {
                    const oldGradeNumber = getGradeNumber(prev.nama_kelas);
                    const newGradeNumber = getGradeNumber(value);
                    if (oldGradeNumber !== null && newGradeNumber !== null && oldGradeNumber !== newGradeNumber) {
                         if (window.confirm('Mengubah jenjang kelas akan mereset data nilai dan TP. Lanjutkan?')) {
                            setLearningObjectives({});
                            setGrades(initialGrades);
                             showToast('Data nilai & TP direset karena jenjang kelas berubah.', 'info');
                        } else {
                            // Revert the input value visually if possible, or just prevent state update
                            e.target.value = prev.nama_kelas;
                            return prev;
                        }
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
                const kkm = parseInt(updatedSettings.predikats.c, 10);
                return prevGrades.map(studentGrade => {
                    const detailedGrade = studentGrade.detailedGrades[subjectId];
                    if (detailedGrade) {
                        const newFinalScore = calculateFinalGrade(detailedGrade, newConfig, kkm);
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

    const handleUpdateDetailedGrade = useCallback((studentId, subjectId, { type, value }) => {
        setGrades(prevGrades => {
            const studentGradeIndex = prevGrades.findIndex(g => g.studentId === studentId);
            const newGrades = [...prevGrades];
            let studentGrade = studentGradeIndex > -1 ? { ...newGrades[studentGradeIndex] } : { studentId, detailedGrades: {}, finalGrades: {} };
            
            studentGrade.detailedGrades = { ...studentGrade.detailedGrades };
            const newDetailedGradeForSubject = { ...(studentGrade.detailedGrades[subjectId] || { slm: [], sts: null, sas: null }), [type]: value };
            studentGrade.detailedGrades[subjectId] = newDetailedGradeForSubject;

            const config = settings.gradeCalculation[subjectId] || { method: 'rata-rata' };
            const kkm = parseInt(settings.predikats.c, 10);
            
            const finalScore = calculateFinalGrade(newDetailedGradeForSubject, config, kkm);

            studentGrade.finalGrades = { ...studentGrade.finalGrades, [subjectId]: finalScore };

            if (studentGradeIndex > -1) {
                newGrades[studentGradeIndex] = studentGrade;
            } else {
                newGrades.push(studentGrade);
            }
            return newGrades;
        });
    }, [settings.gradeCalculation, settings.predikats.c]);
    
    const handleBulkAddSlm = useCallback((subjectId, slmTemplate) => {
        setGrades(prevGrades => {
            const newState = prevGrades.map(g => ({...g})); // Shallow copy students
    
            return newState.map(studentGrade => {
                const newStudentGrade = {...studentGrade};
                newStudentGrade.detailedGrades = {...newStudentGrade.detailedGrades};
    
                const subjectGrades = newStudentGrade.detailedGrades[subjectId] || { slm: [], sts: null, sas: null };
                
                // If this SLM already exists for this student, do nothing for this student
                if (subjectGrades.slm && subjectGrades.slm.some(s => s.id === slmTemplate.id)) {
                    return newStudentGrade;
                }
                
                const newSubjectGrades = {...subjectGrades};
                newSubjectGrades.slm = [...(newSubjectGrades.slm || [])];
    
                // Crucially, create a deep copy of the template for EACH student
                newSubjectGrades.slm.push(JSON.parse(JSON.stringify(slmTemplate)));
    
                newStudentGrade.detailedGrades[subjectId] = newSubjectGrades;
                return newStudentGrade;
            });
        });
    }, []);

    const handleUpdateLearningObjectives = useCallback((newObjectives) => setLearningObjectives(newObjectives), []);
    const handleUpdateKopLayout = useCallback((newLayout) => setSettings(prev => ({ ...prev, kop_layout: newLayout })), []);
    const handleUpdatePiagamLayout = useCallback((newLayout) => setSettings(prev => ({ ...prev, piagam_layout: newLayout })), []);
    const handleDriveFileSelection = async (fileId) => {
        if (!fileId) { setIsDriveModalOpen(false); return; }
        setIsDriveModalOpen(false);
        setIsLoading(true);
        showToast("Mengunduh data dari Google Drive...", 'info');
        try {
            const blob = await downloadFile(fileId);
            await importFromExcelBlob(blob);
            
            setGoogleDriveFileId(fileId);
            const selectedFile = driveFiles.find(f => f.id === fileId);
            setLastSyncTimestamp(selectedFile?.modifiedTime || new Date().toISOString());
            showToast("Data berhasil diunduh dan dimuat!", 'success');
        } catch (error) {
            console.error("Gagal mengunduh file yang dipilih:", error);
            showToast(`Gagal mengunduh: ${error.message}`, 'error');
        } finally { setIsLoading(false); }
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
      case 'DATA_NILAI': return React.createElement(DataNilaiPage, { students, grades, settings, onUpdateGradeCalculation: handleUpdateGradeCalculation, onUpdateDetailedGrade: handleUpdateDetailedGrade, onBulkAddSlm: handleBulkAddSlm, learningObjectives, onUpdateLearningObjectives: handleUpdateLearningObjectives, subjects, predikats: settings.predikats, onUpdatePredikats: handleUpdatePredikats, showToast: showToast, initialTab: dataNilaiInitialTab });
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
  
  const mainLayoutClass = isMobile
    ? "bg-slate-100 font-sans flex flex-col min-h-screen"
    : "flex h-screen bg-slate-100 font-sans";
    
  return React.createElement(React.Fragment, null,
      isUpdateAvailable && React.createElement('div', { className: "fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 p-3 text-center z-[101] shadow-lg flex justify-center items-center gap-4 print-hidden" }, React.createElement('p', { className: 'font-semibold' }, 'Versi baru aplikasi tersedia.'), React.createElement('button', { onClick: updateAssets, className: 'px-4 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-bold' }, 'Perbarui Sekarang')),
      React.createElement(DriveDataSelectionModal, { isOpen: isDriveModalOpen, onClose: () => setIsDriveModalOpen(false), onConfirm: handleDriveFileSelection, files: driveFiles, isLoading: isCheckingDrive, onDelete: handleDriveFileDelete }),
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
        React.createElement('main', { className: `${isMobile ? 'flex-1' : 'flex-1 overflow-y-auto'} p-4 sm:p-6 lg:p-8` }, renderPage())
      ),
      toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) })
    );
};

export default App;
