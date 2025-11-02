import React, { useState, useCallback, useEffect } from 'react';
import { NAV_ITEMS } from './constants.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import PlaceholderPage from './components/PlaceholderPage.js';
import SettingsPage from './components/SettingsPage.js';
import DataSiswaPage from './components/DataSiswaPage.js';
import DataNilaiPage from './components/DataNilaiPage.js';
import CatatanWaliKelasPage from './components/CatatanWaliKelasPage.js';
import DataAbsensiPage from './components/DataAbsensiPage.js';
import DataEkstrakurikulerPage from './components/DataEkstrakurikulerPage.js';
import DataProyekP5Page from './components/DataProyekP5Page.js';
import PrintRaporPage from './components/PrintRaporPage.js';
import Toast from './components/Toast.js';

const defaultSubjects = [
    { id: 'PAIslam', fullName: 'Pendidikan Agama dan Budi Pekerti (Islam)', label: 'PA Islam', active: true },
    { id: 'PAKristen', fullName: 'Pendidikan Agama dan Budi Pekerti (Kristen)', label: 'PA Kristen', active: false },
    { id: 'PAKatolik', fullName: 'Pendidikan Agama dan Budi Pekerti (Katolik)', label: 'PA Katolik', active: false },
    { id: 'PAHindu', fullName: 'Pendidikan Agama dan Budi Pekerti (Hindu)', label: 'PA Hindu', active: false },
    { id: 'PABuddha', fullName: 'Pendidikan Agama dan Budi Pekerti (Buddha)', label: 'PA Buddha', active: false },
    { id: 'PAKhonghucu', fullName: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)', label: 'PA Khonghucu', active: false },
    { id: 'PP', fullName: 'Pendidikan Pancasila', label: 'PP', active: true },
    { id: 'BIndo', fullName: 'Bahasa Indonesia', label: 'B. Indo', active: true },
    { id: 'MTK', fullName: 'Matematika', label: 'MTK', active: true },
    { id: 'IPAS', fullName: 'Ilmu Pengetahuan Alam dan Sosial', label: 'IPAS', active: true },
    { id: 'SeniMusik', fullName: 'Seni Budaya (Seni Musik)', label: 'S. Musik', active: true },
    { id: 'SeniRupa', fullName: 'Seni Budaya (Seni Rupa)', label: 'S. Rupa', active: false },
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
  logo_dinas: null, nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  predikats: { a: '90', b: '80', c: '70' },
  kop_layout: []
};

const initialStudents = [
  {
      id: 1,
      namaLengkap: 'DUMMY RUMMY',
      namaPanggilan: 'DUMMY',
      nis: '1234',
      nisn: '12345678',
      tempatLahir: 'Jakarta',
      tanggalLahir: '2015-01-01',
      jenisKelamin: 'Laki-laki',
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      statusDalamKeluarga: 'Anak Kandung',
      anakKe: '1',
      asalTk: 'TK Harapan Bangsa',
      alamatSiswa: 'Jl. Cendrawasih No. 10',
      diterimaDiKelas: 'I (Satu)',
      diterimaTanggal: '2021-07-12',
      namaAyah: 'Budi Santoso',
      namaIbu: 'Citra Lestari',
      pekerjaanAyah: 'Wiraswasta',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      alamatOrangTua: 'Jl. Cendrawasih No. 10',
      teleponOrangTua: '081234567890',
      namaWali: '',
      pekerjaanWali: '',
      alamatWali: '',
      teleponWali: ''
  }
];

const initialGrades = [
    { studentId: 1, detailedGrades: {}, finalGrades: {} }
];

const initialNotes = {
    1: 'Siswa menunjukkan perkembangan yang baik dalam aspek akademik dan aktif dalam kegiatan kelas. Perlu meningkatkan konsentrasi saat pelajaran berlangsung.'
};

const initialAttendance = [
    { studentId: 1, sakit: 1, izin: 2, alpa: 0 }
];

const initialStudentExtracurriculars = [
    { studentId: 1, assignedActivities: ['PRAMUKA', null, null, null, null], descriptions: { 'PRAMUKA': 'Ananda Rummy sangat aktif dan antusias dalam mengikuti kegiatan Pramuka.' } }
];

const initialP5Assessments = [
    {
        studentId: 1,
        projectId: 'P5_BHINNEKA',
        assessments: {}
    }
];

const getGradeNumber = (str) => {
    if (!str) return null;
    const match = str.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    const upperStr = str.toUpperCase();
    if (upperStr.includes('VI')) return 6;
    if (upperStr.includes('V')) return 5;
    if (upperStr.includes('IV')) return 4;
    if (upperStr.includes('III')) return 3;
    if (upperStr.includes('II')) return 2;
    if (upperStr.includes('I')) return 1;
    return null;
};

