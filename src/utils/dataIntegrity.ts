import { IMAGE_KEYS } from './imageDB';
import {
  computeQualitativeGradingMap,
  isValidQualitativeGradingMap,
} from './nilaiHelpers';

// Registry for flushing pending in-component edits (e.g., DataSiswa debounced inputs)
// before export or app exit.
const pendingFlushRegistry = new Map<string, () => void>();

export function registerPendingFlush(key: string, fn: () => void): () => void {
  pendingFlushRegistry.set(key, fn);
  return () => {
    if (pendingFlushRegistry.get(key) === fn) {
      pendingFlushRegistry.delete(key);
    }
  };
}

export function flushRegisteredInputs(): void {
  for (const fn of pendingFlushRegistry.values()) {
    try {
      fn();
    } catch (err) {
      console.error('Failed to flush pending input:', err);
    }
  }
}

export function deduplicateStudents(students: any[]): { students: any[]; removed: number } {
  if (!Array.isArray(students)) return { students: [], removed: 0 };
  const seen = new Set<string>();
  const deduped: any[] = [];
  let removed = 0;

  for (const student of students) {
    if (!student || typeof student !== 'object' || !student.id) {
      removed++;
      continue;
    }
    const id = String(student.id);
    if (seen.has(id)) {
      removed++;
      continue;
    }
    seen.add(id);
    deduped.push(student);
  }

  return { students: deduped, removed };
}

export interface StoreCleanupInput {
  students: any[];
  grades?: any[];
  attendance?: any[];
  notes?: Record<string, string>;
  cocurricularData?: Record<string, any>;
  studentExtracurriculars?: any[];
  formativeJournal?: Record<string, any[]>;
}

export interface StoreCleanupResult {
  students: any[];
  grades: any[];
  attendance: any[];
  notes: Record<string, string>;
  cocurricularData: Record<string, any>;
  studentExtracurriculars: any[];
  formativeJournal: Record<string, any[]>;
  removedCount: number;
  changed: {
    students: boolean;
    grades: boolean;
    attendance: boolean;
    notes: boolean;
    cocurricularData: boolean;
    studentExtracurriculars: boolean;
    formativeJournal: boolean;
  };
}

export function cleanupOrphanedRecords(input: StoreCleanupInput): StoreCleanupResult {
  const { students: dedupedStudents, removed: studentRemoved } = deduplicateStudents(input.students || []);
  const validIds = new Set<string>(dedupedStudents.map((s) => String(s.id)));

  let removedCount = studentRemoved;

  // 1. Grades (deduplicated per studentId & stripped if orphaned)
  const rawGrades = Array.isArray(input.grades) ? input.grades : [];
  const seenGradeIds = new Set<string>();
  const cleanGrades: any[] = [];
  let gradesChanged = false;
  for (const g of rawGrades) {
    const sid = g?.studentId ? String(g.studentId) : '';
    if (!sid || !validIds.has(sid) || seenGradeIds.has(sid)) {
      gradesChanged = true;
      removedCount++;
      continue;
    }
    seenGradeIds.add(sid);
    cleanGrades.push(g);
  }

  // 2. Attendance (strip orphaned; keep valid IDs)
  const rawAttendance = Array.isArray(input.attendance) ? input.attendance : [];
  const cleanAttendance: any[] = [];
  let attendanceChanged = false;
  for (const a of rawAttendance) {
    const sid = a?.studentId ? String(a.studentId) : '';
    if (!sid || !validIds.has(sid)) {
      attendanceChanged = true;
      removedCount++;
      continue;
    }
    cleanAttendance.push(a);
  }

  // 3. Notes (record keyed by studentId or legacy studentId_Genap)
  const rawNotes = input.notes && typeof input.notes === 'object' ? input.notes : {};
  const cleanNotes: Record<string, string> = {};
  let notesChanged = false;
  for (const [key, val] of Object.entries(rawNotes)) {
    const baseId = key.endsWith('_Genap') ? key.slice(0, -6) : key;
    if (!baseId || !validIds.has(baseId)) {
      notesChanged = true;
      removedCount++;
      continue;
    }
    cleanNotes[key] = val;
  }

  // 4. CocurricularData (record keyed by studentId)
  const rawCo =
    input.cocurricularData && typeof input.cocurricularData === 'object' ? input.cocurricularData : {};
  const cleanCo: Record<string, any> = {};
  let coChanged = false;
  for (const [key, val] of Object.entries(rawCo)) {
    if (!key || !validIds.has(key)) {
      coChanged = true;
      removedCount++;
      continue;
    }
    cleanCo[key] = val;
  }

  // 5. StudentExtracurriculars
  const rawExtras = Array.isArray(input.studentExtracurriculars) ? input.studentExtracurriculars : [];
  const cleanExtras: any[] = [];
  let extrasChanged = false;
  for (const se of rawExtras) {
    const sid = se?.studentId ? String(se.studentId) : '';
    if (!sid || !validIds.has(sid)) {
      extrasChanged = true;
      removedCount++;
      continue;
    }
    cleanExtras.push(se);
  }

  // 6. FormativeJournal (record keyed by studentId)
  const rawJournal =
    input.formativeJournal && typeof input.formativeJournal === 'object' ? input.formativeJournal : {};
  const cleanJournal: Record<string, any[]> = {};
  let journalChanged = false;
  for (const [key, val] of Object.entries(rawJournal)) {
    if (!key || !validIds.has(key)) {
      journalChanged = true;
      removedCount++;
      continue;
    }
    cleanJournal[key] = Array.isArray(val) ? val : [];
  }

  return {
    students: dedupedStudents,
    grades: cleanGrades,
    attendance: cleanAttendance,
    notes: cleanNotes,
    cocurricularData: cleanCo,
    studentExtracurriculars: cleanExtras,
    formativeJournal: cleanJournal,
    removedCount,
    changed: {
      students: studentRemoved > 0,
      grades: gradesChanged,
      attendance: attendanceChanged,
      notes: notesChanged,
      cocurricularData: coChanged,
      studentExtracurriculars: extrasChanged,
      formativeJournal: journalChanged,
    },
  };
}

