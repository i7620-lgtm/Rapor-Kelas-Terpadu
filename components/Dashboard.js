import React, { useMemo } from 'react';

const StatCard = ({ title, value, description, actionText, onActionClick, showAction }) => (
    React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col justify-between" },
        React.createElement('div', null,
            React.createElement('h3', { className: "text-lg font-semibold text-slate-700" }, title),
            React.createElement('p', { className: "mt-4 text-4xl font-bold text-slate-900" }, value),
            React.createElement('p', { className: "mt-2 text-sm text-slate-500" }, description)
        ),
        showAction && actionText && onActionClick && (
             React.createElement('button', { onClick: onActionClick, className: "mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-left" },
                actionText, ' →'
            )
        )
    )
);

const AnalysisItem = ({ title, description, status, actionText, onActionClick }) => {
    const statusClasses = {
        complete: 'bg-green-100 text-green-800 border-green-400',
        incomplete: 'bg-yellow-100 text-yellow-800 border-yellow-400',
        attention: 'bg-red-100 text-red-800 border-red-400',
    };
    const statusText = {
        complete: 'Lengkap',
        incomplete: 'Belum Lengkap',
        attention: 'Perhatian',
    };

    return (
        React.createElement('div', { className: `bg-white p-4 rounded-lg shadow-sm border-l-4 ${statusClasses[status]} flex flex-col justify-between` },
            React.createElement('div', null,
                React.createElement('div', { className: "flex justify-between items-start" },
                    React.createElement('div', { className: "flex-1" },
                        React.createElement('h4', { className: "font-semibold text-slate-800" }, title),
                        React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, description)
                    ),
                    React.createElement('span', { className: `ml-4 text-xs font-bold px-2 py-1 rounded-full ${statusClasses[status]}` }, statusText[status])
                )
            ),
            onActionClick && actionText && (
                React.createElement('button', { onClick: onActionClick, className: "mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-right self-end" },
                    actionText, ' →'
                )
            )
        )
    );
};

