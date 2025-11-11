import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { getGradeNumber } from './DataNilaiPage.js';

const PAPER_SIZES = {
    A4: { width: 210, height: 297 },
    F4: { width: 215, height: 330 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        if (isNaN(adjustedDate.getTime())) return String(dateString);
        return adjustedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
        return String(dateString);
    }
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
const lowercaseFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

const cleanTpText = (text, studentNameRaw) => {
    if (!text) return '';
    let cleanedText = text.trim();
    const regex = new RegExp(`^ananda(\\s+${studentNameRaw})?\\s`, 'i');
    cleanedText = cleanedText.replace(regex, '');
    return cleanedText.trim();
};

const generateDescription = (student, subject, gradeData, learningObjectives, settings) => {
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);
    const defaultReturn = { highest: `${studentName} telah mencapai tujuan pembelajaran.`, lowest: '' };
    
    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) return { highest: `${studentName} menunjukkan perkembangan yang baik.`, lowest: "" };

    const objectivesForCurrentClass = Object.values(learningObjectives).find(obj => getGradeNumber(Object.keys(obj)[0]) === currentGradeNumber) || learningObjectives[`Kelas ${currentGradeNumber}`];
    const objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
    if (objectivesForSubject.length === 0) return { highest: `${studentName} menunjukkan penguasaan pada tujuan pembelajaran yang belum diisi.`, lowest: "" };
    
    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    const gradedTps = objectivesForSubject
        .map((text, index) => ({ text: cleanTpText(text, studentNameRaw), score: detailedGrade?.tp?.[index] }))
        .filter(tp => typeof tp.score === 'number' && tp.score !== null);
    
    if (gradedTps.length === 0) return { highest: `${studentName} menunjukkan penguasaan yang belum terukur.`, lowest: "" };
    if (gradedTps.length === 1) return { highest: `${studentName} menunjukkan penguasaan yang baik dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' };

    const scores = gradedTps.map(tp => tp.score);
    if (scores.every(s => s === scores[0])) {
        return { 
            highest: `${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        };
    }
    
    let maxScore = Math.max(...scores);
    let minScore = Math.min(...scores);
    const highestTp = gradedTps.find(tp => tp.score === maxScore);
    const lowestTp = gradedTps.find(tp => tp.score === minScore);

    if (highestTp && lowestTp) {
        return { 
            highest: `${studentName} menunjukkan penguasaan yang sangat baik dalam ${lowercaseFirst(highestTp.text)}.`,
            lowest: `${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
        };
    }
    return defaultReturn;
};

const PrintRaporPage = ({ students, settings, showToast, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
    });
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const previewRefs = useRef({});

    const handlePageSelectionChange = useCallback((e) => {
        const { name, checked } = e.target;
        setSelectedPages(prev => name === 'all' ? { cover: checked, schoolIdentity: checked, studentIdentity: checked, academic: checked } : { ...prev, [name]: checked });
    }, []);

    const studentsToRender = useMemo(() => {
        if (selectedStudentId === 'all') return students;
        return students.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId]);

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        showToast('Memulai pembuatan PDF...', 'success');

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', paperSize.toLowerCase());

            // Add Tinos font if available (standard in jsPDF)
            try {
                doc.addFont('Tinos-Regular.ttf', 'Tinos', 'normal');
                doc.addFont('Tinos-Bold.ttf', 'Tinos', 'bold');
                doc.setFont('Tinos', 'normal');
            } catch (e) {
                console.warn("Tinos font not found, using default Times.");
                doc.setFont('Times', 'normal');
            }

            const MARGIN = 15; // 1.5 cm margin
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const contentW = pageW - MARGIN * 2;
            let pageCounter = 0;

            for (let i = 0; i < studentsToRender.length; i++) {
                const student = studentsToRender[i];
                if (i > 0) doc.addPage();
                
                // --- DRAW COVER PAGE ---
                if (selectedPages.cover) {
                    // ... (Implementation remains the same, draw directly)
                    pageCounter++;
                    doc.setDrawColor(0);
                    doc.setLineWidth(1.5);
                    doc.rect(MARGIN, MARGIN, contentW, pageH - MARGIN * 2, 'S'); // Outer border
                    doc.setLineWidth(0.5);
                    doc.rect(MARGIN + 2, MARGIN + 2, contentW - 4, pageH - MARGIN * 4, 'S'); // Inner border

                    if (settings.logo_cover) {
                        const img = new Image();
                        img.src = settings.logo_cover;
                        await new Promise(resolve => img.onload = resolve);
                        doc.addImage(img, 'PNG', pageW / 2 - 20, 50, 40, 40);
                    }

                    doc.setFontSize(16);
                    doc.setFont('Tinos', 'bold');
                    doc.text('RAPOR MURID SEKOLAH DASAR (SD)', pageW / 2, 110, { align: 'center' });
                    
                    doc.setFontSize(10);
                    doc.setFont('Tinos', 'normal');
                    doc.text('Nama Murid:', pageW / 2, 150, { align: 'center' });
                    doc.rect(MARGIN + 20, 153, contentW - 40, 12);
                    doc.setFontSize(14);
                    doc.setFont('Tinos', 'bold');
                    doc.text((student.namaLengkap || '').toUpperCase(), pageW / 2, 160, { align: 'center' });
                    
                    doc.setFontSize(10);
                    doc.setFont('Tinos', 'normal');
                    doc.text('NISN/NIS:', pageW / 2, 172, { align: 'center' });
                    doc.rect(MARGIN + 20, 175, contentW - 40, 12);
                    doc.setFontSize(14);
                    doc.setFont('Tinos', 'bold');
                    doc.text(`${student.nisn || '-'} / ${student.nis || '-'}`, pageW / 2, 182, { align: 'center' });
                    
                    doc.setFontSize(12);
                    doc.setFont('Tinos', 'bold');
                    doc.text('KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH', pageW / 2, 250, { align: 'center' });
                    doc.text('REPUBLIK INDONESIA', pageW / 2, 257, { align: 'center' });
                    doc.text(settings.tahun_ajaran || '', pageW / 2, 264, { align: 'center' });
                }

                const drawHeaderAndFooter = async (isFirstPage = false, currentPage) => {
                    if(isFirstPage) {
                        const headerRef = previewRefs.current[`header_${student.id}`];
                        if (headerRef) {
                            const canvas = await html2canvas(headerRef, { scale: 2, backgroundColor: null });
                            const imgData = canvas.toDataURL('image/png');
                            doc.addImage(imgData, 'PNG', 0, 10, pageW, 42);
                        }
                    }
                    doc.setFontSize(8);
                    doc.setDrawColor(150);
                    doc.line(MARGIN, pageH - MARGIN - 5, pageW - MARGIN, pageH - MARGIN - 5);
                    doc.text(`${settings.nama_kelas} | ${student.namaLengkap} | ${student.nisn}`, MARGIN, pageH - MARGIN);
                    doc.text(`Halaman ${currentPage}`, pageW - MARGIN, pageH - MARGIN, { align: 'right' });
                };

                // --- DRAW IDENTITY PAGES ---
                if (selectedPages.schoolIdentity) {
                    if (!selectedPages.cover) pageCounter = 0; // reset if cover is skipped
                    doc.addPage();
                    pageCounter++;
                    await drawHeaderAndFooter(true, pageCounter);
                    // ... (Draw identity tables using autoTable)
                }

                // --- DRAW ACADEMIC PAGES ---
                if (selectedPages.academic) {
                    if (!selectedPages.cover && !selectedPages.schoolIdentity) pageCounter = 0; // reset
                    doc.addPage();
                    pageCounter++;
                    await drawHeaderAndFooter(true, pageCounter);

                    doc.setFont('Tinos', 'bold');
                    doc.setFontSize(12);
                    doc.text('LAPORAN HASIL BELAJAR', pageW / 2, 60, { align: 'center' });
                    // Student Info Table
                    doc.autoTable({
                        startY: 65,
                        body: [
                            ['Nama Murid', `: ${(student.namaLengkap || '').toUpperCase()}`, 'Kelas', `: ${settings.nama_kelas || ''}`],
                            ['NISN/NIS', `: ${student.nisn || '-'} / ${student.nis || '-'}`, 'Fase', `: C`],
                            ['Nama Sekolah', `: ${settings.nama_sekolah || ''}`, 'Semester', `: ${settings.semester ? (settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)') : '-'}`],
                            ['Alamat Sekolah', `: ${settings.alamat_sekolah || ''}`, 'Tahun Pelajaran', `: ${settings.tahun_ajaran || ''}`],
                        ],
                        theme: 'plain',
                        styles: { font: 'Tinos', fontSize: 10 },
                        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 }, 3: { cellWidth: 'auto' } },
                    });

                    // Main Academic Table
                    const lastAutoTable = doc.lastAutoTable.finalY;
                    const { grades, subjects, learningObjectives } = restProps;
                    const gradeData = grades.find(g => g.studentId === student.id);
                    const reportSubjects = generateReportSubjects(student, subjects, gradeData, learningObjectives, settings);
                    
                    doc.autoTable({
                        startY: lastAutoTable + 2,
                        head: [['No.', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi']],
                        body: reportSubjects.map((item, index) => [
                            index + 1,
                            item.name,
                            item.grade ?? '',
                            `${item.description.highest}\n${item.description.lowest}`
                        ]),
                        theme: 'grid',
                        headStyles: { font: 'Tinos', fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', lineWidth: 0.1, lineColor: 0 },
                        styles: { font: 'Tinos', fontSize: 9, lineWidth: 0.1, lineColor: 0 },
                        columnStyles: {
                            0: { cellWidth: 10, halign: 'center' },
                            1: { cellWidth: 40 },
                            2: { cellWidth: 15, halign: 'center' },
                            3: { cellWidth: 'auto' },
                        },
                        didDrawPage: (data) => {
                            if (data.pageNumber > 1) { // Redraw header on subsequent pages of the table
                                drawHeaderAndFooter(false, pageCounter + data.pageNumber - 1);
                            }
                        },
                    });
                }
            }

            doc.output('bloburl', { filename: `Rapor_${settings.nama_kelas}.pdf` });
            window.open(doc.output('bloburl'), '_blank');
            
            showToast('PDF rapor berhasil dibuat!', 'success');
        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            showToast(`Gagal membuat PDF: ${error.message}`, 'error');
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    // This is a minimal preview, the real generation is programmatic
    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk membuat file PDF.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'studentSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Pilih Murid'),
                            React.createElement('select', { 
                                id: "studentSelector",
                                value: selectedStudentId,
                                onChange: (e) => setSelectedStudentId(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Murid"),
                                students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                            React.createElement('select', {
                                id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width}mm x ${PAPER_SIZES[key].height}mm)`)))
                        ),
                        React.createElement('button', { 
                            onClick: handleGeneratePdf,
                            disabled: isGeneratingPdf,
                            className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        }, isGeneratingPdf ? 'Membangun PDF...' : 'Generate PDF Rapor')
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Pilih Halaman untuk Dicetak:"),
                    React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                        React.createElement('label', { className: "flex items-center space-x-2" }, React.createElement('input', { type: "checkbox", name: "all", checked: Object.values(selectedPages).every(Boolean), onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }), React.createElement('span', { className: "text-sm font-bold" }, "Pilih Semua")),
                        ...['cover', 'schoolIdentity', 'studentIdentity', 'academic'].map(pageKey => (
                            React.createElement('label', { key: pageKey, className: "flex items-center space-x-2" },
                                React.createElement('input', { type: "checkbox", name: pageKey, checked: selectedPages[pageKey] || false, onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                                React.createElement('span', { className: "text-sm" }, pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/([A-Z])/g, ' $1').trim())
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { id: "preview-area", className: "opacity-50 pointer-events-none select-none", 'aria-hidden': true },
                React.createElement('h3', {className: 'text-center font-bold text-slate-600 mb-2 print-hidden'}, 'Pratinjau (kualitas rendah, hanya untuk referensi tata letak)'),
                studentsToRender.slice(0, 1).map(student => ( // Only render first student for preview
                    React.createElement('div', { key: student.id, ref: el => previewRefs.current[`header_${student.id}`] = el, className: 'w-full' },
                       // This will just be a placeholder for the header to be captured by html2canvas
                    )
                ))
            )
        )
    );
};


// Helper function to be used inside the component
const generateReportSubjects = (student, subjects, gradeData, learningObjectives, settings) => {
    const result = [];
    const allActiveSubjects = subjects.filter(s => s.active);
    
    const groupConfigs = {
        'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
            const studentReligion = student.agama?.trim().toLowerCase();
            const representative = groupSubjects.find(s => s.fullName.toLowerCase().includes(`(${studentReligion})`));
            return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
        },
        'Seni Budaya': (groupSubjects) => {
            const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects.find(s => s.fullName.includes("Seni Rupa")) || groupSubjects[0];
            return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
        },
        'Muatan Lokal': (groupSubjects) => {
            const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
            if (!chosen) return null;
            const match = chosen.fullName.match(/\(([^)]+)\)/);
            return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
        }
    };

    const processedGroups = new Set();
    Object.keys(groupConfigs).forEach(groupName => {
        const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
        if (groupSubjects.length > 0) {
            const config = groupConfigs[groupName](groupSubjects);
            if (config?.subject) {
                 result.push({ 
                     id: config.subject.id, 
                     name: config.name, 
                     grade: gradeData?.finalGrades?.[config.subject.id], 
                     description: generateDescription(student, config.subject, gradeData, learningObjectives, settings) 
                 });
            }
            processedGroups.add(groupName);
        }
    });
    
    allActiveSubjects.forEach(subject => {
        if (!Object.keys(groupConfigs).some(gn => subject.fullName.startsWith(gn))) {
            result.push({ 
                id: subject.id, 
                name: subject.fullName, 
                grade: gradeData?.finalGrades?.[subject.id], 
                description: generateDescription(student, subject, gradeData, learningObjectives, settings) 
            });
        }
    });
    
    const sortOrder = ['Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'Ilmu Pengetahuan Alam dan Sosial', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Bahasa Inggris', 'Muatan Lokal'];
    result.sort((a, b) => {
        const getSortKey = item => {
            const originalSubject = subjects.find(s => s.id === item.id);
            if(originalSubject.fullName.startsWith('Pendidikan Agama')) return 'Pendidikan Agama dan Budi Pekerti';
            if(originalSubject.fullName.startsWith('Seni Budaya')) return 'Seni Budaya';
            if(originalSubject.fullName.startsWith('Muatan Lokal')) return 'Muatan Lokal';
            return item.name;
        };
        const aIndex = sortOrder.indexOf(getSortKey(a));
        const bIndex = sortOrder.indexOf(getSortKey(b));
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
    return result;
};

export default PrintRaporPage;