const hasDescText = (desc: any): boolean =>
  Boolean(desc && ((desc.highest && String(desc.highest).trim() !== '') || (desc.lowest && String(desc.lowest).trim() !== '')));

const hasRatings = (ratings: any): boolean =>
  Boolean(ratings && typeof ratings === 'object' && Object.values(ratings).some((r) => Boolean(r)));

const hasAttendanceValues = (att: any): boolean =>
  Boolean(att && (att.sakit !== null && att.sakit !== undefined || att.izin !== null && att.izin !== undefined || att.alpa !== null && att.alpa !== undefined));

const hasExtraActivities = (se: any): boolean =>
  Boolean(se && Array.isArray(se.assignedActivities) && se.assignedActivities.some((a: any) => a !== null && a !== undefined));

export function normalizeSettingsSingleSemester(rawSettings: any): { settings: any; changed: boolean } {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return { settings: rawSettings, changed: false };
  }
  const s = { ...rawSettings };
  const activeSem = s.semester === 'Genap' ? 'Genap' : 'Ganjil';
  let changed = false;

  // Strip any accidental transient blob: URLs on IMAGE_KEYS when normalizing persisted state
  for (const key of IMAGE_KEYS) {
    if (typeof s[key] === 'string' && s[key].startsWith('blob:')) {
      s[key] = null;
      changed = true;
    }
  }

  // Ensure qualitativeGradingMap stays populated (Prioritas 1 safeguard)
  if (!isValidQualitativeGradingMap(s.qualitativeGradingMap)) {
    s.qualitativeGradingMap = computeQualitativeGradingMap(s.predikats);
    changed = true;
  }

  // Unify kop_layout
  if ('kop_layout_Genap' in s) {
    const genapLayout = s.kop_layout_Genap;
    const ganjilLayout = s.kop_layout;
    if (activeSem === 'Genap' && Array.isArray(genapLayout) && genapLayout.length > 0) {
      s.kop_layout = genapLayout;
    } else if ((!Array.isArray(ganjilLayout) || ganjilLayout.length === 0) && Array.isArray(genapLayout) && genapLayout.length > 0) {
      s.kop_layout = genapLayout;
    }
    delete s.kop_layout_Genap;
    changed = true;
  }

  // Unify piagam_layout
  if ('piagam_layout_Genap' in s) {
    if (activeSem === 'Genap' && s.piagam_layout_Genap) {
      s.piagam_layout = s.piagam_layout_Genap;
    } else if (!s.piagam_layout && s.piagam_layout_Genap) {
      s.piagam_layout = s.piagam_layout_Genap;
    }
    delete s.piagam_layout_Genap;
    changed = true;
  }

  // Unify cocurricular_theme
  if ('cocurricular_theme_Genap' in s) {
    const genapTheme = s.cocurricular_theme_Genap;
    if (activeSem === 'Genap' && genapTheme && String(genapTheme).trim() !== '') {
      s.cocurricular_theme = genapTheme;
    } else if ((!s.cocurricular_theme || String(s.cocurricular_theme).trim() === '') && genapTheme) {
      s.cocurricular_theme = genapTheme;
    }
    delete s.cocurricular_theme_Genap;
    changed = true;
  }

  // Migrate semester-suffixed contextual keys (*_ctx_KLS_TA_Ganjil/Genap & tanggal_rapor_KLS_TA_Ganjil/Genap)
  const contextualPrefixes = [
    'nama_kepala_sekolah',
    'nip_kepala_sekolah',
    'nip_label_kepala_sekolah',
    'nama_wali_kelas',
    'nip_wali_kelas',
    'nip_label_wali_kelas',
  ];

  const allKeys = Object.keys(s);
  for (const key of allKeys) {
    // Pattern: <base>_ctx_<kls>_<ta>_<Ganjil|Genap>
    const ctxSemMatch = key.match(/^(.+)_ctx_(.+)_(Ganjil|Genap)$/);
    if (ctxSemMatch && contextualPrefixes.includes(ctxSemMatch[1])) {
      const unifiedKey = `${ctxSemMatch[1]}_ctx_${ctxSemMatch[2]}`;
      const semLabel = ctxSemMatch[3];
      const val = s[key];
      if (val && String(val).trim() !== '') {
        if (semLabel === activeSem || !s[unifiedKey] || String(s[unifiedKey]).trim() === '') {
          s[unifiedKey] = val;
        }
      }
      delete s[key];
      changed = true;
      continue;
    }

    // Pattern: tanggal_rapor_<kls>_<ta>_<Ganjil|Genap>
    const tglSemMatch = key.match(/^tanggal_rapor_(.+)_(Ganjil|Genap)$/);
    if (tglSemMatch) {
      const unifiedKey = `tanggal_rapor_${tglSemMatch[1]}`;
      const semLabel = tglSemMatch[2];
      const val = s[key];
      if (val && String(val).trim() !== '') {
        if (semLabel === activeSem || !s[unifiedKey] || String(s[unifiedKey]).trim() === '') {
          s[unifiedKey] = val;
        }
      }
      delete s[key];
      changed = true;
    }
  }

  return { settings: s, changed };
}

