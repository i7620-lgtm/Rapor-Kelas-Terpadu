import React from 'react';

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
    return [
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 20, width: 80, height: 80 },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 690, y: 20, width: 80, height: 80 },
        { id: 'line_1', type: 'line', content: '', x: 10, y: 130, width: 780, height: 2 },
        { id: 'nama_dinas_pendidikan_text', type: 'text', content: appSettings.nama_dinas_pendidikan || "PEMERINTAH KOTA CONTOH", x: 120, y: 20, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 14 },
        { id: 'nama_sekolah_text', type: 'text', content: appSettings.nama_sekolah || "SEKOLAH DASAR NEGERI CONTOH", x: 120, y: 50, width: 550, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
        { id: 'alamat_sekolah_text', type: 'text', content: appSettings.alamat_sekolah || "Jalan Contoh No. 123", x: 120, y: 80, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
        { id: 'kontak_sekolah_text', type: 'text', content: `Telepon: ${appSettings.telepon_sekolah || ''} | Email: ${appSettings.email_sekolah || ''}`, x: 120, y: 100, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
    ];
};

const placeholderSvg = "data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e2e8f0%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ELogo%3C/text%3E%3C/svg%3E";

const KopSurat = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "relative w-full h-[135px]" },
            React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 135", preserveAspectRatio: "xMidYMin meet", className: "absolute top-0 left-0" },
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

