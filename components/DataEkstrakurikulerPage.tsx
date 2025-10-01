
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Student, Extracurricular, StudentExtracurricular } from '../types';
import { GoogleGenAI } from "@google/genai";

declare const XLSX: any;

// Props interfaces for sub-components
interface DaftarEkstraViewProps {
    extracurriculars: Extracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
}

const DaftarEkstraView: React.FC<DaftarEkstraViewProps> = ({ extracurriculars, onUpdateExtracurriculars }) => {
    const [newEkstraName, setNewEkstraName] = useState('');

    const activeEkstras = extracurriculars.filter(e => e.active);
    const inactiveEkstras = extracurriculars.filter(e => !e.active);

    const handleToggle = (ekstraId: string) => {
        onUpdateExtracurriculars(extracurriculars.map(e => e.id === ekstraId ? { ...e, active: !e.active } : e));
    };

    const handleAdd = () => {
        if (!newEkstraName.trim()) {
            alert("Nama ekstrakurikuler tidak boleh kosong.");
            return;
        }
        const newId = newEkstraName.trim().toUpperCase().replace(/\s+/g, '_');
        if (extracurriculars.some(e => e.id === newId)) {
            alert("Ekstrakurikuler dengan nama yang mirip sudah ada. Harap gunakan nama lain.");
            return;
        }

        const newEkstra: Extracurricular = {
            id: newId,
            name: newEkstraName.trim(),
            active: true
        };

        onUpdateExtracurriculars([...extracurriculars, newEkstra]);
        setNewEkstraName('');
    };
    
    const EkstraItem: React.FC<{ekstra: Extracurricular}> = ({ ekstra }) => (
        <div 
            onClick={() => handleToggle(ekstra.id)}
            className="p-2 border border-slate-300 bg-white rounded-md shadow-sm cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
            title="Klik untuk memindahkan"
        >
            <p className="font-medium text-slate-800 text-sm">{ekstra.name}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Ekstrakurikuler Aktif</h3>
                    <div className="flex flex-wrap gap-2">
                        {activeEkstras.length > 0 ? activeEkstras.map(e => <EkstraItem key={e.id} ekstra={e} />) : <p className="text-slate-500 text-sm p-2">Tidak ada ekstrakurikuler aktif.</p>}
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Ekstrakurikuler Tidak Aktif</h3>
                    <div className="flex flex-wrap gap-2">
                        {inactiveEkstras.length > 0 ? inactiveEkstras.map(e => <EkstraItem key={e.id} ekstra={e} />) : <p className="text-slate-500 text-sm p-2">Semua ekstrakurikuler aktif.</p>}
                    </div>
                </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <p className="text-sm text-slate-600 flex-shrink-0">Klik di sini untuk menuliskan ekstrakurikuler baru.</p>
                <input
                    type="text"
                    value={newEkstraName}
                    onChange={e => setNewEkstraName(e.target.value)}
                    placeholder="Contoh: Palang Merah Remaja"
                    className="flex-grow w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                />
                <button onClick={handleAdd} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700">
                    + Tambah Ekstrakurikuler Baru
                </button>
            </div>
        </div>
    );
};


interface EkstraPerSiswaViewProps {
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onUpdateStudentExtracurriculars: (studentExtracurriculars: StudentExtracurricular[]) => void;
}

