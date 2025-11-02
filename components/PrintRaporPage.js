import React, { useState } from 'react';
import { transliterate, generatePemdaText, expandAndCapitalizeSchoolName } from './TransliterationUtil.js';

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

const generateInitialLayout = (appSettings) => {
    const pemdaText = generatePemdaText(appSettings.kota_kabupaten, appSettings.provinsi);
    const dinasDetailText = (appSettings.nama_dinas_pendidikan || "DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA KOTA DENPASAR").toUpperCase();
    const sekolahText = expandAndCapitalizeSchoolName(appSettings.nama_sekolah || "SEKOLAH DASAR NEGERI 2 PADANGSAMBIAN");
    
    const alamatText = appSettings.alamat_sekolah || "Kebo Iwa Banjar Batuparas";

    const telpText = appSettings.telepon_sekolah ? `Telepon: ${appSettings.telepon_sekolah}` : "Telepon: (0361) 9093558";
    const alamatTelpText = [alamatText, telpText].filter(Boolean).join(', ');

    const contactLine2 = [
        appSettings.kode_pos ? `Kode Pos: ${appSettings.kode_pos}` : null,
        appSettings.email_sekolah ? `Email: ${appSettings.email_sekolah}` : null,
        appSettings.website_sekolah ? `Website: ${appSettings.website_sekolah}` : null,
        appSettings.faksimile ? `Faksimile: ${appSettings.faksimile}` : null,
    ].filter(Boolean).join(' | ');

    return [
        // Logos
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 45, width: 85, height: 85 },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 695, y: 45, width: 85, height: 85 },
        
        // Block 1: Pemda
        { id: 'aksara_dinas_text', type: 'text', content: transliterate(pemdaText), x: 120, y: 18, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_text', type: 'text', content: pemdaText, x: 120, y: 34, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        // Block 2: Dinas Detail
        { id: 'aksara_dinas_detail_text', type: 'text', content: transliterate(dinasDetailText), x: 120, y: 52, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_detail_text', type: 'text', content: dinasDetailText, x: 120, y: 68, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        // Block 3: School
        { id: 'aksara_sekolah_text', type: 'text', content: transliterate(sekolahText), x: 120, y: 88, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 17, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_sekolah_text', type: 'text', content: sekolahText, x: 120, y: 108, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },

        // Block 4: Address & Contact
        { id: 'aksara_alamat_telp_text', type: 'text', content: transliterate(alamatTelpText), x: 120, y: 130, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_alamat_telp_text', type: 'text', content: alamatTelpText, x: 120, y: 143, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        { id: 'latin_kontak_lainnya_text', type: 'text', content: contactLine2, x: 120, y: 155, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        
        // Separator Line
        { id: 'line_1', type: 'line', content: '', x: 10, y: 172, width: 780, height: 3 },
    ];
};

const placeholderSvg = "data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e2e8f0%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ELogo%3C/text%3E%3C/svg%3E";

const KopSurat = ({ settings }) => {
    // NOTE: For printing, we cannot run the transliteration util.
    // The layout from settings should already have the transliterated text.
    // If not, it will be blank, which is the expected fallback.
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "relative w-full h-[180px]" },
            React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 180", preserveAspectRatio: "xMidYMin meet", className: "absolute top-0 left-0" },
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
                        const isBalinese = el.fontFamily === 'Noto Sans Balinese';
                        return (
                            React.createElement('text', {
                                key: el.id,
                                x: xPos,
                                y: el.y + (el.fontSize ?? 14),
                                fontSize: el.fontSize,
                                fontWeight: el.fontWeight,
                                textAnchor: textAnchor,
                                fontFamily: isBalinese ? '"Noto Sans Balinese", sans-serif' : '"Poppins", sans-serif',
                                className: isBalinese ? 'font-aksara-bali' : ''
                            }, el.content)
                        );
                    }
                    if (el.type === 'image') {
                        const imageUrl = String(settings[el.content] || placeholderSvg);
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
    );
};

