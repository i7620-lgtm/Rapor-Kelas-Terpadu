import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
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

const LegerHeader = React.forwardRef(({ settings, isCompact }, ref) => (
    React.createElement('div', { ref: ref, className: `font-times text-center ${isCompact ? 'mb-1' : 'mb-2'}` },
        React.createElement('h2', { className: `font-bold uppercase ${isCompact ? 'text-xs mb-0.5' : 'text-sm mb-1'}` },
            `LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[Tahun Ajaran]'} SEMESTER ${settings.semester || '[Semester]'}`
        ),
        React.createElement('h2', { className: `font-bold uppercase ${isCompact ? 'text-xs mb-0.5' : 'text-sm mb-1'}` },
            (settings.nama_sekolah || '[Nama Sekolah]')
        ),
        React.createElement('h2', { className: `font-bold uppercase ${isCompact ? 'text-xs' : 'text-sm'}` },
            `KELAS: ${(settings.nama_kelas || '[Nama Kelas]')}`
        )
    )
));

const LegerFooter = React.forwardRef(({ settings, isCompact }, ref) => {
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
        React.createElement('div', { ref: ref, className: `font-times w-full ${isCompact ? 'mt-0.5 text-xs' : 'mt-2 text-sm'}` },
            React.createElement('div', { className: "pt-2 flex justify-between" },
                React.createElement('div', { className: "text-center w-2/5" },
                    React.createElement('p', null, "Mengetahui,"),
                    React.createElement('p', null, "Kepala Sekolah,"),
                    React.createElement('div', { style: { height: isCompact ? '1.8rem' : '2.5rem' } }),
                    React.createElement('p', { className: "font-bold underline" }, settings.nama_kepala_sekolah || '____________________'),
                    React.createElement('p', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                ),
                React.createElement('div', { className: "text-center w-2/5" },
                    React.createElement('p', null, getTanggalRapor()),
                    React.createElement('p', null, "Wali Kelas,"),
                    React.createElement('div', { style: { height: isCompact ? '1.8rem' : '2.5rem' } }),
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
    const [isCompact, setIsCompact] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const [nameFontSize, setNameFontSize] = useState(null);
    const nameCellRefs = useRef([]);

    const pageRef = useRef(null);
    const contentRef = useRef(null);
    const cmRef = useRef(null);
    const [cmToPx, setCmToPx] = useState(0);

    useEffect(() => {
        if (cmRef.current) {
            setCmToPx(cmRef.current.offsetHeight);
        }
    }, []);

    const activeSubjects = useMemo(() => (subjects || []).filter(s => s.active), [subjects]);
    
    const displaySubjects = useMemo(() => {
        const finalSubjects = [];
        const addedGroups = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti' } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SB', fullName: 'Seni Budaya' } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'B. BALI', fullName: 'Muatan Lokal' } }
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
        const dataWithScores = students.map((student, index) => {
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
            return { id: student.id, no: index + 1, namaLengkap: student.namaLengkap, nisn: student.nisn, nis: student.nis, grades: studentGrades, total, average: count > 0 ? (total / count).toFixed(2) : "0.00" };
        });

        // Calculate Rank based on Total
        const sortedData = [...dataWithScores].sort((a, b) => b.total - a.total);
        const rankMap = new Map();
        if (sortedData.length > 0) {
            let currentRank = 1;
            rankMap.set(sortedData[0].id, currentRank);
            for (let i = 1; i < sortedData.length; i++) {
                if (sortedData[i].total < sortedData[i - 1].total) {
                    currentRank = i + 1;
                }
                rankMap.set(sortedData[i].id, currentRank);
            }
        }

        return dataWithScores.map(d => ({
            ...d,
            rank: rankMap.get(d.id)
        }));
    }, [students, grades, activeSubjects, displaySubjects]);

    const statistics = useMemo(() => {
        if (!processedData.length) return null;

        const subjectStats = {};
        displaySubjects.forEach(s => {
            const values = processedData.map(d => d.grades[s.id]).filter(v => typeof v === 'number');
            subjectStats[s.id] = {
                max: values.length ? Math.max(...values) : 0,
                min: values.length ? Math.min(...values) : 0,
                sum: values.reduce((a, b) => a + b, 0),
                avg: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0.00"
            };
        });

        const totalValues = processedData.map(d => d.total);
        const avgValues = processedData.map(d => parseFloat(d.average));

        return {
            subjects: subjectStats,
            total: {
                max: totalValues.length ? Math.max(...totalValues) : 0,
                min: totalValues.length ? Math.min(...totalValues) : 0,
                sum: totalValues.reduce((a, b) => a + b, 0),
                avg: totalValues.length ? (totalValues.reduce((a, b) => a + b, 0) / totalValues.length).toFixed(2) : "0.00"
            },
            average: {
                max: avgValues.length ? Math.max(...avgValues).toFixed(2) : 0,
                min: avgValues.length ? Math.min(...avgValues).toFixed(2) : 0,
                sum: avgValues.reduce((a, b) => a + b, 0).toFixed(2),
                avg: avgValues.length ? (avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(2) : "0.00"
            }
        };
    }, [processedData, displaySubjects]);

    useEffect(() => {
        setNameFontSize(null);
    }, [processedData, isCompact, paperSize]);

    useLayoutEffect(() => {
        if (!processedData.length || !cmToPx) {
            setIsMeasuring(false);
            setIsCompact(false);
            return;
        }

        setIsMeasuring(true);
        setIsCompact(false); // Selalu ukur dalam mode normal terlebih dahulu

        const timer = setTimeout(() => {
            if (contentRef.current && cmToPx > 0) {
                const pageHeightInCm = parseFloat(PAPER_SIZES[paperSize].height);
                // Area cetak vertikal aktual di dalam margin kita
                const availableHeightInCm = pageHeightInCm - HEADER_HEIGHT_CM - PAGE_BOTTOM_MARGIN_CM;
                const availableHeightInPx = availableHeightInCm * cmToPx;
                
                const contentHeight = contentRef.current.scrollHeight;
                
                if (contentHeight > availableHeightInPx) {
                    setIsCompact(true);
                } else {
                    setIsCompact(false);
                }
            }
            setIsMeasuring(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [processedData, paperSize, cmToPx]);

    useLayoutEffect(() => {
        if (isMeasuring || !processedData.length || !cmToPx) return;
    
        nameCellRefs.current = nameCellRefs.current.slice(0, processedData.length);
    
        const initialSize = isCompact ? 7.5 : 8;
        const currentSize = nameFontSize ?? initialSize;
    
        if (nameFontSize === null) {
            setNameFontSize(initialSize);
            return;
        }

        let needsResize = false;
        for (const cell of nameCellRefs.current) {
            // Check for horizontal overflow to detect if single-line name is too wide
            if (cell && cell.scrollWidth > cell.clientWidth + 1) {
                needsResize = true;
                break;
            }
        }
        
        if (needsResize && currentSize > 5) { 
            setNameFontSize(size => Math.max(5, size - 0.2));
        }
    }, [isMeasuring, processedData, isCompact, nameFontSize, cmToPx]);


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
        style.innerHTML = `
            @page { 
                ${paperSizeCss} 
                margin: 0 !important; 
            }
            @media print {
                .leger-page {
                    transform: scale(0.98);
                    transform-origin: top center;
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            document.getElementById('print-leger-style')?.remove();
            setIsPrinting(false);
        }, 500);
    };

    const pageStyle = { width: PAPER_SIZES[paperSize].width, height: PAPER_SIZES[paperSize].height };
    
    const tableHeader = useMemo(() => (
        React.createElement('thead', { className: isCompact ? 'text-[6pt]' : 'text-[6.5pt]' },
            React.createElement('tr', { className: "text-center font-bold" },
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "NO"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "NAMA MURID"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "NISN"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "NIS"),
                React.createElement('td', { colSpan: displaySubjects.length, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}` }, "NILAI MATA PELAJARAN"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "JML"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "RATA-RATA"),
                React.createElement('td', { rowSpan: 2, className: `border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}` }, "JUARA")
            ),
            React.createElement('tr', { className: "text-center font-bold" },
                displaySubjects.map(subject => 
                    React.createElement('td', { key: subject.id, className: "border border-black", style: { height: isCompact ? '1.75rem' : '2.45rem' } },
                        React.createElement('div', { className: "h-full flex items-center justify-center" },
                            React.createElement('div', {
                                style: { writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: isCompact ? '6.5pt' : '7pt' }
                            }, subject.label)
                        )
                    )
                )
            )
        )
    ), [displaySubjects, isCompact]);
    
    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-200';
        if (rank === 2) return 'bg-slate-300';
        if (rank === 3) return 'bg-orange-200';
        if (rank >= 4 && rank <= 10) return 'bg-blue-100';
        return null;
    };

    const renderTable = (rows) => (
        React.createElement('table', { 
            className: `w-full border-collapse border border-black font-times ${isCompact ? 'text-[7.5pt]' : 'text-[8pt]'}`,
            style: { tableLayout: 'fixed' } 
        },
            React.createElement('colgroup', null,
                React.createElement('col', { style: { width: '3%' } }),
                React.createElement('col', { style: { width: '25%' } }), // Increased Name to 25%
                React.createElement('col', { style: { width: '9%' } }), // Reduced NISN to 9%
                React.createElement('col', { style: { width: '4.5%' } }),  // Reduced NIS to 4.5%
                ...displaySubjects.map(() => React.createElement('col', { style: { width: `${(100 - 3 - 25 - 9 - 4.5 - 4.5 - 5.5 - 6.5) / displaySubjects.length}%` } })),
                React.createElement('col', { style: { width: '4.5%' } }), // Reduced JML to 4.5%
                React.createElement('col', { style: { width: '5.5%' } }), // Reduced Rata-rata to 5.5%
                React.createElement('col', { style: { width: '6.5%' } })  // Reduced Juara to 6.5%
            ),
            tableHeader,
            React.createElement('tbody', { className: "leading-snug" },
                rows.map((student, index) => {
                    const rowColor = getRankColor(student.rank);
                    
                    return (
                        React.createElement('tr', { key: student.no, className: rowColor ? `${rowColor} border-black` : '' },
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, student.no),
                            React.createElement('td', { 
                                ref: el => nameCellRefs.current[index] = el,
                                className: `border border-black px-2 ${isCompact ? 'py-0' : 'py-0'} whitespace-nowrap overflow-hidden`,
                                style: nameFontSize ? { fontSize: `${nameFontSize}pt`, lineHeight: 1.2 } : {}
                            }, student.namaLengkap),
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, student.nisn),
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, student.nis),
                            ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, student.grades[subject.id] ?? '')),
                            React.createElement('td', { className: `border border-black px-1 text-center font-bold ${isCompact ? 'py-0' : 'py-0'}` }, student.total),
                            React.createElement('td', { className: `border border-black px-1 text-center font-bold ${isCompact ? 'py-0' : 'py-0'}` }, student.average),
                            React.createElement('td', { className: `border border-black px-1 text-center font-bold ${isCompact ? 'py-0' : 'py-0'}` }, student.rank)
                        )
                    );
                }),
                statistics && (
                    React.createElement(React.Fragment, null,
                        React.createElement('tr', { className: 'bg-slate-50 font-bold' },
                            React.createElement('td', { colSpan: 4, className: `border border-black px-2 text-right ${isCompact ? 'py-0' : 'py-0'}` }, 'Nilai Tertinggi'),
                            ...displaySubjects.map(subject => 
                                React.createElement('td', { key: subject.id, className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.subjects[subject.id].max)
                            ),
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.total.max),
                            React.createElement('td', { className: `border border-black px-1 bg-slate-100` }), // Cleared JUMLAH
                            React.createElement('td', { className: `border border-black px-1 bg-white` })
                        ),
                        React.createElement('tr', { className: 'bg-slate-50 font-bold' },
                            React.createElement('td', { colSpan: 4, className: `border border-black px-2 text-right ${isCompact ? 'py-0' : 'py-0'}` }, 'Nilai Terendah'),
                            ...displaySubjects.map(subject => 
                                React.createElement('td', { key: subject.id, className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.subjects[subject.id].min)
                            ),
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.total.min),
                            React.createElement('td', { className: `border border-black px-1 bg-slate-100` }), // Cleared JUMLAH
                            React.createElement('td', { className: `border border-black px-1 bg-white` })
                        ),
                        React.createElement('tr', { className: 'bg-slate-50 font-bold' },
                            React.createElement('td', { colSpan: 4, className: `border border-black px-2 text-right ${isCompact ? 'py-0' : 'py-0'}` }, 'Total Nilai'),
                            ...displaySubjects.map(subject => 
                                React.createElement('td', { key: subject.id, className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.subjects[subject.id].sum)
                            ),
                            React.createElement('td', { className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.total.sum),
                            React.createElement('td', { className: `border border-black px-1 bg-slate-100` }), // Cleared JUMLAH
                            React.createElement('td', { className: `border border-black px-1 bg-white` })
                        ),
                        React.createElement('tr', { className: 'bg-slate-50 font-bold' },
                            React.createElement('td', { colSpan: 4, className: `border border-black px-2 text-right ${isCompact ? 'py-0' : 'py-0'}` }, 'Rata-rata Nilai'),
                            ...displaySubjects.map(subject => 
                                React.createElement('td', { key: subject.id, className: `border border-black px-1 text-center ${isCompact ? 'py-0' : 'py-0'}` }, statistics.subjects[subject.id].avg)
                            ),
                            React.createElement('td', { className: `border border-black px-1 bg-slate-100` }), // Cleared JUMLAH
                            React.createElement('td', { className: `border border-black px-1 bg-slate-100` }),
                            React.createElement('td', { className: `border border-black px-1 bg-white` })
                        )
                    )
                )
            )
        )
    );

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
            (students.length > 0) && React.createElement('div', {
                ref: pageRef,
                className: "leger-page bg-white mx-auto shadow-lg my-8 border relative",
                style: { ...pageStyle, visibility: isMeasuring ? 'hidden' : 'visible' }
            },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', {
                    ref: contentRef,
                    className: 'absolute flex flex-col',
                    style: {
                        top: `${HEADER_HEIGHT_CM}cm`,
                        left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                        right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                    }
                },
                    React.createElement(LegerHeader, { settings: settings, isCompact: isCompact }),
                    React.createElement('div', null,
                       renderTable(processedData)
                    ),
                    React.createElement(LegerFooter, { settings: settings, isCompact: isCompact })
                )
            )
        )
    );
};

export default PrintLegerPage;
