import React, { useState, useCallback, useEffect } from 'react';
import { NAV_ITEMS } from './constants.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import PlaceholderPage from './components/PlaceholderPage.js';
import SettingsPage from './components/SettingsPage.js';
import DataSiswaPage from './components/DataSiswaPage.js';
import DataNilaiPage, { getGradeNumber } from './components/DataNilaiPage.js'; // Import getGradeNumber
import CatatanWaliKelasPage from './components/CatatanWaliKelasPage.js';
import DataAbsensiPage from './components/DataAbsensiPage.js';
import DataEkstrakurikulerPage from './components/DataEkstrakurikulerPage.js';
import PrintRaporPage from './components/PrintRaporPage.js';
import PrintLegerPage from './components/PrintLegerPage.js';
import Toast from './components/Toast.js';
import useServiceWorker from './hooks/useServiceWorker.js';

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
  logo_dinas: null, logo_cover: null,
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
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
    { studentId: 1, detailedGrades: {"BIndo":{"tp":[30],"sts":null,"sas":null}}, finalGrades: {"BIndo":10} }
];

const initialNotes = {
    1: 'Siswa menunjukkan perkembangan yang baik dalam aspek akademik dan aktif dalam kegiatan kelas. Perlu meningkatkan konsentrasi saat pelajaran berlangsung.'
};

const initialAttendance = [
    { studentId: 1, sakit: null, izin: null, alpa: null } // Changed 0 to null
];

const initialStudentExtracurriculars = [
    { studentId: 1, assignedActivities: ['PRAMUKA', null, null, null, null], descriptions: { 'PRAMUKA': 'Ananda Rummy sangat aktif dan antusias dalam mengikuti kegiatan Pramuka.' } }
];

