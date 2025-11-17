import React, { useMemo, useState, useEffect, useRef } from 'react';
import { generateInitialLayout } from './TransliterationUtil.js';

const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

const PAGE_TOP_MARGIN_CM = 1.5;
const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5;
const PAGE_BOTTOM_MARGIN_CM = 1.5;
const HEADER_HEIGHT_CM = 6.0;

const ReportHeader = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', {
            className: "absolute",
            style: {
                top: `${PAGE_TOP_MARGIN_CM}cm`,
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
            }
        },
            React.createElement('div', {
                className: "relative w-full",
                style: { aspectRatio: '800 / 200' }
            },
                React.createElement('svg', {
                    className: "absolute top-0 left-0 w-full h-full",
                    viewBox: "0 0 800 200",
                    preserveAspectRatio: "none"
                },
                    layout.map(el => {
                        if (el.type === 'text') {
                            let textAnchor = "start";
                            let xPos = el.x;
                            if (el.textAlign === 'center') {
                                textAnchor = "middle";
                                xPos = el.x + (el.width ?? 0) / 2;
                            } else if (el.textAlign === 'right') {
                                textAnchor = "end";
                                xPos = el.x + (el.width ?? 0);
                            }
                            return (
                                React.createElement('text', {
                                    key: el.id,
                                    x: xPos,
                                    y: el.y + (el.fontSize ?? 14),
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    textAnchor: textAnchor,
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'
                                }, el.content)
                            );
                        }
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || ''); // Fallback to empty string if no image
                            if (!imageUrl) return null; // Don't render image if URL is empty
                            return (
                                React.createElement('image', {
                                    key: el.id,
                                    href: imageUrl,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height
                                })
                            );
                        }
                        if (el.type === 'line') {
                            return (
                                React.createElement('rect', {
                                    key: el.id,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height,
                                    fill: "black"
                                })
                            );
                        }
                        return null;
                    })
                )
            )
        )
    );
};

const LegerHeader = React.forwardRef(({ settings }, ref) => (
    React.createElement('div', { ref: ref, className: "font-times text-center" },
        React.createElement('h2', { className: "font-bold text-sm mb-1 uppercase" }, 
            `LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[Tahun Ajaran]'} SEMESTER ${settings.semester || '[Semester]'}`
        ),
        React.createElement('h2', { className: "font-bold text-sm mb-1 uppercase" }, (settings.nama_sekolah || '[Nama Sekolah]')),
        React.createElement('h2', { className: "font-bold text-sm mb-1 uppercase" }, `KELAS: ${(settings.nama_kelas || '[Nama Kelas]')}`)
    )
));

