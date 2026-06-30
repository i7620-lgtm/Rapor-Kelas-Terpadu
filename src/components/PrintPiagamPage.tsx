
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useStudentsStore } from '../stores/useStudentsStore';
import { useNilaiStore } from '../stores/useNilaiStore';
import { EmptyState } from './EmptyState';
import { ExportProgressModal } from './ExportProgressModal';
import { getFontEmbedCSS } from '../utils/pdfFonts';
import { useDashboardLogic } from './Dashboard/useDashboardLogic';
import { IncompleteDataModal } from './IncompleteDataModal';

import { PAPER_SIZES } from './PrintPiagam/utils';
import { PiagamPage } from './PrintPiagam/PiagamPage';
import { PiagamEditorModal } from './PrintPiagam/PiagamEditorModal';
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

    const handleUpdateLayout = onUpdatePiagamLayout || ((newLayout) => {
        const currentSemester = settings?.semester || "Ganjil";
        const layoutField = currentSemester === "Genap" ? "piagam_layout_Genap" : "piagam_layout";
        setSettings((s) => ({ ...s, [layoutField]: newLayout }));
    });

    const { completenessChecks } = useDashboardLogic({ setActivePage: setActivePage || (() => {}) });
    const incompleteItems = completenessChecks.filter(check => check.status === 'bad' && check.category !== 'Data Lainnya');

    const [showIncompleteModal, setShowIncompleteModal] = useState(false);
    const [pendingPrintAction, setPendingPrintAction] = useState<(() => void) | null>(null);

    const onPrintRequest = (action: () => void) => {
        if (incompleteItems.length > 0) {
            setPendingPrintAction(() => action);
            setShowIncompleteModal(true);
        } else {
            action();
        }
    };

    const handleContinuePrint = () => {
        setShowIncompleteModal(false);
        if (pendingPrintAction) {
            pendingPrintAction();
            setPendingPrintAction(null);
        }
    };

    const [paperSize, setPaperSize] = useState('A4');
    const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'top3', 'top10'
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrintingState, setIsPrintingState] = useState(false);
    const [exportProgress, setExportProgress] = useState<{ current: number; total: number; statusText: string } | null>(null);
    useEffect(() => {
        const beforePrint = () => setIsPrintingState(true);
        const afterPrint = () => setIsPrintingState(false);
        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', afterPrint);
        return () => {
            window.removeEventListener('beforeprint', beforePrint);
            window.removeEventListener('afterprint', afterPrint);
        };
    }, []);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [printOptions, setPrintOptions] = useState({
        showPrincipalSignature: true,
        showTeacherSignature: true
    });

    const [scale, setScale] = useState(1);
    const printAreaRef = useRef(null);

    useEffect(() => {
        const updateScale = () => {
            if (printAreaRef.current && !isPrinting && !isPrintingState) {
                const containerWidth = printAreaRef.current.clientWidth;
                const paperWidthCm = parseFloat(PAPER_SIZES[paperSize].width);
                const paperWidthPx = paperWidthCm * 37.7952755906;
                const margin = 32; // 2rem margin
                const availableWidth = containerWidth - margin;
                if (availableWidth < paperWidthPx) {
                    setScale(availableWidth / paperWidthPx);
                } else {
                    setScale(1);
                }
            } else {
                setScale(1);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [paperSize, isPrinting, isPrintingState]);

    const studentRankings = useMemo(() => {
        const allActiveSubjects = subjects.filter(s => s.active);
        const studentsWithScores = students.map(student => {
            const gradeData = grades.find(g => g.studentId === student.id);
            if (!gradeData || !gradeData.finalGrades) return { studentId: student.id, total: 0, count: 0 };

            const studentReligion = String(student.agama || '').trim().toLowerCase();
            let total = 0, count = 0;
            
            Object.entries(gradeData.finalGrades).forEach(([subjectId, score]) => {
                const subjectInfo = allActiveSubjects.find(s => s.id === subjectId);
                if (subjectInfo && typeof score === 'number') {
                    if (subjectInfo.fullName.startsWith('Pendidikan Agama')) {
                        if (studentReligion && subjectInfo.fullName.toLowerCase().includes(`(${studentReligion})`)) {
                            total += score;
                            count++;
                        }
                    } else {
                        total += score;
                        count++;
                    }
                }
            });
            return { studentId: student.id, total, count, average: count > 0 ? (total / count).toFixed(2) : "0.00" };
        });

        const sortedStudents = [...studentsWithScores].sort((a, b) => b.total - a.total);
        const rankMap = new Map();
        if (sortedStudents.length > 0) {
            let currentRank = 1;
            rankMap.set(sortedStudents[0].studentId, { ...sortedStudents[0], rank: sortedStudents[0].total > 0 ? currentRank : null });
            for (let i = 1; i < sortedStudents.length; i++) {
                if (sortedStudents[i].total < sortedStudents[i - 1].total) currentRank = i + 1;
                rankMap.set(sortedStudents[i].studentId, { ...sortedStudents[i], rank: sortedStudents[i].total > 0 ? currentRank : null });
            }
        }
        return rankMap;
    }, [students, grades, subjects]);

    const handlePrintOptionChange = (key) => {
        setPrintOptions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const handleDownloadPDF = async () => {
        setIsPrinting(true);
        showToast('Mempersiapkan PDF (Ini mungkin memakan waktu)...', 'info');

        try {
            if (printAreaRef.current) {
                const pages = Array.from(printAreaRef.current.querySelectorAll('.report-page, .piagam-page'));
                
                if (pages.length === 0) {
                     showToast('Gagal menemukan halaman.', 'error');
                     return;
                }

                setExportProgress({ current: 0, total: pages.length, statusText: 'Mempersiapkan konversi halaman...' });
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const pxPerCm = 37.7952755906;
                const widthPx = parseFloat(PAPER_SIZES[paperSize].width) * pxPerCm;
                const heightPx = parseFloat(PAPER_SIZES[paperSize].height) * pxPerCm;
                const formatWidth = parseFloat(PAPER_SIZES[paperSize].width);
                const formatHeight = parseFloat(PAPER_SIZES[paperSize].height);
                
                // PrintPiagam is typically landscape. A4 width > height
                const orientation = formatWidth > formatHeight ? 'landscape' : 'portrait';

                const pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'cm',
                    format: [formatWidth, formatHeight]
                });
                
                const fontEmbedCSSStr = await getFontEmbedCSS();
                
                for (let i = 0; i < pages.length; i++) {
                    setExportProgress({
                        current: i,
                        total: pages.length,
                        statusText: `Mengonversi piagam ${i + 1} dari ${pages.length} ke format gambar...`
                    });

                    const node = pages[i];
                    
                    const originalTransform = node.style.transform;
                    const originalWidth = node.style.width;
                    const originalHeight = node.style.height;
                    const originalPosition = node.style.position;
                    const originalLeft = node.style.left;
                    const originalTop = node.style.top;
                    const originalZIndex = node.style.zIndex;

                    node.style.transform = 'none';
                    node.style.width = widthPx + 'px';
                    node.style.height = heightPx + 'px';
                    node.style.position = 'absolute';
                    node.style.left = '0px';
                    node.style.top = '0px';
                    node.style.zIndex = '-9999';
                    
                    await new Promise(resolve => setTimeout(resolve, 150));
                    
                    const scaleFactor = 2;
                    const imgData = await htmlToImage.toJpeg(node, {
                        quality: 0.98,
                        backgroundColor: '#ffffff',
                        pixelRatio: scaleFactor,
                        fontEmbedCSS: fontEmbedCSSStr,
                        style: {
                            margin: 0
                        }
                    });
                    
                    node.style.transform = originalTransform;
                    node.style.width = originalWidth;
                    node.style.height = originalHeight;
                    node.style.position = originalPosition;
                    node.style.left = originalLeft;
                    node.style.top = originalTop;
                    node.style.zIndex = originalZIndex;
                    
                    if (i > 0) {
                        pdf.addPage();
                    }
                    pdf.addImage(imgData, 'JPEG', 0, 0, formatWidth, formatHeight);
                }
                
                setExportProgress({
                    current: pages.length,
                    total: pages.length,
                    statusText: 'Menyimpan file PDF...'
                });

                pdf.save(`Piagam_${settings.nama_kelas || 'Kelas'}_${settings.semester || 'Semester'}.pdf`);
                showToast('PDF berhasil diunduh.', 'success');
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('Gagal menghasilkan PDF. Silahkan coba lagi.', 'error');
        } finally {
            setIsPrinting(false);
            setExportProgress(null);
        }
    };

    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');
        
        const styleId = 'print-piagam-style';
        document.getElementById(styleId)?.remove();
        
        const paperSizeCss = {
            A4: 'size: A4 landscape;',
            F4: 'size: 33cm 21.5cm;',
            Letter: 'size: letter landscape;',
            Legal: 'size: legal landscape;',
        }[paperSize] || `size: ${paperSize} landscape;`;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @page {
                ${paperSizeCss}
                margin: 0 !important;
            }
            @media print {
                .report-page, .piagam-page {
                    transform: none !important;
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                    page-break-after: always;
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            setIsPrinting(false);
            setTimeout(() => document.getElementById(styleId)?.remove(), 1000);
        }, 500);
    };

    const studentsToRender = useMemo(() => {
        const rankedStudents = students.filter(s => studentRankings.has(s.id) && studentRankings.get(s.id).rank !== null)
                                     .sort((a, b) => studentRankings.get(a.id).rank - studentRankings.get(b.id).rank);
        
        if (selectedFilter === 'top3') {
            return rankedStudents.filter(s => {
                const rank = studentRankings.get(s.id).rank;
                return rank >= 1 && rank <= 3;
            });
        } else if (selectedFilter === 'top10') {
             return rankedStudents.filter(s => {
                const rank = studentRankings.get(s.id).rank;
                return rank >= 1 && rank <= 10;
            });
        }
        
        return rankedStudents; // 'all'
    }, [students, selectedFilter, studentRankings]);
    


    const pageStyle = {
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: `calc(${PAPER_SIZES[paperSize].height} * ${scale - 1})`,
    };

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