const App = () => {
  const { isUpdateAvailable, updateAssets } = useServiceWorker();
  const [activePage, setActivePage] = useState('DASHBOARD');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState(null);
  const [dataNilaiInitialTab, setDataNilaiInitialTab] = useState('keseluruhan');
  
  const [settings, setSettings] = useState(() => {
    try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Perform a merge to ensure all properties from initialSettings are present,
            // and nested objects like predikats are handled correctly.
            return {
                ...initialSettings,
                ...parsed,
                predikats: {
                    ...initialSettings.predikats,
                    ...(parsed.predikats || {})
                }
            };
        }
        return initialSettings;
    } catch (e) {
        // If parsing fails, return initial settings.
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
          // For existing data, if 0, keep it 0. For new data, initialize to null.
          const parsed = saved ? JSON.parse(saved) : initialAttendance;
          return parsed.map(att => ({
              studentId: att.studentId,
              sakit: att.sakit === 0 ? 0 : (att.sakit ?? null), // Treat 0 as explicit 0, otherwise null
              izin: att.izin === 0 ? 0 : (att.izin ?? null),
              alpa: att.alpa === 0 ? 0 : (att.alpa ?? null)
          }));
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
    localStorage.setItem('appSubjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
      if (Object.keys(learningObjectives).length > 0) {
        localStorage.setItem('appLearningObjectives', JSON.stringify(learningObjectives));
      }
  }, [learningObjectives]);
  
  useEffect(() => {
    if (activePage !== 'DATA_NILAI') {
        setDataNilaiInitialTab('keseluruhan');
    }
  }, [activePage]);

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
            setAttendance(a_prev => [...a_prev, { studentId: newId, sakit: null, izin: null, alpa: null }]); // Initialized with null
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

    studentsData.forEach(studentData => {
        const newId = newIdCounter++;
        newStudents.push({ ...studentData, id: newId });
        newGrades.push({ studentId: newId, detailedGrades: {}, finalGrades: {} });
        newAttendance.push({ studentId: newId, sakit: null, izin: null, alpa: null }); // Initialized with null
        newStudentExtracurriculars.push({ studentId: newId, assignedActivities: [], descriptions: {} });
    });

    setStudents(prev => [...prev, ...newStudents]);
    setGrades(prev => [...prev, ...newGrades]);
    setAttendance(prev => [...prev, ...newAttendance]);
    setStudentExtracurriculars(prev => [...prev, ...newStudentExtracurriculars]);

    showToast(`${newStudents.length} siswa berhasil diimpor!`, 'success');
  }, [students, showToast]);

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
        
        let numericValue = parseInt(value, 10);
        // Treat empty string or invalid number input as null
        if (value === '' || isNaN(numericValue) || numericValue < 0) {
            numericValue = null;
        }

        if (studentAttIndex > -1) {
            const newAtt = { ...updatedAttendance[studentAttIndex], [type]: numericValue };
            updatedAttendance[studentAttIndex] = newAtt;
        } else {
            // Initialize other attendance types to null for a new entry
            const newEntry = { studentId, sakit: null, izin: null, alpa: null, [type]: numericValue };
            updatedAttendance.push(newEntry);
        }
        return updatedAttendance;
    });
  }, []);
  
  const handleBulkUpdateAttendance = useCallback((newAttendanceData) => {
      setAttendance(prev => {
          const updatedAttendanceMap = new Map(prev.map(a => [a.studentId, a]));
          newAttendanceData.forEach(newAtt => {
              if (newAtt && typeof newAtt === 'object') {
                const existing = updatedAttendanceMap.get(newAtt.studentId) || { studentId: newAtt.studentId, sakit: null, izin: null, alpa: null }; // Initialize with null
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
            ["Data Absensi", "Isi jumlah absensi (Sakit, Izin, Alpa) untuk setiap siswa. Kosongkan jika tidak ada absensi untuk jenis tersebut."],
            ["Catatan Wali Kelas", "Isi catatan atau feedback untuk setiap siswa."],
            ["Data Ekstrakurikuler", "Isi ekstrakurikuler yang diikuti siswa dan deskripsinya. Nama ekstrakurikuler harus sesuai dengan yang ada di Pengaturan."],
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
        
        // Add logos by chunking them to avoid cell character limit
        const CHUNK_SIZE = 32000;
        const addChunkedData = (label, data) => {
            const dataStr = data || '';
            if (dataStr.length > CHUNK_SIZE) {
                for (let i = 0, part = 1; i < dataStr.length; i += CHUNK_SIZE, part++) {
                    const chunk = dataStr.substring(i, i + CHUNK_SIZE);
                    settingsDataAoA.push([`${label} - Part ${part}`, chunk]);
                }
            } else {
                settingsDataAoA.push([label, dataStr]);
            }
        };

        addChunkedData('Logo Sekolah (Base64)', settings.logo_sekolah);
        addChunkedData('Logo Dinas Pendidikan (Base64)', settings.logo_dinas);
        addChunkedData('Logo Cover Rapor (Base64)', settings.logo_cover);
        
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
            ['no', "No"], ['namaLengkap', "Nama Lengkap"], ['namaPanggilan', "Nama Panggilan"], ['nis', "NIS"], ['nisn', "NISN"], ['tempatLahir', "Tempat Lahir"], ['tanggalLahir', "Tanggal Lahir"], ['jenisKelamin', "Jenis Kelamin"], ['agama', "Agama"], ['asalTk', "Asal TK"], ['alamatSiswa', "Alamat Siswa"], ['diterimaDiKelas', "Diterima di Kelas"], ['diterimaTanggal', "Diterima Tanggal"], ['namaAyah', "Nama Ayah"], ['namaIbu', "Nama Ibu"], ['pekerjaanAyah', "Pekerjaan Ayah"], ['pekerjaanIbu', "Pekerjaan Ibu"], ['alamatOrangTua', "Alamat Orang Tua"], ['teleponOrangTua', "Telepon Orang Tua"], ['namaWali', "Nama Wali"], ['pekerjaanWali', "Pekerjaan Wali"], ['alamatWali', "Alamat Wali"], ['teleponWali', "Telepon Wali"]
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
            const studentAtt = attendance.find(a => a.studentId === student.id) || { sakit: null, izin: null, alpa: null }; // Default to null for export
            return { 
                "Nama Lengkap": student.namaLengkap, 
                "Sakit (S)": studentAtt.sakit ?? '', // Export null as empty string
                "Izin (I)": studentAtt.izin ?? '',   // Export null as empty string
                "Alpa (A)": studentAtt.alpa ?? ''    // Export null as empty string
            };
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
        showToast(`Gagal mengekspor data: ${error.message}`, 'error');
    }
  }, [settings, students, grades, notes, attendance, extracurriculars, studentExtracurriculars, subjects, learningObjectives, showToast]);

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
                let processedSheetCount = 0;
                
                let tempSettings = JSON.parse(JSON.stringify(settings));
                let tempSubjects = JSON.parse(JSON.stringify(subjects));
                let tempExtracurriculars = JSON.parse(JSON.stringify(extracurriculars));
                let tempStudents = JSON.parse(JSON.stringify(students));
                let tempGrades = JSON.parse(JSON.stringify(grades));
                let tempNotes = JSON.parse(JSON.stringify(notes));
                let tempAttendance = JSON.parse(JSON.stringify(attendance));
                let tempStudentExtracurriculars = JSON.parse(JSON.stringify(studentExtracurriculars));
                let tempLearningObjectives = JSON.parse(JSON.stringify(learningObjectives));

                const settingsWorksheet = workbook.Sheets['Pengaturan'];
                if (settingsWorksheet) {
                    const rows = XLSX.utils.sheet_to_json(settingsWorksheet, { header: 1 });
                    const settingsHeaderMap = new Map([
                        ['Nama Dinas Pendidikan', 'nama_dinas_pendidikan'], ['Nama Sekolah', 'nama_sekolah'], ['NPSN', 'npsn'], ['Alamat Sekolah', 'alamat_sekolah'],
                        ['Desa / Kelurahan', 'desa_kelurahan'], ['Kecamatan', 'kecamatan'], ['Kota/Kabupaten', 'kota_kabupaten'], ['Provinsi', 'provinsi'], ['Kode Pos', 'kode_pos'],
                        ['Email Sekolah', 'email_sekolah'], ['Telepon Sekolah', 'telepon_sekolah'], ['Website Sekolah', 'website_sekolah'], ['Faksimile', 'faksimile'],
                        ['Nama Kelas', 'nama_kelas'], ['Tahun Ajaran', 'tahun_ajaran'], ['Semester', 'semester'], ['Tempat, Tanggal Rapor', 'tanggal_rapor'],
                        ['Nama Kepala Sekolah', 'nama_kepala_sekolah'], ['NIP Kepala Sekolah', 'nip_kepala_sekolah'], ['Nama Wali Kelas', 'nama_wali_kelas'], ['NIP Wali Kelas', 'nip_wali_kelas']
                    ]);
                    const predikatMap = new Map([ ['Predikat A (Mulai dari)', 'a'], ['Predikat B (Mulai dari)', 'b'], ['Predikat C (Mulai dari)', 'c'] ]);
                    
                    let section = null;
                    const logoSekolahParts = {};
                    const logoDinasParts = {};
                    const logoCoverParts = {};

                    rows.forEach(row => {
                        const header = String(row[0] || '').trim();
                        if (header === 'Mata Pelajaran') { section = 'subjects'; return; }
                        if (header === 'Ekstrakurikuler') { section = 'extras'; return; }

                        if (settingsHeaderMap.has(header)) tempSettings[settingsHeaderMap.get(header)] = row[1];
                        if (predikatMap.has(header)) tempSettings.predikats[predikatMap.get(header)] = String(row[1]);
                        
                        // Handle single-cell and chunked logo data
                        if (header === 'Logo Sekolah (Base64)') tempSettings.logo_sekolah = row[1] || null;
                        if (header.startsWith('Logo Sekolah (Base64) - Part ')) {
                            const partMatch = header.match(/Part (\d+)/);
                            if (partMatch) logoSekolahParts[parseInt(partMatch[1], 10)] = row[1] || '';
                        }
                        if (header === 'Logo Dinas Pendidikan (Base64)') tempSettings.logo_dinas = row[1] || null;
                        if (header.startsWith('Logo Dinas Pendidikan (Base64) - Part ')) {
                            const partMatch = header.match(/Part (\d+)/);
                            if (partMatch) logoDinasParts[parseInt(partMatch[1], 10)] = row[1] || '';
                        }
                        if (header === 'Logo Cover Rapor (Base64)') tempSettings.logo_cover = row[1] || null;
                        if (header.startsWith('Logo Cover Rapor (Base64) - Part ')) {
                            const partMatch = header.match(/Part (\d+)/);
                            if (partMatch) logoCoverParts[parseInt(partMatch[1], 10)] = row[1] || '';
                        }

                        if (section === 'subjects' && header !== 'ID Internal (Jangan Diubah)') {
                            const [id, fullName, label, status] = row;
                            if (id && fullName) {
                                const existing = tempSubjects.find(s => s.id === id);
                                const subjectData = { id: String(id), fullName: String(fullName), label: String(label), active: String(status).toLowerCase() === 'aktif' };
                                if (existing) Object.assign(existing, subjectData); else tempSubjects.push(subjectData);
                            }
                        }
                        if (section === 'extras' && header !== 'ID Unik (Jangan Diubah)') {
                            const [id, name, status] = row;
                            if (id && name) {
                                const existing = tempExtracurriculars.find(e => e.id === id);
                                const extraData = { id: String(id), name: String(name), active: String(status).toLowerCase() === 'aktif' };
                                if (existing) Object.assign(existing, extraData); else tempExtracurriculars.push(extraData);
                            }
                        }
                    });

                    // Reassemble chunked logos
                    const schoolKeys = Object.keys(logoSekolahParts).map(Number).sort((a, b) => a - b);
                    if (schoolKeys.length > 0) tempSettings.logo_sekolah = schoolKeys.map(key => logoSekolahParts[key]).join('');

                    const dinasKeys = Object.keys(logoDinasParts).map(Number).sort((a, b) => a - b);
                    if (dinasKeys.length > 0) tempSettings.logo_dinas = dinasKeys.map(key => logoDinasParts[key]).join('');

                    const coverKeys = Object.keys(logoCoverParts).map(Number).sort((a, b) => a - b);
                    if (coverKeys.length > 0) tempSettings.logo_cover = coverKeys.map(key => logoCoverParts[key]).join('');
                    
                    processedSheetCount++;
                }

                const studentWorksheet = workbook.Sheets['Data Siswa'];
                const studentHeaderMap = new Map([
                    ["Nama Lengkap", 'namaLengkap'], ["Nama Panggilan", 'namaPanggilan'], ["NIS", 'nis'], ["NISN", 'nisn'], ["Tempat Lahir", 'tempatLahir'], ["Tanggal Lahir", 'tanggalLahir'],
                    ["Jenis Kelamin", 'jenisKelamin'], ["Agama", 'agama'], ["Asal TK", 'asalTk'], ["Alamat Siswa", 'alamatSiswa'], ["Diterima di Kelas", 'diterimaDiKelas'], ["Diterima Tanggal", 'diterimaTanggal'],
                    ["Nama Ayah", 'namaAyah'], ["Nama Ibu", 'namaIbu'], ["Pekerjaan Ayah", 'pekerjaanAyah'], ["Pekerjaan Ibu", 'pekerjaanIbu'],
                    ["Alamat Orang Tua", 'alamatOrangTua'], ["Telepon Orang Tua", 'teleponOrangTua'], ["Nama Wali", 'namaWali'], ["Pekerjaan Wali", 'pekerjaanWali'],
                    ["Alamat Wali", 'alamatWali'], ["Telepon Wali", 'teleponWali']
                ]);

                if (studentWorksheet) {
                    const studentJson = XLSX.utils.sheet_to_json(studentWorksheet);
                    let maxId = Math.max(0, ...tempStudents.map(s => s.id));

                    studentJson.forEach(row => {
                        const studentData = {};
                        for (const header in row) if (studentHeaderMap.has(header)) studentData[studentHeaderMap.get(header)] = row[header];
                        if (!studentData.namaLengkap) return;

                        const studentNameKey = studentData.namaLengkap.trim().toLowerCase();
                        const existingStudent = tempStudents.find(s => s.namaLengkap.trim().toLowerCase() === studentNameKey);

                        if (existingStudent) {
                            Object.assign(existingStudent, studentData);
                        } else {
                            const newId = ++maxId;
                            tempStudents.push({ ...studentData, id: newId });
                            tempGrades.push({ studentId: newId, detailedGrades: {}, finalGrades: {} });
                            tempAttendance.push({ studentId: newId, sakit: null, izin: null, alpa: null }); // Initialized with null
                            tempStudentExtracurriculars.push({ studentId: newId, assignedActivities: [], descriptions: {} });
                        }
                    });
                    processedSheetCount++;
                }
                const studentMap = new Map(tempStudents.map(s => [s.namaLengkap.trim().toLowerCase(), s.id]));

                const subjectLabelMap = new Map(tempSubjects.map(s => [s.label.trim().toLowerCase(), s]));
                const extraNameMap = new Map(tempExtracurriculars.map(e => [e.name.trim().toLowerCase(), e.id]));

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (sheetName === 'Data Siswa' || sheetName === 'Pengaturan') return;

                    if (sheetName === 'Data Absensi') {
                        const parseAttendanceValue = (value) => {
                            if (value === '' || value === undefined || value === null) return null;
                            const num = parseInt(String(value), 10);
                            return isNaN(num) ? null : num;
                        };

                        json.forEach(row => {
                            const studentId = studentMap.get(String(row["Nama Lengkap"] || '').trim().toLowerCase());
                            if (studentId) {
                                const attendanceRecord = tempAttendance.find(a => a.studentId === studentId);
                                const newAtt = {
                                    sakit: parseAttendanceValue(row["Sakit (S)"]),
                                    izin: parseAttendanceValue(row["Izin (I)"]),
                                    alpa: parseAttendanceValue(row["Alpa (A)"])
                                };
                                if (attendanceRecord) Object.assign(attendanceRecord, newAtt);
                                else tempAttendance.push({ studentId, ...newAtt }); // Add if not found
                            }
                        });
                        processedSheetCount++;
                    } else if (sheetName === 'Catatan Wali Kelas') {
                        json.forEach(row => {
                           const studentId = studentMap.get(String(row["Nama Lengkap"] || '').trim().toLowerCase());
                           if (studentId != null) tempNotes[studentId] = String(row["Catatan Wali Kelas"] || '');
                        });
                        processedSheetCount++;
                    } else if (sheetName === 'Data Ekstrakurikuler') {
                        json.forEach(row => {
                            const studentId = studentMap.get(String(row["Nama Lengkap"] || '').trim().toLowerCase());
                            if (studentId) {
                                const assignedActivities = [], descriptions = {};
                                for (let i = 1; i <= 5; i++) {
                                    const extraName = String(row[`Ekstrakurikuler ${i}`] || '').trim().toLowerCase();
                                    const extraId = extraNameMap.get(extraName);
                                    if (extraId) { assignedActivities.push(extraId); descriptions[extraId] = String(row[`Deskripsi ${i}`] || ''); }
                                }
                                const studentExtraRecord = tempStudentExtracurriculars.find(se => se.studentId === studentId);
                                if (studentExtraRecord) Object.assign(studentExtraRecord, { assignedActivities, descriptions });
                            }
                        });
                        processedSheetCount++;
                    } else if (sheetName.startsWith('Nilai ')) {
                        const subjectLabel = sheetName.replace('Nilai ', '').trim().toLowerCase();
                        const subject = subjectLabelMap.get(subjectLabel);
                        if (!subject) return;

                        json.forEach(row => {
                            const studentId = studentMap.get(String(row["Nama Siswa"] || '').trim().toLowerCase());
                            if (studentId) {
                                const gradeRecord = tempGrades.find(g => g.studentId === studentId);
                                if (!gradeRecord.detailedGrades) gradeRecord.detailedGrades = {};
                                if (!gradeRecord.detailedGrades[subject.id]) gradeRecord.detailedGrades[subject.id] = { tp: [], sts: null, sas: null };

                                const detailed = gradeRecord.detailedGrades[subject.id];
                                const tps = [];
                                Object.keys(row).forEach(key => { if(key.startsWith('TP ')) tps[parseInt(key.replace('TP ','')) - 1] = row[key] === '' ? null : Number(row[key]); });
                                detailed.tp = tps;
                                detailed.sts = row['STS'] === '' ? null : Number(row['STS']);
                                detailed.sas = row['SAS'] === '' ? null : Number(row['SAS']);
                                
                                const tpsToConsider = (detailed.tp || []);
                                const validTps = tpsToConsider.filter(t => typeof t === 'number');
                                const avgTp = validTps.length > 0 ? validTps.reduce((a, b) => a + b, 0) / validTps.length : 0;
                                const finalGrade = (avgTp + (detailed.sts || 0) + (detailed.sas || 0)) / 3;
                                gradeRecord.finalGrades[subject.id] = isNaN(finalGrade) ? null : Math.round(finalGrade);
                            }
                        });
                        processedSheetCount++;
                    } else if (sheetName === 'Tujuan Pembelajaran') {
                        const gradeNum = getGradeNumber(tempSettings.nama_kelas);
                        if (gradeNum) {
                            const gradeKey = `Kelas ${gradeNum}`;
                            const newObjectivesForClass = {};
                            const subjectFullNameMap = new Map(tempSubjects.map(s => [s.fullName.toLowerCase(), s]));
                            json.forEach(row => {
                                const subjectName = String(row['Nama Mapel'] || '').trim().toLowerCase();
                                const subject = subjectFullNameMap.get(subjectName);
                                if (subject) {
                                    const objectives = [];
                                    Object.keys(row).forEach(key => { if(key.startsWith('TP ')) objectives.push(row[key]); });
                                    newObjectivesForClass[subject.fullName] = objectives.filter(Boolean);
                                }
                            });
                            tempLearningObjectives[gradeKey] = newObjectivesForClass;
                            processedSheetCount++;
                        }
                    }
                });

                setSettings(tempSettings);
                setSubjects(tempSubjects);
                setExtracurriculars(tempExtracurriculars);
                setStudents(tempStudents);
                setGrades(tempGrades);
                setNotes(tempNotes);
                setAttendance(tempAttendance);
                setStudentExtracurriculars(tempStudentExtracurriculars);
                setLearningObjectives(tempLearningObjectives);

                showToast(`${processedSheetCount} sheet berhasil diimpor!`, 'success');

            } catch (error) {
                console.error("Gagal mengimpor data:", error);
                showToast(`Gagal membaca file: ${error.message}`, 'error');
            }
        };
        reader.readAsBinaryString(file);
    };
    input.click();
  }, [settings, subjects, extracurriculars, students, grades, notes, attendance, studentExtracurriculars, learningObjectives, showToast]);

  const handleNavigateToNilai = useCallback((subjectId) => {
    setDataNilaiInitialTab(subjectId);
    setActivePage('DATA_NILAI');
  }, []);

  const renderPage = () => {
    if (isLoading) {
        return React.createElement('div', { className: "flex items-center justify-center h-full" }, React.createElement('p', null, 'Memuat data awal...'));
    }

    switch (activePage) {
      case 'DASHBOARD':
        return React.createElement(Dashboard, { 
                  setActivePage: setActivePage, 
                  onNavigateToNilai: handleNavigateToNilai,
                  settings: settings, 
                  students: students,
                  grades: grades,
                  subjects: subjects,
                  notes: notes,
                  attendance: attendance,
                  extracurriculars: extracurriculars,
                  studentExtracurriculars: studentExtracurriculars,
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
                  showToast: showToast,
                  initialTab: dataNilaiInitialTab,
                });
      case 'DATA_ABSENSI':
        return React.createElement(DataAbsensiPage, { students: students, attendance: attendance, onUpdateAttendance: handleUpdateAttendance, onBulkUpdateAttendance: handleBulkUpdateAttendance, showToast: showToast });
      case 'CATATAN_WALI_KELAS':
        return React.createElement(CatatanWaliKelasPage, { 
                  students: students, 
                  notes: notes, 
                  onUpdateNote: handleUpdateNote, 
                  grades: grades,
                  subjects: subjects,
                  settings: settings,
                  showToast: showToast,
                });
      case 'DATA_EKSTRAKURIKULER':
        return React.createElement(DataEkstrakurikulerPage, { 
                  students: students,
                  extracurriculars: extracurriculars,
                  studentExtracurriculars: studentExtracurriculars,
                  onUpdateStudentExtracurriculars: handleUpdateStudentExtracurriculars,
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
                  showToast: showToast
                });
      case 'PRINT_LEGER':
        return React.createElement(PrintLegerPage, { 
                  students: students,
                  settings: settings,
                  grades: grades,
                  subjects: subjects,
                  showToast: showToast,
                });
      default:
        const navItem = NAV_ITEMS.find(item => item.id === activePage);
        return React.createElement(PlaceholderPage, { title: navItem ? navItem.label : 'Halaman' });
    }
  };
  
  return (
    React.createElement(React.Fragment, null,
      isUpdateAvailable && React.createElement(
        'div',
        { className: "fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 p-3 text-center z-[101] shadow-lg flex justify-center items-center gap-4 print-hidden" },
        React.createElement('p', { className: 'font-semibold' }, 'Versi baru aplikasi tersedia.'),
        React.createElement(
          'button',
          {
            onClick: updateAssets,
            className: 'px-4 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-bold'
          },
          'Perbarui Sekarang'
        )
      ),
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
