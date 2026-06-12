import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import localforage from 'localforage';

localforage.config({
  name: 'ERaporApp',
  version: 1.0,
  storeName: 'erapor_data',
  description: 'E-Rapor Application Data'
});
import * as XLSX from 'xlsx';
import { NAV_ITEMS, COCURRICULAR_DIMENSIONS } from './constants.js';
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
import LockScreen from './components/LockScreen.js';
import { IMAGE_KEYS, loadAllImagesFromDB, saveImageToDB, deleteImageFromDB, processAndCompressImage, getImageDimensions } from './utils/imageDB.js';

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
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '', tanggal_rapor_ganjil: '', tanggal_rapor_genap: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  nip_label_kepala_sekolah: 'NIP', nip_label_wali_kelas: 'NIP',
  cocurricular_theme: '', cocurricular_theme_Genap: '',
  predikats: { a: '90', b: '80', c: '70', d: '0' },
  gradeCalculation: {},
  qualitativeGradingMap: {},
  slmVisibility: {}, 
  kop_layout: [],
  piagam_layout: [],
  nilaiDisplayMode: 'kuantitatif saja', 
  enableExitWarning: false,
  appLock: { enabled: false, pin: '', hint: '', securityQuestion: '', securityAnswer: '' },
  enableAutoRegression: false,
};

const initialStudents = [];
const initialGrades = [];
const initialNotes = {};
const initialCocurricularData = {};
const initialAttendance = [];
const initialStudentExtracurriculars = [];
const initialFormativeJournal = {};
const initialLearningObjectives = {};

const deepMerge = (target, source) => {
    if (typeof target !== 'object' || target === null) return source !== undefined ? source : target;
    if (typeof source !== 'object' || source === null) return source !== undefined ? source : target;
    if (Array.isArray(target) && Array.isArray(source)) return source; // Arrays are replaced entirely by default
    
    let merged = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key] instanceof Object && !Array.isArray(target[key])) {
            merged[key] = deepMerge(target[key], source[key]);
        } else {
            if (source[key] !== undefined) {
                merged[key] = source[key];
            }
        }
    }
    return merged;
};


const loadDataSafeAsync = async (key, fallbackValue, validator = null) => {
    try {
        let val = await localforage.getItem(key);
        if (val === null) {
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    val = parsed;
                    await localforage.setItem(key, parsed);
                } catch(e) {}
            }
        }
        if (val === null) return fallbackValue;

        if (validator && !validator(val)) {
            console.warn(`Data validation failed for key: ${key}. Reverting to fallback.`);
            return fallbackValue;
        }
        if (Array.isArray(fallbackValue) && !Array.isArray(val)) {
            return fallbackValue;
        }
        if (typeof fallbackValue === 'object' && !Array.isArray(fallbackValue) && fallbackValue !== null) {
             return deepMerge(fallbackValue, val);
        }
        return val;
    } catch (e) {
        console.error(`Error loading ${key}:`, e);
        return fallbackValue;
    }
};


