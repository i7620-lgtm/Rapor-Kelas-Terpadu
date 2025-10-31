
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Student, StudentGrade, SubjectKey, LearningObjectives, StudentDescriptions, Subject, DetailedSubjectGrade } from '../types';

// Helper function to extract grade number from class name strings
const getGradeNumber = (str: string): number | null => {
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

// --- START: Reusable Accordion Component ---
const AccordionItem: React.FC<{ title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; }> = ({ title, isOpen, onToggle, children }) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-300">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center text-left p-4 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={isOpen}
        >
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <svg
                className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
        {isOpen && (
            <div className="p-6 bg-white border-t border-slate-200">
                {children}
            </div>
        )}
    </div>
);
// --- END: Reusable Accordion Component ---

// --- START: Section Components for Subject Detail View ---
const RentangSection: React.FC<{ initialPredikats: { a: string; b: string; c: string }; onUpdate: (newPredikats: { a: string; b: string; c: string }) => void; }> = ({ initialPredikats, onUpdate }) => {
    const [localPredikats, setLocalPredikats] = useState(initialPredikats);

    useEffect(() => setLocalPredikats(initialPredikats), [initialPredikats]);

    const handleBlur = () => onUpdate(localPredikats);

    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-slate-600 mb-6">Masukkan rentang nilai yang sesuai pada kolom berikut. Perubahan akan disimpan secara otomatis.</p>
        <div className="space-y-6">
            {['a', 'b', 'c'].map(predikat => (
                 <div key={predikat} className="flex items-center justify-between gap-4">
                    <label htmlFor={`predikat${predikat.toUpperCase()}`} className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        Predikat {predikat.toUpperCase()} (Mulai dari):
                    </label>
                    <div className="flex flex-col items-end">
                        <input type="number" name={predikat} id={`predikat${predikat.toUpperCase()}`} value={localPredikats[predikat as keyof typeof localPredikats]} onChange={(e) => setLocalPredikats(p => ({...p, [predikat]: e.target.value}))} onBlur={handleBlur} placeholder={`cth. ${predikat === 'a' ? 90 : predikat === 'b' ? 80 : 70}`} className="w-32 text-center px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
                        {predikat === 'c' && <p className="text-xs text-slate-500 mt-1">Nilai di bawah ini akan ditandai.</p>}
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
};

const TujuanPembelajaranSection: React.FC<{ subject: Subject, objectives: LearningObjectives, onUpdate: (newObjectives: LearningObjectives) => void, namaKelas: string }> = ({ subject, objectives, onUpdate, namaKelas }) => {
    const objectivesForCurrentClass = useMemo(() => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return {};
        for (const key in objectives) if (getGradeNumber(key) === currentGradeNumber) return objectives[key];
        return {};
    }, [objectives, namaKelas]);
    
    const currentObjectives = objectivesForCurrentClass[subject.fullName] || [];

    const handleUpdateObjectivesForClass = (newObjectivesForClass: { [subject: string]: string[] }) => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return;
        let gradeKey = '';
        for (const key in objectives) if (getGradeNumber(key) === currentGradeNumber) { gradeKey = key; break; }
        if (!gradeKey) gradeKey = `Kelas ${currentGradeNumber}`;
        onUpdate({ ...objectives, [gradeKey]: newObjectivesForClass });
    };

    const handleObjectiveChange = (index: number, value: string) => {
        const newObjectivesForSubject = [...currentObjectives];
        newObjectivesForSubject[index] = value;
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    const handleAddObjective = () => {
        const newObjectivesForSubject = [...currentObjectives, ''];
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    const handleDeleteObjective = (index: number) => {
        if (!window.confirm("Hapus tujuan pembelajaran ini?")) return;
        const newObjectivesForSubject = currentObjectives.filter((_, i) => i !== index);
        handleUpdateObjectivesForClass({ ...objectivesForCurrentClass, [subject.fullName]: newObjectivesForSubject });
    };

    return (
        <div className="space-y-4">
            {currentObjectives.length > 0 ? (
                currentObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">{index + 1}.</span>
                        <input type="text" value={objective} onChange={(e) => handleObjectiveChange(index, e.target.value)} placeholder={`Tujuan Pembelajaran ${index + 1}`} className="flex-grow p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        <button onClick={() => handleDeleteObjective(index)} className="flex items-center justify-center h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={`Hapus TP ${index + 1}`}>
                            <span className="font-bold text-lg">×</span>
                        </button>
                    </div>
                ))
            ) : <p className="text-center text-slate-500 py-4">Belum ada tujuan pembelajaran. Klik tombol di bawah untuk menambahkan.</p>}
            <button onClick={handleAddObjective} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">+ Tujuan Pembelajaran</button>
        </div>
    );
};

const NilaiPerMapelSection: React.FC<{ subject: Subject, students: Student[], grades: StudentGrade[], onUpdateDetailedGrade: Function, objectives: LearningObjectives, namaKelas: string }> = ({ subject, students, grades, onUpdateDetailedGrade, objectives, namaKelas }) => {
    const [activeTooltip, setActiveTooltip] = useState<{ index: number; rect: DOMRect } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (!(event.target as HTMLElement).closest('.tp-header-button')) setActiveTooltip(null); };
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

    const handleGradeChange = (studentId: number, type: 'tp' | 'sts' | 'sas', value: string, tpIndex?: number) => {
        const numericValue = value === '' ? null : parseInt(value, 10);
        if (value === '' || (numericValue !== null && !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
            onUpdateDetailedGrade(studentId, subject.id, type, numericValue, tpIndex);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th className="px-6 py-3 min-w-[200px]">Nama Siswa</th>
                        {Array.from({ length: numberOfTps }).map((_, i) => (
                            <th key={i} className="px-2 py-3 w-20 text-center tp-header">
                                <button type="button" className="tp-header-button" onClick={(e) => setActiveTooltip(activeTooltip?.index === i ? null : { index: i, rect: e.currentTarget.getBoundingClientRect() })}>
                                    {`TP ${i + 1}`}
                                </button>
                            </th>
                        ))}
                        <th className="px-2 py-3 w-20 text-center">STS</th>
                        <th className="px-2 py-3 w-20 text-center">SAS</th>
                        <th className="px-2 py-3 w-24 text-center font-bold">Nilai Akhir</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => {
                        const studentGrade = grades.find(g => g.studentId === student.id);
                        const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
                        return (
                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                            <th className="px-6 py-2 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                            {Array.from({ length: numberOfTps }).map((_, i) => (
                                <td key={i} className="px-2 py-1"><input type="number" min="0" max="100" value={detailedGrade?.tp?.[i] ?? ''} onChange={(e) => handleGradeChange(student.id, 'tp', e.target.value, i)} className="w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></td>
                            ))}
                            <td className="px-2 py-1"><input type="number" min="0" max="100" value={detailedGrade?.sts ?? ''} onChange={(e) => handleGradeChange(student.id, 'sts', e.target.value)} className="w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></td>
                            <td className="px-2 py-1"><input type="number" min="0" max="100" value={detailedGrade?.sas ?? ''} onChange={(e) => handleGradeChange(student.id, 'sas', e.target.value)} className="w-16 p-2 text-center bg-white border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></td>
                            <td className="px-2 py-2 text-center font-semibold text-slate-800 bg-slate-50">{studentGrade?.finalGrades?.[subject.id] ?? ''}</td>
                        </tr>
                    )})}
                </tbody>
            </table>
            {activeTooltip !== null && (
                <div role="tooltip" className="tp-tooltip" style={{ position: 'fixed', top: `${activeTooltip.rect.top}px`, left: `${activeTooltip.rect.left + activeTooltip.rect.width / 2}px`, transform: 'translate(-50%, -100%) translateY(-8px)' }}>
                    {objectivesForSubject[activeTooltip.index] || 'Tujuan Pembelajaran tidak ditemukan.'}
                    <div style={{ content: '""', position: 'absolute', top: '100%', left: '50%', marginLeft: '-5px', borderWidth: '5px', borderStyle: 'solid', borderColor: '#1f2937 transparent transparent transparent' }}></div>
                </div>
            )}
        </div>
    );
};