const EkstraPerSiswaView: React.FC<EkstraPerSiswaViewProps> = ({ students, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars }) => {
    const activeEkstras = useMemo(() => extracurriculars.filter(e => e.active), [extracurriculars]);
    const MAX_EKSTRAS = 5;

    const handleAssignmentChange = (studentId: number, ekstraIndex: number, activityId: string) => {
        const updatedList = studentExtracurriculars.map(se => {
            if (se.studentId === studentId) {
                const newAssigned = [...se.assignedActivities];
                // Ensure array has enough elements
                while (newAssigned.length < MAX_EKSTRAS) {
                    newAssigned.push(null);
                }
                newAssigned[ekstraIndex] = activityId === "---" ? null : activityId;
                return { ...se, assignedActivities: newAssigned };
            }
            return se;
        });
        onUpdateStudentExtracurriculars(updatedList);
    };

    return (
         <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">No</th>
                            <th scope="col" className="px-6 py-3">Nama Siswa</th>
                            {Array.from({ length: MAX_EKSTRAS }).map((_, i) => (
                                <th key={i} scope="col" className="px-4 py-3 text-center">{`Ekstra ${i + 1}`}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, index) => {
                            const studentData = studentExtracurriculars.find(se => se.studentId === student.id) ?? { studentId: student.id, assignedActivities: [], descriptions: {} };
                            return (
                                <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                    {Array.from({ length: MAX_EKSTRAS }).map((_, i) => (
                                        <td key={i} className="px-4 py-2 text-center">
                                            <select
                                                value={studentData.assignedActivities[i] ?? "---"}
                                                onChange={(e) => handleAssignmentChange(student.id, i, e.target.value)}
                                                className="w-40 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                                            >
                                                <option value="---">--- Pilih ---</option>
                                                {activeEkstras.map(ekstra => (
                                                    <option key={ekstra.id} value={ekstra.id}>{ekstra.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


interface DeskripsiViewProps {
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onUpdateStudentExtracurriculars: (studentExtracurriculars: StudentExtracurricular[]) => void;
}

const DeskripsiView: React.FC<DeskripsiViewProps> = ({ students, extracurriculars, studentExtracurriculars, onUpdateStudentExtracurriculars }) => {
    const [selectedEkstra, setSelectedEkstra] = useState<string>('');
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);
    const activeEkstras = useMemo(() => extracurriculars.filter(e => e.active), [extracurriculars]);

    const studentsInEkstra = useMemo(() => {
        if (!selectedEkstra) return [];
        return students.filter(student =>
            studentExtracurriculars.find(se => se.studentId === student.id)?.assignedActivities.includes(selectedEkstra)
        );
    }, [selectedEkstra, students, studentExtracurriculars]);
    
    const handleDescriptionChange = (studentId: number, activityId: string, text: string) => {
        const updatedList = studentExtracurriculars.map(se => {
            if (se.studentId === studentId) {
                const newDescriptions = { ...se.descriptions, [activityId]: text };
                return { ...se, descriptions: newDescriptions };
            }
            return se;
        });
        onUpdateStudentExtracurriculars(updatedList);
    };

    const handleGenerate = useCallback(async (student: Student) => {
        const activityId = selectedEkstra;
        if (!activityId) return;

        setIsLoading(prev => ({ ...prev, [student.id]: true }));
        try {
            const ekstraName = extracurriculars.find(e => e.id === activityId)?.name;
            const prompt = `Buatkan deskripsi singkat untuk kegiatan ekstrakurikuler ${ekstraName} yang diikuti oleh siswa bernama ${student.namaLengkap}. Deskripsi harus positif, menyoroti partisipasi dan perkembangan siswa, serta memberikan kalimat motivasi. Tulis dalam satu paragraf Bahasa Indonesia.`;
            
            // FIX: Access the generated text directly from the `text` property of the response.
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            handleDescriptionChange(student.id, activityId, response.text.trim());
        } catch (error) {
            console.error("Error generating description:", error);
            alert("Gagal menghasilkan deskripsi.");
        } finally {
            setIsLoading(prev => ({ ...prev, [student.id]: false }));
        }
    }, [selectedEkstra, extracurriculars, ai.models, onUpdateStudentExtracurriculars]);


    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg">
                <label htmlFor="ekstra-select" className="block text-sm font-medium text-slate-700 mb-1">Pilih Ekstrakurikuler</label>
                <select
                    id="ekstra-select"
                    value={selectedEkstra}
                    onChange={e => setSelectedEkstra(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                >
                    <option value="" disabled>Pilih salah satu...</option>
                    {activeEkstras.map(ekstra => (
                        <option key={ekstra.id} value={ekstra.id}>{ekstra.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-16">No</th>
                            <th scope="col" className="px-6 py-3">Nama Siswa</th>
                            <th scope="col" className="px-6 py-3">Deskripsi Ekstrakurikuler ({extracurriculars.find(e => e.id === selectedEkstra)?.name || ''})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedEkstra && studentsInEkstra.map((student, index) => {
                            const studentData = studentExtracurriculars.find(se => se.studentId === student.id);
                            const description = studentData?.descriptions[selectedEkstra] || '';
                            return(
                            <tr key={student.id} className="bg-white border-b align-top">
                                <td className="px-6 py-4">{index + 1}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                <td className="px-6 py-4">
                                    <textarea
                                        value={description}
                                        onChange={(e) => handleDescriptionChange(student.id, selectedEkstra, e.target.value)}
                                        placeholder="Tulis deskripsi atau klik 'Hasilkan'"
                                        className="w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                                        rows={4}
                                    />
                                    <div className="text-right mt-2">
                                    <button
                                        onClick={() => handleGenerate(student)}
                                        disabled={isLoading[student.id]}
                                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    >
                                        {isLoading[student.id] ? 'Memproses...' : 'Hasilkan'}
                                    </button>
                                </div>
                                </td>
                            </tr>
                        )})}
                         {selectedEkstra && studentsInEkstra.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-10 text-slate-500">
                                    Belum ada siswa yang mengikuti ekstrakurikuler ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const DataIOView: React.FC<{
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onBulkUpdate: (data: StudentExtracurricular[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}> = ({ students, extracurriculars, studentExtracurriculars, onBulkUpdate, showToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = useCallback(() => {
        if (typeof XLSX === 'undefined') {
            showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
            return;
        }

        const wb = XLSX.utils.book_new();
        const activeEkstras = extracurriculars.filter(e => e.active);
        const ekstraNameMap = new Map(extracurriculars.map(e => [e.id, e.name]));
        const MAX_EKSTRAS = 5;

        // Sheet 1: Penugasan Ekstra
        const assignmentData = students.map(student => {
            const studentData = studentExtracurriculars.find(se => se.studentId === student.id);
            const row: { [key: string]: any } = { "Nama Siswa": student.namaLengkap };
            for (let i = 0; i < MAX_EKSTRAS; i++) {
                const activityId = studentData?.assignedActivities?.[i];
                row[`Ekstra ${i + 1}`] = activityId ? ekstraNameMap.get(activityId) || '' : '';
            }
            return row;
        });
        const wsAssignment = XLSX.utils.json_to_sheet(assignmentData);
        wsAssignment['!cols'] = [{ wch: 30 }, ...Array(MAX_EKSTRAS).fill({ wch: 20 })];
        XLSX.utils.book_append_sheet(wb, wsAssignment, "Penugasan Ekstra");
        
        // Sheet 2: Deskripsi Ekstra
        const descriptionHeaders = ["Nama Siswa", ...activeEkstras.map(e => `Deskripsi ${e.name}`)];
        const descriptionData = students.map(student => {
            const studentData = studentExtracurriculars.find(se => se.studentId === student.id);
            const row: (string)[] = [student.namaLengkap];
            activeEkstras.forEach(ekstra => {
                row.push(studentData?.descriptions[ekstra.id] || '');
            });
            return row;
        });
        const wsDescription = XLSX.utils.aoa_to_sheet([descriptionHeaders, ...descriptionData]);
        wsDescription['!cols'] = [{ wch: 30 }, ...activeEkstras.map(() => ({ wch: 40 }))];
        XLSX.utils.book_append_sheet(wb, wsDescription, "Deskripsi Ekstra");

        // Sheet 3: Daftar Ekstra (Reference)
        const refData = activeEkstras.map(e => ({ "Nama Ekstrakurikuler": e.name }));
        const wsRef = XLSX.utils.json_to_sheet(refData);
        wsRef['!cols'] = [{ wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsRef, "Daftar Ekstra Aktif");

        XLSX.writeFile(wb, "Template_Data_Ekstrakurikuler.xlsx");
        showToast('Template data ekstrakurikuler berhasil diunduh.', 'success');
    }, [students, extracurriculars, studentExtracurriculars, showToast]);

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const studentMap = new Map(students.map(s => [s.namaLengkap.trim().toLowerCase(), s.id]));
                const ekstraMap = new Map(extracurriculars.map(ekstra => [ekstra.name.trim().toLowerCase(), ekstra.id]));
                const importedData: Map<number, Partial<StudentExtracurricular>> = new Map();

                // Process assignments
                const wsAssignment = workbook.Sheets["Penugasan Ekstra"];
                if (wsAssignment) {
                    const jsonAssignments: any[] = XLSX.utils.sheet_to_json(wsAssignment);
                    jsonAssignments.forEach(row => {
                        const studentName = row["Nama Siswa"]?.trim().toLowerCase();
                        const studentId = studentMap.get(studentName);
                        if (!studentId) return;

                        const assignedActivities: (string | null)[] = [];
                        for (let i = 1; i <= 5; i++) {
                            const ekstraName = row[`Ekstra ${i}`]?.trim().toLowerCase();
                            const ekstraId = ekstraName ? ekstraMap.get(ekstraName) : null;
                            assignedActivities.push(ekstraId || null);
                        }
                        
                        const currentData = importedData.get(studentId) || { studentId };
                        currentData.assignedActivities = assignedActivities;
                        importedData.set(studentId, currentData);
                    });
                }

                // Process descriptions
                const wsDescription = workbook.Sheets["Deskripsi Ekstra"];
                if (wsDescription) {
                    const jsonDescriptions: any[] = XLSX.utils.sheet_to_json(wsDescription);
                    jsonDescriptions.forEach(row => {
                        const studentName = row["Nama Siswa"]?.trim().toLowerCase();
                        const studentId = studentMap.get(studentName);
                        if (!studentId) return;

                        const descriptions: Record<string, string> = {};
                        Object.keys(row).forEach(header => {
                            if (header.startsWith("Deskripsi ")) {
                                const ekstraName = header.substring(10).trim().toLowerCase();
                                const ekstraId = ekstraMap.get(ekstraName);
                                if (ekstraId && row[header]) {
                                    descriptions[ekstraId] = String(row[header]);
                                }
                            }
                        });

                        const currentData = importedData.get(studentId) || { studentId };
                        currentData.descriptions = { ...(currentData.descriptions || {}), ...descriptions };
                        importedData.set(studentId, currentData);
                    });
                }

                const finalData = Array.from(importedData.values());
                if (finalData.length > 0) {
                    onBulkUpdate(finalData as StudentExtracurricular[]);
                    showToast(`${finalData.length} data ekstrakurikuler siswa berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada data valid yang ditemukan dalam file.', 'error');
                }

            } catch (error) {
                console.error("Error processing Excel file:", error);
                showToast("Gagal memproses file impor.", 'error');
            } finally {
                if (e.target) e.target.value = ''; // Reset file input
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
            />
            <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Data</h3>
            <p className="text-sm text-slate-500 mt-1">Unduh template Excel untuk mengisi data penugasan dan deskripsi ekstrakurikuler, atau unggah file yang sudah diisi untuk impor massal.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={handleExport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unduh Template Data
                </button>
                <button onClick={triggerImport} className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center">
                    Unggah Data Ekstrakurikuler
                </button>
            </div>
        </div>
    );
};

interface DataEkstrakurikulerPageProps {
    students: Student[];
    extracurriculars: Extracurricular[];
    studentExtracurriculars: StudentExtracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
    onUpdateStudentExtracurriculars: (studentExtracurriculars: StudentExtracurricular[]) => void;
    onBulkUpdateStudentExtracurriculars: (data: StudentExtracurricular[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

type EkstraView = 'DAFTAR_EKSTRA' | 'EKSTRA_PER_SISWA' | 'DESKRIPSI' | 'UNDUH_UNGGAH_DATA';

const DataEkstrakurikulerPage: React.FC<DataEkstrakurikulerPageProps> = (props) => {
  const [activeView, setActiveView] = useState<EkstraView>('DAFTAR_EKSTRA');

  const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
  const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-700 border border-indigo-700 rounded-lg shadow-sm";

  const buttons: { id: EkstraView; label: string }[] = [
    { id: 'DAFTAR_EKSTRA', label: 'Daftar Ekstra' },
    { id: 'EKSTRA_PER_SISWA', label: 'Ekstra per Siswa' },
    { id: 'DESKRIPSI', label: 'Deskripsi' },
    { id: 'UNDUH_UNGGAH_DATA', label: 'Unduh/Unggah Data' },
  ];

  const renderContent = () => {
    switch(activeView) {
      case 'DAFTAR_EKSTRA':
        return <DaftarEkstraView extracurriculars={props.extracurriculars} onUpdateExtracurriculars={props.onUpdateExtracurriculars} />;
      case 'EKSTRA_PER_SISWA':
        return <EkstraPerSiswaView {...props} />;
      case 'DESKRIPSI':
        return <DeskripsiView {...props} />;
      case 'UNDUH_UNGGAH_DATA':
        return <DataIOView 
                    students={props.students}
                    extracurriculars={props.extracurriculars}
                    studentExtracurriculars={props.studentExtracurriculars}
                    onBulkUpdate={props.onBulkUpdateStudentExtracurriculars}
                    showToast={props.showToast}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Data Ekstrakurikuler</h2>
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
        <div>{renderContent()}</div>
    </div>
  );
}

export default DataEkstrakurikulerPage;
