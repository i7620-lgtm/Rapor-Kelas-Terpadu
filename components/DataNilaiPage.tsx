import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// FIX: Import all necessary types from the `types` module.
import { Student, StudentGrade, SubjectKey, LearningObjectives, StudentDescriptions, Subject, DetailedSubjectGrade } from '../types.js';


// Make sure XLSX is available on the window object
declare const XLSX: any;

// Helper function to extract grade number from class name strings like "Kelas 6" or "VI"
const getGradeNumber = (str: string): number | null => {
    if (!str) return null;
    // Check for Arabic numerals (e.g., "6")
    const match = str.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    // Check for Roman numerals (e.g., "VI") - simple check for primary school levels
    const upperStr = str.toUpperCase();
    if (upperStr.includes('VI')) return 6;
    if (upperStr.includes('V')) return 5;
    if (upperStr.includes('IV')) return 4;
    if (upperStr.includes('III')) return 3;
    if (upperStr.includes('II')) return 2;
    if (upperStr.includes('I')) return 1;

    return null;
};

interface DeskripsiNilaiViewProps {
  students: Student[];
  grades: StudentGrade[];
  descriptions: StudentDescriptions;
  onUpdateDescriptions: (descriptions: StudentDescriptions) => void;
  activeSubjects: Subject[];
}

