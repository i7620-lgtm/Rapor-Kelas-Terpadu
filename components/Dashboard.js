import React, { useMemo } from 'react';

const StatCard = ({ title, value, description, actionText, onActionClick }) => (
    React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col justify-between" },
        React.createElement('div', null,
            React.createElement('h3', { className: "text-lg font-semibold text-slate-700" }, title),
            React.createElement('p', { className: "mt-4 text-4xl font-bold text-slate-900" }, value),
            React.createElement('p', { className: "mt-2 text-sm text-slate-500" }, description)
        ),
        actionText && onActionClick && (
             React.createElement('button', { onClick: onActionClick, className: "mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-left" },
                actionText, ' \u2192'
            )
        )
    )
);

const AnalysisItem = ({ title, description, status }) => {
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
        React.createElement('div', { className: `bg-white p-4 rounded-lg shadow-sm border-l-4 ${statusClasses[status]}` },
            React.createElement('div', { className: "flex justify-between items-start" },
                React.createElement('div', { className: "flex-1" },
                    React.createElement('h4', { className: "font-semibold text-slate-800" }, title),
                    React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, description)
                ),
                React.createElement('span', { className: `ml-4 text-xs font-bold px-2 py-1 rounded-full ${statusClasses[status]}` }, statusText[status])
            )
        )
    );
};


const Dashboard = ({ setActivePage, settings, students, grades, subjects }) => {
  const waliKelasName = settings.nama_wali_kelas || "Wali Kelas";

  const stats = [
    { 
        title: "Kelas", 
        value: settings.nama_kelas || "-", 
        description: "Kelas yang diampu saat ini.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
    { 
        title: "Jumlah Siswa", 
        value: students.length.toString(), 
        description: "Siswa yang terdaftar di kelas.",
        actionText: "Klik Data Siswa untuk menambah",
        onActionClick: () => setActivePage('DATA_SISWA'),
    },
    { 
        title: "Tahun Ajaran", 
        value: settings.tahun_ajaran || "-", 
        description: "Tahun ajaran yang sedang berjalan.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
    { 
        title: "Semester", 
        value: settings.semester || "-", 
        description: "Semester yang sedang berlangsung.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
  ];
  
  const analysisItems = useMemo(() => {
    const items = [];
    const minGrade = parseInt(settings.predikats?.c || '70', 10);
    const activeSubjects = subjects.filter(s => s.active);

    if (!settings.nama_sekolah || !settings.nama_wali_kelas || !settings.tahun_ajaran || !settings.nama_kelas) {
        items.push({
            title: 'Pengaturan Dasar',
            description: 'Lengkapi informasi sekolah, wali kelas, kelas, dan tahun ajaran di halaman Pengaturan.',
            status: 'incomplete'
        });
    }

    if (isNaN(minGrade) || students.length === 0 || activeSubjects.length === 0) {
        return items;
    }
    
    students.forEach(student => {
        const studentGrade = grades.find(g => g.studentId === student.id);
        if (!studentGrade) return;

        const failingSubjects = [];
        activeSubjects.forEach(subject => {
            const grade = studentGrade.finalGrades[subject.id];
            if (typeof grade === 'number' && grade < minGrade) {
                failingSubjects.push(`${subject.label} (${grade})`);
            }
        });

        if (failingSubjects.length > 0) {
            items.push({
                title: student.namaLengkap,
                description: `Nilai di bawah KKM: ${failingSubjects.join(', ')}`,
                status: 'attention'
            });
        }
    });

    return items;
  }, [students, grades, subjects, settings]);

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
        React.createElement('h3', { className: "text-2xl font-bold text-slate-800" }, "Analisis Data"),
        React.createElement('p', { className: "mt-1 text-slate-600" }, "Ringkasan data penting yang memerlukan perhatian Anda."),
        React.createElement('div', { className: "mt-6" },
          analysisItems.length > 0 ? (
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
              analysisItems.map(item => React.createElement(AnalysisItem, { key: item.title, ...item }))
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