const MainReportPage = ({ student, settings, grades, subjects, studentDescriptions, extracurriculars, studentExtracurriculars, attendance, notes }) => {
    const gradeData = grades.find(g => g.studentId === student.id);
    const attendanceData = attendance.find(a => a.studentId === student.id);
    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    const studentNote = notes[student.id] || '';

    const activeSubjects = subjects.filter(s => s.active);
    const predicateA = parseInt(settings.predikats?.a || '90', 10);
    const predicateB = parseInt(settings.predikats?.b || '80', 10);
    const predicateC = parseInt(settings.predikats?.c || '70', 10);
    
    const getPredicate = (grade) => {
        if (grade >= predicateA) return 'A';
        if (grade >= predicateB) return 'B';
        if (grade >= predicateC) return 'C';
        return 'D';
    };

    const getGroupedSubjects = (subjectsList) => {
        const groups = { PABP: [], SB: [], Mulok: [] };
        const others = [];
        subjectsList.forEach(s => {
            if (s.fullName.startsWith('Pendidikan Agama')) groups.PABP.push(s);
            else if (s.fullName.startsWith('Seni Budaya')) groups.SB.push(s);
            else if (s.fullName.startsWith('Muatan Lokal')) groups.Mulok.push(s);
            else others.push(s);
        });
        return { ...groups, others };
    };

    const groupedSubjects = getGroupedSubjects(activeSubjects);
    
    return (
        React.createElement('div', { className: 'p-8 text-sm' },
            React.createElement(IdentitasSiswa, { student: student, settings: settings }),
            
            React.createElement('div', { className: 'mt-4' },
                React.createElement('h3', { className: 'font-bold' }, 'A. Sikap'),
                React.createElement('div', { className: 'border border-black p-2 mt-1' },
                    React.createElement('p', null, 'Selama semester ini, Ananda ', React.createElement('b', null, student.namaPanggilan || student.namaLengkap.split(' ')[0]), ' menunjukkan sikap ', React.createElement('b', null, 'sangat baik'), ' dalam Sikap Spiritual dan Sosial. Ananda mampu menerapkan nilai-nilai kejujuran, kedisiplinan, tanggung jawab, santun, peduli, dan percaya diri dalam interaksi sehari-hari.')
                )
            ),

            React.createElement('div', { className: 'mt-4' },
                React.createElement('h3', { className: 'font-bold' }, 'B. Pengetahuan dan Keterampilan'),
                React.createElement('table', { className: 'w-full border-collapse border border-black mt-1' },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: 'font-bold text-center' },
                            React.createElement('td', { className: 'border border-black p-1 w-[5%]' }, 'No'),
                            React.createElement('td', { className: 'border border-black p-1 w-[25%]' }, 'Mata Pelajaran'),
                            React.createElement('td', { className: 'border border-black p-1 w-[10%]' }, 'Nilai'),
                            React.createElement('td', { className: 'border border-black p-1 w-[10%]' }, 'Predikat'),
                            React.createElement('td', { className: 'border border-black p-1 w-[50%]' }, 'Deskripsi Capaian Kompetensi')
                        )
                    ),
                    React.createElement('tbody', null,
                        [
                            ...groupedSubjects.PABP.length > 0 ? [groupedSubjects.PABP.find(s => gradeData?.finalGrades?.[s.id] != null) || groupedSubjects.PABP[0]].map(s => ({ ...s, fullName: 'Pendidikan Agama dan Budi Pekerti' })) : [],
                            ...groupedSubjects.others,
                            ...groupedSubjects.SB.length > 0 ? [groupedSubjects.SB.find(s => gradeData?.finalGrades?.[s.id] != null) || groupedSubjects.SB[0]].map(s => ({ ...s, fullName: 'Seni Budaya' })) : [],
                            ...groupedSubjects.Mulok.length > 0 ? [groupedSubjects.Mulok.find(s => gradeData?.finalGrades?.[s.id] != null) || groupedSubjects.Mulok[0]].map(s => ({ ...s, fullName: 'Muatan Lokal' })) : []
                        ].map((subject, index) => {
                            let grade = 0;
                            let originalSubjectId = subject.id;
                            if (['Pendidikan Agama dan Budi Pekerti', 'Seni Budaya', 'Muatan Lokal'].includes(subject.fullName)) {
                                const subGroup = subject.fullName.startsWith('Pendidikan Agama') ? groupedSubjects.PABP : subject.fullName.startsWith('Seni Budaya') ? groupedSubjects.SB : groupedSubjects.Mulok;
                                const gradedSubject = subGroup.find(s => gradeData?.finalGrades?.[s.id] != null);
                                grade = gradedSubject ? gradeData.finalGrades[gradedSubject.id] : null;
                                originalSubjectId = gradedSubject ? gradedSubject.id : originalSubjectId;
                            } else {
                                grade = gradeData?.finalGrades?.[subject.id];
                            }
                            
                            const description = studentDescriptions[student.id]?.[originalSubjectId] || 'Deskripsi belum dibuat.';

                            return (
                                React.createElement('tr', { key: subject.id },
                                    React.createElement('td', { className: 'border border-black p-1 text-center' }, index + 1),
                                    React.createElement('td', { className: 'border border-black p-1' }, subject.fullName),
                                    React.createElement('td', { className: 'border border-black p-1 text-center' }, grade ?? ''),
                                    React.createElement('td', { className: 'border border-black p-1 text-center' }, grade != null ? getPredicate(grade) : ''),
                                    React.createElement('td', { className: 'border border-black p-1 align-top' }, description)
                                )
                            )
                        })
                    )
                )
            ),

            React.createElement('div', { className: 'mt-4' },
                React.createElement('h3', { className: 'font-bold' }, 'C. Ekstrakurikuler'),
                React.createElement('table', { className: 'w-full border-collapse border border-black mt-1' },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: 'font-bold text-center' },
                            React.createElement('td', { className: 'border border-black p-1 w-[5%]' }, 'No'),
                            React.createElement('td', { className: 'border border-black p-1 w-[30%]' }, 'Kegiatan Ekstrakurikuler'),
                            React.createElement('td', { className: 'border border-black p-1 w-[65%]' }, 'Keterangan')
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

            React.createElement('div', { className: 'flex mt-4 space-x-4' },
                React.createElement('div', { className: 'w-1/2' },
                    React.createElement('h3', { className: 'font-bold' }, 'D. Ketidakhadiran'),
                    React.createElement('table', { className: 'w-full border-collapse border border-black mt-1' },
                        React.createElement('tbody', null,
                            React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1 w-2/3' }, 'Sakit'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData?.sakit || 0} hari`)),
                            React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1' }, 'Izin'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData?.izin || 0} hari`)),
                            React.createElement('tr', null, React.createElement('td', { className: 'border border-black p-1' }, 'Tanpa Keterangan'), React.createElement('td', { className: 'border border-black p-1' }, `: ${attendanceData?.alpa || 0} hari`))
                        )
                    )
                ),
                React.createElement('div', { className: 'w-1/2' },
                    React.createElement('h3', { className: 'font-bold' }, 'E. Catatan Wali Kelas'),
                    React.createElement('div', { className: 'border border-black p-2 mt-1 h-[92px] italic' }, studentNote)
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

const P5ReportPage = ({ student, settings, project, assessments }) => {
    const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === project.id);
    
    return (
        React.createElement('div', { className: 'p-8 text-sm' },
            React.createElement('div', { className: 'text-center font-bold mb-4' },
                React.createElement('h2', { className: 'text-sm' }, 'LAPORAN PROJEK PENGUATAN PROFIL PELAJAR PANCASILA')
            ),
            React.createElement('table', { className: 'w-full text-xs mb-4' },
                React.createElement('tbody', null,
                    React.createElement('tr', null,
                        React.createElement('td', { className: 'w-1/4' }, 'Nama Sekolah'),
                        React.createElement('td', { className: 'w-1/2' }, `: ${settings.nama_sekolah}`),
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
                React.createElement('p', { className: 'font-bold' }, `Proyek ${project.id === 'P5_BHINNEKA' ? '1' : '2'}: ${project.title}`),
                React.createElement('p', { className: 'italic' }, project.description)
            ),
            
            React.createElement('table', { className: 'w-full border-collapse border border-black mt-4' },
                React.createElement('thead', null,
                    React.createElement('tr', { className: 'font-bold text-center' },
                        React.createElement('td', { className: 'border border-black p-1' }, 'Dimensi'),
                        React.createElement('td', { className: 'border border-black p-1' }, 'Sub Elemen'),
                        React.createElement('td', { className: 'border border-black p-1' }, 'Capaian')
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


const PrintRaporPage = ({ students, settings, showToast, ...restProps }) => {
    
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

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden" },
                React.createElement('div', { className: "flex items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih siswa dan klik tombol cetak untuk memulai.")
                    ),
                    React.createElement('div', { className: "flex items-center gap-4" },
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
                        React.createElement('div', { className: 'report-page w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto my-8 border', 'data-student-id': student.id },
                            React.createElement(KopSurat, { settings: settings }),
                            React.createElement(MainReportPage, { student: student, settings: settings, ...restProps })
                        ),
                        p5Projects.map(project => (
                             React.createElement('div', { key: project.id, className: 'report-page w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto my-8 border', 'data-student-id': student.id },
                                React.createElement(KopSurat, { settings: settings }),
                                React.createElement(P5ReportPage, { student: student, settings: settings, project: project, assessments: restProps.p5Assessments })
                            )
                        ))
                    )
                ))
            )
        )
    );
};

export default PrintRaporPage;
