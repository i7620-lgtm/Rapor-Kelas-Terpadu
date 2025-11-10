import React, { useMemo, useState } from 'react';

const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

const PrintLegerPage = ({ students, settings, grades, subjects }) => {
    const [paperSize, setPaperSize] = useState('A4');

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

    const handlePrint = () => { window.print(); };

    const getPageSizeCss = () => {
        if (paperSize === 'F4') {
            return `size: ${PAPER_SIZES.F4.height} ${PAPER_SIZES.F4.width};`;
        }
        return `size: ${paperSize} landscape;`;
    };

    const printStyles = `
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .print-hidden { display: none; }
            .print-p-0 { padding: 0 !important; }
            .print-shadow-none { box-shadow: none !important; }
            .print-border-none { border: none !important; }
            @page { 
                ${getPageSizeCss()}
            }
        }
    `;

    return React.createElement('div', { className: "space-y-6" },
        React.createElement('div', { className: "flex justify-between items-center print-hidden" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Print Leger"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Pratinjau leger nilai akhir siswa. Gunakan tombol 'Cetak' untuk mencetak atau menyimpan sebagai PDF.")
            ),
            React.createElement('div', { className: "flex items-end gap-4" },
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                    React.createElement('select', {
                        id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                        className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                ),
                React.createElement('button', { onClick: handlePrint, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700" }, "Cetak")
            )
        ),
        React.createElement('div', { className: "bg-white p-8 rounded-xl shadow-md border border-slate-200 print-p-0 print:shadow-none print:border-none" },
            React.createElement('div', { className: "font-sans" },
                React.createElement('h2', { className: "text-center font-bold text-lg mb-1 uppercase" }, `LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[tahun ajaran]'} SEMESTER ${settings.semester || '[semester]'}`),
                React.createElement('div', { className: "flex justify-between text-sm mb-4" },
                    React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "SEKOLAH: "), (settings.nama_sekolah || '[nama sekolah]').toUpperCase()),
                    React.createElement('div', null, React.createElement('span', { className: "font-bold" }, "KELAS: "), (settings.nama_kelas || '[nama kelas]').toUpperCase())
                ),
                React.createElement('table', { className: "w-full text-xs border-collapse border border-black table-fixed" },
                    React.createElement('thead', null,
                        React.createElement('tr', { className: "text-center font-bold bg-slate-100" },
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-8 text-center" }, "NO"),
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-48" }, "NAMA MURID"),
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-24 text-center" }, "NISN"),
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-16 text-center" }, "NIS"),
                            React.createElement('td', { colSpan: displaySubjects.length, className: "border border-black p-1 text-center" }, "NILAI MATA PELAJARAN"),
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-16 text-center" }, "JUMLAH"),
                            React.createElement('td', { rowSpan: 2, className: "border border-black p-1 w-20 text-center" }, "RATA-RATA")
                        ),
                        React.createElement('tr', { className: "text-center font-bold bg-slate-100" },
                            ...displaySubjects.map(subject => React.createElement('td', { key: subject.id, className: "border border-black p-1 w-14 text-center" }, subject.label))
                        )
                    ),
                    React.createElement('tbody', null,
                        ...processedData.map(student => (
                            React.createElement('tr', { key: student.no },
                                React.createElement('td', { className: "border border-black p-1 text-center" }, student.no),
                                React.createElement('td', { className: "border border-black p-1" }, student.namaLengkap),
                                React.createElement('td', { className: "border border-black p-1 text-center" }, student.nisn),
                                React.createElement('td', { className: "border border-black p-1 text-center" }, student.nis),
                                ...displaySubjects.map(subject => (
                                    React.createElement('td', { key: subject.id, className: "border border-black p-1 text-center" }, student.grades[subject.id] ?? '')
                                )),
                                React.createElement('td', { className: "border border-black p-1 text-center font-bold" }, student.total),
                                React.createElement('td', { className: "border border-black p-1 text-center font-bold" }, student.average)
                            )
                        ))
                    )
                )
            )
        ),
        React.createElement('style', null, printStyles)
    );
};

export default PrintLegerPage;
