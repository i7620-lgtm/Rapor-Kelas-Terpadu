import { create } from 'zustand';
import { COCURRICULAR_DIMENSIONS, getContextualValue } from '../constants';
import { useSettingsStore } from './useSettingsStore';
import { useStudentsStore } from './useStudentsStore';
import { useNilaiStore } from './useNilaiStore';
import { useNotesStore } from './useNotesStore';
import { useCocurricularStore } from './useCocurricularStore';
import { useAttendanceStore } from './useAttendanceStore';
import { useExtracurricularStore } from './useExtracurricularStore';

export interface SummaryStatItem {
  title: string;
  value: string;
  description: string;
  actionText: string;
  targetPage: string;
  showAction: boolean;
}

export interface SummaryCompletenessItem {
  category: string;
  title: string;
  status: 'good' | 'bad';
  message: string;
  actionText: string;
  targetPage: string;
  targetAnchor?: string;
  percentage: number;
}

export interface SummaryAlertMissingItem {
  label: string;
  targetPage: string;
  targetAnchor?: string;
  subjectId?: string;
}

export interface SummaryAlertItem {
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'attention';
  actionText?: string | null;
  targetPage?: string;
  targetAnchor?: string;
  subjectId?: string;
  missingItems?: SummaryAlertMissingItem[];
  actionSubjectId?: null;
}

export interface SummarySnapshot {
  waliKelasName: string;
  stats: SummaryStatItem[];
  completenessChecks: SummaryCompletenessItem[];
  academicAlerts: SummaryAlertItem[];
}

export interface SummarySourceInputs {
  settings: any;
  subjects: any[];
  students: any[];
  grades: any[];
  cocurricularData: any;
  studentExtracurriculars: any[];
  attendance: any[];
  notes: any;
}

