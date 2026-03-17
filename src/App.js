import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { NAV_ITEMS, COCURRICULAR_DIMENSIONS, QUALITATIVE_DESCRIPTORS, FORMATIVE_ASSESSMENT_TYPES } from './constants.js';
import Navigation from './components/Navigation.js';
import Dashboard from './components/Dashboard.js';
import PlaceholderPage from './components/PlaceholderPage.js';
import SettingsPage from './components/SettingsPage.js';
import PanduanPage from './components/PanduanPage.js';
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
import useWindowDimensions from './hooks/useWindowDimensions.js';
import ERaporProcessorModal from './components/ERaporProcessorModal.js';

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
  enableExitWarning: false,
};

const initialStudents = [];
const initialGrades = [];
const initialNotes = {};
const initialCocurricularData = {};
const initialAttendance = [];
const initialStudentExtracurriculars = [];
const initialFormativeJournal = {};

const loadDataSafe = (key, fallbackValue, validator = null) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallbackValue;
        const parsed = JSON.parse(saved);
        if (validator && !validator(parsed)) {
            console.warn(`Data validation failed for key: ${key}. Reverting to fallback.`);
            return fallbackValue;
        }
        if (Array.isArray(fallbackValue) && !Array.isArray(parsed)) {
            return fallbackValue;
        }
        if (typeof fallbackValue === 'object' && !Array.isArray(fallbackValue) && fallbackValue !== null) {
             return { ...fallbackValue, ...parsed };
        }
        return parsed;
    } catch (e) {
        console.error(`Error loading ${key} from storage:`, e);
        return fallbackValue;
    }
};

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
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Don't set targetSection to null here, otherwise it triggers the else block
        }
      }, 100);
    } else if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePage, targetSection]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState(null);
  const [activeNilaiTab, setActiveNilaiTab] = useState('keseluruhan'); 
  const { isMobile } = useWindowDimensions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
  const isInitialMount = useRef(true);

  const [isERaporModalOpen, setIsERaporModalOpen] = useState(false);

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
        setSettings(prev => ({ ...prev, nama_kelas: value }));
        setGrades(prevGrades => prevGrades.map(g => ({
            studentId: g.studentId,
            detailedGrades: {},
            finalGrades: {}
        })));
        setSettings(prev => ({ ...prev, slmVisibility: {} }));
        showToast(`Kelas diubah ke Kelas ${getGradeNumber(value)}. Semua data nilai telah direset.`, 'success');
        return;
    }
    if (type === 'checkbox') {
        setSettings(prev => ({ ...prev, [name]: value }));
        return;
    }
    if (name) { 
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

  useEffect(() => {
      if (students.length > 0) {
          let hasChanges = false;
          const newGrades = [...grades];
          students.forEach(s => {
              if (!newGrades.find(g => g.studentId === s.id)) {
                  newGrades.push({ studentId: s.id, detailedGrades: {}, finalGrades: {} });
                  hasChanges = true;
              }
          });
          if (hasChanges) setGrades(newGrades);
      }
  }, [students.length]); 

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

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const response = await fetch('/presets.json');
                if (!response.ok) throw new Error('Failed to fetch presets');
                const presetsData = await response.json();
                setPresets(presetsData);
                setExtracurriculars(prev => prev.length === 0 ? presetsData.extracurriculars || [] : prev);
            } catch (error) {
                console.error("Error initialization:", error);
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
            ["1. Sheet 'Leger' berisi ringkasan nilai seluruh siswa."],
            ["2. Jangan mengubah nama-nama sheet (lembar kerja) data mentah (Nilai_, Absensi, dll)."],
            ["3. Jangan mengubah header (baris pertama) pada setiap sheet data mentah."],
            ["4. Simpan file ini dan unggah kembali ke aplikasi RKT untuk mengembalikan data."]
        ]);
        XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

        // --- 2. Sheet: Leger (SUMMARY) ---
        const activeSubjects = subjects.filter(s => s.active);
        const displaySubjects = [];
        const addedGroupPrefixes = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti' } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SENI', fullName: 'Seni Budaya' } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'MULOK', fullName: 'Muatan Lokal' } }
        ];
        
        activeSubjects.forEach(subject => {
            let group = groups.find(g => subject.fullName.startsWith(g.prefix));
            if (!group && (subject.id === 'PAKTTMYME' || subject.fullName.toLowerCase().includes('kepercayaan terhadap tuhan'))) {
                group = groups.find(g => g.base.id === 'PABP');
            }
            if (group) {
                if (!addedGroupPrefixes.has(group.prefix)) {
                    displaySubjects.push(group.base);
                    addedGroupPrefixes.add(group.prefix);
                }
            } else displaySubjects.push(subject);
        });
        
        const sortOrder = { 'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5, 'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9 };
        displaySubjects.sort((a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));

        const legerHeader = ["No", "Nama Siswa", "NISN", "NIS", ...displaySubjects.map(s => s.label), "Jumlah", "Rata-rata", "Peringkat"];
        const legerDataWithTotals = students.map((student, index) => {
            const studentGrades = grades.find(g => g.studentId === student.id) || { finalGrades: {} };
            let total = 0, count = 0;
            const rowGrades = displaySubjects.map(ds => {
                let grade;
                if (ds.id === 'PABP') {
                    const rel = String(student.agama || '').trim().toLowerCase();
                    if (rel) {
                        const matched = rel === 'kepercayaan' ? activeSubjects.find(s => s.id === 'PAKTTMYME') : activeSubjects.find(s => s.fullName.startsWith(ds.fullName) && s.fullName.toLowerCase().includes(`(${rel})`));
                        grade = matched ? studentGrades.finalGrades[matched.id] : null;
                    }
                } else if (['SB', 'Mulok'].includes(ds.id)) {
                    const member = activeSubjects.filter(s => s.fullName.startsWith(ds.fullName));
                    grade = member.map(m => studentGrades.finalGrades[m.id]).find(g => g != null);
                } else grade = studentGrades.finalGrades[ds.id];

                if (typeof grade === 'number') { total += grade; count++; }
                return grade ?? '-';
            });
            return { id: student.id, no: index + 1, name: student.namaLengkap, nisn: student.nisn, nis: student.nis, rowGrades, total, avg: count > 0 ? (total / count).toFixed(2) : "0.00" };
        });

        // Calculate Rank
        const sortedForRank = [...legerDataWithTotals].sort((a, b) => b.total - a.total);
        const rankMap = new Map();
        if (sortedForRank.length > 0) {
            let curRank = 1;
            rankMap.set(sortedForRank[0].id, curRank);
            for (let i = 1; i < sortedForRank.length; i++) {
                if (sortedForRank[i].total < sortedForRank[i - 1].total) curRank = i + 1;
                rankMap.set(sortedForRank[i].id, curRank);
            }
        }

        const legerRows = [legerHeader, ...legerDataWithTotals.map(d => [
            d.no, d.name, d.nisn, d.nis, ...d.rowGrades, d.total, d.avg, rankMap.get(d.id)
        ])];
        const wsLeger = XLSX.utils.aoa_to_sheet(legerRows);
        XLSX.utils.book_append_sheet(wb, wsLeger, "Leger");

        // --- 3. Sheet: Pengaturan ---
        const excludeKeys = ['predikats', 'gradeCalculation', 'kop_layout', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'piagam_layout', 'qualitativeGradingMap', 'slmVisibility', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
        const settingsRows = [
            ["Kunci Pengaturan", "Nilai"],
            ["format_version", "2"],
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
            settingsRows.push([s.id, config.method || 'rata-rata', JSON.stringify(config.weights || {}), JSON.stringify(visibility)]);
        });
        const wsSettings = XLSX.utils.aoa_to_sheet(settingsRows);
        XLSX.utils.book_append_sheet(wb, wsSettings, "Pengaturan");

        // --- 4. Sheet: Mata Pelajaran ---
        const wsMapel = XLSX.utils.aoa_to_sheet([[".", "Nama Lengkap", "Singkatan", "Status Aktif", "Kunci Kurikulum"], ...subjects.map(s => [s.id, s.fullName, s.label, s.active ? "Aktif" : "Tidak Aktif", s.curriculumKey || s.fullName])]);
        XLSX.utils.book_append_sheet(wb, wsMapel, "Mata Pelajaran");

        // --- 5. Sheet: Ekstrakurikuler ---
        const wsEkstra = XLSX.utils.aoa_to_sheet([["ID Unik (Jangan Diubah)", "Nama Ekstrakurikuler", "Status Aktif"], ...extracurriculars.map(e => [e.id, e.name, e.active ? "Aktif" : "Tidak Aktif"])]);
        XLSX.utils.book_append_sheet(wb, wsEkstra, "Ekstrakurikuler");

        // --- 6. Sheet: Daftar Siswa ---
        const wsSiswa = XLSX.utils.aoa_to_sheet([["ID Siswa (Otomatis)", "Nama Lengkap", "Nama Panggilan", "NIS", "NISN", "Tempat, Tanggal Lahir", "Jenis Kelamin", "Agama", "Asal TK", "Alamat Siswa", "Diterima di Kelas", "Diterima Tanggal", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Alamat Orang Tua", "Telepon Orang Tua", "Nama Wali", "Pekerjaan Wali", "Alamat Wali", "Telepon Wali"], ...students.map(s => [s.id, s.namaLengkap, s.namaPanggilan, s.nis, s.nisn, s.ttl, s.jenisKelamin, s.agama, s.asalTk, s.alamatSiswa, s.diterimaDiKelas, s.diterimaTanggal, s.namaAyah, s.namaIbu, s.pekerjaanAyah, s.pekerjaanIbu, s.alamatOrangTua, s.teleponOrangTua, s.namaWali, s.pekerjaanWali, s.alamatWali, s.teleponWali])]);
        XLSX.utils.book_append_sheet(wb, wsSiswa, "Daftar Siswa");

        // --- 7. Sheet: Tujuan Pembelajaran ---
        const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas)}`;
        const masterCurriculum = new Map();
        if (predefinedCurriculum) {
            subjects.filter(s => s.active).forEach(sub => {
                const preData = predefinedCurriculum[sub.curriculumKey || sub.fullName];
                if (preData) masterCurriculum.set(sub.id, preData.map((slm, i) => ({ id: `slm_predefined_${sub.id}_${i}`, name: slm.slm, tps: slm.tp.map(t => ({ text: t })) })));
            });
        }
        if (learningObjectives[gradeKey]) {
            subjects.filter(s => s.active).forEach(sub => {
                const userTps = learningObjectives[gradeKey][sub.curriculumKey || sub.fullName];
                if (!userTps) return;
                let subSlms = masterCurriculum.get(sub.id) || [];
                const userTpsBySlm = userTps.reduce((acc, tp) => { if (!acc[tp.slmId]) acc[tp.slmId] = []; acc[tp.slmId].push({ text: tp.text }); return acc; }, {});
                Object.entries(userTpsBySlm).forEach(([slmId, tps]) => {
                    const idx = subSlms.findIndex(s => s.id === slmId);
                    if (idx > -1) { subSlms[idx].tps = tps; const name = grades[0]?.detailedGrades?.[sub.id]?.slm.find(s => s.id === slmId)?.name; if (name) subSlms[idx].name = name; }
                    else subSlms.push({ id: slmId, name: grades[0]?.detailedGrades?.[sub.id]?.slm.find(s => s.id === slmId)?.name || 'Lingkup Materi Kustom', tps });
                });
                masterCurriculum.set(sub.id, subSlms);
            });
        }
        const tpRows = [["ID Mata Pelajaran", "Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Deskripsi Tujuan Pembelajaran (TP)"]];
        masterCurriculum.forEach((slms, subId) => {
            const sub = subjects.find(s => s.id === subId);
            if (sub) slms.forEach(slm => slm.tps.forEach(tp => tpRows.push([subId, sub.curriculumKey || sub.fullName, slm.id, slm.name, tp.text])));
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tpRows), "Tujuan Pembelajaran");

        // --- 8. Sheets: Nilai_{MapelID} ---
        subjects.filter(s => s.active).forEach(sub => {
            const subSlms = masterCurriculum.get(sub.id);
            const headers = ["ID Siswa", "Nama Siswa"];
            const colMap = [];
            if (subSlms) subSlms.forEach(slm => slm.tps.forEach((tp, i) => { headers.push(`${slm.id}_TP${i + 1}`); colMap.push({ type: 'tp', slmId: slm.id, index: i }); }));
            headers.push("STS", "SAS");
            const sheetRows = [headers];
            students.forEach(st => {
                const sGr = grades.find(g => g.studentId === st.id)?.detailedGrades?.[sub.id];
                const row = [st.id, st.namaLengkap];
                colMap.forEach(m => { const slm = sGr?.slm?.find(s => s.id === m.slmId); row.push(slm?.scores?.[m.index] ?? ''); });
                row.push(sGr?.sts ?? '', sGr?.sas ?? '');
                sheetRows.push(row);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetRows), `Nilai_${sub.id}`);
        });

        // --- 9. Data Lainnya (Absensi, Ekstra, Kokur, Catatan, Jurnal, Aset) ---
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["ID Siswa", "Sakit", "Izin", "Alpa"], ...students.map(s => { const a = attendance.find(x => x.studentId === s.id); return [s.id, a?.sakit ?? '', a?.izin ?? '', a?.alpa ?? '']; })]), "Absensi");
        const exRows = [["ID Siswa", "Nama Siswa", "Urutan Ekstra", "ID Ekstrakurikuler", "Deskripsi"]];
        studentExtracurriculars.forEach(se => { const st = students.find(s => s.id === se.studentId); if (st) se.assignedActivities.forEach((actId, i) => { if (actId) exRows.push([se.studentId, st.namaLengkap, i + 1, actId, se.descriptions?.[actId] || '']); }); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(exRows), "Data Ekstra");
        const koRows = [["ID Siswa", "Nama Siswa", ...COCURRICULAR_DIMENSIONS.map(d => d.id)]];
        students.forEach(s => { const co = cocurricularData[s.id]?.dimensionRatings || {}; const row = [s.id, s.namaLengkap]; COCURRICULAR_DIMENSIONS.forEach(d => row.push(co[d.id] || '')); koRows.push(row); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(koRows), "Data Kokurikuler");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["ID Siswa", "Catatan Wali Kelas"], ...students.map(s => [s.id, notes[s.id] || ''])]), "Catatan Wali Kelas");
        const jfRows = [["ID Siswa", "ID Catatan", "Tanggal", "Tipe", "Mapel ID", "SLM ID", "TP ID", "Topik", "Isi Catatan"]];
        Object.entries(formativeJournal).forEach(([sid, ns]) => ns.forEach(n => jfRows.push([sid, n.id, n.date, n.type, n.subjectId || '', n.slmId || '', n.tpId || '', n.topic || '', n.note || ''])));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(jfRows), "Jurnal Formatif");
        const asetRows = [["Kunci Aset", "Data Base64"]];
        const asToSa = { 'logo_sekolah': settings.logo_sekolah, 'logo_dinas': settings.logo_dinas, 'logo_cover': settings.logo_cover, 'piagam_background': settings.piagam_background, 'ttd_kepala_sekolah': settings.ttd_kepala_sekolah, 'ttd_wali_kelas': settings.ttd_wali_kelas };
        Object.entries(asToSa).forEach(([k, b]) => { if (b && typeof b === 'string') chunkString(b, 30000).forEach((c, i) => asetRows.push([`${k}_part_${i}`, c])); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(asetRows), "Aset Gambar");

        return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/octet-stream' });
    } catch (e) { console.error("Export Error:", e); return null; }
  }, [settings, students, grades, notes, attendance, studentExtracurriculars, subjects, cocurricularData, extracurriculars, learningObjectives, formativeJournal, predefinedCurriculum]);

    const parseExcelBlob = useCallback(async (blob) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        let news = { ...initialSettings }, nStud = [], nAtt = [], nNot = {}, nStEx = [], nCo = {}, nGr = [], nSub = [...defaultSubjects], nEx = [], nLO = {}, nFJ = {};
        const findSheet = (names) => { for (const name of names) { const found = workbook.SheetNames.find(sn => sn.toLowerCase().trim() === name.toLowerCase() || sn.toLowerCase().trim() === name.toLowerCase().replace(/\s/g, '_')); if (found) return workbook.Sheets[found]; } return null; };
        const wsAset = findSheet(["Aset Gambar", "Images", "Assets"]);
        const assetMap = {};
        if (wsAset) {
            const assetData = XLSX.utils.sheet_to_json(wsAset, { header: 1 });
            const chunksByKey = {};
            assetData.forEach(row => { const keyPart = row[0], data = row[1]; if (keyPart && data) { const match = keyPart.match(/^(.*)_part_(\d+)$/); if (match) { const realKey = match[1], idx = parseInt(match[2], 10); if (!chunksByKey[realKey]) chunksByKey[realKey] = []; chunksByKey[realKey][idx] = data; } } });
            Object.entries(chunksByKey).forEach(([key, chunks]) => { assetMap[key] = chunks.join(''); });
        }
        const wsP = findSheet(["Pengaturan", "Settings", "Info Sekolah"]);
        if (wsP) {
            const data = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            data.forEach(r => {
                if (r[0] && r[0] !== 'ID Mata Pelajaran') { if (['A', 'B', 'C', 'D'].includes(String(r[0]).toUpperCase())) news.predikats[String(r[0]).toLowerCase()] = String(r[1]); else if (r[0] in news) news[r[0]] = r[1]; }
                const subjectId = r[0]; if (defaultSubjects.some(ds => ds.id === subjectId)) { try { const weights = r[2] ? JSON.parse(r[2]) : {}, visibility = r[3] ? JSON.parse(r[3]) : []; if (!news.gradeCalculation) news.gradeCalculation = {}; news.gradeCalculation[subjectId] = { method: r[1] || 'rata-rata', weights }; if (!news.slmVisibility) news.slmVisibility = {}; news.slmVisibility[subjectId] = visibility; } catch (e) { console.warn("Failed parsing config for", subjectId, e); } }
            });
            news = { ...news, ...assetMap };
        }
        const wsMapel = findSheet(["Mata Pelajaran"]);
        if (wsMapel) { const rawMapel = XLSX.utils.sheet_to_json(wsMapel); nSub = defaultSubjects.map(ds => { const found = rawMapel.find(r => r['.'] === ds.id || r['ID'] === ds.id); if (found) return { ...ds, active: found['Status Aktif'] === 'Aktif', curriculumKey: found['Kunci Kurikulum'] || ds.fullName }; return ds; }); rawMapel.forEach(r => { const id = r['.'] || r['ID']; if (id && !defaultSubjects.some(ds => ds.id === id)) nSub.push({ id, fullName: r['Nama Lengkap'] || r['Nama Mata Pelajaran'] || id, label: r['Singkatan'] || id, active: r['Status Aktif'] === 'Aktif', curriculumKey: r['Kunci Kurikulum'] || r['Nama Lengkap'] }); }); }
        const wsEkstraDef = findSheet(["Ekstrakurikuler"]);
        if (wsEkstraDef) nEx = XLSX.utils.sheet_to_json(wsEkstraDef).map(r => ({ id: r['ID Unik (Jangan Diubah)'], name: r['Nama Ekstrakurikuler'], active: r['Status Aktif'] === 'Aktif' }));
        const wsS = findSheet(["Daftar Siswa", "Students", "Siswa", "Data Siswa"]);
        if (wsS) nStud = XLSX.utils.sheet_to_json(wsS).map((s, idx) => ({ id: String(s['ID Siswa (Otomatis)'] || s['ID Siswa'] || s['ID'] || `s_${Date.now()}_${idx}`), namaLengkap: s['Nama Lengkap'] != null ? String(s['Nama Lengkap']) : '', namaPanggilan: s['Nama Panggilan'] != null ? String(s['Nama Panggilan']) : '', nis: s['NIS'] != null ? String(s['NIS']) : '', nisn: s['NISN'] != null ? String(s['NISN']) : '', ttl: s['Tempat, Tanggal Lahir'] != null ? String(s['Tempat, Tanggal Lahir']) : '', jenisKelamin: s['Jenis Kelamin'] != null ? String(s['Jenis Kelamin']) : '', agama: s['Agama'] != null ? String(s['Agama']) : '', asalTk: s['Asal TK'] != null ? String(s['Asal TK']) : '', alamatSiswa: s['Alamat Siswa'] != null ? String(s['Alamat Siswa']) : '', diterimaDiKelas: s['Diterima di Kelas'] != null ? String(s['Diterima di Kelas']) : '', diterimaTanggal: s['Diterima Tanggal'] != null ? String(s['Diterima Tanggal']) : '', namaAyah: s['Nama Ayah'] != null ? String(s['Nama Ayah']) : '', namaIbu: s['Nama Ibu'] != null ? String(s['Nama Ibu']) : '', pekerjaanAyah: s['Pekerjaan Ayah'] != null ? String(s['Pekerjaan Ayah']) : '', pekerjaanIbu: s['Pekerjaan Ibu'] != null ? String(s['Pekerjaan Ibu']) : '', alamatOrangTua: s['Alamat Orang Tua'] != null ? String(s['Alamat Orang Tua']) : '', teleponOrangTua: s['Telepon Orang Tua'] != null ? String(s['Telepon Orang Tua']) : '', namaWali: s['Nama Wali'] != null ? String(s['Nama Wali']) : '', pekerjaanWali: s['Pekerjaan Wali'] != null ? String(s['Pekerjaan Wali']) : '', alamatWali: s['Alamat Wali'] != null ? String(s['Alamat Wali']) : '', teleponWali: s['Telepon Wali'] != null ? String(s['Telepon Wali']) : '' }));
        const wsTP = findSheet(["Tujuan Pembelajaran"]);
        const slmNameMap = new Map();
        if (wsTP) { const tpData = XLSX.utils.sheet_to_json(wsTP); const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '?'}`; nLO[gradeKey] = {}; tpData.forEach(row => { const subjName = row['Nama Mata Pelajaran'], slmId = row['ID SLM'], slmName = row['Nama SLM']; if (slmId && slmName && !slmNameMap.has(slmId)) slmNameMap.set(slmId, slmName); if (subjName) { if (!nLO[gradeKey][subjName]) nLO[gradeKey][subjName] = []; nLO[gradeKey][subjName].push({ slmId, text: row['Deskripsi Tujuan Pembelajaran (TP)'], isEdited: true }); } }); }
        nGr = nStud.map(st => ({ studentId: st.id, detailedGrades: {}, finalGrades: {} }));
        workbook.SheetNames.forEach(name => { if (name.startsWith("Nilai_")) { const subIdRaw = name.split('_')[1]; let subId = subIdRaw; if (subId === 'Blng' && !nSub.some(s => s.id === 'Blng') && nSub.some(s => s.id === 'BIng')) subId = 'BIng'; const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]); rows.forEach(row => { const sid = String(row['ID Siswa'] || row['ID'] || row['a'] || '').trim(); let entry = nGr.find(g => g.studentId === sid); if (!entry) entry = nGr.find(g => g.studentId === 'student' + sid); if (!entry) entry = nGr.find(g => g.studentId.endsWith(sid) || sid.endsWith(g.studentId)); if (entry) { const detailed = entry.detailedGrades[subId] || { slm: [], sts: row['STS'], sas: row['SAS'] }; Object.keys(row).forEach(rawH => { const h = rawH.trim(), match = h.match(/^(.*)_TP(\d+)$/); if (match) { const slmId = match[1], tpIdx = parseInt(match[2]) - 1; let slm = detailed.slm.find(s => s.id === slmId); if (!slm) { slm = { id: slmId, name: slmNameMap.get(slmId) || 'Lingkup Materi Kustom', scores: [] }; detailed.slm.push(slm); } slm.scores[tpIdx] = row[rawH]; } }); entry.detailedGrades[subId] = detailed; } }); } });
        const wsAtt = findSheet(["Absensi"]);
        if (wsAtt) nAtt = XLSX.utils.sheet_to_json(wsAtt).map(r => ({ studentId: String(r['ID Siswa']), sakit: r['Sakit'], izin: r['Izin'], alpa: r['Alpa'] }));
        const wsDE = findSheet(["Data Ekstra"]);
        if (wsDE) { const deData = XLSX.utils.sheet_to_json(wsDE), map = {}; deData.forEach(row => { const sid = String(row['ID Siswa']); if (!map[sid]) map[sid] = { studentId: sid, assignedActivities: [], descriptions: {} }; const idx = (row['Urutan Ekstra'] || 1) - 1, actId = row['ID Ekstrakurikuler'], desc = row['Deskripsi']; map[sid].assignedActivities[idx] = actId; if (actId) map[sid].descriptions[actId] = desc; }); nStEx = Object.values(map); }
        const wsKo = findSheet(["Data Kokurikuler"]);
        if (wsKo) { const koData = XLSX.utils.sheet_to_json(wsKo); koData.forEach(row => { const sid = String(row['ID Siswa']), ratings = {}; COCURRICULAR_DIMENSIONS.forEach(dim => { ratings[dim.id] = row[dim.id] || row[dim.label]; }); nCo[sid] = { dimensionRatings: ratings }; }); }
        const wsCat = findSheet(["Catatan Wali Kelas"]);
        if (wsCat) XLSX.utils.sheet_to_json(wsCat).forEach(row => { const sid = String(row['ID Siswa']); nNot[sid] = row['Catatan Wali Kelas']; });
        const wsJF = findSheet(["Jurnal Formatif"]);
        if (wsJF) { const jfData = XLSX.utils.sheet_to_json(wsJF); jfData.forEach(row => { const sid = String(row['ID Siswa']); if (!nFJ[sid]) nFJ[sid] = []; nFJ[sid].push({ id: row['ID Catatan'] || Date.now(), date: row['Tanggal'], type: row['Tipe'], subjectId: row['Mapel ID'], slmId: row['SLM ID'], tpId: row['TP ID'], topic: row['Topik'], note: row['Isi Catatan'] }); }); }
        nGr.forEach(studentGrade => { nSub.forEach(subj => { const detailed = studentGrade.detailedGrades[subj.id]; if (detailed) studentGrade.finalGrades[subj.id] = calculateFinalGrade(detailed, news.gradeCalculation?.[subj.id] || { method: 'rata-rata' }, news); }); });
        return { settings: news, students: nStud, attendance: nAtt, notes: nNot, studentExtracurriculars: nStEx, cocurricularData: nCo, grades: nGr, subjects: nSub, extracurriculars: nEx, learningObjectives: nLO, formativeJournal: nFJ };
    }, [predefinedCurriculum]);

    const importFromExcelBlob = useCallback(async (blob) => {
        setIsLoading(true);
        try {
            const d = await parseExcelBlob(blob);
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

    useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => { localStorage.setItem('appStudents', JSON.stringify(students)); }, [students]);
    useEffect(() => { localStorage.setItem('appGrades', JSON.stringify(grades)); }, [grades]);
    useEffect(() => { localStorage.setItem('appNotes', JSON.stringify(notes)); }, [notes]);
    useEffect(() => { localStorage.setItem('appAttendance', JSON.stringify(attendance)); }, [attendance]);
    useEffect(() => { localStorage.setItem('appCocurricularData', JSON.stringify(cocurricularData)); }, [cocurricularData]);
    useEffect(() => { localStorage.setItem('appStudentExtracurriculars', JSON.stringify(studentExtracurriculars)); }, [studentExtracurriculars]);
    useEffect(() => { localStorage.setItem('appSubjects', JSON.stringify(subjects)); }, [subjects]);
    useEffect(() => { localStorage.setItem('appExtracurriculars', JSON.stringify(extracurriculars)); }, [extracurriculars]);
    useEffect(() => { localStorage.setItem('appLearningObjectives', JSON.stringify(learningObjectives)); }, [learningObjectives]);
    useEffect(() => { localStorage.setItem('appFormativeJournal', JSON.stringify(formativeJournal)); }, [formativeJournal]);
    
    useEffect(() => {
        isInitialMount.current = false;
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (settings.enableExitWarning) {
                e.preventDefault();
                e.returnValue = ''; // Standard way to trigger the browser's exit warning
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [settings.enableExitWarning]);

  return React.createElement(React.Fragment, null,
      toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }),
      isERaporModalOpen && React.createElement(ERaporProcessorModal, {
          isOpen: isERaporModalOpen,
          onClose: () => setIsERaporModalOpen(false),
          students, grades, subjects, learningObjectives, settings, showToast, predefinedCurriculum,
      }),
      React.createElement('div', { className: "flex flex-col xl:flex-row h-[100dvh] w-full bg-slate-100 overflow-hidden" },
        React.createElement(Navigation, { 
            activePage, setActivePage: handleNavigate, onExport: handleExportAll, onImport: handleImportAll,
            onIsiERapor: () => setIsERaporModalOpen(true),
            isMobile, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName: NAV_ITEMS.find(i => i.id === activePage)?.label || 'Dashboard' 
        }),
        React.createElement('main', { ref: mainRef, className: "flex-1 flex flex-col min-h-0 min-w-0 overflow-auto p-4 sm:p-8" }, 
            isLoading ? "Memuat..." : 
            activePage === 'DASHBOARD' ? React.createElement(Dashboard, { setActivePage: handleNavigate, settings, students, grades, subjects, notes, attendance, extracurriculars, studentExtracurriculars, cocurricularData, onNavigateToNilai: (id) => { setActiveNilaiTab(id); handleNavigate('DATA_NILAI'); } }) :
            activePage === 'PANDUAN' ? React.createElement(PanduanPage, { setActivePage: handleNavigate }) :
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
                learningObjectives, onUpdateLearningObjectives: setLearningObjectives, subjects, 
                onUpdatePredikats: p => setSettings(s => ({...s, predikats: p})), activeTab: activeNilaiTab, onTabChange: setActiveNilaiTab, 
                onUpdateGradeCalculation: (sid, conf) => setSettings(s => ({ ...s, gradeCalculation: { ...s.gradeCalculation, [sid]: conf } })),
                onUpdateSlmVisibility: (sid, vis) => setSettings(s => ({ ...s, slmVisibility: { ...s.slmVisibility, [sid]: vis } })),
                onUpdateDisplayMode: (mode) => setSettings(s => ({ ...s, nilaiDisplayMode: mode })),
                onBulkAddSlm: (subId, slm) => { setGrades(prev => prev.map(g => { const d = g.detailedGrades?.[subId] || { slm: [], sts: null, sas: null }; if (!d.slm.some(s => s.id === slm.id)) d.slm.push({ ...slm, scores: [...slm.scores] }); return { ...g, detailedGrades: { ...g.detailedGrades, [subId]: d } }; })); },
                predefinedCurriculum, showToast 
            }) :
            activePage === 'DATA_KOKURIKULER' ? React.createElement(DataKokurikulerPage, { students, settings, cocurricularData, onSettingsChange: handleSettingsChange, onUpdateCocurricularData: (sid, did, val) => setCocurricularData(prev => ({...prev, [sid]: { ...prev[sid], dimensionRatings: { ...(prev[sid]?.dimensionRatings || {}), [did]: val } } })), showToast }) :
            activePage === 'PENGATURAN' ? React.createElement(SettingsPage, { settings, onSettingsChange: handleSettingsChange, onSave: () => {}, onUpdateKopLayout: (l) => setSettings(s => ({...s, kop_layout: l})), subjects, onUpdateSubjects: setSubjects, extracurriculars, onUpdateExtracurriculars: setExtracurriculars, showToast }) :
            activePage === 'DATA_ABSENSI' ? React.createElement(DataAbsensiPage, { students, attendance, onUpdateAttendance: (sid, t, v) => setAttendance(prev => { const n = [...prev], i = n.findIndex(a => a.studentId === sid); if(i>-1) n[i][t] = v===''?null:parseInt(v); else n.push({studentId:sid, [t]: v===''?null:parseInt(v)}); return n; }), onBulkUpdateAttendance: setAttendance, showToast }) :
            activePage === 'CATATAN_WALI_KELAS' ? React.createElement(CatatanWaliKelasPage, { students, notes, onUpdateNote: (sid, note) => setNotes(prev => ({...prev, [sid]: note})), grades, subjects, settings, showToast }) :
            activePage === 'DATA_EKSTRAKURIKULER' ? React.createElement(DataEkstrakurikulerPage, { students, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars: setStudentExtracurriculars, showToast }) :
            activePage === 'PRINT_RAPOR' ? React.createElement(PrintRaporPage, { 
                students, settings, grades, attendance, notes, studentExtracurriculars, extracurriculars, subjects, learningObjectives, cocurricularData, 
                onUpdateDescription: (sid, subId, type, val) => { setGrades(prev => { const n = [...prev], g = n.find(x => x.studentId === sid); if(g && g.detailedGrades[subId]) { if(!g.detailedGrades[subId].descriptions) g.detailedGrades[subId].descriptions = {}; g.detailedGrades[subId].descriptions[type] = val; } return n; }); },
                onUpdateStudent: (id, k, v) => setStudents(prev => prev.map(s => s.id === id ? { ...s, [k]: v } : s)),
                onUpdateSettings: (k, v) => setSettings(s => ({ ...s, [k]: v })),
                onUpdateNote: (sid, v) => setNotes(n => ({ ...n, [sid]: v })),
                onUpdateAttendance: (sid, k, v) => setAttendance(prev => { const n = [...prev], i = n.findIndex(a => a.studentId === sid); if(i>-1) n[i][k] = v; else n.push({studentId:sid, [k]: v}); return n; }),
                onUpdateExtraDescription: (sid, eid, v) => setStudentExtracurriculars(prev => prev.map(s => s.studentId === sid ? { ...s, descriptions: { ...s.descriptions, [eid]: v } } : s)),
                onUpdateCocurricularManual: (sid, v) => setCocurricularData(prev => ({ ...prev, [sid]: { ...prev[sid], manualDescription: v } })),
                showToast 
            }) :
            activePage === 'PRINT_PIAGAM' ? React.createElement(PrintPiagamPage, { students, settings, grades, subjects, onUpdatePiagamLayout: (l) => setSettings(s => ({...s, piagam_layout: l})), showToast }) :
            activePage === 'PRINT_LEGER' ? React.createElement(PrintLegerPage, { students, settings, grades, subjects, showToast }) :
            activePage === 'JURNAL_FORMATIF' ? React.createElement(JurnalFormatifPage, { students, formativeJournal, onUpdate: (sid, data) => setFormativeJournal(prev => { const next = { ...prev }; if(!next[sid]) next[sid] = []; const idx = next[sid].findIndex(n => n.id === data.id); if(idx > -1) next[sid][idx] = data; else next[sid].push({ ...data, id: Date.now() }); return next; }), onDelete: (sid, id) => setFormativeJournal(prev => ({...prev, [sid]: prev[sid].filter(n => n.id !== id)})), showToast, subjects, grades, settings, predefinedCurriculum }) :
            React.createElement(PlaceholderPage, { title: activePage })
        )
      )
  );
};

export default App;
