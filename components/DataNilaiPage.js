import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const getGradeNumber = (str) => {
    if (!str) return null;
    const match = str.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    const upperStr = str.toUpperCase();
    if (upperStr.includes('VI')) return 6;
    if (upperStr.includes('V')) return 5;
    if (upperStr.includes('IV')) return 4;
    if (upperStr.includes('III')) return 3;
    if (upperStr.includes('II')) return 2;
    if (upperStr.includes('I')) return 1;
    return null;
};

const AccordionItem = ({ title, isOpen, onToggle, children }) => (
    React.createElement('div', { className: "border border-slate-200 rounded-lg overflow-hidden transition-all duration-300" },
        React.createElement('button', {
            onClick: onToggle,
            className: "w-full flex justify-between items-center text-left p-4 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "aria-expanded": isOpen
        },
            React.createElement('h3', { className: "text-lg font-semibold text-slate-800" }, title),
            React.createElement('svg', {
                className: `w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`,
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                xmlns: "http://www.w3.org/2000/svg"
            },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" })
            )
        ),
        isOpen && (
            React.createElement('div', { className: "p-6 bg-white border-t border-slate-200" },
                children
            )
        )
    )
);

const RentangSection = ({ initialPredikats, onUpdate }) => {
    const [localPredikats, setLocalPredikats] = useState(initialPredikats);

    useEffect(() => setLocalPredikats(initialPredikats), [initialPredikats]);

    const handleBlur = () => onUpdate(localPredikats);

    return (
      React.createElement('div', { className: "max-w-2xl mx-auto" },
        React.createElement('p', { className: "text-sm text-slate-600 mb-6" }, "Masukkan rentang nilai yang sesuai pada kolom berikut. Perubahan akan disimpan secara otomatis."),
        React.createElement('div', { className: "space-y-6" },
            ['a', 'b', 'c'].map(predikat => (
                 React.createElement('div', { key: predikat, className: "flex items-center justify-between gap-4" },
                    React.createElement('label', { htmlFor: `predikat${predikat.toUpperCase()}`, className: "text-sm font-medium text-slate-700 whitespace-nowrap" },
                        "Predikat ", predikat.toUpperCase(), " (Mulai dari):"
                    ),
                    React.createElement('div', { className: "flex flex-col items-end" },
                        React.createElement('input', { type: "number", name: predikat, id: `predikat${predikat.toUpperCase()}`, value: localPredikats[predikat], onChange: (e) => setLocalPredikats(p => ({...p, [predikat]: e.target.value})), onBlur: handleBlur, placeholder: `cth. ${predikat === 'a' ? 90 : predikat === 'b' ? 80 : 70}`, className: "w-32 text-center px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" }),
                        predikat === 'c' && React.createElement('p', { className: "text-xs text-slate-500 mt-1" }, "Nilai di bawah ini akan ditandai.")
                    )
                )
            ))
        )
      )
    );
};

