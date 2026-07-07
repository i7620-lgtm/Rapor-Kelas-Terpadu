
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
            React.createElement('div', { className: "p-6" },
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
            React.createElement('div', { className: "p-6" },
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
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden" },
                 React.createElement('div', { className: "flex flex-wrap items-start justify-between gap-4" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Piagam Penghargaan"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Buat dan cetak piagam untuk siswa berprestasi.")
                    ),
                    React.createElement('div', { className: "flex flex-wrap items-end gap-4" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'filterSelector', className: "block text-sm font-medium text-slate-700 mb-1" }, 'Tampilkan Peringkat'),
                            React.createElement('select', { id: "filterSelector", value: selectedFilter, onChange: (e) => setSelectedFilter(e.target.value), className: "w-full sm:w-64 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Peringkat"),
                                React.createElement('option', { value: "top3" }, "Cetak Peringkat 1-3"),
                                React.createElement('option', { value: "top10" }, "Cetak Peringkat 1-10")
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: "block text-sm font-medium text-slate-700 mb-1" }, 'Ukuran Kertas'),
                            React.createElement('select', { id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { onClick: () => setIsEditorOpen(true), className: "px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Desain Tata Letak Piagam"),
                        isMobileDevice ?
                            React.createElement('button', { onClick: () => onPrintRequest(handleDownloadPDF), disabled: isPrinting, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" }, isPrinting ? 'Mempersiapkan...' : 'Unduh PDF') :
                            React.createElement('button', { onClick: () => onPrintRequest(handlePrint), disabled: isPrinting, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" }, isPrinting ? 'Mempersiapkan...' : 'Cetak Piagam')
                    )
                ),
                React.createElement('div', { className: "border-t pt-4 mt-4" },
                    React.createElement('div', { className: "flex flex-wrap items-center gap-x-6 gap-y-2" },
                        React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-0" }, "Opsi Tanda Tangan:"),
                        React.createElement('label', { className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showPrincipalSignature === true || printOptions.showPrincipalSignature === 'true', onChange: () => handlePrintOptionChange('showPrincipalSignature'), className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                            React.createElement('span', { className: "text-sm" }, "TTD Kepala Sekolah")
                        ),
                        React.createElement('label', { className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showTeacherSignature === true || printOptions.showTeacherSignature === 'true', onChange: () => handlePrintOptionChange('showTeacherSignature'), className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                            React.createElement('span', { className: "text-sm" }, "TTD Wali Kelas")
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
            React.createElement('div', { id: "print-area", ref: printAreaRef, className: "flex flex-col items-center space-y-8" },
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
                }) : React.createElement('p', {className: "text-center text-slate-500 py-10"}, "Tidak ada siswa yang memiliki peringkat untuk dicetak sesuai filter yang dipilih.")
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