const DeskripsiNilaiSection: React.FC<{ subject: Subject, students: Student[], grades: StudentGrade[], descriptions: StudentDescriptions, onUpdateDescriptions: Function, objectives: LearningObjectives, namaKelas: string, predikats: { a: string, b: string, c: string } }> = ({ subject, students, grades, descriptions, onUpdateDescriptions, objectives, namaKelas, predikats }) => {
    useEffect(() => {
        const gradeNum = getGradeNumber(namaKelas);
        let gradeKey = '';
        if (gradeNum !== null) { for (const key in objectives) if (getGradeNumber(key) === gradeNum) { gradeKey = key; break; }}
        const objectivesForSubject = gradeKey ? objectives[gradeKey]?.[subject.fullName] || [] : [];
        const kkm = parseInt(predikats.c, 10) || 70;
        const totalTps = objectivesForSubject.length;
        const updates: StudentDescriptions = JSON.parse(JSON.stringify(descriptions));
        let hasChanged = false;

        students.forEach(student => {
            const detailedGrade = grades.find(g => g.studentId === student.id)?.detailedGrades?.[subject.id];
            const masteredTps = objectivesForSubject.filter((_, index) => (detailedGrade?.tp?.[index] ?? 0) >= kkm);
            const studentName = student.namaPanggilan || student.namaLengkap.split(' ')[0];
            let generatedText = "";
            const hasGrades = detailedGrade?.tp?.some(t => t !== null && t !== undefined);

            if (!hasGrades) generatedText = "Data nilai tujuan pembelajaran (formatif) belum diisi.";
            else if (masteredTps.length === totalTps && totalTps > 0) generatedText = `Ananda ${studentName} telah menguasai seluruh tujuan pembelajaran dengan sangat baik. Pertahankan prestasimu!`;
            else if (masteredTps.length > 0) generatedText = `Ananda ${studentName} menunjukkan penguasaan yang baik pada materi: ${masteredTps.join(', ')}. Perlu peningkatan pada materi lainnya.`;
            else generatedText = `Ananda ${studentName} masih memerlukan bimbingan lebih lanjut untuk dapat mencapai tujuan pembelajaran pada mata pelajaran ini.`;
            
            const newDescription = generatedText.trim();
            if (newDescription !== (descriptions[student.id]?.[subject.id] || '')) {
                hasChanged = true;
                if (!updates[student.id]) updates[student.id] = {};
                updates[student.id][subject.id] = newDescription;
            }
        });

        if (hasChanged) onUpdateDescriptions(updates);
    }, [students, grades, subject, objectives, namaKelas, predikats, descriptions, onUpdateDescriptions]);

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {students.map(student => (
                <div key={student.id} className="p-4 border rounded-lg bg-slate-50/50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-slate-800">{student.namaLengkap}</h4>
                        <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">Nilai Akhir: {grades.find(g => g.studentId === student.id)?.finalGrades?.[subject.id] ?? 'N/A'}</span>
                    </div>
                    <textarea value={descriptions[student.id]?.[subject.id] || ''} readOnly placeholder="Deskripsi akan muncul di sini secara otomatis setelah nilai TP terisi..." className="w-full p-2 mt-2 text-sm bg-slate-100 border border-slate-300 rounded-md cursor-default" rows={3} />
                </div>
            ))}
        </div>
    );
};

