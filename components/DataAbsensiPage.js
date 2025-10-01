

import React, { useState, useCallback, useRef } from 'react';
import { Student, StudentAttendance } from '../types.js';

declare const XLSX: any;

interface DataAbsensiPageProps {
    students: Student[];
    attendance: StudentAttendance[];
    onUpdateAttendance: (studentId: number, type: 'sakit' | 'izin' | 'alpa', value: number) => void;
    onBulkUpdateAttendance: (newAttendanceData: StudentAttendance[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

type DataAbsensiView = 'DATA_ABSENSI' | 'UNDUH_UNGGAH_DATA';

const DataAbsensiPage: React.FC<DataAbsensiPageProps> = ({ students, attendance, onUpdateAttendance, onBulkUpdateAttendance, showToast }) => {
    const [activeView, setActiveView] = useState<DataAbsensiView>('DATA_ABSENSI');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleExport = useCallback(() => {
        if (typeof XLSX === 'undefined') {
            alert('Pustaka ekspor (SheetJS) tidak termuat.');
            return;
        }

        const dataToExport = students.map(student => {
            const studentAtt = getAttendanceForStudent(student.id);
            return {
                "Nama Lengkap": student.namaLengkap,
                "Sakit (S)": studentAtt.sakit,
                "Izin (I)": studentAtt.izin,
                "Alpa (A)": studentAtt.alpa,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [
            { wch: 30 }, // Nama Lengkap
            { wch: 15 }, // Sakit (S)
            { wch: 15 }, // Izin (I)
            { wch: 15 }, // Alpa (A)
        ];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Absensi");
        XLSX.writeFile(workbook, "Template_Data_Absensi.xlsx");
    }, [students, getAttendanceForStudent]);
    
    const triggerImport = () => {
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
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const studentMap = new Map(students.map(s => [s.namaLengkap.trim().toLowerCase(), s.id]));
                const newAttendanceData: StudentAttendance[] = [];

                json.forEach(row => {
                    const studentName = row["Nama Lengkap"]?.trim().toLowerCase();
                    const studentId = studentMap.get(studentName);
                    
                    if (studentId) {
                        const sakit = parseInt(row["Sakit (S)"], 10) || 0;
                        const izin = parseInt(row["Izin (I)"], 10) || 0;
                        const alpa = parseInt(row["Alpa (A)"], 10) || 0;
                        
                        newAttendanceData.push({ studentId, sakit, izin, alpa });
                    }
                });

                if (newAttendanceData.length > 0) {
                    onBulkUpdateAttendance(newAttendanceData);
                    showToast(`${newAttendanceData.length} data absensi berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada data absensi yang valid untuk diimpor.', 'error');
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

    const renderContent = () => {
        switch(activeView) {
            case 'DATA_ABSENSI':
                return (
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
                );
            case 'UNDUH_UNGGAH_DATA':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Data Absensi</h3>
                        <p className="text-sm text-slate-500 mt-1">Unduh template data siswa dalam format Excel, atau unggah file Excel yang sudah diisi untuk mengimpor data absensi secara massal.</p>
                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <button onClick={handleExport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                                Unduh Template Data
                            </button>
                            <button onClick={triggerImport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                                Unggah Data Absensi
                            </button>
                        </div>
                    </div>
                );
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
             <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Absensi</h2>
            </div>
             <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setActiveView('DATA_ABSENSI')}
                    className={activeView === 'DATA_ABSENSI' ? activeButtonClass : inactiveButtonClass}
                >
                    Data Absensi
                </button>
                <button
                    onClick={() => setActiveView('UNDUH_UNGGAH_DATA')}
                    className={activeView === 'UNDUH_UNGGAH_DATA' ? activeButtonClass : inactiveButtonClass}
                >
                    Unduh/Unggah Data
                </button>
            </div>

            {renderContent()}
        </div>
    );
};

export default DataAbsensiPage;