const StatusIcon = ({ status }) => {
    if (status === 'good') {
        return (
            React.createElement('svg', { className: "w-6 h-6 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
        );
    }
    return (
        React.createElement('svg', { className: "w-6 h-6 text-yellow-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
        )
    );
};

const ChecklistItem = ({ title, status, message, actionText, onActionClick }) => (
    React.createElement('div', { className: "flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-200 space-x-4" },
        React.createElement('div', { className: "flex-shrink-0" },
            React.createElement(StatusIcon, { status: status })
        ),
        React.createElement('div', { className: "flex-1" },
            React.createElement('h4', { className: "font-semibold text-slate-800" }, title),
            React.createElement('p', { className: "text-sm text-slate-600 mt-1" }, message),
            status === 'bad' && onActionClick && (
                 React.createElement('button', { onClick: onActionClick, className: "mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800" },
                    actionText, ' →'
                )
            )
        )
    )
);


const Dashboard = ({ 
    setActivePage, 
    onNavigateToNilai, 
    settings = {}, 
    students = [], 
    grades = [], 
    subjects = [], 
    notes = {}, 
    attendance = [], 
    extracurriculars = [], 
    studentExtracurriculars = [] 
}) => {
  const waliKelasName = settings.nama_wali_kelas || "Wali Kelas";

  const stats = [
    { 
        title: "Kelas", 
        value: settings.nama_kelas || "-", 
        description: "Kelas yang diampu saat ini.",
        actionText: "Atur Kelas",
        onActionClick: () => setActivePage('PENGATURAN'),
        showAction: !settings.nama_kelas
    },
    { 
        title: "Jumlah Siswa", 
        value: students.length.toString(), 
        description: "Siswa yang terdaftar di kelas.",
        actionText: "Tambah Siswa Pertama",
        onActionClick: () => setActivePage('DATA_SISWA'),
        showAction: students.length === 0
    },
    { 
        title: "Tahun Ajaran", 
        value: settings.tahun_ajaran || "-", 
        description: "Tahun ajaran yang sedang berjalan.",
        actionText: "Atur Tahun Ajaran",
        onActionClick: () => setActivePage('PENGATURAN'),
        showAction: !settings.tahun_ajaran
    },
    { 
        title: "Semester", 
        value: settings.semester || "-", 
        description: "Semester yang sedang berlangsung.",
        actionText: "Atur Semester",
        onActionClick: () => setActivePage('PENGATURAN'),
        showAction: !settings.semester
    },
  ];
  
  const academicAlerts = useMemo(() => {
    const items = [];
    const minGrade = parseInt(settings.predikats?.c || '70', 10);
    const activeSubjects = subjects.filter(s => s.active);

    if (isNaN(minGrade) || students.length === 0 || activeSubjects.length === 0) {
        return items;
    }
    
    students.forEach(student => {
        const studentGrade = grades.find(g => g.studentId === student.id);
        if (!studentGrade) return;

        const failingSubjects = [];
        let firstFailingSubjectId = null;

        activeSubjects.forEach(subject => {
            const grade = studentGrade?.finalGrades?.[subject.id];
            if (typeof grade === 'number' && grade < minGrade) {
                failingSubjects.push(`${subject.label} (${grade})`);
                if (!firstFailingSubjectId) {
                    firstFailingSubjectId = subject.id;
                }
            }
        });

        if (failingSubjects.length > 0) {
            items.push({
                title: student.namaLengkap,
                description: `Nilai di bawah KKM: ${failingSubjects.join(', ')}`,
                status: 'attention',
                actionSubjectId: firstFailingSubjectId,
            });
        }
    });

    return items;
  }, [students, grades, subjects, settings]);

    const completenessChecks = useMemo(() => {
        const results = [];
        const activeSubjects = subjects.filter(s => s.active);

        // 1. Pengaturan Dasar
        const missingSettings = [
            !settings.nama_sekolah && "Nama Sekolah",
            !settings.nama_wali_kelas && "Nama Wali Kelas",
            !settings.nama_kelas && "Nama Kelas",
            !settings.tahun_ajaran && "Tahun Ajaran",
            !settings.semester && "Semester",
        ].filter(Boolean);

        if (missingSettings.length === 0) {
            results.push({
                category: 'Pengaturan',
                title: 'Informasi Dasar',
                status: 'good',
                message: 'Informasi dasar sekolah, kelas, dan wali kelas sudah terisi.',
            });
        } else {
            results.push({
                category: 'Pengaturan',
                title: 'Informasi Dasar',
                status: 'bad',
                message: `Data berikut belum diisi: ${missingSettings.join(', ')}.`,
                actionText: 'Lengkapi di Pengaturan',
                onActionClick: () => setActivePage('PENGATURAN'),
            });
        }

        if (students.length === 0) {
             results.push({
                category: 'Data Siswa',
                title: 'Data Siswa',
                status: 'bad',
                message: 'Belum ada data siswa yang ditambahkan ke dalam aplikasi.',
                actionText: 'Tambah Siswa',
                onActionClick: () => setActivePage('DATA_SISWA'),
            });
            return results;
        }

        // 2. Data Nilai
        const studentsWithMissingGrades = [];
        students.forEach(student => {
            const studentGrade = grades.find(g => g.studentId === student.id);
            const missingSubjects = activeSubjects.filter(sub => {
                const grade = studentGrade?.finalGrades?.[sub.id];
                return grade === undefined || grade === null || grade === '';
            });
            if (missingSubjects.length > 0) {
                studentsWithMissingGrades.push(`${student.namaLengkap} (${missingSubjects.map(s => s.label).join(', ')})`);
            }
        });
         if (studentsWithMissingGrades.length > 0) {
            results.push({
                category: 'Data Nilai',
                title: 'Kelengkapan Nilai Akhir',
                status: 'bad',
                message: `Terdapat ${studentsWithMissingGrades.length} siswa dengan nilai akhir yang belum terisi.`,
                actionText: 'Periksa Data Nilai',
                onActionClick: () => setActivePage('DATA_NILAI'),
            });
        } else {
             results.push({
                category: 'Data Nilai',
                title: 'Kelengkapan Nilai Akhir',
                status: 'good',
                message: 'Semua siswa telah memiliki nilai akhir untuk semua mata pelajaran yang aktif.',
            });
        }

        // 3. Data Absensi
        const studentsWithNoAttendance = students.filter(s => {
            const att = attendance.find(a => a.studentId === s.id);
            return !att || (att.sakit === 0 && att.izin === 0 && att.alpa === 0);
        });
        if (studentsWithNoAttendance.length > 0) {
             results.push({
                category: 'Data Lainnya',
                title: 'Data Absensi',
                status: 'bad',
                message: `Terdapat ${studentsWithNoAttendance.length} siswa yang data absensinya masih kosong (0 semua).`,
                actionText: 'Periksa Data Absensi',
                onActionClick: () => setActivePage('DATA_ABSENSI'),
            });
        } else {
            results.push({
                category: 'Data Lainnya',
                title: 'Data Absensi',
                status: 'good',
                message: 'Data absensi untuk semua siswa telah terisi.',
            });
        }

        // 4. Catatan Wali Kelas
        const studentsWithoutNotes = students.filter(s => !notes[s.id] || notes[s.id].trim() === '');
        if (studentsWithoutNotes.length > 0) {
             results.push({
                category: 'Data Lainnya',
                title: 'Catatan Wali Kelas',
                status: 'bad',
                message: `Terdapat ${studentsWithoutNotes.length} siswa yang belum memiliki catatan wali kelas.`,
                actionText: 'Isi Catatan',
                onActionClick: () => setActivePage('CATATAN_WALI_KELAS'),
            });
        } else {
            results.push({
                category: 'Data Lainnya',
                title: 'Catatan Wali Kelas',
                status: 'good',
                message: 'Semua siswa telah memiliki catatan wali kelas.',
            });
        }

        // 5. Ekstrakurikuler
        const studentsWithMissingExtraDesc = [];
        studentExtracurriculars.forEach(se => {
            const student = students.find(s => s.id === se.studentId);
            if (student) {
                const missingDescActivities = (se.assignedActivities || []).filter(activityId => activityId && (!se.descriptions || !se.descriptions[activityId]));
                if (missingDescActivities.length > 0) {
                    studentsWithMissingExtraDesc.push(student.namaLengkap);
                }
            }
        });

        if (studentsWithMissingExtraDesc.length > 0) {
             results.push({
                category: 'Data Lainnya',
                title: 'Deskripsi Ekstrakurikuler',
                status: 'bad',
                message: `${studentsWithMissingExtraDesc.length} siswa memiliki ekstrakurikuler tanpa deskripsi.`,
                actionText: 'Isi Deskripsi Ekstra',
                onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'),
            });
        } else {
             results.push({
                category: 'Data Lainnya',
                title: 'Deskripsi Ekstrakurikuler',
                status: 'good',
                message: 'Semua ekstrakurikuler yang diikuti siswa telah memiliki deskripsi.',
            });
        }

        return results;
    }, [settings, students, grades, notes, attendance, studentExtracurriculars, subjects, setActivePage]);

  return (
    React.createElement('div', { className: "space-y-8" },
      React.createElement('div', null,
        React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Dashboard"),
        React.createElement('p', { className: "mt-2 text-slate-600" }, "Selamat datang, ", waliKelasName)
      ),
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" },
        stats.map(stat => React.createElement(StatCard, { key: stat.title, ...stat }))
      ),
      React.createElement('div', null,
        React.createElement('h3', { className: "text-2xl font-bold text-slate-800" }, "Status Kelengkapan Data"),
        React.createElement('p', { className: "mt-1 text-slate-600 mb-6" }, "Pastikan semua data terisi sebelum mencetak rapor."),
         React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
            completenessChecks.map(item => React.createElement(ChecklistItem, { key: item.title, ...item }))
        )
      ),
      React.createElement('div', null,
        React.createElement('h3', { className: "text-2xl font-bold text-slate-800" }, "Perhatian Akademik"),
        React.createElement('p', { className: "mt-1 text-slate-600" }, "Ringkasan data nilai siswa yang memerlukan perhatian Anda."),
        React.createElement('div', { className: "mt-6" },
          academicAlerts.length > 0 ? (
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
              academicAlerts.map(item => React.createElement(AnalysisItem, { 
                key: item.title, 
                ...item,
                actionText: item.actionSubjectId ? "Perbaiki Nilai" : null,
                onActionClick: item.actionSubjectId ? () => onNavigateToNilai(item.actionSubjectId) : null,
              }))
            )
          ) : (
            React.createElement('div', { className: "bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center" },
              React.createElement('p', { className: "text-slate-500" }, "Semua data terlihat baik! Tidak ada item yang memerlukan perhatian khusus saat ini.")
            )
          )
        )
      )
    )
  );
};

export default Dashboard;
