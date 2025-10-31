

import React, { useState, useCallback, useRef } from 'react';
import { Student, StudentAttendance } from '../types.ts';

interface DataAbsensiPageProps {
    students: Student[];
    attendance: StudentAttendance[];
    onUpdateAttendance: (studentId: number, type: 'sakit' | 'izin' | 'alpa', value: number) => void;
    onBulkUpdateAttendance: (newAttendanceData: StudentAttendance[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const DataAbsensiPage: React.FC<DataAbsensiPageProps> = ({ students, attendance, onUpdateAttendance, onBulkUpdateAttendance, showToast }) => {

    const getAttendanceForStudent = useCallback((studentId: number): StudentAttendance => {
        return attendance.find(a => a.studentId === studentId) || { studentId, sakit: 0, izin: 0, alpa: 0 };
    }, [attendance]);

    const handleAttendanceChange = (studentId: number, type: 'sakit' | 'izin' | 'alpa', value: string) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue >= 0) {
            onUpdateAttendance(studentId, type, numericValue);
        } else if (value === '') {
            onUpdateAttendance(studentId, type, 0);
        }
    };
    
    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Absensi</h2>
                 <p className="mt-1 text-slate-600">Catat jumlah ketidakhadiran siswa selama satu semester.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">No</th>
                                <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                                <th scope="col" className="px-6 py-3">Nama Panggilan</th>
                                <th scope="col" className="px-4 py-3 text-center">Sakit (S)</th>
                                <th scope="col" className="px-4 py-3 text-center">Izin (I)</th>
                                <th scope="col" className="px-4 py-3 text-center">Alpa (A)</th>
                                <th scope="col" className="px-6 py-3 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? (
                                students.map((student, index) => {
                                    const studentAtt = getAttendanceForStudent(student.id);
                                    const total = studentAtt.sakit + studentAtt.izin + studentAtt.alpa;
                                    return (
                                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{index + 1}</td>
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                            <td className="px-6 py-4">{student.namaPanggilan}</td>
                                            <td className="px-4 py-2 text-center">
                                                <input type="number" min="0" value={studentAtt.sakit} onChange={(e) => handleAttendanceChange(student.id, 'sakit', e.target.value)} className="w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input type="number" min="0" value={studentAtt.izin} onChange={(e) => handleAttendanceChange(student.id, 'izin', e.target.value)} className="w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input type="number" min="0" value={studentAtt.alpa} onChange={(e) => handleAttendanceChange(student.id, 'alpa', e.target.value)} className="w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-800">{total}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500">
                                        Belum ada data siswa. Silakan tambahkan siswa di halaman 'Data Siswa'.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataAbsensiPage;
