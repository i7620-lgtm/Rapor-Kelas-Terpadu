import React, { useState, useMemo } from 'react';

const getGradeNumber = (str) => {
    if (!str) return null;
    const match = str.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    const upperStr = str.toUpperCase();
    if (upperStr.includes('VI')) return 6;
    if (upperStr.includes('V')) return 5;
    if (upperStr.includes('IV')) return 4;
    if (upperStr.includes('III')) return 3;
    if (upperStr.includes('II')) return 2;
    if (upperStr.includes('I')) return 1;
    return null;
};

const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === '') return '-';
    try {
        const date = new Date(dateString);
        // add timezone offset to prevent off-by-one day errors
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        
        return adjustedDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const lowercaseFirst = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};


const generateDescription = (student, subject, gradeData, learningObjectives, settings) => {
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);
    const defaultReturn = { highest: `Ananda ${studentName} telah mencapai tujuan pembelajaran.`, lowest: '' };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) {
        return { highest: "Nama kelas belum diatur.", lowest: "" };
    }
    
    let objectivesForCurrentClass = null;
    for (const key in learningObjectives) {
        if (getGradeNumber(key) === currentGradeNumber) {
            objectivesForCurrentClass = learningObjectives[key];
            break;
        }
    }

    const objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
    if (!objectivesForSubject || objectivesForSubject.length === 0) {
        return { highest: "Tujuan Pembelajaran belum diisi.", lowest: "" };
    }

    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    const gradedTps = objectivesForSubject
        .map((text, index) => ({ text, score: detailedGrade?.tp?.[index] }))
        .filter(tp => typeof tp.score === 'number' && tp.score !== null);
    
    if (gradedTps.length === 0) {
        return { highest: "Nilai TP belum diisi.", lowest: "" };
    }
    
    if (gradedTps.length === 1) {
        return { highest: `Ananda ${studentName} menunjukkan penguasaan yang baik dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' };
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        return { 
            highest: `Ananda ${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        };
    } else {
        let maxScore = -1;
        let minScore = 101;
        scores.forEach(s => {
            if (s > maxScore) maxScore = s;
            if (s < minScore) minScore = s;
        });
        
        const highestTp = gradedTps.find(tp => tp.score === maxScore);
        const lowestTp = gradedTps.find(tp => tp.score === minScore);
        
        if (highestTp && lowestTp) {
            return { 
                highest: `Ananda ${studentName} menunjukkan penguasaan yang sangat baik dalam ${lowercaseFirst(highestTp.text)}.`,
                lowest: `Ananda ${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
            };
        }
    }

    return { highest: "Tidak dapat membuat deskripsi.", lowest: "" };
};

const CoverPage = ({ student, settings }) => (
    React.createElement('div', { className: 'h-full flex flex-col justify-between items-center text-center p-4 report-cover-border' },
        React.createElement('div', null),
        React.createElement('div', { className: 'w-full' },
            React.createElement('div', { className: 'flex justify-center mb-8' },
                React.createElement('img', { 
                    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Lambang_Pendidikan_Dasar_dan_Menengah_TUT_WURI_HANDAYANI.svg/2048px-Lambang_Pendidikan_Dasar_dan_Menengah_TUT_WURI_HANDAYANI.svg.png', 
                    alt: "Logo Tut Wuri Handayani", 
                    className: 'h-36 w-36 object-contain' 
                })
            ),
            React.createElement('h1', { className: 'text-2xl font-bold tracking-widest mt-8' }, 'RAPOR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'PESERTA DIDIK'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'SEKOLAH DASAR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, '(SD)'),

            React.createElement('div', { className: 'mt-24 w-full px-8' },
                React.createElement('p', { className: 'text-sm' }, 'Nama Peserta Didik:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-xl font-bold' }, (student.namaLengkap || 'NAMA SISWA').toUpperCase())
                ),
                React.createElement('p', { className: 'text-sm mt-4' }, 'NISN/NIS:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-xl font-bold' }, `${student.nisn || '-'} / ${student.nis || '-'}`)
                )
            )
        ),
        React.createElement('div', { className: 'mb-8 text-sm' },
            React.createElement('p', { className: 'font-bold' }, 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,'),
            React.createElement('p', { className: 'font-bold' }, 'RISET, DAN TEKNOLOGI'),
            React.createElement('p', { className: 'font-bold' }, 'REPUBLIK INDONESIA')
        )
    )
);

const SchoolIdentityPage = ({ settings }) => {
     const identitasSekolah = [
        { label: "Nama Sekolah", value: settings.nama_sekolah },
        { label: "NPSN", value: settings.npsn },
        { label: "NIS/NSS/NDS", value: '-'},
        { label: "Alamat Sekolah", value: settings.alamat_sekolah},
        { sub: [
            { label: 'Kelurahan/Desa', value: settings.desa_kelurahan },
            { label: 'Kecamatan', value: settings.kecamatan },
            { label: 'Kabupaten/Kota', value: settings.kota_kabupaten },
            { label: 'Provinsi', value: settings.provinsi },
            { label: 'Website', value: settings.website_sekolah },
            { label: 'E-mail', value: settings.email_sekolah },
            { label: 'Kode Pos', value: settings.kode_pos, telp: settings.telepon_sekolah },
        ]}
    ];

    return(
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('div', { className: 'text-center font-bold mb-16 space-y-1', style: { fontSize: '14pt' } },
                React.createElement('h2', null, 'RAPOR'),
                React.createElement('h2', null, 'PESERTA DIDIK'),
                React.createElement('h2', null, 'SEKOLAH DASAR (SD)')
            ),
             React.createElement('table', { className: 'w-full' },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement(React.Fragment, { key: index },
                            React.createElement('tr', { className: 'align-top' },
                                React.createElement('td', { className: 'w-1/3 py-1' }, item.label),
                                React.createElement('td', { className: 'w-2/3 py-1' }, item.value ? `: ${item.value}` : '')
                            ),
                            item.sub && item.sub.map((subItem, subIndex) => (
                                    React.createElement('tr', { key: subIndex, className: 'align-top' },
                                    React.createElement('td', { className: 'pl-6' }, subItem.label),
                                    React.createElement('td', null, `: ${subItem.value || '-'}`, subItem.telp ? ` Telp. ${subItem.telp}` : '')
                                )
                            ))
                        )
                    ))
                )
            )
        )
    );
};

const StudentIdentityPage = ({ student, settings }) => {
    const identitasSiswa = [
        { label: 'Nama Peserta Didik', value: (student.namaLengkap || '').toUpperCase() },
        { label: 'NISN/NIS', value: `${student.nisn || '-'} / ${student.nis || '-'}` },
        { label: 'Tempat, Tanggal Lahir', value: `${student.tempatLahir || ''}, ${formatDate(student.tanggalLahir)}` },
        { label: 'Jenis Kelamin', value: student.jenisKelamin },
        { label: 'Agama', value: student.agama },
        { label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { label: 'Alamat Peserta Didik', value: student.alamatSiswa },
        { label: 'Nama Orang Tua', sub: [
            { label: 'a. Ayah', value: student.namaAyah },
            { label: 'b. Ibu', value: student.namaIbu },
        ]},
        { label: 'Pekerjaan Orang Tua', sub: [
            { label: 'a. Ayah', value: student.pekerjaanAyah },
            { label: 'b. Ibu', value: student.pekerjaanIbu },
        ]},
        { label: 'Alamat Orang Tua', value: student.alamatOrangTua },
        { label: 'Wali Peserta Didik', sub: [
            { label: 'a. Nama', value: student.namaWali },
            { label: 'b. Pekerjaan', value: student.pekerjaanWali },
            { label: 'c. Alamat', value: student.alamatWali },
        ]},
    ];
    
    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-8', style: { fontSize: '14pt' } }, 'IDENTITAS PESERTA DIDIK'),
            React.createElement('div', { className: 'space-y-4' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('tbody', null,
                        identitasSiswa.map((item, index) => (
                             React.createElement(React.Fragment, { key: index },
                                React.createElement('tr', { className: 'align-top' },
                                    React.createElement('td', { className: 'w-1/3 py-1' }, item.label),
                                    React.createElement('td', { className: 'w-2/3 py-1' }, item.value ? `: ${item.value}` : ':')
                                ),
                                item.sub && item.sub.map((subItem, subIndex) => (
                                     React.createElement('tr', { key: subIndex, className: 'align-top' },
                                        React.createElement('td', { className: 'pl-4' }, subItem.label),
                                        React.createElement('td', null, `: ${subItem.value || '-'}`)
                                    )
                                ))
                            )
                        ))
                    )
                ),
                React.createElement('div', { className: 'flex justify-between items-end pt-10' },
                    React.createElement('div', { className: 'w-32 h-40 border-2 flex items-center justify-center text-slate-400' }, 'Pas Foto 3x4'),
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('p', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`),
                        React.createElement('p', null, 'Kepala Sekolah,'),
                        React.createElement('div', { className: 'h-20' }),
                        React.createElement('p', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'),
                        React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                    )
                )
            )
        )
    );
};