const App = () => {
  const [activePage, setActivePage] = useState('DASHBOARD');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState(null);
  
  const [settings, setSettings] = useState(() => {
    try {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : initialSettings;
    } catch (e) {
        return initialSettings;
    }
  });
  const [students, setStudents] = useState(() => {
    try {
        const saved = localStorage.getItem('appStudents');
        return saved ? JSON.parse(saved) : initialStudents;
    } catch (e) {
        return initialStudents;
    }
  });
  const [grades, setGrades] = useState(() => {
    try {
        const saved = localStorage.getItem('appGrades');
        return saved ? JSON.parse(saved) : initialGrades;
    } catch (e) {
        return initialGrades;
    }
  });
  const [notes, setNotes] = useState(() => {
      try {
          const saved = localStorage.getItem('appNotes');
          return saved ? JSON.parse(saved) : initialNotes;
      } catch (e) {
          return initialNotes;
      }
  });
  const [attendance, setAttendance] = useState(() => {
      try {
          const saved = localStorage.getItem('appAttendance');
          return saved ? JSON.parse(saved) : initialAttendance;
      } catch (e) {
          return initialAttendance;
      }
  });
  const [extracurriculars, setExtracurriculars] = useState(() => {
      try {
          const saved = localStorage.getItem('appExtracurriculars');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  const [studentExtracurriculars, setStudentExtracurriculars] = useState(() => {
      try {
          const saved = localStorage.getItem('appStudentExtracurriculars');
          return saved ? JSON.parse(saved) : initialStudentExtracurriculars;
      } catch (e) {
          return initialStudentExtracurriculars;
      }
  });
   const [p5Projects, setP5Projects] = useState(() => {
      try {
          const saved = localStorage.getItem('appP5Projects');
          const parsed = saved ? JSON.parse(saved) : [];
          if (Array.isArray(parsed)) {
            return parsed.map(p => ({
              ...p,
              dimensions: Array.isArray(p.dimensions) ? p.dimensions.map((d) => typeof d === 'string' ? { name: d, subElements: [] } : d) : []
            }));
          }
          return [];
      } catch (e) {
          return [];
      }
  });
  const [p5Assessments, setP5Assessments] = useState(() => {
      try {
          const saved = localStorage.getItem('appP5Assessments');
          return saved ? JSON.parse(saved) : initialP5Assessments;
      } catch (e) {
          return initialP5Assessments;
      }
  });

  const [subjects, setSubjects] = useState(() => {
    try {
        const saved = localStorage.getItem('appSubjects');
        return saved ? JSON.parse(saved) : defaultSubjects;
    } catch (e) {
        return defaultSubjects;
    }
  });

  const [learningObjectives, setLearningObjectives] = useState(() => {
      try {
          const saved = localStorage.getItem('appLearningObjectives');
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          return {};
      }
  });

useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/presets.json');
            if (!response.ok) {
                throw new Error(`Gagal mengambil presets.json: ${response.statusText}`);
            }
            const loadedPresets = await response.json();
            setPresets(loadedPresets);
            
            const savedExtracurriculars = localStorage.getItem('appExtracurriculars');
            if (!savedExtracurriculars || savedExtracurriculars === '[]') {
                setExtracurriculars(loadedPresets.extracurriculars || []);
            }
            
            const savedP5Projects = localStorage.getItem('appP5Projects');
            if (!savedP5Projects || savedP5Projects === '[]') {
                const projectsWithSubElements = (loadedPresets.p5Projects || []).map((p) => ({
                    ...p,
                    dimensions: (p.dimensions || []).map((d) => typeof d === 'string' ? { name: d, subElements: [] } : d)
                }));
                setP5Projects(projectsWithSubElements);
            }

        } catch (err) {
            console.error("Gagal memuat data preset:", err);
            showToast("Gagal memuat data awal dari server.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    loadInitialData();
}, []);

useEffect(() => {
    const loadLearningObjectives = async () => {
        const gradeNumber = getGradeNumber(settings.nama_kelas);
        if (!gradeNumber) {
            return;
        }

        const gradeKey = `Kelas ${gradeNumber}`;
        
        // Only fetch if data for this class doesn't exist or is an empty object (from a previous failed fetch).
        if (learningObjectives[gradeKey] && Object.keys(learningObjectives[gradeKey]).length > 0) {
            return;
        }

        try {
            const response = await fetch(`/tp${gradeNumber}.json`);
            if (!response.ok) {
                console.warn(`Could not load learning objectives from /tp${gradeNumber}.json. Status: ${response.statusText}`);
                // Do NOT set an empty object here, to allow for retries.
                return;
            }
            const objectivesForClass = await response.json();
            
            setLearningObjectives(prev => ({
                ...prev,
                [gradeKey]: objectivesForClass
            }));
        } catch (err) {
            console.error(`Failed to fetch and parse learning objectives for grade ${gradeNumber}:`, err);
        }
    };

    if (settings.nama_kelas) {
      loadLearningObjectives();
    }
}, [settings.nama_kelas, learningObjectives]);


  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('appStudents', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('appGrades', JSON.stringify(grades));
  }, [grades]);
  
  useEffect(() => {
    localStorage.setItem('appNotes', JSON.stringify(notes));
  }, [notes]);
  
  useEffect(() => {
    localStorage.setItem('appAttendance', JSON.stringify(attendance));
  }, [attendance]);
  
  useEffect(() => {
    localStorage.setItem('appExtracurriculars', JSON.stringify(extracurriculars));
  }, [extracurriculars]);
  
  useEffect(() => {
    localStorage.setItem('appStudentExtracurriculars', JSON.stringify(studentExtracurriculars));
  }, [studentExtracurriculars]);

  useEffect(() => {
    localStorage.setItem('appP5Projects', JSON.stringify(p5Projects));
  }, [p5Projects]);

  useEffect(() => {
    localStorage.setItem('appP5Assessments', JSON.stringify(p5Assessments));
  }, [p5Assessments]);

  useEffect(() => {
    localStorage.setItem('appSubjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
      if (Object.keys(learningObjectives).length > 0) {
        localStorage.setItem('appLearningObjectives', JSON.stringify(learningObjectives));
      }
  }, [learningObjectives]);
  
  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const handleSettingsChange = useCallback((e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file' && files && files[0]) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(files[0]);
        fileReader.onload = () => {
            setSettings(prev => ({ ...prev, [name]: fileReader.result }));
        };
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleUpdateKopLayout = useCallback((newLayout) => {
    setSettings(prev => ({ ...prev, kop_layout: newLayout }));
  }, []);

  const saveSettings = useCallback(() => {
    showToast('Pengaturan berhasil disimpan!', 'success');
  }, [showToast]);

  const handleUpdatePredikats = useCallback((newPredikats) => {
    setSettings(prev => ({ ...prev, predikats: newPredikats }));
  }, []);
  
  const handleSaveStudent = useCallback((studentData) => {
    setStudents(prev => {
        if (studentData.id) {
            return prev.map(s => s.id === studentData.id ? { ...s, ...studentData } : s);
        } else {
            const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
            const newStudent = { ...studentData, id: newId };
            setGrades(g_prev => [...g_prev, { studentId: newId, detailedGrades: {}, finalGrades: {} }]);
            setAttendance(a_prev => [...a_prev, { studentId: newId, sakit: 0, izin: 0, alpa: 0 }]);
            setStudentExtracurriculars(se_prev => [...se_prev, { studentId: newId, assignedActivities: [], descriptions: {} }]);
            return [...prev, newStudent];
        }
    });
  }, []);
  
  const handleBulkSaveStudents = useCallback((studentsData) => {
    let newIdCounter = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    
    const newStudents = [];
    const newGrades = [];
    const newAttendance = [];
    const newStudentExtracurriculars = [];
    const newP5Assessments = [];

    studentsData.forEach(studentData => {
        const newId = newIdCounter++;
        newStudents.push({ ...studentData, id: newId });
        newGrades.push({ studentId: newId, detailedGrades: {}, finalGrades: {} });
        newAttendance.push({ studentId: newId, sakit: 0, izin: 0, alpa: 0 });
        newStudentExtracurriculars.push({ studentId: newId, assignedActivities: [], descriptions: {} });
        p5Projects.forEach(project => {
            newP5Assessments.push({ studentId: newId, projectId: project.id, assessments: {} });
        });
    });

    setStudents(prev => [...prev, ...newStudents]);
    setGrades(prev => [...prev, ...newGrades]);
    setAttendance(prev => [...prev, ...newAttendance]);
    setStudentExtracurriculars(prev => [...prev, ...newStudentExtracurriculars]);
    setP5Assessments(prev => [...prev, ...newP5Assessments]);

    showToast(`${newStudents.length} siswa berhasil diimpor!`, 'success');
  }, [students, p5Projects, showToast]);

  const handleDeleteStudent = useCallback((studentId) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
    setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[studentId];
        return newNotes;
    });
    setAttendance(prev => prev.filter(a => a.studentId !== studentId));
    setStudentExtracurriculars(prev => prev.filter(se => se.studentId !== studentId));
    setP5Assessments(prev => prev.filter(a => a.studentId !== studentId));
  }, []);
  
  const handleUpdateGrade = useCallback((studentId, subject, value) => {
    setGrades(prev => {
        const studentGradeIndex = prev.findIndex(g => g.studentId === studentId);
        if (studentGradeIndex > -1) {
            const updatedGrades = [...prev];
            const existingGrade = updatedGrades[studentGradeIndex];
            const newGrade = { 
                ...existingGrade, 
                finalGrades: {
                    ...existingGrade.finalGrades,
                    [subject]: value
                }
            };
            updatedGrades[studentGradeIndex] = newGrade;
            return updatedGrades;
        }
        return [...prev, { studentId, detailedGrades: {}, finalGrades: { [subject]: value } }];
    });
  }, []);

  const handleBulkUpdateGrades = useCallback((newGrades) => {
    setGrades(prev => {
        const updatedGradesMap = new Map(prev.map(g => [g.studentId, g]));
        newGrades.forEach(newGrade => {
            if (newGrade && typeof newGrade === 'object') {
              const existing = updatedGradesMap.get(newGrade.studentId) || { studentId: newGrade.studentId, detailedGrades: {}, finalGrades: {} };
              updatedGradesMap.set(newGrade.studentId, Object.assign({}, existing, newGrade));
            }
        });
        return Array.from(updatedGradesMap.values());
    });
  }, []);

  const handleUpdateNote = useCallback((studentId, note) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
  }, []);

  const handleBulkUpdateNotes = useCallback((newNotes) => {
    setNotes(prev => ({ ...prev, ...newNotes }));
  }, []);

  const handleUpdateAttendance = useCallback((studentId, type, value) => {
    setAttendance(prev => {
        const studentAttIndex = prev.findIndex(a => a.studentId === studentId);
        const updatedAttendance = [...prev];
        if (studentAttIndex > -1) {
            const newAtt = { ...updatedAttendance[studentAttIndex], [type]: value };
            updatedAttendance[studentAttIndex] = newAtt;
        } else {
            updatedAttendance.push({ studentId, sakit: 0, izin: 0, alpa: 0, [type]: value });
        }
        return updatedAttendance;
    });
  }, []);
  
  const handleBulkUpdateAttendance = useCallback((newAttendanceData) => {
      setAttendance(prev => {
          const updatedAttendanceMap = new Map(prev.map(a => [a.studentId, a]));
          newAttendanceData.forEach(newAtt => {
              if (newAtt && typeof newAtt === 'object') {
                const existing = updatedAttendanceMap.get(newAtt.studentId) || { studentId: newAtt.studentId, sakit: 0, izin: 0, alpa: 0 };
                updatedAttendanceMap.set(newAtt.studentId, Object.assign({}, existing, newAtt));
              }
          });
          return Array.from(updatedAttendanceMap.values());
      });
  }, []);

  const handleUpdateExtracurriculars = useCallback((newExtracurriculars) => {
      setExtracurriculars(newExtracurriculars);
  }, []);
  
  const handleUpdateStudentExtracurriculars = useCallback((newStudentExtracurriculars) => {
      setStudentExtracurriculars(newStudentExtracurriculars);
  }, []);

  const handleBulkUpdateStudentExtracurriculars = useCallback((newData) => {
    setStudentExtracurriculars(prev => {
      const dataMap = new Map(prev.map(item => [item.studentId, item]));
      newData.forEach(newItem => {
        if (newItem && typeof newItem === 'object') {
          const existing = dataMap.get(newItem.studentId) || { studentId: newItem.studentId, assignedActivities: [], descriptions: {} };
          dataMap.set(newItem.studentId, Object.assign({}, existing, newItem));
        }
      });
      return Array.from(dataMap.values());
    });
  }, []);

  const handleUpdateDetailedGrade = useCallback((
      studentId,
      subject,
      type,
      value,
      tpIndex
  ) => {
      setGrades(prev => {
          const studentGradeIndex = prev.findIndex(g => g.studentId === studentId);
          const updatedGrades = [...prev];

          let newGrade;
          if (studentGradeIndex > -1) {
              newGrade = JSON.parse(JSON.stringify(updatedGrades[studentGradeIndex]));
          } else {
              newGrade = { studentId, detailedGrades: {}, finalGrades: {} };
          }
          
          newGrade.detailedGrades = newGrade.detailedGrades || {};
          newGrade.detailedGrades[subject] = newGrade.detailedGrades[subject] || { tp: [], sts: null, sas: null };
          
          const detailedGrade = newGrade.detailedGrades[subject];

          if (type === 'tp' && tpIndex !== undefined) {
              detailedGrade.tp = detailedGrade.tp || [];
              while (detailedGrade.tp.length <= tpIndex) {
                  detailedGrade.tp.push(null);
              }
              detailedGrade.tp[tpIndex] = value;
          } else if (type === 'sts') {
              detailedGrade.sts = value;
          } else if (type === 'sas') {
              detailedGrade.sas = value;
          }
          
          const subjectFullName = subjects.find(s => s.id === subject)?.fullName;
          let numberOfActiveTps = -1; 

          if (subjectFullName && settings.nama_kelas) {
            const currentGradeNumber = getGradeNumber(settings.nama_kelas);
            if (currentGradeNumber !== null) {
                let gradeKey = '';
                for (const key in learningObjectives) {
                    if (getGradeNumber(key) === currentGradeNumber) {
                        gradeKey = key;
                        break;
                    }
                }
                if (gradeKey && learningObjectives[gradeKey]?.[subjectFullName]) {
                    numberOfActiveTps = learningObjectives[gradeKey][subjectFullName].length;
                }
            }
          }
          
          const tpsToConsider = (numberOfActiveTps !== -1)
            ? (detailedGrade.tp || []).slice(0, numberOfActiveTps)
            : (detailedGrade.tp || []);

          const validTps = tpsToConsider.filter((t) => typeof t === 'number');
          const averageTp = validTps.length > 0 ? validTps.reduce((a, b) => a + b, 0) / validTps.length : 0;
          const sts = detailedGrade.sts ?? 0;
          const sas = detailedGrade.sas ?? 0;
          const finalGrade = (averageTp + sts + sas) / 3;
          
          newGrade.finalGrades = newGrade.finalGrades || {};
          newGrade.finalGrades[subject] = isNaN(finalGrade) ? null : Math.round(finalGrade);

          if (studentGradeIndex > -1) {
              updatedGrades[studentGradeIndex] = newGrade;
          } else {
              updatedGrades.push(newGrade);
          }
          
          return updatedGrades;
      });
  }, [subjects, settings.nama_kelas, learningObjectives]);

  const handleUpdateSubjects = useCallback((newSubjects) => {
      setSubjects(newSubjects);
  }, []);

  const handleUpdateLearningObjectives = useCallback((newObjectives) => {
      setLearningObjectives(newObjectives);
  }, []);

  const handleUpdateP5Project = useCallback((project) => {
    setP5Projects(prev => {
        const index = prev.findIndex(p => p.id === project.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = project;
            return updated;
        }
        return [...prev, project];
    });
  }, []);

  const handleDeleteP5Project = useCallback((projectId) => {
      setP5Projects(prev => prev.filter(p => p.id !== projectId));
      setP5Assessments(prev => prev.filter(a => a.projectId !== projectId));
  }, []);

  const handleUpdateP5Assessment = useCallback((studentId, projectId, subElementKey, level) => {
      setP5Assessments(prev => {
          const studentAssessmentIndex = prev.findIndex(a => a.studentId === studentId && a.projectId === projectId);
          const updatedAssessments = [...prev];
          
          if (studentAssessmentIndex > -1) {
              const newAssessment = { ...updatedAssessments[studentAssessmentIndex] };
              newAssessment.assessments = { ...newAssessment.assessments, [subElementKey]: level };
              updatedAssessments[studentAssessmentIndex] = newAssessment;
          } else {
              updatedAssessments.push({
                  studentId,
                  projectId,
                  assessments: { [subElementKey]: level }
              });
          }
          return updatedAssessments;
      });
  }, []);

  const handleBulkUpdateP5Assessments = useCallback((updates) => {
    setP5Assessments(prev => {
        const assessmentsMap = new Map();
        prev.forEach(a => assessmentsMap.set(`${a.studentId}-${a.projectId}`, JSON.parse(JSON.stringify(a))));
        
        updates.forEach(({ studentId, projectId, subElementKey, level }) => {
            const key = `${studentId}-${projectId}`;
            let assessment = assessmentsMap.get(key);
            if (!assessment) {
                assessment = { studentId, projectId, assessments: {} };
            }
            assessment.assessments[subElementKey] = level;
            assessmentsMap.set(key, assessment);
        });

        return Array.from(assessmentsMap.values());
    });
  }, []);

    const handleExportAll = useCallback(() => {
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
        return;
    }
    try {
        const wb = XLSX.utils.book_new();

        const petunjukData = [
            ["Petunjuk Pengisian Template RKT"], [],
            ["Sheet", "Keterangan"],
            ["Pengaturan", "Isi atau ubah pengaturan dasar, daftar mata pelajaran, dan ekstrakurikuler di sheet ini. Perubahan akan diterapkan saat file diunggah."],
            ["Data Siswa", "Isi data lengkap siswa pada sheet ini. Kolom 'Nama Lengkap' wajib diisi."],
            ["Data Absensi", "Isi jumlah absensi (Sakit, Izin, Alpa) untuk setiap siswa."],
            ["Catatan Wali Kelas", "Isi catatan atau feedback untuk setiap siswa."],
            ["Data Ekstrakurikuler", "Isi ekstrakurikuler yang diikuti siswa dan deskripsinya. Nama ekstrakurikuler harus sesuai dengan yang ada di Pengaturan."],
            ["Penilaian P5", "Isi tingkat pencapaian siswa untuk setiap sub-elemen proyek P5. Gunakan nilai: Belum Berkembang, Mulai Berkembang, Berkembang sesuai Harapan, Sangat Berkembang."],
            ["Nilai [Nama Mapel]", "Gunakan sheet ini untuk memasukkan nilai TP, STS, dan SAS untuk setiap siswa per mata pelajaran yang aktif."],
            ["Tujuan Pembelajaran", "Isi daftar Tujuan Pembelajaran (TP) untuk setiap mata pelajaran."],
            [],
            ["PENTING:", "Pastikan nama siswa dan nama sheet tidak diubah agar proses impor berjalan lancar."]
        ];
        const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
        wsPetunjuk['!cols'] = [{ wch: 20 }, { wch: 100 }];
        XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");
        
        const settingsHeaderMapping = [
            ['nama_dinas_pendidikan', 'Nama Dinas Pendidikan'], ['nama_sekolah', 'Nama Sekolah'], ['npsn', 'NPSN'],
            ['alamat_sekolah', 'Alamat Sekolah'], ['desa_kelurahan', 'Desa / Kelurahan'], ['kecamatan', 'Kecamatan'],
            ['kota_kabupaten', 'Kota/Kabupaten'], ['provinsi', 'Provinsi'], ['kode_pos', 'Kode Pos'],
            ['email_sekolah', 'Email Sekolah'], ['telepon_sekolah', 'Telepon Sekolah'], ['website_sekolah', 'Website Sekolah'],
            ['faksimile', 'Faksimile'], ['nama_kelas', 'Nama Kelas'], ['tahun_ajaran', 'Tahun Ajaran'],
            ['semester', 'Semester'], ['tanggal_rapor', 'Tempat, Tanggal Rapor'], ['nama_kepala_sekolah', 'Nama Kepala Sekolah'],
            ['nip_kepala_sekolah', 'NIP Kepala Sekolah'], ['nama_wali_kelas', 'Nama Wali Kelas'], ['nip_wali_kelas', 'NIP Wali Kelas'],
            ['predikat_a', 'Predikat A (Mulai dari)'], ['predikat_b', 'Predikat B (Mulai dari)'], ['predikat_c', 'Predikat C (Mulai dari)'],
        ];

        const settingsDataAoA = [
            ['Pengaturan Aplikasi'], [],
            ['Pengaturan', 'Nilai'],
        ];
        settingsHeaderMapping.forEach(([key, header]) => {
            let value;
            if (key.startsWith('predikat_')) {
                value = settings.predikats[key.split('_')[1]];
            } else {
                value = settings[key];
            }
            settingsDataAoA.push([header, value]);
        });
        
        settingsDataAoA.push([]);
        settingsDataAoA.push(['Mata Pelajaran']);
        settingsDataAoA.push(['ID Internal (Jangan Diubah)', 'Nama Lengkap', 'Singkatan', 'Status Aktif']);
        subjects.forEach(subject => {
            settingsDataAoA.push([subject.id, subject.fullName, subject.label, subject.active ? 'Aktif' : 'Tidak Aktif']);
        });

        settingsDataAoA.push([]);
        settingsDataAoA.push(['Ekstrakurikuler']);
        settingsDataAoA.push(['ID Unik (Jangan Diubah)', 'Nama Ekstrakurikuler', 'Status Aktif']);
        extracurriculars.forEach(extra => {
            settingsDataAoA.push([extra.id, extra.name, extra.active ? 'Aktif' : 'Tidak Aktif']);
        });

        const wsPengaturan = XLSX.utils.aoa_to_sheet(settingsDataAoA);
        wsPengaturan['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsPengaturan, "Pengaturan");


        const studentHeaderMapping = [
            ['no', "No"], ['namaLengkap', "Nama Lengkap"], ['namaPanggilan', "Nama Panggilan"], ['nis', "NIS"], ['nisn', "NISN"], ['tempatLahir', "Tempat Lahir"], ['tanggalLahir', "Tanggal Lahir"], ['jenisKelamin', "Jenis Kelamin"], ['agama', "Agama"], ['kewarganegaraan', "Kewarganegaraan"], ['statusDalamKeluarga', "Status dalam Keluarga"], ['anakKe', "Anak Ke-"], ['asalTk', "Asal TK"], ['alamatSiswa', "Alamat Siswa"], ['diterimaDiKelas', "Diterima di Kelas"], ['diterimaTanggal', "Diterima Tanggal"], ['namaAyah', "Nama Ayah"], ['namaIbu', "Nama Ibu"], ['pekerjaanAyah', "Pekerjaan Ayah"], ['pekerjaanIbu', "Pekerjaan Ibu"], ['alamatOrangTua', "Alamat Orang Tua"], ['teleponOrangTua', "Telepon Orang Tua"], ['namaWali', "Nama Wali"], ['pekerjaanWali', "Pekerjaan Wali"], ['alamatWali', "Alamat Wali"], ['teleponWali', "Telepon Wali"]
        ];
        const formattedStudents = students.map((student, index) => {
            const newStudent = {};
            studentHeaderMapping.forEach(([key, header]) => {
                if (key === 'no') newStudent[header] = index + 1;
                else newStudent[header] = student[key];
            });
            return newStudent;
        });
        const wsSiswa = XLSX.utils.json_to_sheet(formattedStudents);
        wsSiswa['!cols'] = studentHeaderMapping.map(([, header]) => ({ wch: header.length < 15 ? 15 : header.length + 2 }));
        XLSX.utils.book_append_sheet(wb, wsSiswa, "Data Siswa");

        const dataAbsensi = students.map(student => {
            const studentAtt = attendance.find(a => a.studentId === student.id) || { sakit: 0, izin: 0, alpa: 0 };
            return { "Nama Lengkap": student.namaLengkap, "Sakit (S)": studentAtt.sakit, "Izin (I)": studentAtt.izin, "Alpa (A)": studentAtt.alpa };
        });
        const wsAbsensi = XLSX.utils.json_to_sheet(dataAbsensi);
        wsAbsensi['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsAbsensi, "Data Absensi");

        const dataCatatan = students.map(student => ({ "Nama Lengkap": student.namaLengkap, "Catatan Wali Kelas": notes[student.id] || '' }));
        const wsCatatan = XLSX.utils.json_to_sheet(dataCatatan);
        wsCatatan['!cols'] = [{ wch: 30 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsCatatan, "Catatan Wali Kelas");

        const MAX_EXTRA_FIELDS = 5;
        const headersExtra = ["Nama Lengkap"];
        for (let i = 1; i <= MAX_EXTRA_FIELDS; i++) {
            headersExtra.push(`Ekstrakurikuler ${i}`);
            headersExtra.push(`Deskripsi ${i}`);
        }
        const dataEkstra = students.map(student => {
            const studentExtra = studentExtracurriculars.find(se => se.studentId === student.id);
            const row = { "Nama Lengkap": student.namaLengkap };
            for (let i = 0; i < MAX_EXTRA_FIELDS; i++) {
                const activityId = studentExtra?.assignedActivities?.[i] || null;
                const activityName = extracurriculars.find(e => e.id === activityId)?.name || '';
                const description = activityId ? studentExtra?.descriptions?.[activityId] || '' : '';
                row[`Ekstrakurikuler ${i+1}`] = activityName;
                row[`Deskripsi ${i+1}`] = description;
            }
            return row;
        });
        const wsEkstra = XLSX.utils.json_to_sheet(dataEkstra);
        wsEkstra['!cols'] = [{ wch: 30 }, ...Array(MAX_EXTRA_FIELDS * 2).fill({ wch: 30 })];
        XLSX.utils.book_append_sheet(wb, wsEkstra, "Data Ekstrakurikuler");
        
        const p5_ws_data = [];
        const machineHeaders = ['studentId', 'namaLengkap'];
        const humanHeaders = ['ID Siswa (Jangan Diubah)', 'Nama Siswa'];
        p5Projects.forEach(project => {
            project.dimensions.forEach(dim => {
                dim.subElements.forEach(sub => {
                    const subElementKey = `${dim.name}|${sub.name}`;
                    machineHeaders.push(`PROJ:${project.id}|KEY:${subElementKey}`);
                    humanHeaders.push(`${project.title} - ${sub.name}`);
                });
            });
        });
        p5_ws_data.push(machineHeaders);
        p5_ws_data.push(humanHeaders);
        students.forEach(student => {
            const row = [student.id, student.namaLengkap];
            p5Projects.forEach(project => {
                const studentAssessments = p5Assessments.find(a => a.studentId === student.id && a.projectId === project.id);
                project.dimensions.forEach(dim => {
                    dim.subElements.forEach(sub => {
                        const subElementKey = `${dim.name}|${sub.name}`;
                        row.push(studentAssessments?.assessments[subElementKey] || null);
                    });
                });
            });
            p5_ws_data.push(row);
        });
        const wsP5 = XLSX.utils.aoa_to_sheet(p5_ws_data);
        wsP5['!rows'] = [{hidden: true}];
        wsP5['!cols'] = [{wch: 20}, {wch: 30}, ...machineHeaders.slice(2).map(() => ({ wch: 30 }))];
        XLSX.utils.book_append_sheet(wb, wsP5, "Penilaian P5");

        const activeSubjects = subjects.filter(s => s.active);
        const currentGradeNumber = getGradeNumber(settings.nama_kelas);
        let objectivesForCurrentClass = {};
        if (currentGradeNumber !== null) {
            for (const key in learningObjectives) {
                if (getGradeNumber(key) === currentGradeNumber) objectivesForCurrentClass = learningObjectives[key];
            }
        }
        activeSubjects.forEach(subject => {
            const subjectTps = objectivesForCurrentClass[subject.fullName] || [];
            const numberOfTps = subjectTps.length;
            const perMapelData = students.map((student, index) => {
                const detailedGrade = grades.find(g => g.studentId === student.id)?.detailedGrades?.[subject.id];
                const row = { "No": index + 1, "Nama Siswa": student.namaLengkap };
                for (let i = 0; i < numberOfTps; i++) row[`TP ${i + 1}`] = detailedGrade?.tp?.[i] ?? '';
                row["STS"] = detailedGrade?.sts ?? '';
                row["SAS"] = detailedGrade?.sas ?? '';
                return row;
            });
            const safeSheetName = `Nilai ${subject.label}`.substring(0, 31);
            const wsPerMapel = XLSX.utils.json_to_sheet(perMapelData);
            wsPerMapel['!cols'] = [ { wch: 5 }, { wch: 30 }, ...Array(numberOfTps).fill({ wch: 8 }), { wch: 8 }, { wch: 8 } ];
            XLSX.utils.book_append_sheet(wb, wsPerMapel, safeSheetName);
        });

        const subjectsForObjectives = activeSubjects.filter(s => objectivesForCurrentClass[s.fullName]);
        const maxObjectives = subjectsForObjectives.reduce((max, s) => Math.max(max, (objectivesForCurrentClass[s.fullName] || []).length), 0);
        const tpHeaders = ["No", "Nama Mapel", ...Array.from({ length: maxObjectives }, (_, i) => `TP ${i + 1}`)];
        const tpData = subjectsForObjectives.map((s, i) => {
            const objectivesForSubject = objectivesForCurrentClass[s.fullName] || [];
            const rowData = [i + 1, s.fullName];
            for (let j = 0; j < maxObjectives; j++) rowData.push(objectivesForSubject[j] || '');
            return rowData;
        });
        const wsTujuan = XLSX.utils.aoa_to_sheet([tpHeaders, ...tpData]);
        wsTujuan['!cols'] = [{ wch: 5 }, { wch: 45 }, ...Array(maxObjectives).fill({ wch: 40 })];
        XLSX.utils.book_append_sheet(wb, wsTujuan, "Tujuan Pembelajaran");
        
        XLSX.writeFile(wb, `Template_Lengkap_RKT_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('Template lengkap berhasil diekspor!', 'success');
    } catch (error) {
        console.error("Gagal mengekspor data:", error);
        showToast("Gagal mengekspor data.", 'error');
    }
  }, [settings, students, grades, notes, attendance, extracurriculars, studentExtracurriculars, p5Projects, p5Assessments, subjects, learningObjectives, showToast]);

  const handleImportAll = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                let importCount = 0;
                
                const settingsWorksheet = workbook.Sheets['Pengaturan'];
                if (settingsWorksheet) {
                    const rows = XLSX.utils.sheet_to_json(settingsWorksheet, { header: 1 });
                    
                    let section = 'general';
                    const parsedSettings = {};
                    const parsedPredikats = {};
                    const parsedSubjects = [];
                    const parsedExtracurriculars = [];

                    const settingsHeaderMapping = [
                        ['nama_dinas_pendidikan', 'Nama Dinas Pendidikan'], ['nama_sekolah', 'Nama Sekolah'], ['npsn', 'NPSN'],
                        ['alamat_sekolah', 'Alamat Sekolah'], ['desa_kelurahan', 'Desa / Kelurahan'], ['kecamatan', 'Kecamatan'],
                        ['kota_kabupaten', 'Kota/Kabupaten'], ['provinsi', 'Provinsi'], ['kode_pos', 'Kode Pos'],
                        ['email_sekolah', 'Email Sekolah'], ['telepon_sekolah', 'Telepon Sekolah'], ['website_sekolah', 'Website Sekolah'],
                        ['faksimile', 'Faksimile'], ['nama_kelas', 'Nama Kelas'], ['tahun_ajaran', 'Tahun Ajaran'],
                        ['semester', 'Semester'], ['tanggal_rapor', 'Tempat, Tanggal Rapor'], ['nama_kepala_sekolah', 'Nama Kepala Sekolah'],
                        ['nip_kepala_sekolah', 'NIP Kepala Sekolah'], ['nama_wali_kelas', 'Nama Wali Kelas'], ['nip_wali_kelas', 'NIP Wali Kelas'],
                        ['predikat_a', 'Predikat A (Mulai dari)'], ['predikat_b', 'Predikat B (Mulai dari)'], ['predikat_c', 'Predikat C (Mulai dari)'],
                    ];
                    const settingsMap = new Map(settingsHeaderMapping.map(([key, header]) => [header.trim().toLowerCase(), key]));

                    rows.forEach(row => {
                        if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined)) return;
                        
                        const headerCell = String(row[0] || '').trim().toLowerCase();
                        if (headerCell === 'mata pelajaran') { section = 'subjects'; return; }
                        if (headerCell === 'ekstrakurikuler') { section = 'extras'; return; }

                        switch(section) {
                            case 'general':
                                const key = settingsMap.get(headerCell);
                                const value = row[1];
                                if (key) {
                                    if (key.startsWith('predikat_')) parsedPredikats[key.split('_')[1]] = String(value);
                                    else parsedSettings[key] = value;
                                }
                                break;
                            case 'subjects':
                                if (headerCell.includes('id internal')) return; // Skip header row
                                const [id, fullName, label, status] = row;
                                if (id && fullName && label) {
                                    parsedSubjects.push({
                                        id: String(id),
                                        fullName: String(fullName),
                                        label: String(label),
                                        active: String(status || '').trim().toLowerCase() === 'aktif'
                                    });
                                }
                                break;
                            case 'extras':
                                if (headerCell.includes('id unik')) return; // Skip header row
                                const [extraId, name, extraStatus] = row;
                                if (extraId && name) {
                                    parsedExtracurriculars.push({
                                        id: String(extraId),
                                        name: String(name),
                                        active: String(extraStatus || '').trim().toLowerCase() === 'aktif'
                                    });
                                }
                                break;
                        }
                    });

                    if (Object.keys(parsedSettings).length > 0 || Object.keys(parsedPredikats).length > 0) {
                        if (Object.keys(parsedPredikats).length > 0) {
                            parsedSettings.predikats = { ...settings.predikats, ...parsedPredikats };
                        }
                        setSettings(prev => ({ ...prev, ...parsedSettings }));
                        importCount++;
                    }
                    
                    if (parsedSubjects.length > 0) {
                        setSubjects(prevSubjects => {
                            const subjectsMap = new Map(prevSubjects.map(s => [s.id, s]));
                            parsedSubjects.forEach(newSub => {
                                // Update existing or add new
                                subjectsMap.set(newSub.id, { ...(subjectsMap.get(newSub.id) || {}), ...newSub });
                            });
                            return Array.from(subjectsMap.values());
                        });
                    }
                    if (parsedExtracurriculars.length > 0) {
                        setExtracurriculars(prevExtras => {
                            const extrasMap = new Map(prevExtras.map(e => [e.id, e]));
                            parsedExtracurriculars.forEach(newExtra => {
                                // Update existing or add new
                                extrasMap.set(newExtra.id, { ...(extrasMap.get(newExtra.id) || {}), ...newExtra });
                            });
                            return Array.from(extrasMap.values());
                        });
                    }
                }

                const studentMap = new Map(students.map(s => [s.namaLengkap.trim().toLowerCase(), s.id]));

                workbook.SheetNames.forEach(sheetName => {
                    if (sheetName === 'Pengaturan') return;

                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    if (sheetName === 'Data Siswa') {
                        importCount++;
                    } else if (sheetName === 'Data Absensi') {
                        const newAttendance = [];
                        json.forEach(row => {
                            const studentName = String(row["Nama Lengkap"] || '').trim().toLowerCase();
                            const studentId = studentMap.get(studentName);
                            if (studentId) {
                                newAttendance.push({ 
                                    studentId, 
                                    sakit: parseInt(String(row["Sakit (S)"] || '0'), 10) || 0, 
                                    izin: parseInt(String(row["Izin (I)"] || '0'), 10) || 0, 
                                    alpa: parseInt(String(row["Alpa (A)"] || '0'), 10) || 0 
                                });
                            }
                        });
                        if(newAttendance.length > 0) { handleBulkUpdateAttendance(newAttendance); importCount++; }
                    } else if (sheetName === 'Catatan Wali Kelas') {
                        const newNotes = {};
                        json.forEach(row => {
                            const studentName = String(row["Nama Lengkap"] || '').trim().toLowerCase();
                            const studentId = studentMap.get(studentName);
                            if (studentId != null) newNotes[studentId] = String(row["Catatan Wali Kelas"] || '');
                        });
                        if(Object.keys(newNotes).length > 0) { handleBulkUpdateNotes(newNotes); importCount++; }
                    } else if (sheetName === 'Data Ekstrakurikuler') {
                        const extraMap = new Map(extracurriculars.map(ex => [ex.name.trim().toLowerCase(), ex.id]));
                        const newStudentExtras = [];
                        json.forEach(row => {
                            const studentId = studentMap.get(String(row["Nama Lengkap"] || '').trim().toLowerCase());
                            if (studentId) {
                                const assignedActivities = [];
                                const descriptions = {};
                                for (let i = 1; i <= 5; i++) {
                                    const extraName = String(row[`Ekstrakurikuler ${i}`] || '').trim().toLowerCase();
                                    const extraId = extraMap.get(extraName) || null;
                                    assignedActivities.push(extraId);
                                    if (extraId) descriptions[extraId] = String(row[`Deskripsi ${i}`] || '');
                                }
                                newStudentExtras.push({ studentId, assignedActivities, descriptions });
                            }
                        });
                        if (newStudentExtras.length > 0) { handleBulkUpdateStudentExtracurriculars(newStudentExtras); importCount++; }
                    } else if (sheetName === 'Penilaian P5') {
                        const jsonP5 = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        if (!jsonP5 || jsonP5.length < 2) {
                            console.warn(`Skipping P5 sheet "${sheetName}" due to missing header or data.`);
                            return; 
                        }
                        const machineHeaders = jsonP5[0];
                        const studentDataRows = jsonP5.slice(2);
                        const updates = [];
                        const ASSESSMENT_LEVELS = ['Belum Berkembang', 'Mulai Berkembang', 'Berkembang sesuai Harapan', 'Sangat Berkembang'];
                        studentDataRows.forEach(row => {
                            const studentId = parseInt(String(row[0]), 10);
                            if (isNaN(studentId) || !students.some(s => s.id === studentId)) return;
                            for (let i = 2; i < machineHeaders.length; i++) {
                                const header = machineHeaders[i];
                                if (header && typeof header === 'string' && header.startsWith('PROJ:')) {
                                    const projParts = header.split('|KEY:');
                                    if (projParts.length === 2) {
                                        const projectId = projParts[0].replace('PROJ:', '');
                                        const subElementKey = projParts[1];
                                        const level = ASSESSMENT_LEVELS.includes(row[i]) ? row[i] : '';
                                        updates.push({ studentId, projectId, subElementKey, level });
                                    }
                                }
                            }
                        });
                        if (updates.length > 0) { handleBulkUpdateP5Assessments(updates); importCount++; }
                    }
                });

                if (importCount > 0) {
                    showToast(`${importCount} sheet data berhasil diimpor!`, 'success');
                } else {
                    showToast("Tidak ada sheet dengan data valid yang ditemukan untuk diimpor.", 'error');
                }
            } catch (error) {
                console.error("Gagal mengimpor data:", error);
                showToast("Gagal membaca file impor.", 'error');
            }
        };
        reader.readAsBinaryString(file);
    };
    input.click();
  }, [students, extracurriculars, settings.predikats, showToast, handleBulkUpdateAttendance, handleBulkUpdateNotes, handleBulkUpdateStudentExtracurriculars, handleBulkUpdateP5Assessments, setSettings, setSubjects, setExtracurriculars]);

  const renderPage = () => {
    if (isLoading) {
        return React.createElement('div', { className: "flex items-center justify-center h-full" }, React.createElement('p', null, 'Memuat data awal...'));
    }

    switch (activePage) {
      case 'DASHBOARD':
        return React.createElement(Dashboard, { 
                  setActivePage: setActivePage, 
                  settings: settings, 
                  students: students,
                  grades: grades,
                  subjects: subjects,
                  notes: notes,
                  attendance: attendance,
                  extracurriculars: extracurriculars,
                  studentExtracurriculars: studentExtracurriculars,
                  p5Projects: p5Projects,
                  p5Assessments: p5Assessments,
                });
      case 'DATA_SISWA':
        return React.createElement(DataSiswaPage, { students: students, namaKelas: settings.nama_kelas, onSaveStudent: handleSaveStudent, onBulkSaveStudents: handleBulkSaveStudents, onDeleteStudent: handleDeleteStudent, showToast: showToast });
      case 'DATA_NILAI':
        return React.createElement(DataNilaiPage, { 
                  students: students, 
                  grades: grades, 
                  namaKelas: settings.nama_kelas, 
                  onUpdateGrade: handleUpdateGrade, 
                  onBulkUpdateGrades: handleBulkUpdateGrades,
                  onUpdateDetailedGrade: handleUpdateDetailedGrade,
                  learningObjectives: learningObjectives,
                  onUpdateLearningObjectives: handleUpdateLearningObjectives,
                  subjects: subjects,
                  predikats: settings.predikats,
                  onUpdatePredikats: handleUpdatePredikats,
                  showToast: showToast
                });
      case 'DATA_ABSENSI':
        return React.createElement(DataAbsensiPage, { students: students, attendance: attendance, onUpdateAttendance: handleUpdateAttendance, onBulkUpdateAttendance: handleBulkUpdateAttendance, showToast: showToast });
      case 'CATATAN_WALI_KELAS':
        return React.createElement(CatatanWaliKelasPage, { students: students, notes: notes, onUpdateNote: handleUpdateNote, onBulkUpdateNotes: handleBulkUpdateNotes, showToast: showToast, noteTemplates: presets?.studentNotesTemplates || [] });
      case 'DATA_EKSTRAKURIKULER':
        return React.createElement(DataEkstrakurikulerPage, { 
                  students: students,
                  extracurriculars: extracurriculars,
                  studentExtracurriculars: studentExtracurriculars,
                  onUpdateStudentExtracurriculars: handleUpdateStudentExtracurriculars,
                  showToast: showToast
                });
      case 'DATA_PROYEK_P5':
        return React.createElement(DataProyekP5Page, {
                  students: students,
                  projects: p5Projects,
                  assessments: p5Assessments,
                  onUpdateProject: handleUpdateP5Project,
                  onDeleteProject: handleDeleteP5Project,
                  onUpdateAssessment: handleUpdateP5Assessment,
                  onBulkUpdateAssessments: handleBulkUpdateP5Assessments,
                  showToast: showToast
                });
      case 'PENGATURAN':
        return React.createElement(SettingsPage, { 
                  settings: settings, 
                  onSettingsChange: handleSettingsChange, 
                  onSave: saveSettings, 
                  onUpdateKopLayout: handleUpdateKopLayout,
                  subjects: subjects,
                  onUpdateSubjects: handleUpdateSubjects,
                  extracurriculars: extracurriculars,
                  onUpdateExtracurriculars: handleUpdateExtracurriculars
                });
      case 'PRINT_RAPOR':
        return React.createElement(PrintRaporPage, { 
                  students: students,
                  settings: settings,
                  grades: grades,
                  attendance: attendance,
                  notes: notes,
                  subjects: subjects,
                  learningObjectives: learningObjectives,
                  studentExtracurriculars: studentExtracurriculars,
                  extracurriculars: extracurriculars,
                  p5Projects: p5Projects,
                  p5Assessments: p5Assessments,
                  showToast: showToast
                });
      default:
        const navItem = NAV_ITEMS.find(item => item.id === activePage);
        return React.createElement(PlaceholderPage, { title: navItem ? navItem.label : 'Halaman' });
    }
  };
  
  return (
    React.createElement(React.Fragment, null,
      React.createElement('div', { className: "flex h-screen bg-slate-100 font-sans" },
        React.createElement(Sidebar, {
          activePage: activePage,
          setActivePage: setActivePage,
          onExport: handleExportAll,
          onImport: handleImportAll,
        }),
        React.createElement('main', { className: "flex-1 p-6 lg:p-8 overflow-y-auto" },
          renderPage()
        )
      ),
      toast && (
        React.createElement(Toast, {
          message: toast.message,
          type: toast.type,
          onClose: () => setToast(null)
        })
      )
    )
  );
};

export default App;
