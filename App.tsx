import React, { useState, useCallback, useEffect } from 'react';
// FIX: Correctly import all necessary types from the `types` module.
import { Page, AppSettings, Student, StudentGrade, SubjectKey, LearningObjectives, StudentDescriptions, Subject, defaultSubjects, StudentAttendance, Extracurricular, StudentExtracurricular, StudentNotes, NoteTemplate, P5Project, P5ProjectAssessment, P5AssessmentLevel } from './types.ts';
import { NAV_ITEMS } from './constants.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import PlaceholderPage from './components/PlaceholderPage.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import DataSiswaPage from './components/DataSiswaPage.tsx';
import DataNilaiPage from './components/DataNilaiPage.tsx';
import DataAbsensiPage from './components/DataAbsensiPage.tsx';
import DataEkstrakurikulerPage from './components/DataEkstrakurikulerPage.tsx';
import CatatanWaliKelasPage from './components/CatatanWaliKelasPage.tsx';
import DataProyekP5Page from './components/DataProyekP5Page.tsx';
import Toast from './components/Toast.tsx';

declare const XLSX: any;

const initialSettings: AppSettings = {
  nama_sekolah: '', npsn: '', alamat_sekolah: '', desa_kelurahan: '',
  kecamatan: '', provinsi: '', kode_pos: '', email_sekolah: '',
  telepon_sekolah: '', website_sekolah: '', faksimile: '', logo_sekolah: null,
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: ''
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
    { 
        studentId: 1,
        detailedGrades: {}, // Initialize with an empty object
        finalGrades: {}
    }
];

const initialAttendance: StudentAttendance[] = [
    { studentId: 1, sakit: 0, izin: 0, alpa: 0 }
];

const initialStudentDescriptions: StudentDescriptions = {};

const initialStudentExtracurriculars: StudentExtracurricular[] = [
    { studentId: 1, assignedActivities: Array(5).fill(null), descriptions: {} }
];

const initialStudentNotes: StudentNotes = {
    1: 'Ananda Dummy Rummy menunjukkan perkembangan yang sangat baik dalam kemampuan literasi dan numerasi. Ia juga sangat aktif dalam kegiatan kelompok dan menunjukkan sikap kepemimpinan. Perlu terus didukung untuk meningkatkan kepercayaan dirinya saat tampil di depan kelas.'
};


