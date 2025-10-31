import React, { useState, useEffect, useMemo } from 'react';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const parts = dateString.split(',');
        const datePart = parts.length > 1 ? parts[1].trim() : dateString;
        const date = new Date(datePart);
        if (isNaN(date.getTime())) {
            const isoDate = new Date(dateString);
            if(isNaN(isoDate.getTime())) return dateString;
            return isoDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        };
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const paperDimensionsCss = {
    A4: { width: '21cm', height: '29.7cm', label: 'A4 (21 x 29.7 cm)' },
    F4: { width: '21.5cm', height: '33cm', label: 'F4 (21.5 × 33 cm)' },
    Letter: { width: '21.6cm', height: '27.9cm', label: 'Letter (21.6 × 27.9 cm)' },
    Legal: { width: '21.6cm', height: '35.6cm', label: 'Legal (21.6 × 35.6 cm)' },
};

const KopSuratHeader = ({ settings }) => {
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

    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);
    
    const syncedLayout = layout.map(el => {
        if (el.type === 'text') {
            if (el.id === 'nama_dinas_pendidikan_text') return { ...el, content: settings.nama_dinas_pendidikan };
            if (el.id === 'nama_sekolah_text') return { ...el, content: settings.nama_sekolah };
            if (el.id === 'alamat_sekolah_text') return { ...el, content: settings.alamat_sekolah };
            if (el.id === 'kontak_sekolah_text') return { ...el, content: `Telepon: ${settings.telepon_sekolah || ''} | Email: ${settings.email_sekolah || ''}` };
        }
        return el;
    });

    return (
        React.createElement('div', { className: "w-full mb-4", style: { height: '3.5cm', flexShrink: 0 } },
            React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 135", preserveAspectRatio: "xMidYMin meet" },
                syncedLayout.map(el => {
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
                                fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'Poppins'
                            }, el.content)
                        );
                    }
                    if (el.type === 'image') {
                        const imageUrl = String(settings[el.content] || '');
                        if (!imageUrl) return null;
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

const ReportPage = ({ children, showHeader = false, settings, paperSize }) => (
    React.createElement('div', { className: "report-page bg-white shadow-lg mx-auto my-4 border border-gray-300 text-black", style: { width: paperDimensionsCss[paperSize].width, height: paperDimensionsCss[paperSize].height, boxSizing: 'border-box' } },
         React.createElement('div', { className: "p-8 h-full w-full flex flex-col" },
            showHeader && settings && React.createElement(KopSuratHeader, { settings: settings }),
            React.createElement('div', { className: "flex-grow overflow-hidden" },
                children
            )
        )
    )
);

const CoverPage = ({ student, settings, paperSize }) => (
    React.createElement(ReportPage, { paperSize: paperSize, settings: settings },
        React.createElement('div', { className: "flex flex-col justify-between items-center h-full text-center p-4" },
            React.createElement('div', { className: "pt-8" },
                React.createElement('h2', { className: "text-xl font-semibold uppercase" }, settings.nama_dinas_pendidikan || 'DINAS PENDIDIKAN')
            ),
            React.createElement('div', null,
                React.createElement('div', { className: "h-32 w-32 bg-gray-200 flex items-center justify-center mx-auto mb-8" },
                    settings.logo_dinas && typeof settings.logo_dinas === 'string'
                        ? React.createElement('img', { src: settings.logo_dinas, alt: "Logo Dinas Pendidikan", className: "object-contain h-full w-full" })
                        : React.createElement('span', { className: "text-gray-500" }, "Logo")
                ),
                React.createElement('h1', { className: "text-2xl font-bold tracking-wider border-b-2 border-t-2 border-black py-2" }, "LAPORAN HASIL BELAJAR"),
                React.createElement('div', { className: "mt-20 space-y-2 text-lg" },
                    React.createElement('p', null, "Nama Peserta Didik:"),
                    React.createElement('p', { className: "font-bold text-2xl uppercase" }, student.namaLengkap),
                    React.createElement('p', { className: "mt-4" }, "NIS / NISN:"),
                    React.createElement('p', { className: "font-bold text-2xl" }, student.nis, " / ", student.nisn)
                )
            ),
            React.createElement('div', { className: "font-semibold pb-8" },
                React.createElement('p', { className: "text-lg uppercase" }, settings.nama_sekolah || 'NAMA SEKOLAH'),
                React.createElement('p', { className: "text-sm" }, settings.alamat_sekolah || 'Alamat Sekolah')
            )
        )
    )
);

const IdentityPage = ({ student, settings, paperSize }) => {
    const identityData = [
        { label: "Nama Lengkap Peserta Didik", value: student.namaLengkap },
        { label: "Nomor Induk Siswa (NIS)", value: student.nis },
        { label: "Nomor Induk Siswa Nasional (NISN)", value: student.nisn },
        { label: "Tempat, Tanggal Lahir", value: `${student.tempatLahir || '-'}, ${formatDate(student.tanggalLahir)}` },
        { label: "Jenis Kelamin", value: student.jenisKelamin },
        { label: "Agama", value: student.agama },
        { label: "Status dalam Keluarga", value: student.statusDalamKeluarga },
        { label: "Anak ke", value: student.anakKe },
        { label: "Alamat Peserta Didik", value: student.alamatSiswa },
        { label: "Diterima di sekolah ini", value: "" },
        { label: "a. Di kelas", value: student.diterimaDiKelas, isSub: true },
        { label: "b. Pada tanggal", value: formatDate(student.diterimaTanggal), isSub: true },
        { label: "Orang Tua", value: "" },
        { label: "a. Ayah", value: student.namaAyah, isSub: true },
        { label: "b. Ibu", value: student.namaIbu, isSub: true },
        { label: "Alamat Orang Tua", value: student.alamatOrangTua },
        { label: "Pekerjaan Orang Tua", value: "" },
        { label: "a. Ayah", value: student.pekerjaanAyah, isSub: true },
        { label: "b. Ibu", value: student.pekerjaanIbu, isSub: true },
        { label: "Wali Peserta Didik", value: "" },
        { label: "a. Nama", value: student.namaWali || '-', isSub: true },
        { label: "b. Pekerjaan", value: student.pekerjaanWali || '-', isSub: true },
    ];

    const rapportDateString = settings.tanggal_rapor || '';
    const rapportDateParts = rapportDateString.split(',');
    const place = rapportDateParts[0] || '';
    const date = rapportDateParts.length > 1 ? rapportDateParts.slice(1).join(',').trim() : '';

    return (
        React.createElement(ReportPage, { showHeader: true, settings: settings, paperSize: paperSize },
            React.createElement('h2', { className: "text-center font-bold text-lg mb-8" }, "KETERANGAN DIRI PESERTA DIDIK"),
            React.createElement('div', { className: "space-y-1 text-sm" },
                identityData.map((item, index) => (
                    React.createElement('div', { key: index, className: "flex" },
                        React.createElement('div', { className: `flex w-1/2 ${item.isSub ? 'pl-6' : 'pl-2'}` },
                            React.createElement('span', { className: "w-6" }, !item.isSub ? `${index + 1}.` : ''),
                            React.createElement('span', { className: "flex-1" }, item.label),
                            React.createElement('span', null, ":")
                        ),
                        React.createElement('div', { className: "w-1/2 font-semibold pl-2" }, item.value || '-')
                    )
                ))
            ),
             React.createElement('div', { className: "flex justify-between mt-12 text-sm" },
                React.createElement('div', null,
                     React.createElement('div', { className: "w-24 h-32 border-2 border-black flex items-center justify-center text-gray-400" }, "Pas Foto 3x4")
                ),
                React.createElement('div', { className: "text-left" },
                    React.createElement('p', null, place, date ? `, ${date}` : ''),
                    React.createElement('p', null, "Kepala Sekolah,"),
                    React.createElement('div', { className: "h-20" }),
                    React.createElement('p', { className: "font-bold underline" }, settings.nama_kepala_sekolah || '................................'),
                    React.createElement('p', null, "NIP. ", settings.nip_kepala_sekolah || '...........................')
                )
            )
        )
    );
};

const MainReportPage = ({ student, settings, gradeData, attendanceData, noteData, activeSubjects, studentDescriptions, paperSize, studentExtracurriculars, extracurriculars }) => {

    const rapportDateString = settings.tanggal_rapor || '';
    const rapportDateParts = rapportDateString.split(',');
    const place = rapportDateParts[0] || '';
    const date = rapportDateParts.length > 1 ? rapportDateParts.slice(1).join(',').trim() : '';
    
    const studentExtra = useMemo(() => studentExtracurriculars.find(se => se.studentId === student.id), [studentExtracurriculars, student.id]);
    const assignedActivities = useMemo(() => {
        if (!studentExtra) return [];
        return (studentExtra.assignedActivities || [])
            .map(activityId => {
                if (!activityId) return null;
                const activity = extracurriculars.find(e => e.id === activityId);
                if (!activity) return null;
                return {
                    name: activity.name,
                    description: studentExtra.descriptions?.[activityId] || ''
                };
            })
            .filter(Boolean);
    }, [studentExtra, extracurriculars]);

    return (
        React.createElement(React.Fragment, null,
            React.createElement(ReportPage, { showHeader: true, settings: settings, paperSize: paperSize },
                React.createElement('h2', { className: "text-center font-bold text-lg border-b-2 border-black pb-1" }, "LAPORAN HASIL BELAJAR"),
                React.createElement('div', { className: "flex justify-between text-xs mt-4" },
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "Nama Peserta Didik"), ": ", student.namaLengkap),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "NIS / NISN"), ": ", student.nis, " / ", student.nisn)
                    ),
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Kelas"), ": ", settings.nama_kelas),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Semester"), ": ", settings.semester),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Tahun Ajaran"), ": ", settings.tahun_ajaran)
                    )
                ),

                React.createElement('div', { className: "mt-4" },
                    React.createElement('p', { className: "font-bold bg-gray-200 px-2 py-1 text-sm" }, "A. Penilaian Akademik (Intrakurikuler)"),
                    React.createElement('table', { className: "w-full border-collapse border border-black text-xs mt-2" },
                        React.createElement('thead', null,
                            React.createElement('tr', { className: "font-bold text-center bg-gray-100" },
                                React.createElement('td', { className: "border border-black p-1 w-8" }, "No"),
                                React.createElement('td', { className: "border border-black p-1" }, "Mata Pelajaran"),
                                React.createElement('td', { className: "border border-black p-1 w-20" }, "Nilai Akhir"),
                                React.createElement('td', { className: "border border-black p-1" }, "Capaian Kompetensi")
                            )
                        ),
                        React.createElement('tbody', null,
                            activeSubjects.map((subject, index) => (
                                React.createElement('tr', { key: subject.id },
                                    React.createElement('td', { className: "border border-black p-1 text-center" }, index + 1),
                                    React.createElement('td', { className: "border border-black p-1" }, subject.fullName),
                                    React.createElement('td', { className: "border border-black p-1 text-center font-semibold" }, gradeData?.finalGrades[subject.id] ?? 0),
                                    React.createElement('td', { className: "border border-black p-1" }, studentDescriptions[student.id]?.[subject.id] || '')
                                )
                            ))
                        )
                    )
                )
            ),
            
            React.createElement(ReportPage, { showHeader: true, settings: settings, paperSize: paperSize },
                 React.createElement('h2', { className: "text-center font-bold text-lg border-b-2 border-black pb-1" }, "LAPORAN HASIL BELAJAR"),
                React.createElement('div', { className: "flex justify-between text-xs mt-4" },
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "Nama Peserta Didik"), ": ", student.namaLengkap),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "NIS / NISN"), ": ", student.nis, " / ", student.nisn)
                    ),
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Kelas"), ": ", settings.nama_kelas),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Semester"), ": ", settings.semester),
                        React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Tahun Ajaran"), ": ", settings.tahun_ajaran)
                    )
                ),
                 React.createElement('div', { className: "flex gap-4 mt-4 text-xs" },
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('p', { className: "font-bold bg-gray-200 px-2 py-1" }, "B. Ekstrakurikuler"),
                        React.createElement('table', { className: "w-full border-collapse border border-black mt-1" },
                            React.createElement('thead', null,
                                React.createElement('tr', { className: "font-bold text-center bg-gray-100" },
                                    React.createElement('td', { className: "border border-black p-1 w-8" }, "No"),
                                    React.createElement('td', { className: "border border-black p-1" }, "Kegiatan Ekstrakurikuler"),
                                    React.createElement('td', { className: "border border-black p-1" }, "Keterangan")
                                )
                            ),
                            React.createElement('tbody', null,
                                (assignedActivities.length > 0) ? (
                                    assignedActivities.map((activity, index) => (
                                        React.createElement('tr', { key: index },
                                            React.createElement('td', { className: "border border-black p-1 text-center" }, index + 1),
                                            React.createElement('td', { className: "border border-black p-1" }, activity.name),
                                            React.createElement('td', { className: "border border-black p-1" }, activity.description)
                                        )
                                    ))
                                ) : (
                                    React.createElement('tr', null,
                                        React.createElement('td', { colSpan: "3", className: "border border-black p-1 text-center italic" }, "- Tidak ada kegiatan -")
                                    )
                                )
                            )
                        ),
                        React.createElement('p', { className: "font-bold bg-gray-200 px-2 py-1 mt-4" }, "C. Ketidakhadiran"),
                        React.createElement('table', { className: "w-full border-collapse border border-black mt-1" },
                            React.createElement('tbody', null,
                                React.createElement('tr', null,
                                    React.createElement('td', { className: "border border-black p-1 w-1/3" }, "Sakit"),
                                    React.createElement('td', { className: "border border-black p-1 text-center" }, `${attendanceData?.sakit || 0} hari`)
                                ),
                                React.createElement('tr', null,
                                    React.createElement('td', { className: "border border-black p-1" }, "Izin"),
                                    React.createElement('td', { className: "border border-black p-1 text-center" }, `${attendanceData?.izin || 0} hari`)
                                ),
                                React.createElement('tr', null,
                                    React.createElement('td', { className: "border border-black p-1" }, "Tanpa Keterangan"),
                                    React.createElement('td', { className: "border border-black p-1 text-center" }, `${attendanceData?.alpa || 0} hari`)
                                )
                            )
                        )
                    ),
                    React.createElement('div', { className: "w-1/2" },
                        React.createElement('p', { className: "font-bold bg-gray-200 px-2 py-1" }, "D. Catatan Wali Kelas"),
                        React.createElement('div', { className: "border border-black h-48 p-2 mt-1" },
                            noteData || ''
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-between mt-8 text-xs" },
                    React.createElement('div', { className: "text-center" },
                        React.createElement('p', null, "Mengetahui,"),
                        React.createElement('p', null, "Orang Tua/Wali,"),
                        React.createElement('div', { className: "h-20" }),
                        React.createElement('p', { className: "font-bold underline" }, "(...................................)")
                    ),
                    React.createElement('div', { className: "text-center" },
                        React.createElement('p', null, place, date ? `, ${date}` : ''),
                        React.createElement('p', null, "Wali Kelas,"),
                        React.createElement('div', { className: "h-20" }),
                        React.createElement('p', { className: "font-bold underline" }, settings.nama_wali_kelas || '................................'),
                        React.createElement('p', null, "NIP. ", settings.nip_wali_kelas || '...........................')
                    )
                ),
                React.createElement('div', { className: "flex justify-center mt-8 text-xs" },
                    React.createElement('div', { className: "text-center" },
                        React.createElement('p', null, "Kepala Sekolah,"),
                        React.createElement('div', { className: "h-20" }),
                        React.createElement('p', { className: "font-bold underline" }, settings.nama_kepala_sekolah || '................................'),
                        React.createElement('p', null, "NIP. ", settings.nip_kepala_sekolah || '...........................')
                    )
                )
            )
        )
    );
};

