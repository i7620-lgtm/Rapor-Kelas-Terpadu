import React, { useMemo, useState } from 'react';
import { generateInitialLayout } from './TransliterationUtil.js';

const PAPER_SIZES = {
    A4: { width: '29.7cm', height: '21cm' },
    F4: { width: '33cm', height: '21.5cm' },
    Letter: { width: '27.94cm', height: '21.59cm' },
    Legal: { width: '35.56cm', height: '21.59cm' },
};

const HEADER_HEIGHT_CM = 5.2;

const ReportHeader = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        // Changed from absolute positioning to a block in the normal flow.
        // Height is maintained to push content down. Side padding is removed as @page margin handles it.
        React.createElement('div', { 
            style: { 
                height: `${HEADER_HEIGHT_CM}cm`, 
                paddingTop: '1cm', // Retain top padding for SVG vertical alignment.
                boxSizing: 'border-box'
            } 
        },
            React.createElement('div', { className: "relative w-full h-full" },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 180", preserveAspectRatio: "xMidYMin meet" },
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
                            const imageUrl = String(settings[el.content] || '');
                            if (!imageUrl) return null;
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

const LegerHeader = ({ settings }) => (
    React.createElement('div', { className: "font-sans" },
        React.createElement('h2', { className: "text-center font-bold text-lg mb-1 uppercase" }, `LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[tahun ajaran]'} SEMESTER ${settings.semester || '[semester]'}`),
        React.createElement('div', { className: "flex justify-between text-sm mb-4" },
            React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "SEKOLAH: "), (settings.nama_sekolah || '[nama sekolah]').toUpperCase()),
            React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "KELAS: "), (settings.nama_kelas || '[nama kelas]').toUpperCase())
        )
    )
);

const LegerFooter = ({ settings, signatureFontSize }) => {
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
    
    return (
        React.createElement('div', { className: "font-sans mt-2" },
            React.createElement('div', { 
                className: "pt-4 flex justify-between",
                style: { fontSize: signatureFontSize }
            },
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
};

const PrintLegerPage = ({ students, settings, grades, subjects, showToast }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [isPrinting, setIsPrinting] = useState(false);
    
    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');

        const paperSizeCss = {
            A4: 'size: A4 landscape;',
            F4: 'size: 33cm 21.5cm landscape;',
            Letter: 'size: letter landscape;',
            Legal: 'size: legal landscape;',
        }[paperSize];

        const style = document.createElement('style');
        style.id = 'print-leger-style';
        style.innerHTML = `
            @page { 
                ${paperSizeCss}
                margin: 1.5cm;
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            document.getElementById('print-leger-style')?.remove();
            setIsPrinting(false);
        }, 500);
    };

    const pageStyle = {
        width: PAPER_SIZES[paperSize].width,
        minHeight: PAPER_SIZES[paperSize].height,
    };

    const activeSubjects = useMemo(() => (subjects || []).filter(s => s.active), [subjects]);
    
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
        if (!students || !grades) return [];
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

    const subjectColWidth = `${(100 - 4 - 22 - 8 - 6 - 7 - 8) / (displaySubjects.length || 1)}%`;

    return React.createElement('div', { className: "space-y-6" },
        React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 print-hidden" },
            React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Leger"),
                    React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pratinjau leger nilai akhir siswa. Gunakan tombol cetak untuk hasil berkualitas tinggi.")
                ),
                React.createElement('div', { className: "flex items-end gap-4 mt-4 md:mt-0" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                        React.createElement('select', {
                            id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                            className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                    ),
                    React.createElement('button', { 
                        onClick: handlePrint, 
                        disabled: isPrinting,
                        className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                    }, isPrinting ? 'Mempersiapkan...' : 'Cetak Leger (Print)')
                )
            )
        ),
        React.createElement('div', { id: "print-area" },
            React.createElement('div', {
                className: "leger-page bg-white mx-auto shadow-lg my-8 border p-6",
                style: { ...pageStyle, height: 'auto' }
            },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement(LegerHeader, { settings: settings }),
                React.createElement('div', null,
                    React.createElement('table', {
                        className: "leger-table w-full border-collapse border border-black",
                        style: { fontSize: tableFontSize, tableLayout: 'fixed' }
                    },
                        React.createElement('colgroup', null,
                            React.createElement('col', { style: { width: '4%' } }),
                            React.createElement('col', { style: { width: '22%' } }),
                            React.createElement('col', { style: { width: '8%' } }),
                            React.createElement('col', { style: { width: '6%' } }),
                            ...displaySubjects.map(subject => React.createElement('col', { key: subject.id, style: { width: subjectColWidth } })),
                            React.createElement('col', { style: { width: '7%' } }),
                            React.createElement('col', { style: { width: '8%' } })
                        ),
                        React.createElement('thead', null,
                            React.createElement('tr', { className: "text-center font-bold bg-slate-100", style: { fontSize: headerFontSize } },
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "NO"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "NAMA MURID"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "NISN"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "NIS"),
                                React.createElement('td', { colSpan: displaySubjects.length, className: "border border-black px-2 py-[2px] align-middle" }, "NILAI MATA PELAJARAN"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "JUMLAH"),
                                React.createElement('td', { rowSpan: 2, className: "border border-black px-2 py-[2px] align-middle" }, "RATA-RATA")
                            ),
                            React.createElement('tr', { className: "text-center font-bold bg-slate-100" },
                                ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: "border border-black px-2 py-[2px] align-middle" }, subject.label))
                            )
                        ),
                        React.createElement('tbody', null,
                            processedData.map(student => (
                                React.createElement('tr', { key: student.no },
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.no),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px]" }, student.namaLengkap),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.nisn),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center" }, student.nis),
                                    ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: "border border-black px-2 py-[2px] text-center" }, student.grades[subject.id] ?? '')),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center font-bold" }, student.total),
                                    React.createElement('td', { className: "border border-black px-2 py-[2px] text-center font-bold" }, student.average)
                                )
                            ))
                        )
                    )
                ),
                React.createElement(LegerFooter, { settings: settings, signatureFontSize: signatureFontSize })
            )
        )
    );
};

export default PrintLegerPage;
