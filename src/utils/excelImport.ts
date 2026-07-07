import * as XLSX from 'xlsx';
import { defaultSubjects, initialSettings, COCURRICULAR_DIMENSIONS } from '../constants';
import { getGradeNumber } from './nilaiHelpers';
import { calculateFinalGrade } from './gradeCalculations';
import { sanitizeGrades, sanitizeNotes, sanitizeAttendance, sanitizeStudentExtracurriculars, sanitizeCocurricularData, sanitizeLearningObjectives, sanitizeFormativeJournal, sanitizeSettings } from "./excelSanitize";

export const parseExcelBlob = async (blob, predefinedCurriculum) => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const workbook = XLSX.read(await blob.arrayBuffer());
        let news = { ...initialSettings }, nStud = [], nAtt = [], nNot = {}, nStEx = [], nCo = {}, nGr = [], nSub = [...defaultSubjects], nEx = [], nLO = {}, nFJ = {};
        
        const findSheet = (names) => { for (const name of names) { const found = workbook.SheetNames.find(sn => sn.toLowerCase().trim() === name.toLowerCase() || sn.toLowerCase().trim() === name.toLowerCase().replace(/\s/g, "_")); if (found) return workbook.Sheets[found]; } return null; };

        const getValueWithAliases = (row: any, aliases: string[]): string => {
            if (!row || typeof row !== "object") return "";
            for (const alias of aliases) {
                if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
                    return String(row[alias]).trim();
                }
            }
            const keys = Object.keys(row);
            for (const alias of aliases) {
                const normalizedAlias = alias.toLowerCase().replace(/[\s_-]/g, "");
                for (const key of keys) {
                    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, "");
                    if (normalizedKey === normalizedAlias && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
                        return String(row[key]).trim();
                    }
                }
            }
            return "";
        };
        
        const rStoreSheet = workbook.Sheets["_DataStore"];
        if (rStoreSheet) {
             const storeData = XLSX.utils.sheet_to_json(rStoreSheet, { header: 1 });
             let parsedMap = {};
             let hasValidSignature = false;
             
             for (const r of storeData.slice(1)) {
                  try {
                      const key = r[0];
                      if (key === 'appSignature') {
                          const jsonStr = r.slice(1).join("");
                          const parsed = jsonStr.startsWith('"') ? JSON.parse(jsonStr) : jsonStr;
                          if (parsed === "RKT_SECURE_EXPORT_v1") {
                              hasValidSignature = true;
                          }
                      } else if (key && ['appSettings', 'appStudents', 'appGrades', 'appAttendance', 'appExtracurriculars', 'appStudentExtracurriculars', 'appNotes', 'appCocurricularData', 'appSubjects', 'appLearningObjectives', 'appFormativeJournal'].includes(key)) {
                          const jsonStr = r.slice(1).join("");
                          parsedMap[key] = JSON.parse(jsonStr);
                      }
                  } catch (e) {
                      console.warn(e);
                  }
             }

             if (!hasValidSignature && !parsedMap['appSettings'] && !parsedMap['appStudents']) {
                 throw new Error("File tidak valid atau termodifikasi. Tanda tangan keamanan tidak ditemukan.");
             }
            
             let loadedSettings = parsedMap['appSettings'] || initialSettings;
             const activeSemester = loadedSettings.semester || "Ganjil";
             const sd = parsedMap['appStudents'] || [];
             const gd = parsedMap['appGrades'] || [];
             const ad = parsedMap['appAttendance'] || [];
             const se = parsedMap['appStudentExtracurriculars'] || [];
             const no = parsedMap['appNotes'] || {};
             const co = parsedMap['appCocurricularData'] || {};
             const su = parsedMap['appSubjects'] || defaultSubjects;
             const ex = parsedMap['appExtracurriculars'] || [];
             const lo = parsedMap['appLearningObjectives'] || {};
             const fj = parsedMap['appFormativeJournal'] || {};

             return {
                 settings: sanitizeSettings(loadedSettings, activeSemester),
                 students: sd,
                 grades: sanitizeGrades(gd, activeSemester, lo, loadedSettings.nama_kelas, su),
                 attendance: sanitizeAttendance(ad, activeSemester),
                 studentExtracurriculars: sanitizeStudentExtracurriculars(se, activeSemester),
                 notes: sanitizeNotes(no, activeSemester),
                 cocurricularData: sanitizeCocurricularData(co, activeSemester),
                 subjects: su,
                 extracurriculars: ex,
                 learningObjectives: sanitizeLearningObjectives(lo, activeSemester),
                 formativeJournal: sanitizeFormativeJournal(fj, activeSemester)
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
        const wsMapel = findSheet(["Mata Pelajaran", "Mata_Pelajaran"]);
        if (wsMapel) {
            const rawMapel = XLSX.utils.sheet_to_json(wsMapel);
            nSub = defaultSubjects.map(ds => {
                const found = rawMapel.find(r =>
                    getValueWithAliases(r, ['.', 'ID', 'ID Unik', 'ID_Unik', 'id_mapel']) === ds.id
                );
                if (found) {
                    const status = getValueWithAliases(found, ['Status Aktif', 'Status', 'status_aktif']);
                    return {
                        ...ds,
                        active: status === 'Aktif',
                        curriculumKey: getValueWithAliases(found, ['Kunci Kurikulum', 'Kunci_Kurikulum']) || ds.fullName
                    };
                }
                return ds;
            });
            rawMapel.forEach(r => {
                const id = getValueWithAliases(r, ['.', 'ID', 'ID Unik', 'ID_Unik', 'id_mapel']);
                if (id && !defaultSubjects.some(ds => ds.id === id)) {
                    const status = getValueWithAliases(r, ['Status Aktif', 'Status', 'status_aktif']);
                    nSub.push({
                        id,
                        fullName: getValueWithAliases(r, ['Nama Lengkap', 'Nama Mata Pelajaran', 'Nama', 'nama_lengkap']),
                        label: getValueWithAliases(r, ['Singkatan', 'Label', 'singkatan']),
                        active: status === 'Aktif',
                        curriculumKey: getValueWithAliases(r, ['Kunci Kurikulum', 'Kunci_Kurikulum']) || getValueWithAliases(r, ['Nama Lengkap', 'Nama Mata Pelajaran', 'Nama'])
                    });
                }
            });
        }
        const wsP = findSheet(["Pengaturan", "Settings", "Info Sekolah", "Kunci Pengaturan Nilai", "Pengaturan Nilai"]);
        if (wsP) {
            const data = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            data.forEach(r => {
                if (r[0] && r[0] !== 'ID Mata Pelajaran') { 
                    let key = String(r[0]).trim();
                    if (key === 'cocurricular_theme_Ganjil') key = 'cocurricular_theme';

                    const oldFormatKeyMap: Record<string, string> = {
                        "Nama Dinas Pendidikan": "nama_dinas_pendidikan",
                        "Nama Sekolah": "nama_sekolah",
                        "NPSN": "npsn",
                        "Alamat Sekolah": "alamat_sekolah",
                        "Desa/Kelurahan": "desa_kelurahan",
                        "Kecamatan": "kecamatan",
                        "Kota/Kabupaten": "kota_kabupaten",
                        "Provinsi": "provinsi",
                        "Kode Pos": "kode_pos",
                        "Email Sekolah": "email_sekolah",
                        "Email": "email_sekolah",
                        "Telepon Sekolah": "telepon_sekolah",
                        "Telepon": "telepon_sekolah",
                        "Website Sekolah": "website_sekolah",
                        "Website": "website_sekolah",
                        "Faksimile": "faksimile",
                        "Faks": "faksimile",
                        "Nama Kelas": "nama_kelas",
                        "Tahun Ajaran": "tahun_ajaran",
                        "Semester": "semester",
                        "Tempat, Tanggal Rapor": "tanggal_rapor",
                        "Nama Kepala Sekolah": "nama_kepala_sekolah",
                        "NIP Kepala Sekolah": "nip_kepala_sekolah",
                        "Label NIP Kepala Sekolah": "nip_label_kepala_sekolah",
                        "Nama Wali Kelas": "nama_wali_kelas",
                        "NIP Wali Kelas": "nip_wali_kelas",
                        "Label NIP Wali Kelas": "nip_label_wali_kelas",
                        "Tema Kokurikuler": "cocurricular_theme",
                        "cocurricular_theme_Genap": "cocurricular_theme_Genap",
                        "Format Version": "format_version",
                        "nama_kep": "nama_kepala_sekolah",
                        "nip_kepala": "nip_kepala_sekolah",
                        "nama_wal": "nama_wali_kelas",
                        "nip_wali_k": "nip_wali_kelas",
                        "nama_kepala_sekolah": "nama_kepala_sekolah",
                        "nip_kepala_sekolah": "nip_kepala_sekolah",
                        "nama_wali_kelas": "nama_wali_kelas",
                        "nip_wali_kelas": "nip_wali_kelas",
                    };
                    
                    if (oldFormatKeyMap[key]) {
                        key = oldFormatKeyMap[key];
                    }

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
                        const imageKeys = ['logoSistem', 'ttdKepsek', 'ttdKepsek_Genap', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
                        if (imageKeys.includes(key) && assetMap[key]) {
                            // Do not overwrite valid image keys from Aset Gambar with potentially truncated Pengaturan sheet values.
                        } else if (typeof initialSettings[key] === 'boolean') {
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
        const wsEkstraDef = findSheet(["Ekstrakurikuler", "Ekstra"]);
        if (wsEkstraDef) {
            nEx = XLSX.utils.sheet_to_json(wsEkstraDef).map(r => {
                const id = getValueWithAliases(r, ['ID Unik (Jangan Diubah)', 'ID Unik', 'ID', 'id_ekstrakurikuler', 'id_ekstra']);
                const name = getValueWithAliases(r, ['Nama Ekstrakurikuler', 'Nama', 'nama_ekstrakurikuler', 'nama_ekstra']);
                const status = getValueWithAliases(r, ['Status Aktif', 'Status', 'status_aktif']);
                return {
                    id,
                    name,
                    active: status === 'Aktif'
                };
            });
        }
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
        if (wsS) {
            nStud = XLSX.utils.sheet_to_json(wsS).map((s: any, idx) => {
                const sid = String(
                    s['ID Siswa (Otomatis)'] || 
                    s['ID Siswa'] || 
                    s['ID'] || 
                    s['id'] || 
                    s['Id'] || 
                    `s_${Date.now()}_${idx}`
                );
                return {
                    id: sid,
                    foto: fotoSiswaMap[sid] || '',
                    namaLengkap: getValueWithAliases(s, ["Nama Lengkap", "Nama", "Nama Siswa", "nama_lengkap", "nama_siswa", "full name", "student name", "fullName", "studentName"]),
                    namaPanggilan: getValueWithAliases(s, ["Nama Panggilan", "Panggilan", "nama_panggilan", "nick name", "nickname"]),
                    nis: getValueWithAliases(s, ["NIS", "NIS Siswa", "Nomor Induk Siswa", "no induk", "no_induk", "nis_siswa", "induk"]),
                    nisn: getValueWithAliases(s, ["NISN", "Nomor Induk Siswa Nasional", "nisn_siswa", "Nisn"]),
                    ttl: getValueWithAliases(s, ["Tempat, Tanggal Lahir", "TTL", "Tempat/Tanggal Lahir", "tempat_tanggal_lahir", "birthplace", "birthday", "Place of birth", "Tempat Tanggal Lahir"]),
                    jenisKelamin: getValueWithAliases(s, ["Jenis Kelamin", "JK", "Kelamin", "Gender", "sex", "jenis_kelamin", "L/P"]),
                    agama: getValueWithAliases(s, ["Agama", "Religion"]),
                    asalTk: getValueWithAliases(s, ["Asal TK", "TK", "asal_tk", "kindergarten"]),
                    alamatSiswa: getValueWithAliases(s, ["Alamat Siswa", "Alamat", "alamat_siswa", "address"]),
                    diterimaDiKelas: getValueWithAliases(s, ["Diterima di Kelas", "Kelas Diterima", "diterima_di_kelas", "entry class"]),
                    diterimaTanggal: getValueWithAliases(s, ["Diterima Tanggal", "Tanggal Diterima", "diterima_tanggal", "entry date"]),
                    namaAyah: getValueWithAliases(s, ["Nama Ayah", "Ayah", "nama_ayah", "father", "father name", "father_name"]),
                    namaIbu: getValueWithAliases(s, ["Nama Ibu", "Ibu", "nama_ibu", "mother", "mother name", "mother_name"]),
                    pekerjaanAyah: getValueWithAliases(s, ["Pekerjaan Ayah", "pekerjaan_ayah", "father occupation"]),
                    pekerjaanIbu: getValueWithAliases(s, ["Pekerjaan Ibu", "pekerjaan_ibu", "mother occupation"]),
                    alamatOrangTua: getValueWithAliases(s, ["Alamat Orang Tua", "alamat_orang_tua", "parent address"]),
                    teleponOrangTua: getValueWithAliases(s, ["Telepon Orang Tua", "No Telp Ortu", "telp_ortu", "telepon_orang_tua", "parent phone"]),
                    namaWali: getValueWithAliases(s, ["Nama Wali", "Wali", "nama_wali", "guardian", "guardian name"]),
                    pekerjaanWali: getValueWithAliases(s, ["Pekerjaan Wali", "pekerjaan_wali", "guardian occupation"]),
                    alamatWali: getValueWithAliases(s, ["Alamat Wali", "alamat_wali", "guardian address"]),
                    teleponWali: getValueWithAliases(s, ["Telepon Wali", "No Telp Wali", "telepon_wali", "guardian phone"])
                };
            });
        }
        const wsTP = findSheet(["Tujuan Pembelajaran", "Tujuan_Pembelajaran"]);
        if (wsTP) {
            const tpData = XLSX.utils.sheet_to_json(wsTP);
            const gradeKey = `Kelas ${getGradeNumber(news.nama_kelas) || '?'}`;
            nLO[gradeKey] = {};
            tpData.forEach(row => {
                const subjName = getValueWithAliases(row, ['Nama Mata Pelajaran', 'Mata Pelajaran', 'ID Mata Pelajaran', 'ID MataPelajaran', 'Mata_Pelajaran', 'Mapel']);
                const slmId = getValueWithAliases(row, ['ID SLM', 'SLM ID', 'id_slm', 'slm_id', 'ID_SLM']);
                const slmName = getValueWithAliases(row, ['Nama SLM', 'SLM Name', 'nama_slm', 'Nama_SLM']);
                const desc = getValueWithAliases(row, ['Deskripsi Tujuan Pembelajaran (TP)', 'Deskripsi TP', 'Deskripsi Tujuan Pembelajaran', 'Deskripsi', 'deskripsi_tp', 'Deskripsi_TP']);
                if (subjName) {
                    if (!nLO[gradeKey][subjName]) nLO[gradeKey][subjName] = [];
                    nLO[gradeKey][subjName].push({
                        slmId,
                        text: desc,
                        name: slmName,
                        isEdited: true,
                        semester: getValueWithAliases(row, ['Semester', 'semester']) || news.semester || 'Ganjil'
                    });
                }
            });
        }
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
            attendance: sanitizeAttendance(nAtt, news.semester),
            notes: sanitizeNotes(nNot, news.semester),
            studentExtracurriculars: sanitizeStudentExtracurriculars(nStEx, news.semester),
            cocurricularData: sanitizeCocurricularData(nCo, news.semester),
            grades: sanitizeGrades(nGr, news.semester, nLO, news.nama_kelas, nSub),
            subjects: nSub,
            extracurriculars: nEx,
            learningObjectives: sanitizeLearningObjectives(nLO, news.semester),
            formativeJournal: sanitizeFormativeJournal(nFJ, news.semester)
        };
    };
