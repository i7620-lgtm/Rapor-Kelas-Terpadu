import { COCURRICULAR_DIMENSIONS, initialSettings, defaultSubjects } from "../constants";
import { computeQualitativeGradingMap } from "./nilaiHelpers";
import {
  normalizeAttendanceSingleSemester,
  normalizeCocurricularSingleSemester,
  normalizeExtrasSingleSemester,
  normalizeNotesSingleSemester,
  normalizeSettingsSingleSemester,
} from "./dataIntegrity";

export interface ValidationReport {
  repairedCount: number;
  skippedOrphanedCount: number;
  logs: string[];
}

/**
 * Safe conversion helpers to avoid corrupting our state with undefined, NaN, or raw nulls.
 */
export const safeString = (val: any, fallback = ""): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  const str = String(val).trim();
  return str === "null" || str === "undefined" ? fallback : str;
};

export const safeNumber = (val: any, fallback: number | null = null): number | null => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

export const safeInt = (val: any, fallback: number | null = null): number | null => {
  const num = safeNumber(val, fallback);
  return num === null ? null : Math.floor(num);
};

export const validateAndSanitizeImportedData = (
  rawPayload: any,
  subjectsInSystem: any[] = defaultSubjects
): { sanitized: any; report: ValidationReport } => {
  const logs: string[] = [];
  let repairedCount = 0;
  let skippedOrphanedCount = 0;

  const logRepair = (message: string) => {
    repairedCount++;
    if (logs.length < 50) {
      logs.push(message);
    }
  };

  const logSkip = (message: string) => {
    skippedOrphanedCount++;
    if (logs.length < 50) {
      logs.push(message);
    }
  };

  if (!rawPayload || typeof rawPayload !== "object") {
    throw new Error("Payload impor Excel tidak terdefinisi atau bukan objek.");
  }

  // --- 1. SANITIZE SETTINGS ---
  const rawSettings = rawPayload.settings || {};
  let settings: any = { ...initialSettings };

  const booleanKeys = [
    "show_aksara_bali",
    "enableExitWarning",
    "enableAutoRegression",
    "show_photo",
    "show_nip_kepsek",
    "show_nis_cover",
    "show_nisn_cover",
    "show_alamat_cover",
    "show_rt_rw",
    "use_clean_piagam_text",
  ];
  const booleanKeySet = new Set(booleanKeys);
  const arrayOrObjectKeys = new Set([
    "predikats",
    "gradeCalculation",
    "qualitativeGradingMap",
    "slmVisibility",
    "kop_layout",
    "piagam_layout",
    "kop_layout_Genap",
    "piagam_layout_Genap",
    "appLock",
  ]);

  // Core scalar settings - dynamically include all non-boolean/non-object initialSettings keys plus legacy aliases
  const stringKeys = [
    ...Object.keys(initialSettings).filter(
      (key) => !booleanKeySet.has(key) && !arrayOrObjectKeys.has(key)
    ),
    "kabupaten_kota",
    "kodepos",
    "tempat_ttd_rapor",
    "tanggal_ttd_rapor",
    "tanggal_ttd_rapor_Genap",
    "kop_nama_dinas",
    "kop_nama_sekolah",
    "kop_alamat_sekolah",
    "logoSistem",
    "ttdKepsek",
    "ttdKepsek_Genap",
    "cocurricular_theme_Genap",
    "piagam_nomor_prefix",
    "piagam_nama_kegiatan",
    "piagam_tanggal_cetak",
  ];

  stringKeys.forEach((key) => {
    if (rawSettings[key] !== undefined) {
      settings[key] = safeString(rawSettings[key]);
    }
  });

  // Preserve dynamic contextual keys (*_ctx_* and tanggal_rapor_*) safely before single-semester migration
  Object.keys(rawSettings).forEach((key) => {
    if (
      !["__proto__", "constructor", "prototype"].includes(key) &&
      (key.includes("_ctx_") || key.startsWith("tanggal_rapor_"))
    ) {
      settings[key] = safeString(rawSettings[key]);
    }
  });

  // Preserve layout & appLock arrays/objects properly
  (["kop_layout", "piagam_layout", "kop_layout_Genap", "piagam_layout_Genap"] as const).forEach((lKey) => {
    if (rawSettings[lKey] !== undefined) {
      if (Array.isArray(rawSettings[lKey])) {
        settings[lKey] = rawSettings[lKey];
      } else if (typeof rawSettings[lKey] === "string") {
        try {
          const parsed = JSON.parse(rawSettings[lKey]);
          settings[lKey] = Array.isArray(parsed) ? parsed : [];
        } catch {
          settings[lKey] = [];
        }
      }
    }
  });
  if (rawSettings.appLock && typeof rawSettings.appLock === "object") {
    settings.appLock = rawSettings.appLock;
  }

  // Handle compatibility alias assignments
  if (rawSettings.kodepos !== undefined && (rawSettings.kode_pos === undefined || rawSettings.kode_pos === "")) {
    settings.kode_pos = safeString(rawSettings.kodepos);
  }
  if (rawSettings.kabupaten_kota !== undefined && (rawSettings.kota_kabupaten === undefined || rawSettings.kota_kabupaten === "")) {
    settings.kota_kabupaten = safeString(rawSettings.kabupaten_kota);
  }
  if (rawSettings.tanggal_ttd_rapor !== undefined && (rawSettings.tanggal_rapor === undefined || rawSettings.tanggal_rapor === "")) {
    settings.tanggal_rapor = safeString(rawSettings.tanggal_ttd_rapor);
  }

  // Ensure active semester matches Ganjil/Genap strictly
  const rawSemester = safeString(rawSettings.semester, "Ganjil");
  if (rawSemester === "Ganjil" || rawSemester === "Genap") {
    settings.semester = rawSemester;
  } else {
    settings.semester = "Ganjil";
    logRepair(`Format semester tidak valid ("${rawSemester}"), diatur ulang ke "Ganjil"`);
  }

  // Ensure predikats contains strings representing numbers
  settings.predikats = {
    a: safeString(safeInt(rawSettings.predikats?.a, 90), "90"),
    b: safeString(safeInt(rawSettings.predikats?.b, 80), "80"),
    c: safeString(safeInt(rawSettings.predikats?.c, 70), "70"),
    d: safeString(safeInt(rawSettings.predikats?.d, 0), "0"),
  };

  // Clamp predikats values safely between 0-100 and enforce correct sorting bounds
  const predVals = {
    a: Math.min(100, Math.max(0, parseInt(settings.predikats.a, 10))),
    b: Math.min(99, Math.max(0, parseInt(settings.predikats.b, 10))),
    c: Math.min(98, Math.max(0, parseInt(settings.predikats.c, 10))),
    d: 0,
  };

  if (predVals.a <= predVals.b) {
    predVals.a = predVals.b + 1;
    settings.predikats.a = String(predVals.a);
    logRepair(`Rentang nilai predikat A disesuaikan agar lebih besar dari predikat B (${predVals.b})`);
  }
  if (predVals.b <= predVals.c) {
    predVals.b = predVals.c + 1;
    settings.predikats.b = String(predVals.b);
    logRepair(`Rentang nilai predikat B disesuaikan agar lebih besar dari predikat C (${predVals.c})`);
  }

  // Recalculate qualitative mapping (Prioritas 1 safeguard)
  settings.qualitativeGradingMap = computeQualitativeGradingMap(settings.predikats);

  // Grade Calculations sanitization (accept bobot -> pembobotan & persentase)
  settings.gradeCalculation = {};
  if (rawSettings.gradeCalculation && typeof rawSettings.gradeCalculation === "object") {
    Object.entries(rawSettings.gradeCalculation).forEach(([subId, calcObj]: [string, any]) => {
      const rawMethod = safeString(calcObj?.method, "rata-rata").toLowerCase();
      const normalizedMethod = rawMethod === "bobot" ? "pembobotan" : rawMethod;
      const cleanWeights: Record<string, number> = {};
      if (calcObj?.weights && typeof calcObj.weights === "object") {
        Object.entries(calcObj.weights).forEach(([wKey, wVal]) => {
          const wNum = safeNumber(wVal, 0) || 0;
          cleanWeights[wKey] = Math.max(0, wNum);
        });
      }
      settings.gradeCalculation[subId] = {
        method: ["rata-rata", "pembobotan", "persentase"].includes(normalizedMethod)
          ? normalizedMethod
          : "rata-rata",
        weights: cleanWeights,
      };
    });
  }

  // SLM Visibility sanitization
  settings.slmVisibility = {};
  if (rawSettings.slmVisibility && typeof rawSettings.slmVisibility === "object") {
    Object.entries(rawSettings.slmVisibility).forEach(([subId, visArray]) => {
      if (Array.isArray(visArray)) {
        settings.slmVisibility[subId] = visArray.map((v) => safeString(v));
      } else {
        settings.slmVisibility[subId] = [];
      }
    });
  }

  // Boolean settings sanitization
  booleanKeys.forEach((key) => {
    if (rawSettings[key] !== undefined && rawSettings[key] !== null && rawSettings[key] !== "") {
      settings[key] = rawSettings[key] === true || String(rawSettings[key]).trim().toLowerCase() === "true";
    }
  });

  // Unify any legacy *_Genap settings & contextual keys into canonical 1-semester keys
  settings = normalizeSettingsSingleSemester(settings).settings;
  const isGenapActive = settings.semester === "Genap";

  // --- 2. SANITIZE & DEDUPLICATE STUDENTS ---
  const rawStudents = Array.isArray(rawPayload.students) ? rawPayload.students : [];
  const students: any[] = [];
  const validStudentIds = new Set<string>();

  rawStudents.forEach((student: any, idx: number) => {
    const rawId = safeString(student?.id || student?.ID || "");
    const cleanId = rawId !== "" ? rawId : `s_imported_${Date.now()}_${idx}`;
    const cleanNama = safeString(student?.namaLengkap || student?.nama_lengkap || student?.nama || "");

    if (!cleanNama) {
      logSkip(`Baris siswa dengan ID "${cleanId}" diabaikan karena kolom "Nama Lengkap" kosong.`);
      return;
    }

    if (validStudentIds.has(cleanId)) {
      logSkip(`Baris siswa duplikat dengan ID "${cleanId}" diabaikan.`);
      return;
    }

    const sanitizedStudent: any = {
      id: cleanId,
      namaLengkap: cleanNama,
      namaPanggilan: safeString(student?.namaPanggilan),
      nis: safeString(student?.nis),
      nisn: safeString(student?.nisn),
      ttl: safeString(student?.ttl),
      jenisKelamin: safeString(student?.jenisKelamin),
      agama: safeString(student?.agama),
      asalTk: safeString(student?.asalTk || student?.asal_tk),
      alamatSiswa: safeString(student?.alamatSiswa || student?.alamat_siswa),
      diterimaDiKelas: safeString(student?.diterimaDiKelas || student?.diterima_di_kelas),
      diterimaTanggal: safeString(student?.diterimaTanggal || student?.diterima_tanggal),
      namaAyah: safeString(student?.namaAyah || student?.nama_ayah),
      namaIbu: safeString(student?.namaIbu || student?.nama_ibu),
      pekerjaanAyah: safeString(student?.pekerjaanAyah || student?.pekerjaan_ayah),
      pekerjaanIbu: safeString(student?.pekerjaanIbu || student?.pekerjaan_ibu),
      alamatOrangTua: safeString(student?.alamatOrangTua || student?.alamat_orangtua),
      teleponOrangTua: safeString(student?.teleponOrangTua || student?.telepon_orangtua),
      namaWali: safeString(student?.namaWali || student?.nama_wali),
      pekerjaanWali: safeString(student?.pekerjaanWali || student?.pekerjaan_wali),
      alamatWali: safeString(student?.alamatWali || student?.alamat_wali),
      teleponWali: safeString(student?.teleponWali || student?.telepon_wali),
      ...(safeString(student?.foto) ? { foto: safeString(student?.foto) } : {}),
    };

    students.push(sanitizedStudent);
    validStudentIds.add(cleanId);
  });

  // --- 3. SANITIZE & DEDUPLICATE GRADES (UNIFIED 1-SEMESTER) ---
  const rawGrades = Array.isArray(rawPayload.grades) ? rawPayload.grades : [];
  const grades: any[] = [];
  const seenGradeStudentIds = new Set<string>();

  const hasDescText = (d: any) =>
    Boolean(d && ((d.highest && String(d.highest).trim() !== "") || (d.lowest && String(d.lowest).trim() !== "")));

  rawGrades.forEach((g: any) => {
    const studentId = safeString(g?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data nilai untuk siswa ID "${studentId}" diabaikan karena siswa tidak terdaftar.`);
      return;
    }
    if (seenGradeStudentIds.has(studentId)) {
      logSkip(`Data nilai duplikat untuk siswa ID "${studentId}" diabaikan.`);
      return;
    }
    seenGradeStudentIds.add(studentId);

    const detailedGrades: Record<string, any> = {};
    if (g.detailedGrades && typeof g.detailedGrades === "object") {
      Object.entries(g.detailedGrades).forEach(([subjectId, subGrades]: [string, any]) => {
        if (!subGrades || typeof subGrades !== "object") return;

        const cleanSlm: any[] = [];
        if (Array.isArray(subGrades.slm)) {
          subGrades.slm.forEach((sItem: any) => {
            const slmId = safeString(sItem?.id);
            if (!slmId) return;

            const scores: (number | null)[] = [];
            if (Array.isArray(sItem.scores)) {
              sItem.scores.forEach((scr: any) => {
                const checked = safeNumber(scr);
                scores.push(checked === null ? null : Math.min(100, Math.max(0, checked)));
              });
            }

            cleanSlm.push({
              id: slmId,
              name: safeString(sItem?.name, "Lingkup Materi"),
              scores,
            });
          });
        }

        const safeGradeVal = (val: any) => {
          const num = safeNumber(val);
          return num === null ? null : Math.min(100, Math.max(0, num));
        };

        const rawSts =
          subGrades.sts !== undefined
            ? subGrades.sts
            : isGenapActive
              ? (subGrades.sts2 ?? subGrades.sts1)
              : (subGrades.sts1 ?? subGrades.sts2);

        const rawSas =
          subGrades.sas !== undefined
            ? subGrades.sas
            : isGenapActive
              ? (subGrades.sas2 ?? subGrades.sas1)
              : (subGrades.sas1 ?? subGrades.sas2);

        const descPrimary = subGrades.descriptions || {};
        const descGenap = subGrades.descriptions_Genap || {};
        const chosenDesc =
          isGenapActive && hasDescText(descGenap)
            ? descGenap
            : hasDescText(descPrimary)
              ? descPrimary
              : hasDescText(descGenap)
                ? descGenap
                : {};

        detailedGrades[subjectId] = {
          slm: cleanSlm,
          sts: safeGradeVal(rawSts),
          sas: safeGradeVal(rawSas),
          descriptions: {
            highest: safeString(chosenDesc.highest),
            lowest: safeString(chosenDesc.lowest),
          },
        };
      });
    }

    const finalGrades: Record<string, any> = {};
    if (g.finalGrades && typeof g.finalGrades === "object") {
      Object.entries(g.finalGrades).forEach(([subjectId, fGrade]) => {
        const num = safeNumber(fGrade);
        finalGrades[subjectId] = num === null ? null : Math.min(100, Math.max(0, num));
      });
    }

    grades.push({
      studentId,
      detailedGrades,
      finalGrades,
    });
  });

  // Ensure all students have an entry in grades array
  students.forEach((s) => {
    if (!seenGradeStudentIds.has(s.id)) {
      seenGradeStudentIds.add(s.id);
      grades.push({
        studentId: s.id,
        detailedGrades: {},
        finalGrades: {},
      });
    }
  });

  // --- 4. SANITIZE & DEDUPLICATE ATTENDANCE ---
  const rawAttendance = Array.isArray(rawPayload.attendance) ? rawPayload.attendance : [];
  const validRawAttendance: any[] = [];

  rawAttendance.forEach((item: any) => {
    const studentId = safeString(item?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data kehadiran untuk siswa ID "${studentId}" diabaikan.`);
      return;
    }

    const cleanSakit = safeInt(item?.sakit);
    const cleanIzin = safeInt(item?.izin);
    const cleanAlpa = safeInt(item?.alpa);

    validRawAttendance.push({
      studentId,
      ...(item?.semester ? { semester: safeString(item.semester) } : {}),
      sakit: cleanSakit === null ? null : Math.max(0, cleanSakit),
      izin: cleanIzin === null ? null : Math.max(0, cleanIzin),
      alpa: cleanAlpa === null ? null : Math.max(0, cleanAlpa),
    });
  });
  const attendance = normalizeAttendanceSingleSemester(validRawAttendance, settings.semester).attendance;

  // --- 5. SANITIZE NOTES (CATATAN WALI KELAS, UNIFIED KEY) ---
  const rawNotes = rawPayload.notes || {};
  const validRawNotes: Record<string, string> = {};

  Object.entries(rawNotes).forEach(([key, val]) => {
    const rawStudentId = key.endsWith("_Genap") ? key.slice(0, -6) : key;
    if (validStudentIds.has(rawStudentId)) {
      validRawNotes[key] = safeString(val);
    } else {
      logSkip(`Catatan untuk siswa ID "${rawStudentId}" diabaikan.`);
    }
  });
  const notes = normalizeNotesSingleSemester(validRawNotes, settings.semester).notes;

  // --- 6. SANITIZE COCURRICULAR DATA (UNIFIED) ---
  const rawCocurricular = rawPayload.cocurricularData || {};
  const validRawCo: Record<string, any> = {};

  Object.entries(rawCocurricular).forEach(([studentId, dataObj]: [string, any]) => {
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data kokurikuler untuk siswa ID "${studentId}" diabaikan.`);
      return;
    }
    if (!dataObj || typeof dataObj !== "object") return;

    const cleanRatings: Record<string, string> = {};
    const cleanRatingsGenap: Record<string, string> = {};

    const sanitizeRatingsMap = (rawRatings: any, targetMap: Record<string, string>) => {
      if (rawRatings && typeof rawRatings === "object") {
        COCURRICULAR_DIMENSIONS.forEach((dim) => {
          if (rawRatings[dim.id] !== undefined) {
            targetMap[dim.id] = safeString(rawRatings[dim.id]);
          }
        });
        if (rawRatings.manualDescription !== undefined) {
          targetMap.manualDescription = safeString(rawRatings.manualDescription);
        }
      }
    };

    sanitizeRatingsMap(dataObj.dimensionRatings, cleanRatings);
    sanitizeRatingsMap(dataObj.dimensionRatings_Genap, cleanRatingsGenap);

    validRawCo[studentId] = {};
    if (Object.keys(cleanRatings).length > 0) {
      validRawCo[studentId].dimensionRatings = cleanRatings;
    }
    if (Object.keys(cleanRatingsGenap).length > 0) {
      validRawCo[studentId].dimensionRatings_Genap = cleanRatingsGenap;
    }
  });
  const cocurricularData = normalizeCocurricularSingleSemester(validRawCo, settings.semester).cocurricularData;

  // --- 7. SANITIZE & DEDUPLICATE STUDENT EXTRACURRICULARS ---
  const rawStudentEx = Array.isArray(rawPayload.studentExtracurriculars) ? rawPayload.studentExtracurriculars : [];
  const validRawStudentEx: any[] = [];

  rawStudentEx.forEach((item: any) => {
    const studentId = safeString(item?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data ekstrakurikuler siswa ID "${studentId}" diabaikan.`);
      return;
    }

    const assignedActivities = Array.isArray(item?.assignedActivities)
      ? item.assignedActivities.map((act: any) => (act ? safeString(act) : null))
      : [];

    const descriptions: Record<string, string> = {};
    if (item?.descriptions && typeof item.descriptions === "object") {
      Object.entries(item.descriptions).forEach(([actId, dVal]) => {
        descriptions[actId] = safeString(dVal);
      });
    }

    validRawStudentEx.push({
      studentId,
      ...(item?.semester ? { semester: safeString(item.semester) } : {}),
      assignedActivities,
      descriptions,
    });
  });
  const studentExtracurriculars = normalizeExtrasSingleSemester(validRawStudentEx, settings.semester).studentExtracurriculars;

  // --- 8. SANITIZE SUBJECTS (MATA PELAJARAN) ---
  const rawSubjects = Array.isArray(rawPayload.subjects) ? rawPayload.subjects : [];
  const subjects: any[] = [];

  const existingMap = new Map<string, any>();
  subjectsInSystem.forEach((s) => existingMap.set(s.id, { ...s }));

  rawSubjects.forEach((s: any) => {
    const sId = safeString(s?.id);
    if (!sId) return;

    const matched = existingMap.get(sId);
    const cleanSubj = {
      id: sId,
      fullName: safeString(s?.fullName || s?.namaLengkap || s?.namaMataPelajaran || matched?.fullName || sId),
      label: safeString(s?.label || s?.singkatan || matched?.label || sId),
      active: s?.active === true || String(s?.active).toLowerCase() === "aktif" || String(s?.active).toLowerCase() === "true",
      curriculumKey: safeString(s?.curriculumKey || s?.kunciKurikulum || matched?.curriculumKey || s?.fullName || sId),
    };

    subjects.push(cleanSubj);
    existingMap.delete(sId);
  });

  existingMap.forEach((missingSubj) => {
    subjects.push({
      ...missingSubj,
      active: false,
    });
    logRepair(`Mengembalikan mata pelajaran default yang absen dari berkas impor: "${missingSubj.fullName}"`);
  });

  // --- 9. SANITIZE EXTRACURRICULARS (MASTER LIST) ---
  const rawExList = Array.isArray(rawPayload.extracurriculars) ? rawPayload.extracurriculars : [];
  const extracurriculars: any[] = [];

  rawExList.forEach((e: any) => {
    const eId = safeString(e?.id);
    if (!eId) return;

    extracurriculars.push({
      id: eId,
      name: safeString(e?.name || e?.nama || eId),
      active: e?.active === true || String(e?.active).toLowerCase() === "aktif" || String(e?.active).toLowerCase() === "true",
    });
  });

  // --- 10. SANITIZE LEARNING OBJECTIVES (TUJUAN PEMBELAJARAN, UNIFIED) ---
  const rawLO = rawPayload.learningObjectives || {};
  const learningObjectives: Record<string, any> = {};

  Object.entries(rawLO).forEach(([gradeKey, valMap]: [string, any]) => {
    if (!valMap || typeof valMap !== "object") return;

    const sanitizedSubjMap: Record<string, any[]> = {};
    Object.entries(valMap).forEach(([subjName, loArray]) => {
      if (!Array.isArray(loArray)) return;

      const cleanArray = loArray
        .map((lo: any, lIdx: number) => {
          const slmId = safeString(lo?.slmId);
          const name = safeString(lo?.name || `${subjName} SLM`);
          const text = safeString(lo?.text);
          if (!text) return null;

          return {
            slmId: slmId !== "" ? slmId : `slm_${Date.now()}_${lIdx}`,
            name,
            text,
            isEdited: lo?.isEdited === true || lo?.isEdited === "true",
          };
        })
        .filter(Boolean);

      if (cleanArray.length > 0) {
        sanitizedSubjMap[subjName] = cleanArray;
      }
    });

    if (Object.keys(sanitizedSubjMap).length > 0) {
      learningObjectives[gradeKey] = sanitizedSubjMap;
    }
  });

  // --- 11. SANITIZE FORMATIVE JOURNAL (UNIFIED) ---
  const rawFJ = rawPayload.formativeJournal || {};
  const formativeJournal: Record<string, any[]> = {};

  Object.entries(rawFJ).forEach(([studentId, logsList]) => {
    if (!validStudentIds.has(studentId)) {
      logSkip(`Jurnal formatif untuk siswa ID "${studentId}" diabaikan.`);
      return;
    }

    if (!Array.isArray(logsList)) return;

    const list: any[] = logsList
      .map((log: any, lIdx: number) => {
        const id = safeString(log?.id || `jf_log_${Date.now()}_${lIdx}`);
        const date = safeString(log?.date, new Date().toISOString().split("T")[0]);
        const type = safeString(log?.type, "catatan");
        const subjectId = safeString(log?.subjectId);
        const slmId = safeString(log?.slmId);
        const tpId = log?.tpId !== undefined ? safeInt(log.tpId) : null;
        const topic = safeString(log?.topic);
        const note = safeString(log?.note);
        if (!note) return null;

        return {
          id,
          date,
          type,
          subjectId,
          slmId,
          tpId,
          topic,
          note,
        };
      })
      .filter(Boolean);

    if (list.length > 0) {
      formativeJournal[studentId] = list;
    }
  });

  return {
    sanitized: {
      settings,
      students,
      grades,
      attendance,
      notes,
      cocurricularData,
      studentExtracurriculars,
      subjects,
      extracurriculars,
      learningObjectives,
      formativeJournal,
    },
    report: {
      repairedCount,
      skippedOrphanedCount,
      logs,
    },
  };
};