const STUDENT_DATA_FIELDS_TO_CHECK = [
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

const SETTINGS_FIELDS_TO_CHECK = [
  'nama_sekolah',
  'nama_wali_kelas',
  'nama_kelas',
  'tahun_ajaran',
  'semester',
];

const COCURRICULAR_DIM_LABEL_MAP = new Map<string, string>(
  COCURRICULAR_DIMENSIONS.map((d) => [d.id, d.label])
);

const EMPTY_DATA_CHECKLIST: Array<{
  category: string;
  title: string;
  message: string;
  actionText: string;
  targetPage: string;
}> = [
  { category: 'Data Siswa', title: 'Data Siswa', message: 'Belum ada data siswa.', actionText: 'Tambah Siswa', targetPage: 'DATA_SISWA' },
  { category: 'Data Nilai', title: 'Data Nilai', message: 'Belum ada data siswa.', actionText: 'Periksa Data Nilai', targetPage: 'DATA_NILAI' },
  { category: 'Data Lainnya', title: 'Kokurikuler', message: 'Belum ada data siswa.', actionText: 'Isi Penilaian', targetPage: 'DATA_KOKURIKULER' },
  { category: 'Data Lainnya', title: 'Ekstrakurikuler', message: 'Belum ada data siswa.', actionText: 'Atur Ekstrakurikuler', targetPage: 'DATA_EKSTRAKURIKULER' },
  { category: 'Data Lainnya', title: 'Data Absensi', message: 'Belum ada data siswa.', actionText: 'Periksa Data Absensi', targetPage: 'DATA_ABSENSI' },
  { category: 'Data Lainnya', title: 'Catatan Wali Kelas', message: 'Belum ada data siswa.', actionText: 'Isi Catatan', targetPage: 'CATATAN_WALI_KELAS' },
];

export const computeSummarySnapshot = (sources: SummarySourceInputs): SummarySnapshot => {
  const settings = sources.settings || {};
  const subjects = sources.subjects || [];
  const currentStudents = sources.students || [];
  const currentGrades = sources.grades || [];
  const cocurricData = sources.cocurricularData || {};
  const currentStudentExtracurriculars = sources.studentExtracurriculars || [];
  const currentAttendance = sources.attendance || [];
  const currentNotes = sources.notes || {};

  const totalStudents = currentStudents.length;
  const tahunAjaran = settings.tahun_ajaran;
  const semester = settings.semester || 'Ganjil';
  const namaKelas = settings.nama_kelas;
  const waliKelas = getContextualValue(settings, 'nama_wali_kelas');
  const waliKelasName = waliKelas || 'Wali Kelas';

  // 1. Stats Cards
  const stats: SummaryStatItem[] = [
    {
      title: 'Jumlah Siswa',
      value: totalStudents.toString(),
      description: 'Siswa yang terdaftar di kelas.',
      actionText: 'Tambah Siswa Pertama',
      targetPage: 'DATA_SISWA',
      showAction: totalStudents === 0,
    },
    {
      title: 'Tahun Ajaran',
      value: tahunAjaran || '-',
      description: `Semester ${semester}`,
      actionText: 'Atur di Pengaturan',
      targetPage: 'PENGATURAN',
      showAction: !tahunAjaran,
    },
    {
      title: 'Kelas',
      value: namaKelas || '-',
      description: 'Nama kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      targetPage: 'PENGATURAN',
      showAction: !namaKelas,
    },
    {
      title: 'Wali Kelas',
      value: waliKelas || '-',
      description: 'Guru wali kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      targetPage: 'PENGATURAN',
      showAction: !waliKelas,
    },
  ];

  // 2. Settings Completeness Check
  const completenessChecks: SummaryCompletenessItem[] = [];
  const missingSettings: string[] = [];
  SETTINGS_FIELDS_TO_CHECK.forEach((key) => {
    const val = key === 'nama_wali_kelas' ? waliKelas : settings[key];
    if (!val || String(val).trim() === '') {
      missingSettings.push(key);
    }
  });
  const filledSettingsFields = SETTINGS_FIELDS_TO_CHECK.length - missingSettings.length;
  const settingsPercentage = Math.floor((filledSettingsFields / SETTINGS_FIELDS_TO_CHECK.length) * 100);

  if (missingSettings.length === 0) {
    completenessChecks.push({
      category: 'Pengaturan',
      title: 'Informasi Dasar',
      status: 'good',
      message: 'Informasi dasar sekolah, kelas, dan wali kelas sudah terisi.',
      actionText: 'Lihat Pengaturan',
      targetPage: 'PENGATURAN',
      percentage: 100,
    });
  } else {
    completenessChecks.push({
      category: 'Pengaturan',
      title: 'Informasi Dasar',
      status: 'bad',
      message: `Data berikut belum diisi: ${missingSettings.join(', ')}.`,
      actionText: 'Lengkapi di Pengaturan',
      targetPage: 'PENGATURAN',
      targetAnchor: missingSettings[0],
      percentage: settingsPercentage,
    });
  }

  if (totalStudents === 0) {
    EMPTY_DATA_CHECKLIST.forEach((item) => {
      completenessChecks.push({
        ...item,
        status: 'bad',
        percentage: 0,
      });
    });
    return {
      waliKelasName,
      stats,
      completenessChecks,
      academicAlerts: [],
    };
  }

  // Build O(1) lookup structures for linear pass across students
  const activeSubjects = subjects.filter((s: any) => s.active);
  const religionSubjectsCache = new Map<string, any[]>();
  const getRelevantSubjects = (religionLower: string) => {
    const cached = religionSubjectsCache.get(religionLower);
    if (cached) return cached;

    const filtered = activeSubjects.filter((subject: any) => {
      const subjectName = subject.fullName.toLowerCase();
      if (subject.id === 'PAKTTMYME' || subjectName.includes('kepercayaan terhadap tuhan')) {
        return religionLower === 'kepercayaan';
      }
      if (subjectName.startsWith('pendidikan agama')) {
        if (!religionLower) return false;
        const subjectReligionMatch = subjectName.match(/\(([^)]+)\)/);
        if (subjectReligionMatch) {
          return subjectReligionMatch[1].trim().toLowerCase() === religionLower;
        }
        return false;
      }
      return true;
    });
    religionSubjectsCache.set(religionLower, filtered);
    return filtered;
  };

  const gradeMap = new Map<string, any>();
  for (let i = 0; i < currentGrades.length; i++) {
    const g = currentGrades[i];
    if (g?.studentId) gradeMap.set(g.studentId, g);
  }

  const extraSet = new Set<string>();
  for (let i = 0; i < currentStudentExtracurriculars.length; i++) {
    const se = currentStudentExtracurriculars[i];
    if (
      se?.studentId &&
      Array.isArray(se.assignedActivities) &&
      se.assignedActivities.some((activity: any) => activity !== null)
    ) {
      extraSet.add(se.studentId);
    }
  }

  const attendanceSet = new Set<string>();
  for (let i = 0; i < currentAttendance.length; i++) {
    const a = currentAttendance[i];
    if (
      a?.studentId &&
      (a.sakit !== null || a.izin !== null || a.alpa !== null)
    ) {
      attendanceSet.add(a.studentId);
    }
  }

  const minGrade = parseInt(settings.predikats?.c || '70', 10);
  const hasValidMinGrade = !isNaN(minGrade);

  let filledStudentDataFields = 0;
  let totalRequiredGrades = 0;
  let totalFilledGrades = 0;
  let studentsWithCo = 0;
  let studentsWithExtra = 0;
  let studentsWithAttendance = 0;
  let studentsWithNotes = 0;
  const academicAlerts: SummaryAlertItem[] = [];

  for (let i = 0; i < totalStudents; i++) {
    const student = currentStudents[i];
    const studentId = student.id;

    // Profile fields count
    let missingStudentFieldCount = 0;
    for (let f = 0; f < STUDENT_DATA_FIELDS_TO_CHECK.length; f++) {
      const val = student[STUDENT_DATA_FIELDS_TO_CHECK[f]];
      if (val && String(val).trim() !== '') {
        filledStudentDataFields++;
      } else {
        missingStudentFieldCount++;
      }
    }

    // Grades & below-KKM check
    const studentGrade = gradeMap.get(studentId);
    const studentReligion = String(student.agama || '').trim().toLowerCase();
    const relevantSubjects = getRelevantSubjects(studentReligion);

    const failingSubjects: any[] = [];
    const missingSubjects: any[] = [];

    for (let sIdx = 0; sIdx < relevantSubjects.length; sIdx++) {
      const subject = relevantSubjects[sIdx];
      totalRequiredGrades++;
      let grade = studentGrade?.finalGrades?.[subject.id];
      const hasGrade = grade !== undefined && grade !== null && grade !== '';
      if (!hasGrade) {
        missingSubjects.push(subject);
      } else {
        totalFilledGrades++;
        if (typeof grade === 'string') grade = parseFloat(grade);
        if (!isNaN(grade) && hasValidMinGrade && grade < minGrade) {
          failingSubjects.push({ label: subject.label, id: subject.id, grade });
        }
      }
    }

    // Cocurricular check
    const studentCoData = cocurricData[studentId];
    const studentRatings = studentCoData?.dimensionRatings;
    let hasCocurricular = false;
    const failingCoDimensions: string[] = [];
    if (studentRatings && typeof studentRatings === 'object') {
      const ratingEntries = Object.entries(studentRatings);
      for (let rIdx = 0; rIdx < ratingEntries.length; rIdx++) {
        const [dimId, rating] = ratingEntries[rIdx];
        if (rating) {
          hasCocurricular = true;
          if (rating === 'BB') {
            failingCoDimensions.push(COCURRICULAR_DIM_LABEL_MAP.get(dimId) || dimId);
          }
        }
      }
    }
    if (hasCocurricular) studentsWithCo++;

    // Extra, attendance, notes checks
    const hasExtra = extraSet.has(studentId);
    if (hasExtra) studentsWithExtra++;

    const hasAttendance = attendanceSet.has(studentId);
    if (hasAttendance) studentsWithAttendance++;

    const rawNote = currentNotes[studentId];
    const hasNote = Boolean(rawNote && String(rawNote).trim() !== '');
    if (hasNote) studentsWithNotes++;

    // Build student alerts
    if (failingSubjects.length > 0) {
      academicAlerts.push({
        title: student.namaLengkap,
        description: `Nilai di bawah KKM (${minGrade}): ${failingSubjects.map((s) => `${s.label} (${s.grade})`).join(', ')}`,
        status: 'attention',
        actionText: 'Lihat Nilai',
        targetPage: 'DATA_NILAI',
        targetAnchor: studentId,
        subjectId: failingSubjects[0]?.id,
      });
    }

    if (failingCoDimensions.length > 0) {
      academicAlerts.push({
        title: student.namaLengkap,
        description: `Nilai Kokurikuler di bawah KKM (BB / Belum Berkembang): ${failingCoDimensions.join(', ')}`,
        status: 'attention',
        actionText: 'Lihat Kokurikuler',
        targetPage: 'DATA_KOKURIKULER',
        targetAnchor: studentId,
      });
    }

    const studentMissingItems: SummaryAlertMissingItem[] = [];
    if (missingStudentFieldCount > 0) {
      studentMissingItems.push({
        label: `${missingStudentFieldCount} data profil`,
        targetPage: 'DATA_SISWA',
        targetAnchor: studentId,
      });
    }
    if (missingSubjects.length > 0) {
      studentMissingItems.push({
        label: `Nilai mapel (${missingSubjects.length})`,
        targetPage: 'DATA_NILAI',
        targetAnchor: studentId,
        subjectId: missingSubjects[0]?.id,
      });
    }
    if (!hasCocurricular) {
      studentMissingItems.push({
        label: 'Kokurikuler',
        targetPage: 'DATA_KOKURIKULER',
        targetAnchor: studentId,
      });
    }
    if (!hasExtra) {
      studentMissingItems.push({
        label: 'Ekstrakurikuler',
        targetPage: 'DATA_EKSTRAKURIKULER',
        targetAnchor: studentId,
      });
    }
    if (!hasAttendance) {
      studentMissingItems.push({
        label: 'Absensi',
        targetPage: 'DATA_ABSENSI',
        targetAnchor: studentId,
      });
    }
    if (!hasNote) {
      studentMissingItems.push({
        label: 'Catatan WK',
        targetPage: 'CATATAN_WALI_KELAS',
        targetAnchor: studentId,
      });
    }

    if (studentMissingItems.length > 0) {
      academicAlerts.push({
        title: student.namaLengkap,
        description: 'Data belum lengkap',
        missingItems: studentMissingItems,
        status: 'incomplete',
        actionSubjectId: null,
      });
    }
  }

  // Finalize completeness checklist items
  const totalStudentDataFields = totalStudents * STUDENT_DATA_FIELDS_TO_CHECK.length;
  const studentDataPercentage =
    totalStudentDataFields > 0 ? Math.floor((filledStudentDataFields / totalStudentDataFields) * 100) : 100;

  if (filledStudentDataFields === totalStudentDataFields) {
    completenessChecks.push({
      category: 'Data Siswa',
      title: 'Data Siswa',
      status: 'good',
      message: 'Data pribadi dan orang tua untuk semua siswa telah terisi lengkap.',
      actionText: 'Lihat Data Siswa',
      targetPage: 'DATA_SISWA',
      percentage: 100,
    });
  } else {
    completenessChecks.push({
      category: 'Data Siswa',
      title: 'Data Siswa',
      status: 'bad',
      message: `Terdapat ${totalStudentDataFields - filledStudentDataFields} data pribadi/orang tua yang belum diisi.`,
      actionText: 'Lengkapi Data Siswa',
      targetPage: 'DATA_SISWA',
      percentage: studentDataPercentage,
    });
  }

  const gradesPercentage =
    totalRequiredGrades > 0 ? Math.floor((totalFilledGrades / totalRequiredGrades) * 100) : 0;

  if (totalFilledGrades === totalRequiredGrades && totalRequiredGrades > 0) {
    completenessChecks.push({
      category: 'Data Nilai',
      title: 'Data Nilai',
      status: 'good',
      message: 'Nilai akhir untuk semua siswa telah terisi.',
      actionText: 'Lihat Data Nilai',
      targetPage: 'DATA_NILAI',
      percentage: 100,
    });
  } else if (totalRequiredGrades === 0) {
    completenessChecks.push({
      category: 'Data Nilai',
      title: 'Data Nilai',
      status: 'bad',
      message: 'Belum ada mata pelajaran yang aktif.',
      actionText: 'Pilih Mata Pelajaran',
      targetPage: 'PENGATURAN',
      percentage: 0,
    });
  } else {
    completenessChecks.push({
      category: 'Data Nilai',
      title: 'Data Nilai',
      status: 'bad',
      message: `Terdapat ${totalRequiredGrades - totalFilledGrades} nilai mata pelajaran yang belum terisi.`,
      actionText: 'Lengkapi Data Nilai',
      targetPage: 'DATA_NILAI',
      percentage: gradesPercentage,
    });
  }

  const coPercentage = Math.floor((studentsWithCo / totalStudents) * 100);
  completenessChecks.push(
    studentsWithCo === totalStudents
      ? {
          category: 'Data Lainnya',
          title: 'Kokurikuler',
          status: 'good',
          message: 'Semua siswa telah memiliki penilaian kokurikuler.',
          actionText: 'Lihat Kokurikuler',
          targetPage: 'DATA_KOKURIKULER',
          percentage: 100,
        }
      : {
          category: 'Data Lainnya',
          title: 'Kokurikuler',
          status: 'bad',
          message: `${totalStudents - studentsWithCo} siswa belum memiliki penilaian kokurikuler.`,
          actionText: 'Isi Penilaian',
          targetPage: 'DATA_KOKURIKULER',
          percentage: coPercentage,
        }
  );

  const extraPercentage = Math.floor((studentsWithExtra / totalStudents) * 100);
  completenessChecks.push(
    studentsWithExtra === totalStudents
      ? {
          category: 'Data Lainnya',
          title: 'Ekstrakurikuler',
          status: 'good',
          message: 'Semua siswa memiliki setidaknya satu ekstrakurikuler.',
          actionText: 'Lihat Ekstrakurikuler',
          targetPage: 'DATA_EKSTRAKURIKULER',
          percentage: 100,
        }
      : {
          category: 'Data Lainnya',
          title: 'Ekstrakurikuler',
          status: 'bad',
          message: `${totalStudents - studentsWithExtra} siswa belum memiliki ekstrakurikuler.`,
          actionText: 'Atur Ekstrakurikuler',
          targetPage: 'DATA_EKSTRAKURIKULER',
          percentage: extraPercentage,
        }
  );

  const attendancePercentage = Math.floor((studentsWithAttendance / totalStudents) * 100);
  completenessChecks.push(
    studentsWithAttendance === totalStudents
      ? {
          category: 'Data Lainnya',
          title: 'Data Absensi',
          status: 'good',
          message: 'Data absensi semua siswa telah terisi.',
          actionText: 'Lihat Data Absensi',
          targetPage: 'DATA_ABSENSI',
          percentage: 100,
        }
      : {
          category: 'Data Lainnya',
          title: 'Data Absensi',
          status: 'bad',
          message: `${totalStudents - studentsWithAttendance} siswa belum memiliki catatan absensi.`,
          actionText: 'Periksa Data Absensi',
          targetPage: 'DATA_ABSENSI',
          percentage: attendancePercentage,
        }
  );

  const notesPercentage = Math.floor((studentsWithNotes / totalStudents) * 100);
  completenessChecks.push(
    studentsWithNotes === totalStudents
      ? {
          category: 'Data Lainnya',
          title: 'Catatan Wali Kelas',
          status: 'good',
          message: 'Semua siswa telah memiliki catatan wali kelas.',
          actionText: 'Lihat Catatan Wali Kelas',
          targetPage: 'CATATAN_WALI_KELAS',
          percentage: 100,
        }
      : {
          category: 'Data Lainnya',
          title: 'Catatan Wali Kelas',
          status: 'bad',
          message: `${totalStudents - studentsWithNotes} siswa belum memiliki catatan wali kelas.`,
          actionText: 'Isi Catatan',
          targetPage: 'CATATAN_WALI_KELAS',
          percentage: notesPercentage,
        }
  );

  return {
    waliKelasName,
    stats,
    completenessChecks,
    academicAlerts,
  };
};

