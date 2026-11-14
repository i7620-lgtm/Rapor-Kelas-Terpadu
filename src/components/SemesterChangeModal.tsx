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
}: any) => {
    const [selections, setSelections] = useState<any>({
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
    
    const countFormative = Object.values(formativeJournal || {}).reduce((acc: any, list: any) => acc + (Array.isArray(list) ? list.length : 0), 0);
    
    let countGrades = 0;
    if (Array.isArray(grades)) {
        grades.forEach(g => {
            if (g && g.detailedGrades) {
                Object.values(g.detailedGrades).forEach((det: any) => {
                    if (det && det.slm && Array.isArray(det.slm)) {
                        det.slm.forEach((s: any) => {
                            if (s && s.scores) {
                                countGrades += s.scores.filter((sc: any) => sc !== null && sc !== undefined && sc !== '').length;
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

    const toggleSelection = (key: string) => {
        setSelections((prev: any) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSelectAll = (val: boolean) => {
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
        <div 
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[92dvh] sm:max-h-[90dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Konfirmasi Perubahan Semester</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Anda akan mengubah periode aktif dari{' '}
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Semester {currentSemester || 'Ganjil'}</span>
                            {' menjadi '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Semester {pendingSemester || 'Genap'}</span>
                            .
                        </p>
                    </div>
                </div>

                {/* Info / Warning */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs md:text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                        Bagaimana aplikasi menyesuaikan data Anda?
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                        <li>
                            <strong className="text-slate-700 dark:text-slate-200">Dicentang (Pertahankan): </strong>
                            Data tetap disimpan dan akan disaring otomatis agar menampilkan data yang sesuai dengan semester aktif yang baru. Sisa data tersimpan aman.
                        </li>
                        <li>
                            <strong className="text-slate-700 dark:text-slate-200">Tidak Dicentang (Hapus): </strong>
                            Seluruh catatan data pilihan tersebut akan dihapus permanen dari browser dan localforage untuk mengurangi penggunaan memori.
                        </li>
                    </ul>
                </div>

                {/* Selection List */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daftar File & Data Tersimpan</span>
                        <div className="flex items-center gap-2 text-xs">
                            <button 
                                type="button"
                                onClick={() => handleSelectAll(true)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold px-2 py-1 min-h-[36px] lg:min-h-0"
                            >Pertahankan Semua</button>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <button 
                                type="button"
                                onClick={() => handleSelectAll(false)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 font-semibold px-2 py-1 min-h-[36px] lg:min-h-0"
                            >Hapus Semua</button>
                        </div>
                    </div>
                    {categoriesList.map((item) => {
                        const isRetained = selections[item.key];
                        return (
                            <div 
                                key={item.key} 
                                onClick={() => toggleSelection(item.key)}
                                className={`flex items-center gap-3 sm:gap-4 p-3 min-h-[44px] rounded-xl border transition-all duration-200 cursor-pointer ${
                                    isRetained 
                                        ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40' 
                                        : 'bg-rose-50/30 dark:bg-rose-950/20 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                                }`}
                            >
                                {/* Checkbox */}
                                <div className="flex items-center justify-center flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isRetained}
                                        onChange={() => {}} // Handled by outer click
                                        className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                {/* Label / Description */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</span>
                                        <span 
                                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium tabular-nums ${
                                                item.count > 0 
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                                            }`}
                                        >{item.count} {item.unit}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                                </div>
                                {/* Status Badge */}
                                <span 
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 border ${
                                        isRetained 
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    }`}
                                >
                                    {isRetained ? "Pertahankan" : "Hapus"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto bg-white dark:bg-slate-800 py-2.5 px-5 min-h-[44px] lg:min-h-0 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200" 
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="w-full sm:w-auto py-2.5 px-6 min-h-[44px] lg:min-h-0 rounded-xl shadow-lg border border-transparent text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-px transition-all duration-200"
                    >
                        Simpan & Terapkan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SemesterChangeModal;