const P5ReportPage = ({ student, settings, project, assessments, paperSize }) => {
    const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === project.id);
    const ASSESSMENT_LEVELS = ['Belum Berkembang', 'Mulai Berkembang', 'Berkembang sesuai Harapan', 'Sangat Berkembang'];
    
    return (
        React.createElement(ReportPage, { showHeader: true, settings: settings, paperSize: paperSize },
            React.createElement('h2', { className: "text-center font-bold text-lg border-b-2 border-black pb-1" }, "LAPORAN PROJEK PENGUATAN PROFIL PELAJAR PANCASILA"),
             React.createElement('div', { className: "flex justify-between text-xs mt-4" },
                React.createElement('div', { className: "w-1/2" }, React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "Nama Peserta Didik"), ": ", student.namaLengkap), React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-32" }, "NIS / NISN"), ": ", student.nis, " / ", student.nisn)),
                React.createElement('div', { className: "w-1/2" }, React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Kelas"), ": ", settings.nama_kelas), React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Semester"), ": ", settings.semester), React.createElement('div', { className: "flex" }, React.createElement('span', { className: "w-28" }, "Tahun Ajaran"), ": ", settings.tahun_ajaran))
            ),
            React.createElement('div', { className: "mt-4" },
                React.createElement('p', { className: "font-bold text-sm" }, "Proyek: ", project.title),
                React.createElement('p', { className: "text-xs italic mt-1" }, project.description),
                React.createElement('table', { className: "w-full border-collapse border border-black text-xs mt-2" },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: "font-bold text-center bg-gray-100" },
                            React.createElement('td', { className: "border border-black p-1" }, "Dimensi & Sub-elemen"),
                            React.createElement('td', { colSpan: 4, className: "border border-black p-1" }, "Pencapaian")
                        )
                    ),
                    project.dimensions.map((dim, dimIndex) => (
                        React.createElement('tbody', { key: dimIndex },
                            React.createElement('tr', { className: "bg-gray-50" }, React.createElement('td', { colSpan: 5, className: "border border-black p-1 font-semibold" }, dim.name)),
                            dim.subElements.map((sub, subIndex) => {
                                const subElementKey = `${dim.name}|${sub.name}`;
                                const level = studentAssessments?.assessments[subElementKey];
                                return (
                                    React.createElement('tr', { key: subIndex },
                                        React.createElement('td', { className: "border border-black p-1 pl-4" }, sub.name),
                                        ASSESSMENT_LEVELS.map((l, lIndex) => (
                                            React.createElement('td', { key: lIndex, className: "border border-black p-1 w-12 text-center align-middle" }, level === l ? '✔' : '')
                                        ))
                                    )
                                );
                            })
                        )
                    ))
                )
            )
        )
    );
};


