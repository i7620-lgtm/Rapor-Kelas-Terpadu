import React, { useState, useMemo, useCallback } from 'react';
import { transliterate, generatePemdaText, expandAndCapitalizeSchoolName, generateInitialLayout } from './TransliterationUtil.js';

const ReportHeader = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "absolute top-0 left-0 right-0", style: { height: '5.2cm', padding: '1cm 1.5cm 0 1.5cm' } },
            React.createElement('div', { className: "relative w-full h-full" },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 180", preserveAspectRatio: "xMidYMin meet" },
                    layout.map(el => {
                        if (el.type === 'text') {
                            let textAnchor = "start";
                            let xPos = el.x;
                            if (el.textAlign === 'center') {
                                textAnchor = "middle";
                                xPos = el.x + (el.width ?? 0) / 2;
                            } else if (el.textAlign === 'right') {
                                textAnchor = "end";
                                xPos = el.x + (el.width ?? 0);
                            }
                            return (
                                React.createElement('text', {
                                    key: el.id,
                                    x: xPos,
                                    y: el.y + (el.fontSize ?? 14),
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    textAnchor: textAnchor,
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'
                                }, el.content)
                            );
                        }
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || ''); // Fallback to empty string if no image
                            if (!imageUrl) return null; // Don't render image if URL is empty
                            return (
                                React.createElement('image', {
                                    key: el.id,
                                    href: imageUrl,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height
                                })
                            );
                        }
                        if (el.type === 'line') {
                            return (
                                React.createElement('rect', {
                                    key: el.id,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height,
                                    fill: "black"
                                })
                            );
                        }
                        return null;
                    })
                )
            )
        )
    );
};


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
    if (!dateString || dateString instanceof Date && isNaN(dateString)) return '-';
    try {
        const date = new Date(dateString);
        // add timezone offset to prevent off-by-one day errors
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        
        if (isNaN(adjustedDate.getTime())) {
            return String(dateString); // Return original string if date is invalid
        }

        return adjustedDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return String(dateString); // Return original string on error
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

const CoverPage = ({ student, settings }) => {
    const year = useMemo(() => {
        if (settings.tanggal_rapor) {
            try {
                // Handle format "Denpasar, 20 Desember 2024"
                const parts = settings.tanggal_rapor.split(' ');
                if (parts.length >= 3) {
                    const yearPart = parts[parts.length - 1];
                    const reportYear = parseInt(yearPart, 10);
                    const monthName = parts[parts.length - 2];
                    const monthIndex = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].indexOf(monthName.toLowerCase());

                    if (!isNaN(reportYear) && monthIndex !== -1) {
                        // If report date is in the first half of the year (Jan-June), it belongs to the previous academic year end
                        if (monthIndex < 6) {
                            return `${reportYear - 1}/${reportYear}`;
                        }
                        return `${reportYear}/${reportYear + 1}`;
                    }
                }
            } catch (e) { /* Fallback below */ }
        }
        if (settings.tahun_ajaran) {
            return settings.tahun_ajaran;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        if (currentMonth < 6) {
             return `${currentYear - 1}/${currentYear}`;
        }
        return `${currentYear}/${currentYear + 1}`;
    }, [settings.tanggal_rapor, settings.tahun_ajaran]);

    const coverLogo = settings.logo_cover || ''; // Now falls back to empty string

    return React.createElement('div', {
        className: 'flex flex-col items-center text-center p-8 box-border',
        style: {
            position: 'absolute',
            top: '1.5cm',
            left: '1.5cm',
            right: '1.5cm',
            bottom: '1.5cm',
            border: '6px double #000'
        }
    },
        React.createElement('div', { className: 'w-full pt-16' },
            React.createElement('div', { className: 'flex justify-center mb-10' },
                coverLogo && React.createElement('img', { // Only render img if coverLogo exists
                    src: coverLogo,
                    alt: "Logo Cover Rapor",
                    className: 'h-48 w-48 object-contain'
                })
            ),
            React.createElement('h1', { className: 'text-2xl font-bold tracking-widest' }, 'RAPOR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'MURID'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'SEKOLAH DASAR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, '(SD)'),

            React.createElement('div', { className: 'mt-24 w-full px-8' },
                React.createElement('p', { className: 'text-sm' }, 'Nama Murid:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, (student.namaLengkap || 'NAMA MURID').toUpperCase())
                ),
                React.createElement('p', { className: 'text-sm mt-4' }, 'NISN/NIS:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, `${student.nisn || '-'} / ${student.nis || '-'}`)
                )
            )
        ),
        React.createElement('div', { className: 'flex-grow' }),
        React.createElement('div', { className: 'mb-8 space-y-2' },
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'REPUBLIK INDONESIA'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, year)
        )
    );
};

