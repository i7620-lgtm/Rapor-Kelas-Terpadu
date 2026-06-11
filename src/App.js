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

        const generateLegerRows = (overrideSemester) => {
            const legerHeader = ["No", "Nama Siswa", "NISN", "NIS", ...displaySubjects.map(s => s.label), "Jumlah", "Rata-rata", "Rank"];
            const simSettings = { ...settings, semester: overrideSemester };
            const gradeKey = `Kelas ${getGradeNumber(simSettings.nama_kelas) || '5'}`;
            
            const legerDataWithTotals = students.map((student, index) => {
                const studentGrades = grades.find(g => g.studentId === student.id) || { detailedGrades: {} };
                let total = 0, count = 0;
                
                const getSimFinalScore = (subjId) => {
                    const detailed = studentGrades.detailedGrades[subjId];
                    if (!detailed) return null;
                    const config = simSettings.gradeCalculation?.[subjId] || { method: 'rata-rata' };
                    const subj = activeSubjects.find(s => s.id === subjId) || subjects.find(s => s.id === subjId);
                    const curriculumKey = subj ? (subj.curriculumKey || subj.fullName) : null;
                    return calculateFinalGrade(detailed, config, simSettings, subjId, learningObjectives, gradeKey, curriculumKey, predefinedCurriculum);
                };

                const rowGrades = displaySubjects.map(ds => {
                    let grade;
                    if (ds.id === 'PABP') {
                        const rel = String(student.agama || '').trim().toLowerCase();
                        if (rel) {
                            const matched = rel === 'kepercayaan' ? activeSubjects.find(s => s.id === 'PAKTTMYME') : activeSubjects.find(s => s.fullName.startsWith(ds.fullName) && s.fullName.toLowerCase().includes(`(${rel})`));
                            grade = matched ? getSimFinalScore(matched.id) : null;
                        }
                    } else if (['SB', 'Mulok'].includes(ds.id)) {
                        const member = activeSubjects.filter(s => s.fullName.startsWith(ds.fullName));
                        grade = member.map(m => getSimFinalScore(m.id)).find(g => g != null);
                    } else grade = getSimFinalScore(ds.id);

                    if (typeof grade === 'number') { total += grade; count++; }
                    return grade ?? '-';
                });
                return { id: student.id, no: index + 1, name: student.namaLengkap, nisn: student.nisn, nis: student.nis, rowGrades, total, avg: count > 0 ? (total / count).toFixed(2) : "0.00" };
            });

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

            return [legerHeader, ...legerDataWithTotals.map(d => [
                d.no, d.name, d.nisn, d.nis, ...d.rowGrades, d.total, d.avg, rankMap.get(d.id)
            ])];
        };

        const wsLegerGanjil = XLSX.utils.aoa_to_sheet(generateLegerRows('Ganjil'));
        XLSX.utils.book_append_sheet(wb, wsLegerGanjil, "Leger_Ganjil");
        
        const wsLegerGenap = XLSX.utils.aoa_to_sheet(generateLegerRows('Genap'));
        XLSX.utils.book_append_sheet(wb, wsLegerGenap, "Leger_Genap");

        // --- 3. Sheet: Pengaturan ---
        const excludeKeys = ['predikats', 'gradeCalculation', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'qualitativeGradingMap', 'slmVisibility', 'ttd_kepala_sekolah', 'ttd_wali_kelas', 'kop_layout', 'piagam_layout', 'piagam_layout_Genap', 'kop_layout_Genap'];
        const settingsRows = [
            ["Kunci Pengaturan", "Nilai"],
            ["format_version", "2"],
            ...Object.entries(settings).filter(([key]) => !excludeKeys.includes(key)).map(([key, val]) => {
                let exportKey = key;
                if (key === 'cocurricular_theme') exportKey = 'cocurricular_theme_Ganjil';
                
                if (typeof val === 'object' && val !== null) {
                    return [exportKey, JSON.stringify(val)];
                }
                if (typeof val === 'boolean') {
                    return [exportKey, val ? 'true' : 'false'];
                }
                return [exportKey, val ?? ''];
            }),
            ["kop_layout", JSON.stringify(settings.kop_layout || [])],
            ["piagam_layout", JSON.stringify(settings.piagam_layout || [])],
            ["kop_layout_Genap", JSON.stringify(settings.kop_layout_Genap || [])],
            ["piagam_layout_Genap", JSON.stringify(settings.piagam_layout_Genap || [])],
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
                if (preData) {
                    const preHalf = Math.ceil(preData.length / 2);
                    masterCurriculum.set(sub.id, preData.map((slm, i) => ({ id: `slm_predefined_${sub.id}_${i}`, name: slm.slm, tps: slm.tp.map(t => ({ text: t })), semester: i < preHalf ? "Ganjil" : "Genap" })));
                }
            });
        }
        if (learningObjectives[gradeKey]) {
            subjects.filter(s => s.active).forEach(sub => {
                const userTps = learningObjectives[gradeKey][sub.curriculumKey || sub.fullName];
                if (!userTps) return;
                let subSlms = masterCurriculum.get(sub.id) || [];
                const userTpsBySlm = userTps.reduce((acc, tp) => { if (!acc[tp.slmId]) acc[tp.slmId] = { items: [], semester: tp.semester || "Semua" }; acc[tp.slmId].items.push({ text: tp.text }); return acc; }, {});
                Object.entries(userTpsBySlm).forEach(([slmId, tpData]) => {
                    const idx = subSlms.findIndex(s => s.id === slmId);
                    if (idx > -1) { subSlms[idx].tps = tpData.items; subSlms[idx].semester = tpData.semester; const name = grades[0]?.detailedGrades?.[sub.id]?.slm.find(s => s.id === slmId)?.name; if (name) subSlms[idx].name = name; }
                    else subSlms.push({ id: slmId, name: grades[0]?.detailedGrades?.[sub.id]?.slm.find(s => s.id === slmId)?.name || 'Lingkup Materi Kustom', tps: tpData.items, semester: tpData.semester });
                });
                masterCurriculum.set(sub.id, subSlms);
            });
        }
        const tpRows = [["ID Mata Pelajaran", "Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Semester", "Deskripsi Tujuan Pembelajaran (TP)"]];
        masterCurriculum.forEach((slms, subId) => {
            const sub = subjects.find(s => s.id === subId);
            if (sub) slms.forEach(slm => slm.tps.forEach(tp => tpRows.push([subId, sub.curriculumKey || sub.fullName, slm.id, slm.name, slm.semester || "Semua", tp.text])));
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tpRows), "Tujuan Pembelajaran");

        // --- 8. Sheets: Nilai_{MapelID} ---
        subjects.filter(s => s.active).forEach(sub => {
            const subSlms = masterCurriculum.get(sub.id);
            const headers = ["ID Siswa", "Nama Siswa"];
            const colMap = [];
            if (subSlms) subSlms.forEach(slm => slm.tps.forEach((tp, i) => { headers.push(`${slm.id}_TP${i + 1}`); colMap.push({ type: 'tp', slmId: slm.id, index: i }); }));
            headers.push("STS 1 (Ganjil)", "SAS 1 (Ganjil)", "STS 2 (Genap)", "SAS 2 (Genap)", "Deskripsi Tinggi (Ganjil)", "Deskripsi Rendah (Ganjil)", "Deskripsi Tinggi (Genap)", "Deskripsi Rendah (Genap)");
            const sheetRows = [headers];
            students.forEach(st => {
                const sGr = grades.find(g => g.studentId === st.id)?.detailedGrades?.[sub.id];
                const row = [st.id, st.namaLengkap];
                colMap.forEach(m => { const slm = sGr?.slm?.find(s => s.id === m.slmId); row.push(slm?.scores?.[m.index] ?? ''); });
                
                const expSts1 = sGr?.sts1 !== undefined && sGr?.sts1 !== null ? sGr.sts1 : (sGr?.sts !== undefined ? sGr.sts : '');
                const expSas1 = sGr?.sas1 !== undefined && sGr?.sas1 !== null ? sGr.sas1 : (sGr?.sas !== undefined ? sGr.sas : '');
                
                row.push(expSts1, expSas1, sGr?.sts2 ?? '', sGr?.sas2 ?? '');
                
                const descGanjilHeight = sGr?.descriptions?.highest || '';
                const descGanjilLow = sGr?.descriptions?.lowest || '';
                
                const descGenapHeight = sGr?.descriptions_Genap?.highest || '';
                const descGenapLow = sGr?.descriptions_Genap?.lowest || '';
                
                row.push(descGanjilHeight, descGanjilLow, descGenapHeight, descGenapLow);
                sheetRows.push(row);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetRows), `Nilai_${sub.id}`);
        });

        // --- 9. Data Lainnya (Absensi, Ekstra, Kokur, Catatan, Jurnal, Aset) ---
        const absensiRows = [["ID Siswa", "Semester", "Sakit", "Izin", "Alpa"]];
        students.forEach(s => {
            ['Ganjil', 'Genap'].forEach(sem => {
                const a = attendance.find(x => x.studentId === s.id && (x.semester || 'Ganjil') === sem);
                if (a && (a.sakit != null || a.izin != null || a.alpa != null)) absensiRows.push([s.id, sem, a.sakit ?? '', a.izin ?? '', a.alpa ?? '']);
            });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(absensiRows), "Absensi");

        const exRows = [["ID Siswa", "Nama Siswa", "Semester", "Urutan Ekstra", "ID Ekstrakurikuler", "Deskripsi"]];
        studentExtracurriculars.forEach(se => { 
            const st = students.find(s => s.id === se.studentId); 
            const sem = se.semester || 'Ganjil';
            if (st) se.assignedActivities.forEach((actId, i) => { 
                if (actId) exRows.push([se.studentId, st.namaLengkap, sem, i + 1, actId, se.descriptions?.[actId] || '']); 
            }); 
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(exRows), "Data Ekstra");

        const koRows = [["ID Siswa", "Nama Siswa", "Semester", "Deskripsi Manual", ...COCURRICULAR_DIMENSIONS.map(d => d.id)]];
        students.forEach(s => { 
            const co = cocurricularData[s.id] || {}; 
            ['Ganjil', 'Genap'].forEach(sem => {
                const fieldName = sem === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
                const ratings = co[fieldName];
                
                // Allow export if there are ratings or a manual description
                if ((ratings && Object.keys(ratings).length > 0) || (ratings && ratings.manualDescription) || co.manualDescription) {
                    const row = [s.id, s.namaLengkap, sem]; 
                    
                    // Prioritize semester-specific manualDescription, then fallback to global manualDescription for Ganjil
                    const manualDesc = ratings?.manualDescription || (sem === 'Ganjil' ? co.manualDescription : '');
                    row.push(manualDesc || '');
                    
                    COCURRICULAR_DIMENSIONS.forEach(d => row.push(ratings?.[d.id] || '')); 
                    koRows.push(row);
                }
            });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(koRows), "Data Kokurikuler");

        const catatanRows = [["ID Siswa", "Semester", "Catatan Wali Kelas"]];
        students.forEach(s => {
            if (notes[s.id]) catatanRows.push([s.id, 'Ganjil', notes[s.id]]);
            if (notes[s.id + '_Genap']) catatanRows.push([s.id, 'Genap', notes[s.id + '_Genap']]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catatanRows), "Catatan Wali Kelas");

        const jfRows = [["ID Siswa", "ID Catatan", "Tanggal", "Tipe", "Mapel ID", "SLM ID", "TP ID", "Topik", "Isi Catatan", "Semester"]];
        Object.entries(formativeJournal).forEach(([sid, ns]) => ns.forEach(n => jfRows.push([sid, n.id, n.date, n.type, n.subjectId || '', n.slmId || '', n.tpId || '', n.topic || '', n.note || '', n.semester || 'Ganjil'])));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(jfRows), "Jurnal Formatif");
        const asetRows = [["Kunci Aset", "Data Base64"]];
        const asToSa = { 'logo_sekolah': settings.logo_sekolah, 'logo_dinas': settings.logo_dinas, 'logo_cover': settings.logo_cover, 'piagam_background': settings.piagam_background, 'ttd_kepala_sekolah': settings.ttd_kepala_sekolah, 'ttd_wali_kelas': settings.ttd_wali_kelas };
        
        for (const [k, b] of Object.entries(asToSa)) {
            if (b && typeof b === 'string') {
                let base64Data = b;
                if (b.startsWith('blob:')) {
                    try {
                        const res = await fetch(b);
                        const blob = await res.blob();
                        base64Data = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    } catch (e) {
                        console.error(`Failed to convert blob to base64 for ${k}`, e);
                    }
                }
                chunkString(base64Data, 30000).forEach((c, i) => asetRows.push([`${k}_part_${i}`, c]));
            }
        }
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(asetRows), "Aset Gambar");

        const fotoSiswaRows = [["ID Siswa", "Part Index", "Data Base64"]];
        for (const student of students) {
            if (student.foto && typeof student.foto === 'string') {
                let base64Data = student.foto;
                if (base64Data.startsWith('blob:')) {
                    try {
                        const res = await fetch(base64Data);
                        const blob = await res.blob();
                        base64Data = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    } catch (e) {
                        console.error(`Failed to convert blob to base64 for foto ${student.id}`, e);
                    }
                }
                chunkString(base64Data, 30000).forEach((c, i) => fotoSiswaRows.push([student.id, i, c]));
            }
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fotoSiswaRows), "Foto Siswa");

        
        // --- NEW RELATIONAL DB EXPORT ---
        const currentSem = settings.semester || "Ganjil";
        const currentTA = settings.tahun_ajaran || "2023/2024";

        const rSettings = [ ["TA", "Semester", "Key", "Value"] ];
        Object.entries(settings).forEach(([k,v]) => {
           if (typeof v === "object") rSettings.push([currentTA, currentSem, k, JSON.stringify(v)]);
           else rSettings.push([currentTA, currentSem, k, v]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rSettings), "_Settings");

        const rStudents = [ ["TA", "Semester", "ID", "NIS", "NISN", "Nama", "L/P", "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat"] ];
        students.forEach(s => rStudents.push([currentTA, currentSem, s.id, s.nis, s.nisn, s.namaLengkap, s.jenisKelamin, s.tempatLahir, s.tanggalLahir, s.agama, s.alamat]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rStudents), "_Students");

        const rGrades = [ ["TA", "Semester", "Student ID", "Subject ID", "Category", "Score"] ];
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
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rGrades), "_Nilai");
        
        const rAbsensi = [ ["TA", "Semester", "Student ID", "Sakit", "Izin", "Alpa"] ];
        attendance.forEach(a => rAbsensi.push([currentTA, a.semester || currentSem, a.studentId, a.sakit, a.izin, a.alpa]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rAbsensi), "_Absensi");

        const rEkskul = [ ["TA", "Semester", "Student ID", "Ekskul ID", "Deskripsi"] ];
        studentExtracurriculars.forEach(se => {
             Object.entries(se.descriptions || {}).forEach(([eid, desc]) => {
                 rEkskul.push([currentTA, se.semester || currentSem, se.studentId, eid, desc]);
             });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rEkskul), "_Ekskul");

        return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/octet-stream' });
    } catch (e) { console.error("Export Error:", e); return null; }
  }, [settings, students, grades, notes, attendance, studentExtracurriculars, subjects, cocurricularData, extracurriculars, learningObjectives, formativeJournal, predefinedCurriculum]);

    const parseExcelBlob = useCallback(async (blob) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        let news = { ...initialSettings }, nStud = [], nAtt = [], nNot = {}, nStEx = [], nCo = {}, nGr = [], nSub = [...defaultSubjects], nEx = [], nLO = {}, nFJ = {};
        
        const findSheet = (names)
        
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
            // we skip _Nilai parsing here to prioritize old sheets or just let old sheets override since they are user friendly.
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
        link.download = getDynamicRKTFileName(settings);
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
                activePage, setActivePage: handleNavigate, onExport: handleExportAll, onImport: handleImportAll,
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
