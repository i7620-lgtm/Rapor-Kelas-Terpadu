import { useMemo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useCocurricularStore } from '../../stores/useCocurricularStore';
import { useAttendanceStore } from '../../stores/useAttendanceStore';
import { useExtracurricularStore } from '../../stores/useExtracurricularStore';
import { getContextualValue } from '../../constants';

interface Subject {
  id: string;
  fullName: string;
  label: string;
  active: boolean;
}

interface Student {
  id: string;
  namaLengkap: string;
  nisn: string;
  agama?: string;
  [key: string]: any;
}

interface UseDashboardLogicProps {
  setActivePage: (page: string, anchor?: string) => void;
  settings?: any;
  students?: Student[];
  grades?: any[];
  subjects?: Subject[];
  notes?: Record<string, string>;
  cocurricularData?: any;
  attendance?: any[];
  studentExtracurriculars?: any[];
}

export const useDashboardLogic = ({
  setActivePage,
  settings: propSettings,
  students: propStudents,
  grades: propGrades,
  subjects: propSubjects,
  notes: propNotes,
  cocurricularData: propCocurricularData,
  attendance: propAttendance,
  studentExtracurriculars: propStudentExtracurriculars,
}: UseDashboardLogicProps) => {
  const storeSettings = useSettingsStore((state) => state.settings);
  const storeSubjects = useSettingsStore((state) => state.subjects);
  const storeStudents = useStudentsStore((state) => state.students);
  const storeGrades = useNilaiStore((state) => state.grades);
  const storeNotes = useNotesStore((state) => state.notes);
  const storeCocurricularData = useCocurricularStore((state) => state.cocurricularData);
  const storeAttendance = useAttendanceStore((state) => state.attendance);
  const storeStudentExtracurriculars = useExtracurricularStore((state) => state.studentExtracurriculars);

  const settings = propSettings || storeSettings || {};
  const subjects = propSubjects || storeSubjects || [];
  const students = propStudents || storeStudents || [];
  const grades = propGrades || storeGrades || [];
  const notes = propNotes || storeNotes || {};
  const cocurricularData = propCocurricularData || storeCocurricularData || {};
  const attendance = propAttendance || storeAttendance || [];
  const studentExtracurriculars = propStudentExtracurriculars || storeStudentExtracurriculars || [];

  const waliKelasName = getContextualValue(settings, 'nama_wali_kelas') || 'Wali Kelas';

  const stats = [
    {
      title: 'Kelas',
      value: settings.nama_kelas || '-',
      description: 'Kelas yang diampu saat ini.',
      actionText: 'Atur Kelas',
      onActionClick: () => setActivePage('PENGATURAN', 'nama_kelas'),
      showAction: !settings.nama_kelas,
    },
    {
      title: 'Jumlah Siswa',
      value: (students || []).length.toString(),
      description: 'Siswa yang terdaftar di kelas.',
      actionText: 'Tambah Siswa Pertama',
      onActionClick: () => setActivePage('DATA_SISWA'),
      showAction: (students || []).length === 0,
    },
    {
      title: 'Tahun Ajaran',
      value: settings.tahun_ajaran || '-',
      description: 'Tahun ajaran yang sedang berjalan.',
      actionText: 'Atur Tahun Ajaran',
      onActionClick: () => setActivePage('PENGATURAN', 'tahun_ajaran'),
      showAction: !settings.tahun_ajaran,
    },
    {
      title: 'Semester',
      value: settings.semester || '-',
      description: 'Semester yang sedang berlangsung.',
      actionText: 'Atur Semester',
      onActionClick: () => setActivePage('PENGATURAN', 'semester'),
      showAction: !settings.semester,
    },
  ];

  const academicAlerts = useMemo(() => {
    const items: any[] = [];
    const minGrade = parseInt(settings.predikats?.c || '70', 10);
    const activeSubjects = (subjects || []).filter((s) => s.active);
    const currentStudents = students || [];
    const currentGrades = grades || [];

    if (currentStudents.length === 0 || activeSubjects.length === 0) {
      return items;
    }

    currentStudents.forEach((student) => {
      const studentGrade = currentGrades.find((g) => g.studentId === student.id);
      if (!studentGrade) return;

      const studentReligion = String(student.agama || '').trim().toLowerCase();

      const relevantSubjects = activeSubjects.filter((subject) => {
        const subjectName = subject.fullName.toLowerCase();

        // Handle Kepercayaan explicitly
        if (subject.id === 'PAKTTMYME' || subjectName.includes('kepercayaan terhadap tuhan')) {
          return studentReligion === 'kepercayaan';
        }

        // Handle Standard Religions (Islam, Kristen, etc.)
        if (subjectName.startsWith('pendidikan agama')) {
          if (!studentReligion) return false;
          const subjectReligionMatch = subjectName.match(/\(([^)]+)\)/);
          if (subjectReligionMatch) {
            return subjectReligionMatch[1].trim().toLowerCase() === studentReligion;
          }
          return false;
        }

        // General subjects
        return true;
      });

      const failingSubjects: any[] = [];
      const missingSubjects: any[] = [];

      relevantSubjects.forEach((subject) => {
        let grade = studentGrade?.finalGrades?.[subject.id];
        const hasGrade = grade !== undefined && grade !== null && grade !== '';

        if (!hasGrade) {
          missingSubjects.push(subject);
        } else {
          if (typeof grade === 'string') grade = parseFloat(grade);
          if (!isNaN(grade) && !isNaN(minGrade) && grade < minGrade) {
            failingSubjects.push({ ...subject, grade });
          }
        }
      });

      // 1. Alerts for Failing Grades (Priority: High / Red)
      if (failingSubjects.length > 0) {
        items.push({
          title: student.namaLengkap,
          description: `Nilai di bawah KKM (${minGrade}): ${failingSubjects
            .map((s) => `${s.label} (${s.grade})`)
            .join(', ')}`,
          status: 'attention',
          actionSubjectId: failingSubjects[0].id,
        });
      }

      // 2. Alerts for Missing Grades (Priority: Medium / Yellow)
      if (missingSubjects.length > 0) {
        const missingText =
          missingSubjects.length > 5
            ? `${missingSubjects
                .slice(0, 5)
                .map((s) => s.label)
                .join(', ')}, dan ${missingSubjects.length - 5} lainnya.`
            : missingSubjects.map((s) => s.label).join(', ');

        items.push({
          title: student.namaLengkap,
          description: `Nilai belum lengkap: ${missingText}`,
          status: 'incomplete',
          actionSubjectId: missingSubjects[0].id,
        });
      }
    });

    return items;
  }, [students, grades, subjects, settings]);

  const completenessChecks = useMemo(() => {
    const results: any[] = [];
    const activeSubjects = (subjects || []).filter((s) => s.active);
    const currentStudents = students || [];
    const currentGrades = grades || [];
    const currentAttendance = attendance || [];
    const currentStudentExtracurriculars = studentExtracurriculars || [];
    const totalStudents = currentStudents.length;

    // 1. Informasi Dasar
    const settingsFields = ['nama_sekolah', 'nama_wali_kelas', 'nama_kelas', 'tahun_ajaran', 'semester'];
    let filledSettingsFields = settingsFields.filter((key) => {
      const val = key === 'nama_wali_kelas' ? getContextualValue(settings, 'nama_wali_kelas') : settings[key];
      return val && val.trim() !== '';
    }).length;
    const settingsPercentage = Math.round((filledSettingsFields / settingsFields.length) * 100);

    if (settingsPercentage === 100) {
      results.push({
        category: 'Pengaturan',
        title: 'Informasi Dasar',
        status: 'good',
        message: 'Informasi dasar sekolah, kelas, dan wali kelas sudah terisi.',
        actionText: 'Lihat Pengaturan',
        onActionClick: () => setActivePage('PENGATURAN'),
        percentage: 100,
      });
    } else {
      const missingSettings = settingsFields.filter((key) => {
        const val = key === 'nama_wali_kelas' ? getContextualValue(settings, 'nama_wali_kelas') : settings[key];
        return !val || val.trim() === '';
      });
      results.push({
        category: 'Pengaturan',
        title: 'Informasi Dasar',
        status: 'bad',
        message: `Data berikut belum diisi: ${missingSettings.join(', ')}.`,
        actionText: 'Lengkapi di Pengaturan',
        onActionClick: () => setActivePage('PENGATURAN', missingSettings[0]),
        percentage: settingsPercentage,
      });
    }

    if (totalStudents === 0) {
      const emptyDataMessages = [
        { category: 'Data Siswa', title: 'Data Siswa', message: 'Belum ada data siswa.', actionText: 'Tambah Siswa', page: 'DATA_SISWA' },
        { category: 'Data Nilai', title: 'Data Nilai', message: 'Belum ada data siswa.', actionText: 'Periksa Data Nilai', page: 'DATA_NILAI' },
        { category: 'Data Lainnya', title: 'Kokurikuler', message: 'Belum ada data siswa.', actionText: 'Isi Penilaian', page: 'DATA_KOKURIKULER' },
        { category: 'Data Lainnya', title: 'Ekstrakurikuler', message: 'Belum ada data siswa.', actionText: 'Atur Ekstrakurikuler', page: 'DATA_EKSTRAKURIKULER' },
        { category: 'Data Lainnya', title: 'Data Absensi', message: 'Belum ada data siswa.', actionText: 'Periksa Data Absensi', page: 'DATA_ABSENSI' },
        { category: 'Data Lainnya', title: 'Catatan Wali Kelas', message: 'Belum ada data siswa.', actionText: 'Isi Catatan', page: 'CATATAN_WALI_KELAS' },
      ];
      emptyDataMessages.forEach((item) =>
        results.push({ ...item, status: 'bad', onActionClick: () => setActivePage(item.page), percentage: 0 })
      );
      return results;
    }

    // 2. Data Siswa
    const studentDataFieldsToCheck = [
      'namaLengkap',
      'namaPanggilan',
      'nis',
      'nisn',
      'ttl',
      'jenisKelamin',
      'agama',
      'asalTk',
      'alamatSiswa',
      'diterimaDiKelas',
      'diterimaTanggal',
      'namaAyah',
      'namaIbu',
      'pekerjaanAyah',
      'pekerjaanIbu',
      'alamatOrangTua',
      'teleponOrangTua',
    ];
    const totalStudentDataFields = totalStudents * studentDataFieldsToCheck.length;
    let filledStudentDataFields = currentStudents.reduce(
      (acc, student) =>
        acc +
        studentDataFieldsToCheck.filter((field) => student[field] && String(student[field]).trim() !== '').length,
      0
    );
    const studentDataPercentage =
      totalStudentDataFields > 0 ? Math.round((filledStudentDataFields / totalStudentDataFields) * 100) : 100;

    if (studentDataPercentage === 100) {
      results.push({
        category: 'Data Siswa',
        title: 'Data Siswa',
        status: 'good',
        message: 'Data pribadi dan orang tua untuk semua siswa telah terisi lengkap.',
        actionText: 'Lihat Data Siswa',
        onActionClick: () => setActivePage('DATA_SISWA'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Siswa',
        title: 'Data Siswa',
        status: 'bad',
        message: `Terdapat ${totalStudentDataFields - filledStudentDataFields} data pribadi/orang tua yang belum diisi.`,
        actionText: 'Lengkapi Data Siswa',
        onActionClick: () => setActivePage('DATA_SISWA'),
        percentage: studentDataPercentage,
      });
    }

    // 3. Data Nilai
    let totalRequiredGrades = 0;
    let totalFilledGrades = 0;

    currentStudents.forEach((student) => {
      const studentGrade = currentGrades.find((g) => g.studentId === student.id);
      const studentReligion = String(student.agama || '').trim().toLowerCase();

      const relevantSubjects = activeSubjects.filter((subject) => {
        const subjectName = subject.fullName.toLowerCase();

        // Handle Kepercayaan explicitly
        if (subject.id === 'PAKTTMYME' || subjectName.includes('kepercayaan terhadap tuhan')) {
          return studentReligion === 'kepercayaan';
        }

        if (subjectName.startsWith('pendidikan agama')) {
          if (!studentReligion) return false;
          const subjectReligionMatch = subjectName.match(/\(([^)]+)\)/);
          if (subjectReligionMatch) {
            return subjectReligionMatch[1].trim().toLowerCase() === studentReligion;
          }
          return false;
        }

        return true;
      });

      relevantSubjects.forEach((sub) => {
        totalRequiredGrades++;
        const grade = studentGrade?.finalGrades?.[sub.id];
        if (grade !== undefined && grade !== null && grade !== '') {
          totalFilledGrades++;
        }
      });
    });

    const gradesPercentage =
      totalRequiredGrades > 0
        ? Math.round((totalFilledGrades / totalRequiredGrades) * 100)
        : totalStudents > 0
        ? 0
        : 100;

    if (gradesPercentage === 100) {
      results.push({
        category: 'Data Nilai',
        title: 'Data Nilai',
        status: 'good',
        message: 'Nilai akhir untuk semua siswa telah terisi.',
        actionText: 'Lihat Data Nilai',
        onActionClick: () => setActivePage('DATA_NILAI'),
        percentage: 100,
      });
    } else {
      const missingCount = totalRequiredGrades - totalFilledGrades;
      results.push({
        category: 'Data Nilai',
        title: 'Data Nilai',
        status: 'bad',
        message: `Terdapat ${missingCount} nilai mata pelajaran yang belum terisi.`,
        actionText: 'Lengkapi Data Nilai',
        onActionClick: () => setActivePage('DATA_NILAI'),
        percentage: gradesPercentage,
      });
    }

    // 4. Kokurikuler
    const cocurricData = cocurricularData || {};
    const currentSemester = settings?.semester || 'Ganjil';
    const coDimensionField = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
    let studentsWithCo = currentStudents.filter((s) => {
      const studentCoData = cocurricData[s.id];
      return studentCoData && Object.values(studentCoData[coDimensionField] || {}).some((r) => r);
    }).length;
    const coPercentage = Math.round((studentsWithCo / totalStudents) * 100);
    if (coPercentage === 100) {
      results.push({
        category: 'Data Lainnya',
        title: 'Kokurikuler',
        status: 'good',
        message: `Semua siswa telah memiliki penilaian kokurikuler.`,
        actionText: 'Lihat Kokurikuler',
        onActionClick: () => setActivePage('DATA_KOKURIKULER'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Kokurikuler',
        status: 'bad',
        message: `${totalStudents - studentsWithCo} siswa belum memiliki penilaian kokurikuler.`,
        actionText: 'Isi Penilaian',
        onActionClick: () => setActivePage('DATA_KOKURIKULER'),
        percentage: coPercentage,
      });
    }

    // 5. Ekstrakurikuler
    let studentsWithExtra = currentStudents.filter((s) =>
      currentStudentExtracurriculars.some(
        (se) =>
          se.studentId === s.id &&
          (se.semester || 'Ganjil') === currentSemester &&
          se.assignedActivities?.some((activity: any) => activity !== null)
      )
    ).length;
    const extraPercentage = Math.round((studentsWithExtra / totalStudents) * 100);
    if (extraPercentage === 100) {
      results.push({
        category: 'Data Lainnya',
        title: 'Ekstrakurikuler',
        status: 'good',
        message: 'Semua siswa memiliki setidaknya satu ekstrakurikuler.',
        actionText: 'Lihat Ekstrakurikuler',
        onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Ekstrakurikuler',
        status: 'bad',
        message: `${totalStudents - studentsWithExtra} siswa belum memiliki ekstrakurikuler.`,
        actionText: 'Atur Ekstrakurikuler',
        onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'),
        percentage: extraPercentage,
      });
    }

    // 6. Data Absensi
    let studentsWithAttendance = currentStudents.filter((s) =>
      currentAttendance.some(
        (a) =>
          a.studentId === s.id &&
          (a.semester || 'Ganjil') === currentSemester &&
          (a.sakit !== null || a.izin !== null || a.alpa !== null)
      )
    ).length;
    const attendancePercentage = Math.round((studentsWithAttendance / totalStudents) * 100);
    if (attendancePercentage === 100) {
      results.push({
        category: 'Data Lainnya',
        title: 'Data Absensi',
        status: 'good',
        message: 'Data absensi semua siswa telah terisi.',
        actionText: 'Lihat Data Absensi',
        onActionClick: () => setActivePage('DATA_ABSENSI'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Data Absensi',
        status: 'bad',
        message: `${totalStudents - studentsWithAttendance} siswa belum memiliki catatan absensi.`,
        actionText: 'Periksa Data Absensi',
        onActionClick: () => setActivePage('DATA_ABSENSI'),
        percentage: attendancePercentage,
      });
    }

    // 7. Catatan Wali Kelas
    const checkSimpleCompletion = (data: any, key: string, titleName: string, pageName: string) => {
      const getNoteKey = (studentId: string) => (currentSemester === 'Genap' ? studentId + '_Genap' : studentId);
      let completed = currentStudents.filter((s) => {
        const noteKey = getNoteKey(s.id);
        return data[noteKey] && data[noteKey].trim() !== '';
      }).length;
      const percentage = Math.round((completed / totalStudents) * 100);
      if (percentage === 100) {
        results.push({
          category: 'Data Lainnya',
          title: titleName,
          status: 'good',
          message: `Semua siswa telah memiliki ${titleName.toLowerCase()}.`,
          actionText: `Lihat ${titleName}`,
          onActionClick: () => setActivePage(pageName),
          percentage: 100,
        });
      } else {
        results.push({
          category: 'Data Lainnya',
          title: titleName,
          status: 'bad',
          message: `${totalStudents - completed} siswa belum memiliki ${titleName.toLowerCase()}.`,
          actionText: 'Isi Catatan',
          onActionClick: () => setActivePage(pageName),
          percentage,
        });
      }
    };
    checkSimpleCompletion(notes, 'notes', 'Catatan Wali Kelas', 'CATATAN_WALI_KELAS');

    return results;
  }, [
    settings,
    students,
    grades,
    notes,
    cocurricularData,
    attendance,
    studentExtracurriculars,
    subjects,
    setActivePage,
  ]);

  return {
    waliKelasName,
    stats,
    academicAlerts,
    completenessChecks,
  };
};
export default useDashboardLogic;
