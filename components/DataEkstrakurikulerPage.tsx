import React, { useState, useCallback, useRef } from 'react';
import { Student, Extracurricular, StudentExtracurricular } from '../types';

declare const XLSX: any;

interface DataEkstrakurikulerPageProps {
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
    onUpdateStudentExtracurriculars: (studentExtracurriculars: StudentExtracurricular[]) => void;
    onBulkUpdateStudentExtracurriculars: (newData: StudentExtracurricular[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

type EkstraView = 'DATA_EKSTRA' | 'PENGATURAN_EKSTRA' | 'UNDUH_UNGGAH';
const MAX_EXTRA_FIELDS = 5;

const DataEkstrakurikulerPage: React.FC<DataEkstrakurikulerPageProps> = ({
    students,
    extracurriculars,
    studentExtracurriculars,
    onUpdateExtracurriculars,
    onUpdateStudentExtracurriculars,
    onBulkUpdateStudentExtracurriculars,
    showToast
}) => {
    const [activeView, setActiveView] = useState<EkstraView>('DATA_EKSTRA');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleExport = useCallback(() => {
        if (typeof XLSX === 'undefined') {
            showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
            return;
        }

        const headers = ["Nama Lengkap"];
        for (let i = 1; i <= MAX_EXTRA_FIELDS; i++) {
            headers.push(`Ekstrakurikuler ${i}`);
            headers.push(`Deskripsi ${i}`);
        }
        
        const dataToExport = students.map(student => {
            const studentExtra = studentExtracurriculars.find(se => se.studentId === student.id);
            const row: { [key: string]: string } = { "Nama Lengkap": student.namaLengkap };
            
            for (let i = 0; i < MAX_EXTRA_FIELDS; i++) {
                const activityId = studentExtra?.assignedActivities?.[i] || null;
                const activityName = extracurriculars.find(e => e.id === activityId)?.name || '';
                const description = activityId ? studentExtra?.descriptions?.[activityId] || '' : '';
                row[`Ekstrakurikuler ${i+1}`] = activityName;
                row[`Deskripsi ${i+1}`] = description;
            }
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [{ wch: 30 }, ...Array(MAX_EXTRA_FIELDS * 2).fill({ wch: 30 })];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Ekstrakurikuler");
        XLSX.writeFile(workbook, "Template_Data_Ekstrakurikuler.xlsx");
        showToast('Template berhasil diekspor!', 'success');
    }, [students, studentExtracurriculars, extracurriculars, showToast]);

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
                const extraMap = new Map(extracurriculars.map(ex => [ex.name.trim().toLowerCase(), ex.id]));
                const newStudentExtras: StudentExtracurricular[] = [];

                // FIX: Explicitly type `row` to avoid type errors when accessing its properties.
                json.forEach((row: { [key: string]: string | number }) => {
                    const studentName = String(row["Nama Lengkap"] || '').trim().toLowerCase();
                    const studentId = studentMap.get(studentName);

                    if (studentId) {
                        const assignedActivities: (string | null)[] = [];
                        const descriptions: { [activityId: string]: string } = {};

                        for (let i = 1; i <= MAX_EXTRA_FIELDS; i++) {
                            const extraName = String(row[`Ekstrakurikuler ${i}`] || '').trim().toLowerCase();
                            const extraId = extraMap.get(extraName) || null;
                            assignedActivities.push(extraId);
                            if (extraId) {
                                descriptions[extraId] = String(row[`Deskripsi ${i}`] || '');
                            }
                        }
                        newStudentExtras.push({ studentId, assignedActivities, descriptions });
                    }
                });

                if (newStudentExtras.length > 0) {
                    onBulkUpdateStudentExtracurriculars(newStudentExtras);
                    showToast(`${newStudentExtras.length} data ekstrakurikuler siswa berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada data valid yang ditemukan untuk diimpor.', 'error');
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

    const renderDataEkstra = () => (
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
    );
    
    const renderPengaturanEkstra = () => (
        <PengaturanEkstraView
            extracurriculars={extracurriculars}
            onUpdateExtracurriculars={onUpdateExtracurriculars}
        />
    );

    const renderUnduhUnggah = () => (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Data</h3>
            <p className="text-sm text-slate-500 mt-1">Gunakan opsi di bawah ini untuk mengelola data ekstrakurikuler secara massal.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleExport} className="w-full px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unduh Template
                </button>
                <button onClick={triggerImport} className="w-full px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unggah Data
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch(activeView) {
            case 'DATA_EKSTRA': return renderDataEkstra();
            case 'PENGATURAN_EKSTRA': return renderPengaturanEkstra();
            case 'UNDUH_UNGGAH': return renderUnduhUnggah();
            default: return null;
        }
    }

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
                <h2 className="text-3xl font-bold text-slate-800">Data Ekstrakurikuler</h2>
                <p className="mt-1 text-slate-600">Kelola kegiatan ekstrakurikuler yang diikuti oleh siswa.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setActiveView('DATA_EKSTRA')} className={activeView === 'DATA_EKSTRA' ? activeButtonClass : inactiveButtonClass}>
                    Data Ekstrakurikuler Siswa
                </button>
                <button onClick={() => setActiveView('PENGATURAN_EKSTRA')} className={activeView === 'PENGATURAN_EKSTRA' ? activeButtonClass : inactiveButtonClass}>
                    Pengaturan Ekstrakurikuler
                </button>
                <button onClick={() => setActiveView('UNDUH_UNGGAH')} className={activeView === 'UNDUH_UNGGAH' ? activeButtonClass : inactiveButtonClass}>
                    Unduh/Unggah Data
                </button>
            </div>

            {renderContent()}
        </div>
    );
};

// Sub-component for managing extracurricular list
interface PengaturanEkstraViewProps {
    extracurriculars: Extracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
}

const PengaturanEkstraView: React.FC<PengaturanEkstraViewProps> = ({ extracurriculars, onUpdateExtracurriculars }) => {
    const [newExtraName, setNewExtraName] = useState('');

    const handleToggle = (id: string) => {
        const updated = extracurriculars.map(ex => ex.id === id ? { ...ex, active: !ex.active } : ex);
        onUpdateExtracurriculars(updated);
    };

    const handleAdd = () => {
        if (!newExtraName.trim()) return;
        const newId = newExtraName.trim().toUpperCase().replace(/\s+/g, '_');
        if (extracurriculars.some(ex => ex.id === newId)) {
            alert("Ekstrakurikuler dengan ID ini sudah ada.");
            return;
        }
        const newExtra: Extracurricular = { id: newId, name: newExtraName.trim(), active: true };
        onUpdateExtracurriculars([...extracurriculars, newExtra]);
        setNewExtraName('');
    };

    const activeList = extracurriculars.filter(e => e.active);
    const inactiveList = extracurriculars.filter(e => !e.active);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Ekstrakurikuler Aktif</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {activeList.map(ex => (
                            <div key={ex.id} onClick={() => handleToggle(ex.id)} className="p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                                <p className="font-medium text-slate-800">{ex.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Ekstrakurikuler Tidak Aktif</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                         {inactiveList.map(ex => (
                            <div key={ex.id} onClick={() => handleToggle(ex.id)} className="p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                                <p className="font-medium text-slate-500">{ex.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

             <div className="pt-6 border-t">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Tambah Ekstrakurikuler Baru</h3>
                <div className="flex items-end gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-grow">
                        <label htmlFor="new-extra-name" className="block text-sm font-medium text-slate-700 mb-1">Nama Ekstrakurikuler</label>
                        <input
                            type="text"
                            id="new-extra-name"
                            value={newExtraName}
                            onChange={e => setNewExtraName(e.target.value)}
                            placeholder="Contoh: Seni Lukis"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataEkstrakurikulerPage;