const SchoolIdentityPage = ({ settings }) => {
    const identitasSekolah = [
        { label: "Nama Sekolah", value: settings.nama_sekolah },
        { label: "NPSN", value: settings.npsn },
        { label: "NIS/NSS/NDS", value: '-'},
        { label: "Alamat Sekolah", value: settings.alamat_sekolah },
        { label: 'Kelurahan/Desa', value: settings.desa_kelurahan },
        { label: 'Kecamatan', value: settings.kecamatan },
        { label: 'Kabupaten/Kota', value: settings.kota_kabupaten },
        { label: 'Provinsi', value: settings.provinsi },
        { label: 'Website', value: settings.website_sekolah },
        { label: 'E-mail', value: settings.email_sekolah },
        { label: 'Kode Pos', value: settings.kode_pos },
        { label: 'Telepon', value: settings.telepon_sekolah },
    ];

    return(
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-12', style: { fontSize: '14pt' } }, 'IDENTITAS SEKOLAH'),
             React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-2' }, `${index + 1}.`),
                            React.createElement('td', { className: 'w-[30%] py-2' }, item.label),
                            React.createElement('td', { className: 'w-[5%] py-2' }, ':'),
                            React.createElement('td', { className: 'w-[60%] py-2' }, item.value || '-')
                        )
                    ))
                )
            )
        )
    );
};

