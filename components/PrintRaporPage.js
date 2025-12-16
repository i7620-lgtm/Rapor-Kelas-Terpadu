
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { transliterate, generateInitialLayout } from './TransliterationUtil.js';
import { getGradeNumber } from './DataNilaiPage.js'; // Import getGradeNumber from DataNilaiPage
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from '../constants.js';

const getPhase = (gradeNumber) => {
    if (gradeNumber >= 5) return 'C'; // Kelas 5 & 6
    if (gradeNumber >= 3) return 'B'; // Kelas 3 & 4
    if (gradeNumber >= 1) return 'A'; // Kelas 1 & 2
    return '';
};

// Define fixed heights and margins for layout consistency
const HEADER_HEIGHT_CM = 6.0; // Height of the report header area in cm
const PAGE_TOP_MARGIN_CM = 1.5; // Standard top margin of the paper in cm
const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5; // Standard left/right margin
const PAGE_BOTTOM_MARGIN_CM = 1.5; // Standard bottom margin of the paper in cm
const PAGE_NUMBER_FOOTER_HEIGHT_CM = 1.0; // Estimated height of the page number footer (text + line)

// New derived constant for the 'bottom' CSS property of the main content area
// Adjusted to provide a safer buffer (0.5cm) above the footer line to prevents overlap
// Footer line is at 2.5cm from bottom. Content stops at 3.0cm from bottom.
const REPORT_CONTENT_BOTTOM_OFFSET_CM = PAGE_BOTTOM_MARGIN_CM + PAGE_NUMBER_FOOTER_HEIGHT_CM + 0.5;

