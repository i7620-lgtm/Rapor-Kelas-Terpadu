import { COCURRICULAR_DIMENSIONS, initialSettings, defaultSubjects } from "../constants";

export interface ValidationReport {
  repairedCount: number;
  skippedOrphanedCount: number;
  logs: string[];
}

/**
 * Safe conversion helpers to avoid corrupting our state with undefined, NaN, or raw nulls.
 */
const safeString = (val: any, fallback = ""): string => {
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

const safeNumber = (val: any, fallback: number | null = null): number | null => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

const safeInt = (val: any, fallback: number | null = null): number | null => {
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
  const settings: any = { ...initialSettings };

  // Core scalar settings - dynamically include all initialSettings keys to avoid future out-of-sync omissions, plus explicit/legacy aliases
  const stringKeys = [
    ...Object.keys(initialSettings),
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
    "piagam_nomor_prefix",
    "piagam_nama_kegiatan",
    "piagam_tanggal_cetak",
  ];

  stringKeys.forEach((key) => {
    if (rawSettings[key] !== undefined) {
      settings[key] = safeString(rawSettings[key]);
    }
  });

  // Handle compatibility alias assignments
  if (rawSettings.kodepos !== undefined && (rawSettings.kode_pos === undefined || rawSettings.kode_pos === '')) {
    settings.kode_pos = safeString(rawSettings.kodepos);
  }
  if (rawSettings.kabupaten_kota !== undefined && (rawSettings.kota_kabupaten === undefined || rawSettings.kota_kabupaten === '')) {
    settings.kota_kabupaten = safeString(rawSettings.kabupaten_kota);
  }
  if (rawSettings.tanggal_ttd_rapor !== undefined && (rawSettings.tanggal_rapor === undefined || rawSettings.tanggal_rapor === '')) {
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

  // Recalculate qualitative mapping
  settings.qualitativeGradingMap = {
    SB: Math.round((predVals.a + 100) / 2),
    BSH: Math.round((predVals.b + predVals.a - 1) / 2),
    MB: Math.round((predVals.c + predVals.b - 1) / 2),
    BB: Math.round((0 + predVals.c - 1) / 2),
  };

  // Grade Calculations sanitization
  settings.gradeCalculation = {};
  if (rawSettings.gradeCalculation && typeof rawSettings.gradeCalculation === "object") {
    Object.entries(rawSettings.gradeCalculation).forEach(([subId, calcObj]: [string, any]) => {
      const method = safeString(calcObj?.method, "rata-rata");
      const cleanWeights: Record<string, number> = {};
      if (calcObj?.weights && typeof calcObj.weights === "object") {
        Object.entries(calcObj.weights).forEach(([wKey, wVal]) => {
          const wNum = safeNumber(wVal, 0) || 0;
          cleanWeights[wKey] = Math.max(0, wNum);
        });
      }
      settings.gradeCalculation[subId] = {
        method: ["rata-rata", "bobot"].includes(method) ? method : "rata-rata",
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
  const booleanKeys = [
    "show_photo",
    "show_nip_kepsek",
    "show_nis_cover",
    "show_nisn_cover",
    "show_alamat_cover",
    "show_rt_rw",
    "use_clean_piagam_text",
  ];
  booleanKeys.forEach((key) => {
    if (rawSettings[key] !== undefined) {
      settings[key] = rawSettings[key] === true || String(rawSettings[key]).toLowerCase() === "true";
    }
  });


  // --- 2. SANITIZE STUDENTS ---
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

    // Standardize all keys to avoid errors with undefined fields in UI
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
      foto: safeString(student?.foto),
    };

    students.push(sanitizedStudent);
    validStudentIds.add(cleanId);
  });


  // --- 3. SANITIZE GRADES ---
  const rawGrades = Array.isArray(rawPayload.grades) ? rawPayload.grades : [];
  const grades: any[] = [];

  rawGrades.forEach((g: any) => {
    const studentId = safeString(g?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data nilai untuk siswa ID "${studentId}" diabaikan karena siswa tidak terdaftar.`);
      return;
    }

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

        const descriptions = subGrades.descriptions || {};
        const descriptionsGenap = subGrades.descriptions_Genap || {};

        detailedGrades[subjectId] = {
          slm: cleanSlm,
          sts1: safeGradeVal(subGrades.sts1),
          sts2: safeGradeVal(subGrades.sts2),
          sas1: safeGradeVal(subGrades.sas1),
          sas2: safeGradeVal(subGrades.sas2),
          descriptions: {
            highest: safeString(descriptions.highest),
            lowest: safeString(descriptions.lowest),
          },
          descriptions_Genap: {
            highest: safeString(descriptionsGenap.highest),
            lowest: safeString(descriptionsGenap.lowest),
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

  // Ensure all students have a entry in grades array
  students.forEach((s) => {
    if (!grades.some((g) => g.studentId === s.id)) {
      grades.push({
        studentId: s.id,
        detailedGrades: {},
        finalGrades: {},
      });
    }
  });


  // --- 4. SANITIZE ATTENDANCE ---
  const rawAttendance = Array.isArray(rawPayload.attendance) ? rawPayload.attendance : [];
  const attendance: any[] = [];

  rawAttendance.forEach((item: any) => {
    const studentId = safeString(item?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data kehadiran untuk siswa ID "${studentId}" diabaikan.`);
      return;
    }

    const semester = safeString(item?.semester, settings.semester);
    const cleanSakit = safeInt(item?.sakit);
    const cleanIzin = safeInt(item?.izin);
    const cleanAlpa = safeInt(item?.alpa);

    attendance.push({
      studentId,
      semester: ["Ganjil", "Genap"].includes(semester) ? semester : settings.semester,
      sakit: cleanSakit === null ? null : Math.max(0, cleanSakit),
      izin: cleanIzin === null ? null : Math.max(0, cleanIzin),
      alpa: cleanAlpa === null ? null : Math.max(0, cleanAlpa),
    });
  });


  // --- 5. SANITIZE NOTES (CATATAN WALI KELAS) ---
  const rawNotes = rawPayload.notes || {};
  const notes: Record<string, string> = {};

  Object.entries(rawNotes).forEach(([key, val]) => {
    // Keys are studentId or studentId_Genap
    const rawStudentId = key.endsWith("_Genap") ? key.replace("_Genap", "") : key;
    if (validStudentIds.has(rawStudentId)) {
      notes[key] = safeString(val);
    } else {
      logSkip(`Catatan untuk siswa ID "${rawStudentId}" diabaikan.`);
    }
  });


  // --- 6. SANITIZE COCURRICULAR DATA ---
  const rawCocurricular = rawPayload.cocurricularData || {};
  const cocurricularData: Record<string, any> = {};

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

    cocurricularData[studentId] = {};
    if (Object.keys(cleanRatings).length > 0) {
      cocurricularData[studentId].dimensionRatings = cleanRatings;
    }
    if (Object.keys(cleanRatingsGenap).length > 0) {
      cocurricularData[studentId].dimensionRatings_Genap = cleanRatingsGenap;
    }
  });


  // --- 7. SANITIZE STUDENT EXTRACURRICULARS ---
  const rawStudentEx = Array.isArray(rawPayload.studentExtracurriculars) ? rawPayload.studentExtracurriculars : [];
  const studentExtracurriculars: any[] = [];

  rawStudentEx.forEach((item: any) => {
    const studentId = safeString(item?.studentId);
    if (!validStudentIds.has(studentId)) {
      logSkip(`Data ekstrakurikuler siswa ID "${studentId}" diabaikan.`);
      return;
    }

    const semester = safeString(item?.semester, settings.semester);
    const assignedActivities = Array.isArray(item?.assignedActivities)
      ? item.assignedActivities.map((act: any) => (act ? safeString(act) : null))
      : [];

    const descriptions: Record<string, string> = {};
    if (item?.descriptions && typeof item.descriptions === "object") {
      Object.entries(item.descriptions).forEach(([actId, dVal]) => {
        descriptions[actId] = safeString(dVal);
      });
    }

    studentExtracurriculars.push({
      studentId,
      semester: ["Ganjil", "Genap"].includes(semester) ? semester : settings.semester,
      assignedActivities,
      descriptions,
    });
  });


  // --- 8. SANITIZE SUBJECTS (MATA PELAJARAN) ---
  const rawSubjects = Array.isArray(rawPayload.subjects) ? rawPayload.subjects : [];
  const subjects: any[] = [];

  // Initialize with initial defaults and overwrite if valid custom properties exist
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
    existingMap.delete(sId); // to track missing subjects
  });

  // Append default missing subjects to avoid empty state or UI breaks
  existingMap.forEach((missingSubj) => {
    subjects.push({
      ...missingSubj,
      active: false, // Default to inactive if it was deleted or missing from sheet
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


  // --- 10. SANITIZE LEARNING OBJECTIVES (TUJUAN PEMBELAJARAN) ---
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
          if (!text) return null; // skip completely empty descriptors

          return {
            slmId: slmId !== "" ? slmId : `slm_${Date.now()}_${lIdx}`,
            name,
            text,
            isEdited: lo?.isEdited === true || lo?.isEdited === "true",
            semester: ["Ganjil", "Genap"].includes(lo?.semester) ? lo.semester : settings.semester,
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


  // --- 11. SANITIZE FORMATIVE JOURNAL ---
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
          semester: ["Ganjil", "Genap"].includes(log?.semester) ? log.semester : settings.semester,
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
