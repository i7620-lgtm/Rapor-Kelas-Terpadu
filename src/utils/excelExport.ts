import * as XLSX from 'xlsx';
import { chunkString } from './helpers';
import { COCURRICULAR_DIMENSIONS } from '../constants';
import { getGradeNumber } from './nilaiHelpers';

import { sanitizeGrades, sanitizeNotes, sanitizeAttendance, sanitizeStudentExtracurriculars, sanitizeCocurricularData, sanitizeLearningObjectives, sanitizeFormativeJournal, sanitizeSettings } from "./excelSanitize";
export const exportToExcelBlob = async ({
    settings,
    students,
    studentPhotos = {},
    grades,
    attendance,
    studentExtracurriculars,
    notes,
    cocurricularData = {},
    subjects = [],
    extracurriculars = [],
    learningObjectives = {},
    formativeJournal = {}
}: any) => {
    if (typeof XLSX === "undefined") return null;
    try {
        const wb = XLSX.utils.book_new();
        const activeSemester = settings.semester || "Ganjil";
        const isGenap = activeSemester === "Genap";

         const cleanSettings = sanitizeSettings(settings, activeSemester);
         const cleanGrades = sanitizeGrades(grades, activeSemester, learningObjectives, settings.nama_kelas, subjects);
         const cleanAttendance = sanitizeAttendance(attendance, activeSemester);
         const cleanStudentExtracurriculars = sanitizeStudentExtracurriculars(studentExtracurriculars, activeSemester);
         const cleanNotes = sanitizeNotes(notes, activeSemester);
         const cleanCocurricularData = sanitizeCocurricularData(cocurricularData, activeSemester);
         const cleanLearningObjectives = sanitizeLearningObjectives(learningObjectives, activeSemester);
         const cleanFormativeJournal = sanitizeFormativeJournal(formativeJournal, activeSemester);

         const studentNameMap = new Map<string, string>();
         (students || []).forEach((s: any) => {
           if (s?.id) studentNameMap.set(String(s.id), s.namaLengkap || "");
         });
         const cleanGradeMap = new Map<string, any>();
         (cleanGrades || []).forEach((g: any) => {
           if (g?.studentId) cleanGradeMap.set(String(g.studentId), g);
         });

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
        let rLO = [ ["Nama Mata Pelajaran", "ID SLM", "Nama SLM", "Deskripsi Tujuan Pembelajaran (TP)"] ];
        if (cleanLearningObjectives) {
             Object.entries(cleanLearningObjectives).forEach(([, subMap]) => {
                  if (subMap) {
                       Object.entries(subMap).forEach(([subjName, list]) => {
                            if (Array.isArray(list)) {
                                 list.forEach(row => {
                                      rLO.push([
                                           subjName,
                                           row.slmId || "",
                                           row.name || (subjName + " - SLM"),
                                           row.text || ""
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
        const gradeKey = `Kelas ${getGradeNumber(settings.nama_kelas) || '6'}`;
        activeSubjects.forEach(subj => {
             const curriculumKey = subj.curriculumKey || subj.fullName;
             const objectives = cleanLearningObjectives?.[gradeKey]?.[curriculumKey] || [];
             
             // Detect unique slmId and max TP count for this subject
             let slmTps = {};
             students.forEach(st => {
                  const g = cleanGradeMap.get(String(st.id));
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
                  if (obj.slmId) {
                       if (!slmTps[obj.slmId]) slmTps[obj.slmId] = 1;
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
                  const g = cleanGradeMap.get(String(st.id));
                  const detailed = g?.detailedGrades?.[subj.id];
                  
                  let rData = [st.id, st.namaLengkap || ""];
                  Object.keys(slmTps).forEach(slmId => {
                       const slmObj = detailed?.slm?.find(s => s.id === slmId);
                       for (let i = 0; i < slmTps[slmId]; i++) {
                            rData.push(slmObj && slmObj.scores && slmObj.scores[i] !== undefined ? slmObj.scores[i] : "");
                       }
                  });
                  const stsVal = detailed?.sts !== undefined ? detailed.sts : (isGenap ? detailed?.sts2 : detailed?.sts1);
                  const sasVal = detailed?.sas !== undefined ? detailed.sas : (isGenap ? detailed?.sas2 : detailed?.sas1);
                  const descObj = detailed?.descriptions || (isGenap ? detailed?.descriptions_Genap : undefined);
                  rData.push(
                       stsVal !== undefined && stsVal !== null ? stsVal : "",
                       sasVal !== undefined && sasVal !== null ? sasVal : "",
                       descObj?.highest || "",
                       descObj?.lowest || ""
                  );
                  rGrMapel.push(rData);
             });
             XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rGrMapel), "Nilai_" + subj.id);
        });

        // 7. Absensi (Readable)
        let rAbsensi = [ ["ID Siswa", "Nama Siswa", "Sakit", "Izin", "Alpa"] ];
        cleanAttendance.forEach(a => {
             const studentName = studentNameMap.get(String(a.studentId)) || "";
             rAbsensi.push([a.studentId, studentName, a.sakit != null ? Number(a.sakit) : "", a.izin != null ? Number(a.izin) : "", a.alpa != null ? Number(a.alpa) : ""]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rAbsensi), "Absensi");

        // 8. Data Ekstra
        let rDE = [ ["ID Siswa", "Nama Siswa", "Urutan Ekstra", "ID Ekstrakurikuler", "Deskripsi"] ];
        cleanStudentExtracurriculars.forEach(se => {
             const studentName = studentNameMap.get(String(se.studentId)) || "";
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
        Object.entries(cleanCocurricularData || {}).forEach(([sid, data]: [string, any]) => {
             const studentName = studentNameMap.get(String(sid)) || "";
             const ratings = data?.dimensionRatings || data?.dimensionRatings_Genap;
             if (ratings) {
                  let row = [sid, studentName];
                  COCURRICULAR_DIMENSIONS.forEach(dim => {
                       row.push(ratings[dim.id] || "");
                  });
                  row.push(ratings.manualDescription || "");
                  rKo.push(row);
             }
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rKo), "Data Kokurikuler");

        // 10. Catatan Wali Kelas
        let rCat = [ ["ID Siswa", "Nama Siswa", "Catatan Wali Kelas"] ];
        Object.entries(cleanNotes || {}).forEach(([sid, note]) => {
             const studentName = studentNameMap.get(String(sid)) || "";
             rCat.push([sid, studentName, note]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rCat), "Catatan Wali Kelas");

        // 11. Jurnal Formatif
        let rJF = [ ["ID Siswa", "Nama Siswa", "ID Catatan", "Tanggal", "Tipe", "Mapel ID", "SLM ID", "TP ID", "Topik", "Isi Catatan"] ];
        Object.entries(cleanFormativeJournal || {}).forEach(([sid, list]) => {
              const studentName = studentNameMap.get(String(sid)) || "";
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
             const fotoData = (studentPhotos && studentPhotos[st.id]) || st.foto;
             if (fotoData && typeof fotoData === 'string' && !fotoData.startsWith('blob:')) {
                  const chunks = chunkString(fotoData, 30000);
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
        const cleanStudentsForStore = students.map((st: any) => {
            if (!st || !st.foto) return st;
            const copy = { ...st };
            delete copy.foto;
            return copy;
        });
        let rStore = [ ["StoreKey", "JSONDataChunks..."] ];
        const storeMapping = {
            appSignature: "RKT_SECURE_EXPORT_v1",
            appSettings: cleanSettings,
            appStudents: cleanStudentsForStore,
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