const ReportHeader = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', {
            className: "absolute",
            style: {
                top: `${PAGE_TOP_MARGIN_CM}cm`,
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
            }
        },
            React.createElement('div', {
                className: "relative w-full",
                style: { aspectRatio: '800 / 200' }
            },
                React.createElement('svg', {
                    className: "absolute top-0 left-0 w-full h-full",
                    viewBox: "0 0 800 200",
                    preserveAspectRatio: "none"
                },
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
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const lowercaseFirst = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};


const generateDescription = (student, subject, gradeData, learningObjectives, settings) => {
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);

    const cleanTpText = (text) => {
        if (!text) return '';
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(new RegExp(`^ananda\\s+${studentNameRaw}\\s`, 'i'), '');
        cleanedText = cleanedText.replace(/^ananda\s+/i, '');
        return cleanedText.trim();
    };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) {
        return { highest: `${studentName} menunjukkan perkembangan yang baik.`, lowest: "" };
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
        return { highest: `${studentName} menunjukkan penguasaan pada tujuan pembelajaran yang belum diisi.`, lowest: "" };
    }

    // New, more robust logic for assembling TPs and scores
    const gradedTps = [];
    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    
    if (detailedGrade && detailedGrade.slm) {
        // Create a lookup map for faster access to TP texts, grouped by slmId.
        const tpTextMap = new Map();
        objectivesForSubject.forEach(obj => {
            if (!tpTextMap.has(obj.slmId)) {
                tpTextMap.set(obj.slmId, []);
            }
            tpTextMap.get(obj.slmId).push(cleanTpText(obj.text));
        });

        // Iterate over the student's graded SLMs.
        detailedGrade.slm.forEach(slm => {
            const tpTextsForThisSlm = tpTextMap.get(slm.id);
            if (tpTextsForThisSlm && slm.scores) {
                slm.scores.forEach((score, index) => {
                    // Ensure the score is a valid number and a corresponding TP text exists.
                    if (typeof score === 'number' && index < tpTextsForThisSlm.length) {
                        gradedTps.push({
                            text: tpTextsForThisSlm[index],
                            score: score
                        });
                    }
                });
            }
        });
    }
    
    if (gradedTps.length === 0) {
        return { highest: `${studentName} menunjukkan penguasaan yang belum terukur.`, lowest: "" };
    }
    
    if (gradedTps.length === 1) {
        return { highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' };
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        return { 
            highest: `${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        };
    } else {
        // Find the single highest and single lowest scored TPs
        let highestTp = gradedTps[0];
        let lowestTp = gradedTps[0];

        for (let i = 1; i < gradedTps.length; i++) {
            if (gradedTps[i].score > highestTp.score) {
                highestTp = gradedTps[i];
            }
            if (gradedTps[i].score < lowestTp.score) {
                lowestTp = gradedTps[i];
            }
        }
        
        return { 
            highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(highestTp.text)}.`,
            lowest: `${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
        };
    }
};

const CoverPage = ({ student, settings }) => {
    const year = useMemo(() => {
        if (settings.tanggal_rapor) {
            try {
                // Handle format "Denpasar, 20 Desember 2024"
                const parts = settings.tanggal_rapor.split(' ');
                if (parts.length >= 3) {
                    const yearPart = parts[parts.length - 1];
                    const monthName = parts[parts.length - 2];
                    const monthIndex = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].indexOf(monthName.toLowerCase());

                    if (!isNaN(parseInt(yearPart, 10)) && monthIndex !== -1) {
                        const reportYear = parseInt(yearPart, 10);
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
        className: 'flex flex-col items-center text-center p-8 box-border font-times',
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
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS SEKOLAH'),
             React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, `${index + 1}.`),
                            React.createElement('td', { className: 'w-[30%] py-[2px]' }, item.label),
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, ':'),
                            React.createElement('td', { className: 'w-[60%] py-[2px]' }, item.value || '-')
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
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: student.ttl || '-' },
        { no: '4.', label: 'Jenis Kelamin', value: student.jenisKelamin },
        { no: '5.', label: 'Agama', value: student.agama },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { no: '7.', 'label': 'Alamat Murid', value: student.alamatSiswa },
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
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS MURID'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSiswa.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-[1.5px]' }, item.no || ''),
                            React.createElement('td', { className: `w-[35%] py-[1.5px] ${item.sub ? 'pl-4' : ''}` }, item.label),
                            React.createElement('td', { className: 'w-[3%] py-[1.5px] text-center' }, item.label ? ':' : ''),
                            React.createElement('td', { className: 'w-[57%] py-[1.5px]' }, item.value || (item.sub ? '-' : ''))
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

const ReportStudentInfo = React.forwardRef(({ student, settings }, ref) => {
    const gradeNumber = getGradeNumber(settings.nama_kelas);
    const phase = getPhase(gradeNumber);
    
    return React.createElement('div', { ref: ref },
        React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'LAPORAN HASIL BELAJAR'),
        React.createElement('table', { className: 'w-full mb-1', style: { fontSize: '10.5pt', tableLayout: 'fixed' } },
            React.createElement('tbody', null,
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'w-[20%] py-0 px-1' }, 'Nama Murid'), React.createElement('td', { className: 'w-[45%] py-0 px-1' }, `: ${(student.namaLengkap || '').toUpperCase()}`),
                    React.createElement('td', { className: 'w-[15%] py-0 px-1' }, 'Kelas'), React.createElement('td', { className: 'w-[20%] py-0 px-1' }, `: ${settings.nama_kelas || ''}`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-0 px-1' }, 'NISN/NIS'), React.createElement('td', { className: 'py-0 px-1' }, `: ${student.nisn || '-'} / ${student.nis || '-'}`),
                    React.createElement('td', { className: 'py-0 px-1' }, 'Fase'), React.createElement('td', { className: 'py-0 px-1' }, `: ${phase}`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-0 px-1' }, 'Nama Sekolah'), React.createElement('td', { className: 'py-0 px-1' }, `: ${settings.nama_sekolah || ''}`),
                    React.createElement('td', { className: 'whitespace-nowrap py-0 px-1' }, 'Semester'), React.createElement('td', { className: 'py-0 px-1' }, `: ${settings.semester ? (settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)') : ''}`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-0 px-1' }, 'Alamat Sekolah'), React.createElement('td', { className: 'py-0 px-1' }, `: ${settings.alamat_sekolah || ''}`),
                    React.createElement('td', { className: 'whitespace-nowrap py-0 px-1' }, 'Tahun Pelajaran'), React.createElement('td', { className: 'py-0 px-1' }, `: ${settings.tahun_ajaran || ''}`)
                )
            )
        )
    )
});