const SubjectDetailView: React.FC<any> = ({ subject, ...props }) => {
    const [openPanel, setOpenPanel] = useState('nilai');
    const togglePanel = (panelName: string) => setOpenPanel(openPanel === panelName ? null : panelName);

    return (
        <div className="space-y-4">
            <AccordionItem title="Rentang Nilai" isOpen={openPanel === 'rentang'} onToggle={() => togglePanel('rentang')}>
                <p className="text-sm text-slate-500 mb-4">(Pengaturan ini berlaku untuk semua mata pelajaran)</p>
                <RentangSection initialPredikats={props.predikats} onUpdate={props.onUpdatePredikats} />
            </AccordionItem>
            <AccordionItem title="Tujuan Pembelajaran" isOpen={openPanel === 'tp'} onToggle={() => togglePanel('tp')}>
                <TujuanPembelajaranSection subject={subject} objectives={props.learningObjectives} onUpdate={props.onUpdateLearningObjectives} namaKelas={props.namaKelas} />
            </AccordionItem>
            <AccordionItem title="Input Nilai" isOpen={openPanel === 'nilai'} onToggle={() => togglePanel('nilai')}>
                 <NilaiPerMapelSection subject={subject} students={props.students} grades={props.grades} onUpdateDetailedGrade={props.onUpdateDetailedGrade} objectives={props.learningObjectives} namaKelas={props.namaKelas} />
            </AccordionItem>
            <AccordionItem title="Deskripsi Rapor" isOpen={openPanel === 'deskripsi'} onToggle={() => togglePanel('deskripsi')}>
                <DeskripsiNilaiSection subject={subject} {...props} />
            </AccordionItem>
        </div>
    );
};
// --- END: Section Components for Subject Detail View ---

