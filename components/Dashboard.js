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
            )
            ,
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

const ChecklistItem = ({ title, status, message, actionText, onActionClick, percentage }) => {
    const percentageColorClass = percentage === 100 ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
    
    return (
        React.createElement('div', { className: "relative flex items-start py-4 pl-4 pr-16 bg-white rounded-lg shadow-sm border border-slate-200 space-x-4" },
            React.createElement('div', { className: `absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold z-10 ${percentageColorClass}`, style: { width: '40px', height: '40px', borderRadius: '50%' } },
                `${percentage}%`
            ),
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
};


const Dashboard = ({ 
    setActivePage, 
    onNavigateToNilai, 
    settings = {}, 
    students = [], 
    grades = [], 
    subjects = [], 
    notes = {}, 
    cocurricularData = {},
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
        value: (students || []).length.toString(), 
        description: "Siswa yang terdaftar di kelas.",
        actionText: "Tambah Siswa Pertama",
        onActionClick: () => setActivePage('DATA_SISWA'),
        showAction: (students || []).length === 0
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
    const activeSubjects = (subjects || []).filter(s => s.active);
    const currentStudents = students || [];
    const currentGrades = grades || [];

    if (isNaN(minGrade) || currentStudents.length === 0 || activeSubjects.length === 0) {
        return items;
    }
    
    currentStudents.forEach(student => {
        const studentGrade = currentGrades.find(g => g.studentId === student.id);
        if (!studentGrade) return;

        const studentReligion = student.agama?.trim().toLowerCase();

        const relevantSubjects = activeSubjects.filter(subject => {
            if (subject.fullName.startsWith('Pendidikan Agama dan Budi Pekerti')) {
                if (!studentReligion) return false;
                
                const subjectReligionMatch = subject.fullName.match(/\(([^)]+)\)/);
                if (subjectReligionMatch) {
                    const subjectReligion = subjectReligionMatch[1].trim().toLowerCase();
                    return subjectReligion === studentReligion;
                }
                return false;
            }
            return true;
        });

        const failingSubjects = [];
        let firstFailingSubjectId = null;

        relevantSubjects.forEach(subject => {
            const grade = studentGrade?.finalGrades?.[subject.id];
            
            const isMissing = grade === undefined || grade === null || grade === '';
            const isBelowKKM = typeof grade === 'number' && grade < minGrade;

            if (isMissing || isBelowKKM) {
                const gradeDisplay = isMissing ? 'Kosong' : grade;
                failingSubjects.push(`${subject.label} (${gradeDisplay})`);
                if (!firstFailingSubjectId) firstFailingSubjectId = subject.id;
            }
        });

        if (failingSubjects.length > 0) {
            items.push({
                title: student.namaLengkap,
                description: `Nilai perlu perhatian: ${failingSubjects.join(', ')}`,
                status: 'attention',
                actionSubjectId: firstFailingSubjectId,
            });
        }
    });

    return items;
  }, [students, grades, subjects, settings]);

    const completenessChecks = useMemo(() => {
        const results = [];
        const activeSubjects = (subjects || []).filter(s => s.active);
        const currentStudents = students || [];
        const currentGrades = grades || [];
        const currentAttendance = attendance || [];
        const currentStudentExtracurriculars = studentExtracurriculars || [];
        const totalStudents = currentStudents.length;

        const settingsFields = ['nama_sekolah', 'nama_wali_kelas', 'nama_kelas', 'tahun_ajaran', 'semester'];
        let filledSettingsFields = settingsFields.filter(key => settings[key] && settings[key].trim() !== '').length;
        const settingsPercentage = Math.round((filledSettingsFields / settingsFields.length) * 100);

        if (settingsPercentage === 100) {
            results.push({ category: 'Pengaturan', title: 'Informasi Dasar', status: 'good', message: 'Informasi dasar sekolah, kelas, dan wali kelas sudah terisi.', percentage: 100 });
        } else {
            const missingSettings = settingsFields.filter(key => !settings[key] || settings[key].trim() === '');
            results.push({ category: 'Pengaturan', title: 'Informasi Dasar', status: 'bad', message: `Data berikut belum diisi: ${missingSettings.join(', ')}.`, actionText: 'Lengkapi di Pengaturan', onActionClick: () => setActivePage('PENGATURAN'), percentage: settingsPercentage });
        }

        if (totalStudents === 0) {
            const emptyDataMessages = [
                { category: 'Data Siswa', title: 'Data Siswa', message: 'Belum ada data siswa.', actionText: 'Tambah Siswa', page: 'DATA_SISWA' },
                { category: 'Data Nilai', title: 'Data Nilai', message: 'Belum ada data siswa.', actionText: 'Periksa Data Nilai', page: 'DATA_NILAI' },
                { category: 'Data Lainnya', title: 'Data Absensi', message: 'Belum ada data siswa.', actionText: 'Periksa Data Absensi', page: 'DATA_ABSENSI' },
                { category: 'Data Lainnya', title: 'Kokurikuler', message: 'Belum ada data siswa.', actionText: 'Isi Catatan', page: 'DATA_KOKURIKULER' },
                { category: 'Data Lainnya', title: 'Catatan Wali Kelas', message: 'Belum ada data siswa.', actionText: 'Isi Catatan', page: 'CATATAN_WALI_KELAS' },
                { category: 'Data Lainnya', title: 'Ekstrakurikuler', message: 'Belum ada data siswa.', actionText: 'Atur Ekstrakurikuler', page: 'DATA_EKSTRAKURIKULER' },
            ];
            emptyDataMessages.forEach(item => results.push({ ...item, status: 'bad', onActionClick: () => setActivePage(item.page), percentage: 0 }));
            return results;
        }

        const studentDataFieldsToCheck = ['namaLengkap', 'namaPanggilan', 'nis', 'nisn', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'asalTk', 'alamatSiswa', 'diterimaDiKelas', 'diterimaTanggal', 'namaAyah', 'namaIbu', 'pekerjaanAyah', 'pekerjaanIbu', 'alamatOrangTua', 'teleponOrangTua'];
        const totalStudentDataFields = totalStudents * studentDataFieldsToCheck.length;
        let filledStudentDataFields = currentStudents.reduce((acc, student) => acc + studentDataFieldsToCheck.filter(field => student[field] && String(student[field]).trim() !== '').length, 0);
        const studentDataPercentage = totalStudentDataFields > 0 ? Math.round((filledStudentDataFields / totalStudentDataFields) * 100) : 100;

        if (studentDataPercentage === 100) {
            results.push({ category: 'Data Siswa', title: 'Data Siswa', status: 'good', message: 'Data pribadi dan orang tua untuk semua siswa telah terisi lengkap.', percentage: 100 });
        } else {
            results.push({ category: 'Data Siswa', title: 'Data Siswa', status: 'bad', message: `Terdapat ${totalStudentDataFields - filledStudentDataFields} data pribadi/orang tua yang belum diisi.`, actionText: 'Lengkapi Data Siswa', onActionClick: () => setActivePage('DATA_SISWA'), percentage: studentDataPercentage });
        }

        let studentsWithCompleteGrades = 0;
        const minGrade = parseInt(settings.predikats?.c || '70', 10);

        currentStudents.forEach(student => {
            const studentGrade = currentGrades.find(g => g.studentId === student.id);
            const studentReligion = student.agama?.trim().toLowerCase();
            const relevantSubjects = activeSubjects.filter(subject => {
                if (subject.fullName.startsWith('Pendidikan Agama dan Budi Pekerti')) {
                    if (!studentReligion) return false;
                    const subjectReligionMatch = subject.fullName.match(/\(([^)]+)\)/);
                    return subjectReligionMatch && subjectReligionMatch[1].trim().toLowerCase() === studentReligion;
                }
                return true;
            });
            if (relevantSubjects.every(sub => {
                const grade = studentGrade?.finalGrades?.[sub.id];
                return typeof grade === 'number' && grade >= minGrade;
            })) {
                studentsWithCompleteGrades++;
            }
        });
        const gradesPercentage = Math.round((studentsWithCompleteGrades / totalStudents) * 100);

        if (gradesPercentage === 100) {
            results.push({ category: 'Data Nilai', title: 'Data Nilai', status: 'good', message: 'Semua siswa memiliki nilai akhir lengkap dan di atas KKM.', percentage: 100 });
        } else {
            results.push({ category: 'Data Nilai', title: 'Data Nilai', status: 'bad', message: `${totalStudents - studentsWithCompleteGrades} siswa dengan nilai belum lengkap atau di bawah KKM.`, actionText: 'Periksa Data Nilai', onActionClick: () => setActivePage('DATA_NILAI'), percentage: gradesPercentage });
        }

        const checkSimpleCompletion = (data, key, title, page) => {
            let completed = currentStudents.filter(s => data[s.id] && data[s.id].trim() !== '').length;
            const percentage = Math.round((completed / totalStudents) * 100);
            if (percentage === 100) {
                results.push({ category: 'Data Lainnya', title, status: 'good', message: `Semua siswa telah memiliki ${title.toLowerCase()}.`, percentage: 100 });
            } else {
                results.push({ category: 'Data Lainnya', title, status: 'bad', message: `${totalStudents - completed} siswa belum memiliki ${title.toLowerCase()}.`, actionText: 'Isi Catatan', onActionClick: () => setActivePage(page), percentage });
            }
        };

        const cocurricData = cocurricularData || {};
        let studentsWithCo = currentStudents.filter(s => {
            const studentCoData = cocurricData[s.id];
            return studentCoData && Object.values(studentCoData.dimensionRatings || {}).some(r => r);
        }).length;
        const coPercentage = Math.round((studentsWithCo / totalStudents) * 100);
        if (coPercentage === 100) {
            results.push({ category: 'Data Lainnya', title: 'Kokurikuler', status: 'good', message: `Semua siswa telah memiliki penilaian kokurikuler.`, percentage: 100 });
        } else {
            results.push({ category: 'Data Lainnya', title: 'Kokurikuler', status: 'bad', message: `${totalStudents - studentsWithCo} siswa belum memiliki penilaian kokurikuler.`, actionText: 'Isi Penilaian', onActionClick: () => setActivePage('DATA_KOKURIKULER'), percentage: coPercentage });
        }
        
        checkSimpleCompletion(notes, 'notes', 'Catatan Wali Kelas', 'CATATAN_WALI_KELAS');
        
        let studentsWithAttendance = currentStudents.filter(s => currentAttendance.some(a => a.studentId === s.id && (a.sakit !== null || a.izin !== null || a.alpa !== null))).length;
        const attendancePercentage = Math.round((studentsWithAttendance / totalStudents) * 100);
        if (attendancePercentage === 100) {
            results.push({ category: 'Data Lainnya', title: 'Data Absensi', status: 'good', message: 'Data absensi semua siswa telah terisi.', percentage: 100 });
        } else {
            results.push({ category: 'Data Lainnya', title: 'Data Absensi', status: 'bad', message: `${totalStudents - studentsWithAttendance} siswa belum memiliki catatan absensi.`, actionText: 'Periksa Data Absensi', onActionClick: () => setActivePage('DATA_ABSENSI'), percentage: attendancePercentage });
        }

        let studentsWithExtra = currentStudents.filter(s => currentStudentExtracurriculars.some(se => se.studentId === s.id && se.assignedActivities?.some(activity => activity !== null))).length;
        const extraPercentage = Math.round((studentsWithExtra / totalStudents) * 100);
        if (extraPercentage === 100) {
            results.push({ category: 'Data Lainnya', title: 'Ekstrakurikuler', status: 'good', message: 'Semua siswa memiliki setidaknya satu ekstrakurikuler.', percentage: 100 });
        } else {
            results.push({ category: 'Data Lainnya', title: 'Ekstrakurikuler', status: 'bad', message: `${totalStudents - studentsWithExtra} siswa belum memiliki ekstrakurikuler.`, actionText: 'Atur Ekstrakurikuler', onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'), percentage: extraPercentage });
        }

        return results;
    }, [settings, students, grades, notes, cocurricularData, attendance, studentExtracurriculars, subjects, setActivePage]);

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