const AcademicTable = React.forwardRef(({ subjectsToRender, startingIndex = 1, headerRef, hideGradesForFaseA }, ref) => (
    React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-1', style: { fontSize: '10pt', tableLayout: 'fixed' } },
        React.createElement('thead', { ref: headerRef, className: "report-header-group" },
            React.createElement('tr', { className: 'font-bold text-center' },
                React.createElement('td', { className: 'border-2 border-black px-1 py-0 w-[5%]' }, 'No.'),
                React.createElement('td', { className: 'border-2 border-black px-1 py-0 w-[20%]' }, 'Mata Pelajaran'),
                !hideGradesForFaseA && (
                    React.createElement('td', { className: 'border-2 border-black px-1 py-0 w-[12%] whitespace-nowrap' }, 'Nilai Akhir')
                ),
                React.createElement('td', { className: 'border-2 border-black px-1 py-0', style: { width: hideGradesForFaseA ? '75%' : '63%' } }, 'Capaian Kompetensi')
            )
        ),
        React.createElement('tbody', { ref: ref },
            subjectsToRender.map((item, index) => (
                React.createElement('tr', { key: item.id },
                    React.createElement('td', { className: 'border border-black px-1 py-[1px] text-center align-top' }, startingIndex + index),
                    React.createElement('td', { className: 'border border-black px-1 py-[1px] align-top' }, item.name),
                    !hideGradesForFaseA && (
                        React.createElement('td', { className: 'border border-black px-1 py-[1px] text-center align-top' }, item.grade ?? '')
                    ),
                    React.createElement('td', { className: 'border border-black px-1 py-[1px] align-top leading-tight' },
                        React.createElement('p', null, item.description.highest),
                        item.description.lowest && React.createElement(React.Fragment, null,
                            React.createElement('hr', { className: 'my-0.5 border-t border-black' }),
                            React.createElement('p', null, item.description.lowest)
                        )
                    )
                )
            ))
        )
    )
));

