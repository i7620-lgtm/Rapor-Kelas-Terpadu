import React, { useState, useCallback, useEffect } from 'react';
import { Page, AppSettings, Student, StudentGrade, SubjectKey, StudentNotes, StudentAttendance, Extracurricular, StudentExtracurricular, P5Project, P5ProjectAssessment, Subject, LearningObjectives, StudentDescriptions, defaultSubjects, NoteTemplate, P5ProjectDimension, KopLayout } from './types';
import { NAV_ITEMS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlaceholderPage from './components/PlaceholderPage';
import SettingsPage from './components/SettingsPage';
import DataSiswaPage from './components/DataSiswaPage';
import DataNilaiPage from './components/DataNilaiPage';
import CatatanWaliKelasPage from './components/CatatanWaliKelasPage';
import DataAbsensiPage from './components/DataAbsensiPage';
import DataEkstrakurikulerPage from './components/DataEkstrakurikulerPage';
import DataProyekP5Page from './components/DataProyekP5Page';
import PrintRaporPage from './components/PrintRaporPage';
import Toast from './components/Toast';


declare const XLSX: any;

const initialSettings: AppSettings = {
  nama_dinas_pendidikan: '', nama_sekolah: '', npsn: '', alamat_sekolah: '', desa_kelurahan: '',
  kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '', email_sekolah: '',
  telepon_sekolah: '', website_sekolah: '', faksimile: '', logo_sekolah: null,
  logo_dinas: null, nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  kop_layout: []
};

const initialStudents: Student[] = [
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

const initialGrades: StudentGrade[] = [
    { studentId: 1, detailedGrades: {}, finalGrades: {} }
];

const initialNotes: StudentNotes = {
    1: 'Siswa menunjukkan perkembangan yang baik dalam aspek akademik dan aktif dalam kegiatan kelas. Perlu meningkatkan konsentrasi saat pelajaran berlangsung.'
};

const initialAttendance: StudentAttendance[] = [
    { studentId: 1, sakit: 1, izin: 2, alpa: 0 }
];

const initialStudentExtracurriculars: StudentExtracurricular[] = [
    { studentId: 1, assignedActivities: ['PRAMUKA', null, null, null, null], descriptions: { 'PRAMUKA': 'Ananda Rummy sangat aktif dan antusias dalam mengikuti kegiatan Pramuka.' } }
];

const initialP5Assessments: P5ProjectAssessment[] = [
    {
        studentId: 1,
        projectId: 'P5_BHINNEKA',
        assessments: {}
    }
];

const getGradeNumber = (str: string): number | null => {
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

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('DASHBOARD');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState<any>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : initialSettings;
    } catch (e) {
        return initialSettings;
    }
  });
  const [students, setStudents] = useState<Student[]>(() => {
    try {
        const saved = localStorage.getItem('appStudents');
        return saved ? JSON.parse(saved) : initialStudents;
    } catch (e) {
        return initialStudents;
    }
  });
  const [grades, setGrades] = useState<StudentGrade[]>(() => {
    try {
        const saved = localStorage.getItem('appGrades');
        return saved ? JSON.parse(saved) : initialGrades;
    } catch (e) {
        return initialGrades;
    }
  });
  const [notes, setNotes] = useState<StudentNotes>(() => {
      try {
          const saved = localStorage.getItem('appNotes');
          return saved ? JSON.parse(saved) : initialNotes;
      } catch (e) {
          return initialNotes;
      }
  });
  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
      try {
          const saved = localStorage.getItem('appAttendance');
          return saved ? JSON.parse(saved) : initialAttendance;
      } catch (e) {
          return initialAttendance;
      }
  });
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => {
      try {
          const saved = localStorage.getItem('appExtracurriculars');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  const [studentExtracurriculars, setStudentExtracurriculars] = useState<StudentExtracurricular[]>(() => {
      try {
          const saved = localStorage.getItem('appStudentExtracurriculars');
          return saved ? JSON.parse(saved) : initialStudentExtracurriculars;
      } catch (e) {
          return initialStudentExtracurriculars;
      }
  });
   const [p5Projects, setP5Projects] = useState<P5Project[]>(() => {
      try {
          const saved = localStorage.getItem('appP5Projects');
          const parsed = saved ? JSON.parse(saved) : [];
          if (Array.isArray(parsed)) {
            return parsed.map(p => ({
              ...p,
              dimensions: Array.isArray(p.dimensions) ? p.dimensions.map((d: any) => typeof d === 'string' ? { name: d, subElements: [] } : d) : []
            }));
          }
          return [];
      } catch (e) {
          return [];
      }
  });
  const [p5Assessments, setP5Assessments] = useState<P5ProjectAssessment[]>(() => {
      try {
          const saved = localStorage.getItem('appP5Assessments');
          return saved ? JSON.parse(saved) : initialP5Assessments;
      } catch (e) {
          return initialP5Assessments;
      }
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
        const saved = localStorage.getItem('appSubjects');
        return saved ? JSON.parse(saved) : defaultSubjects;
    } catch (e) {
        return defaultSubjects;
    }
  });

  const [learningObjectives, setLearningObjectives] = useState<LearningObjectives>(() => {
      try {
          const saved = localStorage.getItem('appLearningObjectives');
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          return {};
      }
  });

  const [studentDescriptions, setStudentDescriptions] = useState<StudentDescriptions>(() => {
      try {
          const saved = localStorage.getItem('appStudentDescriptions');
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
                const projectsWithSubElements = (loadedPresets.p5Projects || []).map((p: any) => ({
                    ...p,
                    dimensions: (p.dimensions || []).map((d: any) => typeof d === 'string' ? { name: d, subElements: [] } : d)
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
        const savedObjectivesStr = localStorage.getItem('appLearningObjectives');
        
        // If there's a different class in settings compared to what's in storage, fetch new data
        if (!settings.nama_kelas) {
            if (savedObjectivesStr) {
                localStorage.removeItem('appLearningObjectives');
            }
            setLearningObjectives({});
            return;
        }

        const gradeNumber = getGradeNumber(settings.nama_kelas);
        if (gradeNumber === null) {
            setLearningObjectives({});
            return;
        }

        const gradeKey = `Kelas ${gradeNumber}`;
        const currentSavedGradeKey = savedObjectivesStr ? Object.keys(JSON.parse(savedObjectivesStr))[0] : null;

        // Fetch only if the class has changed or if there are no saved objectives
        if (gradeKey !== currentSavedGradeKey) {
            try {
                const response = await fetch(`/tp${gradeNumber}.json`);
                if (!response.ok) {
                    console.warn(`Could not load tp${gradeNumber}.json: ${response.statusText}`);
                    setLearningObjectives({}); // Set to empty if file not found
                    return;
                }
                const objectivesForClass = await response.json();
                setLearningObjectives({ [gradeKey]: objectivesForClass });
            } catch (err) {
                console.error(`Failed to load learning objectives for grade ${gradeNumber}:`, err);
                setLearningObjectives({});
            }
        }
    };

    loadLearningObjectives();
}, [settings.nama_kelas]);


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
      // Only save if there are objectives to save
      if (Object.keys(learningObjectives).length > 0) {
        localStorage.setItem('appLearningObjectives', JSON.stringify(learningObjectives));
      }
  }, [learningObjectives]);
  
  useEffect(() => {
      localStorage.setItem('appStudentDescriptions', JSON.stringify(studentDescriptions));
  }, [studentDescriptions]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const handleSettingsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files, type } = e.target;
    if (type === 'file' && files && files[0]) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(files[0]);
        fileReader.onload = () => {
            setSettings(prev => ({ ...prev, [name]: fileReader.result as string }));
        };
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleUpdateKopLayout = useCallback((newLayout: KopLayout) => {
    setSettings(prev => ({ ...prev, kop_layout: newLayout }));
  }, []);

  const saveSettings = useCallback(() => {
    showToast('Pengaturan berhasil disimpan!', 'success');
  }, [showToast]);
  
  const handleSaveStudent = useCallback((studentData: Omit<Student, 'id'> & { id?: number }) => {
    setStudents(prev => {
        if (studentData.id) {
            return prev.map(s => s.id === studentData.id ? { ...s, ...studentData } as Student : s);
        } else {
            const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
            const newStudent = { ...studentData, id: newId } as Student;
            setGrades(g_prev => [...g_prev, { studentId: newId, detailedGrades: {}, finalGrades: {} }]);
            setAttendance(a_prev => [...a_prev, { studentId: newId, sakit: 0, izin: 0, alpa: 0 }]);
            setStudentExtracurriculars(se_prev => [...se_prev, { studentId: newId, assignedActivities: [], descriptions: {} }]);
            return [...prev, newStudent];
        }
    });
  }, []);
  
  const handleBulkSaveStudents = useCallback((studentsData: Omit<Student, 'id'>[]) => {
    let newIdCounter = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    
    const newStudents: Student[] = [];
    const newGrades: StudentGrade[] = [];
    const newAttendance: StudentAttendance[] = [];
    const newStudentExtracurriculars: StudentExtracurricular[] = [];
    const newP5Assessments: P5ProjectAssessment[] = [];

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

  const handleDeleteStudent = useCallback((studentId: number) => {
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
  
  const handleUpdateGrade = useCallback((studentId: number, subject: SubjectKey, value: number | null) => {
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

  const handleBulkUpdateGrades = useCallback((newGrades: StudentGrade[]) => {
    setGrades(prev => {
        const updatedGradesMap = new Map<number, StudentGrade>(prev.map(g => [g.studentId, g]));
        newGrades.forEach(newGrade => {
            if (newGrade && typeof newGrade === 'object') {
              const existing = updatedGradesMap.get(newGrade.studentId) || { studentId: newGrade.studentId, detailedGrades: {}, finalGrades: {} };
              updatedGradesMap.set(newGrade.studentId, { ...existing, ...newGrade });
            }
        });
        return Array.from(updatedGradesMap.values());
    });
  }, []);

  const handleUpdateNote = useCallback((studentId: number, note: string) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
  }, []);

  const handleBulkUpdateNotes = useCallback((newNotes: StudentNotes) => {
    setNotes(prev => ({ ...prev, ...newNotes }));
  }, []);

  const handleUpdateAttendance = useCallback((studentId: number, type: 'sakit' | 'izin' | 'alpa', value: number) => {
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
  
  const handleBulkUpdateAttendance = useCallback((newAttendanceData: StudentAttendance[]) => {
      setAttendance(prev => {
          const updatedAttendanceMap = new Map<number, StudentAttendance>(prev.map(a => [a.studentId, a]));
          newAttendanceData.forEach(newAtt => {
              if (newAtt && typeof newAtt === 'object') {
                const existing = updatedAttendanceMap.get(newAtt.studentId) || { studentId: newAtt.studentId, sakit: 0, izin: 0, alpa: 0 };
                updatedAttendanceMap.set(newAtt.studentId, { ...existing, ...newAtt });
              }
          });
          return Array.from(updatedAttendanceMap.values());
      });
  }, []);

  const handleUpdateExtracurriculars = useCallback((newExtracurriculars: Extracurricular[]) => {
      setExtracurriculars(newExtracurriculars);
  }, []);
  
  const handleUpdateStudentExtracurriculars = useCallback((newStudentExtracurriculars: StudentExtracurricular[]) => {
      setStudentExtracurriculars(newStudentExtracurriculars);
  }, []);

  const handleBulkUpdateStudentExtracurriculars = useCallback((newData: StudentExtracurricular[]) => {
    setStudentExtracurriculars(prev => {
      const dataMap = new Map<number, StudentExtracurricular>(prev.map(item => [item.studentId, item]));
      newData.forEach(newItem => {
        if (newItem && typeof newItem === 'object') {
          const existing = dataMap.get(newItem.studentId) || { studentId: newItem.studentId, assignedActivities: [], descriptions: {} };
          dataMap.set(newItem.studentId, { ...existing, ...newItem });
        }
      });
      return Array.from(dataMap.values());
    });
  }, []);

  const handleUpdateDetailedGrade = useCallback((
      studentId: number,
      subject: SubjectKey,
      type: 'tp' | 'sts' | 'sas',
      value: number | null,
      tpIndex?: number
  ) => {
      setGrades(prev => {
          const studentGradeIndex = prev.findIndex(g => g.studentId === studentId);
          const updatedGrades = [...prev];

          let newGrade: StudentGrade;
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

          const validTps = tpsToConsider.filter((t): t is number => typeof t === 'number');
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

  const handleUpdateSubjects = useCallback((newSubjects: Subject[]) => {
      setSubjects(newSubjects);
  }, []);

  const handleUpdateLearningObjectives = useCallback((newObjectives: LearningObjectives) => {
      setLearningObjectives(newObjectives);
  }, []);

  const handleUpdateStudentDescriptions = useCallback((newDescriptions: StudentDescriptions) => {
      setStudentDescriptions(newDescriptions);
  }, []);

  const handleUpdateP5Project = useCallback((project: P5Project) => {
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

  const handleDeleteP5Project = useCallback((projectId: string) => {
      setP5Projects(prev => prev.filter(p => p.id !== projectId));
      setP5Assessments(prev => prev.filter(a => a.projectId !== projectId));
  }, []);

  const handleUpdateP5Assessment = useCallback((studentId: number, projectId: string, subElementKey: string, level: any) => {
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

  const handleBulkUpdateP5Assessments = useCallback((updates: { studentId: number; projectId: string; subElementKey: string; level: any; }[]) => {
    setP5Assessments(prev => {
        const assessmentsMap = new Map<string, P5ProjectAssessment>();
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
    try {
        const data = { settings, students, grades, notes, attendance, extracurriculars, studentExtracurriculars, p5Projects, p5Assessments, subjects, learningObjectives, studentDescriptions };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `RKT_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Seluruh data berhasil diekspor!', 'success');
    } catch (error) {
        console.error("Gagal mengekspor data:", error);
        showToast("Gagal mengekspor data.", 'error');
    }
  }, [settings, students, grades, notes, attendance, extracurriculars, studentExtracurriculars, p5Projects, p5Assessments, subjects, learningObjectives, studentDescriptions, showToast]);

  const handleImportAll = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.settings && data.students && data.grades) {
                    setSettings(data.settings);
                    setStudents(data.students);
                    setGrades(data.grades);
                    setNotes(data.notes || {});
                    setAttendance(data.attendance || []);
                    setExtracurriculars(data.extracurriculars || []);
                    setStudentExtracurriculars(data.studentExtracurriculars || []);
                    setP5Projects(data.p5Projects || []);
                    setP5Assessments(data.p5Assessments || []);
                    setSubjects(data.subjects || defaultSubjects);
                    setLearningObjectives(data.learningObjectives || {});
                    setStudentDescriptions(data.studentDescriptions || {});
                    showToast("Data berhasil diimpor!", 'success');
                } else {
                    showToast("File impor tidak valid.", 'error');
                }
            } catch (error) {
                console.error("Gagal mengimpor data:", error);
                showToast("Gagal membaca file impor.", 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
  }, [showToast]);

  const renderPage = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p>Memuat data awal...</p></div>;
    }

    switch (activePage) {
      case 'DASHBOARD':
        return <Dashboard setActivePage={setActivePage} settings={settings} students={students} />;
      case 'DATA_SISWA':
        return <DataSiswaPage students={students} namaKelas={settings.nama_kelas} onSaveStudent={handleSaveStudent} onBulkSaveStudents={handleBulkSaveStudents} onDeleteStudent={handleDeleteStudent} showToast={showToast} />;
      case 'DATA_NILAI':
        return <DataNilaiPage 
                  students={students} 
                  grades={grades} 
                  namaKelas={settings.nama_kelas} 
                  onUpdateGrade={handleUpdateGrade} 
                  onBulkUpdateGrades={handleBulkUpdateGrades}
                  onUpdateDetailedGrade={handleUpdateDetailedGrade}
                  learningObjectives={learningObjectives}
                  onUpdateLearningObjectives={handleUpdateLearningObjectives}
                  studentDescriptions={studentDescriptions}
                  onUpdateStudentDescriptions={handleUpdateStudentDescriptions}
                  subjects={subjects}
                  onUpdateSubjects={handleUpdateSubjects}
                  showToast={showToast}
                />;
      case 'DATA_ABSENSI':
        return <DataAbsensiPage students={students} attendance={attendance} onUpdateAttendance={handleUpdateAttendance} onBulkUpdateAttendance={handleBulkUpdateAttendance} showToast={showToast} />;
      case 'CATATAN_WALI_KELAS':
        return <CatatanWaliKelasPage students={students} notes={notes} onUpdateNote={handleUpdateNote} onBulkUpdateNotes={handleBulkUpdateNotes} showToast={showToast} noteTemplates={presets?.studentNotesTemplates || []} />;
      case 'DATA_EKSTRAKURIKULER':
        return <DataEkstrakurikulerPage 
                  students={students}
                  extracurriculars={extracurriculars}
                  studentExtracurriculars={studentExtracurriculars}
                  onUpdateExtracurriculars={handleUpdateExtracurriculars}
                  onUpdateStudentExtracurriculars={handleUpdateStudentExtracurriculars}
                  onBulkUpdateStudentExtracurriculars={handleBulkUpdateStudentExtracurriculars}
                  showToast={showToast}
                />;
      case 'DATA_PROYEK_P5':
        return <DataProyekP5Page
                  students={students}
                  projects={p5Projects}
                  assessments={p5Assessments}
                  onUpdateProject={handleUpdateP5Project}
                  onDeleteProject={handleDeleteP5Project}
                  onUpdateAssessment={handleUpdateP5Assessment}
                  onBulkUpdateAssessments={handleBulkUpdateP5Assessments}
                  showToast={showToast}
                />;
      case 'PENGATURAN':
        return <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} onSave={saveSettings} onUpdateKopLayout={handleUpdateKopLayout} />;
      case 'PRINT_RAPOR':
        return <PrintRaporPage 
                  students={students}
                  settings={settings}
                  grades={grades}
                  attendance={attendance}
                  notes={notes}
                  subjects={subjects}
                  studentDescriptions={studentDescriptions}
                  studentExtracurriculars={studentExtracurriculars}
                  extracurriculars={extracurriculars}
                  p5Projects={p5Projects}
                  p5Assessments={p5Assessments}
                  showToast={showToast}
                />;
      default:
        const navItem = NAV_ITEMS.find(item => item.id === activePage);
        return <PlaceholderPage title={navItem ? navItem.label : 'Halaman'} />;
    }
  };
  
  return (
    <>
      <div className="flex h-screen bg-slate-100 font-sans">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onExport={handleExportAll}
          onImport={handleImportAll}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