export function normalizeGradesSingleSemester(grades: any[], activeSemester = 'Ganjil'): { grades: any[]; changed: boolean } {
  if (!Array.isArray(grades)) return { grades: [], changed: false };
  const isGenap = activeSemester === 'Genap';
  let changed = false;

  const normalized = grades.map((studentGrade) => {
    if (!studentGrade || typeof studentGrade !== 'object' || !studentGrade.detailedGrades) {
      return studentGrade;
    }
    let studentChanged = false;
    const newDetailed: Record<string, any> = {};

    for (const [subId, d] of Object.entries<any>(studentGrade.detailedGrades)) {
      if (!d || typeof d !== 'object') {
        newDetailed[subId] = d;
        continue;
      }

      const hasLegacyFields =
        'sts1' in d ||
        'sts2' in d ||
        'sas1' in d ||
        'sas2' in d ||
        'descriptions_Genap' in d;

      if (!hasLegacyFields && 'sts' in d && 'sas' in d) {
        newDetailed[subId] = d;
        continue;
      }

      studentChanged = true;
      changed = true;

      let nextSts = d.sts;
      if (nextSts === undefined) {
        nextSts = isGenap ? (d.sts2 ?? d.sts1 ?? null) : (d.sts1 ?? d.sts2 ?? null);
      }

      let nextSas = d.sas;
      if (nextSas === undefined) {
        nextSas = isGenap ? (d.sas2 ?? d.sas1 ?? null) : (d.sas1 ?? d.sas2 ?? null);
      }

      let nextDescriptions = d.descriptions || { highest: '', lowest: '' };
      if ('descriptions_Genap' in d) {
        if (isGenap && hasDescText(d.descriptions_Genap)) {
          nextDescriptions = d.descriptions_Genap;
        } else if (!hasDescText(nextDescriptions) && hasDescText(d.descriptions_Genap)) {
          nextDescriptions = d.descriptions_Genap;
        }
      }

      const cleanedSub = { ...d };
      delete cleanedSub.sts1;
      delete cleanedSub.sts2;
      delete cleanedSub.sas1;
      delete cleanedSub.sas2;
      delete cleanedSub.descriptions_Genap;
      cleanedSub.sts = nextSts ?? null;
      cleanedSub.sas = nextSas ?? null;
      cleanedSub.descriptions = nextDescriptions;

      newDetailed[subId] = cleanedSub;
    }

    if (!studentChanged) return studentGrade;
    return {
      ...studentGrade,
      detailedGrades: newDetailed,
    };
  });

  return { grades: normalized, changed };
}