const TujuanPembelajaranSection = ({ subject, objectives, onUpdate, namaKelas }) => {
    const objectivesForCurrentClass = useMemo(() => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return {};
        for (const key in objectives) if (getGradeNumber(key) === currentGradeNumber) return objectives[key];
        return {};
    }, [objectives, namaKelas]);
    
    const currentObjectives = objectivesForCurrentClass[subject.fullName] || [];

    const handleUpdateObjectivesForClass = (newObjectivesForClass) => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return;
        let gradeKey = '';
        for (const key in objectives) if (getGradeNumber(key) === currentGradeNumber) { gradeKey = key; break; }
        if (!gradeKey) gradeKey = `Kelas ${currentGradeNumber}`;
        onUpdate({ ...objectives, [gradeKey]: newObjectivesForClass });
    };

    const handleObjectiveChange = (index, value) => {
        const newObjectivesForSubject = [...currentObjectives];
        newObjectivesForSubject[index] = value;
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    const handleAddObjective = () => {
        const newObjectivesForSubject = [...currentObjectives, ''];
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    const handleDeleteObjective = (index) => {
        if (!window.confirm("Hapus tujuan pembelajaran ini?")) return;
        const newObjectivesForSubject = currentObjectives.filter((_, i) => i !== index);
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    return (
        React.createElement('div', { className: "space-y-4" },
            currentObjectives.length > 0 ? (
                currentObjectives.map((objective, index) => (
                    React.createElement('div', { key: index, className: "flex items-center gap-2" },
                        React.createElement('span', { className: "text-sm font-medium text-slate-600" }, `${index + 1}.`),
                        React.createElement('input', { type: "text", value: objective, onChange: (e) => handleObjectiveChange(index, e.target.value), placeholder: `Tujuan Pembelajaran ${index + 1}`, className: "flex-grow p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" }),
                        React.createElement('button', { onClick: () => handleDeleteObjective(index), className: "flex items-center justify-center h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors", "aria-label": `Hapus TP ${index + 1}` },
                            React.createElement('span', { className: "font-bold text-lg" }, "\u00d7")
                        )
                    )
                ))
            ) : React.createElement('p', { className: "text-center text-slate-500 py-4" }, "Belum ada tujuan pembelajaran. Klik tombol di bawah untuk menambahkan."),
            React.createElement('button', { onClick: handleAddObjective, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "+ Tujuan Pembelajaran")
        )
    );
};

const NilaiPerMapelSection = ({ subject, students, grades, onUpdateDetailedGrade, objectives, namaKelas }) => {
    const [activeTooltip, setActiveTooltip] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => { if (!event.target.closest('.tp-header-button')) setActiveTooltip(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const objectivesForSubject = useMemo(() => {
        const gradeNum = getGradeNumber(namaKelas);
        if (gradeNum === null) return [];
        let gradeKey = '';
        for (const key in objectives) if (getGradeNumber(key) === gradeNum) { gradeKey = key; break; }
        return gradeKey ? objectives[gradeKey]?.[subject.fullName] || [] : [];
    }, [subject, namaKelas, objectives]);

    const numberOfTps = objectivesForSubject.length;

    const handleGradeChange = (studentId, type, value, tpIndex) => {
        const numericValue = value === '' ? null : parseInt(value, 10);
        if (value === '' || (numericValue !== null && !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
            onUpdateDetailedGrade(studentId, subject.id, type, numericValue, tpIndex);
        }
    };

    return (
        React.createElement('div', { className: "overflow-x-auto" },
            React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                    React.createElement('tr', null,
                        React.createElement('th', { className: "px-6 py-3 min-w-[200px]" }, "Nama Siswa"),
                        ...Array.from({ length: numberOfTps }).map((_, i) => (
                            React.createElement('th', { key: i, className: "px-2 py-3 w-20 text-center tp-header" },
                                React.createElement('button', { type: "button", className: "tp-header-button", onClick: (e) => setActiveTooltip(activeTooltip?.index === i ? null : { index: i, rect: e.currentTarget.getBoundingClientRect() }) },
                                    `TP ${i + 1}`
                                )
                            )
                        )),
                        React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "STS"),
                        React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "SAS"),
                        React.createElement('th', { className: "px-2 py-3 w-24 text-center font-bold" }, "Nilai Akhir")
                    )
                ),
                React.createElement('tbody', null,
                    students.map(student => {
                        const studentGrade = grades.find(g => g.studentId === student.id);
                        const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
                        return (
                        React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50" },
                            React.createElement('th', { className: "px-6 py-2 font-medium text-slate-900 whitespace-nowrap" }, student.namaLengkap),
                            ...Array.from({ length: numberOfTps }).map((_, i) => (
                                React.createElement('td', { key: i, className: "px-2 py-1" }, React.createElement('input', { type: "number", min: "0", max: "100", value: detailedGrade?.tp?.[i] ?? '', onChange: (e) => handleGradeChange(student.id, 'tp', e.target.value, i), className: "w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" }))
                            )),
                            React.createElement('td', { className: "px-2 py-1" }, React.createElement('input', { type: "number", min: "0", max: "100", value: detailedGrade?.sts ?? '', onChange: (e) => handleGradeChange(student.id, 'sts', e.target.value), className: "w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" })),
                            React.createElement('td', { className: "px-2 py-1" }, React.createElement('input', { type: "number", min: "0", max: "100", value: detailedGrade?.sas ?? '', onChange: (e) => handleGradeChange(student.id, 'sas', e.target.value), className: "w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" })),
                            React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800 bg-slate-50" }, studentGrade?.finalGrades?.[subject.id] ?? '')
                        )
                    )})
                )
            ),
            activeTooltip !== null && (
                React.createElement('div', { role: "tooltip", className: "tp-tooltip", style: { position: 'fixed', top: `${activeTooltip.rect.top}px`, left: `${activeTooltip.rect.left + activeTooltip.rect.width / 2}px`, transform: 'translate(-50%, -100%) translateY(-8px)' } },
                    objectivesForSubject[activeTooltip.index] || 'Tujuan Pembelajaran tidak ditemukan.',
                    React.createElement('div', { style: { content: '""', position: 'absolute', top: '100%', left: '50%', marginLeft: '-5px', borderWidth: '5px', borderStyle: 'solid', borderColor: '#1f2937 transparent transparent transparent' } })
                )
            )
        )
    );
};

const DeskripsiNilaiSection = ({ subject, students, grades, descriptions, onUpdateDescriptions, objectives, namaKelas, predikats }) => {
    useEffect(() => {
        const gradeNum = getGradeNumber(namaKelas);
        let gradeKey = '';
        if (gradeNum !== null) { for (const key in objectives) if (getGradeNumber(key) === gradeNum) { gradeKey = key; break; }}
        const objectivesForSubject = gradeKey ? objectives[gradeKey]?.[subject.fullName] || [] : [];
        const kkm = parseInt(predikats.c, 10) || 70;
        const totalTps = objectivesForSubject.length;
        const updates = JSON.parse(JSON.stringify(descriptions));
        let hasChanged = false;

        students.forEach(student => {
            const detailedGrade = grades.find(g => g.studentId === student.id)?.detailedGrades?.[subject.id];
            const studentTps = (detailedGrade && Array.isArray(detailedGrade.tp)) ? detailedGrade.tp : [];
            const masteredTps = objectivesForSubject.filter((_, index) => (studentTps[index] ?? 0) >= kkm);
            const studentName = student.namaPanggilan || student.namaLengkap.split(' ')[0];
            let generatedText = "";
            const hasGrades = studentTps.some(t => t !== null && t !== undefined);

            if (!hasGrades) generatedText = "Data nilai tujuan pembelajaran (formatif) belum diisi.";
            else if (masteredTps.length === totalTps && totalTps > 0) generatedText = `Ananda ${studentName} telah menguasai seluruh tujuan pembelajaran dengan sangat baik. Pertahankan prestasimu!`;
            else if (masteredTps.length > 0) generatedText = `Ananda ${studentName} menunjukkan penguasaan yang baik pada materi: ${masteredTps.join(', ')}. Perlu peningkatan pada materi lainnya.`;
            else generatedText = `Ananda ${studentName} masih memerlukan bimbingan lebih lanjut untuk dapat mencapai tujuan pembelajaran pada mata pelajaran ini.`;
            
            const newDescription = generatedText.trim();
            const currentDescription = descriptions[student.id]?.[subject.id] || '';
            if (newDescription !== currentDescription) {
                hasChanged = true;
                if (!updates[student.id]) updates[student.id] = {};
                updates[student.id][subject.id] = newDescription;
            }
        });

        if (hasChanged) onUpdateDescriptions(updates);
    }, [students, grades, subject, objectives, namaKelas, predikats, descriptions, onUpdateDescriptions]);

    return (
        React.createElement('div', { className: "space-y-4 max-h-[60vh] overflow-y-auto pr-2" },
            students.map(student => (
                React.createElement('div', { key: student.id, className: "p-4 border rounded-lg bg-slate-50/50" },
                    React.createElement('div', { className: "flex justify-between items-center mb-2" },
                        React.createElement('h4', { className: "font-semibold text-slate-800" }, student.namaLengkap),
                        React.createElement('span', { className: "text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded" }, "Nilai Akhir: ", grades.find(g => g.studentId === student.id)?.finalGrades?.[subject.id] ?? 'N/A')
                    ),
                    React.createElement('textarea', { value: descriptions[student.id]?.[subject.id] || '', readOnly: true, placeholder: "Deskripsi akan muncul di sini secara otomatis setelah nilai TP terisi...", className: "w-full p-2 mt-2 text-sm bg-slate-100 border border-slate-300 rounded-md cursor-default", rows: 3 })
                )
            ))
        )
    );
};

const SubjectDetailView = (props) => {
    const { subject } = props;
    const [openPanel, setOpenPanel] = useState('nilai');
    const togglePanel = (panelName) => setOpenPanel(openPanel === panelName ? null : panelName);

    return (
        React.createElement('div', { className: "space-y-4" },
            React.createElement(AccordionItem, { title: "Rentang Nilai", isOpen: openPanel === 'rentang', onToggle: () => togglePanel('rentang') },
                React.createElement('p', { className: "text-sm text-slate-500 mb-4" }, "(Pengaturan ini berlaku untuk semua mata pelajaran)"),
                React.createElement(RentangSection, { initialPredikats: props.predikats, onUpdate: props.onUpdatePredikats })
            ),
            React.createElement(AccordionItem, { title: "Tujuan Pembelajaran", isOpen: openPanel === 'tp', onToggle: () => togglePanel('tp') },
                React.createElement(TujuanPembelajaranSection, { subject: subject, objectives: props.learningObjectives, onUpdate: props.onUpdateLearningObjectives, namaKelas: props.namaKelas })
            ),
            React.createElement(AccordionItem, { title: "Input Nilai", isOpen: openPanel === 'nilai', onToggle: () => togglePanel('nilai') },
                 React.createElement(NilaiPerMapelSection, props)
            ),
            React.createElement(AccordionItem, { title: "Deskripsi Rapor", isOpen: openPanel === 'deskripsi', onToggle: () => togglePanel('deskripsi') },
                React.createElement(DeskripsiNilaiSection, props)
            )
        )
    );
};

const NilaiKeseluruhanView = ({ students, grades, subjects, predikats }) => {
    const [sortBy, setSortBy] = useState('no');
    const activeSubjects = useMemo(() => subjects.filter((s) => s.active), [subjects]);

    const displaySubjects = useMemo(() => {
        const finalDisplaySubjects = [];
        const addedGroupPrefixes = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti', active: true } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SB', fullName: 'Seni Budaya', active: true } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'Mulok', fullName: 'Muatan Lokal', active: true } }
        ];
        for (const subject of activeSubjects) {
            const group = groups.find(g => subject.fullName.startsWith(g.prefix));
            if (group) {
                if (!addedGroupPrefixes.has(group.prefix)) {
                    finalDisplaySubjects.push(group.base);
                    addedGroupPrefixes.add(group.prefix);
                }
            } else finalDisplaySubjects.push(subject);
        }
        const sortOrder = { 'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5, 'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9 };
        finalDisplaySubjects.sort((a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));
        return finalDisplaySubjects;
    }, [activeSubjects]);

    const processedData = useMemo(() => {
        const dataWithCalculations = students.map((student, index) => {
            const studentGrades = grades.find((g) => g.studentId === student.id) || { studentId: student.id, detailedGrades: {}, finalGrades: {} };
            let total = 0, subjectCount = 0;
            const displayGrades = displaySubjects.reduce((acc, displaySubject) => {
                let grade;
                if (['PABP', 'SB', 'Mulok'].includes(displaySubject.id)) {
                    const memberSubjects = activeSubjects.filter((s) => s.fullName.startsWith(displaySubject.fullName));
                    for (const member of memberSubjects) {
                        const memberGrade = studentGrades.finalGrades?.[member.id];
                        if (memberGrade !== undefined && memberGrade !== null) { grade = memberGrade; break; }
                    }
                } else grade = studentGrades.finalGrades?.[displaySubject.id];
                if (typeof grade === 'number') { total += grade; subjectCount++; }
                acc[displaySubject.id] = grade;
                return acc;
            }, {});
            return { ...student, no: index + 1, grades: displayGrades, total, average: subjectCount > 0 ? total / subjectCount : 0 };
        });
        const rankedData = [...dataWithCalculations].sort((a, b) => b.total - a.total).reduce((acc, student, index) => {
            const rank = (index > 0 && student.total === acc[index - 1].total) ? acc[index - 1].rank : index + 1;
            acc.push({ ...student, rank: student.total > 0 ? rank : '-' });
            return acc;
        }, []);
        const dataWithRanks = dataWithCalculations.map(d => {
            const studentWithRank = rankedData.find(s => s.id === d.id);
            return { ...d, rank: studentWithRank?.rank || '-' };
        });
        if (sortBy === 'rank') return dataWithRanks.sort((a, b) => (a.rank === '-' ? 1 : b.rank === '-' ? -1 : a.rank - b.rank || a.no - b.no));
        return dataWithRanks.sort((a, b) => a.no - b.no);
    }, [students, grades, sortBy, activeSubjects, displaySubjects]);

    return (
        React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
            React.createElement('div', { className: "flex justify-end items-center mb-4" }, React.createElement('span', { className: "text-sm font-medium text-slate-700 mr-4" }, "Urutkan:"), React.createElement('div', { className: "flex items-center gap-4" }, React.createElement('label', { className: "flex items-center cursor-pointer" }, React.createElement('input', { type: "radio", name: "sort", value: "no", checked: sortBy === 'no', onChange: () => setSortBy('no'), className: "h-4 w-4 text-indigo-600 border-slate-300" }), React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "No. Absen")), React.createElement('label', { className: "flex items-center cursor-pointer" }, React.createElement('input', { type: "radio", name: "sort", value: "rank", checked: sortBy === 'rank', onChange: () => setSortBy('rank'), className: "h-4 w-4 text-indigo-600 border-slate-300" }), React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "Peringkat")))),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "w-full text-sm text-left text-slate-500" }, React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" }, React.createElement('tr', null, React.createElement('th', { className: "px-3 py-3 w-10 text-center" }, sortBy === 'rank' ? 'Peringkat' : 'No'), React.createElement('th', { className: "px-6 py-3 min-w-[200px]" }, "Nama Siswa"), ...displaySubjects.map(s => React.createElement('th', { key: s.id, className: "px-2 py-3 w-20 text-center", title: s.fullName }, s.label)), React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "Jumlah"), React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "Rata-rata"))),
                React.createElement('tbody', null,
                    processedData.map(data => {
                        const predicateCValue = parseInt(predikats?.c, 10);
                        return (
                        React.createElement('tr', { key: data.id, className: "bg-white border-b hover:bg-slate-50" },
                            React.createElement('td', { className: "px-3 py-2 text-center font-medium" }, sortBy === 'rank' ? data.rank : data.no), React.createElement('th', { className: "px-6 py-2 font-medium text-slate-900 whitespace-nowrap" }, data.namaLengkap),
                            ...displaySubjects.map(subject => {
                                const grade = data.grades[subject.id];
                                const isBelowC = !isNaN(predicateCValue) && typeof grade === 'number' && grade < predicateCValue;
                                return React.createElement('td', { key: subject.id, className: "px-2 py-1" }, React.createElement('input', { type: "text", value: grade ?? '', readOnly: true, className: `w-16 p-2 text-center bg-slate-100 border-slate-200 rounded-md cursor-not-allowed ${isBelowC ? 'text-red-600 font-bold' : ''}` }));
                            }),
                            React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800" }, data.total), React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800" }, data.average.toFixed(2)))
                    )}))
                )
            )
        )
    );
};

