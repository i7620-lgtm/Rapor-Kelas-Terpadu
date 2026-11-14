
import React from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useStudentsStore } from '../stores/useStudentsStore';
import { useNilaiStore } from '../stores/useNilaiStore';
import { EmptyState } from './EmptyState';
import { ExportProgressModal } from './ExportProgressModal';
import { IncompleteDataModal } from './IncompleteDataModal';

import { PAPER_SIZES } from './PrintPiagam/utils';
import { PiagamPage } from './PrintPiagam/PiagamPage';
import { PiagamEditorModal } from './PrintPiagam/PiagamEditorModal';
import { usePrintPiagamPageLogic } from './PrintPiagam/usePrintPiagamPageLogic';

const PrintPiagamPage = ({ students: propStudents, settings: propSettings, grades: propGrades, subjects: propSubjects, onUpdatePiagamLayout, showToast, setActivePage }) => {
    const storeSettings = useSettingsStore((state) => state.settings);
    const storeSubjects = useSettingsStore((state) => state.subjects);
    const storeStudents = useStudentsStore((state) => state.students);
    const storeGrades = useNilaiStore((state) => state.grades);
    const setSettings = useSettingsStore((state) => state.setSettings);

    const settings = propSettings || storeSettings;
    const subjects = propSubjects || storeSubjects;
    const students = propStudents || storeStudents;
    const grades = propGrades || storeGrades;

    const defaultOnUpdateLayout = (newLayout) => {
        const currentSemester = settings?.semester || "Ganjil";
        const layoutField = currentSemester === "Genap" ? "piagam_layout_Genap" : "piagam_layout";
        setSettings((s) => ({ ...s, [layoutField]: newLayout }));
    };

    const logic = usePrintPiagamPageLogic({
        students,
        grades,
        subjects,
        settings,
        onUpdatePiagamLayout: onUpdatePiagamLayout || defaultOnUpdateLayout,
        showToast,
        setActivePage
    });

    const {
        handleUpdateLayout,
        showIncompleteModal,
        setShowIncompleteModal,
        handleContinuePrint,
        incompleteItems,
        paperSize,
        setPaperSize,
        selectedFilter,
        setSelectedFilter,
        isPrinting,
        isEditorOpen,
        setIsEditorOpen,
        printOptions,
        handlePrintOptionChange,
        printAreaRef,
        isMobileDevice,
        handleDownloadPDF,
        handlePrint,
        studentsToRender,
        pageStyle,
        studentRankings,
        exportProgress,
        onPrintRequest
    } = logic;

    if (students.length === 0) {
        return (
            React.createElement('div', { className: "space-y-4" },
                React.createElement('div', { className: "text-left" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight" }, "Cetak Piagam Penghargaan"),
                    React.createElement('p', { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400" }, "Buat dan cetak piagam untuk siswa berprestasi.")
                ),
                React.createElement(EmptyState, {
                    title: "Belum ada data siswa",
                    description: "Piagam tidak dapat dicetak karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu.",
                    primaryActionLabel: "Isi Data Siswa",
                    onPrimaryAction: () => setActivePage && setActivePage('DATA_SISWA')
                })
            )
        );
    }

    if (grades.length === 0) {
        return (
            React.createElement('div', { className: "space-y-4" },
                React.createElement('div', { className: "text-left" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight" }, "Cetak Piagam Penghargaan"),
                    React.createElement('p', { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400" }, "Buat dan cetak piagam untuk siswa berprestasi.")
                ),
                React.createElement(EmptyState, {
                    title: "Menunggu Data Nilai",
                    description: "Semua data nilai siswa saat ini kosong. Piagam prestasi bergantung pada peringkat nilai. Lanjutkan ke halaman Data Nilai terlebih dahulu untuk melengkapinya.",
                    primaryActionLabel: "Isi Data Nilai",
                    onPrimaryAction: () => setActivePage && setActivePage('DATA_NILAI')
                })
            )
        );
    }

    return (
        React.createElement(React.Fragment, null,
            React.createElement(PiagamEditorModal, { isOpen: isEditorOpen, onClose: () => setIsEditorOpen(false), settings: settings, onSaveLayout: handleUpdateLayout }),
            React.createElement('div', { className: "bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-4 print-hidden" },
                 React.createElement('div', { className: "flex flex-wrap items-start justify-between gap-3" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight" }, "Cetak Piagam Penghargaan"),
                        React.createElement('p', { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400" }, "Buat dan cetak piagam untuk siswa berprestasi.")
                    ),
                    React.createElement('div', { className: "flex flex-wrap items-end gap-3 w-full lg:w-auto" },
                        React.createElement('div', { className: "w-full sm:w-auto" },
                            React.createElement('label', { htmlFor: 'filterSelector', className: "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" }, 'Tampilkan Peringkat'),
                            React.createElement('select', { id: "filterSelector", value: selectedFilter, onChange: (e) => setSelectedFilter(e.target.value), className: "w-full sm:w-56 py-1.5 px-2.5 min-h-[44px] lg:min-h-0 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Peringkat"),
                                React.createElement('option', { value: "top3" }, "Cetak Peringkat 1-3"),
                                React.createElement('option', { value: "top10" }, "Cetak Peringkat 1-10")
                            )
                        ),
                        React.createElement('div', { className: "w-full sm:w-auto" },
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" }, 'Ukuran Kertas'),
                            React.createElement('select', { id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-44 py-1.5 px-2.5 min-h-[44px] lg:min-h-0 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 tabular-nums" },
                                Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { onClick: () => setIsEditorOpen(true), className: "w-full sm:w-auto px-3 py-1.5 min-h-[44px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/70 whitespace-nowrap shrink-0" }, "Desain Tata Letak Piagam"),
                        isMobileDevice ?
                            React.createElement('button', { onClick: () => onPrintRequest(handleDownloadPDF), disabled: isPrinting, className: "w-full sm:w-auto px-3 py-1.5 min-h-[44px] lg:min-h-0 text-xs font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0" }, isPrinting ? 'Mempersiapkan...' : 'Unduh PDF') :
                            React.createElement('button', { onClick: () => onPrintRequest(handlePrint), disabled: isPrinting, className: "w-full sm:w-auto px-3 py-1.5 min-h-[44px] lg:min-h-0 text-xs font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0" }, isPrinting ? 'Mempersiapkan...' : 'Cetak Piagam')
                    )
                ),
                React.createElement('div', { className: "border-t border-slate-200 dark:border-slate-700 pt-3 mt-3" },
                    React.createElement('div', { className: "flex flex-wrap items-center gap-x-5 gap-y-1" },
                        React.createElement('p', { className: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0" }, "Opsi Tanda Tangan:"),
                        React.createElement('label', { className: "flex items-center space-x-2 cursor-pointer min-h-[40px] lg:min-h-0" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showPrincipalSignature === true || printOptions.showPrincipalSignature === 'true', onChange: () => handlePrintOptionChange('showPrincipalSignature'), className: "h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded cursor-pointer" }),
                            React.createElement('span', { className: "text-xs sm:text-sm text-slate-700 dark:text-slate-200" }, "TTD Kepala Sekolah")
                        ),
                        React.createElement('label', { className: "flex items-center space-x-2 cursor-pointer min-h-[40px] lg:min-h-0" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showTeacherSignature === true || printOptions.showTeacherSignature === 'true', onChange: () => handlePrintOptionChange('showTeacherSignature'), className: "h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded cursor-pointer" }),
                            React.createElement('span', { className: "text-xs sm:text-sm text-slate-700 dark:text-slate-200" }, "TTD Wali Kelas")
                        )
                    )
                )
            ),
            React.createElement(IncompleteDataModal, {
                isOpen: showIncompleteModal,
                onClose: () => setShowIncompleteModal(false),
                onContinue: handleContinuePrint,
                incompleteChecks: incompleteItems
            }),
            React.createElement('div', { id: "print-area", ref: printAreaRef, className: "w-full overflow-x-auto pb-4 flex flex-col items-start md:items-center space-y-8" },
                studentsToRender.length > 0 ? studentsToRender.map(student => {
                    const studentData = studentRankings.get(student.id);
                    return React.createElement(PiagamPage, { 
                        key: student.id, 
                        student: student, 
                        settings: settings, 
                        pageStyle: pageStyle,
                        rank: studentData?.rank,
                        average: studentData?.average,
                        printOptions: printOptions
                    });
                }) : React.createElement('p', {className: "text-center text-slate-500 dark:text-slate-400 py-10 w-full"}, "Tidak ada siswa yang memiliki peringkat untuk dicetak sesuai filter yang dipilih.")
            ),
            React.createElement(ExportProgressModal, {
                isOpen: exportProgress !== null,
                current: exportProgress?.current || 0,
                total: exportProgress?.total || 0,
                statusText: exportProgress?.statusText,
                title: "Mengunduh Piagam Prestasi"
            })
        )
    );
};

export default PrintPiagamPage;
