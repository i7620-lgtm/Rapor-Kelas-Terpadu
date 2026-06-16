import * as XLSX from 'xlsx';
import localforage from 'localforage';
import { chunkString } from './helpers.js';
import { defaultSubjects, initialSettings, COCURRICULAR_DIMENSIONS } from '../constants.js';
import { getGradeNumber } from '../components/DataNilaiPage.js';
import { calculateFinalGrade } from './gradeCalculations.js';

// --- Sanitization helpers ---
export const sanitizeGrades = (gradesList, semester, loList, namaKelas, subjects = []) => {
    const isGenap = semester === "Genap";
    const gradeKey = `Kelas ${getGradeNumber(namaKelas) || '5'}`;
    return (gradesList || []).map(g => {
        const newDetailedGrades = {};
        if (g.detailedGrades) {
            Object.entries(g.detailedGrades).forEach(([subId, detailed]) => {
                if (!detailed) return;

                // Only keep SLM (TP) scores that belong to the active semester
                const subj = subjects.find(s => s.id === subId);
                const curriculumKey = subj ? (subj.curriculumKey || subj.fullName) : subId;
                const activeObjectives = loList?.[gradeKey]?.[curriculumKey] || [];
                const activeSlmIds = new Set(
                    activeObjectives
                        .filter(obj => (obj.semester || "Ganjil").toLowerCase().trim() === semester.toLowerCase().trim())
                        .map(obj => obj.slmId)
                        .filter(Boolean)
                );

                const filteredSlm = (detailed.slm || []).filter(slm => slm.id && activeSlmIds.has(slm.id));

                const newDet = {
                    ...detailed,
                    slm: filteredSlm,
                };

                if (isGenap) {
                    newDet.sts1 = null;
                    newDet.sas1 = null;
                    delete newDet.descriptions;
                } else {
                    newDet.sts2 = null;
                    newDet.sas2 = null;
                    delete newDet.descriptions_Genap;
                }
                newDetailedGrades[subId] = newDet;
            });
        }
        return {
            ...g,
            detailedGrades: newDetailedGrades,
            finalGrades: g.finalGrades || {}
        };
    });
};

export const sanitizeNotes = (notesData, semester) => {
    const isGenap = semester === "Genap";
    const newNotes = {};
    Object.entries(notesData || {}).forEach(([key, val]) => {
        const isNoteGenap = key.endsWith("_Genap");
        if (isGenap === isNoteGenap) {
            newNotes[key] = val;
        }
    });
    return newNotes;
};

export const sanitizeAttendance = (attendanceList, semester) => {
    return (attendanceList || []).filter(item => (item.semester || "Ganjil") === semester);
};

export const sanitizeStudentExtracurriculars = (list, semester) => {
    return (list || []).filter(item => (item.semester || "Ganjil") === semester);
};

export const sanitizeCocurricularData = (coData, semester) => {
    const isGenap = semester === "Genap";
    const newCo = {};
    Object.entries(coData || {}).forEach(([sid, data]) => {
        if (!data) return;
        const sData = { ...data };
        if (isGenap) {
            delete sData.dimensionRatings;
        } else {
            delete sData.dimensionRatings_Genap;
        }
        if (isGenap && sData.dimensionRatings_Genap) {
            newCo[sid] = sData;
        } else if (!isGenap && sData.dimensionRatings) {
            newCo[sid] = sData;
        }
    });
    return newCo;
};

export const sanitizeLearningObjectives = (lo, _semester) => {
    return lo;
};

export const sanitizeFormativeJournal = (fj, semester) => {
    const newFj = {};
    Object.entries(fj || {}).forEach(([sid, list]) => {
        if (Array.isArray(list)) {
            const filtered = list.filter(row => (row.semester || "Ganjil") === semester);
            if (filtered.length > 0) {
                newFj[sid] = filtered;
            }
        }
    });
    return newFj;
};

export const sanitizeSettings = (settings, semester) => {
    if (!settings) return settings;
    const isGenap = semester === "Genap";
    const cleaned = { ...settings };
    const isGanjil = !isGenap;

    Object.keys(cleaned).forEach(key => {
        const keyLower = key.toLowerCase();
        const hasGenap = keyLower.includes("genap") || keyLower.includes("second");
        const hasGanjil = keyLower.includes("ganjil") || keyLower.includes("first");

        if (isGanjil) {
            if (hasGenap) {
                delete cleaned[key];
            }
        } else {
            if (hasGanjil) {
                delete cleaned[key];
            }
            const ganjilImplicitKeys = ["cocurricular_theme", "kop_layout", "piagam_layout", "ttdKepsek"];
            if (ganjilImplicitKeys.includes(key)) {
                delete cleaned[key];
            }
        }
    });

    return cleaned;
};