// --- START: Nilai Keseluruhan View ---
type ProcessedStudent = Student & { no: number; grades: Record<string, any>; total: number; average: number; rank: number | string; };
const NilaiKeseluruhanView: React.FC<any> = ({ students, grades, subjects, predikats }) => {
    const [sortBy, setSortBy] = useState<'no' | 'rank'>('no');
    const activeSubjects = useMemo(() => subjects.filter((s: Subject) => s.active), [subjects]);

    const displaySubjects = useMemo(() => {
        const finalDisplaySubjects: Subject[] = [];
        const addedGroupPrefixes = new Set<string>();
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
        const sortOrder: Record<string, number> = { 'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5, 'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9 };
        finalDisplaySubjects.sort((a: Subject, b: Subject) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));
        return finalDisplaySubjects;
    }, [activeSubjects]);

    const processedData = useMemo(() => {
        const dataWithCalculations = students.map((student: Student, index: number) => {
            const studentGrades = grades.find((g: StudentGrade) => g.studentId === student.id) || { studentId: student.id, detailedGrades: {}, finalGrades: {} };
            let total = 0, subjectCount = 0;
            const displayGrades = displaySubjects.reduce((acc, displaySubject) => {
                let grade: number | null | undefined;
                if (['PABP', 'SB', 'Mulok'].includes(displaySubject.id)) {
                    const memberSubjects = activeSubjects.filter((s: Subject) => s.fullName.startsWith(displaySubject.fullName));
                    for (const member of memberSubjects) {
                        const memberGrade = studentGrades.finalGrades?.[member.id];
                        if (memberGrade !== undefined && memberGrade !== null) { grade = memberGrade; break; }
                    }
                } else grade = studentGrades.finalGrades?.[displaySubject.id];
                if (typeof grade === 'number') { total += grade; subjectCount++; }
                acc[displaySubject.id] = grade;
                return acc;
            }, {} as Record<string, any>);
            return { ...student, no: index + 1, grades: displayGrades, total, average: subjectCount > 0 ? total / subjectCount : 0 };
        });
        const rankedData = [...dataWithCalculations].sort((a, b) => b.total - a.total).reduce((acc: any[], student, index) => {
            const rank = (index > 0 && student.total === acc[index - 1].total) ? acc[index - 1].rank : index + 1;
            acc.push({ ...student, rank: student.total > 0 ? rank : '-' });
            return acc;
        }, []);
        const dataWithRanks = dataWithCalculations.map(d => {
            const studentWithRank = rankedData.find(s => s.id === d.id);
            return { ...d, rank: studentWithRank?.rank || '-' };
        });
        if (sortBy === 'rank') return dataWithRanks.sort((a, b) => (a.rank === '-' ? 1 : b.rank === '-' ? -1 : (a.rank as number) - (b.rank as number) || a.no - b.no));
        return dataWithRanks.sort((a, b) => a.no - b.no);
    }, [students, grades, sortBy, activeSubjects, displaySubjects]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex justify-end items-center mb-4"><span className="text-sm font-medium text-slate-700 mr-4">Urutkan:</span><div className="flex items-center gap-4"><label className="flex items-center cursor-pointer"><input type="radio" name="sort" value="no" checked={sortBy === 'no'} onChange={() => setSortBy('no')} className="h-4 w-4 text-indigo-600 border-slate-300" /><span className="ml-2 text-sm text-slate-600">No. Absen</span></label><label className="flex items-center cursor-pointer"><input type="radio" name="sort" value="rank" checked={sortBy === 'rank'} onChange={() => setSortBy('rank')} className="h-4 w-4 text-indigo-600 border-slate-300" /><span className="ml-2 text-sm text-slate-600">Peringkat</span></label></div></div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500"><thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-3 py-3 w-10 text-center">{sortBy === 'rank' ? 'Peringkat' : 'No'}</th><th className="px-6 py-3 min-w-[200px]">Nama Siswa</th>{displaySubjects.map(s => <th key={s.id} className="px-2 py-3 w-20 text-center" title={s.fullName}>{s.label}</th>)}<th className="px-2 py-3 w-20 text-center">Jumlah</th><th className="px-2 py-3 w-20 text-center">Rata-rata</th></tr></thead>
                <tbody>
                    {processedData.map(data => {
                        const predicateCValue = parseInt(predikats.c, 10);
                        return (
                        <tr key={data.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-3 py-2 text-center font-medium">{sortBy === 'rank' ? data.rank : data.no}</td><th className="px-6 py-2 font-medium text-slate-900 whitespace-nowrap">{data.namaLengkap}</th>
                            {displaySubjects.map(subject => {
                                const grade = data.grades[subject.id];
                                const isBelowC = !isNaN(predicateCValue) && typeof grade === 'number' && grade < predicateCValue;
                                return <td key={subject.id} className="px-2 py-1"><input type="text" value={grade ?? ''} readOnly className={`w-16 p-2 text-center bg-slate-100 border-slate-200 rounded-md cursor-not-allowed ${isBelowC ? 'text-red-600 font-bold' : ''}`} /></td>
                            })}
                            <td className="px-2 py-2 text-center font-semibold text-slate-800">{data.total}</td><td className="px-2 py-2 text-center font-semibold text-slate-800">{data.average.toFixed(2)}</td>
                        </tr>
                    )})}
                </tbody></table>
            </div>
        </div>
    );
};
// --- END: Nilai Keseluruhan View ---