const StudentIdentityPage = ({ student, settings }) => {
    const identitasSiswa = [
        { no: '1.', label: 'Nama Murid', value: (student.namaLengkap || '').toUpperCase() },
        { no: '2.', label: 'NISN/NIS', value: `${student.nisn || '-'} / ${student.nis || '-'}` },
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: `${student.tempatLahir || ''}, ${formatDate(student.tanggalLahir)}` },
        { no: '4.', label: 'Jenis Kelamin', value: student.jenisKelamin },
        { no: '5.', label: 'Agama', value: student.agama },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { no: '7.', label: 'Alamat Murid', value: student.alamatSiswa },
        { no: '8.', label: 'Nama Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.namaAyah },
        { sub: true, label: 'b. Ibu', value: student.namaIbu },
        { no: '9.', label: 'Pekerjaan Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.pekerjaanAyah },
        { sub: true, label: 'b. Ibu', value: student.pekerjaanIbu },
        { no: '10.', label: 'Alamat Orang Tua', value: student.alamatOrangTua },
        { no: '11.', label: 'Wali Murid' },
        { sub: true, label: 'a. Nama', value: student.namaWali },
        { sub: true, label: 'b. Pekerjaan', value: student.pekerjaanWali },
        { sub: true, label: 'c. Alamat', value: student.alamatWali },
    ];
    
    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-12', style: { fontSize: '14pt' } }, 'IDENTITAS MURID'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSiswa.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-1' }, item.no || ''),
                            React.createElement('td', { className: `w-[35%] py-1 ${item.sub ? 'pl-4' : ''}` }, item.label),
                            React.createElement('td', { className: 'w-[3%] py-1 text-center' }, item.label ? ':' : ''),
                            React.createElement('td', { className: 'w-[57%] py-1' }, item.value || (item.sub ? '-' : ''))
                        )
                    ))
                )
            ),
            React.createElement('div', { className: 'flex justify-between items-end pt-10' },
                React.createElement('div', { className: 'w-32 h-40 border-2 flex items-center justify-center text-slate-400' }, 'Pas Foto 3x4'),
                React.createElement('div', { className: 'text-center' },
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`),
                    React.createElement('div', { className: 'mt-1' }, 'Kepala Sekolah,'),
                    React.createElement('div', { className: 'h-20' }),
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'),
                    React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                )
            )
        )
    );
};

const ReportStudentInfo = ({ student, settings }) => (
    React.createElement('table', { className: 'w-full mb-4', style: { fontSize: '11pt' } },
        React.createElement('tbody', null,
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'w-[20%] py-1 px-2' }, 'Nama Murid'), React.createElement('td', { className: 'w-[45%] py-1 px-2' }, `: ${(student.namaLengkap || '').toUpperCase()}`),
                React.createElement('td', { className: 'w-[15%] py-1 px-2' }, 'Kelas'), React.createElement('td', { className: 'w-[20%] py-1 px-2' }, `: ${settings.nama_kelas || ''}`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'NISN/NIS'), React.createElement('td', { className: 'py-1 px-2' }, `: ${student.nisn || '-'} / ${student.nis || '-'}`),
                React.createElement('td', { className: 'py-1 px-2' }, 'Fase'), React.createElement('td', { className: 'py-1 px-2' }, `: C`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'Nama Sekolah'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.nama_sekolah || ''}`),
                React.createElement('td', { className: 'py-1 px-2' }, 'Semester'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.semester ? (settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)') : '2'}`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'Alamat Sekolah'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.alamat_sekolah || ''}`),
                React.createElement('td', { className: 'whitespace-nowrap py-1 px-2' }, 'Tahun Pelajaran'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.tahun_ajaran || ''}`)
            )
        )
    )
);

const AcademicTable = ({ subjectsToRender, startingIndex = 1 }) => (
    React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-2', style: { fontSize: '11pt' } },
        React.createElement('thead', { className: "report-header-group" },
            React.createElement('tr', { className: 'font-bold text-center' },
                React.createElement('td', { className: 'border-2 border-black p-2 w-[5%]' }, 'No.'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[20%]' }, 'Mata Pelajaran'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[8%] whitespace-nowrap' }, 'Nilai Akhir'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[67%]' }, 'Capaian Kompetensi')
            )
        ),
        React.createElement('tbody', null,
            subjectsToRender.map((item, index) => (
                React.createElement('tr', { key: item.id },
                    React.createElement('td', { className: 'border border-black px-2 py-1 text-center align-top' }, startingIndex + index),
                    React.createElement('td', { className: 'border border-black px-2 py-1 align-top' }, item.name),
                    React.createElement('td', { className: 'border border-black px-2 py-1 text-center align-top' }, item.grade ?? ''),
                    React.createElement('td', { className: 'border border-black px-2 py-1 align-top text-justify' },
                        React.createElement('p', {className: 'mb-1'}, item.description.highest),
                        item.description.lowest && React.createElement(React.Fragment, null,
                            React.createElement('hr', { className: 'border-t border-slate-400 my-1' }),
                            React.createElement('p', null, item.description.lowest)
                        )
                    )
                )
            ))
        )
    )
);

const ReportFooterContent = ({ student, settings, attendance, notes, studentExtracurriculars, extracurriculars }) => {
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
        if (!isSemesterGenap) return null;

        const gradeLevel = getGradeNumber(settings.nama_kelas);
        let passText, failText, passTo, failTo;

        if (gradeLevel === 6) {
            passText = 'LULUS';
        } else {
            passText = 'Naik ke Kelas';
            const nextGrade = gradeLevel ? gradeLevel + 1 : '';
            const nextGradeRomanPlusOne = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII'}[nextGrade];
            passTo = `${nextGrade} (${nextGradeRomanPlusOne})`;
        }
        
        return React.createElement('div', { className: 'border-2 border-black p-2 mt-4' },
            React.createElement('div', { className: 'font-bold' }, 'Keputusan: '),
            React.createElement('div', null, 'Berdasarkan pencapaian seluruh kompetensi, murid dinyatakan:'),
            React.createElement('div', { className: 'font-bold mt-1 border-y-2 border-black text-center py-1' }, 
                `${passText} ${passTo || ''}`.trim()
            )
        );
    };

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'mt-4 signature-block'},
                React.createElement('table', { className: 'w-full border-collapse border-2 border-black', style: { fontSize: '11pt' } },
                    React.createElement('thead', { className: "report-header-group" }, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: 'border-2 border-black p-2 w-[5%]' }, 'No.'), React.createElement('td', { className: 'border-2 border-black p-2 w-[25%]' }, 'Ekstrakurikuler'), React.createElement('td', { className: 'border-2 border-black p-2 w-[70%]' }, 'Keterangan'))),
                    React.createElement('tbody', null, extraActivities.length > 0 ? extraActivities.map((item, index) => (React.createElement('tr', { key: index, className: 'align-top' }, React.createElement('td', { className: 'border border-black px-2 py-1 text-center' }, index + 1), React.createElement('td', { className: 'border border-black px-2 py-1' }, item.name), React.createElement('td', { className: 'border border-black px-2 py-1' }, item.description)))) : React.createElement('tr', null, React.createElement('td', { colSpan: 3, className: 'border border-black p-2 text-center h-8' }, '-')))
                )
            ),
            React.createElement('div', { className: 'border-2 border-black p-2 mt-4 signature-block', style: { fontSize: '11pt' } },
                React.createElement('div', { className: 'font-bold mb-1' }, 'Catatan Wali Kelas'),
                React.createElement('div', { className: 'min-h-[4rem]' }, studentNote || 'Tidak ada catatan.')
            ),
            
            React.createElement('div', { className: 'grid grid-cols-2 gap-4 signature-block' },
                React.createElement('table', { className: 'border-collapse border-2 border-black mt-4', style: { fontSize: '11pt' } },
                    React.createElement('thead', { className: "report-header-group" }, React.createElement('tr', { className: 'font-bold' }, React.createElement('td', { colSpan: 2, className: 'border-2 border-black p-2' }, 'Ketidakhadiran'))),
                    React.createElement('tbody', null,
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 w-2/3 pl-4' }, 'Sakit'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.sakit} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 pl-4' }, 'Izin'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.izin} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 pl-4' }, 'Tanpa Keterangan'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.alpa} hari`))
                    )
                ),
                React.createElement('div', { className: 'signature-block' }, renderDecision())
            ),
            React.createElement('div', { className: 'signature-block mt-8 flex justify-between', style: { fontSize: '12pt' } },
                React.createElement('div', { className: 'text-center' }, React.createElement('div', null, 'Mengetahui:'), React.createElement('div', null, 'Orang Tua/Wali,'), React.createElement('div', { className: 'h-20' }), React.createElement('div', { className: 'font-bold' }, '(.........................)')),
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`), 
                    React.createElement('div', null, 'Wali Kelas,'), 
                    React.createElement('div', { className: 'h-20' }), 
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'), 
                    React.createElement('div', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
            React.createElement('div', { className: 'signature-block mt-6 flex justify-center text-center', style: { fontSize: '12pt' } }, React.createElement('div', null, React.createElement('div', null, 'Mengetahui,'), React.createElement('div', null, 'Kepala Sekolah,'), React.createElement('div', { className: 'h-20' }), React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'), React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)))
        )
    );
};

const ReportPagesForStudent = ({ student, settings, selectedPages, pageStyle, ...restProps }) => {
    const { grades, subjects, learningObjectives, attendance, notes, extracurriculars, studentExtracurriculars } = restProps;
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
                return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
            },
            'Muatan Lokal': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
                if (chosen) {
                    const match = chosen.fullName.match(/\(([^)]+)\)/);
                    return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
                }
                return null;
            }
        };

        Object.keys(groupConfigs).forEach(groupName => {
            if (processedGroups.has(groupName)) return;
            const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
            if (groupSubjects.length > 0) {
                const config = groupConfigs[groupName](groupSubjects);
                if (config && config.subject) {
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
            'Ilmu Pengetahuan Alam dan Sosial', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 
            'Bahasa Inggris', 'Muatan Lokal'
        ];
        
        const findOriginalFullName = (subjectId) => subjects.find(s => s.id === subjectId)?.fullName || '';

        result.sort((a, b) => {
            const getSortKey = (item) => {
                const originalFullName = findOriginalFullName(item.id);
                if (originalFullName.startsWith('Pendidikan Agama')) return 'Pendidikan Agama dan Budi Pekerti';
                if (originalFullName.startsWith('Seni Budaya')) return 'Seni Budaya';
                if (originalFullName.startsWith('Muatan Lokal')) return 'Muatan Lokal';
                return item.name;
            };
            const aSortKey = getSortKey(a);
            const bSortKey = getSortKey(b);
            const aIndex = sortOrder.findIndex(key => aSortKey.startsWith(key));
            const bIndex = sortOrder.findIndex(key => bSortKey.startsWith(key));
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });
        return result;
    }, [student, subjects, gradeData, learningObjectives, settings]);

    const { needsSplitting, splitPoint } = useMemo(() => {
        const fixedSplitPoint = 7;
        const calculatedNeedsSplitting = reportSubjects.length > fixedSplitPoint;
    
        return { 
            needsSplitting: calculatedNeedsSplitting, 
            splitPoint: fixedSplitPoint 
        };
    }, [reportSubjects]);

    const page1Subjects = needsSplitting ? reportSubjects.slice(0, splitPoint) : reportSubjects;
    const page2Subjects = needsSplitting ? reportSubjects.slice(splitPoint) : [];

    const contentStyle = { padding: '1.5cm' };
    const contentStyleWithHeader = { padding: '1.5cm', paddingTop: '5.2cm' };
    
    const previewPageStyle = {
        width: pageStyle.width,
        minHeight: pageStyle.height, // Use height as minHeight for preview
        height: 'auto', // Allow content to push height
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always', // For explicit breaks in preview mode
    };

    return (
        React.createElement(React.Fragment, null,
            selectedPages.cover && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', style: { ...previewPageStyle, border: '6px double #000' }, 'data-student-id': String(student.id), 'data-page-type': 'cover' },
                React.createElement(CoverPage, { student: student, settings: settings })
            ),
            selectedPages.schoolIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', style: previewPageStyle, 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity' },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: contentStyleWithHeader }, React.createElement(SchoolIdentityPage, { settings: settings }))
            ),
            selectedPages.studentIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', style: previewPageStyle, 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity' },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: contentStyleWithHeader }, React.createElement(StudentIdentityPage, { student: student, settings: settings }))
            ),
            selectedPages.academic && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', style: previewPageStyle, 'data-student-id': String(student.id), 'data-page-type': 'academic' },
                React.createElement('div', { style: { height: '5.2cm' } }, React.createElement(ReportHeader, { settings: settings })),
                React.createElement('div', { style: { padding: '1.5cm', paddingTop: 0, verticalAlign: 'top' } },
                    React.createElement('div', { className: 'font-times' },
                        React.createElement(ReportStudentInfo, { student: student, settings: settings }),
                        React.createElement(AcademicTable, { subjectsToRender: page1Subjects }),
                        !needsSplitting && React.createElement(ReportFooterContent, { student, settings, attendance, notes, studentExtracurriculars, extracurriculars })
                    )
                )
            ),
            selectedPages.academic && needsSplitting && (
                React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', style: previewPageStyle, 'data-student-id': String(student.id), 'data-page-type': 'academic' },
                    React.createElement('div', { style: { height: '5.2cm' } }, React.createElement(ReportHeader, { settings: settings })),
                    React.createElement('div', { style: { padding: '1.5cm', paddingTop: 0, verticalAlign: 'top' } },
                        React.createElement('div', { className: 'font-times' },
                            React.createElement(ReportStudentInfo, { student: student, settings: settings }),
                            React.createElement(AcademicTable, { subjectsToRender: page2Subjects, startingIndex: splitPoint + 1 }),
                            React.createElement(ReportFooterContent, { student, settings, attendance, notes, studentExtracurriculars, extracurriculars })
                        )
                    )
                )
            )
        )
    );
};


const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

const PrintRaporPage = ({ students, settings, showToast, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
    });

    const handlePageSelectionChange = useCallback((e) => {
        const { name, checked } = e.target;
        setSelectedPages(prev => {
            if (name === 'all') {
                return {
                    cover: checked,
                    schoolIdentity: checked,
                    studentIdentity: checked,
                    academic: checked,
                };
            }
            return {
                ...prev,
                [name]: checked,
            };
        });
    }, []);
    
    const handlePrint = async () => {
        // Set CSS variables for print to control page size
        const pageHeight = PAPER_SIZES[paperSize].height;
        const pageWidth = PAPER_SIZES[paperSize].width;

        const style = document.createElement('style');
        style.innerHTML = `
            @page {
                size: ${paperSize} portrait;
                margin: 0;
            }
            :root {
                --page-width: ${pageWidth};
                --page-height: ${pageHeight};
            }
            /* The .report-page styles are already in index.html,
               but we set the variables here for dynamic sizing. */
        `;
        document.head.appendChild(style);

        window.print();

        // Remove the temporary style after printing
        document.head.removeChild(style);
        
        showToast('Perintah cetak telah dikirim ke browser Anda.', 'success');
    };

    const studentsToRender = useMemo(() => {
        if (selectedStudentId === 'all') {
            return students;
        }
        return students.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId]);
    
    // Reintroduced pageStyle prop for on-screen preview sizing
    const pageStyle = {
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
    };

    const pageCheckboxes = [
        { key: 'cover', label: 'Sampul' },
        { key: 'schoolIdentity', label: 'Identitas Sekolah' },
        { key: 'studentIdentity', label: 'Identitas Murid' },
        { key: 'academic', label: 'Laporan Hasil Belajar' },
    ];

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih murid, halaman, dan ukuran kertas, lalu klik tombol cetak untuk membuat file PDF.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'studentSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Pilih Murid'),
                            React.createElement('select', { 
                                id: "studentSelector",
                                value: selectedStudentId,
                                onChange: (e) => setSelectedStudentId(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Murid"),
                                students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                            React.createElement('select', {
                                id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { 
                            onClick: handlePrint,
                            className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" 
                        }, 'Cetak Rapor ke Printer')
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Pilih Halaman untuk Dicetak:"),
                    React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                        React.createElement('label', { className: "flex items-center space-x-2" }, React.createElement('input', { type: "checkbox", name: "all", checked: Object.values(selectedPages).every(Boolean), onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }), React.createElement('span', { className: "text-sm font-bold" }, "Pilih Semua")),
                        ...pageCheckboxes.map(page => (
                            React.createElement('label', { key: page.key, className: "flex items-center space-x-2" },
                                React.createElement('input', { type: "checkbox", name: page.key, checked: selectedPages[page.key] || false, onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                                React.createElement('span', { className: "text-sm" }, page.label)
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                studentsToRender.map(student => {
                    const studentSelectedPages = {
                        cover: selectedPages.cover,
                        schoolIdentity: selectedPages.schoolIdentity,
                        studentIdentity: selectedPages.studentIdentity,
                        academic: selectedPages.academic
                    };

                    return React.createElement(ReportPagesForStudent, { 
                        key: student.id, 
                        student: student, 
                        settings: settings,
                        pageStyle: pageStyle, // Reintroduced
                        selectedPages: studentSelectedPages,
                        ...restProps
                    })
                })
            )
        )
    );
};

export default PrintRaporPage;