const LegerFooter = React.forwardRef(({ settings }, ref) => {
    const getTanggalRapor = () => {
        if (!settings.tanggal_rapor) {
            return `${settings.kota_kabupaten || '[Tempat]'}, _________________`;
        }
        const parts = settings.tanggal_rapor.split(',');
        return parts.length > 1 
            ? `${parts[0]}, ${parts.slice(1).join(',').trim()}` 
            : `${settings.kota_kabupaten || '[Tempat]'}, ${settings.tanggal_rapor}`;
    };
    
    return (
        React.createElement('div', { ref: ref, className: "font-times mt-2 text-sm" },
            React.createElement('div', { className: "pt-2 flex justify-between" },
                React.createElement('div', { className: "text-center w-2/5" },
                    React.createElement('p', null, "Mengetahui,"),
                    React.createElement('p', null, "Kepala Sekolah,"),
                    React.createElement('div', { style: { height: '2.5rem' } }),
                    React.createElement('p', { className: "font-bold underline" }, settings.nama_kepala_sekolah || '____________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                ),
                React.createElement('div', { className: "text-center w-2/5" },
                    React.createElement('p', null, getTanggalRapor()),
                    React.createElement('p', null, "Wali Kelas,"),
                    React.createElement('div', { style: { height: '2.5rem' } }),
                    React.createElement('p', { className: "font-bold underline" }, settings.nama_wali_kelas || '____________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            )
        )
    );
});

const PrintLegerPage = ({ students, settings, grades, subjects, showToast }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [isPrinting, setIsPrinting] = useState(false);
    const [legerPageChunks, setLegerPageChunks] = useState(null);
    const [cmToPx, setCmToPx] = useState(0);

    const cmRef = useRef(null);
    const legerHeaderRef = useRef(null);
    const tableHeaderRef = useRef(null);
    const tableBodyRef = useRef(null);
    const legerFooterRef = useRef(null);

    useEffect(() => {
        if (cmRef.current) {
            setCmToPx(cmRef.current.offsetHeight);
        }
    }, []);

    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');

        const paperSizeCss = {
            A4: 'size: A4 portrait;',
            F4: 'size: 21.5cm 33cm portrait;',
            Letter: 'size: letter portrait;',
            Legal: 'size: legal portrait;',
        }[paperSize];

        const style = document.createElement('style');
        style.id = 'print-leger-style';
        style.innerHTML = `@page { ${paperSizeCss} margin: 0; }`;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            document.getElementById('print-leger-style')?.remove();
            setIsPrinting(false);
        }, 500);
    };

    const activeSubjects = useMemo(() => (subjects || []).filter(s => s.active), [subjects]);
    
    const displaySubjects = useMemo(() => {
        const finalSubjects = [];
        const addedGroups = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti' } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SB', fullName: 'Seni Budaya' } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'MULOK', fullName: 'Muatan Lokal' } }
        ];
        const order = ['PABP', 'PP', 'BIndo', 'MTK', 'IPAS', 'SB', 'PJOK', 'BIng', 'Mulok'];

        for (const subject of activeSubjects) {
            const group = groups.find(g => subject.fullName.startsWith(g.prefix));
            if (group) {
                if (!addedGroups.has(group.prefix)) {
                    finalSubjects.push(group.base);
                    addedGroups.add(group.prefix);
                }
            } else {
                finalSubjects.push(subject);
            }
        }
        
        const labelMap = { 'BIndo': 'B. INDO', 'BIng': 'B. ING' };
        
        return finalSubjects
            .filter(s => order.includes(s.id))
            .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
            .map(s => ({...s, label: labelMap[s.id] || s.label.toUpperCase() }));
    }, [activeSubjects]);

    const processedData = useMemo(() => {
        if (!students || !grades) return [];
        return students.map((student, index) => {
            const finalGrades = grades.find((g) => g.studentId === student.id)?.finalGrades || {};
            let total = 0, count = 0;
            const studentGrades = {};

            displaySubjects.forEach(ds => {
                let grade;
                if (ds.id === 'PABP') {
                    const religion = student.agama?.trim().toLowerCase();
                    if (religion) {
                        const relSubject = activeSubjects.find(s => s.fullName.startsWith(ds.fullName) && s.fullName.toLowerCase().includes(`(${religion})`));
                        if (relSubject) grade = finalGrades[relSubject.id];
                    }
                } else if (['SB', 'Mulok'].includes(ds.id)) {
                    const memberSubjects = activeSubjects.filter(s => s.fullName.startsWith(ds.fullName));
                    grade = memberSubjects.map(ms => finalGrades[ms.id]).find(g => g != null);
                } else {
                    grade = finalGrades[ds.id];
                }

                if (typeof grade === 'number') { total += grade; count++; }
                studentGrades[ds.id] = grade;
            });
            return { no: index + 1, namaLengkap: student.namaLengkap, nisn: student.nisn, nis: student.nis, grades: studentGrades, total, average: count > 0 ? (total / count).toFixed(2) : "0.00" };
        });
    }, [students, grades, activeSubjects, displaySubjects]);

    useEffect(() => {
        if (!processedData.length || cmToPx === 0) {
            setLegerPageChunks(processedData.length > 0 ? [] : [[]]);
            return;
        }

        setLegerPageChunks(null); // Trigger measurement render

        const timer = setTimeout(() => {
            const refs = [legerHeaderRef, tableHeaderRef, tableBodyRef, legerFooterRef];
            if (refs.some(ref => !ref.current)) return;

            const pageHeightPx = parseFloat(PAPER_SIZES[paperSize].height) * cmToPx;
            const contentBlockHeight = pageHeightPx - (HEADER_HEIGHT_CM * cmToPx) - (PAGE_BOTTOM_MARGIN_CM * cmToPx);
            
            const legerH = legerHeaderRef.current.offsetHeight;
            const tableH = tableHeaderRef.current.offsetHeight;
            const footerH = legerFooterRef.current.offsetHeight;
            const rowHeights = Array.from(tableBodyRef.current.children).map(row => row.offsetHeight);
            
            const firstPageAvailableHeight = contentBlockHeight - legerH;
            const subsequentPageAvailableHeight = contentBlockHeight;
            
            const chunks = [];
            let currentRowIndex = 0;
            let isFirstPage = true;

            while (currentRowIndex < processedData.length) {
                const chunk = [];
                let availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight;
                let heightUsed = tableH;

                const remainingRowsHeight = rowHeights.slice(currentRowIndex).reduce((sum, h) => sum + h, 0);
                if (heightUsed + remainingRowsHeight + footerH <= availableHeight) {
                    availableHeight -= footerH;
                }

                for (let i = currentRowIndex; i < rowHeights.length; i++) {
                    if (heightUsed + rowHeights[i] <= availableHeight) {
                        chunk.push(i);
                        heightUsed += rowHeights[i];
                    } else break;
                }
                
                if (chunk.length === 0 && rowHeights.length > 0) chunk.push(currentRowIndex);
                
                chunks.push(chunk);
                currentRowIndex += chunk.length;
                isFirstPage = false;
            }
            setLegerPageChunks(chunks);
        }, 100);

        return () => clearTimeout(timer);
    }, [processedData, paperSize, cmToPx]);

    const pageStyle = { width: PAPER_SIZES[paperSize].width, height: PAPER_SIZES[paperSize].height };
    
    const renderTable = (rows, header) => (
        React.createElement('table', { className: "w-full border-collapse border border-black font-times", style: { fontSize: '8pt' } },
            React.createElement('colgroup', null,
                React.createElement('col', { style: { width: '3%' } }),
                React.createElement('col', { style: { width: '25%' } }),
                React.createElement('col', { style: { width: '8%' } }),
                React.createElement('col', { style: { width: '6%' } }),
                ...displaySubjects.map(() => React.createElement('col', { style: { width: `${(100 - 3 - 25 - 8 - 6 - 5 - 6) / displaySubjects.length}%` } })),
                React.createElement('col', { style: { width: '5%' } }),
                React.createElement('col', { style: { width: '6%' } })
            ),
            header,
            React.createElement('tbody', null,
                rows.map(student => (
                    React.createElement('tr', { key: student.no },
                        React.createElement('td', { className: "border border-black px-1 py-0 text-center" }, student.no),
                        React.createElement('td', { className: "border border-black px-2 py-0" }, student.namaLengkap),
                        React.createElement('td', { className: "border border-black px-1 py-0 text-center" }, student.nisn),
                        React.createElement('td', { className: "border border-black px-1 py-0 text-center" }, student.nis),
                        ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: "border border-black px-1 py-0 text-center" }, student.grades[subject.id] ?? '')),
                        React.createElement('td', { className: "border border-black px-1 py-0 text-center font-bold" }, student.total),
                        React.createElement('td', { className: "border border-black px-1 py-0 text-center font-bold" }, student.average)
                    )
                ))
            )
        )
    );
    
    const tableHeader = React.createElement('thead', null,
        React.createElement('tr', { className: "text-center font-bold" },
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "NO"),
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "NAMA MURID"),
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "NISN"),
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "NIS"),
            React.createElement('td', { colSpan: displaySubjects.length, className: "border border-black px-1 py-0 align-middle" }, "NILAI MATA PELAJARAN"),
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "JUMLAH"),
            React.createElement('td', { rowSpan: 2, className: "border border-black px-1 py-0 align-middle" }, "RATA-RATA")
        ),
        React.createElement('tr', { className: "text-center font-bold" },
            displaySubjects.map(subject => 
                React.createElement('td', { key: subject.id, className: "border border-black" },
                    React.createElement('div', { className: "h-full flex items-center justify-center" },
                        React.createElement('div', {
                            style: { writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }
                        }, subject.label)
                    )
                )
            )
        )
    );

    if (legerPageChunks === null) {
        return React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
            React.createElement('div', { className: "text-center p-8" },
                React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" }),
                React.createElement('p', { className: "mt-4 text-slate-600" }, "Menyiapkan tata letak leger...")
            ),
            React.createElement('div', { style: { visibility: 'hidden', position: 'absolute', zIndex: -1, width: pageStyle.width, padding: `0 ${PAGE_LEFT_RIGHT_MARGIN_CM}cm` } },
                React.createElement(LegerHeader, { settings: settings, ref: legerHeaderRef }),
                React.createElement('table', { className: 'w-full' }, React.createElement('thead', { ref: tableHeaderRef }, React.createElement('tr', null, React.createElement('td', null, 'Header'))), React.createElement('tbody', { ref: tableBodyRef }, processedData.map(s => React.createElement('tr', { key: s.no }, React.createElement('td', null, s.namaLengkap))))),
                React.createElement(LegerFooter, { settings: settings, ref: legerFooterRef })
            )
        );
    }

    return React.createElement(React.Fragment, null,
        React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
        React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 print-hidden" },
            React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Leger"),
                    React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pratinjau leger nilai akhir siswa.")
                ),
                React.createElement('div', { className: "flex items-end gap-4 mt-4 md:mt-0" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                        React.createElement('select', { id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm" },
                            Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`))
                        )
                    ),
                    React.createElement('button', { onClick: handlePrint, disabled: isPrinting, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" }, isPrinting ? 'Mempersiapkan...' : 'Cetak Leger (Print)')
                )
            )
        ),
        React.createElement('div', { id: "print-area" },
            legerPageChunks.map((chunk, pageIndex) => {
                const isLastPage = pageIndex === legerPageChunks.length - 1;
                const rowsForPage = chunk.map(rowIndex => processedData[rowIndex]);
                return React.createElement('div', { key: `page-${pageIndex}`, className: "leger-page bg-white mx-auto shadow-lg my-8 border relative", style: { ...pageStyle } },
                    React.createElement(ReportHeader, { settings: settings }),
                    React.createElement('div', { className: 'absolute flex flex-col', style: {
                        top: `${HEADER_HEIGHT_CM}cm`,
                        left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                        right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                        bottom: `${PAGE_BOTTOM_MARGIN_CM}cm`
                    }},
                        pageIndex === 0 && React.createElement(LegerHeader, { settings: settings }),
                        React.createElement('div', null,
                           renderTable(rowsForPage, tableHeader)
                        ),
                        isLastPage && React.createElement(LegerFooter, { settings: settings })
                    )
                )
            })
        )
    );
};

export default PrintLegerPage;