const loadDataSafeSync_DEPRECATEDSync_DEPRECATED = (key, fallbackValue, validator = null) => {
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
             return deepMerge(fallbackValue, parsed);
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

const calculateFinalGrade = (detailed, config, settings, subjectId, learningObjectivesMap, gradeKey, curriculumKey, predefinedCurriculum = null) => {
    if (!detailed) return null;
    let finalScore = null;
    const { predikats, qualitativeGradingMap, slmVisibility } = settings;
    const kkm = parseInt(predikats.c, 10);

    const getNumericScore = (score) => {
        if (typeof score === 'number') return score;
        if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
            return qualitativeGradingMap[score];
        }
        return null;
    };
    
    // Filter SLMs based on visibility settings
    const activeSlmIds = slmVisibility?.[subjectId];
    let visibleSlms = activeSlmIds ? (detailed.slm || []).filter(slm => activeSlmIds.includes(slm.id)) : (detailed.slm || []);
    
    const currentSemester = settings.semester || 'Ganjil';
    
    // Filter SLMs by semester if learningObjectives map is provided
    if (learningObjectivesMap && gradeKey && curriculumKey) {
        const objectives = learningObjectivesMap[gradeKey]?.[curriculumKey] || [];
        const slmSemesters = {};
        objectives.forEach(obj => {
             if (obj.slmId) slmSemesters[obj.slmId] = obj.semester || 'Semua';
        });
        
        const preSlms = predefinedCurriculum?.[curriculumKey] || [];
        const preHalf = Math.ceil(preSlms.length / 2);
        
        visibleSlms = visibleSlms.filter(slm => {
             let sem = slmSemesters[slm.id];
             if (!sem && slm.id && slm.id.startsWith('slm_predefined_') && preSlms.length > 0) {
                 const parts = slm.id.split('_');
                 const idx = parseInt(parts[parts.length - 1], 10);
                 if (!isNaN(idx)) {
                     sem = idx < preHalf ? 'Ganjil' : 'Genap';
                 }
             }
             if (!sem) sem = 'Semua';
             return sem === 'Semua' || sem === currentSemester;
        });
    }

    const isGenap = currentSemester === 'Genap';
    const stsField = isGenap ? 'sts2' : 'sts1';
    const sasField = isGenap ? 'sas2' : 'sas1';
    
    const stsVal = (detailed[stsField] !== undefined) ? detailed[stsField] : (isGenap ? null : detailed.sts);
    const sasVal = (detailed[sasField] !== undefined) ? detailed[sasField] : (isGenap ? null : detailed.sas);
    
    if (config.method === 'rata-rata') {
        const slmAvgScores = visibleSlms.map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const stsScore = getNumericScore(stsVal);
        const sasScore = getNumericScore(sasVal);
        
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

        visibleSlms.forEach(slm => {
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
        
        const stsScore = getNumericScore(stsVal);
        if (stsScore !== null && stsWeight > 0) {
            totalWeightedScore += stsScore * (stsWeight / 100);
            totalWeightUsed += stsWeight;
        }

        const sasScore = getNumericScore(sasVal);
        if (sasScore !== null && sasWeight > 0) {
            totalWeightedScore += sasScore * (sasWeight / 100);
            totalWeightUsed += sasWeight;
        }
        
        finalScore = totalWeightUsed > 0 ? totalWeightedScore : null;

    } else if (config.method === 'persentase' && !isNaN(kkm)) {
        const slmAvgScores = visibleSlms.map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const allSummatives = [...slmAvgScores];
        const stsScore = getNumericScore(stsVal);
        const sasScore = getNumericScore(sasVal);
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
  useServiceWorker();
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
  const [activeNilaiTab, setActiveNilaiTab] = useState('keseluruhan'); 
  const { isMobile } = useWindowDimensions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
    
  const isInitialMount = useRef(true);

  const [isERaporModalOpen, setIsERaporModalOpen] = useState(false);

  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
     let isMounted = true;
     const initializeAllData = async () => {
         const settingsData = await loadDataSafeAsync("appSettings", initialSettings);
         let unlocked = true;
         if (settingsData?.appLock?.enabled && settingsData?.appLock?.pin?.length === 6) {
             unlocked = sessionStorage.getItem('appUnlocked') === 'true';
         }
         const studentsData = await loadDataSafeAsync("appStudents", initialStudents, Array.isArray);
         const gradesData = await loadDataSafeAsync("appGrades", initialGrades, Array.isArray);
         const notesData = await loadDataSafeAsync("appNotes", initialNotes);
         const cocurricularDataData = await loadDataSafeAsync("appCocurricularData", initialCocurricularData);
         
         let attendanceData = await loadDataSafeAsync("appAttendance", initialAttendance, Array.isArray);
         attendanceData = attendanceData.map(att => ({
             studentId: att.studentId,
             semester: att.semester || "Ganjil",
             sakit: (att.sakit === 0 || att.sakit) ? Number(att.sakit) : null,
             izin: (att.izin === 0 || att.izin) ? Number(att.izin) : null,
             alpa: (att.alpa === 0 || att.alpa) ? Number(att.alpa) : null
         }));

         const extracurricularsData = await loadDataSafeAsync("appExtracurriculars", [], Array.isArray);
         const studentExData = await loadDataSafeAsync("appStudentExtracurriculars", initialStudentExtracurriculars, Array.isArray);
         
         const loadedSubjects = await loadDataSafeAsync("appSubjects", defaultSubjects, Array.isArray);
         const newSubjects = [...loadedSubjects];
         let hasUpdates = false;
         defaultSubjects.forEach(ds => {
             if (!newSubjects.find(s => s.id === ds.id)) {
                 newSubjects.push({...ds, active: false});
                 hasUpdates = true;
             }
         });
         newSubjects.forEach(s => {
             const ds = defaultSubjects.find(d => d.id === s.id);
             if (ds && (!s.curriculumKey || s.curriculumKey !== ds.curriculumKey)) {
                 s.curriculumKey = ds.curriculumKey;
                 hasUpdates = true;
             }
         });
         if (hasUpdates) await localforage.setItem("appSubjects", newSubjects);

         const loData = await loadDataSafeAsync("appLearningObjectives", initialLearningObjectives);
         const fjData = await loadDataSafeAsync("appFormativeJournal", initialFormativeJournal);

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
     return () => { isMounted = false; };
  }, []);


const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
      const initImages = async () => {
          const updates = {};
          
          // 1. Check for Base64 images in localStorage and migrate them
          for (const key of IMAGE_KEYS) {
              if (settings[key] && typeof settings[key] === 'string' && settings[key].startsWith('data:image')) {
                  try {
                      const res = await fetch(settings[key]);
                      const blob = await res.blob();
                      const dims = getImageDimensions(key);
                      const compressedBlob = await processAndCompressImage(blob, dims.width, dims.height);
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
              setSettings(prev => ({ ...prev, ...updates }));
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
  const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);

  const showToast = useCallback((message, type) => { setToast({ message, type }); }, []);
  
    const handleSettingsChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    if (type === 'remove_image') {
        deleteImageFromDB(name).then(() => {
            setSettings(prev => ({ ...prev, [name]: null }));
        }).catch(err => {
            console.error("Failed to delete image", err);
            showToast("Gagal menghapus gambar", "error");
        });
        return;
    }
    if (type === 'file') {
        const file = files && files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast("File harus berupa gambar", "error");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("Ukuran gambar terlalu besar. Maksimal 5MB.", "error");
                return;
            }
            const dims = getImageDimensions(name);
            processAndCompressImage(file, dims.width, dims.height)
                .then(blob => {
                    saveImageToDB(name, blob).then(() => {
                        const objectUrl = URL.createObjectURL(blob);
                        setSettings(prev => ({ ...prev, [name]: objectUrl }));
                    });
                })
                .catch(err => {
                    console.error("Failed to process image", err);
                    showToast("Gagal memproses gambar", "error");
                });
        }
        return;
    }
    if (type === 'file_processed') {
        fetch(value)
            .then(res => res.blob())
            .then(blob => {
                 const dims = getImageDimensions(name);
                 return processAndCompressImage(blob, dims.width, dims.height);
            })
            .then(compressedBlob => {
                 saveImageToDB(name, compressedBlob).then(() => {
                     const objectUrl = URL.createObjectURL(compressedBlob);
                     setSettings(prev => ({ ...prev, [name]: objectUrl }));
                 });
            })
            .catch(err => {
                console.error("Failed to save processed image", err);
                showToast("Gagal menyimpan gambar", "error");
            });
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
                      const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || '5'}`;
                      const curriculumKey = subj.curriculumKey || subj.fullName;
                      const calculated = calculateFinalGrade(detailed, config, settings, subj.id, learningObjectives, gradeKey, curriculumKey, predefinedCurriculum);
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
  }, [settings.gradeCalculation, settings.predikats, settings.qualitativeGradingMap, settings.slmVisibility, settings.semester, settings.nama_kelas, learningObjectives, subjects, predefinedCurriculum]);

  const learningObjectivesRef = useRef(learningObjectives);
  useEffect(() => { learningObjectivesRef.current = learningObjectives; }, [learningObjectives]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const response = await fetch('/presets.json');
                if (!response.ok) throw new Error('Failed to fetch presets');
                const presetsData = await response.json();
                setExtracurriculars(prev => prev.length === 0 ? presetsData.extracurriculars || [] : prev);
            } catch (error) {
                console.error("Error initialization:", error);
            } finally { setIsLoading(false); }
        };
        initializeApp();
    }, []);
































































































































































































































































































































    
  const exportToExcelBlob = useCallback(async () => {
    if (typeof XLSX === "undefined") return null;
    try {
        const wb = XLSX.utils.book_new();
        // --- NEW RELATIONAL DB EXPORT (Format 2) ---
        const currentSem = settings.semester || "Ganjil";
        const currentTA = settings.tahun_ajaran || "2023/2024";

        const sortRelationalRows = (rows, compareRest = null) => {
            if (!rows || rows.length <= 1) return rows;
            const header = rows[0];
            const dataRows = rows.slice(1);
            dataRows.sort((a, b) => {
                // TA (Tahun Ajaran) is index 0 - descending
                const taA = String(a[0] || "");
                const taB = String(b[0] || "");
                if (taA !== taB) {
                    return taB.localeCompare(taA);
                }
                
                // Semester is index 1 - descending ("Genap" before "Ganjil")
                const semA = String(a[1] || "");
                const semB = String(b[1] || "");
                const weightA = semA === "Genap" ? 2 : (semA === "Ganjil" ? 1 : 0);
                const weightB = semB === "Genap" ? 2 : (semB === "Ganjil" ? 1 : 0);
                if (weightA !== weightB) {
                    return weightB - weightA;
                }
                
                if (compareRest) {
                    return compareRest(a, b);
                }
                
                // Default stable/tidying sorting: Key/Student ID is index 2 - ascending
                const idA = String(a[2] || "");
                const idB = String(b[2] || "");
                return idA.localeCompare(idB);
            });
            return [header, ...dataRows];
        };

        let rSettings = [ ["TA", "Semester", "Key", "Value"] ];
        Object.entries(settings).forEach(([k,v]) => {
           if (typeof v === "object") rSettings.push([currentTA, currentSem, k, JSON.stringify(v)]);
           else rSettings.push([currentTA, currentSem, k, v]);
        });
        rSettings = sortRelationalRows(rSettings);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rSettings), "_Settings");

        let rStudents = [ ["TA", "Semester", "ID", "NIS", "NISN", "Nama", "L/P", "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat"] ];
        students.forEach(s => rStudents.push([currentTA, currentSem, s.id, s.nis, s.nisn, s.namaLengkap, s.jenisKelamin, s.tempatLahir, s.tanggalLahir, s.agama, s.alamat]));
        rStudents = sortRelationalRows(rStudents);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rStudents), "_Students");

        let rGrades = [ ["TA", "Semester", "Student ID", "Subject ID", "Category", "Score"] ];
        grades.forEach(g => {
            Object.entries(g.detailedGrades || {}).forEach(([subId, detail]) => {
                const subDetail = detail || {};
                rGrades.push([currentTA, currentSem, g.studentId, subId, "STS1", subDetail.sts1 || ""]);
                rGrades.push([currentTA, currentSem, g.studentId, subId, "SAS1", subDetail.sas1 || ""]);
                rGrades.push([currentTA, currentSem, g.studentId, subId, "STS2", subDetail.sts2 || ""]);
                rGrades.push([currentTA, currentSem, g.studentId, subId, "SAS2", subDetail.sas2 || ""]);
                (subDetail.slm || []).forEach((slm, i) => {
                    const avg = slm.scores && slm.scores.length > 0 ? slm.scores.reduce((a, b) => a + (typeof b==="number"?b:0), 0) / slm.scores.length : "";
                    rGrades.push([currentTA, currentSem, g.studentId, subId, "SLM_" + slm.id, avg]);
                });
            });
        });
        rGrades = sortRelationalRows(rGrades, (a, b) => {
            const idA = String(a[2] || "");
            const idB = String(b[2] || "");
            if (idA !== idB) return idA.localeCompare(idB);
            const subA = String(a[3] || "");
            const subB = String(b[3] || "");
            if (subA !== subB) return subA.localeCompare(subB);
            const catA = String(a[4] || "");
            const catB = String(b[4] || "");
            return catA.localeCompare(catB);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rGrades), "_Nilai");
        
        let rAbsensi = [ ["TA", "Semester", "Student ID", "Sakit", "Izin", "Alpa"] ];
        attendance.forEach(a => rAbsensi.push([currentTA, a.semester || currentSem, a.studentId, a.sakit, a.izin, a.alpa]));
        rAbsensi = sortRelationalRows(rAbsensi);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rAbsensi), "_Absensi");

        let rEkskul = [ ["TA", "Semester", "Student ID", "Ekskul ID", "Deskripsi"] ];
        studentExtracurriculars.forEach(se => {
             Object.entries(se.descriptions || {}).forEach(([eid, desc]) => {
                 rEkskul.push([currentTA, se.semester || currentSem, se.studentId, eid, desc]);
             });
        });
        rEkskul = sortRelationalRows(rEkskul, (a, b) => {
            const idA = String(a[2] || "");
            const idB = String(b[2] || "");
            if (idA !== idB) return idA.localeCompare(idB);
            const exA = String(a[3] || "");
            const exB = String(b[3] || "");
            return exA.localeCompare(exB);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rEkskul), "_Ekskul");

        return new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/octet-stream" });
    } catch (e) {
        console.error("Export Error Format 2:", e);
        return null;
    }
  }, [settings, students, grades, attendance, studentExtracurriculars]);



  const parseExcelBlob = useCallback(async (blob) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        let news = { ...initialSettings }, nStud = [], nAtt = [], nNot = {}, nStEx = [], nCo = {}, nGr = [], nSub = [...defaultSubjects], nEx = [], nLO = {}, nFJ = {};
        
        const findSheet = (names) => { for (const name of names) { const found = workbook.SheetNames.find(sn => sn.toLowerCase().trim() === name.toLowerCase() || sn.toLowerCase().trim() === name.toLowerCase().replace(/\s/g, "_")); if (found) return workbook.Sheets[found]; } return null; };
        
        const rSettingsSheet = workbook.Sheets["_Settings"];
        if (rSettingsSheet) {
            const currentTA = settings.tahun_ajaran || "2023/2024";
            const currentSem = settings.semester || "Ganjil";
            const data = XLSX.utils.sheet_to_json(rSettingsSheet, { header: 1 });
            data.slice(1).forEach(r => {
                if (r[0] === currentTA && r[1] === currentSem && r[2]) {
                    try { news[r[2]] = JSON.parse(r[3]); } catch(e) { news[r[2]] = r[3]; }
                }
            });
            
            const rStudentsSheet = workbook.Sheets["_Students"];
            if (rStudentsSheet) {
                 nStud = [];
                 XLSX.utils.sheet_to_json(rStudentsSheet, {header: 1}).slice(1).forEach(r => {
                     if (r[0] === currentTA && r[1] === currentSem) {
                         nStud.push({ id: r[2], nis: r[3], nisn: r[4], namaLengkap: r[5], jenisKelamin: r[6], tempatLahir: r[7], tanggalLahir: r[8], agama: r[9], alamat: r[10] });
                     }
                 });
            }
            
            const rGradesSheet = workbook.Sheets["_Nilai"];
            if (rGradesSheet) {
                 nGr = [];
                 const gradeMap = {};
                 XLSX.utils.sheet_to_json(rGradesSheet, {header: 1}).slice(1).forEach(r => {
                     if (r[0] === currentTA && r[1] === currentSem && r[2] && r[3] && r[4]) {
                         const studentId = r[2];
                         const subId = r[3];
                         const category = r[4];
                         const score = r[5] === "" ? "" : Number(r[5]);
                         
                         if (!gradeMap[studentId]) gradeMap[studentId] = { studentId, semester: currentSem, detailedGrades: {} };
                         if (!gradeMap[studentId].detailedGrades[subId]) gradeMap[studentId].detailedGrades[subId] = { slm: [] };
                         
                         const detail = gradeMap[studentId].detailedGrades[subId];
                         if (category === "STS1") detail.sts1 = score;
                         else if (category === "SAS1") detail.sas1 = score;
                         else if (category === "STS2") detail.sts2 = score;
                         else if (category === "SAS2") detail.sas2 = score;
                         else if (category.startsWith("SLM_")) {
                             const id = category.replace("SLM_", "");
                             detail.slm.push({ id, scores: score !== "" ? [score] : [], score: score });
                         }
                     }
                 });
                 nGr = Object.values(gradeMap);
            }

            const rAbsensiSheet = workbook.Sheets["_Absensi"];
            if (rAbsensiSheet) {
                nAtt = [];
                XLSX.utils.sheet_to_json(rAbsensiSheet, {header: 1}).slice(1).forEach(r => {
                    if (r[0] === currentTA && r[1] === currentSem && r[2]) {
                        nAtt.push({ studentId: r[2], semester: currentSem, sakit: r[3], izin: r[4], alpa: r[5] });
                    }
                });
            }

            const rEkskulSheet = workbook.Sheets["_Ekskul"];
            if (rEkskulSheet) {
                 nStEx = [];
                 const exMap = {};
                 XLSX.utils.sheet_to_json(rEkskulSheet, {header: 1}).slice(1).forEach(r => {
                     if (r[0] === currentTA && r[1] === currentSem && r[2] && r[3]) {
                         const studentId = r[2];
                         const ekskulId = r[3];
                         const desc = r[4] || "";
                         
                         if (!exMap[studentId]) exMap[studentId] = { studentId, semester: currentSem, descriptions: {} };
                         exMap[studentId].descriptions[ekskulId] = desc;
                         
                         // ensure nEx has this ID just in case
                         if (!nEx.find(e => e.id === ekskulId)) nEx.push({ id: ekskulId, name: ekskulId });
                     }
                 });
                 nStEx = Object.values(exMap);
            }

        }


        const wsAset = findSheet(["Aset Gambar", "Images", "Assets"]);
        const assetMap = {};
        if (wsAset) {
            const assetData = XLSX.utils.sheet_to_json(wsAset, { header: 1 });
            const chunksByKey = {};
            assetData.forEach(row => { const keyPart = row[0], data = row[1]; if (keyPart && data) { const match = keyPart.match(/^(.*)_part_(\d+)$/); if (match) { const realKey = match[1], idx = parseInt(match[2], 10); if (!chunksByKey[realKey]) chunksByKey[realKey] = []; chunksByKey[realKey][idx] = data; } } });
            Object.entries(chunksByKey).forEach(([key, chunks]) => { assetMap[key] = chunks.join(''); });
        }
        const wsMapel = findSheet(["Mata Pelajaran"]);
        if (wsMapel) { const rawMapel = XLSX.utils.sheet_to_json(wsMapel); nSub = defaultSubjects.map(ds => { const found = rawMapel.find(r => r['.'] === ds.id || r['ID'] === ds.id); if (found) return { ...ds, active: found['Status Aktif'] === 'Aktif', curriculumKey: found['Kunci Kurikulum'] || ds.fullName }; return ds; }); rawMapel.forEach(r => { const id = r['.'] || r['ID']; if (id && !defaultSubjects.some(ds => ds.id === id)) nSub.push({ id, fullName: r['Nama Lengkap'] || r['Nama Mata Pelajaran'] || id, label: r['Singkatan'] || id, active: r['Status Aktif'] === 'Aktif', curriculumKey: r['Kunci Kurikulum'] || r['Nama Lengkap'] }); }); }
        const wsP = findSheet(["Pengaturan", "Settings", "Info Sekolah"]);
        if (wsP) {
            const data = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            data.forEach(r => {
                if (r[0] && r[0] !== 'ID Mata Pelajaran') { 
                    let key = String(r[0]);
                    if (key === 'cocurricular_theme_Ganjil') key = 'cocurricular_theme';
                    if (['__proto__', 'constructor', 'prototype'].includes(key)) return;
                    
                    if (['A', 'B', 'C', 'D'].includes(key.toUpperCase())) {
                        news.predikats[key.toLowerCase()] = String(r[1]); 
                    } else if (key === 'kop_layout' || key === 'piagam_layout' || key === 'kop_layout_Genap' || key === 'piagam_layout_Genap' || key === 'appLock') {
                        try {
                            news[key] = typeof r[1] === 'string' ? JSON.parse(r[1]) : r[1];
                        } catch (e) {
                            console.warn(`Failed parsing ${key}`, e);
                            news[key] = key === 'appLock' ? { enabled: false, pin: '', hint: '', securityQuestion: '', securityAnswer: '' } : [];
                        }
                    } else if (key in news) {
                        if (typeof initialSettings[key] === 'boolean') {
                            news[key] = r[1] === 'true' || r[1] === true;
                        } else {
                            news[key] = r[1] !== undefined ? r[1] : ''; 
                        }
                    }
                }
                const subjectId = r[0]; if (nSub.some(ds => ds.id === subjectId)) { try { const weights = r[2] ? JSON.parse(r[2]) : {}, visibility = r[3] ? JSON.parse(r[3]) : []; if (!news.gradeCalculation) news.gradeCalculation = {}; news.gradeCalculation[subjectId] = { method: r[1] || 'rata-rata', weights }; if (!news.slmVisibility) news.slmVisibility = {}; news.slmVisibility[subjectId] = visibility; } catch (e) { console.warn("Failed parsing config for", subjectId, e); } }
            });
            
            // Recalculate qualitativeGradingMap based on imported predikats
            const valA = parseInt(news.predikats.a, 10);
            const valB = parseInt(news.predikats.b, 10);
            const valC = parseInt(news.predikats.c, 10);
            if (!isNaN(valA) && !isNaN(valB) && !isNaN(valC)) {
                news.qualitativeGradingMap = {
                    SB: Math.round((valA + 100) / 2),
                    BSH: Math.round((valB + valA - 1) / 2),
                    MB: Math.round((valC + valB - 1) / 2),
                    BB: Math.round((0 + valC - 1) / 2),
                };
            }
            
            news = { ...news, ...assetMap };
        }
        const wsEkstraDef = findSheet(["Ekstrakurikuler"]);
        if (wsEkstraDef) nEx = XLSX.utils.sheet_to_json(wsEkstraDef).map(r => ({ id: r['ID Unik (Jangan Diubah)'], name: r['Nama Ekstrakurikuler'], active: r['Status Aktif'] === 'Aktif' }));
                const wsFoto = findSheet(["Foto Siswa"]);
        const fotoSiswaMap = {};
        if (wsFoto) {
            const fotoData = XLSX.utils.sheet_to_json(wsFoto, { header: 1 });
            const chunksById = {};
            fotoData.forEach(row => {
                const idSiswa = row[0] ? String(row[0]) : '';
                const partIdx = parseInt(row[1], 10);
                const data = row[2];
                if (idSiswa && idSiswa !== 'ID Siswa' && data) {
                    if (!chunksById[idSiswa]) chunksById[idSiswa] = [];
                    chunksById[idSiswa][partIdx] = data;
                }
            });
            Object.entries(chunksById).forEach(([id, chunks]) => {
                fotoSiswaMap[id] = chunks.join('');
            });
        }
        const wsS = findSheet(["Daftar Siswa", "Students", "Siswa", "Data Siswa"]);
        if (wsS) nStud = XLSX.utils.sheet_to_json(wsS).map((s, idx) => {
            const sid = String(s['ID Siswa (Otomatis)'] || s['ID Siswa'] || s['ID'] || `s_${Date.now()}_${idx}`);
            return {
                id: sid,
                foto: fotoSiswaMap[sid] || '',
                namaLengkap: s['Nama Lengkap'] != null ? String(s['Nama Lengkap']) : '',
                namaPanggilan: s['Nama Panggilan'] != null ? String(s['Nama Panggilan']) : '',
                nis: s['NIS'] != null ? String(s['NIS']) : '',
                nisn: s['NISN'] != null ? String(s['NISN']) : '',
                ttl: s['Tempat, Tanggal Lahir'] != null ? String(s['Tempat, Tanggal Lahir']) : '',
                jenisKelamin: s['Jenis Kelamin'] != null ? String(s['Jenis Kelamin']) : '',
                agama: s['Agama'] != null ? String(s['Agama']) : '',
                asalTk: s['Asal TK'] != null ? String(s['Asal TK']) : '',
                alamatSiswa: s['Alamat Siswa'] != null ? String(s['Alamat Siswa']) : '',
                diterimaDiKelas: s['Diterima di Kelas'] != null ? String(s['Diterima di Kelas']) : '',
                diterimaTanggal: s['Diterima Tanggal'] != null ? String(s['Diterima Tanggal']) : '',
                namaAyah: s['Nama Ayah'] != null ? String(s['Nama Ayah']) : '',
                namaIbu: s['Nama Ibu'] != null ? String(s['Nama Ibu']) : '',
                pekerjaanAyah: s['Pekerjaan Ayah'] != null ? String(s['Pekerjaan Ayah']) : '',
                pekerjaanIbu: s['Pekerjaan Ibu'] != null ? String(s['Pekerjaan Ibu']) : '',
                alamatOrangTua: s['Alamat Orang Tua'] != null ? String(s['Alamat Orang Tua']) : '',
                teleponOrangTua: s['Telepon Orang Tua'] != null ? String(s['Telepon Orang Tua']) : '',
                namaWali: s['Nama Wali'] != null ? String(s['Nama Wali']) : '',
                pekerjaanWali: s['Pekerjaan Wali'] != null ? String(s['Pekerjaan Wali']) : '',
                alamatWali: s['Alamat Wali'] != null ? String(s['Alamat Wali']) : '',
                teleponWali: s['Telepon Wali'] != null ? String(s['Telepon Wali']) : ''
            };
        });
        const wsTP = findSheet(["Tujuan Pembelajaran"]);
        const slmNameMap = new Map();
        if (wsTP) { const tpData = XLSX.utils.sheet_to_json(wsTP); const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '?'}`; nLO[gradeKey] = {}; tpData.forEach(row => { const subjName = row['Nama Mata Pelajaran'], slmId = row['ID SLM'], slmName = row['Nama SLM']; if (slmId && slmName && !slmNameMap.has(slmId)) slmNameMap.set(slmId, slmName); if (subjName) { if (!nLO[gradeKey][subjName]) nLO[gradeKey][subjName] = []; nLO[gradeKey][subjName].push({ slmId, text: row['Deskripsi Tujuan Pembelajaran (TP)'], isEdited: true, semester: row['Semester'] || news.semester || 'Ganjil' }); } }); }
        nGr = nStud.map(st => ({ studentId: st.id, detailedGrades: {}, finalGrades: {} }));
        workbook.SheetNames.forEach(name => { 
            if (name.startsWith("Nilai_")) { 
                const subIdRaw = name.split('_')[1]; 
                let subId = subIdRaw; 
                if (subId === 'Blng' && !nSub.some(s => s.id === 'Blng') && nSub.some(s => s.id === 'BIng')) subId = 'BIng'; 
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]); 
                rows.forEach(row => { 
                    const sid = String(row['ID Siswa'] || row['ID'] || row['a'] || '').trim(); 
                    let entry = nGr.find(g => g.studentId === sid); 
                    if (!entry) entry = nGr.find(g => g.studentId === 'student' + sid); 
                    if (!entry) entry = nGr.find(g => g.studentId.endsWith(sid) || sid.endsWith(g.studentId)); 
                    if (entry) { 
                        if (!entry.detailedGrades[subId]) {
                            entry.detailedGrades[subId] = { 
                                slm: [], 
                                sts1: null,
                                sts2: null,
                                sas1: null,
                                sas2: null,
                                descriptions: { highest: '', lowest: '' },
                                descriptions_Genap: { highest: '', lowest: '' } 
                            };
                        }
                        const detailed = entry.detailedGrades[subId];
                        
                        // Handle legacy "STS" / "SAS"
                        if (row['STS'] !== undefined) detailed.sts1 = row['STS'];
                        if (row['SAS'] !== undefined) detailed.sas1 = row['SAS'];
                        
                        // Handle explicit columns
                        if (row['STS 1 (Ganjil)'] !== undefined) detailed.sts1 = row['STS 1 (Ganjil)'];
                        if (row['SAS 1 (Ganjil)'] !== undefined) detailed.sas1 = row['SAS 1 (Ganjil)'];
                        if (row['STS 2 (Genap)'] !== undefined) detailed.sts2 = row['STS 2 (Genap)'];
                        if (row['SAS 2 (Genap)'] !== undefined) detailed.sas2 = row['SAS 2 (Genap)'];

                        // Handle legacy descriptions
                        if (row['Deskripsi Tinggi'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.highest = row['Deskripsi Tinggi'];
                        }
                        if (row['Deskripsi Rendah'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.lowest = row['Deskripsi Rendah'];
                        }

                        // Handle explicit descriptions
                        if (row['Deskripsi Tinggi (Ganjil)'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.highest = row['Deskripsi Tinggi (Ganjil)'];
                        }
                        if (row['Deskripsi Rendah (Ganjil)'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.lowest = row['Deskripsi Rendah (Ganjil)'];
                        }
                        
                        if (row['Deskripsi Tinggi (Genap)'] !== undefined) {
                            if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                            detailed.descriptions_Genap.highest = row['Deskripsi Tinggi (Genap)'];
                        }
                        if (row['Deskripsi Rendah (Genap)'] !== undefined) {
                            if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                            detailed.descriptions_Genap.lowest = row['Deskripsi Rendah (Genap)'];
                        }
                        Object.keys(row).forEach(rawH => { 
                            const h = rawH.trim(), match = h.match(/^(.*)_TP(\d+)$/); 
                            if (match) { 
                                const slmId = match[1], tpIdx = parseInt(match[2]) - 1; 
                                let slm = detailed.slm.find(s => s.id === slmId); 
                                if (!slm) { slm = { id: slmId, name: slmNameMap.get(slmId) || 'Lingkup Materi Kustom', scores: [] }; detailed.slm.push(slm); } 
                                slm.scores[tpIdx] = row[rawH]; 
                            } 
                        }); 
                    } 
                }); 
            } 
        });
        const wsAtt = findSheet(["Absensi"]);
        if (wsAtt) nAtt = XLSX.utils.sheet_to_json(wsAtt).map(r => ({ studentId: String(r['ID Siswa']), semester: r['Semester'] || 'Ganjil', sakit: r['Sakit'], izin: r['Izin'], alpa: r['Alpa'] }));
        const wsDE = findSheet(["Data Ekstra"]);
        if (wsDE) { 
            const deData = XLSX.utils.sheet_to_json(wsDE), map = {}; 
            deData.forEach(row => { 
                const sid = String(row['ID Siswa']);
                const sem = row['Semester'] || 'Ganjil';
                const key = `${sid}_${sem}`;
                if (!map[key]) map[key] = { studentId: sid, semester: sem, assignedActivities: [], descriptions: {} }; 
                const idx = (row['Urutan Ekstra'] || 1) - 1;
                const actId = row['ID Ekstrakurikuler'];
                const desc = row['Deskripsi'];
                map[key].assignedActivities[idx] = actId; 
                if (actId) map[key].descriptions[actId] = desc; 
            }); 
            nStEx = Object.values(map); 
        }
        const wsKo = findSheet(["Data Kokurikuler"]);
        if (wsKo) { 
            const koData = XLSX.utils.sheet_to_json(wsKo); 
            koData.forEach(row => { 
                const sid = String(row['ID Siswa']);
                const sem = row['Semester'] || 'Ganjil';
                const fieldName = sem === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
                if (!nCo[sid]) nCo[sid] = {};
                const ratings = nCo[sid][fieldName] || {};
                COCURRICULAR_DIMENSIONS.forEach(dim => { 
                    if (row[dim.id] || row[dim.label]) ratings[dim.id] = row[dim.id] || row[dim.label]; 
                }); 
                if (row['Deskripsi Manual'] !== undefined) {
                    ratings.manualDescription = row['Deskripsi Manual'];
                }
                nCo[sid][fieldName] = ratings;
            }); 
        }
        const wsCat = findSheet(["Catatan Wali Kelas"]);
        if (wsCat) XLSX.utils.sheet_to_json(wsCat).forEach(row => { 
            const sid = String(row['ID Siswa']); 
            const sem = row['Semester'] || 'Ganjil';
            const key = sem === 'Genap' ? `${sid}_Genap` : sid;
            nNot[key] = row['Catatan Wali Kelas']; 
        });
        const wsJF = findSheet(["Jurnal Formatif"]);
        if (wsJF) { const jfData = XLSX.utils.sheet_to_json(wsJF); jfData.forEach(row => { const sid = String(row['ID Siswa']); if (!nFJ[sid]) nFJ[sid] = []; nFJ[sid].push({ id: row['ID Catatan'] || Date.now(), date: row['Tanggal'], type: row['Tipe'], subjectId: row['Mapel ID'], slmId: row['SLM ID'], tpId: row['TP ID'], topic: row['Topik'], note: row['Isi Catatan'], semester: row['Semester'] || 'Ganjil' }); }); }
        nGr.forEach(studentGrade => { nSub.forEach(subj => { 
            const detailed = studentGrade.detailedGrades[subj.id]; 
            if (detailed) {
                const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '5'}`;
                const curriculumKey = subj.curriculumKey || subj.fullName;
                studentGrade.finalGrades[subj.id] = calculateFinalGrade(detailed, news.gradeCalculation?.[subj.id] || { method: 'rata-rata' }, news, subj.id, nLO, gradeKey, curriculumKey, predefinedCurriculum);
            }
        }); });
        return { settings: news, students: nStud, attendance: nAtt, notes: nNot, studentExtracurriculars: nStEx, cocurricularData: nCo, grades: nGr, subjects: nSub, extracurriculars: nEx, learningObjectives: nLO, formativeJournal: nFJ };
    }, [predefinedCurriculum]);

    const importFromExcelBlob = useCallback(async (blob) => {
        setIsLoading(true);
        try {
            const d = await parseExcelBlob(blob);
            
            // Process images from imported settings
            const settingsToApply = { ...d.settings };
            for (const key of IMAGE_KEYS) {
                if (settingsToApply[key] && typeof settingsToApply[key] === 'string' && settingsToApply[key].startsWith('data:image')) {
                    try {
                        const res = await fetch(settingsToApply[key]);
                        const imgBlob = await res.blob();
                        const dims = getImageDimensions(key);
                        const compressedBlob = await processAndCompressImage(imgBlob, dims.width, dims.height);
                        await saveImageToDB(key, compressedBlob);
                        settingsToApply[key] = URL.createObjectURL(compressedBlob);
                    } catch (e) {
                        console.error(`Failed to process and save imported image ${key} to DB`, e);
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
        link.download = getDynamicRKTFileName(settings) + ".xlsx";
        link.click();
        showToast('File berhasil diunduh (Format Lengkap)!', 'success');
    }, [exportToExcelBlob, settings, showToast]);

    

    const handleImportAll = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) {
                // 10MB limit
                if (file.size > 10 * 1024 * 1024) {
                    showToast('Ukuran file terlalu besar. Maksimal 10MB.', 'error');
                    return;
                }
                importFromExcelBlob(file);
            }
        };
        input.click();
    }, [importFromExcelBlob, showToast]);

    useEffect(() => { 
        const settingsToSave = { ...settings };
        IMAGE_KEYS.forEach(key => {
            if (settingsToSave[key] && typeof settingsToSave[key] === 'string' && settingsToSave[key].startsWith('blob:')) {
                delete settingsToSave[key];
            }
        });
        if (isDataLoaded) localforage.setItem('appSettings', settingsToSave); 
    }, [settings]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appStudents', students); }, [students, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appGrades', grades); }, [grades, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appNotes', notes); }, [notes, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appAttendance', attendance); }, [attendance, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appCocurricularData', cocurricularData); }, [cocurricularData, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appStudentExtracurriculars', studentExtracurriculars); }, [studentExtracurriculars, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appSubjects', subjects); }, [subjects, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appExtracurriculars', extracurriculars); }, [extracurriculars, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appLearningObjectives', learningObjectives); }, [learningObjectives, isDataLoaded]);
    useEffect(() => { if (isDataLoaded) localforage.setItem('appFormativeJournal', formativeJournal); }, [formativeJournal, isDataLoaded]);
    
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

  const isLocked = settings.appLock?.enabled && settings.appLock?.pin?.length === 6 && !isUnlocked;

  return React.createElement(React.Fragment, null,
      toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }),
      isLocked ? React.createElement(LockScreen, {
          appLock: settings.appLock,
          onUnlock: () => {
              sessionStorage.setItem('appUnlocked', 'true');
              setIsUnlocked(true);
          }
      }) : React.createElement(React.Fragment, null,
          isERaporModalOpen && React.createElement(ERaporProcessorModal, {
              onClose: () => setIsERaporModalOpen(false),
              students, grades, subjects, settings, showToast, predefinedCurriculum, learningObjectives
          }),
          React.createElement('div', { className: "flex flex-col xl:flex-row h-[100dvh] w-full bg-slate-100 overflow-hidden" },
            React.createElement(Navigation, { 
                activePage, setActivePage: handleNavigate, onExport: handleExportAll,
                onImport: handleImportAll,
                onIsiERapor: () => setIsERaporModalOpen(true),
                isMobile, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName: NAV_ITEMS.find(i => i.id === activePage)?.label || 'Dashboard' 
            }),
            React.createElement('main', { ref: mainRef, className: "flex-1 flex flex-col min-h-0 min-w-0 overflow-auto px-4 pb-4 sm:px-8 sm:pb-8 pt-0" }, 
            isLoading ? "Memuat..." : 
            activePage === 'DASHBOARD' ? React.createElement(Dashboard, { setActivePage: handleNavigate, settings, students, grades, subjects, notes, attendance, studentExtracurriculars, cocurricularData, onNavigateToNilai: (id) => { setActiveNilaiTab(id); handleNavigate('DATA_NILAI'); } }) :
            activePage === 'PANDUAN' ? React.createElement(PanduanPage, { setActivePage: handleNavigate }) :
            activePage === 'DATA_SISWA' ? React.createElement(DataSiswaPage, { 
                students, 
                namaKelas: settings.nama_kelas, 
                onBulkSaveStudents: setStudents, 
                onDeleteStudent: id => {
                    setStudents(prev => prev.filter(s => s.id !== id));
                    setGrades(prev => prev.filter(g => g.studentId !== id));
                    setAttendance(prev => prev.filter(a => a.studentId !== id));
                    setNotes(prev => { const newNotes = {...prev}; delete newNotes[id]; return newNotes; });
                    setStudentExtracurriculars(prev => prev.filter(e => e.studentId !== id));
                    setCocurricularData(prev => { const newData = {...prev}; delete newData[id]; return newData; });
                    setFormativeJournal(prev => { const newJournal = {...prev}; delete newJournal[id]; return newJournal; });
                }, 
                showToast 
            }) :
            activePage === 'DATA_NILAI' ? React.createElement(DataNilaiPage, { 
                students, grades, settings, 
                onBulkUpdateGrades: (u) => setGrades(prev => {
                    // Create a map of updates by studentId for faster lookup
                    const updateMap = {};
                    u.forEach(x => {
                        updateMap[x.studentId] = x;
                    });
                    
                    const next = prev.map(item => {
                        const update = updateMap[item.studentId];
                        if (update) {
                            const newDetailedGrades = {
                                ...item.detailedGrades,
                                [update.subjectId]: update.newDetailedGrade
                            };
                            const subject = subjects.find(s => s.id === update.subjectId);
                            const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || '5'}`;
                            const curriculumKey = subject ? (subject.curriculumKey || subject.fullName) : null;
                            const newFinalGrades = {
                                ...item.finalGrades,
                                [update.subjectId]: calculateFinalGrade(update.newDetailedGrade, settings.gradeCalculation[update.subjectId] || {method: 'rata-rata'}, settings, update.subjectId, learningObjectives, gradeKey, curriculumKey, predefinedCurriculum)
                            };
                            return {
                                ...item,
                                detailedGrades: newDetailedGrades,
                                finalGrades: newFinalGrades
                            };
                        }
                        return item;
                    });
                    
                    // Handle students in updates that were not present in previous grades list
                    u.forEach(x => {
                        if (!next.some(ng => ng.studentId === x.studentId)) {
                            const subject = subjects.find(s => s.id === x.subjectId);
                            const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || '5'}`;
                            const curriculumKey = subject ? (subject.curriculumKey || subject.fullName) : null;
                            const finalGradeVal = calculateFinalGrade(x.newDetailedGrade, settings.gradeCalculation[x.subjectId] || {method: 'rata-rata'}, settings, x.subjectId, learningObjectives, gradeKey, curriculumKey, predefinedCurriculum);
                            next.push({
                                studentId: x.studentId,
                                detailedGrades: { [x.subjectId]: x.newDetailedGrade },
                                finalGrades: { [x.subjectId]: finalGradeVal }
                            });
                        }
                    });
                    return next;
                }), 
                learningObjectives, onUpdateLearningObjectives: setLearningObjectives, subjects, 
                onUpdatePredikats: p => setSettings(s => ({...s, predikats: p})), activeTab: activeNilaiTab, onTabChange: setActiveNilaiTab, 
                onUpdateGradeCalculation: (sid, conf) => setSettings(s => ({ ...s, gradeCalculation: { ...s.gradeCalculation, [sid]: conf } })),
                onUpdateSlmVisibility: (sid, vis) => setSettings(s => ({ ...s, slmVisibility: { ...s.slmVisibility, [sid]: vis } })),
                onUpdateDisplayMode: (mode) => setSettings(s => ({ ...s, nilaiDisplayMode: mode })),
                onBulkAddSlm: (subId, slm) => { setGrades(prev => prev.map(g => { const d = g.detailedGrades?.[subId] || { slm: [], sts1: null, sts2: null, sas1: null, sas2: null }; if (!d.slm.some(s => s.id === slm.id)) d.slm.push({ ...slm, scores: [...slm.scores] }); return { ...g, detailedGrades: { ...g.detailedGrades, [subId]: d } }; })); },
                predefinedCurriculum, showToast 
            }) :
            activePage === 'DATA_KOKURIKULER' ? React.createElement(DataKokurikulerPage, { students, settings, cocurricularData, onSettingsChange: handleSettingsChange, onUpdateCocurricularData: (sid, did, val) => setCocurricularData(prev => { const fieldName = settings.semester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings'; return {...prev, [sid]: { ...prev[sid], [fieldName]: { ...(prev[sid]?.[fieldName] || {}), [did]: val } } }; }), showToast }) :
            activePage === 'PENGATURAN' ? React.createElement(SettingsPage, { settings, onSettingsChange: handleSettingsChange, onSave: () => {}, onUpdateKopLayout: (l) => setSettings(s => { const currentSemester = s.semester || 'Ganjil'; const layoutField = currentSemester === 'Genap' ? 'kop_layout_Genap' : 'kop_layout'; return {...s, [layoutField]: l}; }), subjects, onUpdateSubjects: setSubjects, extracurriculars, onUpdateExtracurriculars: setExtracurriculars, showToast }) :
            activePage === 'DATA_ABSENSI' ? React.createElement(DataAbsensiPage, { students, settings, attendance, onUpdateAttendance: (sid, t, v) => setAttendance(prev => { const n = [...prev]; const sem = settings.semester || 'Ganjil'; const i = n.findIndex(a => a.studentId === sid && (a.semester || 'Ganjil') === sem); if(i>-1) n[i][t] = v===''?null:parseInt(v); else n.push({studentId:sid, semester: sem, [t]: v===''?null:parseInt(v)}); return n; }), onBulkUpdateAttendance: setAttendance, showToast }) :
            activePage === 'CATATAN_WALI_KELAS' ? React.createElement(CatatanWaliKelasPage, { students, notes, onUpdateNote: (sid, note) => setNotes(prev => { const key = settings.semester === 'Genap' ? sid + '_Genap' : sid; return {...prev, [key]: note}; }), grades, subjects, settings, showToast }) :
            activePage === 'DATA_EKSTRAKURIKULER' ? React.createElement(DataEkstrakurikulerPage, { students, settings, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars: setStudentExtracurriculars, showToast }) :
            activePage === 'PRINT_RAPOR' ? React.createElement(PrintRaporPage, { 
                students, settings, grades, attendance, notes, studentExtracurriculars, extracurriculars, subjects, learningObjectives, cocurricularData, 
                onUpdateDescription: (sid, subId, type, val, currentDescriptions) => { 
                    setGrades(prev => { 
                        const currentSemester = settings?.semester || 'Ganjil';
                        const descField = currentSemester === 'Genap' ? 'descriptions_Genap' : 'descriptions';

                        const n = JSON.parse(JSON.stringify(prev)); 
                        const g = n.find(x => x.studentId === sid); 
                        if(g) { 
                            if(!g.detailedGrades[subId]) g.detailedGrades[subId] = { slm: [], sts1: null, sts2: null, sas1: null, sas2: null };
                            if(!g.detailedGrades[subId][descField]) {
                                // If descriptions don't exist in DB, use the current ones (which might be auto-generated)
                                g.detailedGrades[subId][descField] = currentDescriptions || { highest: '', lowest: '' };
                            }
                            g.detailedGrades[subId][descField][type] = val; 
                        } 
                        return n; 
                    }); 
                },
                onUpdateStudent: (id, k, v) => setStudents(prev => prev.map(s => s.id === id ? { ...s, [k]: v } : s)),
                onUpdateSettings: (k, v) => setSettings(s => ({ ...s, [k]: v })),
                onUpdateNote: (sid, v) => setNotes(n => { const key = settings?.semester === 'Genap' ? sid + '_Genap' : sid; return { ...n, [key]: v }; }),
                onUpdateAttendance: (sid, k, v) => setAttendance(prev => { 
                    const n = [...prev]; 
                    const sem = settings?.semester || 'Ganjil';
                    const i = n.findIndex(a => a.studentId === sid && (a.semester || 'Ganjil') === sem); 
                    if(i > -1) n[i][k] = v === '' ? null : parseInt(v); 
                    else n.push({ studentId: sid, semester: sem, [k]: v === '' ? null : parseInt(v) }); 
                    return n; 
                }),
                onUpdateExtraDescription: (sid, eid, v) => setStudentExtracurriculars(prev => prev.map(s => {
                    const sem = settings?.semester || 'Ganjil';
                    if (s.studentId === sid && (s.semester || 'Ganjil') === sem) {
                        return { ...s, descriptions: { ...s.descriptions, [eid]: v } };
                    }
                    return s;
                })),
                onUpdateCocurricularManual: (sid, v) => setCocurricularData(prev => {
                    const currentSemester = settings?.semester || 'Ganjil';
                    const fieldName = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
                    return { 
                        ...prev, [sid]: { 
                            ...prev[sid], 
                            [fieldName]: { ...(prev[sid]?.[fieldName] || {}), manualDescription: v }
                        } 
                    };
                }),
                showToast 
            }) :
            activePage === 'PRINT_PIAGAM' ? React.createElement(PrintPiagamPage, { 
                students, settings, grades, subjects, 
                onUpdatePiagamLayout: (l) => setSettings(s => {
                    const currentSemester = s.semester || 'Ganjil';
                    const layoutField = currentSemester === 'Genap' ? 'piagam_layout_Genap' : 'piagam_layout';
                    return { ...s, [layoutField]: l };
                }), 
                showToast 
            }) :
            activePage === 'PRINT_LEGER' ? React.createElement(PrintLegerPage, { students, settings, grades, subjects, showToast }) :
            activePage === 'JURNAL_FORMATIF' ? React.createElement(JurnalFormatifPage, { students, formativeJournal, onUpdate: (sid, data) => setFormativeJournal(prev => { const next = { ...prev }; if(!next[sid]) next[sid] = []; const idx = next[sid].findIndex(n => n.id === data.id); if(idx > -1) next[sid][idx] = data; else next[sid].push({ ...data, id: Date.now() }); return next; }), onDelete: (sid, id) => setFormativeJournal(prev => ({...prev, [sid]: prev[sid].filter(n => n.id !== id)})), showToast, subjects, grades, settings, predefinedCurriculum }) :
            React.createElement(PlaceholderPage, { title: activePage })
        )
      )
    )
  );
};

export default App;