export function normalizeNotesSingleSemester(notes: Record<string, string>, activeSemester = 'Ganjil'): { notes: Record<string, string>; changed: boolean } {
  if (!notes || typeof notes !== 'object') return { notes: {}, changed: false };
  const isGenap = activeSemester === 'Genap';
  const normalized: Record<string, string> = {};
  let changed = false;

  // First copy non-_Genap keys
  for (const [key, val] of Object.entries(notes)) {
    if (!key.endsWith('_Genap')) {
      normalized[key] = val;
    }
  }

  // Merge _Genap keys
  for (const [key, val] of Object.entries(notes)) {
    if (!key.endsWith('_Genap')) continue;
    changed = true;
    const baseId = key.slice(0, -6);
    if (!baseId) continue;
    const existing = normalized[baseId];
    if (isGenap && val && String(val).trim() !== '') {
      normalized[baseId] = val;
    } else if ((!existing || String(existing).trim() === '') && val && String(val).trim() !== '') {
      normalized[baseId] = val;
    }
  }

  return { notes: normalized, changed };
}

export function normalizeCocurricularSingleSemester(cocurricularData: Record<string, any>, activeSemester = 'Ganjil'): { cocurricularData: Record<string, any>; changed: boolean } {
  if (!cocurricularData || typeof cocurricularData !== 'object') {
    return { cocurricularData: {}, changed: false };
  }
  const isGenap = activeSemester === 'Genap';
  const normalized: Record<string, any> = {};
  let changed = false;

  for (const [sid, entry] of Object.entries<any>(cocurricularData)) {
    if (!entry || typeof entry !== 'object') {
      normalized[sid] = entry;
      continue;
    }
    if ('dimensionRatings_Genap' in entry) {
      changed = true;
      const nextEntry = { ...entry };
      const genapRatings = entry.dimensionRatings_Genap;
      if (isGenap && hasRatings(genapRatings)) {
        nextEntry.dimensionRatings = genapRatings;
      } else if (!hasRatings(entry.dimensionRatings) && hasRatings(genapRatings)) {
        nextEntry.dimensionRatings = genapRatings;
      } else if (!nextEntry.dimensionRatings) {
        nextEntry.dimensionRatings = {};
      }
      delete nextEntry.dimensionRatings_Genap;
      normalized[sid] = nextEntry;
    } else {
      normalized[sid] = entry;
    }
  }

  return { cocurricularData: normalized, changed };
}

export function normalizeAttendanceSingleSemester(attendance: any[], activeSemester = 'Ganjil'): { attendance: any[]; changed: boolean } {
  if (!Array.isArray(attendance)) return { attendance: [], changed: false };
  const byStudent = new Map<string, any>();
  let changed = false;

  for (const rec of attendance) {
    if (!rec || !rec.studentId) {
      changed = true;
      continue;
    }
    const sid = String(rec.studentId);
    const existing = byStudent.get(sid);

    if ('semester' in rec) {
      changed = true;
    }

    if (!existing) {
      byStudent.set(sid, {
        studentId: sid,
        sakit: rec.sakit ?? null,
        izin: rec.izin ?? null,
        alpa: rec.alpa ?? null,
        _sem: rec.semester || 'Ganjil',
      });
    } else {
      changed = true;
      const recSem = rec.semester || 'Ganjil';
      const recMatches = recSem === activeSemester;
      const existingMatches = existing._sem === activeSemester;
      if ((recMatches && !existingMatches && hasAttendanceValues(rec)) || (!hasAttendanceValues(existing) && hasAttendanceValues(rec))) {
        byStudent.set(sid, {
          studentId: sid,
          sakit: rec.sakit ?? null,
          izin: rec.izin ?? null,
          alpa: rec.alpa ?? null,
          _sem: recSem,
        });
      }
    }
  }

  const normalized = Array.from(byStudent.values()).map(({ _sem, ...rest }) => rest);
  return { attendance: normalized, changed };
}