const AcademicReportPage = ({ student, settings, grades, subjects, learningObjectives }) => {
    const gradeData = grades.find(g => g.studentId === student.id);

    const reportSubjects = useMemo(() => {
        const result = [];
        const processedGroups = new Set();
        const allActiveSubjects = subjects.filter(s => s.active);
        
        const groupConfigs = {
            'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
                const studentReligion = student.agama?.trim().toLowerCase();
                const representative = groupSubjects.find(s => {
                    const match = s.fullName.match(/\(([^)]+)\)/);
                    return match && match[1].trim().toLowerCase() === studentReligion;
                });
                return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
            },
            'Seni Budaya': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects.find(s => s.fullName.includes("Seni Rupa")) || groupSubjects[0];
                return chosen ? { subject: chosen, name: `Seni (Pilihan)` } : null;
            },
            'Muatan Lokal': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
                 const match = chosen.fullName.match(/\(([^)]+)\)/);
                 return chosen ? { subject: chosen, name: `Muatan Lokal (${match ? match[1] : ''})` } : null;
            }
        };

        Object.keys(groupConfigs).forEach(groupName => {
            if (processedGroups.has(groupName)) return;
            const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
            if (groupSubjects.length > 0) {
                const config = groupConfigs[groupName](groupSubjects);
                if (config) {
                     const grade = gradeData?.finalGrades?.[config.subject.id];
                     const description = generateDescription(student, config.subject, gradeData, learningObjectives, settings);
                     result.push({ id: config.subject.id, name: config.name, grade: grade, description: description });
                }
                processedGroups.add(groupName);
            }
        });
        
        allActiveSubjects.forEach(subject => {
            const isGrouped = Object.keys(groupConfigs).some(groupName => subject.fullName.startsWith(groupName));
            if (!isGrouped) {
                const grade = gradeData?.finalGrades?.[subject.id];
                const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                result.push({ id: subject.id, name: subject.fullName, grade: grade, description: description });
            }
        });

        const sortOrder = [
            'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 
            'Ilmu Pengetahuan Alam dan Sosial', 'Seni (Pilihan)', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 
            'Bahasa Inggris', 'Muatan Lokal'
        ];
        result.sort((a,b) => {
            const aIndex = sortOrder.findIndex(item => a.name.startsWith(item));
            const bIndex = sortOrder.findIndex(item => b.name.startsWith(item));
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });

        return result;
    }, [student, subjects, gradeData, learningObjectives, settings]);

    return (
        React.createElement('div', { className: 'font-times' },
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '14pt' } }, 'LAPORAN HASIL BELAJAR (RAPOR)'),
            React.createElement('table', { className: 'w-full mb-4', style: { fontSize: '12pt' } },
                React.createElement('tbody', null,
                    React.createElement('tr', null,
                        React.createElement('td', { className: 'w-[20%]' }, 'Nama Peserta Didik'), React.createElement('td', { className: 'w-[45%]' }, `: ${(student.namaLengkap || '').toUpperCase()}`),
                        React.createElement('td', { className: 'w-[15%]' }, 'Kelas'), React.createElement('td', { className: 'w-[20%]' }, `: ${settings.nama_kelas || ''}`)
                    ),
                    React.createElement('tr', null,
                        React.createElement('td', null, 'NISN/NIS'), React.createElement('td', null, `: ${student.nisn || '-'} / ${student.nis || '-'}`),
                        React.createElement('td', null, 'Fase'), React.createElement('td', null, `: C`) // Hardcoded as per example
                    ),
                     React.createElement('tr', null,
                        React.createElement('td', null, 'Nama Sekolah'), React.createElement('td', null, `: ${settings.nama_sekolah || ''}`),
                        React.createElement('td', null, 'Semester'), React.createElement('td', null, `: ${settings.semester ? `${settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)'}`: '2'}`)
                    ),
                    React.createElement('tr', null,
                        React.createElement('td', null, 'Alamat Sekolah'), React.createElement('td', null, `: ${settings.alamat_sekolah || ''}`),
                        React.createElement('td', null, 'Tahun Pelajaran'), React.createElement('td', null, `: ${settings.tahun_ajaran || ''}`)
                    )
                )
            ),
            React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-2', style: { fontSize: '11pt' } },
                React.createElement('thead', null,
                    React.createElement('tr', { className: 'font-bold text-center' },
                        React.createElement('td', { className: 'border-2 border-black p-1 w-[5%]' }, 'No.'),
                        React.createElement('td', { className: 'border-2 border-black p-1 w-[20%]' }, 'Mata Pelajaran'),
                        React.createElement('td', { className: 'border-2 border-black p-1 w-[8%]' }, 'Nilai Akhir'),
                        React.createElement('td', { className: 'border-2 border-black p-1 w-[67%]' }, 'Capaian Kompetensi')
                    )
                ),
                React.createElement('tbody', null,
                    reportSubjects.map((item, index) => (
                        React.createElement('tr', { key: item.id },
                            React.createElement('td', { className: 'border border-black p-2 text-center align-top' }, index + 1),
                            React.createElement('td', { className: 'border border-black p-2 align-top' }, item.name),
                            React.createElement('td', { className: 'border border-black p-2 text-center align-top' }, item.grade ?? ''),
                            React.createElement('td', { className: 'border border-black p-2 align-top text-justify' },
                                React.createElement('p', {className: 'mb-1'}, item.description.highest),
                                item.description.lowest && React.createElement(React.Fragment, null,
                                  React.createElement('hr', { className: 'border-t border-black my-1' }),
                                  React.createElement('p', null, item.description.lowest)
                                )
                            )
                        )
                    ))
                )
            )
        )
    );
};