const IdentitasSiswa = ({ student, settings }) => (
    React.createElement('div', { className: 'text-xs' },
        React.createElement('h2', { className: 'text-center font-bold text-sm mb-2 uppercase' }, 'Laporan Hasil Belajar'),
        React.createElement('table', { className: 'w-full' },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: 'w-1/4' }, 'Nama Sekolah'),
                    React.createElement('td', { className: 'w-1/2' }, `: ${settings.nama_sekolah || ''}`),
                    React.createElement('td', { className: 'w-1/8' }, 'Kelas'),
                    React.createElement('td', { className: 'w-1/8' }, `: ${settings.nama_kelas || ''}`)
                ),
                React.createElement('tr', null,
                    React.createElement('td', null, 'Alamat'),
                    React.createElement('td', null, `: ${settings.alamat_sekolah || ''}`),
                    React.createElement('td', null, 'Semester'),
                    React.createElement('td', null, `: ${settings.semester || ''}`)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: 'font-bold pt-2' }, 'Nama Peserta Didik'),
                    React.createElement('td', { className: 'font-bold pt-2' }, `: ${student.namaLengkap || ''}`),
                    React.createElement('td', null, 'Tahun Ajaran'),
                    React.createElement('td', null, `: ${settings.tahun_ajaran || ''}`)
                ),
                React.createElement('tr', null,
                    React.createElement('td', null, 'NIS / NISN'),
                    React.createElement('td', null, `: ${student.nis || ''} / ${student.nisn || ''}`)
                )
            )
        )
    )
);

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
    const defaultReturn = { highest: '', lowest: '' };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) {
        return { ...defaultReturn, highest: "Nama kelas belum diatur." };
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
        return { ...defaultReturn, highest: "Tujuan Pembelajaran belum diisi." };
    }

    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    const gradedTps = objectivesForSubject
        .map((text, index) => ({ text, score: detailedGrade?.tp?.[index] }))
        .filter(tp => typeof tp.score === 'number' && tp.score !== null);
    
    if (gradedTps.length < 2) {
        return { ...defaultReturn, highest: "Isi nilai untuk minimal 2 TP terlebih dahulu." };
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        const firstTp = gradedTps[0];
        const secondTp = gradedTps[1];
        const firstTpText = lowercaseFirst(firstTp.text);
        const secondTpText = lowercaseFirst(secondTp.text);
        return { 
            highest: `${studentName} menunjukkan penguasaan yang sangat baik dalam ${firstTpText}`,
            lowest: `${studentName} perlu bimbingan dalam ${secondTpText}` 
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
            const highestTpText = lowercaseFirst(highestTp.text);
            const lowestTpText = lowercaseFirst(lowestTp.text);
            return { 
                highest: `${studentName} menunjukkan penguasaan yang sangat baik dalam ${highestTpText}`,
                lowest: `${studentName} perlu bimbingan dalam ${lowestTpText}`
            };
        }
    }

    return { highest: "Tidak dapat membuat deskripsi.", lowest: "" };
};