// --- Core functions ---
export const exportToExcelBlob = async ({
    settings,
    students,
    grades,
    attendance,
    studentExtracurriculars,
    notes,
    cocurricularData = {},
    subjects = [],
    extracurriculars = [],
    learningObjectives = {},
    formativeJournal = {}
}) => {
    if (typeof XLSX === "undefined") return null;
    try {
        const wb = XLSX.utils.book_new();
        const activeSemester = settings.semester || "Ganjil";
        const isGenap = activeSemester === "Genap";

        // Sanitize everything to the active semester before building worksheets
        const cleanSettings = sanitizeSettings(settings, activeSemester);
        const cleanGrades = settings?.retainedCategories?.grades
            ? grades
            : sanitizeGrades(grades, activeSemester, learningObjectives, settings.nama_kelas, subjects);
        const cleanAttendance = settings?.retainedCategories?.attendance
            ? attendance
            : sanitizeAttendance(attendance, activeSemester);
        const cleanStudentExtracurriculars = settings?.retainedCategories?.studentExtracurriculars
            ? studentExtracurriculars
            : sanitizeStudentExtracurriculars(studentExtracurriculars, activeSemester);
        const cleanNotes = settings?.retainedCategories?.notes
            ? notes
            : sanitizeNotes(notes, activeSemester);
        const cleanCocurricularData = settings?.retainedCategories?.cocurricularData
            ? cocurricularData
            : sanitizeCocurricularData(cocurricularData, activeSemester);
        const cleanLearningObjectives = sanitizeLearningObjectives(learningObjectives, activeSemester);
        const cleanFormativeJournal = settings?.retainedCategories?.formativeJournal
            ? formativeJournal
            : sanitizeFormativeJournal(formativeJournal, activeSemester);

        // 1. Settings (Readable)
        let rSettings = [ ["Kunci Pengaturan Nilai", "Nilai"] ];
        Object.entries(cleanSettings).forEach(([k,v]) => {
           let strVal = typeof v === "object" ? JSON.stringify(v) : String(v);
           const imageKeys = ['logoSistem', 'ttdKepsek', 'ttdKepsek_Genap', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
           if (!imageKeys.includes(k)) {
               rSettings.push([k, strVal]);
           }
        });
        rSettings.push([]);
        rSettings.push(["Pengaturan Rentang Nilai (Predikat)"]);
        rSettings.push(["Predikat", "Nilai Minimum"]);
        rSettings.push(["A", cleanSettings.predikats?.a || "90"]);
        rSettings.push(["B", cleanSettings.predikats?.b || "80"]);
        rSettings.push(["C", cleanSettings.predikats?.c || "70"]);
        rSettings.push(["D", cleanSettings.predikats?.d || "0"]);
        rSettings.push([]);
        rSettings.push(["Pengaturan Cara Pengolahan Nilai Rapor"]);
        rSettings.push(["ID Mata Pelajaran", "Metode Perhitungan", "Bobot (JSON)", "SLM Visibility (JSON)"]);
        subjects.forEach(subj => {
             const calc = cleanSettings.gradeCalculation?.[subj.id] || { method: "rata-rata" };
             const weightsStr = JSON.stringify(calc.weights || {});
             const visibilityStr = JSON.stringify(cleanSettings.slmVisibility?.[subj.id] || []);
             rSettings.push([subj.id, calc.method || 'rata-rata', weightsStr, visibilityStr]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rSettings), "Pengaturan");

        // 2. Mata Pelajaran
        let rMapel = [ ["ID Internal (Jangan Diubah)", "Nama Lengkap", "Singkatan", "Status Aktif", "Kunci Kurikulum"] ];
        subjects.forEach(s => {
             rMapel.push([s.id, s.fullName || "", s.label || "", s.active ? "Aktif" : "Tidak Aktif", s.curriculumKey || s.fullName || ""]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rMapel), "Mata Pelajaran");

        // 3. Ekstrakurikuler List
        let rEkstraLists = [ ["ID Unik (Jangan Diubah)", "Nama Ekstrakurikuler", "Status Aktif"] ];
        extracurriculars.forEach(e => {
             rEkstraLists.push([e.id, e.name || "", e.active ? "Aktif" : "Tidak Aktif"]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rEkstraLists), "Ekstrakurikuler");

        // 4. Siswa (Readable)
        let headersSiswa = ["ID Siswa (Otomatis)", "Nama Lengkap", "Nama Panggilan", "NIS", "NISN", "Tempat, Tanggal Lahir", "Jenis Kelamin", "Agama", "Asal TK", "Alamat Siswa", "Diterima di Kelas", "Diterima Tanggal", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Alamat Orang Tua", "Telepon Orang Tua", "Nama Wali", "Pekerjaan Wali", "Alamat Wali", "Telepon Wali"];
        let rStudents = [ headersSiswa ];
        students.forEach(s => {
             rStudents.push([s.id, s.namaLengkap||"", s.namaPanggilan||"", s.nis||"", s.nisn||"", s.ttl||"", s.jenisKelamin||"", s.agama||"", s.asalTk||"", s.alamatSiswa||"", s.diterimaDiKelas||"", s.diterimaTanggal||"", s.namaAyah||"", s.namaIbu||"", s.pekerjaanAyah||"", s.pekerjaanIbu||"", s.alamatOrangTua||"", s.teleponOrangTua||"", s.namaWali||"", s.pekerjaanWali||"", s.alamatWali||"", s.teleponWali||""]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rStudents), "Daftar Siswa");

        // 5. Tujuan Pembelajaran
        let rLO = [ ["Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Deskripsi Tujuan Pembelajaran (TP)", "Semester"] ];
        if (cleanLearningObjectives) {
             Object.entries(cleanLearningObjectives).forEach(([, subMap]) => {
                  if (subMap) {
                       Object.entries(subMap).forEach(([subjName, list]) => {
                            if (Array.isArray(list)) {
                                 list.forEach(row => {
                                      const rowSem = row.semester || "Ganjil";
                                      rLO.push([
                                           subjName,
                                           row.slmId || "",
                                           row.name || (subjName + " - SLM"),
                                           row.text || "",
                                           rowSem
                                      ]);
                                 });
                            }
                       });
                  }
             });
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rLO), "Tujuan Pembelajaran");

        // 6. Nilai_<subjectId> sheets
        const activeSubjects = subjects.filter(s => s.active);
        const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || '?'}`;
        activeSubjects.forEach(subj => {
             const curriculumKey = subj.curriculumKey || subj.fullName;
             const objectives = cleanLearningObjectives?.[gradeKey]?.[curriculumKey] || [];
             
             // Detect unique slmId and max TP count for this subject
             let slmTps = {};
             students.forEach(st => {
                  const g = cleanGrades.find(x => x.studentId === st.id);
                  const detailed = g?.detailedGrades?.[subj.id];
                  if (detailed && detailed.slm) {
                       detailed.slm.forEach(slm => {
                            if (slm.id) {
                                 if (!slmTps[slm.id]) slmTps[slm.id] = 1;
                                 if (slm.scores && slm.scores.length > slmTps[slm.id]) {
                                      slmTps[slm.id] = slm.scores.length;
                                 }
                            }
                       });
                  }
             });
             objectives.forEach(obj => {
                  const rowSem = obj.semester || "Ganjil";
                  if (rowSem.toLowerCase().trim() === activeSemester.toLowerCase().trim()) {
                       if (obj.slmId) {
                            if (!slmTps[obj.slmId]) slmTps[obj.slmId] = 1;
                       }
                  }
             });

             // Build header columns
             let headers = ["ID Siswa", "Nama Siswa"];
             Object.keys(slmTps).forEach(slmId => {
                  for (let i = 1; i <= slmTps[slmId]; i++) {
                       headers.push(`${slmId}_TP${i}`);
                  }
             });
             headers.push("STS", "SAS", "Deskripsi Tinggi", "Deskripsi Rendah");

             let rGrMapel = [ headers ];
             students.forEach(st => {
                  const g = cleanGrades.find(x => x.studentId === st.id);
                  const detailed = g?.detailedGrades?.[subj.id];
                  
                  let rData = [st.id, st.namaLengkap || ""];
                  Object.keys(slmTps).forEach(slmId => {
                       const slmObj = detailed?.slm?.find(s => s.id === slmId);
                       for (let i = 0; i < slmTps[slmId]; i++) {
                            rData.push(slmObj && slmObj.scores && slmObj.scores[i] !== undefined ? slmObj.scores[i] : "");
                       }
                  });
                  if (isGenap) {
                       rData.push(
                            detailed?.sts2 !== undefined && detailed?.sts2 !== null ? detailed.sts2 : "",
                            detailed?.sas2 !== undefined && detailed?.sas2 !== null ? detailed.sas2 : "",
                            detailed?.descriptions_Genap?.highest || "",
                            detailed?.descriptions_Genap?.lowest || ""
                       );
                  } else {
                       rData.push(
                            detailed?.sts1 !== undefined && detailed?.sts1 !== null ? detailed.sts1 : "",
                            detailed?.sas1 !== undefined && detailed?.sas1 !== null ? detailed.sas1 : "",
                            detailed?.descriptions?.highest || "",
                            detailed?.descriptions?.lowest || ""
                       );
                  }
                  rGrMapel.push(rData);
             });
             XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rGrMapel), "Nilai_" + subj.id);
        });

        // 7. Absensi (Readable)
        let rAbsensi = [ ["ID Siswa", "Nama Siswa", "Sakit", "Izin", "Alpa"] ];
        cleanAttendance.forEach(a => {
             const studentName = students.find(s => s.id === a.studentId)?.namaLengkap || "";
             rAbsensi.push([a.studentId, studentName, a.sakit != null ? Number(a.sakit) : "", a.izin != null ? Number(a.izin) : "", a.alpa != null ? Number(a.alpa) : ""]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rAbsensi), "Absensi");

        // 8. Data Ekstra
        let rDE = [ ["ID Siswa", "Nama Siswa", "Urutan Ekstra", "ID Ekstrakurikuler", "Deskripsi"] ];
        cleanStudentExtracurriculars.forEach(se => {
             const studentName = students.find(s => s.id === se.studentId)?.namaLengkap || "";
             if (Array.isArray(se.assignedActivities)) {
                  se.assignedActivities.forEach((actId, idx) => {
                       if (actId) {
                            const desc = se.descriptions?.[actId] || "";
                            rDE.push([se.studentId, studentName, idx + 1, actId, desc]);
                       }
                  });
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rDE), "Data Ekstra");

        // 9. Data Kokurikuler
        let rKo = [ ["ID Siswa", "Nama Siswa", ...COCURRICULAR_DIMENSIONS.map(d => d.id), "Deskripsi Manual"] ];
        Object.entries(cleanCocurricularData || {}).forEach(([sid, data]) => {
             const studentName = students.find(s => s.id === sid)?.namaLengkap || "";
             if (isGenap) {
                  if (data.dimensionRatings_Genap) {
                       let rowGenap = [sid, studentName];
                       COCURRICULAR_DIMENSIONS.forEach(dim => {
                            rowGenap.push(data.dimensionRatings_Genap[dim.id] || "");
                       });
                       rowGenap.push(data.dimensionRatings_Genap.manualDescription || "");
                       rKo.push(rowGenap);
                  }
             } else {
                  if (data.dimensionRatings) {
                       let rowGanjil = [sid, studentName];
                       COCURRICULAR_DIMENSIONS.forEach(dim => {
                            rowGanjil.push(data.dimensionRatings[dim.id] || "");
                       });
                       rowGanjil.push(data.dimensionRatings.manualDescription || "");
                       rKo.push(rowGanjil);
                  }
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rKo), "Data Kokurikuler");

        // 10. Catatan Wali Kelas
        let rCat = [ ["ID Siswa", "Nama Siswa", "Catatan Wali Kelas"] ];
        Object.entries(cleanNotes || {}).forEach(([sid, note]) => {
             const studentName = students.find(s => s.id === sid)?.namaLengkap || "";
             rCat.push([sid, studentName, note]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rCat), "Catatan Wali Kelas");

        // 11. Jurnal Formatif
        let rJF = [ ["ID Siswa", "Nama Siswa", "ID Catatan", "Tanggal", "Tipe", "Mapel ID", "SLM ID", "TP ID", "Topik", "Isi Catatan"] ];
        Object.entries(cleanFormativeJournal || {}).forEach(([sid, list]) => {
              const studentName = students.find(s => s.id === sid)?.namaLengkap || "";
              if (Array.isArray(list)) {
                   list.forEach(jf => {
                        rJF.push([
                             sid,
                             studentName,
                             jf.id || "",
                             jf.date || "",
                             jf.type || "",
                             jf.subjectId || "",
                             jf.slmId || "",
                             jf.tpId !== undefined ? jf.tpId : "",
                             jf.topic || "",
                             jf.note || ""
                        ]);
                   });
              }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rJF), "Jurnal Formatif");

        // 12. Foto Siswa
        let rFoto = [ ["ID Siswa", "Part Index", "Base64 Chunk"] ];
        students.forEach(st => {
             if (st.foto) {
                  const chunks = chunkString(st.foto, 30000);
                  chunks.forEach((chunk, idx) => {
                       rFoto.push([st.id, idx, chunk]);
                  });
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rFoto), "Foto Siswa");

        // 13. Aset Gambar
        let rAset = [ ["Kunci Aset_part_idx", "Base64 Chunk"] ];
        const imageKeys = ['logoSistem', 'ttdKepsek', 'ttdKepsek_Genap', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
        imageKeys.forEach(key => {
             if (cleanSettings[key]) {
                  const chunks = chunkString(cleanSettings[key], 30000);
                  chunks.forEach((chunk, idx) => {
                       rAset.push([`${key}_part_${idx}`, chunk]);
                  });
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rAset), "Aset Gambar");

        // System _DataStore (fallback & deep active-semester only states)
        let rStore = [ ["StoreKey", "JSONDataChunks..."] ];
        const storeMapping = {
            appSettings: cleanSettings,
            appStudents: students,
            appGrades: cleanGrades,
            appAttendance: cleanAttendance,
            appStudentExtracurriculars: cleanStudentExtracurriculars,
            appNotes: cleanNotes,
            appCocurricularData: cleanCocurricularData,
            appSubjects: subjects,
            appExtracurriculars: extracurriculars,
            appLearningObjectives: cleanLearningObjectives,
            appFormativeJournal: cleanFormativeJournal
        };
        Object.entries(storeMapping).forEach(([storeKey, val]) => {
             if (val !== null && val !== undefined) {
                 const jsonStr = JSON.stringify(val);
                 const chunks = chunkString(jsonStr, 30000);
                 rStore.push([storeKey, ...chunks]);
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rStore), "_DataStore");

        return new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/octet-stream" });
    } catch (e) {
        console.error("Export Error:", e);
        return null;
    }
  };

export const parseExcelBlob = async (blob, predefinedCurriculum) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        let news = { ...initialSettings }, nStud = [], nAtt = [], nNot = {}, nStEx = [], nCo = {}, nGr = [], nSub = [...defaultSubjects], nEx = [], nLO = {}, nFJ = {};
        
        const findSheet = (names) => { for (const name of names) { const found = workbook.SheetNames.find(sn => sn.toLowerCase().trim() === name.toLowerCase() || sn.toLowerCase().trim() === name.toLowerCase().replace(/\s/g, "_")); if (found) return workbook.Sheets[found]; } return null; };
        
        const rStoreSheet = workbook.Sheets["_DataStore"];
        if (rStoreSheet) {
             const storeData = XLSX.utils.sheet_to_json(rStoreSheet, { header: 1 });
             for (const r of storeData.slice(1)) {
                  try {
                      const key = r[0];
                      if (key && ['appSettings', 'appStudents', 'appGrades', 'appAttendance', 'appExtracurriculars', 'appStudentExtracurriculars', 'appNotes', 'appCocurricularData', 'appSubjects', 'appLearningObjectives', 'appFormativeJournal'].includes(key)) {
                          const jsonStr = r.slice(1).join("");
                          const parsed = JSON.parse(jsonStr);
                          await localforage.setItem(key, parsed);
                      }
                  } catch (e) {
                      console.warn(e);
                  }
             }
            
             let loadedSettings = await localforage.getItem("appSettings") || initialSettings;
             const activeSemester = loadedSettings.semester || "Ganjil";
             const sd = await localforage.getItem("appStudents") || [];
             const gd = await localforage.getItem("appGrades") || [];
             const ad = await localforage.getItem("appAttendance") || [];
             const se = await localforage.getItem("appStudentExtracurriculars") || [];
             const no = await localforage.getItem("appNotes") || {};
             const co = await localforage.getItem("appCocurricularData") || {};
             const su = await localforage.getItem("appSubjects") || defaultSubjects;
             const ex = await localforage.getItem("appExtracurriculars") || [];
             const lo = await localforage.getItem("appLearningObjectives") || {};
             const fj = await localforage.getItem("appFormativeJournal") || {};

             return {
                 settings: sanitizeSettings(loadedSettings, activeSemester),
                 students: sd,
                 grades: loadedSettings?.retainedCategories?.grades ? gd : sanitizeGrades(gd, activeSemester, lo, loadedSettings.nama_kelas, su),
                 attendance: loadedSettings?.retainedCategories?.attendance ? ad : sanitizeAttendance(ad, activeSemester),
                 studentExtracurriculars: loadedSettings?.retainedCategories?.studentExtracurriculars ? se : sanitizeStudentExtracurriculars(se, activeSemester),
                 notes: loadedSettings?.retainedCategories?.notes ? no : sanitizeNotes(no, activeSemester),
                 cocurricularData: loadedSettings?.retainedCategories?.cocurricularData ? co : sanitizeCocurricularData(co, activeSemester),
                 subjects: su,
                 extracurriculars: ex,
                 learningObjectives: sanitizeLearningObjectives(lo, activeSemester),
                 formativeJournal: loadedSettings?.retainedCategories?.formativeJournal ? fj : sanitizeFormativeJournal(fj, activeSemester)
             };
        }

        const wsAset = findSheet(["Aset Gambar", "Images", "Assets"]);
        const assetMap = {};
        if (wsAset) {
            const assetData = XLSX.utils.sheet_to_json(wsAset, { header: 1 });
            const chunksByKey = {};
            assetData.forEach(row => { const keyPart = row[0], data = row[1]; if (keyPart && data) { const match = keyPart.match(/^(.*)_part_(\d+)$/); if (match) { const realKey = match[1], idx = parseInt(match[2], 10); if (!chunksByKey[realKey]) chunksByKey[realKey] = []; chunksByKey[realKey][idx] = data; } } });
            Object.entries(chunksByKey).forEach(([key, chunks]) => { assetMap[key] = chunks.join(''); });
        }
        const wsMapel = findSheet(["Mata Pelajaran"]);
        if (wsMapel) { const rawMapel = XLSX.utils.sheet_to_json(wsMapel); nSub = defaultSubjects.map(ds => { const found = rawMapel.find(r => r['.'] === ds.id || r['ID'] === ds.id); if (found) return { ...ds, active: found['Status Aktif'] === 'Aktif', curriculumKey: found['Kunci Kurikulum'] || ds.fullName }; return ds; }); rawMapel.forEach(r => { const id = r['.'] || r['ID']; if (id && !defaultSubjects.some(ds => ds.id === id)) nSub.push({ id, fullName: r['Nama Lengkap'] || r['Nama Mata Pelajaran'] || id, label: r['Singkatan'] || id, active: r['Status Aktif'] === 'Aktif', curriculumKey: r['Kunci Kurikulum'] || r['Nama Lengkap'] }); }); }
        const wsP = findSheet(["Pengaturan", "Settings", "Info Sekolah"]);
        if (wsP) {
            const data = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            data.forEach(r => {
                if (r[0] && r[0] !== 'ID Mata Pelajaran') { 
                    let key = String(r[0]);
                    if (key === 'cocurricular_theme_Ganjil') key = 'cocurricular_theme';
                    if (['__proto__', 'constructor', 'prototype'].includes(key)) return;
                    
                    if (['A', 'B', 'C', 'D'].includes(key.toUpperCase())) {
                        news.predikats[key.toLowerCase()] = String(r[1]); 
                    } else if (key === 'kop_layout' || key === 'piagam_layout' || key === 'kop_layout_Genap' || key === 'piagam_layout_Genap' || key === 'appLock') {
                        try {
                            news[key] = typeof r[1] === 'string' ? JSON.parse(r[1]) : r[1];
                        } catch (e) {
                            console.warn(`Failed parsing ${key}`, e);
                            news[key] = key === 'appLock' ? { enabled: false, pin: '', hint: '', securityQuestion: '', securityAnswer: '' } : [];
                        }
                    } else if (key in news) {
                        if (typeof initialSettings[key] === 'boolean') {
                            news[key] = r[1] === 'true' || r[1] === true;
                        } else {
                            news[key] = r[1] !== undefined ? r[1] : ''; 
                        }
                    }
                }
                const subjectId = r[0]; if (nSub.some(ds => ds.id === subjectId)) { try { const weights = r[2] ? JSON.parse(r[2]) : {}, visibility = r[3] ? JSON.parse(r[3]) : []; if (!news.gradeCalculation) news.gradeCalculation = {}; news.gradeCalculation[subjectId] = { method: r[1] || 'rata-rata', weights }; if (!news.slmVisibility) news.slmVisibility = {}; news.slmVisibility[subjectId] = visibility; } catch (e) { console.warn("Failed parsing config for", subjectId, e); } }
            });
            
            // Recalculate qualitativeGradingMap based on imported predikats
            const valA = parseInt(news.predikats.a, 10);
            const valB = parseInt(news.predikats.b, 10);
            const valC = parseInt(news.predikats.c, 10);
            if (!isNaN(valA) && !isNaN(valB) && !isNaN(valC)) {
                news.qualitativeGradingMap = {
                    SB: Math.round((valA + 100) / 2),
                    BSH: Math.round((valB + valA - 1) / 2),
                    MB: Math.round((valC + valB - 1) / 2),
                    BB: Math.round((0 + valC - 1) / 2),
                };
            }
            
            news = { ...news, ...assetMap };
        }
        const wsEkstraDef = findSheet(["Ekstrakurikuler"]);
        if (wsEkstraDef) nEx = XLSX.utils.sheet_to_json(wsEkstraDef).map(r => ({ id: r['ID Unik (Jangan Diubah)'], name: r['Nama Ekstrakurikuler'], active: r['Status Aktif'] === 'Aktif' }));
        const wsFoto = findSheet(["Foto Siswa"]);
        const fotoSiswaMap = {};
        if (wsFoto) {
            const fotoData = XLSX.utils.sheet_to_json(wsFoto, { header: 1 });
            const chunksById = {};
            fotoData.forEach(row => {
                const idSiswa = row[0] ? String(row[0]) : '';
                const partIdx = parseInt(row[1], 10);
                const data = row[2];
                if (idSiswa && idSiswa !== 'ID Siswa' && data) {
                    if (!chunksById[idSiswa]) chunksById[idSiswa] = [];
                    chunksById[idSiswa][partIdx] = data;
                }
            });
            Object.entries(chunksById).forEach(([id, chunks]) => {
                fotoSiswaMap[id] = chunks.join('');
            });
        }
        const wsS = findSheet(["Daftar Siswa", "Students", "Siswa", "Data Siswa"]);
        if (wsS) nStud = XLSX.utils.sheet_to_json(wsS).map((s, idx) => {
            const sid = String(s['ID Siswa (Otomatis)'] || s['ID Siswa'] || s['ID'] || `s_${Date.now()}_${idx}`);
            return {
                id: sid,
                foto: fotoSiswaMap[sid] || '',
                namaLengkap: s['Nama Lengkap'] != null ? String(s['Nama Lengkap']) : '',
                namaPanggilan: s['Nama Panggilan'] != null ? String(s['Nama Panggilan']) : '',
                nis: s['NIS'] != null ? String(s['NIS']) : '',
                nisn: s['NISN'] != null ? String(s['NISN']) : '',
                ttl: s['Tempat, Tanggal Lahir'] != null ? String(s['Tempat, Tanggal Lahir']) : '',
                jenisKelamin: s['Jenis Kelamin'] != null ? String(s['Jenis Kelamin']) : '',
                agama: s['Agama'] != null ? String(s['Agama']) : '',
                asalTk: s['Asal TK'] != null ? String(s['Asal TK']) : '',
                alamatSiswa: s['Alamat Siswa'] != null ? String(s['Alamat Siswa']) : '',
                diterimaDiKelas: s['Diterima di Kelas'] != null ? String(s['Diterima di Kelas']) : '',
                diterimaTanggal: s['Diterima Tanggal'] != null ? String(s['Diterima Tanggal']) : '',
                namaAyah: s['Nama Ayah'] != null ? String(s['Nama Ayah']) : '',
                namaIbu: s['Nama Ibu'] != null ? String(s['Nama Ibu']) : '',
                pekerjaanAyah: s['Pekerjaan Ayah'] != null ? String(s['Pekerjaan Ayah']) : '',
                pekerjaanIbu: s['Pekerjaan Ibu'] != null ? String(s['Pekerjaan Ibu']) : '',
                alamatOrangTua: s['Alamat Orang Tua'] != null ? String(s['Alamat Orang Tua']) : '',
                teleponOrangTua: s['Telepon Orang Tua'] != null ? String(s['Telepon Orang Tua']) : '',
                namaWali: s['Nama Wali'] != null ? String(s['Nama Wali']) : '',
                pekerjaanWali: s['Pekerjaan Wali'] != null ? String(s['Pekerjaan Wali']) : '',
                alamatWali: s['Alamat Wali'] != null ? String(s['Alamat Wali']) : '',
                teleponWali: s['Telepon Wali'] != null ? String(s['Telepon Wali']) : ''
            };
        });
        const wsTP = findSheet(["Tujuan Pembelajaran"]);
        if (wsTP) { const tpData = XLSX.utils.sheet_to_json(wsTP); const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '?'}`; nLO[gradeKey] = {}; tpData.forEach(row => { const subjName = row['Nama Mata Pelajaran'], slmId = row['ID SLM'], slmName = row['Nama SLM']; if (subjName) { if (!nLO[gradeKey][subjName]) nLO[gradeKey][subjName] = []; nLO[gradeKey][subjName].push({ slmId, text: row['Deskripsi Tujuan Pembelajaran (TP)'], name: slmName, isEdited: true, semester: row['Semester'] || news.semester || 'Ganjil' }); } }); }
        nGr = nStud.map(st => ({ studentId: st.id, detailedGrades: {}, finalGrades: {} }));
        workbook.SheetNames.forEach(name => { 
            if (name.startsWith("Nilai_")) { 
                const subIdRaw = name.split('_')[1]; 
                let subId = subIdRaw; 
                if (subId === 'Blng' && !nSub.some(s => s.id === 'Blng') && nSub.some(s => s.id === 'BIng')) subId = 'BIng'; 
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]); 
                rows.forEach(row => { 
                    const sid = String(row['ID Siswa'] || row['ID'] || row['a'] || '').trim(); 
                    let entry = nGr.find(g => g.studentId === sid); 
                    if (!entry) entry = nGr.find(g => g.studentId === 'student' + sid); 
                    if (!entry) entry = nGr.find(g => g.studentId.endsWith(sid) || sid.endsWith(g.studentId)); 
                    if (entry) { 
                        if (!entry.detailedGrades[subId]) {
                            entry.detailedGrades[subId] = { 
                                slm: [], 
                                sts1: null,
                                sts2: null,
                                sas1: null,
                                sas2: null,
                                descriptions: { highest: '', lowest: '' },
                                descriptions_Genap: { highest: '', lowest: '' } 
                            };
                        }
                        const detailed = entry.detailedGrades[subId];
                        
                        const isImportGenap = news.semester === "Genap";

                        // Handle explicit columns
                        if (row['STS 1 (Ganjil)'] !== undefined) detailed.sts1 = row['STS 1 (Ganjil)'];
                        if (row['SAS 1 (Ganjil)'] !== undefined) detailed.sas1 = row['SAS 1 (Ganjil)'];
                        if (row['STS 2 (Genap)'] !== undefined) detailed.sts2 = row['STS 2 (Genap)'];
                        if (row['SAS 2 (Genap)'] !== undefined) detailed.sas2 = row['SAS 2 (Genap)'];

                        // Handle plain semester-specific "STS" / "SAS"
                        if (row['STS'] !== undefined) {
                            if (isImportGenap) detailed.sts2 = row['STS'];
                            else detailed.sts1 = row['STS'];
                        }
                        if (row['SAS'] !== undefined) {
                            if (isImportGenap) detailed.sas2 = row['SAS'];
                            else detailed.sas1 = row['SAS'];
                        }

                        // Handle plain semester-specific descriptions
                        if (row['Deskripsi Tinggi'] !== undefined) {
                            if (isImportGenap) {
                                if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                                detailed.descriptions_Genap.highest = row['Deskripsi Tinggi'];
                            } else {
                                if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                                detailed.descriptions.highest = row['Deskripsi Tinggi'];
                            }
                        }
                        if (row['Deskripsi Rendah'] !== undefined) {
                            if (isImportGenap) {
                                if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                                detailed.descriptions_Genap.lowest = row['Deskripsi Rendah'];
                            } else {
                                if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                                detailed.descriptions.lowest = row['Deskripsi Rendah'];
                            }
                        }

                        // Handle explicit descriptions
                        if (row['Deskripsi Tinggi (Ganjil)'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.highest = row['Deskripsi Tinggi (Ganjil)'];
                        }
                        if (row['Deskripsi Rendah (Ganjil)'] !== undefined) {
                            if (!detailed.descriptions) detailed.descriptions = { highest: '', lowest: '' };
                            detailed.descriptions.lowest = row['Deskripsi Rendah (Ganjil)'];
                        }
                        
                        if (row['Deskripsi Tinggi (Genap)'] !== undefined) {
                            if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                            detailed.descriptions_Genap.highest = row['Deskripsi Tinggi (Genap)'];
                        }
                        if (row['Deskripsi Rendah (Genap)'] !== undefined) {
                            if (!detailed.descriptions_Genap) detailed.descriptions_Genap = { highest: '', lowest: '' };
                            detailed.descriptions_Genap.lowest = row['Deskripsi Rendah (Genap)'];
                        }

                        Object.keys(row).forEach(rawH => { 
                            const h = rawH.trim(), match = h.match(/^(.*)_TP(\d+)$/); 
                            if (match) { 
                                const slmId = match[1], tpIdx = parseInt(match[2]) - 1; 
                                let slm = detailed.slm.find(s => s.id === slmId); 
                                if (!slm) { slm = { id: slmId, name: 'Lingkup Materi Kustom', scores: [] }; detailed.slm.push(slm); } 
                                slm.scores[tpIdx] = row[rawH]; 
                            } 
                        }); 
                    } 
                }); 
            } 
        });
        const wsAtt = findSheet(["Absensi"]);
        if (wsAtt) nAtt = XLSX.utils.sheet_to_json(wsAtt).map(r => ({ studentId: String(r['ID Siswa']), semester: r['Semester'] || news.semester || 'Ganjil', sakit: r['Sakit'], izin: r['Izin'], alpa: r['Alpa'] }));
        const wsDE = findSheet(["Data Ekstra"]);
        if (wsDE) { 
            const deData = XLSX.utils.sheet_to_json(wsDE), map = {}; 
            deData.forEach(row => { 
                const sid = String(row['ID Siswa']);
                const sem = row['Semester'] || news.semester || 'Ganjil';
                const key = `${sid}_${sem}`;
                if (!map[key]) map[key] = { studentId: sid, semester: sem, assignedActivities: [], descriptions: {} }; 
                const idx = (row['Urutan Ekstra'] || 1) - 1;
                const actId = row['ID Ekstrakurikuler'];
                const desc = row['Deskripsi'];
                map[key].assignedActivities[idx] = actId; 
                if (actId) map[key].descriptions[actId] = desc; 
            }); 
            nStEx = Object.values(map); 
        }
        const wsKo = findSheet(["Data Kokurikuler"]);
        if (wsKo) { 
            const koData = XLSX.utils.sheet_to_json(wsKo); 
            koData.forEach(row => { 
                const sid = String(row['ID Siswa']);
                const sem = row['Semester'] || news.semester || 'Ganjil';
                const fieldName = sem === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
                if (!nCo[sid]) nCo[sid] = {};
                const ratings = nCo[sid][fieldName] || {};
                COCURRICULAR_DIMENSIONS.forEach(dim => { 
                    if (row[dim.id] || row[dim.label]) ratings[dim.id] = row[dim.id] || row[dim.label]; 
                }); 
                if (row['Deskripsi Manual'] !== undefined) {
                    ratings.manualDescription = row['Deskripsi Manual'];
                }
                nCo[sid][fieldName] = ratings;
            }); 
        }
        const wsCat = findSheet(["Catatan Wali Kelas"]);
        if (wsCat) XLSX.utils.sheet_to_json(wsCat).forEach(row => { 
            const sid = String(row['ID Siswa']); 
            const sem = row['Semester'] || news.semester || 'Ganjil';
            const key = sem === 'Genap' ? `${sid}_Genap` : sid;
            nNot[key] = row['Catatan Wali Kelas'] || row['Catatan']; 
        });
        const wsJF = findSheet(["Jurnal Formatif"]);
        if (wsJF) { const jfData = XLSX.utils.sheet_to_json(wsJF); jfData.forEach(row => { const sid = String(row['ID Siswa']); if (!nFJ[sid]) nFJ[sid] = []; nFJ[sid].push({ id: row['ID Catatan'] || Date.now(), date: row['Tanggal'], type: row['Tipe'], subjectId: row['Mapel ID'], slmId: row['SLM ID'], tpId: row['TP ID'], topic: row['Topik'], note: row['Isi Catatan'], semester: row['Semester'] || news.semester || 'Ganjil' }); }); }
        nGr.forEach(studentGrade => { nSub.forEach(subj => { 
            const detailed = studentGrade.detailedGrades[subj.id]; 
            if (detailed) {
                const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '5'}`;
                const curriculumKey = subj.curriculumKey || subj.fullName;
                studentGrade.finalGrades[subj.id] = calculateFinalGrade(detailed, news.gradeCalculation?.[subj.id] || { method: 'rata-rata' }, news, subj.id, nLO, gradeKey, curriculumKey, predefinedCurriculum);
            }
        }); });

        return {
            settings: sanitizeSettings(news, news.semester),
            students: nStud,
            attendance: news?.retainedCategories?.attendance ? nAtt : sanitizeAttendance(nAtt, news.semester),
            notes: news?.retainedCategories?.notes ? nNot : sanitizeNotes(nNot, news.semester),
            studentExtracurriculars: news?.retainedCategories?.studentExtracurriculars ? nStEx : sanitizeStudentExtracurriculars(nStEx, news.semester),
            cocurricularData: news?.retainedCategories?.cocurricularData ? nCo : sanitizeCocurricularData(nCo, news.semester),
            grades: news?.retainedCategories?.grades ? nGr : sanitizeGrades(nGr, news.semester, nLO, news.nama_kelas, nSub),
            subjects: nSub,
            extracurriculars: nEx,
            learningObjectives: sanitizeLearningObjectives(nLO, news.semester),
            formativeJournal: news?.retainedCategories?.formativeJournal ? nFJ : sanitizeFormativeJournal(nFJ, news.semester)
        };
    };