interface SummaryState extends SummarySnapshot {
  hasComputed: boolean;
  recomputeSummary: () => void;
}

let lastFingerprint: {
  settings: any;
  subjects: any;
  students: any;
  grades: any;
  cocurricularData: any;
  studentExtracurriculars: any;
  attendance: any;
  notes: any;
} | null = null;

const getCurrentSources = (): SummarySourceInputs => {
  const settingsState = useSettingsStore.getState();
  return {
    settings: settingsState.settings,
    subjects: settingsState.subjects,
    students: useStudentsStore.getState().students,
    grades: useNilaiStore.getState().grades,
    cocurricularData: useCocurricularStore.getState().cocurricularData,
    studentExtracurriculars: useExtracurricularStore.getState().studentExtracurriculars,
    attendance: useAttendanceStore.getState().attendance,
    notes: useNotesStore.getState().notes,
  };
};

export const useSummaryStore = create<SummaryState>()((set, get) => ({
  waliKelasName: 'Wali Kelas',
  stats: [],
  completenessChecks: [],
  academicAlerts: [],
  hasComputed: false,

  recomputeSummary: () => {
    const sources = getCurrentSources();
    if (
      get().hasComputed &&
      lastFingerprint &&
      lastFingerprint.settings === sources.settings &&
      lastFingerprint.subjects === sources.subjects &&
      lastFingerprint.students === sources.students &&
      lastFingerprint.grades === sources.grades &&
      lastFingerprint.cocurricularData === sources.cocurricularData &&
      lastFingerprint.studentExtracurriculars === sources.studentExtracurriculars &&
      lastFingerprint.attendance === sources.attendance &&
      lastFingerprint.notes === sources.notes
    ) {
      return;
    }

    lastFingerprint = { ...sources };
    const snapshot = computeSummarySnapshot(sources);
    set({
      ...snapshot,
      hasComputed: true,
    });
  },
}));