const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('DASHBOARD');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
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
        const parsed = saved ? JSON.parse(saved) : initialGrades;
        return parsed.map((g: StudentGrade) => ({ ...g, detailedGrades: g.detailedGrades || {}, finalGrades: g.finalGrades || {} }));
    } catch (e) {
        return initialGrades;
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
        return saved ? JSON.parse(saved) : initialStudentDescriptions;
    } catch (e) {
        return initialStudentDescriptions;
    }
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
        const saved = localStorage.getItem('appSubjectsConfig');
        return saved ? JSON.parse(saved) : defaultSubjects;
    } catch (e) {
        return defaultSubjects;
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
  const [studentNotes, setStudentNotes] = useState<StudentNotes>(() => {
    try {
        const saved = localStorage.getItem('appStudentNotes');
        return saved ? JSON.parse(saved) : initialStudentNotes;
    } catch (e) {
        return initialStudentNotes;
    }
  });
  
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>(() => {
    try {
        const saved = localStorage.getItem('appNoteTemplates');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  const [p5Projects, setP5Projects] = useState<P5Project[]>(() => {
      try {
          const saved = localStorage.getItem('appP5Projects');
          return saved ? JSON.parse(saved) : [];
      } catch {
          return [];
      }
  });

    const [p5ProjectAssessments, setP5ProjectAssessments] = useState<P5ProjectAssessment[]>(() => {
      try {
          const saved = localStorage.getItem('appP5Assessments');
          return saved ? JSON.parse(saved) : [];
      } catch {
          return [];
      }
  });

  // Effect to load presets from presets.json if not already in localStorage
  useEffect(() => {
    const loadPresets = async () => {
        try {
            const response = await fetch('/presets.json');
            if (!response.ok) {
                throw new Error('Failed to load presets file.');
            }
            const presets = await response.json();

            if (localStorage.getItem('appLearningObjectives') === null && presets.learningObjectives) {
                setLearningObjectives(presets.learningObjectives);
            }
            
            if (presets.extracurriculars) {
                setExtracurriculars(prev => {
                    const existingIds = new Set(prev.map(e => e.id));
                    const newExtracurriculars = presets.extracurriculars.filter((e: Extracurricular) => !existingIds.has(e.id));
                    return [...prev, ...newExtracurriculars];
                });
            }

            if (localStorage.getItem('appNoteTemplates') === null && presets.studentNotesTemplates) {
                setNoteTemplates(presets.studentNotesTemplates);
            }
            if (localStorage.getItem('appP5Projects') === null && presets.p5Projects) {
                setP5Projects(presets.p5Projects);
            }

        } catch (error) {
            console.error("Error loading presets:", error);
        }
    };

    loadPresets();
  }, []);


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
    localStorage.setItem('appAttendance', JSON.stringify(attendance));
  }, [attendance]);
  
  useEffect(() => {
    localStorage.setItem('appLearningObjectives', JSON.stringify(learningObjectives));
  }, [learningObjectives]);

  useEffect(() => {
    localStorage.setItem('appStudentDescriptions', JSON.stringify(studentDescriptions));
    }, [studentDescriptions]);
    
  useEffect(() => {
    localStorage.setItem('appSubjectsConfig', JSON.stringify(subjects));
  }, [subjects]);
  
  useEffect(() => {
    localStorage.setItem('appExtracurriculars', JSON.stringify(extracurriculars));
  }, [extracurriculars]);

  useEffect(() => {
    localStorage.setItem('appStudentExtracurriculars', JSON.stringify(studentExtracurriculars));
  }, [studentExtracurriculars]);

  useEffect(() => {
    localStorage.setItem('appStudentNotes', JSON.stringify(studentNotes));
  }, [studentNotes]);
  
  useEffect(() => {
    localStorage.setItem('appNoteTemplates', JSON.stringify(noteTemplates));
  }, [noteTemplates]);

  useEffect(() => {
      localStorage.setItem('appP5Projects', JSON.stringify(p5Projects));
  }, [p5Projects]);

  useEffect(() => {
      localStorage.setItem('appP5Assessments', JSON.stringify(p5ProjectAssessments));
  }, [p5ProjectAssessments]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

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

  const saveSettings = useCallback(() => {
    showToast('Pengaturan berhasil disimpan!', 'success');
  }, []);
  
  const handleSaveStudent = useCallback((studentData: Omit<Student, 'id'> & { id?: number }) => {
    setStudents(prev => {
        if (studentData.id) {
            return prev.map(s => s.id === studentData.id ? { ...s, ...studentData } as Student : s);
        } else {
            const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
            const newStudent = { ...studentData, id: newId } as Student;
            setGrades(g_prev => [...g_prev, { studentId: newId, detailedGrades: {}, finalGrades: {} }]);
            setAttendance(a_prev => [...a_prev, { studentId: newId, sakit: 0, izin: 0, alpa: 0 }]);
            setStudentExtracurriculars(se_prev => [...se_prev, { studentId: newId, assignedActivities: Array(5).fill(null), descriptions: {} }]);
            return [...prev, newStudent];
        }
    });
  }, []);

  const handleBulkAddStudents = useCallback((newStudentsData: Omit<Student, 'id'>[]) => {
    setStudents(prev => {
        let maxId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) : 0;
        const newStudentsWithIds: Student[] = [];
        const newGrades: StudentGrade[] = [];
        const newAttendances: StudentAttendance[] = [];
        const newStudentExtracurriculars: StudentExtracurricular[] = [];


        newStudentsData.forEach(studentData => {
            maxId++;
            const newStudent = { ...studentData, id: maxId } as Student;
            newStudentsWithIds.push(newStudent);
            newGrades.push({ studentId: maxId, detailedGrades: {}, finalGrades: {} });
            newAttendances.push({ studentId: maxId, sakit: 0, izin: 0, alpa: 0 });
            newStudentExtracurriculars.push({ studentId: maxId, assignedActivities: Array(5).fill(null), descriptions: {} });
        });
        
        setGrades(g_prev => [...g_prev, ...newGrades]);
        setAttendance(a_prev => [...a_prev, ...newAttendances]);
        setStudentExtracurriculars(se_prev => [...se_prev, ...newStudentExtracurriculars]);
        return [...prev, ...newStudentsWithIds];
    });
  }, []);

  const handleDeleteStudent = useCallback((studentId: number) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
    setAttendance(prev => prev.filter(a => a.studentId !== studentId));
    setStudentExtracurriculars(prev => prev.filter(se => se.studentId !== studentId));
    setStudentNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[studentId];
        return newNotes;
    });
  }, []);
  
  const handleUpdateGrade = useCallback((studentId: number, subject: SubjectKey, value: number | null) => {
    setGrades(prev => {
        const studentGradeIndex = prev.findIndex(g => g.studentId === studentId);
        if (studentGradeIndex > -1) {
            const updatedGrades = [...prev];
            const studentGrade = { ...updatedGrades[studentGradeIndex] };
            studentGrade.finalGrades = studentGrade.finalGrades || {};
            studentGrade.finalGrades[subject] = value;
            updatedGrades[studentGradeIndex] = studentGrade;
            return updatedGrades;
        }
        return [...prev, { studentId, detailedGrades: {}, finalGrades: { [subject]: value } }];
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
        if (studentGradeIndex === -1) return prev;

        const updatedGrades = [...prev];
        const studentGrade = { ...updatedGrades[studentGradeIndex] };
        
        studentGrade.detailedGrades = studentGrade.detailedGrades || {};
        const subjectDetailedGrade = studentGrade.detailedGrades[subject] || { tp: [], sts: null, sas: null };
        const newDetailedGrade = { ...subjectDetailedGrade };

        if (type === 'tp' && tpIndex !== undefined) {
            const newTp = [...newDetailedGrade.tp];
            while (newTp.length <= tpIndex) {
                newTp.push(null);
            }
            newTp[tpIndex] = value;
            newDetailedGrade.tp = newTp;
        } else if (type === 'sts') {
            newDetailedGrade.sts = value;
        } else if (type === 'sas') {
            newDetailedGrade.sas = value;
        }

        studentGrade.detailedGrades[subject] = newDetailedGrade;
        
        const validTps = (newDetailedGrade.tp || []).filter(t => typeof t === 'number') as number[];
        const averageTp = validTps.length > 0 ? validTps.reduce((a, b) => a + b, 0) / validTps.length : 0;
        const sts = newDetailedGrade.sts ?? 0;
        const sas = newDetailedGrade.sas ?? 0;

        const finalGrade = (averageTp + sts + sas) / 3;
        studentGrade.finalGrades = studentGrade.finalGrades || {};
        studentGrade.finalGrades[subject] = Math.round(finalGrade);

        updatedGrades[studentGradeIndex] = studentGrade;
        return updatedGrades;
    });
  }, []);

  const handleBulkUpdateGrades = useCallback((newGrades: StudentGrade[]) => {
    setGrades(prev => {
        const updatedGradesMap = new Map(prev.map(g => [g.studentId, g]));
        newGrades.forEach(newGrade => {
            const existing = updatedGradesMap.get(newGrade.studentId) || { studentId: newGrade.studentId, detailedGrades: {}, finalGrades: {} };
            updatedGradesMap.set(newGrade.studentId, { ...existing, ...newGrade });
        });
        return Array.from(updatedGradesMap.values());
    });
  }, []);

  const handleUpdateAttendance = useCallback((studentId: number, type: 'sakit' | 'izin' | 'alpa', value: number) => {
    setAttendance(prev => {
        const studentAttendanceIndex = prev.findIndex(a => a.studentId === studentId);
        const newAttendance = [...prev];
        if (studentAttendanceIndex > -1) {
            const updatedStudentAttendance = { ...newAttendance[studentAttendanceIndex] };
            updatedStudentAttendance[type] = value >= 0 ? value : 0;
            newAttendance[studentAttendanceIndex] = updatedStudentAttendance;
        } else {
            const newStudentAttendance = { studentId, sakit: 0, izin: 0, alpa: 0 };
            newStudentAttendance[type] = value >= 0 ? value : 0;
            newAttendance.push(newStudentAttendance);
        }
        return newAttendance;
    });
  }, []);

  const handleBulkUpdateAttendance = useCallback((newAttendanceData: StudentAttendance[]) => {
    setAttendance(prev => {
        const attendanceMap = new Map(prev.map(a => [a.studentId, a]));
        newAttendanceData.forEach(newAtt => {
            const existing = attendanceMap.get(newAtt.studentId) || { studentId: newAtt.studentId, sakit: 0, izin: 0, alpa: 0 };
            attendanceMap.set(newAtt.studentId, { ...existing, ...newAtt });
        });
        return Array.from(attendanceMap.values());
    });
  }, []);

  const handleBulkUpdateStudentExtracurriculars = useCallback((newData: StudentExtracurricular[]) => {
    setStudentExtracurriculars(prev => {
      const dataMap = new Map(prev.map(item => [item.studentId, item]));
      newData.forEach(newItem => {
        const existing = dataMap.get(newItem.studentId) || { studentId: newItem.studentId, assignedActivities: Array(5).fill(null), descriptions: {} };
        
        const updatedItem = { ...existing };
        if (newItem.assignedActivities !== undefined) {
            updatedItem.assignedActivities = newItem.assignedActivities;
        }
        if (newItem.descriptions !== undefined) {
            updatedItem.descriptions = { ...existing.descriptions, ...newItem.descriptions };
        }

        dataMap.set(newItem.studentId, updatedItem);
      });
      return Array.from(dataMap.values());
    });
  }, []);

  const handleUpdateStudentNote = useCallback((studentId: number, note: string) => {
    setStudentNotes(prev => ({
        ...prev,
        [studentId]: note,
    }));
  }, []);

  const handleBulkUpdateStudentNotes = useCallback((newNotesData: StudentNotes) => {
      setStudentNotes(prev => ({
          ...prev,
          ...newNotesData
      }));
  }, []);

    const handleUpdateP5Project = useCallback((project: P5Project) => {
        setP5Projects(prev => {
            const exists = prev.some(p => p.id === project.id);
            if (exists) {
                return prev.map(p => p.id === project.id ? project : p);
            }
            return [...prev, project];
        });
    }, []);

    const handleDeleteP5Project = useCallback((projectId: string) => {
        setP5Projects(prev => prev.filter(p => p.id !== projectId));
        setP5ProjectAssessments(prev => prev.filter(a => a.projectId !== projectId));
    }, []);

    const handleUpdateP5Assessment = useCallback((studentId: number, projectId: string, subElementKey: string, level: P5AssessmentLevel | '') => {
        setP5ProjectAssessments(prev => {
            const assessmentIndex = prev.findIndex(a => a.studentId === studentId && a.projectId === projectId);
            const updatedAssessments = [...prev];

            if (assessmentIndex > -1) {
                const newAssessment = { ...updatedAssessments[assessmentIndex] };
                newAssessment.assessments = { ...newAssessment.assessments };
                newAssessment.assessments[subElementKey] = level;
                updatedAssessments[assessmentIndex] = newAssessment;
            } else {
                const newAssessment: P5ProjectAssessment = {
                    studentId,
                    projectId,
                    assessments: { [subElementKey]: level }
                };
                updatedAssessments.push(newAssessment);
            }
            return updatedAssessments;
        });
    }, []);

    const handleBulkUpdateP5Assessments = useCallback((updates: { studentId: number, projectId: string, subElementKey: string, level: P5AssessmentLevel | '' }[]) => {
        setP5ProjectAssessments(prev => {
            // Create a deep copy of the relevant assessments to avoid direct mutation
            const assessmentsMap = new Map<string, P5ProjectAssessment>();
            prev.forEach(a => assessmentsMap.set(`${a.studentId}-${a.projectId}`, JSON.parse(JSON.stringify(a))));
    
            updates.forEach(update => {
                const mapKey = `${update.studentId}-${update.projectId}`;
                let studentProjectAssessment = assessmentsMap.get(mapKey);
    
                if (!studentProjectAssessment) {
                    studentProjectAssessment = {
                        studentId: update.studentId,
                        projectId: update.projectId,
                        assessments: {}
                    };
                }
                
                // This is now a safe copy to mutate
                studentProjectAssessment.assessments[update.subElementKey] = update.level;
                assessmentsMap.set(mapKey, studentProjectAssessment);
            });
    
            return Array.from(assessmentsMap.values());
        });
    }, []);

  const handleExportAll = useCallback(() => {
    try {
        const data = { settings, students, grades, learningObjectives, studentDescriptions, subjects, attendance, extracurriculars, studentExtracurriculars, studentNotes, p5Projects, p5ProjectAssessments };
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
        showToast('Gagal mengekspor data.', 'error');
    }
  }, [settings, students, grades, learningObjectives, studentDescriptions, subjects, attendance, extracurriculars, studentExtracurriculars, studentNotes, p5Projects, p5ProjectAssessments]);

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
                    if (data.learningObjectives) setLearningObjectives(data.learningObjectives);
                    if (data.studentDescriptions) setStudentDescriptions(data.studentDescriptions);
                    if (data.subjects) setSubjects(data.subjects);
                    if (data.attendance) setAttendance(data.attendance);
                    if (data.extracurriculars) setExtracurriculars(data.extracurriculars);
                    if (data.studentExtracurriculars) setStudentExtracurriculars(data.studentExtracurriculars);
                    if (data.studentNotes) setStudentNotes(data.studentNotes);
                    if (data.p5Projects) setP5Projects(data.p5Projects);
                    if (data.p5ProjectAssessments) setP5ProjectAssessments(data.p5ProjectAssessments);
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
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'DASHBOARD':
        return <Dashboard setActivePage={setActivePage} settings={settings} students={students} />;
      case 'DATA_SISWA':
        return <DataSiswaPage students={students} namaKelas={settings.nama_kelas} onSaveStudent={handleSaveStudent} onBulkAddStudents={handleBulkAddStudents} onDeleteStudent={handleDeleteStudent} showToast={showToast} />;
      case 'DATA_NILAI':
        return <DataNilaiPage 
                    students={students} 
                    grades={grades} 
                    namaKelas={settings.nama_kelas} 
                    onUpdateGrade={handleUpdateGrade}
                    onUpdateDetailedGrade={handleUpdateDetailedGrade} 
                    onBulkUpdateGrades={handleBulkUpdateGrades}
                    learningObjectives={learningObjectives}
                    onUpdateLearningObjectives={setLearningObjectives}
                    studentDescriptions={studentDescriptions}
                    onUpdateStudentDescriptions={setStudentDescriptions}
                    subjects={subjects}
                    onUpdateSubjects={setSubjects}
                    showToast={showToast}
                />;
      case 'DATA_ABSENSI':
        return <DataAbsensiPage 
                  students={students} 
                  attendance={attendance}
                  onUpdateAttendance={handleUpdateAttendance}
                  onBulkUpdateAttendance={handleBulkUpdateAttendance}
                  showToast={showToast}
                />;
      case 'DATA_EKSTRAKURIKULER':
        return <DataEkstrakurikulerPage
                    students={students}
                    extracurriculars={extracurriculars}
                    studentExtracurriculars={studentExtracurriculars}
                    onUpdateExtracurriculars={setExtracurriculars}
                    onUpdateStudentExtracurriculars={setStudentExtracurriculars}
                    onBulkUpdateStudentExtracurriculars={handleBulkUpdateStudentExtracurriculars}
                    showToast={showToast}
                />;
        case 'DATA_PROYEK_P5':
            return <DataProyekP5Page
                students={students}
                projects={p5Projects}
                assessments={p5ProjectAssessments}
                onUpdateProject={handleUpdateP5Project}
                onDeleteProject={handleDeleteP5Project}
                onUpdateAssessment={handleUpdateP5Assessment}
                onBulkUpdateAssessments={handleBulkUpdateP5Assessments}
                showToast={showToast}
            />;
      case 'CATATAN_WALI_KELAS':
        return <CatatanWaliKelasPage
                  students={students}
                  notes={studentNotes}
                  onUpdateNote={handleUpdateStudentNote}
                  onBulkUpdateNotes={handleBulkUpdateStudentNotes}
                  showToast={showToast}
                />;
      case 'PENGATURAN':
        return <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} onSave={saveSettings} />;
      default:
        const navItem = NAV_ITEMS.find(item => item.id === activePage);
        return <PlaceholderPage title={navItem ? navItem.label : 'Halaman'} />;
    }
  };
  
  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
  );
};

export default App;