const ReportFooterContent = React.forwardRef((props, ref) => {
    const { 
        student, settings, attendance, notes, studentExtracurriculars, extracurriculars, cocurricularData,
        rank, rankingOption, // New props
        showCocurricular, showExtra, showNotes, showAttendance, showDecision, 
        showParentFeedback, showParentTeacherSignature, showHeadmasterSignature,
    } = props;
    const { cocurricularRef, extraRef, attendanceAndNotesRef, decisionRef, parentFeedbackRef, signaturesRef, headmasterRef } = ref || {};

    const shouldDisplayRank = rank && rankingOption !== 'none' && (
        (rankingOption === 'top3' && rank <= 3) ||
        (rankingOption === 'top10' && rank <= 10)
    );
    
    const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);

    const originalNote = notes[student.id] || '';
    let studentNoteContent;
    if (shouldDisplayRank) {
        const rankMessageStart = `Selamat! berhasil meraih `;
        const rankText = `Peringkat ${rank}`;
        const rankMessageEnd = ` di kelas. `;
        studentNoteContent = React.createElement(React.Fragment, null, 
            React.createElement('span', null, rankMessageStart),
            React.createElement('strong', null, rankText),
            React.createElement('span', null, rankMessageEnd + originalNote)
        );
    } else {
        studentNoteContent = originalNote || 'Tidak ada catatan.';
    }

    const attendanceData = attendance.find(a => a.studentId === student.id) || { sakit: null, izin: null, alpa: null };
    const sakitCount = attendanceData.sakit ?? 0;
    const izinCount = attendanceData.izin ?? 0;
    const alpaCount = attendanceData.alpa ?? 0;

    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    
    const extraActivities = (studentExtraData?.assignedActivities || [])
        .map(activityId => {
            if (!activityId) return null;
            const activity = extracurriculars.find(e => e.id === activityId);
            const description = studentExtraData.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.';
            return { name: activity?.name, description };
        }).filter(Boolean);
        
    const cocurricularDescription = useMemo(() => {
        const studentCoData = cocurricularData?.[student.id];
        const theme = settings.cocurricular_theme;
        const ratings = (studentCoData && typeof studentCoData.dimensionRatings === 'object' && studentCoData.dimensionRatings !== null)
            ? studentCoData.dimensionRatings
            : {};
        
        const hasRatings = Object.values(ratings).some(r => r && r !== "---");

        if (!theme && !hasRatings) {
            return "Data kokurikuler belum diisi.";
        }

        let descriptionParts = [];

        if (theme) {
            descriptionParts.push(`${nickname} berpartisipasi aktif dalam kegiatan kokurikuler dengan tema "${theme}".`);
        }
        
        const sbDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ratings[dim.id] === 'SB')
            .map(dim => dim.label.toLowerCase());

        const bshDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ratings[dim.id] === 'BSH')
            .map(dim => dim.label.toLowerCase());

        const developingDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ['MB', 'BB'].includes(ratings[dim.id]))
            .map(dim => dim.label.toLowerCase());
        
        // Helper to format list: "a, b, dan c"
        const formatDims = (list) => {
            if (list.length === 0) return '';
            if (list.length === 1) return list[0];
            const last = list[list.length - 1];
            const rest = list.slice(0, -1).join(', ');
            return `${rest}, dan ${last}`;
        };

        if (sbDimensions.length > 0 || bshDimensions.length > 0) {
            let positiveSentence = "Ia menunjukkan perkembangan yang ";
            const parts = [];
            
            if (sbDimensions.length > 0) {
                parts.push(`sangat baik dalam aspek ${formatDims(sbDimensions)}`);
            }
            
            if (bshDimensions.length > 0) {
                parts.push(`baik dalam aspek ${formatDims(bshDimensions)}`);
            }
            
            positiveSentence += parts.join(' serta ') + ".";
            descriptionParts.push(positiveSentence);
        }

        if (developingDimensions.length > 0) {
            const dimensionText = formatDims(developingDimensions);
            descriptionParts.push(`Perlu bimbingan untuk lebih meningkatkan kemampuan dalam aspek ${dimensionText}.`);
        }

        if (descriptionParts.length > 0 && !hasRatings) {
             descriptionParts.push('Penilaian dimensi profil lulusan perlu ditambahkan.');
        } else if (descriptionParts.length === 0 && hasRatings) {
            descriptionParts.push(`${nickname} telah menyelesaikan kegiatan kokurikuler dengan baik.`);
        }

        return descriptionParts.join(' ');
        
    }, [student, settings, cocurricularData, nickname]);

    const renderDecision = () => {
        const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
        if (!isSemesterGenap) return null;

        const gradeLevel = getGradeNumber(settings.nama_kelas);

        let promotionText;
        if (gradeLevel === 6) {
            promotionText = 'LULUS';
        } else {
            const nextGrade = gradeLevel ? gradeLevel + 1 : '';
            const nextGradeRoman = {1: 'II', 2: 'III', 3: 'IV', 4: 'V', 5: 'VI'}[nextGrade - 1] || '';
            promotionText = `Naik ke Kelas ${nextGrade} (${nextGradeRoman})`;
        }
        
        return React.createElement('div', { className: 'border-2 border-black p-2', style: { fontSize: '10pt' } },
            React.createElement('div', { className: 'font-bold border-y-2 border-black text-center py-1' }, 
                `Berdasarkan hasil belajar yang dicapai, ${nickname} dinyatakan:`
            ),
            React.createElement('div', { className: 'font-bold mt-1 text-center py-1' },
                promotionText
            )
        );
    };

    return (
        React.createElement('div', { className: 'mt-1' },
            showCocurricular && cocurricularDescription && React.createElement('div', { ref: cocurricularRef, className: 'border-2 border-black p-2', style: { fontSize: '10pt' } },
                React.createElement('div', { className: 'font-bold mb-1' }, 'Kokurikuler'),
                React.createElement('div', { className: 'min-h-[2rem]' }, cocurricularDescription)
            ),
            (showExtra && extraActivities.length > 0) && React.createElement('div', { ref: extraRef, className: 'mt-1' },
                React.createElement('table', { className: 'w-full border-collapse border-2 border-black', style: { fontSize: '10pt', tableLayout: 'fixed' } },
                    React.createElement('thead', null, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[5%]' }, 'No.'), React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[32%]' }, 'Ekstrakurikuler'), React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[63%]' }, 'Keterangan'))),
                    React.createElement('tbody', null, extraActivities.map((item, index) => (React.createElement('tr', { key: index, className: 'align-top' }, React.createElement('td', { className: 'border border-black px-2 py-[2px] text-center' }, index + 1), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, item.name), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, item.description)))))
                )
            ),
            (showAttendance || showNotes) && React.createElement('div', { ref: attendanceAndNotesRef, className: 'flex gap-4 mt-1 items-stretch' },
                showAttendance && React.createElement('div', { className: 'border-2 border-black flex flex-col', style: { fontSize: '10pt', width: '6.5cm' } },
                    React.createElement('div', { className: 'font-bold border-b-2 border-black px-2 py-1 text-center' }, 'Ketidakhadiran'),
                     React.createElement('div', { className: 'flex-grow flex flex-col' },
                        ['Sakit', 'Izin', 'Tanpa Keterangan'].map((item, index, arr) => {
                            const value = item === 'Sakit' ? sakitCount : item === 'Izin' ? izinCount : alpaCount;
                            return React.createElement('div', {
                                key: item,
                                className: `flex items-center px-2 py-1 flex-1 ${index < arr.length - 1 ? 'border-b border-black' : ''}`
                            },
                                React.createElement('span', { className: 'w-28' }, item),
                                React.createElement('span', { className: 'px-1' }, ':'),
                                React.createElement('span', { className: 'flex-1 text-left' }, `${value} hari`)
                            )
                        })
                    )
                ),
                showNotes && React.createElement('div', { className: 'border-2 border-black p-2', style: { fontSize: '10pt', width: '11.5cm' } },
                    React.createElement('div', { className: 'font-bold mb-1' }, 'Catatan Wali Kelas'),
                    React.createElement('div', { className: 'min-h-[3rem]' }, studentNoteContent)
                )
            ),
            showDecision && React.createElement('div', { ref: decisionRef, className: 'mt-1' }, renderDecision()),
            showParentFeedback && React.createElement('div', { ref: parentFeedbackRef, className: 'mt-1' },
                React.createElement('div', { className: 'border-2 border-black p-2', style: { fontSize: '10pt' } },
                    React.createElement('div', { className: 'font-bold mb-1' }, 'Tanggapan Orang Tua/Wali Murid'),
                    React.createElement('div', { style: { minHeight: '1.5cm' } })
                )
            ),
            showParentTeacherSignature && React.createElement('div', { ref: signaturesRef, className: 'mt-1 flex justify-between', style: { fontSize: '12pt' } },
                React.createElement('div', { className: 'text-center' }, React.createElement('div', null, 'Mengetahui:'), React.createElement('div', null, 'Orang Tua/Wali,'), React.createElement('div', { className: 'h-12' }), React.createElement('div', null, '.........................')),
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`), 
                    React.createElement('div', null, 'Wali Kelas,'), 
                    React.createElement('div', { className: 'h-12' }), 
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'), 
                    React.createElement('div', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
            showHeadmasterSignature && React.createElement('div', { ref: headmasterRef, className: 'mt-1 flex justify-center text-center', style: { fontSize: '12pt' } }, React.createElement('div', null, React.createElement('div', null, 'Mengetahui,'), React.createElement('div', null, 'Kepala Sekolah,'), React.createElement('div', { className: 'h-12' }), React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'), React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)))
        )
    );
});


const PageFooter = ({ student, settings, currentPage }) => {
    const className = settings.nama_kelas || '';
    const studentName = student.namaLengkap || '';
    const nisn = student.nisn || '-';

    return (
        React.createElement('div', { 
            className: "absolute left-[1.5cm] right-[1.5cm] font-times", 
            style: { 
                bottom: `${PAGE_BOTTOM_MARGIN_CM}cm`,
                fontSize: '10pt',
                height: `${PAGE_NUMBER_FOOTER_HEIGHT_CM}cm`,
            }
        },
            React.createElement('div', { className: "border-t border-slate-400 mb-2" }),
            React.createElement('div', { className: "flex justify-between items-center" },
                React.createElement('div', null,
                    `${className} | ${studentName} | ${nisn}`
                ),
                React.createElement('div', null,
                    `Halaman ${currentPage}`
                )
            )
        )
    );
};


const ReportPagesForStudent = ({ student, settings, pageStyle, selectedPages, paperSize, rank, rankingOption, hideGradesForFaseA, ...restProps }) => {
    const { grades, subjects, learningObjectives, attendance, notes, extracurriculars, studentExtracurriculars, cocurricularData } = restProps;
    const gradeData = grades.find(g => g.studentId === student.id);
    const [academicPageChunks, setAcademicPageChunks] = useState(null);

    const studentInfoRef = useRef(null);
    const tableHeaderRef = useRef(null);
    const tableBodyRef = useRef(null);
    const cocurricularRef = useRef(null);
    const extraRef = useRef(null);
    const attendanceAndNotesRef = useRef(null);
    const decisionRef = useRef(null);
    const parentFeedbackRef = useRef(null);
    const signaturesRef = useRef(null);
    const headmasterRef = useRef(null);
    const cmRef = useRef(null);
    const [cmToPx, setCmToPx] = useState(0);

    const shouldDisplayRank = useMemo(() => rank && rankingOption !== 'none' && (
        (rankingOption === 'top3' && rank <= 3) ||
        (rankingOption === 'top10' && rank <= 10)
    ), [rank, rankingOption]);

    const notesForMeasurement = useMemo(() => {
        if (shouldDisplayRank) {
            const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);
            const rankMessage = `Selamat! ${nickname} berhasil meraih Peringkat ${rank} di kelas. `;
            const originalNote = notes[student.id] || '';
            return {
                ...notes,
                [student.id]: rankMessage + originalNote
            };
        }
        return notes;
    }, [shouldDisplayRank, student, rank, notes]);

    useEffect(() => {
        if (cmRef.current) {
            setCmToPx(cmRef.current.offsetHeight);
        }
    }, [cmRef.current]);

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

    useEffect(() => {
        if (!selectedPages.academic) {
            setAcademicPageChunks([]);
            return;
        }
        if (cmToPx === 0) return;

        setAcademicPageChunks(null); // Set to null to trigger measurement render

        const calculateChunks = () => {
            // FIX: Only wait for mandatory refs. Optional refs (like extraRef) might legitimately be null if data is empty.
            // If we wait for them, we get an infinite loop.
            const mandatoryRefs = [studentInfoRef, tableHeaderRef, tableBodyRef];
            
            if (mandatoryRefs.some(ref => !ref.current)) {
                // If any mandatory ref is not ready, retry
                setTimeout(calculateChunks, 50);
                return;
            }

            const SAFETY_MARGIN_PX = 30; // Increased to be safer (was 5, now ~8mm visually)
            const pageHeightPx = parseFloat(PAPER_SIZES[paperSize].height) * cmToPx;
            const firstPageAvailableHeight = pageHeightPx - (HEADER_HEIGHT_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx) - SAFETY_MARGIN_PX;
            const subsequentPageAvailableHeight = pageHeightPx - (PAGE_TOP_MARGIN_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx) - SAFETY_MARGIN_PX;

            const allItems = [];
            
            const rowHeights = Array.from(tableBodyRef.current.children).map(row => row.getBoundingClientRect().height);
            reportSubjects.forEach((subject, index) => {
                allItems.push({ type: 'academic', content: subject, height: rowHeights[index] });
            });

            // Calculate if there are active extras for this student
            const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
            const hasExtras = (studentExtraData?.assignedActivities || []).some(id => id && extracurriculars.some(e => e.id === id));

            const footerItems = [
                { type: 'cocurricular', ref: cocurricularRef },
                hasExtras ? { type: 'extra', ref: extraRef } : null,
                { type: 'attendanceAndNotes', ref: attendanceAndNotesRef },
                { type: 'decision', ref: decisionRef },
                { type: 'parentFeedback', ref: parentFeedbackRef },
                { type: 'signatures', ref: signaturesRef },
                { type: 'headmaster', ref: headmasterRef }
            ].filter(Boolean);

            footerItems.forEach(item => {
                const element = item.ref.current;
                if (element) {
                    const height = element.getBoundingClientRect().height;
                    const style = window.getComputedStyle(element);
                    const marginTop = parseFloat(style.marginTop);
                    const marginBottom = parseFloat(style.marginBottom);
                    if (height > 0) {
                         allItems.push({ type: item.type, height: height + marginTop + marginBottom });
                    }
                }
            });

            const allChunks = [];
            if (allItems.length === 0) {
                setAcademicPageChunks([[]]);
                return;
            }

            let currentItemIndex = 0;
            let isFirstPage = true;
            
            // Fixed buffer to ensure space between last academic item and footer items
            const ITEM_SPACING_BUFFER = 10; // Increased spacing (was 5)

            while (currentItemIndex < allItems.length) {
                let currentChunk = [];
                const availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight;
                let heightUsed = isFirstPage ? studentInfoRef.current.getBoundingClientRect().height : 0;
                
                const hasAcademicItemsRemaining = allItems.slice(currentItemIndex).some(item => item.type === 'academic');
                if (hasAcademicItemsRemaining) {
                    heightUsed += tableHeaderRef.current.getBoundingClientRect().height;
                    heightUsed += 5; // Add buffer for table margin-top
                }

                for (let i = currentItemIndex; i < allItems.length; i++) {
                    const item = allItems[i];
                    
                    // Add buffer if we are transitioning from academic table to footer section on the same page
                    // This accounts for margins that might not be captured in individual item heights
                    let spacingBuffer = 0;
                    if (currentChunk.length > 0) {
                        const lastItem = currentChunk[currentChunk.length - 1];
                        if (lastItem.type === 'academic' && item.type !== 'academic') {
                            spacingBuffer = ITEM_SPACING_BUFFER;
                        }
                    }

                    if (heightUsed + item.height + spacingBuffer <= availableHeight) {
                        currentChunk.push(item);
                        heightUsed += (item.height + spacingBuffer);
                    } else {
                        break;
                    }
                }

                if (currentChunk.length === 0 && currentItemIndex < allItems.length) {
                    currentChunk.push(allItems[currentItemIndex]);
                }

                currentItemIndex += currentChunk.length;
                allChunks.push(currentChunk);
                isFirstPage = false;
            }
             setAcademicPageChunks(allChunks);
        };
        
        const timer = setTimeout(calculateChunks, 100);
        return () => clearTimeout(timer);

    }, [reportSubjects, paperSize, selectedPages.academic, student.id, cmToPx, shouldDisplayRank]);


    if (academicPageChunks === null && selectedPages.academic) {
        // Render the measurement layout
        return React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
            React.createElement('div', { 
                className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 
                style: { ...pageStyle, visibility: 'hidden', position: 'absolute', zIndex: -1 } 
            },
                 React.createElement('div', { className: 'absolute flex flex-col', style: {
                    top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${REPORT_CONTENT_BOTTOM_OFFSET_CM}cm`, fontSize: '10.5pt'
                } },
                    React.createElement(ReportStudentInfo, { student, settings, ref: studentInfoRef }),
                    React.createElement(AcademicTable, { subjectsToRender: reportSubjects, ref: tableBodyRef, headerRef: tableHeaderRef, hideGradesForFaseA: hideGradesForFaseA }),
                    React.createElement(ReportFooterContent, { 
                        student, settings, attendance, notes: notesForMeasurement, studentExtracurriculars, extracurriculars, cocurricularData,
                        rank: rank, rankingOption: rankingOption,
                        showCocurricular: true, showExtra: true, showNotes: true, showAttendance: true, showDecision: true,
                        showParentFeedback: true, showParentTeacherSignature: true, showHeadmasterSignature: true,
                        ref: { cocurricularRef, extraRef, attendanceAndNotesRef, decisionRef, parentFeedbackRef, signaturesRef, headmasterRef }
                    })
                )
            )
        );
    }
    
    let academicPageCounter = 0;

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
            selectedPages.cover && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'cover', style: pageStyle },
                React.createElement(CoverPage, { student: student, settings: settings })
            ),
            selectedPages.schoolIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: { position: 'absolute', top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${PAGE_BOTTOM_MARGIN_CM}cm` } },
                    React.createElement(SchoolIdentityPage, { settings: settings })
                )
            ),
            selectedPages.studentIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: { position: 'absolute', top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${PAGE_BOTTOM_MARGIN_CM}cm` } },
                    React.createElement(StudentIdentityPage, { student: student, settings: settings })
                )
            ),
            selectedPages.academic && academicPageChunks?.map((chunk, pageIndex) => {
                if (chunk.length === 0) return null;

                academicPageCounter++;
                const isFirstAcademicPage = pageIndex === 0;
                const contentTopCm = isFirstAcademicPage ? HEADER_HEIGHT_CM : PAGE_TOP_MARGIN_CM;
                
                const academicItemsInChunk = chunk.filter(item => item.type === 'academic').map(item => item.content);
                const hasAcademicItems = academicItemsInChunk.length > 0;
                
                let startingIndex = 1;
                for (let i = 0; i < pageIndex; i++) {
                    startingIndex += academicPageChunks[i].filter(item => item.type === 'academic').length;
                }

                const chunkItemTypes = new Set(chunk.map(item => item.type));
                const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');


                return React.createElement('div', { key: `academic-${student.id}-${pageIndex}`, className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: pageStyle },
                    isFirstAcademicPage && React.createElement(ReportHeader, { settings: settings }),
                    
                    React.createElement('div', { className: 'absolute flex flex-col', style: {
                        top: `${contentTopCm}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${REPORT_CONTENT_BOTTOM_OFFSET_CM}cm`, fontSize: '10.5pt',
                    }},
                        isFirstAcademicPage && React.createElement(ReportStudentInfo, { student, settings }),
                        hasAcademicItems && React.createElement(AcademicTable, { subjectsToRender: academicItemsInChunk, startingIndex: startingIndex, hideGradesForFaseA: hideGradesForFaseA }),
                        React.createElement(ReportFooterContent, { 
                            student, settings, attendance, notes, studentExtracurriculars, extracurriculars, cocurricularData,
                            rank: rank, rankingOption: rankingOption,
                            showCocurricular: chunkItemTypes.has('cocurricular'),
                            showExtra: chunkItemTypes.has('extra'),
                            showNotes: chunkItemTypes.has('attendanceAndNotes'),
                            showAttendance: chunkItemTypes.has('attendanceAndNotes'),
                            showDecision: chunkItemTypes.has('decision') && isSemesterGenap,
                            showParentFeedback: chunkItemTypes.has('parentFeedback'),
                            showParentTeacherSignature: chunkItemTypes.has('signatures'),
                            showHeadmasterSignature: chunkItemTypes.has('headmaster'),
                        })
                    ),
                    
                    React.createElement(PageFooter, { student: student, settings: settings, currentPage: academicPageCounter })
                );
            })
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
    const { grades, subjects } = restProps;
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [rankingOption, setRankingOption] = useState('none');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
    });
    const [isPrinting, setIsPrinting] = useState(false);
    const [hideGradesForFaseA, setHideGradesForFaseA] = useState(true);

    const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);
    const isFaseA = useMemo(() => gradeNumber === 1 || gradeNumber === 2, [gradeNumber]);

    const studentRanks = useMemo(() => {
        if (rankingOption === 'none' || !students.length || !grades.length || !subjects.length) {
            return new Map();
        }

        const allActiveSubjects = subjects.filter(s => s.active);

        const studentsWithTotals = students.map(student => {
            const gradeData = grades.find(g => g.studentId === student.id);
            if (!gradeData || !gradeData.finalGrades) {
                return { studentId: student.id, totalScore: 0 };
            }

            const studentReligion = student.agama?.trim().toLowerCase();
            
            const totalScore = Object.entries(gradeData.finalGrades)
                .reduce((sum, [subjectId, score]) => {
                    const subjectInfo = allActiveSubjects.find(s => s.id === subjectId);
                    if (subjectInfo && typeof score === 'number') {
                        if (subjectInfo.fullName.startsWith('Pendidikan Agama')) {
                            if (studentReligion && subjectInfo.fullName.toLowerCase().includes(`(${studentReligion})`)) {
                                return sum + score;
                            }
                            return sum; 
                        }
                        return sum + score;
                    }
                    return sum;
                }, 0);
            
            return { studentId: student.id, totalScore };
        });

        const sortedStudents = studentsWithTotals.sort((a, b) => b.totalScore - a.totalScore);

        const ranksMap = new Map();
        if (sortedStudents.length > 0) {
            let currentRank = 1;
            ranksMap.set(sortedStudents[0].studentId, currentRank);
            for (let i = 1; i < sortedStudents.length; i++) {
                if (sortedStudents[i].totalScore < sortedStudents[i - 1].totalScore) {
                    currentRank = i + 1;
                }
                if (sortedStudents[i].totalScore > 0) {
                    ranksMap.set(sortedStudents[i].studentId, currentRank);
                }
            }
        }
        
        return ranksMap;
    }, [rankingOption, students, grades, subjects]);

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
    
    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');

        const paperSizeCss = {
            A4: 'size: A4 portrait;',
            F4: 'size: 21.5cm 33cm portrait;',
            Letter: 'size: letter portrait;',
            Legal: 'size: legal portrait;',
        }[paperSize];

        const style = document.createElement('style');
        style.id = 'print-page-style';
        style.innerHTML = `@page { ${paperSizeCss} margin: 0; }`;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            document.getElementById('print-page-style')?.remove();
            setIsPrinting(false);
        }, 500);
    };

    const studentsToRender = useMemo(() => {
        if (selectedStudentId === 'all') {
            return students;
        }
        return students.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId]);
    
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
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk mencetak.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'rankingSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Tampilkan Peringkat'),
                            React.createElement('select', { 
                                id: "rankingSelector",
                                value: rankingOption,
                                onChange: (e) => setRankingOption(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "none" }, "Tidak Tampilkan"),
                                React.createElement('option', { value: "top3" }, "Peringkat 1-3"),
                                React.createElement('option', { value: "top10" }, "Peringkat 1-10")
                            )
                        ),
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
                            disabled: isPrinting,
                            className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        }, isPrinting ? 'Mempersiapkan...' : 'Cetak Rapor (Print)')
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('div', { className: "flex flex-wrap items-center gap-x-6 gap-y-2" },
                        React.createElement('div', null,
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
                        ),
                         isFaseA && (
                            React.createElement('div', { className: "pl-6 border-l" },
                                React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Opsi Fase A:"),
                                React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                                    React.createElement('label', { className: "flex items-center space-x-2" },
                                        React.createElement('input', { 
                                            type: "checkbox", 
                                            name: "hideGrades",
                                            checked: hideGradesForFaseA, 
                                            onChange: e => setHideGradesForFaseA(e.target.checked),
                                            className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" 
                                        }),
                                        React.createElement('span', { className: "text-sm" }, "Sembunyikan Nilai Angka")
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                studentsToRender.map(student => {
                    const rank = studentRanks.get(student.id);
                    return React.createElement(ReportPagesForStudent, { 
                        key: student.id, 
                        student: student, 
                        settings: settings,
                        pageStyle: pageStyle,
                        selectedPages: selectedPages,
                        paperSize: paperSize,
                        rank: rank,
                        rankingOption: rankingOption,
                        hideGradesForFaseA: isFaseA && hideGradesForFaseA,
                        ...restProps
                    })
                })
            )
        )
    );
};

export default PrintRaporPage;

