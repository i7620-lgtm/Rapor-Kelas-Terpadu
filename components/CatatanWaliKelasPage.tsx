

import React, { useState, useCallback, useRef } from 'react';
import { Student, StudentNotes } from '../types';

declare const XLSX: any;

interface CatatanWaliKelasPageProps {
    students: Student[];
    notes: StudentNotes;
    onUpdateNote: (studentId: number, note: string) => void;
    onBulkUpdateNotes: (newNotes: StudentNotes) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

type CatatanView = 'CATATAN_SISWA' | 'UNDUH_UNGGAH_DATA';

const CatatanWaliKelasPage: React.FC<CatatanWaliKelasPageProps> = ({ students, notes, onUpdateNote, onBulkUpdateNotes, showToast }) => {
    const [activeView, setActiveView] = useState<CatatanView>('CATATAN_SISWA');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNoteChange = (studentId: number, note: string) => {
        onUpdateNote(studentId, note);
    };

    const handleExport = useCallback(() => {
        if (typeof XLSX === 'undefined') {
            showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
            return;
        }

        const dataToExport = students.map(student => ({
            "Nama Lengkap": student.namaLengkap,
            "Catatan Wali Kelas": notes[student.id] || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [
            { wch: 30 }, // Nama Lengkap
            { wch: 80 }, // Catatan Wali Kelas
        ];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Catatan Wali Kelas");
        XLSX.writeFile(workbook, "Template_Catatan_Wali_Kelas.xlsx");
        showToast('Template berhasil diekspor!', 'success');
    }, [students, notes, showToast]);

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
                const newNotes: StudentNotes = {};
                let count = 0;

                json.forEach(row => {
                    const studentName = row["Nama Lengkap"]?.trim().toLowerCase();
                    const studentId = studentMap.get(studentName);
                    
                    if (studentId) {
                        const note = row["Catatan Wali Kelas"] || '';
                        newNotes[studentId] = String(note);
                        count++;
                    }
                });

                if (count > 0) {
                    onBulkUpdateNotes(newNotes);
                    showToast(`${count} catatan wali kelas berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada data catatan yang valid untuk diimpor.', 'error');
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
            case 'CATATAN_SISWA':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 w-16">No</th>
                                        <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                                        <th scope="col" className="px-6 py-3">Catatan Wali Kelas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length > 0 ? (
                                        students.map((student, index) => (
                                            <tr key={student.id} className="bg-white border-b hover:bg-slate-50 align-top">
                                                <td className="px-6 py-4">{index + 1}</td>
                                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                                <td className="px-6 py-4">
                                                    <textarea
                                                        value={notes[student.id] || ''}
                                                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                        placeholder="Tulis catatan untuk siswa di sini..."
                                                        className="w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                                                        rows={4}
                                                        aria-label={`Catatan wali kelas untuk ${student.namaLengkap}`}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center py-10 text-slate-500">
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
                        <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Catatan Wali Kelas</h3>
                        <p className="text-sm text-slate-500 mt-1">Unduh template catatan wali kelas dalam format excel, atau unggah file excel yang sudah diisi untuk mengimpor catatan wali kelas secara massal.</p>
                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <button onClick={handleExport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                                Unduh Template Data
                            </button>
                            <button onClick={triggerImport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                                Unggah Catatan Wali Kelas
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
                <h2 className="text-3xl font-bold text-slate-800">Catatan Wali Kelas</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setActiveView('CATATAN_SISWA')}
                    className={activeView === 'CATATAN_SISWA' ? activeButtonClass : inactiveButtonClass}
                >
                    Catatan Wali Kelas
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

export default CatatanWaliKelasPage;