const MainReportPage = ({ student, settings, grades, subjects, learningObjectives, extracurriculars, studentExtracurriculars, attendance, notes }) => {
    const gradeData = grades.find(g => g.studentId === student.id);
    const attendanceData = attendance.find(a => a.studentId === student.id);
    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    const studentNote = notes[student.id] || '';

    const reportSubjects = React.useMemo(() => {
        const result = [];
        const processedGroups = new Set();
        const processedSubjects = new Set();

        const allActiveSubjects = subjects.filter(s => s.active);

        const subjectOrder = [
            { name: 'Pendidikan Agama dan Budi Pekerti', type: 'group', key: 'PABP' },
            { name: 'Pendidikan Pancasila', type: 'individual' },
            { name: 'Bahasa Indonesia', type: 'individual' },
            { name: 'Matematika', type: 'individual' },
            { name: 'Ilmu Pengetahuan Alam dan Sosial', type: 'individual' },
            { name: 'Seni Budaya', type: 'group', key: 'SB' },
            { name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', type: 'individual' },
            { name: 'Bahasa Inggris', type: 'individual' },
            { name: 'Muatan Lokal', type: 'group', key: 'Mulok' },
        ];

        subjectOrder.forEach(orderItem => {
            if (orderItem.type === 'group') {
                if (processedGroups.has(orderItem.key)) return;

                let subjectForDesc = null;
                let grade = null;
                const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(orderItem.name));

                if (orderItem.key === 'PABP') {
                    const studentReligion = student.agama?.trim().toLowerCase();
                    const religionSubject = groupSubjects.find(s => {
                        const startIndex = s.fullName.indexOf('(');
                        const endIndex = s.fullName.indexOf(')');
                        if (startIndex !== -1 && endIndex > startIndex + 1) {
                            const subjectReligion = s.fullName.substring(startIndex + 1, endIndex).trim().toLowerCase();
                            return subjectReligion === studentReligion;
                        }
                        return false;
                    });
                    
                    if (religionSubject) {
                        subjectForDesc = religionSubject;
                        grade = gradeData?.finalGrades?.[religionSubject.id];
                        groupSubjects.forEach(s => processedSubjects.add(s.id));
                    }
                } else { // SB or Mulok
                    const gradedSubject = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null);
                    
                    if (gradedSubject) {
                        subjectForDesc = gradedSubject;
                        grade = gradeData?.finalGrades?.[gradedSubject.id];
                        groupSubjects.forEach(s => processedSubjects.add(s.id));
                    }
                }

                if (subjectForDesc) {
                    const description = generateDescription(student, subjectForDesc, gradeData, learningObjectives, settings);
                    result.push({ subject: { ...subjectForDesc, fullName: orderItem.name }, grade, description });
                    processedGroups.add(orderItem.key);
                }
            } else { // individual
                const subject = allActiveSubjects.find(s => s.fullName === orderItem.name);
                if (subject && !processedSubjects.has(subject.id)) {
                    const grade = gradeData?.finalGrades?.[subject.id];
                    const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                    result.push({ subject, grade, description });
                    processedSubjects.add(subject.id);
                }
            }
        });

        allActiveSubjects.forEach(subject => {
            if (!processedSubjects.has(subject.id)) {
                const isGrouped = subjectOrder.some(orderItem => orderItem.type === 'group' && subject.fullName.startsWith(orderItem.name) && processedGroups.has(orderItem.key));
                if (!isGrouped) {
                    const grade = gradeData?.finalGrades?.[subject.id];
                    const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                    result.push({ subject, grade, description });
                    processedSubjects.add(subject.id);
                }
            }
        });

        return result;
    }, [student, subjects, gradeData, learningObjectives, settings]);
    
    return (
        React.createElement('div', { className: 'text-sm' },
            React.createElement(IdentitasSiswa, { student: student, settings: settings }),

            React.createElement('div', { className: 'mt-4' },
                React.createElement('table', { className: 'w-full border-collapse border border-black' },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: 'font-bold text-center bg-slate-200' },
                            React.createElement('td', { className: 'border border-black p-1 w-[5%] align-middle' }, 'No.'),
                            React.createElement('td', { className: 'border border-black p-1 w-[20%] align-middle' }, 'Mata Pelajaran'),
                            React.createElement('td', { className: 'border border-black p-1 w-[8%] align-middle' }, 'Nilai Akhir'),
                            React.createElement('td', { className: 'border border-black p-1 w-[67%] align-middle' }, 'Capaian Kompetensi')
                        )
                    ),
                    React.createElement('tbody', null,
                        reportSubjects.map(({ subject, grade, description }, index) => (
                            React.createElement('tr', { key: subject.id },
                                React.createElement('td', { className: 'border border-black p-1 text-center' }, index + 1),
                                React.createElement('td', { className: 'border border-black p-1' }, subject.fullName),
                                React.createElement('td', { className: 'border border-black p-1 text-center' }, grade ?? ''),
                                React.createElement('td', { className: 'border border-black align-top' },
                                    React.createElement('div', { className: 'p-1' }, 
                                        React.createElement('div', null, description.highest)
                                    ),
                                    description.lowest && React.createElement('div', { className: 'p-1 border-t border-black' }, 
                                        React.createElement('div', null, description.lowest)
                                    )
                                )
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { className: 'mt-4' },
                React.createElement('table', { className: 'w-full border-collapse border border-black' },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: 'font-bold text-center bg-slate-200' },
                            React.createElement('td', { className: 'border border-black p-1 w-[5%] align-middle' }, 'No'),
                            React.createElement('td', { className: 'border border-black p-1 w-[30%] align-middle' }, 'Kegiatan Ekstrakurikuler'),
                            React.createElement('td', { className: 'border border-black p-1 w-[65%] align-middle' }, 'Keterangan')
                        )
                    ),
                    React.createElement('tbody', null,
                         (studentExtraData?.assignedActivities || []).filter(id => id).map((activityId, index) => {
                            const activity = extracurriculars.find(e => e.id === activityId);
                            const description = studentExtraData.descriptions?.[activityId] || '';
                            return (
                                React.createElement('tr', { key: index },
                                    React.createElement('td', { className: 'border border-black p-1 text-center' }, index + 1),
                                    React.createElement('td', { className: 'border border-black p-1' }, activity?.name || ''),
                                    React.createElement('td', { className: 'border border-black p-1' }, description)
                                )
                            )
                        })
                    )
                )
            ),

            React.createElement('div', { className: 'mt-4' },
                React.createElement('table', { className: 'w-full border-collapse border border-black' },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: 'font-bold bg-slate-200' },
                            React.createElement('td', { className: 'border border-black p-1 w-1/2' }, 'Ketidakhadiran'),
                            React.createElement('td', { className: 'border border-black p-1 w-1/2' }, 'Catatan Wali Kelas')
                        )
                    ),
                    React.createElement('tbody', null,
                        React.createElement('tr', null,
                            React.createElement('td', { className: 'border border-black p-1 align-top' },
                                React.createElement('table', { className: 'w-full' },
                                    React.createElement('tbody', null,
                                        React.createElement('tr', null, 
                                            React.createElement('td', { className: 'p-1 w-2/3' }, 'Sakit'), 
                                            React.createElement('td', { className: 'p-1' }, `: ${attendanceData?.sakit || 0} hari`)
                                        ),
                                        React.createElement('tr', null, 
                                            React.createElement('td', { className: 'p-1' }, 'Izin'), 
                                            React.createElement('td', { className: 'p-1' }, `: ${attendanceData?.izin || 0} hari`)
                                        ),
                                        React.createElement('tr', null, 
                                            React.createElement('td', { className: 'p-1' }, 'Tanpa Keterangan'), 
                                            React.createElement('td', { className: 'p-1' }, `: ${attendanceData?.alpa || 0} hari`)
                                        )
                                    )
                                )
                            ),
                            React.createElement('td', { className: 'border border-black p-2 align-top italic h-[92px]' }, studentNote)
                        )
                    )
                )
            ),

            React.createElement('div', { className: 'mt-8 flex justify-between' },
                React.createElement('div', { className: 'text-center' },
                    React.createElement('p', null, 'Mengetahui,'),
                    React.createElement('p', null, 'Orang Tua/Wali'),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('p', { className: 'font-bold' }, '.........................')
                ),
                React.createElement('div', { className: 'text-center' },
                    React.createElement('p', null, settings.tanggal_rapor || '_________________'),
                    React.createElement('p', null, 'Wali Kelas'),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('p', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
             React.createElement('div', { className: 'mt-8 flex justify-center text-center' },
                 React.createElement('div', null,
                    React.createElement('p', null, 'Mengetahui,'),
                    React.createElement('p', null, 'Kepala Sekolah'),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('p', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                )
             )
        )
    );
};

const P5ReportPage = ({ student, settings, project, assessments, allProjects }) => {
    const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === project.id);
    const projectIndex = allProjects.findIndex(p => p.id === project.id);
    
    return (
        React.createElement('div', { className: 'text-sm' },
            React.createElement('div', { className: 'text-center font-bold mb-4' },
                React.createElement('h2', { className: 'text-sm' }, 'LAPORAN PROJEK PENGUATAN PROFIL PELAJAR PANCASILA')
            ),
            React.createElement('table', { className: 'w-full text-xs mb-4' },
                React.createElement('tbody', null,
                    React.createElement('tr', null,
                        React.createElement('td', { className: 'w-1/4' }, 'Nama Sekolah'),
                        React.createElement('td', { className: 'w-1/2' }, `: ${settings.nama_sekolah || ''}`),
                        React.createElement('td', { className: 'w-1/8' }, 'Kelas'),
                        React.createElement('td', { className: 'w-1/8' }, `: ${settings.nama_kelas}`)
                    ),
                    React.createElement('tr', null,
                        React.createElement('td', null, 'Alamat'),
                        React.createElement('td', null, `: ${settings.alamat_sekolah}`),
                        React.createElement('td', null, 'Fase'),
                        React.createElement('td', null, `: B`)
                    ),
                     React.createElement('tr', null,
                        React.createElement('td', { className: 'font-bold' }, 'Nama Siswa'),
                        React.createElement('td', { className: 'font-bold' }, `: ${student.namaLengkap}`),
                        React.createElement('td', null, 'Tahun Ajaran'),
                        React.createElement('td', null, `: ${settings.tahun_ajaran}`)
                    ),
                    React.createElement('tr', null,
                        React.createElement('td', null, 'NISN'),
                        React.createElement('td', null, `: ${student.nisn}`)
                    )
                )
            ),
            
            React.createElement('div', { className: 'border border-black p-2' },
                React.createElement('p', { className: 'font-bold' }, `Proyek ${projectIndex !== -1 ? projectIndex + 1 : ''}: ${project.title}`),
                React.createElement('p', { className: 'italic' }, project.description)
            ),
            
            React.createElement('table', { className: 'w-full border-collapse border border-black mt-4' },
                React.createElement('thead', null,
                    React.createElement('tr', { className: 'font-bold text-center bg-slate-200' },
                        React.createElement('td', { className: 'border border-black p-1 align-middle' }, 'Dimensi'),
                        React.createElement('td', { className: 'border border-black p-1 align-middle' }, 'Sub Elemen'),
                        React.createElement('td', { className: 'border border-black p-1 align-middle' }, 'Capaian')
                    )
                ),
                React.createElement('tbody', null,
                    project.dimensions.map((dim, dimIndex) => (
                        dim.subElements.map((sub, subIndex) => {
                            const subElementKey = `${dim.name}|${sub.name}`;
                            const assessment = studentAssessments?.assessments[subElementKey] || '';
                            let assessmentIndicator = '';
                            if (assessment === 'Belum Berkembang') assessmentIndicator = 'BB';
                            else if (assessment === 'Mulai Berkembang') assessmentIndicator = 'MB';
                            else if (assessment === 'Berkembang sesuai Harapan') assessmentIndicator = 'BSH';
                            else if (assessment === 'Sangat Berkembang') assessmentIndicator = 'SB';

                            return (
                                React.createElement('tr', { key: subElementKey },
                                    subIndex === 0 && React.createElement('td', { rowSpan: dim.subElements.length, className: 'border border-black p-1 font-bold align-top' }, dim.name),
                                    React.createElement('td', { className: 'border border-black p-1' }, sub.name),
                                    React.createElement('td', { className: 'border border-black p-1 text-center font-bold' }, assessmentIndicator)
                                )
                            )
                        })
                    ))
                )
            ),

            React.createElement('div', { className: 'mt-4' },
                React.createElement('p', { className: 'font-bold' }, 'Catatan Proses:'),
                React.createElement('div', { className: 'border border-black p-2 mt-1 h-24' }, `Ananda ${student.namaPanggilan || student.namaLengkap.split(' ')[0]} telah menunjukkan perkembangan yang ${studentAssessments ? 'baik' : 'cukup'} dalam mengikuti kegiatan proyek ini.`)
            ),

            React.createElement('div', { className: 'mt-8 flex justify-end text-center' },
                React.createElement('div', null,
                    React.createElement('p', null, settings.tanggal_rapor || '_________________'),
                    React.createElement('p', null, 'Wali Kelas'),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('br', null),
                    React.createElement('p', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            )
        )
    );
};

const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.6cm', height: '27.9cm' },
    Legal: { width: '21.6cm', height: '35.6cm' },
};

const PrintRaporPage = ({ students, settings, showToast, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    
    const handlePrint = () => {
        const studentToPrint = document.getElementById('studentSelector').value;
        const allPages = document.querySelectorAll('.report-page');
        allPages.forEach(page => page.style.display = 'none');
        if (studentToPrint === 'all') {
            allPages.forEach(page => page.style.display = 'block');
        } else {
            const studentPages = document.querySelectorAll(`.report-page[data-student-id="${studentToPrint}"]`);
            studentPages.forEach(page => page.style.display = 'block');
        }
        window.print();
        allPages.forEach(page => page.style.display = 'block');
    };
    
    const { p5Projects } = restProps;

    const pageStyle = {
        padding: '1.5cm',
        width: PAPER_SIZES[paperSize].width,
        minHeight: PAPER_SIZES[paperSize].height,
    };

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden" },
                React.createElement('div', { className: "flex items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih siswa dan ukuran kertas, lalu klik tombol cetak untuk memulai.")
                    ),
                    React.createElement('div', { className: "flex items-center gap-4" },
                        React.createElement('div', null,
                             React.createElement('label', { htmlFor: "paperSizeSelector", className: "sr-only" }, "Ukuran Kertas"),
                             React.createElement('select', {
                                id: "paperSizeSelector",
                                value: paperSize,
                                onChange: (e) => setPaperSize(e.target.value),
                                className: "w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                             },
                                Object.entries(PAPER_SIZES).map(([key, { width, height }]) => (
                                    React.createElement('option', { key: key, value: key }, `${key} (${width} x ${height})`)
                                ))
                             )
                        ),
                        React.createElement('select', { id: "studentSelector", className: "w-64 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                            React.createElement('option', { value: "all" }, "Cetak Semua Siswa"),
                            students.map(s => React.createElement('option', { key: s.id, value: s.id }, s.namaLengkap))
                        ),
                        React.createElement('button', {
                            onClick: handlePrint,
                            className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                        }, "Cetak Rapor")
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                students.map(student => (
                    React.createElement(React.Fragment, { key: student.id },
                        React.createElement('div', { 
                            className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 
                            'data-student-id': student.id,
                            style: pageStyle
                        },
                            React.createElement(KopSurat, { settings: settings }),
                            React.createElement(MainReportPage, { student: student, settings: settings, ...restProps })
                        ),
                        p5Projects.map(project => (
                             React.createElement('div', { 
                                key: project.id, 
                                className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 
                                'data-student-id': student.id,
                                style: pageStyle
                            },
                                React.createElement(KopSurat, { settings: settings }),
                                React.createElement(P5ReportPage, { student: student, settings: settings, project: project, assessments: restProps.p5Assessments, allProjects: p5Projects })
                            )
                        ))
                    )
                ))
            )
        )
    );
};

export default PrintRaporPage;