let isSummarySyncInitialized = false;
let isScheduled = false;

const scheduleSummaryRecompute = () => {
  if (isScheduled) return;
  isScheduled = true;
  queueMicrotask(() => {
    isScheduled = false;
    useSummaryStore.getState().recomputeSummary();
  });
};

export const initSummarySync = (): void => {
  useSummaryStore.getState().recomputeSummary();

  if (isSummarySyncInitialized) return;
  isSummarySyncInitialized = true;

  useSettingsStore.subscribe((state, prevState) => {
    if (state.settings !== prevState.settings || state.subjects !== prevState.subjects) {
      scheduleSummaryRecompute();
    }
  });
  useStudentsStore.subscribe((state, prevState) => {
    if (state.students !== prevState.students) {
      scheduleSummaryRecompute();
    }
  });
  useNilaiStore.subscribe((state, prevState) => {
    if (state.grades !== prevState.grades) {
      scheduleSummaryRecompute();
    }
  });
  useNotesStore.subscribe((state, prevState) => {
    if (state.notes !== prevState.notes) {
      scheduleSummaryRecompute();
    }
  });
  useCocurricularStore.subscribe((state, prevState) => {
    if (state.cocurricularData !== prevState.cocurricularData) {
      scheduleSummaryRecompute();
    }
  });
  useAttendanceStore.subscribe((state, prevState) => {
    if (state.attendance !== prevState.attendance) {
      scheduleSummaryRecompute();
    }
  });
  useExtracurricularStore.subscribe((state, prevState) => {
    if (state.studentExtracurriculars !== prevState.studentExtracurriculars) {
      scheduleSummaryRecompute();
    }
  });
};