const ContinuationPage = ({ student, settings, attendance, notes, extracurriculars, studentExtracurriculars, grades, subjects }) => {
    const attendanceData = attendance.find(a => a.studentId === student.id) || { sakit: 0, izin: 0, alpa: 0 };
    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    const studentNote = notes[student.id] || '';

    const extraActivities = (studentExtraData?.assignedActivities || [])
        .map(activityId => {
            if (!activityId) return null;
            const activity = extracurriculars.find(e => e.id === activityId);
            const description = studentExtraData.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.';
            return { name: activity?.name, description };
        }).filter(Boolean);
        
    const renderDecision = () => {
        const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
        if (!isSemesterGenap) {
            return null; // Don't render for Ganjil
        }

        const kkm = parseInt(settings.predikats?.c, 10) || 70;
        const gradeData = grades.find(g => g.studentId === student.id);
        const activeSubjectIds = new Set(subjects.filter(s => s.active).map(s => s.id));
        
        let isLulus = true;
        if (gradeData && Object.keys(gradeData.finalGrades || {}).length > 0) {
            for (const subjectId in gradeData.finalGrades) {
                if (activeSubjectIds.has(subjectId)) {
                    const grade = gradeData.finalGrades[subjectId];
                    if (grade !== null && grade < kkm) {
                        isLulus = false;
                        break;
                    }
                }
            }
        } else {
            isLulus = false; // No grades, assume not passed
        }

        const gradeLevel = getGradeNumber(settings.nama_kelas);
        
        let passText, failText;
        if (gradeLevel === 6) {
            passText = 'LULUS';
            failText = 'TIDAK LULUS';
        } else {
            passText = 'Naik Kelas';
            failText = 'Tidak Naik Kelas';
        }

        const decisionText = isLulus 
            ? React.createElement(React.Fragment, null, passText, ' / ', React.createElement('s', { className: 'text-black' }, failText))
            : React.createElement(React.Fragment, null, React.createElement('s', { className: 'text-black' }, passText), ' / ', failText);

        return React.createElement('div', { className: 'border-2 border-black p-2 mt-4', style: { fontSize: '11pt' } },
            React.createElement('p', { className: 'font-bold' }, 'Keputusan: '),
            React.createElement('p', null, 'Berdasarkan pencapaian kompetensi pada semester ke-1 dan ke-2, peserta didik ditetapkan:'),
            React.createElement('p', { className: 'font-bold mt-1' }, decisionText)
        );
    };

    return (
        React.createElement('div', { className: 'pt-8 font-times' },
            React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-1', style: { fontSize: '11pt' } },
                React.createElement('thead', null, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: 'border-2 border-black p-1 w-[5%]' }, 'No.'), React.createElement('td', { className: 'border-2 border-black p-1 w-[25%]' }, 'Ekstrakurikuler'), React.createElement('td', { className: 'border-2 border-black p-1 w-[70%]' }, 'Keterangan'))),
                React.createElement('tbody', null, extraActivities.length > 0 ? extraActivities.map((item, index) => (React.createElement('tr', { key: index }, React.createElement('td', { className: 'border border-black p-2 text-center' }, index + 1), React.createElement('td', { className: 'border border-black p-2' }, item.name), React.createElement('td', { className: 'border border-black p-2' }, item.description)))) : React.createElement('tr', null, React.createElement('td', { colSpan: 3, className: 'border border-black p-2 text-center h-8' }, '-')))
            ),
             React.createElement('div', { className: 'border-2 border-black p-2 mt-4', style: { fontSize: '11pt' } }, React.createElement('p', { className: 'font-bold mb-1' }, 'Catatan Guru'), React.createElement('p', null, studentNote || 'Tidak ada catatan.')),
            
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                React.createElement('table', { className: 'border-collapse border-2 border-black mt-4', style: { fontSize: '11pt' } },
                    React.createElement('thead', null, React.createElement('tr', { className: 'font-bold' }, React.createElement('td', { colSpan: 2, className: 'border-2 border-black p-1' }, 'Ketidakhadiran'))),
                    React.createElement('tbody', null,
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1 w-2/3 pl-4' }, 'Sakit'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData.sakit} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1 pl-4' }, 'Izin'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData.izin} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1 pl-4' }, 'Tanpa Keterangan'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData.alpa} hari`))
                    )
                ),
                renderDecision()
            ),
            
            React.createElement('div', { className: 'mt-12 flex justify-between', style: { fontSize: '12pt' } },
                React.createElement('div', { className: 'text-center' }, React.createElement('p', null, 'Mengetahui:'), React.createElement('p', null, 'Orang Tua/Wali,'), React.createElement('div', { className: 'h-20' }), React.createElement('p', { className: 'font-bold' }, '(.........................)')),
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('p', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`), 
                    React.createElement('p', null, 'Wali Kelas,'), 
                    React.createElement('div', { className: 'h-20' }), 
                    React.createElement('p', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'), 
                    React.createElement('p', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
            React.createElement('div', { className: 'mt-8 flex justify-center text-center', style: { fontSize: '12pt' } }, React.createElement('div', null, React.createElement('p', null, 'Mengetahui,'), React.createElement('p', null, 'Kepala Sekolah,'), React.createElement('div', { className: 'h-20' }), React.createElement('p', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'), React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)))
        )
    );
};

const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
};

const PrintRaporPage = ({ students, settings, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
        continuation: true,
    });

    const handlePageSelectionChange = (e) => {
        const { name, checked } = e.target;
        if (name === 'all') {
            setSelectedPages({ cover: checked, schoolIdentity: checked, studentIdentity: checked, academic: checked, continuation: checked });
        } else {
            setSelectedPages(prev => ({ ...prev, [name]: checked }));
        }
    };
    
    const handlePrint = () => {
        const studentToPrint = document.getElementById('studentSelector').value;
        const allPages = document.querySelectorAll('.report-page');
        
        allPages.forEach(page => {
            const studentId = page.getAttribute('data-student-id');
            const pageType = page.getAttribute('data-page-type');
            
            const studentMatch = (studentToPrint === 'all' || studentToPrint === studentId);
            const pageMatch = selectedPages[pageType];

            page.style.display = (studentMatch && pageMatch) ? 'block' : 'none';
        });

        setTimeout(() => {
            window.print();
            allPages.forEach(page => page.style.display = 'block');
        }, 100);
    };
    
    const pageStyle = {
        padding: '1.5cm',
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
    };

    const pageCheckboxes = [
        { key: 'cover', label: 'Sampul' },
        { key: 'schoolIdentity', label: 'Identitas Sekolah' },
        { key: 'studentIdentity', label: 'Identitas Siswa' },
        { key: 'academic', label: 'Akademik' },
        { key: 'continuation', label: 'Lanjutan' },
    ];

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih siswa, halaman, dan ukuran kertas, lalu klik cetak.")
                    ),
                    React.createElement('div', { className: "flex items-center gap-4 mt-4 md:mt-0" },
                        React.createElement('select', { id: "studentSelector", className: "w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                            React.createElement('option', { value: "all" }, "Cetak Semua Siswa"),
                            students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                        ),
                        React.createElement('select', {
                            id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                            className: "w-40 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, key))),
                        React.createElement('button', { onClick: handlePrint, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" }, "Cetak Rapor")
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Pilih Halaman untuk Dicetak:"),
                    React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                        React.createElement('label', { className: "flex items-center space-x-2" }, React.createElement('input', { type: "checkbox", name: "all", checked: Object.values(selectedPages).every(Boolean), onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }), React.createElement('span', { className: "text-sm font-bold" }, "Pilih Semua")),
                        ...pageCheckboxes.map(page => (
                            React.createElement('label', { key: page.key, className: "flex items-center space-x-2" },
                                React.createElement('input', { type: "checkbox", name: page.key, checked: selectedPages[page.key], onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                                React.createElement('span', { className: "text-sm" }, page.label)
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                students.map(student => (
                    React.createElement(React.Fragment, { key: student.id },
                        React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'cover', style: pageStyle },
                            React.createElement(CoverPage, { student: student, settings: settings })
                        ),
                         React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity', style: pageStyle },
                            React.createElement(SchoolIdentityPage, { settings: settings })
                        ),
                         React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity', style: pageStyle },
                            React.createElement(StudentIdentityPage, { student: student, settings: settings })
                        ),
                        React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: pageStyle },
                            React.createElement(AcademicReportPage, { student: student, settings: settings, ...restProps })
                        ),
                        React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'continuation', style: pageStyle },
                            React.createElement(ContinuationPage, { student: student, settings: settings, ...restProps })
                        )
                    )
                ))
            )
        )
    );
};

export default PrintRaporPage;
