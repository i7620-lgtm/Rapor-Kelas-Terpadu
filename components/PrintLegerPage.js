import React, { useMemo, useState, useRef } from 'react';

const PAPER_SIZES = {
    A4: { width: '29.7cm', height: '21cm' },
    F4: { width: '33cm', height: '21.5cm' },
    Letter: { width: '27.94cm', height: '21.59cm' },
    Legal: { width: '35.56cm', height: '21.59cm' },
};

const jsPDFPaperSizes = {
    A4: { width: 297, height: 210 }, // landscape mm
    F4: { width: 330, height: 215 }, // landscape mm
    Letter: { width: 279.4, height: 215.9 }, // landscape mm
    Legal: { width: 355.6, height: 215.9 }, // landscape mm
};


const PrintLegerPage = ({ students, settings, grades, subjects, showToast }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef(null);

    const activeSubjects = useMemo(() => subjects.filter(s => s.active), [subjects]);

    const displaySubjects = useMemo(() => {
        const finalDisplaySubjects = [];
        const addedGroupPrefixes = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti' } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SB', fullName: 'Seni Budaya' } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'MULOK', fullName: 'Muatan Lokal' } }
        ];

        const legerOrderAndInclusion = ['PABP', 'PP', 'BIndo', 'MTK', 'IPAS', 'SB', 'PJOK', 'BIng', 'Mulok'];

        for (const group of groups) {
            const hasActiveMember = activeSubjects.some(s => s.fullName.startsWith(group.prefix));
            if (hasActiveMember && !addedGroupPrefixes.has(group.prefix)) {
                finalDisplaySubjects.push(group.base);
                addedGroupPrefixes.add(group.prefix);
            }
        }

        for (const subject of activeSubjects) {
            const isGrouped = groups.some(g => subject.fullName.startsWith(g.prefix));
            if (!isGrouped) {
                finalDisplaySubjects.push(subject);
            }
        }

        const sortedAndFiltered = finalDisplaySubjects
            .filter(s => legerOrderAndInclusion.includes(s.id))
            .sort((a, b) => {
                const indexA = legerOrderAndInclusion.indexOf(a.id);
                const indexB = legerOrderAndInclusion.indexOf(b.id);
                return indexA - indexB;
            });
            
        const labelMap = { 'BIndo': 'B. INDO', 'BIng': 'B. ING' };
        
        return sortedAndFiltered.map(s => ({...s, label: labelMap[s.id] || s.label.toUpperCase() }));

    }, [activeSubjects]);

    const processedData = useMemo(() => {
        return students.map((student, index) => {
            const studentGrades = grades.find((g) => g.studentId === student.id)?.finalGrades || {};
            let total = 0;
            let subjectCount = 0;
            const displayGrades = {};

            displaySubjects.forEach(displaySubject => {
                let grade;
                if (displaySubject.id === 'PABP') {
                    const studentReligion = student.agama?.trim().toLowerCase();
                    if (studentReligion) {
                        const religionSubject = activeSubjects.find(s => 
                            s.fullName.startsWith('Pendidikan Agama dan Budi Pekerti') && 
                            s.fullName.toLowerCase().includes(`(${studentReligion})`)
                        );
                        if (religionSubject) grade = studentGrades[religionSubject.id];
                    }
                } else if (['SB', 'Mulok'].includes(displaySubject.id)) {
                    const memberSubjects = activeSubjects.filter(s => s.fullName.startsWith(displaySubject.fullName));
                    for (const member of memberSubjects) {
                        const memberGrade = studentGrades[member.id];
                        if (memberGrade !== undefined && memberGrade !== null) {
                            grade = memberGrade;
                            break;
                        }
                    }
                } else {
                     grade = studentGrades[displaySubject.id];
                }

                if (typeof grade === 'number') {
                    total += grade;
                    subjectCount++;
                }
                displayGrades[displaySubject.id] = grade;
            });

            return {
                no: index + 1,
                namaLengkap: student.namaLengkap,
                nisn: student.nisn,
                nis: student.nis,
                grades: displayGrades,
                total,
                average: subjectCount > 0 ? (total / subjectCount).toFixed(2) : "0.00",
            };
        });
    }, [students, grades, activeSubjects, displaySubjects]);
    
    const { tableFontSize, headerFontSize, signatureFontSize } = useMemo(() => {
        const subjectCount = displaySubjects.length;
        let baseSize = 9;
        const threshold = 8;
        const reductionFactor = 0.4;
        const minSize = 7.0;

        let newSize = baseSize;
        if (subjectCount > threshold) {
            newSize -= (subjectCount - threshold) * reductionFactor;
        }

        const finalTableSize = Math.max(newSize, minSize);

        return {
            tableFontSize: `${finalTableSize}pt`,
            headerFontSize: `${finalTableSize + 0.5}pt`,
            signatureFontSize: `${Math.max(finalTableSize - 1, 6.5)}pt`,
        };
    }, [displaySubjects]);

    const handleGeneratePdf = async () => {
        if (!printRef.current) {
            showToast('Elemen pratinjau tidak ditemukan.', 'error');
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const { jsPDF } = window.jspdf;
            const element = printRef.current;

            const canvas = await html2canvas(element, { 
                scale: 2.5,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdfSize = jsPDFPaperSizes[paperSize];
            const doc = new jsPDF('l', 'mm', [pdfSize.width, pdfSize.height]);

            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            
            const imgProps = doc.getImageProperties(imgData);
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;
            
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;
            
            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;
            
            doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
            
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            URL.revokeObjectURL(pdfUrl);

            showToast('PDF Leger berhasil dibuat!', 'success');

        } catch (error) {
            console.error("Gagal membuat PDF Leger:", error);
            showToast(`Gagal membuat PDF: ${error.message}`, 'error');
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const getTanggalRapor = () => {
        if (!settings.tanggal_rapor) {
            return `${settings.kota_kabupaten || '[Tempat]'}, _________________`;
        }
        const parts = settings.tanggal_rapor.split(',');
        if (parts.length > 1) {
            return `${parts[0]}, ${parts.slice(1).join(',').trim()}`;
        }
        return `${settings.kota_kabupaten || '[Tempat]'}, ${settings.tanggal_rapor}`;
    };

    const subjectColWidth = `${(100 - 4 - 22 - 8 - 6 - 7 - 8) / (displaySubjects.length || 1)}%`;

    const pageStyle = {
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
    };

    return React.createElement('div', { className: "space-y-6" },
        React.createElement('div', { className: "flex justify-between items-center print-hidden" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Print Leger"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Pratinjau leger nilai akhir siswa. Gunakan tombol 'Generate PDF' untuk membuat file PDF.")
            ),
            React.createElement('div', { className: "flex items-end gap-4" },
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                    React.createElement('select', {
                        id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                        className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                ),
                React.createElement('button', { 
                    onClick: handleGeneratePdf, 
                    disabled: isGeneratingPdf,
                    className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                }, isGeneratingPdf ? 'Membuat PDF...' : 'Generate PDF')
            )
        ),
        React.createElement('div', { id: "print-area" },
            React.createElement('div', {
                ref: printRef,
                className: "bg-white p-8 mx-auto shadow-lg flex flex-col",
                style: pageStyle
            },
                React.createElement('div', { className: "font-sans flex-shrink-0" },
                    React.createElement('h2', { className: "text-center font-bold text-lg mb-1 uppercase" }, `LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[tahun ajaran]'} SEMESTER ${settings.semester || '[semester]'}`),
                    React.createElement('div', { className: "flex justify-between text-sm mb-4" },
                        React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "SEKOLAH: "), (settings.nama_sekolah || '[nama sekolah]').toUpperCase()),
                        React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "KELAS: "), (settings.nama_kelas || '[nama kelas]').toUpperCase())
                    )
                ),
                React.createElement('div', { className: "overflow-x-auto flex-grow" },
                    React.createElement('table', { 
                        className: "w-full border-collapse border border-black",
                        style: { fontSize: tableFontSize, tableLayout: 'fixed' }
                    },
                        React.createElement('colgroup', null,
                            React.createElement('col', { style: { width: '4%' } }), // NO
                            React.createElement('col', { style: { width: '22%' } }), // NAMA
                            React.createElement('col', { style: { width: '8%' } }), // NISN
                            React.createElement('col', { style: { width: '6%' } }), // NIS
                            ...displaySubjects.map(subject => React.createElement('col', { key: subject.id, style: { width: subjectColWidth } })),
                            React.createElement('col', { style: { width: '7%' } }), // JUMLAH
                            React.createElement('col', { style: { width: '8%' } }), // RATA-RATA
                        ),
                        React.createElement('thead', null,
                            React.createElement('tr', { className: "text-center font-bold bg-slate-100", style: { fontSize: headerFontSize } },
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "NO"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "NAMA MURID"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "NISN"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "NIS"),
                                React.createElement('td', { colSpan: displaySubjects.length, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "NILAI MATA PELAJARAN"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "JUMLAH"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, "RATA-RATA")
                            ),
                            React.createElement('tr', { className: "text-center font-bold bg-slate-100" },
                                ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: "border border-black px-2 py-[2px] align-middle whitespace-nowrap" }, subject.label))
                            )
                        ),
                        React.createElement('tbody', null,
                            ...processedData.map(student => (
                                React.createElement('tr', { key: student.no },
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.no),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px]" }, student.namaLengkap),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.nisn),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.nis),
                                    ...displaySubjects.map(subject => (
                                        React.createElement('td', { key: subject.id, className: "border border-black px-2 py-[2px] text-center" }, student.grades[subject.id] ?? '')
                                    )),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center font-bold" }, student.total),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center font-bold" }, student.average)
                                )
                            ))
                        )
                    )
                ),
                React.createElement('div', { className: "font-sans mt-auto flex-shrink-0" },
                    React.createElement('div', { 
                        className: "pt-8 flex justify-between",
                        style: { fontSize: signatureFontSize }
                    },
                        React.createElement('div', { className: "text-center w-2/5" },
                            React.createElement('p', null, "Mengetahui,"),
                            React.createElement('p', null, "Kepala Sekolah,"),
                            React.createElement('div', { style: { height: '5rem' } }),
                            React.createElement('p', { className: "font-bold underline" }, settings.nama_kepala_sekolah || '____________________'),
                            React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                        ),
                        React.createElement('div', { className: "text-center w-2/5" },
                            React.createElement('p', null, getTanggalRapor()),
                            React.createElement('p', null, "Wali Kelas,"),
                            React.createElement('div', { style: { height: '5rem' } }),
                            React.createElement('p', { className: "font-bold underline" }, settings.nama_wali_kelas || '____________________'),
                            React.createElement('p', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                        )
                    )
                )
            )
        )
    );
};

export default PrintLegerPage;