// --- START: Main Page Component ---
const DataNilaiPage: React.FC<any> = (props) => {
    const [activeTab, setActiveTab] = useState('keseluruhan');
    const { subjects } = props;
    const activeSubjects = useMemo(() => subjects.filter((s: Subject) => s.active), [subjects]);
    const selectedSubject = useMemo(() => activeSubjects.find((s: Subject) => s.id === activeTab), [activeTab, activeSubjects]);

    const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
    const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-sm";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Nilai</h2>
                <p className="mt-1 text-slate-600">Kelola nilai siswa per mata pelajaran. Pengaturan dapat diakses di halaman Pengaturan.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
                <button onClick={() => setActiveTab('keseluruhan')} className={activeTab === 'keseluruhan' ? activeButtonClass : inactiveButtonClass}>Nilai Keseluruhan</button>
                {activeSubjects.map((subject: Subject) => (
                    <button key={subject.id} onClick={() => setActiveTab(subject.id)} className={activeTab === subject.id ? activeButtonClass : inactiveButtonClass}>{subject.label}</button>
                ))}
            </div>

            <div>
                {activeTab === 'keseluruhan' && <NilaiKeseluruhanView {...props} />}
                {selectedSubject && <SubjectDetailView subject={selectedSubject} {...props} />}
            </div>
        </div>
    );
};
// --- END: Main Page Component ---

export default DataNilaiPage;