const StudentReport = ({ student, settings, grades, attendance, notes, subjects, studentDescriptions, studentExtracurriculars, extracurriculars, p5Projects, p5Assessments, paperSize }) => {
    const activeSubjects = useMemo(() => subjects.filter(s => s.active), [subjects]);
    const gradeData = useMemo(() => grades.find(g => g.studentId === student.id), [grades, student.id]);
    const attendanceData = useMemo(() => attendance.find(a => a.studentId === student.id), [attendance, student.id]);
    const noteData = useMemo(() => notes[student.id], [notes, student.id]);
    
    return (
        React.createElement('div', { 'data-student-id': student.id },
            React.createElement(CoverPage, { student: student, settings: settings, paperSize: paperSize }),
            React.createElement(IdentityPage, { student: student, settings: settings, paperSize: paperSize }),
            React.createElement(MainReportPage, { student: student, settings: settings, gradeData: gradeData, attendanceData: attendanceData, noteData: noteData, activeSubjects: activeSubjects, studentDescriptions: studentDescriptions, paperSize: paperSize, studentExtracurriculars: studentExtracurriculars, extracurriculars: extracurriculars }),
            p5Projects.map(project => (
                React.createElement(P5ReportPage, { key: project.id, student: student, settings: settings, project: project, assessments: p5Assessments, paperSize: paperSize })
            ))
        )
    );
};