const DataNilaiPage = (props) => {
    const [activeTab, setActiveTab] = useState('keseluruhan');
    const { subjects } = props;
    const activeSubjects = useMemo(() => subjects.filter((s) => s.active), [subjects]);
    const selectedSubject = useMemo(() => activeSubjects.find((s) => s.id === activeTab), [activeTab, activeSubjects]);

    const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
    const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-sm";

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Nilai"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Kelola nilai siswa per mata pelajaran. Pengaturan dapat diakses di halaman Pengaturan.")
            ),
            
            React.createElement('div', { className: "flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4" },
                React.createElement('button', { onClick: () => setActiveTab('keseluruhan'), className: activeTab === 'keseluruhan' ? activeButtonClass : inactiveButtonClass }, "Nilai Keseluruhan"),
                activeSubjects.map((subject) => (
                    React.createElement('button', { key: subject.id, onClick: () => setActiveTab(subject.id), className: activeTab === subject.id ? activeButtonClass : inactiveButtonClass }, subject.label)
                ))
            ),

            React.createElement('div', null,
                activeTab === 'keseluruhan' && React.createElement(NilaiKeseluruhanView, props),
                selectedSubject && React.createElement(SubjectDetailView, { ...props, subject: selectedSubject })
            )
        )
    );
};

export default DataNilaiPage;