const DeskripsiNilaiView: React.FC<DeskripsiNilaiViewProps> = ({ students, grades, descriptions, onUpdateDescriptions, activeSubjects }) => {
    const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('');
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    useEffect(() => {
        // If current selected subject is not active anymore, reset it
        if (selectedSubject && !activeSubjects.some(s => s.id === selectedSubject)) {
            setSelectedSubject('');
        }
    }, [activeSubjects, selectedSubject]);

    const handleDescriptionChange = (studentId: number, subject: SubjectKey, text: string) => {
        onUpdateDescriptions({
            ...descriptions,
            [studentId]: {
                ...descriptions[studentId],
                [subject]: text,
            }
        });
    };

    const handleGenerate = useCallback(async (student: Student) => {
        const subjectKey = selectedSubject;
        if (!subjectKey) return;

        setIsLoading(prev => ({ ...prev, [student.id]: true }));

        try {
            const studentGradeData = grades.find(g => g.studentId === student.id);
            const grade = studentGradeData?.finalGrades?.[subjectKey];
            const subjectName = activeSubjects.find(s => s.id === subjectKey)?.fullName;

            if (grade === undefined || grade === null) {
                alert(`Nilai untuk ${student.namaLengkap} pada mapel ${subjectName} belum diisi.`);
                return;
            }

            const prompt = `Buatkan deskripsi penilaian rapor singkat dalam satu paragraf untuk siswa bernama ${student.namaLengkap} pada mata pelajaran ${subjectName}. Nilai yang diperoleh adalah ${grade}. Deskripsi harus positif, menyoroti pencapaian siswa, dan menyertakan kalimat motivasi untuk terus belajar. Tulis dalam Bahasa Indonesia.`;
            
            const apiResponse = await fetch('/api/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!apiResponse.ok) {
                throw new Error('Gagal menghubungi server AI.');
            }

            const data = await apiResponse.json();
            const generatedText = data.text;

            onUpdateDescriptions({
                ...descriptions,
                [student.id]: {
                    ...descriptions[student.id],
                    [subjectKey]: generatedText.trim(),
                }
            });

        } catch (error) {
            console.error("Error generating description:", error);
            alert("Gagal menghasilkan deskripsi. Silakan periksa koneksi atau kunci API Anda dan coba lagi.");
        } finally {
            setIsLoading(prev => ({ ...prev, [student.id]: false }));
        }
    }, [selectedSubject, grades, descriptions, onUpdateDescriptions, activeSubjects]);

    const handleGenerateAll = useCallback(async () => {
        if (students.length === 0 || !selectedSubject) return;
        setIsGeneratingAll(true);
        for (const student of students) {
            await handleGenerate(student);
        }
        setIsGeneratingAll(false);
    }, [students, handleGenerate, selectedSubject]);

    useEffect(() => {
        // Clear loading state when subject changes
        setIsLoading({});
    }, [selectedSubject]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                    <label htmlFor="subject-select" className="block text-sm font-medium text-slate-700 mb-1">Pilih Mata Pelajaran</label>
                    <select
                        id="subject-select"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value as SubjectKey)}
                        className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        disabled={activeSubjects.length === 0}
                    >
                        {activeSubjects.length > 0 ? (
                            <>
                                <option value="" disabled>Klik di sini untuk memilih mata pelajaran.</option>
                                {activeSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.fullName}</option>
                                ))}
                            </>
                        ) : <option>Tidak ada mapel aktif</option>}
                    </select>
                </div>
                <button
                    onClick={handleGenerateAll}
                    disabled={isGeneratingAll || students.length === 0 || activeSubjects.length === 0}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {isGeneratingAll ? 'Menghasilkan...' : 'Hasilkan Semua Deskripsi'}
                </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                {students.length > 0 ? (
                    students.map(student => {
                        const grade = grades.find(g => g.studentId === student.id)?.finalGrades?.[selectedSubject];
                        const descriptionText = descriptions[student.id]?.[selectedSubject] || '';
                        return (
                            <div key={student.id} className="p-4 border rounded-lg bg-slate-50/50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-slate-800">{student.namaLengkap}</h4>
                                    <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">Nilai: {grade ?? 'N/A'}</span>
                                </div>
                                <textarea
                                    value={descriptionText}
                                    onChange={(e) => handleDescriptionChange(student.id, selectedSubject, e.target.value)}
                                    placeholder="Deskripsi akan muncul di sini setelah dihasilkan..."
                                    className="w-full p-2 mt-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                                    rows={4}
                                    aria-label={`Deskripsi nilai untuk ${student.namaLengkap}`}
                                />
                                <div className="text-right mt-2">
                                    <button
                                        onClick={() => handleGenerate(student)}
                                        disabled={isLoading[student.id] || isGeneratingAll}
                                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    >
                                        {isLoading[student.id] ? 'Memproses...' : 'Hasilkan'}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <p>Tidak ada siswa yang terdata. Silakan tambahkan siswa di halaman 'Data Siswa'.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

type DataNilaiView = 'NILAI_KESELURUHAN' | 'MAPEL' | 'NILAI_PER_MAPEL' | 'RENTANG' | 'TUJUAN_PEMBELAJARAN' | 'DESKRIPSI' | 'DATA_NILAI';

interface RentangViewProps {
    initialPredikats: { a: string; b: string; c: string };
    onUpdate: (newPredikats: { a: string; b: string; c: string }) => void;
    namaKelas: string;
}

const RentangView: React.FC<RentangViewProps> = ({ initialPredikats, onUpdate, namaKelas }) => {
    const [localPredikats, setLocalPredikats] = useState(initialPredikats);

    useEffect(() => {
        setLocalPredikats(initialPredikats);
    }, [initialPredikats]);

    const handleBlur = () => {
        onUpdate(localPredikats);
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-slate-800">Rentang Nilai</h3>
        <p className="mt-2 text-sm text-slate-600">Masukkan rentang nilai yang sesuai pada kolom berikut. Perubahan akan disimpan secara otomatis.</p>
        
        <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <label htmlFor="predikatA" className="text-sm font-medium text-slate-700 whitespace-nowrap">Predikat A (Mulai dari):</label>
                <input type="number" name="a" id="predikatA" value={localPredikats.a} onChange={(e) => setLocalPredikats(p => ({...p, a: e.target.value}))} onBlur={handleBlur} placeholder="cth. 90" className="w-32 text-center px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
            </div>
            <div className="flex items-center justify-between gap-4">
                <label htmlFor="predikatB" className="text-sm font-medium text-slate-700 whitespace-nowrap">Predikat B (Mulai dari):</label>
                <input type="number" name="b" id="predikatB" value={localPredikats.b} onChange={(e) => setLocalPredikats(p => ({...p, b: e.target.value}))} onBlur={handleBlur} placeholder="cth. 80" className="w-32 text-center px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
            </div>
             <div className="flex items-center justify-between gap-4">
                <label htmlFor="predikatC" className="text-sm font-medium text-slate-700 whitespace-nowrap">Predikat C (Mulai dari):</label>
                <div className="flex flex-col items-end">
                    <input type="number" name="c" id="predikatC" value={localPredikats.c} onChange={(e) => setLocalPredikats(p => ({...p, c: e.target.value}))} onBlur={handleBlur} placeholder="cth. 70" className="w-32 text-center px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
                    <p className="text-xs text-slate-500 mt-1">Nilai di bawah ini akan ditandai.</p>
                </div>
            </div>
        </div>
      </div>
    );
};

interface TujuanPembelajaranViewProps {
  objectives: LearningObjectives;
  onUpdate: (newObjectives: LearningObjectives) => void;
  activeSubjects: Subject[];
  namaKelas: string;
}

const TujuanPembelajaranView: React.FC<TujuanPembelajaranViewProps> = ({ objectives, onUpdate, activeSubjects, namaKelas }) => {
    const objectivesForCurrentClass = useMemo(() => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) {
            return {};
        }

        // Find the matching grade key in the objectives object (e.g., "Kelas 6")
        for (const key in objectives) {
            if (getGradeNumber(key) === currentGradeNumber) {
                return objectives[key];
            }
        }

        return {};
    }, [objectives, namaKelas]);

    const [selectedSubject, setSelectedSubject] = useState<string>('');

    useEffect(() => {
        if (selectedSubject && !activeSubjects.some(s => s.fullName === selectedSubject)) {
            setSelectedSubject('');
        }
    }, [activeSubjects, selectedSubject]);

    const currentObjectives = selectedSubject ? (objectivesForCurrentClass[selectedSubject] || []) : [];

    const handleUpdateObjectivesForClass = (newObjectivesForClass: { [subject: string]: string[] }) => {
        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return;

        let gradeKey = '';
        for (const key in objectives) {
            if (getGradeNumber(key) === currentGradeNumber) {
                gradeKey = key;
                break;
            }
        }
        if (!gradeKey) {
            gradeKey = `Kelas ${currentGradeNumber}`;
        }

        onUpdate({
            ...objectives,
            [gradeKey]: newObjectivesForClass,
        });
    };

    const handleObjectiveChange = (index: number, value: string) => {
        if (!selectedSubject) return;
        const newObjectivesForSubject = [...currentObjectives];
        newObjectivesForSubject[index] = value;
        handleUpdateObjectivesForClass({
            ...objectivesForCurrentClass,
            [selectedSubject]: newObjectivesForSubject,
        });
    };

    const handleAddObjective = () => {
        if (!selectedSubject) return;
        const newObjectivesForSubject = [...currentObjectives, ''];
        handleUpdateObjectivesForClass({
            ...objectivesForCurrentClass,
            [selectedSubject]: newObjectivesForSubject,
        });
    };

    const handleDeleteObjective = (index: number) => {
        if (!selectedSubject) return;
        if (!window.confirm("Apakah Anda yakin ingin menghapus tujuan pembelajaran ini?")) return;
        
        const newObjectivesForSubject = currentObjectives.filter((_, i) => i !== index);
        
        handleUpdateObjectivesForClass({
            ...objectivesForCurrentClass,
            [selectedSubject]: newObjectivesForSubject,
        });
    };

    if (!namaKelas) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center">
                <p className="text-slate-600">Harap atur "Nama Kelas" di halaman Pengaturan terlebih dahulu untuk mengelola Tujuan Pembelajaran.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
            <div>
                <label htmlFor="subject-select-tp" className="block text-sm font-medium text-slate-700 mb-1">Pilih Mata Pelajaran untuk {namaKelas}</label>
                <select
                    id="subject-select-tp"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                    disabled={activeSubjects.length === 0}
                >
                    {activeSubjects.length > 0 ? (
                        <>
                            <option value="" disabled>Klik di sini untuk memilih mata pelajaran.</option>
                            {activeSubjects.map(subject => (
                                <option key={subject.id} value={subject.fullName}>{subject.fullName}</option>
                            ))}
                        </>
                    ) : <option>Tidak ada mapel aktif</option>}
                </select>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                {selectedSubject ? (
                    currentObjectives.length > 0 ? (
                        currentObjectives.map((objective, index) => (
                            <div key={`${objective}-${index}`} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">{index + 1}.</span>
                                <input
                                    type="text"
                                    value={objective}
                                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                                    placeholder={`Tujuan Pembelajaran ${index + 1}`}
                                    className="flex-grow p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                                    aria-label={`Tujuan Pembelajaran ${index + 1}`}
                                />
                                <button
                                    onClick={() => handleDeleteObjective(index)}
                                    className="flex items-center justify-center h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                    aria-label={`Hapus Tujuan Pembelajaran ${index + 1}`}
                                >
                                    <span className="font-bold text-lg">×</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            <p>Belum ada tujuan pembelajaran untuk mata pelajaran ini.</p>
                            <p>Klik tombol di bawah untuk menambahkan.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <p>Pilih mata pelajaran dari daftar di atas untuk melihat atau menambahkan tujuan pembelajaran.</p>
                    </div>
                )}
            </div>
            
            <div>
                <button
                    onClick={handleAddObjective}
                    disabled={!selectedSubject}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    + Tujuan Pembelajaran
                </button>
            </div>
        </div>
    );
};

interface NilaiPerMapelViewProps {
  students: Student[];
  grades: StudentGrade[];
  onUpdateDetailedGrade: (
    studentId: number,
    subject: SubjectKey,
    type: 'tp' | 'sts' | 'sas',
    value: number | null,
    tpIndex?: number
  ) => void;
  activeSubjects: Subject[];
  learningObjectives: LearningObjectives;
  namaKelas: string;
}

const NilaiPerMapelView: React.FC<NilaiPerMapelViewProps> = ({ students, grades, onUpdateDetailedGrade, activeSubjects, learningObjectives, namaKelas }) => {
    const [selectedSubject, setSelectedSubject] = useState<SubjectKey | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<{ index: number; rect: DOMRect } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (!target.closest('.tp-header-button')) {
            setActiveTooltip(null);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, []);

    const learningObjectivesForSelectedSubject = useMemo(() => {
        if (!selectedSubject || !namaKelas) return [];

        const currentGradeNumber = getGradeNumber(namaKelas);
        if (currentGradeNumber === null) return [];

        let gradeKey = '';
        for (const key in learningObjectives) {
            if (getGradeNumber(key) === currentGradeNumber) {
                gradeKey = key;
                break;
            }
        }
        if (!gradeKey) return [];

        const subjectFullName = activeSubjects.find(s => s.id === selectedSubject)?.fullName;
        if (!subjectFullName) return [];

        return learningObjectives[gradeKey]?.[subjectFullName] || [];
    }, [selectedSubject, namaKelas, learningObjectives, activeSubjects]);
    
    const numberOfTps = learningObjectivesForSelectedSubject.length;

    const handleGradeChange = (studentId: number, type: 'tp' | 'sts' | 'sas', value: string, tpIndex?: number) => {
        if (!selectedSubject) return;
        const numericValue = value === '' ? null : parseInt(value, 10);
        if (value === '' || (numericValue !== null && !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
            onUpdateDetailedGrade(studentId, selectedSubject, type, numericValue, tpIndex);
        }
    };

    const calculateFinalGrade = useCallback((studentId: number): string => {
        if (!selectedSubject) return 'N/A';
        
        const studentGrade = grades.find(g => g.studentId === studentId);
        const detailedGrade = studentGrade?.detailedGrades?.[selectedSubject];

        if (!detailedGrade) return '0';

        const tpsToConsider = (detailedGrade.tp || []).slice(0, numberOfTps);
        const validTps = tpsToConsider.filter(t => typeof t === 'number') as number[] || [];
        const averageTp = validTps.length > 0 ? validTps.reduce((a, b) => a + b, 0) / validTps.length : 0;
        const sts = detailedGrade.sts ?? 0;
        const sas = detailedGrade.sas ?? 0;
        
        const finalGrade = (averageTp + sts + sas) / 3;

        return isNaN(finalGrade) ? '0' : Math.round(finalGrade).toString();
    }, [grades, selectedSubject, numberOfTps]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
            <div>
                <label htmlFor="subject-select-npm" className="block text-sm font-medium text-slate-700 mb-1">Pilih Mata Pelajaran</label>
                <select
                    id="subject-select-npm"
                    value={selectedSubject ?? ''}
                    onChange={e => setSelectedSubject(e.target.value as SubjectKey)}
                    className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                >
                    <option value="" disabled>Klik di sini untuk memilih mata pelajaran.</option>
                    {activeSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.fullName}</option>
                    ))}
                </select>
            </div>

            {selectedSubject && (
                 <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-3 py-3 w-10 text-center">No</th>
                                    <th scope="col" className="px-6 py-3 min-w-[200px]">Nama Siswa</th>
                                    {Array.from({ length: numberOfTps }).map((_, i) => (
                                        <th key={i} scope="col" className="px-2 py-3 w-20 text-center tp-header">
                                            <button
                                                type="button"
                                                className="tp-header-button"
                                                onClick={(e) => {
                                                    if (activeTooltip?.index === i) {
                                                        setActiveTooltip(null);
                                                    } else {
                                                        setActiveTooltip({ index: i, rect: e.currentTarget.getBoundingClientRect() });
                                                    }
                                                }}
                                                aria-describedby={`tooltip-${i}`}
                                            >
                                                {`TP ${i + 1}`}
                                            </button>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-2 py-3 w-20 text-center">STS</th>
                                    <th scope="col" className="px-2 py-3 w-20 text-center">SAS</th>
                                    <th scope="col" className="px-2 py-3 w-24 text-center">Nilai Akhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    const studentGrade = grades.find(g => g.studentId === student.id);
                                    const detailedGrade = studentGrade?.detailedGrades?.[selectedSubject];
                                    const finalGrade = calculateFinalGrade(student.id);

                                    return (
                                    <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-3 py-2 text-center font-medium">{index + 1}</td>
                                        <th scope="row" className="px-6 py-2 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                        {Array.from({ length: numberOfTps }).map((_, i) => (
                                            <td key={i} className="px-2 py-1">
                                                <input
                                                    type="number" min="0" max="100"
                                                    value={detailedGrade?.tp?.[i] ?? ''}
                                                    onChange={(e) => handleGradeChange(student.id, 'tp', e.target.value, i)}
                                                    className="w-16 p-2 text-center bg-slate-50 border border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                    aria-label={`TP ${i+1} untuk ${student.namaLengkap}`}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-2 py-1">
                                            <input
                                                type="number" min="0" max="100"
                                                value={detailedGrade?.sts ?? ''}
                                                onChange={(e) => handleGradeChange(student.id, 'sts', e.target.value)}
                                                className="w-16 p-2 text-center bg-slate-50 border border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                aria-label={`STS untuk ${student.namaLengkap}`}
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            <input
                                                type="number" min="0" max="100"
                                                value={detailedGrade?.sas ?? ''}
                                                onChange={(e) => handleGradeChange(student.id, 'sas', e.target.value)}
                                                className="w-16 p-2 text-center bg-slate-50 border border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                aria-label={`SAS untuk ${student.namaLengkap}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center font-semibold text-slate-800">{finalGrade}</td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    {activeTooltip !== null && (
                        <div
                            role="tooltip"
                            className="tp-tooltip"
                            style={{
                                position: 'fixed',
                                top: `${activeTooltip.rect.top}px`,
                                left: `${activeTooltip.rect.left + activeTooltip.rect.width / 2}px`,
                                transform: 'translate(-50%, -100%) translateY(-8px)',
                            }}
                        >
                            {learningObjectivesForSelectedSubject[activeTooltip.index] || 'Tujuan Pembelajaran tidak ditemukan.'}
                            <div
                                style={{
                                    content: '""',
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    marginLeft: '-5px',
                                    borderWidth: '5px',
                                    borderStyle: 'solid',
                                    borderColor: '#1f2937 transparent transparent transparent'
                                }}
                            ></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

interface MapelViewProps {
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
}

const MapelView: React.FC<MapelViewProps> = ({ subjects, onUpdateSubjects }) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectLabel, setNewSubjectLabel] = useState('');

    const activeSubjects = subjects.filter(s => s.active);
    const inactiveSubjects = subjects.filter(s => !s.active);

    const handleToggle = (subjectId: string) => {
        onUpdateSubjects(subjects.map(s => s.id === subjectId ? { ...s, active: !s.active } : s));
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim() || !newSubjectLabel.trim()) {
            alert("Nama mata pelajaran dan singkatan tidak boleh kosong.");
            return;
        }
        const newId = newSubjectLabel.trim().toUpperCase().replace(/\s+/g, '');
        if (subjects.some(s => s.id === newId)) {
            alert("Singkatan mata pelajaran sudah ada. Harap gunakan singkatan yang unik.");
            return;
        }

        const newSubject: Subject = {
            id: newId,
            fullName: newSubjectName.trim(),
            label: newSubjectLabel.trim(),
            active: true
        };

        onUpdateSubjects([...subjects, newSubject]);
        setNewSubjectName('');
        setNewSubjectLabel('');
    };

    const SubjectItem: React.FC<{subject: Subject}> = ({ subject }) => (
        <div 
            onClick={() => handleToggle(subject.id)}
            className="p-3 border border-slate-300 bg-white rounded-md shadow-sm cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
            title={`Klik untuk memindahkan`}
        >
            <p className="font-medium text-slate-800">{subject.fullName}</p>
            <p className="text-sm text-slate-500">Singkatan: {subject.label}</p>
        </div>
    );
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Mata Pelajaran Aktif</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {activeSubjects.length > 0 ? activeSubjects.map(s => <SubjectItem key={s.id} subject={s} />) : <p className="text-slate-500 text-sm">Tidak ada mata pelajaran aktif.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Mata Pelajaran Tidak Aktif</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {inactiveSubjects.length > 0 ? inactiveSubjects.map(s => <SubjectItem key={s.id} subject={s} />) : <p className="text-slate-500 text-sm">Tidak ada mata pelajaran tidak aktif.</p>}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Tambah Mata Pelajaran Baru</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 w-full">
                        <label htmlFor="new-subject-name" className="block text-sm font-medium text-slate-700 mb-1">Nama Mata Pelajaran</label>
                        <input
                            type="text"
                            id="new-subject-name"
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                            placeholder="Contoh: Bahasa Sunda"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label htmlFor="new-subject-label" className="block text-sm font-medium text-slate-700 mb-1">Singkatan (ID Unik)</label>
                        <input
                            type="text"
                            id="new-subject-label"
                            value={newSubjectLabel}
                            onChange={e => setNewSubjectLabel(e.target.value)}
                            placeholder="Contoh: BSunda"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        />
                    </div>
                    <button
                        onClick={handleAddSubject}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DataNilaiPageProps {
  students: Student[];
  grades: StudentGrade[];
  namaKelas: string;
  onUpdateGrade: (studentId: number, subject: SubjectKey, value: number | null) => void;
  onUpdateDetailedGrade: (
    studentId: number,
    subject: SubjectKey,
    type: 'tp' | 'sts' | 'sas',
    value: number | null,
    tpIndex?: number
  ) => void;
  onBulkUpdateGrades: (newGrades: StudentGrade[]) => void;
  learningObjectives: LearningObjectives;
  onUpdateLearningObjectives: (objectives: LearningObjectives) => void;
  studentDescriptions: StudentDescriptions;
  onUpdateStudentDescriptions: (descriptions: StudentDescriptions) => void;
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

// FIX: Define a type for the processed student data to help TypeScript with inference.
type ProcessedStudent = Student & {
    no: number;
    grades: Record<string, any>;
    total: number;
    average: number;
    rank: number | string;
};

const DataNilaiPage: React.FC<DataNilaiPageProps> = ({ students, grades, namaKelas, onUpdateDetailedGrade, onBulkUpdateGrades, learningObjectives, onUpdateLearningObjectives, studentDescriptions, onUpdateStudentDescriptions, subjects, onUpdateSubjects, showToast }) => {
  const [activeView, setActiveView] = useState<DataNilaiView>('NILAI_KESELURUHAN');
  const [sortBy, setSortBy] = useState<'no' | 'rank'>('no');
  const [predikats, setPredikats] = useState({ a: '90', b: '80', c: '70' });
  const [uploadType, setUploadType] = useState<'tujuan' | 'nilai'>('nilai');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeSubjects = useMemo(() => subjects.filter(s => s.active), [subjects]);

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
        } else {
            finalDisplaySubjects.push(subject);
        }
    }
    
    const sortOrder: Record<string, number> = {
        'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5,
        'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9
    };

    // FIX: Add explicit types for sort callback parameters to ensure correct type inference.
    finalDisplaySubjects.sort((a: Subject, b: Subject) => {
        const orderA = sortOrder[a.id] || 99;
        const orderB = sortOrder[b.id] || 99;
        return orderA - orderB;
    });

    return finalDisplaySubjects;
  }, [activeSubjects]);

  const processedData = useMemo(() => {
    // FIX: Add explicit type for `student` to ensure properties like `id` are accessible.
    const dataWithCalculations: Omit<ProcessedStudent, 'rank'>[] = students.map((student: Student, index) => {
      const studentGrades = grades.find(g => g.studentId === student.id) || { studentId: student.id, finalGrades: {} };
      
      const displayGrades: Record<string, any> = {};
      let total = 0;
      let subjectCount = 0;

      displaySubjects.forEach(displaySubject => {
          let grade: number | null | undefined = undefined;

          if (['PABP', 'SB', 'Mulok'].includes(displaySubject.id)) {
              const memberSubjects = activeSubjects.filter(s => s.fullName.startsWith(displaySubject.fullName));
              for (const member of memberSubjects) {
                  const memberGrade = studentGrades.finalGrades?.[member.id];
                  if (memberGrade !== undefined && memberGrade !== null) {
                      grade = memberGrade;
                      break;
                  }
              }
          } else {
              grade = studentGrades.finalGrades?.[displaySubject.id];
          }

          displayGrades[displaySubject.id] = grade;

          if (typeof grade === 'number') {
              total += grade;
              subjectCount++;
          }
      });
      
      const average = subjectCount > 0 ? total / subjectCount : 0;
      
      return {
        ...student,
        no: index + 1,
        grades: displayGrades,
        total,
        average,
      };
    });

    const sortedByTotal = [...dataWithCalculations].sort((a, b) => b.total - a.total);
    // FIX: Correctly calculate rank by using reduce to access previously calculated ranks.
    const rankedData = sortedByTotal.reduce<(Omit<ProcessedStudent, 'rank'> & { rank: string | number })[]>((acc, student: Omit<ProcessedStudent, 'rank'>, index) => {
        let rank;
        if (index > 0 && student.total === sortedByTotal[index - 1].total) {
            rank = acc[index - 1].rank;
        } else {
            rank = index + 1;
        }
        acc.push({ ...student, rank: student.total > 0 ? rank : '-' });
        return acc;
    }, []);

    const dataWithRanks: ProcessedStudent[] = dataWithCalculations.map((d: Omit<ProcessedStudent, 'rank'>) => {
      const studentWithRank = rankedData.find(s => s.id === d.id);
      return { ...d, rank: studentWithRank?.rank || '-' };
    });

    // FIX: Add explicit types for sort callback parameters to ensure correct type inference.
    if (sortBy === 'rank') {
      return dataWithRanks.sort((a: ProcessedStudent, b: ProcessedStudent) => {
        if (a.rank === '-') return 1;
        if (b.rank === '-') return -1;
        if ((a.rank as number) < (b.rank as number)) return -1;
        if ((a.rank as number) > (b.rank as number)) return 1;
        return a.no - b.no;
      });
    }
    
    // FIX: Add explicit types for sort callback parameters to ensure correct type inference.
    return dataWithRanks.sort((a: ProcessedStudent, b: ProcessedStudent) => a.no - b.no);
  }, [students, grades, sortBy, activeSubjects, displaySubjects]);
  
  const handleExportTemplate = useCallback(() => {
    if (typeof XLSX === 'undefined') {
        alert('Gagal memuat pustaka ekspor. Silakan coba lagi.');
        return;
    }
    const wb = XLSX.utils.book_new();
    const MAX_TPS = 5;

    // Instructions Sheet
    const petunjukData = [
        ["Petunjuk Pengisian Template RKT"],
        [],
        ["Sheet", "Keterangan"],
        ["Nilai Keseluruhan", "Halaman ini bersifat HANYA BACA (read-only). Nilai di sini adalah rekapitulasi dari sheet Nilai per Mapel."],
        ["Daftar Mapel", "Halaman referensi yang berisi daftar semua mata pelajaran dan statusnya (Aktif/Tidak Aktif)."],
        ["Nilai [Nama Mapel]", "Gunakan sheet ini untuk memasukkan nilai TP, STS, dan SAS untuk setiap siswa per mata pelajaran yang aktif."],
        ["Rentang Nilai", "Atur nilai minimum untuk setiap predikat (A, B, C)."],
        ["Tujuan Pembelajaran", "Isi daftar Tujuan Pembelajaran (TP) untuk setiap mata pelajaran."],
        ["Deskripsi Rapor", "Isi atau sunting deskripsi capaian siswa untuk rapor."],
        [],
        ["PENTING:", "Pastikan nama siswa dan nama sheet tidak diubah agar proses impor berjalan lancar."]
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
    wsPetunjuk['!cols'] = [{ wch: 20 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

    // Sheet 1: Nilai Keseluruhan (Read-only summary)
    const nilaiKeseluruhanData = processedData.map(d => {
        const row: any = { "No": d.no, "Nama Siswa": d.namaLengkap };
        displaySubjects.forEach(subject => { row[subject.label] = d.grades[subject.id] ?? ''; });
        row["Jumlah"] = d.total;
        row["Rata-rata"] = parseFloat(d.average.toFixed(2));
        row["Peringkat"] = d.rank;
        return row;
    });
    const wsNilaiKeseluruhan = XLSX.utils.json_to_sheet(nilaiKeseluruhanData);
    wsNilaiKeseluruhan['!cols'] = [ { wch: 5 }, { wch: 30 }, ...displaySubjects.map(() => ({ wch: 8 })), { wch: 10 }, { wch: 10 }, { wch: 10 } ];
    XLSX.utils.book_append_sheet(wb, wsNilaiKeseluruhan, "Nilai Keseluruhan");

    // Sheet 2: Daftar Mapel (Reference)
// FIX: Explicitly type `subject` to resolve property access errors.
    const mapelData = subjects.map((subject: Subject, index) => ({
        "No": index + 1,
        "Nama Mata Pelajaran": subject.fullName,
        "Singkatan (ID)": subject.id,
        "Status": subject.active ? 'Aktif' : 'Tidak Aktif'
    }));
    const wsMapel = XLSX.utils.json_to_sheet(mapelData);
    wsMapel['!cols'] = [{ wch: 5 }, { wch: 45 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMapel, "Daftar Mapel");
    
    // Sheet 3+: Nilai per Mapel (for Data Entry)
// FIX: Explicitly type `subject` to resolve property access errors.
    activeSubjects.forEach((subject: Subject) => {
// FIX: Explicitly type `student` to resolve property access errors.
        const perMapelData = students.map((student: Student, index) => {
            const gradeData = grades.find(g => g.studentId === student.id);
            const detailedGrade = gradeData?.detailedGrades?.[subject.id];
            const row: any = { "No": index + 1, "Nama Siswa": student.namaLengkap };
            for (let i = 0; i < MAX_TPS; i++) { row[`TP ${i + 1}`] = detailedGrade?.tp?.[i] ?? ''; }
            row["STS"] = detailedGrade?.sts ?? '';
            row["SAS"] = detailedGrade?.sas ?? '';
            return row;
        });
        const safeSheetName = `Nilai ${subject.label}`.substring(0, 31);
        const wsPerMapel = XLSX.utils.json_to_sheet(perMapelData);
        wsPerMapel['!cols'] = [ { wch: 5 }, { wch: 30 }, ...Array(MAX_TPS).fill({ wch: 8 }), { wch: 8 }, { wch: 8 } ];
        XLSX.utils.book_append_sheet(wb, wsPerMapel, safeSheetName);
    });

    // Sheet 4: Rentang Nilai
    const rentangData = [ ["Predikat", "Nilai Minimum"], ["A", predikats.a], ["B", predikats.b], ["C", predikats.c] ];
    const wsRentang = XLSX.utils.aoa_to_sheet(rentangData);
    wsRentang['!cols'] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsRentang, "Rentang Nilai");
    
    // Sheet 5: Tujuan Pembelajaran
    const currentGradeNumber = getGradeNumber(namaKelas);
    let objectivesForCurrentClass: { [subject: string]: string[] } = {};
    if (currentGradeNumber !== null) {
        for (const key in learningObjectives) {
            if (getGradeNumber(key) === currentGradeNumber) {
                objectivesForCurrentClass = learningObjectives[key];
                break;
            }
        }
    }
    const subjectsForObjectives = activeSubjects.filter(s => (objectivesForCurrentClass as any)[s.fullName]);
    const maxObjectives = subjectsForObjectives.reduce((max, subject) => {
        const objectivesForSubject = objectivesForCurrentClass[subject.fullName] || [];
        return Math.max(max, objectivesForSubject.length);
    }, 5);
    const tpHeaders = ["No", "Nama Mapel", ...Array.from({ length: maxObjectives }, (_, i) => `TP ${i + 1}`)];
    const tpData = subjectsForObjectives.map((subject, index) => {
        const objectivesForSubject = objectivesForCurrentClass[subject.fullName] || [];
        const rowData: (string | number)[] = [index + 1, subject.fullName];
        for (let i = 0; i < maxObjectives; i++) { rowData.push(objectivesForSubject[i] || ''); }
        return rowData;
    });
    const wsTujuan = XLSX.utils.aoa_to_sheet([tpHeaders, ...tpData]);
    wsTujuan['!cols'] = [{ wch: 5 }, { wch: 45 }, ...Array(maxObjectives).fill({ wch: 40 })];
    XLSX.utils.book_append_sheet(wb, wsTujuan, "Tujuan Pembelajaran");
    
    // Sheet 6: Deskripsi Rapor
// FIX: Explicitly type `s` to resolve property access errors.
    const deskripsiHeaders = ["No", "Nama Siswa", ...activeSubjects.map((s: Subject) => `Deskripsi ${s.fullName}`)];
// FIX: Explicitly type `student` to resolve property access errors.
    const deskripsiData = students.map((student: Student, index) => {
        const row: (string | number)[] = [index + 1, student.namaLengkap];
// FIX: Explicitly type `subject` to resolve property access errors.
        activeSubjects.forEach((subject: Subject) => {
            const description = studentDescriptions[student.id]?.[subject.id] || '';
            row.push(description);
        });
        return row;
    });
    const wsDeskripsi = XLSX.utils.aoa_to_sheet([deskripsiHeaders, ...deskripsiData]);
    wsDeskripsi['!cols'] = [{ wch: 5 }, { wch: 30 }, ...activeSubjects.map(() => ({ wch: 40 }))];
    XLSX.utils.book_append_sheet(wb, wsDeskripsi, "Deskripsi Rapor");

    XLSX.writeFile(wb, "Template_Lengkap_RKT.xlsx");
  }, [processedData, students, grades, subjects, activeSubjects, displaySubjects, predikats, learningObjectives, studentDescriptions, namaKelas]);

  const handleUpdatePredikats = (newPredikats: { a: string; b: string; c: string }) => {
    setPredikats(newPredikats);
  };

  const triggerFileUpload = (type: 'tujuan' | 'nilai') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            if (uploadType === 'nilai') {
// FIX: Explicitly type `updatedGrades` to avoid downstream type errors.
                const updatedGrades: StudentGrade[] = JSON.parse(JSON.stringify(grades));
                const studentMap = new Map(students.map(s => [s.namaLengkap.trim().toLowerCase(), s]));
                const subjectMap = new Map(subjects.map(s => [s.label, s]));
                let importedSheets = 0;
                const MAX_TPS = 5;

                workbook.SheetNames.forEach(sheetName => {
                    if (sheetName.startsWith("Nilai ")) {
                        const subjectLabel = sheetName.substring(6);
                        const subject = subjectMap.get(subjectLabel);
                        if (!subject) {
                            console.warn(`Sheet "${sheetName}" skipped: subject label "${subjectLabel}" not found.`);
                            return;
                        }
                        
                        importedSheets++;
                        const worksheet = workbook.Sheets[sheetName];
                        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

// FIX: Explicitly type `row` to avoid type errors on property access.
                        json.forEach((row: any) => {
                            const studentName = row['Nama Siswa']?.trim().toLowerCase();
                            const student = studentMap.get(studentName);
                            if (!student) return;

                            let studentGrade = updatedGrades.find((g: StudentGrade) => g.studentId === student.id);
                            if (!studentGrade) {
                                studentGrade = { studentId: student.id, detailedGrades: {}, finalGrades: {} };
                                updatedGrades.push(studentGrade);
                            }
                            studentGrade.detailedGrades = studentGrade.detailedGrades || {};
                            
                            const tpValues: (number | null)[] = [];
                            let hasTp = false;
                            for (let i = 1; i <= MAX_TPS; i++) {
                                const val = row[`TP ${i}`];
                                if (val !== undefined && val !== null && val !== '') {
                                    hasTp = true;
                                    tpValues.push(Number(val));
                                } else {
                                    tpValues.push(null);
                                }
                            }
                            
                            const stsValue = row['STS'];
                            const sasValue = row['SAS'];

                            const newDetailedGrade: DetailedSubjectGrade = {
                                tp: studentGrade.detailedGrades[subject.id]?.tp || [],
                                sts: studentGrade.detailedGrades[subject.id]?.sts || null,
                                sas: studentGrade.detailedGrades[subject.id]?.sas || null,
                            };
                            
                            if (hasTp) newDetailedGrade.tp = tpValues;
                            if (stsValue !== undefined && stsValue !== null && stsValue !== '') newDetailedGrade.sts = Number(stsValue);
                            if (sasValue !== undefined && sasValue !== null && sasValue !== '') newDetailedGrade.sas = Number(sasValue);
                            
                            studentGrade.detailedGrades[subject.id] = newDetailedGrade;

                            const validTps = (newDetailedGrade.tp || []).filter(t => typeof t === 'number') as number[];
                            const averageTp = validTps.length > 0 ? validTps.reduce((a, b) => a + b, 0) / validTps.length : 0;
                            const sts = newDetailedGrade.sts ?? 0;
                            const sas = newDetailedGrade.sas ?? 0;
                            const finalGrade = (averageTp + sts + sas) / 3;
                            studentGrade.finalGrades = studentGrade.finalGrades || {};
                            studentGrade.finalGrades[subject.id] = isNaN(finalGrade) ? null : Math.round(finalGrade);
                        });
                    }
                });

                if (importedSheets > 0) {
                    onBulkUpdateGrades(updatedGrades);
                    showToast(`${importedSheets} sheet nilai berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada sheet nilai yang valid ditemukan.', 'error');
                }
            } else if (uploadType === 'tujuan') {
                showToast('Fitur impor Tujuan Pembelajaran sedang dikembangkan.', 'error');
            }
        } catch (error) {
            console.error('Error processing Excel file:', error);
            showToast('Terjadi kesalahan saat memproses file Excel.', 'error');
        } finally {
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };
  
  const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
  const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-700 border border-indigo-700 rounded-lg shadow-sm";

  const buttons: { id: DataNilaiView; label: string }[] = [
    { id: 'NILAI_KESELURUHAN', label: 'Nilai Keseluruhan' },
    { id: 'MAPEL', label: 'Mapel' },
    { id: 'NILAI_PER_MAPEL', label: 'Nilai per Mapel' },
    { id: 'RENTANG', label: 'Rentang' },
    { id: 'TUJUAN_PEMBELAJARAN', label: 'Tujuan Pembelajaran' },
    { id: 'DESKRIPSI', label: 'Deskripsi' },
    { id: 'DATA_NILAI', label: 'Unduh/Unggah Data' },
  ];

  const renderContent = () => {
    switch(activeView) {
      case 'NILAI_KESELURUHAN':
        return (
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-700 mr-4">Urutkan:</span>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="sort" value="no" checked={sortBy === 'no'} onChange={() => setSortBy('no')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" aria-label="Urutkan berdasarkan Nomor Absen"/>
                            <span className="ml-2 text-sm text-slate-600">No. Absen</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="sort" value="rank" checked={sortBy === 'rank'} onChange={() => setSortBy('rank')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" aria-label="Urutkan berdasarkan Peringkat"/>
                            <span className="ml-2 text-sm text-slate-600">Peringkat</span>
                        </label>
                    </div>
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th scope="col" className="px-3 py-3 w-10 text-center">{sortBy === 'rank' ? 'Peringkat' : 'No'}</th>
                      <th scope="col" className="px-6 py-3 min-w-[200px]">Nama Siswa</th>
                      {displaySubjects.map(subject => (
                        <th key={subject.id} scope="col" className="px-2 py-3 w-20 text-center" title={subject.fullName}>{subject.label}</th>
                      ))}
                      <th scope="col" className="px-2 py-3 w-20 text-center">Jumlah</th>
                      <th scope="col" className="px-2 py-3 w-20 text-center">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.length > 0 ? (
                      processedData.map((data) => (
                        <tr key={data.id} className="bg-white border-b hover:bg-slate-50">
                          <td className="px-3 py-2 text-center font-medium">{sortBy === 'rank' ? data.rank : data.no}</td>
                          <th scope="row" className="px-6 py-2 font-medium text-slate-900 whitespace-nowrap">{data.namaLengkap}</th>
                          {displaySubjects.map(subject => {
                              const grade = data.grades[subject.id];
                              const predicateCValue = parseInt(predikats.c, 10);
                              const isBelowC = !isNaN(predicateCValue) && typeof grade === 'number' && grade < predicateCValue;
                              return (
                                <td key={subject.id} className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={grade ?? ''}
                                    readOnly
                                    className={`w-16 p-2 text-center bg-slate-100 border-slate-200 rounded-md text-slate-700 cursor-not-allowed ${isBelowC ? 'text-red-600 font-bold' : ''}`}
                                    aria-label={`Nilai ${subject.label} untuk ${data.namaLengkap}`}
                                  />
                                </td>
                              );
                          })}
                          <td className="px-2 py-2 text-center font-semibold text-slate-800">{data.total}</td>
                          <td className="px-2 py-2 text-center font-semibold text-slate-800">{data.average.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={displaySubjects.length + 4} className="text-center py-10 text-slate-500">
                          Belum ada data siswa. Silakan tambahkan siswa di halaman 'Data Siswa'.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        );
      case 'DESKRIPSI':
        return <DeskripsiNilaiView 
                    students={students} 
                    grades={grades} 
                    descriptions={studentDescriptions} 
                    onUpdateDescriptions={onUpdateStudentDescriptions} 
                    activeSubjects={activeSubjects}
                />;
      case 'MAPEL':
        return <MapelView subjects={subjects} onUpdateSubjects={onUpdateSubjects} />;
      case 'NILAI_PER_MAPEL':
        return <NilaiPerMapelView
                    students={students}
                    grades={grades}
                    onUpdateDetailedGrade={onUpdateDetailedGrade}
                    activeSubjects={activeSubjects}
                    learningObjectives={learningObjectives}
                    namaKelas={namaKelas}
                />;
      case 'RENTANG': {
        return <RentangView initialPredikats={predikats} onUpdate={handleUpdatePredikats} namaKelas={namaKelas} />;
      }
      case 'TUJUAN_PEMBELAJARAN':
        return <TujuanPembelajaranView objectives={learningObjectives} onUpdate={onUpdateLearningObjectives} activeSubjects={activeSubjects} namaKelas={namaKelas} />;
      case 'DATA_NILAI':
        return (
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Data</h3>
            <p className="text-sm text-slate-500 mt-1">Unduh template lengkap yang berisi sheet untuk Nilai, Tujuan Pembelajaran, Deskripsi, dan Rentang. Atau unggah file Excel untuk mengimpor nilai.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={handleExportTemplate} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unduh Template Lengkap
                </button>
                <button onClick={() => triggerFileUpload('nilai')} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unggah Data Nilai
                </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
      />
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Data Nilai</h2>
        </div>
      </div>
      
       <div className="flex flex-wrap items-center gap-2">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => setActiveView(button.id)}
            className={activeView === button.id ? activeButtonClass : inactiveButtonClass}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default DataNilaiPage;