const PrintRaporPage = ({ students, settings, grades, attendance, notes, subjects, studentDescriptions, studentExtracurriculars, extracurriculars, p5Projects, p5Assessments, showToast }) => {
    const [selectedStudents, setSelectedStudents] = useState(() => new Set(students.map(s => s.id)));
    const [paperSize, setPaperSize] = useState('A4');
    
    useEffect(() => {
        setSelectedStudents(new Set(students.map(s => s.id)));
    }, [students]);

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) newSet.delete(studentId);
            else newSet.add(studentId);
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        if (selectedStudents.size === students.length) setSelectedStudents(new Set());
        else setSelectedStudents(new Set(students.map(s => s.id)));
    };

    const handlePrint = () => {
        if (selectedStudents.size === 0) {
            showToast('Pilih setidaknya satu siswa untuk dicetak.', 'error');
            return;
        }
        window.print();
    };

    const studentsToPrint = students.filter(s => selectedStudents.has(s.id));
    const p5ProjectsToPrint = p5Projects.filter(p => p.dimensions.some(d => d.subElements.length > 0));

    return (
        React.createElement('div', { className: "flex flex-col h-full" },
            React.createElement('div', { className: "print-hidden p-4 bg-white rounded-xl shadow-md border border-slate-200" },
                React.createElement('h2', { className: "text-2xl font-bold text-slate-800" }, "Print Rapor"),
                React.createElement('div', { className: "flex flex-wrap gap-6 items-end mt-4" },
                    React.createElement('div', { className: "flex-grow" },
                        React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" }, "Pilih Siswa"),
                        React.createElement('div', { className: "max-h-40 overflow-y-auto border rounded-md p-2 bg-slate-50" },
                             React.createElement('div', { className: "flex items-center border-b pb-2 mb-2" }, React.createElement('input', { type: "checkbox", id: "select-all", checked: selectedStudents.size === students.length && students.length > 0, onChange: handleSelectAll, className: "h-4 w-4 rounded border-gray-300 text-indigo-600" }), React.createElement('label', { htmlFor: "select-all", className: "ml-3 text-sm font-bold text-slate-800" }, "Pilih Semua")),
                             students.map(student => (
                                React.createElement('div', { key: student.id, className: "flex items-center" }, React.createElement('input', { type: "checkbox", id: `student-${student.id}`, checked: selectedStudents.has(student.id), onChange: () => handleSelectStudent(student.id), className: "h-4 w-4 rounded border-gray-300 text-indigo-600" }), React.createElement('label', { htmlFor: `student-${student.id}`, className: "ml-3 text-sm text-slate-700" }, student.namaLengkap))
                            ))
                        )
                    ),
                    React.createElement('div', null, React.createElement('label', { htmlFor: "paper-size", className: "block text-sm font-medium text-slate-700 mb-1" }, "Ukuran Kertas"), React.createElement('select', { id: "paper-size", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-auto px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" }, Object.entries(paperDimensionsCss).map(([key, value]) => (React.createElement('option', { key: key, value: key }, value.label))))),
                    React.createElement('button', { onClick: handlePrint, className: "w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" }, "Cetak")
                )
            ),
            React.createElement('div', { className: "flex-1 overflow-auto bg-slate-200 mt-4", id: "print-area" },
                React.createElement('style', null, `
                    @page { 
                        size: ${paperSize === 'F4' ? '215mm 330mm' : paperSize}; 
                        margin: 0;
                    }
                    @media print {
                        #print-area .report-page {
                            display: none;
                        }
                        #print-area [data-student-id] {
                            display: none;
                        }
                        ${studentsToPrint.map(s => `#print-area [data-student-id="${s.id}"]`).join(', ')} {
                            display: block;
                        }
                    }
                `),
                students.map(student => (
                    React.createElement(StudentReport, {
                        key: student.id,
                        student: student,
                        settings: settings,
                        grades: grades,
                        attendance: attendance,
                        notes: notes,
                        subjects: subjects,
                        studentDescriptions: studentDescriptions,
                        studentExtracurriculars: studentExtracurriculars,
                        extracurriculars: extracurriculars,
                        p5Projects: p5ProjectsToPrint,
                        p5Assessments: p5Assessments,
                        paperSize: paperSize
                    })
                ))
            )
        )
    );
};

export default PrintRaporPage;