export function normalizeExtrasSingleSemester(studentExtracurriculars: any[], activeSemester = 'Ganjil'): { studentExtracurriculars: any[]; changed: boolean } {
  if (!Array.isArray(studentExtracurriculars)) return { studentExtracurriculars: [], changed: false };
  const byStudent = new Map<string, any>();
  let changed = false;

  for (const rec of studentExtracurriculars) {
    if (!rec || !rec.studentId) {
      changed = true;
      continue;
    }
    const sid = String(rec.studentId);
    const existing = byStudent.get(sid);

    if ('semester' in rec) {
      changed = true;
    }

    if (!existing) {
      byStudent.set(sid, {
        ...rec,
        studentId: sid,
        _sem: rec.semester || 'Ganjil',
      });
    } else {
      changed = true;
      const recSem = rec.semester || 'Ganjil';
      const recMatches = recSem === activeSemester;
      const existingMatches = existing._sem === activeSemester;
      if ((recMatches && !existingMatches && hasExtraActivities(rec)) || (!hasExtraActivities(existing) && hasExtraActivities(rec))) {
        byStudent.set(sid, {
          ...rec,
          studentId: sid,
          _sem: recSem,
        });
      }
    }
  }

  const normalized = Array.from(byStudent.values()).map(({ _sem, semester: _semester, ...rest }) => rest);
  return { studentExtracurriculars: normalized, changed };
}

export function normalizeLearningObjectivesSingleSemester(learningObjectives: Record<string, any>): { learningObjectives: Record<string, any>; changed: boolean } {
  if (!learningObjectives || typeof learningObjectives !== 'object') {
    return { learningObjectives: {}, changed: false };
  }
  let changed = false;
  const nextLO: Record<string, any> = {};

  for (const [gradeKey, subjectsMap] of Object.entries<any>(learningObjectives)) {
    if (!subjectsMap || typeof subjectsMap !== 'object') {
      nextLO[gradeKey] = subjectsMap;
      continue;
    }
    const nextSubjectsMap: Record<string, any> = {};
    for (const [subName, tps] of Object.entries<any>(subjectsMap)) {
      if (!Array.isArray(tps)) {
        nextSubjectsMap[subName] = tps;
        continue;
      }
      nextSubjectsMap[subName] = tps.map((tp: any) => {
        if (tp && typeof tp === 'object' && 'semester' in tp) {
          changed = true;
          const { semester: _semester, ...rest } = tp;
          return rest;
        }
        return tp;
      });
    }
    nextLO[gradeKey] = nextSubjectsMap;
  }

  return { learningObjectives: nextLO, changed };
}

export function normalizeSingleSemesterState(payload: {
  settings: any;
  students: any[];
  grades: any[];
  attendance: any[];
  notes: Record<string, string>;
  cocurricularData: Record<string, any>;
  studentExtracurriculars: any[];
  formativeJournal: Record<string, any[]>;
  learningObjectives: Record<string, any>;
}) {
  const { settings: normSettings, changed: settingsNormChanged } = normalizeSettingsSingleSemester(payload.settings);
  const activeSemester = normSettings?.semester === 'Genap' ? 'Genap' : 'Ganjil';

  const { grades: normGrades, changed: gradesNormChanged } = normalizeGradesSingleSemester(payload.grades, activeSemester);
  const { notes: normNotes, changed: notesNormChanged } = normalizeNotesSingleSemester(payload.notes, activeSemester);
  const { cocurricularData: normCo, changed: coNormChanged } = normalizeCocurricularSingleSemester(payload.cocurricularData, activeSemester);
  const { attendance: normAtt, changed: attNormChanged } = normalizeAttendanceSingleSemester(payload.attendance, activeSemester);
  const { studentExtracurriculars: normExtras, changed: extrasNormChanged } = normalizeExtrasSingleSemester(payload.studentExtracurriculars, activeSemester);
  const { learningObjectives: normLO, changed: loNormChanged } = normalizeLearningObjectivesSingleSemester(payload.learningObjectives);

  const cleaned = cleanupOrphanedRecords({
    students: payload.students,
    grades: normGrades,
    attendance: normAtt,
    notes: normNotes,
    cocurricularData: normCo,
    studentExtracurriculars: normExtras,
    formativeJournal: payload.formativeJournal,
  });

  return {
    settings: normSettings,
    students: cleaned.students,
    grades: cleaned.grades,
    attendance: cleaned.attendance,
    notes: cleaned.notes,
    cocurricularData: cleaned.cocurricularData,
    studentExtracurriculars: cleaned.studentExtracurriculars,
    formativeJournal: cleaned.formativeJournal,
    learningObjectives: normLO,
    removedCount: cleaned.removedCount,
    changed: {
      settings: settingsNormChanged,
      students: cleaned.changed.students,
      grades: gradesNormChanged || cleaned.changed.grades,
      attendance: attNormChanged || cleaned.changed.attendance,
      notes: notesNormChanged || cleaned.changed.notes,
      cocurricularData: coNormChanged || cleaned.changed.cocurricularData,
      studentExtracurriculars: extrasNormChanged || cleaned.changed.studentExtracurriculars,
      formativeJournal: cleaned.changed.formativeJournal,
      learningObjectives: loNormChanged,
    },
  };
}
