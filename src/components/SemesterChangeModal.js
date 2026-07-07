import React, { useState } from 'react';

const SemesterChangeModal = ({
    isOpen,
    currentSemester,
    pendingSemester,
    onClose,
    onConfirm,
    students = [],
    grades = [],
    attendance = [],
    notes = {},
    cocurricularData = {},
    studentExtracurriculars = [],
    formativeJournal = {}
}) => {
    const [selections, setSelections] = useState({
        students: true,
        formativeJournal: true,
        grades: true,
        cocurricularData: true,
        studentExtracurriculars: true,
        attendance: true,
        notes: true
    });

    if (!isOpen) return null;

    // Calculate metrics
    const countStudents = students?.length || 0;
    
    const countFormative = Object.values(formativeJournal || {}).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);
    
    let countGrades = 0;
    if (Array.isArray(grades)) {
        grades.forEach(g => {
            if (g && g.detailedGrades) {
                Object.values(g.detailedGrades).forEach(det => {
                    if (det && det.slm && Array.isArray(det.slm)) {
                        det.slm.forEach(s => {
                            if (s && s.scores) {
                                countGrades += s.scores.filter(sc => sc !== null && sc !== undefined && sc !== '').length;
                            }
                        });
                    }
                });
            }
        });
    }
    
    const countCocurricular = Object.keys(cocurricularData || {}).length;
    const countExtracurriculars = (studentExtracurriculars || []).length;
    const countAttendance = (attendance || []).length;
    const countNotes = Object.keys(notes || {}).filter(k => notes[k] && typeof notes[k] === 'string' && notes[k].trim()).length;

    const categoriesList = [
        {
            key: 'students',
            label: 'Data Siswa',
            description: 'Daftar nama siswa, NIS, dan NISN kelas.',
            count: countStudents,
            unit: 'siswa'
        },
        {
            key: 'grades',
            label: 'Data Nilai (Sumatif / TP)',
            description: 'Penilaian Sumatif TP untuk rapor.',
            count: countGrades,
            unit: 'input nilai'
        },
        {
            key: 'formativeJournal',
            label: 'Jurnal Formatif',
            description: 'Catatan kemajuan belajar harian siswa kelas.',
            count: countFormative,
            unit: 'catatan'
        },
        {
            key: 'cocurricularData',
            label: 'Data Kokurikuler (Projek P5)',
            description: 'Catatan dan predikat capaian nilai projek P5.',
            count: countCocurricular,
            unit: 'projek terisi'
        },
        {
            key: 'studentExtracurriculars',
            label: 'Data Ekstrakurikuler',
            description: 'Predikat nilai dan deskripsi ekstrakurikuler.',
            count: countExtracurriculars,
            unit: 'baris data'
        },
        {
            key: 'attendance',
            label: 'Data Kehadiran / Absensi',
            description: 'Jumlah Sakit, Izin, Alpa semester ini.',
            count: countAttendance,
            unit: 'siswa terisi'
        },
        {
            key: 'notes',
            label: 'Catatan Wali Kelas',
            description: 'Catatan perkembangan wali kelas di rapor.',
            count: countNotes,
            unit: 'catatan aktif'
        }
    ];

    const toggleSelection = (key) => {
        setSelections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSelectAll = (val) => {
        setSelections({
            students: val,
            formativeJournal: val,
            grades: val,
            cocurricularData: val,
            studentExtracurriculars: val,
            attendance: val,
            notes: val
        });
    };

    const handleConfirm = () => {
        onConfirm(selections);
    };

    return (
        React.createElement('div', { 
            className: "fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto",
            onClick: onClose
        },
            React.createElement('div', { 
                className: "bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200", 
                onClick: e => e.stopPropagation() 
            },
                // Header
                React.createElement('div', { className: "p-6 border-b border-slate-100 flex items-start gap-4" },
                    React.createElement('div', { className: "p-3 bg-amber-50 rounded-xl text-amber-600 flex-shrink-0" },
                        React.createElement('svg', { className: "h-6 w-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: "2" },
                            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('h3', { className: "text-lg md:text-xl font-bold text-slate-900" }, "Konfirmasi Perubahan Semester"),
                        React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, 
                            `Anda akan mengubah periode aktif dari `,
                            React.createElement('span', { className: "font-semibold text-indigo-600" }, `Semester ${currentSemester || 'Ganjil'}`),
                            ` menjadi `,
                            React.createElement('span', { className: "font-semibold text-emerald-600" }, `Semester ${pendingSemester || 'Genap'}`),
                            `.`
                        )
                    )
                ),

                // Info / Warning
                React.createElement('div', { className: "px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs md:text-sm text-slate-600 space-y-2" },
                    React.createElement('p', { className: "font-medium text-slate-800" }, 
                        "Bagaimana aplikasi menyesuaikan data Anda?"
                    ),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-1 text-slate-500" },
                        React.createElement('li', null, 
                            React.createElement('strong', { className: "text-slate-700" }, "Dicentang (Pertahankan): "), 
                            "Data tetap disimpan dan akan disaring otomatis agar menampilkan data yang sesuai dengan semester aktif yang baru. Sisa data tersimpan aman."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', { className: "text-slate-700" }, "Tidak Dicentang (Hapus): "), 
                            "Seluruh catatan data pilihan tersebut akan dihapus permanen dari browser dan localforage untuk mengurangi penggunaan memori."
                        )
                    )
                ),

                // Selection List
                React.createElement('div', { className: "p-6 space-y-4 max-h-[40vh] overflow-y-auto" },
                    React.createElement('div', { className: "flex justify-between items-center pb-2 border-b border-slate-100" },
                        React.createElement('span', { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider" }, "Daftar File & Data Tersimpan"),
                        React.createElement('div', { className: "flex gap-3 text-xs" },
                            React.createElement('button', { 
                                type: "button",
                                onClick: () => handleSelectAll(true),
                                className: "text-indigo-600 hover:text-indigo-800 font-semibold"
                            }, "Pertahankan Semua"),
                            React.createElement('span', { className: "text-slate-300" }, "|"),
                            React.createElement('button', { 
                                type: "button",
                                onClick: () => handleSelectAll(false),
                                className: "text-red-500 hover:text-red-700 font-semibold"
                            }, "Hapus Semua")
                        )
                    ),
                    categoriesList.map((item) => {
                        const isRetained = selections[item.key];
                        return React.createElement('div', { 
                            key: item.key, 
                            onClick: () => toggleSelection(item.key),
                            className: `flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isRetained 
                                    ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/60' 
                                    : 'bg-rose-50/20 border-slate-100 hover:bg-slate-50/80 hover:border-slate-200'
                            }`
                        },
                            // Checkbox
                            React.createElement('div', { className: "flex items-center justify-center flex-shrink-0" },
                                React.createElement('input', {
                                    type: "checkbox",
                                    checked: isRetained,
                                    onChange: () => {}, // Handled by outer click
                                    className: "h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                })
                            ),
                            // Label / Description
                            React.createElement('div', { className: "flex-1 min-w-0" },
                                React.createElement('div', { className: "flex items-center justify-between" },
                                    React.createElement('span', { className: "text-sm font-semibold text-slate-800" }, item.label),
                                    React.createElement('span', { 
                                        className: `text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                            item.count > 0 
                                                ? 'bg-slate-100 text-slate-600' 
                                                : 'bg-slate-50 text-slate-300'
                                        }` 
                                    }, `${item.count} ${item.unit}`)
                                ),
                                React.createElement('p', { className: "text-xs text-slate-400 mt-0.5 mt-q" }, item.description)
                            ),
                            // Status Badge
                            React.createElement('span', { 
                                className: `text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 border ${
                                    isRetained 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                }` 
                            }, isRetained ? "Pertahankan" : "Hapus")
                        );
                    })
                ),

                // Footer
                React.createElement('div', { className: "flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl" },
                    React.createElement('button', { 
                        onClick: onClose, 
                        className: "bg-white py-2.5 px-5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200" 
                    }, "Batal"),
                    React.createElement('button', {
                        onClick: handleConfirm,
                        className: "py-2.5 px-6 rounded-xl shadow-lg border border-transparent text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-px transition-all duration-200"
                    }, "Simpan & Terapkan")
                )
            )
        )
    );
};

export default SemesterChangeModal;
