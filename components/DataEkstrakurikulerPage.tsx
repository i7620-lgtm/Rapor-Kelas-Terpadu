import React, { useState, useCallback, useRef } from 'react';
import { Student, Extracurricular, StudentExtracurricular } from '../types.ts';

interface DataEkstrakurikulerPageProps {
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onUpdateStudentExtracurriculars: (studentExtracurriculars: StudentExtracurricular[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const MAX_EXTRA_FIELDS = 5;

const DataEkstrakurikulerPage: React.FC<DataEkstrakurikulerPageProps> = ({
    students,
    extracurriculars,
    studentExtracurriculars,
    onUpdateStudentExtracurriculars,
    showToast
}) => {
    const activeExtracurriculars = extracurriculars.filter(e => e.active);

    const handleAssignmentChange = (studentId: number, index: number, activityId: string) => {
        const studentExtra = studentExtracurriculars.find(se => se.studentId === studentId) || { studentId, assignedActivities: [], descriptions: {} };
        const newAssigned = [...(studentExtra.assignedActivities || [])];
        while (newAssigned.length < MAX_EXTRA_FIELDS) {
            newAssigned.push(null);
        }
        newAssigned[index] = activityId === "---" ? null : activityId;
        
        const updatedStudentExtra = { ...studentExtra, assignedActivities: newAssigned };
        
        const newStudentExtracurriculars = studentExtracurriculars.filter(se => se.studentId !== studentId);
        newStudentExtracurriculars.push(updatedStudentExtra);
        onUpdateStudentExtracurriculars(newStudentExtracurriculars);
    };
    
    const handleDescriptionChange = (studentId: number, activityId: string, description: string) => {
        const studentExtra = studentExtracurriculars.find(se => se.studentId === studentId) || { studentId, assignedActivities: [], descriptions: {} };
        const newDescriptions = { ...studentExtra.descriptions, [activityId]: description };

        const updatedStudentExtra = { ...studentExtra, descriptions: newDescriptions };

        const newStudentExtracurriculars = studentExtracurriculars.filter(se => se.studentId !== studentId);
        newStudentExtracurriculars.push(updatedStudentExtra);
        onUpdateStudentExtracurriculars(newStudentExtracurriculars);
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Ekstrakurikuler</h2>
                <p className="mt-1 text-slate-600">Kelola kegiatan ekstrakurikuler yang diikuti oleh siswa. Pengaturan daftar ekstrakurikuler dapat diakses di halaman Pengaturan.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3 sticky left-0 bg-slate-100 z-10 min-w-[200px]">Nama Siswa</th>
                                {Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <th scope="col" className="px-4 py-3 min-w-[200px]">{`Ekstrakurikuler ${i + 1}`}</th>
                                        <th scope="col" className="px-4 py-3 min-w-[300px]">{`Deskripsi ${i + 1}`}</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const studentExtra = studentExtracurriculars.find(se => se.studentId === student.id);
                                return (
                                    <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10">{student.namaLengkap}</th>
                                        {Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => {
                                            const assignedId = studentExtra?.assignedActivities?.[i] || null;
                                            return (
                                                <React.Fragment key={i}>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={assignedId || "---"}
                                                            onChange={(e) => handleAssignmentChange(student.id, i, e.target.value)}
                                                            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        >
                                                            <option value="---">--- Pilih ---</option>
                                                            {activeExtracurriculars.map(ex => (
                                                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {assignedId && (
                                                            <textarea
                                                                value={studentExtra?.descriptions?.[assignedId] || ''}
                                                                onChange={(e) => handleDescriptionChange(student.id, assignedId, e.target.value)}
                                                                rows={2}
                                                                className="w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            />
                                                        )}
                                                    </td>
                                                </React.Fragment>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataEkstrakurikulerPage;
