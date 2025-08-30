import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { GradeData } from '../types';

const getFinalScore = (scoreData: GradeData | undefined) => {
    if (!scoreData) return null;
    const { cp, pts, pas } = scoreData;
    const allScores = [...(cp || []), pts, pas];
    // Fix: Removed incorrect comparison of score (number | null) to an empty string.
    const numericScores = allScores.map(s => (s === null || s === undefined ? NaN : Number(s))).filter(s => !isNaN(s));
    if (numericScores.length === 0) return null;
    return Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length);
};

export const DashboardView = () => {
    const { state } = useAppContext();
    const { settings, students, grades } = state;

    const passingGrade = settings.gradeRanges.C || 70;
    const lowScorers = students.map(student => {
        const studentGrades = grades[student.id] || {};
        const lowScores = Object.entries(studentGrades)
            .map(([subject, scoreObject]) => ({ subject, score: getFinalScore(scoreObject) }))
            .filter(({ score }) => score !== null && score < passingGrade);
        return { name: student.name, nisn: student.nisn, scores: lowScores };
    }).filter(s => s.scores.length > 0);
    
    const renderAnalysis = () => {
        if (students.length === 0) {
            return <p className="text-center text-gray-500 py-4">Belum ada data siswa.</p>;
        }
        if (lowScorers.length > 0) {
            return (
                <>
                    <h4 className="font-semibold text-red-600 mb-3">Siswa dengan Nilai di Bawah KKM ({passingGrade})</h4>
                    <ul className="space-y-3">
                        {lowScorers.map(student => (
                            <li key={student.nisn} className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="font-bold">{student.name} (NISN: {student.nisn || '-'})</p>
                                <ul className="list-disc list-inside text-sm mt-1">
                                    {student.scores.map(s => <li key={s.subject}>{s.subject}: <span className="font-semibold">{s.score}</span></li>)}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </>
            );
        }
        return <h4 className="font-semibold text-green-700 mb-3">Semua siswa telah mencapai nilai KKM. Bagus!</h4>;
    };


    return (
        <section id="view-dashboard" className="view active">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                {/* Sync status is handled globally in App.tsx */}
            </div>
            <p className="text-lg text-gray-600 mb-6">Selamat datang, <span className="font-semibold">{settings.teacherName}</span>!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Kelas</h3>
                    <p className="text-3xl font-bold mt-2">{settings.className || '-'}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Jumlah Siswa</h3>
                    <p className="text-3xl font-bold mt-2">{students.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Tahun Ajaran</h3>
                    <p className="text-3xl font-bold mt-2">{settings.schoolYear || '-'}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Semester</h3>
                    <p className="text-3xl font-bold mt-2">{settings.semester || '-'}</p>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Analisis Singkat</h3>
                <div>
                    {renderAnalysis()}
                </div>
            </div>
        </section>
    );
};