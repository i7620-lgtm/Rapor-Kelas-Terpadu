import * as XLSX from 'xlsx';
import { chunkString } from './helpers';
import { COCURRICULAR_DIMENSIONS } from '../constants';
import { getGradeNumber } from './nilaiHelpers';

import { sanitizeGrades, sanitizeNotes, sanitizeAttendance, sanitizeStudentExtracurriculars, sanitizeCocurricularData, sanitizeLearningObjectives, sanitizeFormativeJournal, sanitizeSettings } from "./excelSanitize";
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

         const cleanSettings = sanitizeSettings(settings, activeSemester);
         const cleanGrades = sanitizeGrades(grades, activeSemester, learningObjectives, settings.nama_kelas, subjects);
         const cleanAttendance = sanitizeAttendance(attendance, activeSemester);
         const cleanStudentExtracurriculars = sanitizeStudentExtracurriculars(studentExtracurriculars, activeSemester);
         const cleanNotes = sanitizeNotes(notes, activeSemester);
         const cleanCocurricularData = sanitizeCocurricularData(cocurricularData, activeSemester);
         const cleanLearningObjectives = sanitizeLearningObjectives(learningObjectives, activeSemester);
         const cleanFormativeJournal = sanitizeFormativeJournal(formativeJournal, activeSemester);

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
            appSignature: "RKT_SECURE_EXPORT_v1",
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

