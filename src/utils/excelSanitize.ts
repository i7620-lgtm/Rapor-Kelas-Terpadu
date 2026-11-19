import { IMAGE_KEYS } from './imageDB';
import {
  normalizeAttendanceSingleSemester,
  normalizeCocurricularSingleSemester,
  normalizeExtrasSingleSemester,
  normalizeGradesSingleSemester,
  normalizeLearningObjectivesSingleSemester,
  normalizeNotesSingleSemester,
  normalizeSettingsSingleSemester,
} from './dataIntegrity';

const ALL_EXPORTABLE_IMAGE_KEYS = Array.from(
  new Set([...IMAGE_KEYS, 'logoSistem', 'ttdKepsek', 'ttdKepsek_Genap'])
);

// --- Sanitization helpers (Unified 1-Semester Active Model) ---
export const sanitizeGrades = (
  gradesList: any[],
  semester = 'Ganjil',
  _loList?: any,
  _namaKelas?: any,
  _subjects: any[] = []
) => {
  return normalizeGradesSingleSemester(gradesList || [], semester).grades;
};

export const sanitizeNotes = (notesData: Record<string, string>, semester = 'Ganjil') => {
  return normalizeNotesSingleSemester(notesData || {}, semester).notes;
};

export const sanitizeAttendance = (attendanceList: any[], semester = 'Ganjil') => {
  return normalizeAttendanceSingleSemester(attendanceList || [], semester).attendance;
};

export const sanitizeStudentExtracurriculars = (list: any[], semester = 'Ganjil') => {
  return normalizeExtrasSingleSemester(list || [], semester).studentExtracurriculars;
};

export const sanitizeCocurricularData = (coData: Record<string, any>, semester = 'Ganjil') => {
  return normalizeCocurricularSingleSemester(coData || {}, semester).cocurricularData;
};

export const sanitizeLearningObjectives = (lo: Record<string, any>, _semester?: string) => {
  return normalizeLearningObjectivesSingleSemester(lo || {}).learningObjectives;
};

export const sanitizeFormativeJournal = (fj: Record<string, any[]>, _semester?: string) => {
  const newFj: Record<string, any[]> = {};
  Object.entries(fj || {}).forEach(([sid, list]) => {
    if (Array.isArray(list) && list.length > 0) {
      newFj[sid] = list.map((row) => {
        if (row && typeof row === 'object' && 'semester' in row) {
          const { semester: _semester, ...rest } = row;
          return rest;
        }
        return row;
      });
    }
  });
  return newFj;
};

export const sanitizeSettings = (settings: any, _semester?: string) => {
  if (!settings || typeof settings !== 'object') return settings;

  const nextSettings = { ...settings };
  const booleanKeys = [
    'show_aksara_bali',
    'enableExitWarning',
    'enableAutoRegression',
    'show_photo',
    'show_nip_kepsek',
    'show_nis_cover',
    'show_nisn_cover',
    'show_alamat_cover',
    'show_rt_rw',
    'use_clean_piagam_text',
  ];

  ALL_EXPORTABLE_IMAGE_KEYS.forEach((key) => {
    if (
      nextSettings[key] === 'null' ||
      nextSettings[key] === 'undefined' ||
      nextSettings[key] === ''
    ) {
      nextSettings[key] = null;
    } else if (typeof nextSettings[key] === 'string' && nextSettings[key].length === 32767) {
      // Truncated by Excel cell limit
      nextSettings[key] = null;
    }
  });

  booleanKeys.forEach((key) => {
    if (typeof nextSettings[key] === 'string') {
      const lower = nextSettings[key].trim().toLowerCase();
      if (lower === 'true') nextSettings[key] = true;
      else if (lower === 'false') nextSettings[key] = false;
    }
  });

  return normalizeSettingsSingleSemester(nextSettings).settings;
};
