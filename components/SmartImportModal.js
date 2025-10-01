

import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types.js';
import { studentFieldDefinitions } from '../constants.js';
import { GoogleGenAI, Type } from '@google/genai';

declare const XLSX: any;

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (newStudents: Omit<Student, 'id'>[]) => void;
}

type Mapping = Partial<Record<keyof Omit<Student, 'id'>, string | null>>;

const emptyStudent: Omit<Student, 'id'> = {
    namaLengkap: '', namaPanggilan: '', nis: '', nisn: '', tempatLahir: '',
    tanggalLahir: '', jenisKelamin: '', agama: '', kewarganegaraan: 'WNI',
    statusDalamKeluarga: '', anakKe: '', asalTk: '', alamatSiswa: '',
    namaAyah: '', namaIbu: '', pekerjaanAyah: '', pekerjaanIbu: '',
    alamatOrangTua: '', teleponOrangTua: '', namaWali: '', pekerjaanWali: '',
    alamatWali: '', teleponWali: '',
};

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [fileRows, setFileRows] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Mapping>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);
    const targetFields = useMemo(() => studentFieldDefinitions.filter(f => f.key !== 'no'), []);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setFile(null);
            setFileHeaders([]);
            setFileRows([]);
            setMapping({});
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleFileProcess = async (selectedFile: File) => {
        if (typeof XLSX === 'undefined') {
            setError('Pustaka untuk membaca file (SheetJS) tidak termuat.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFile(selectedFile);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", cellDates: true });
            
            if (json.length < 1) {
                setError('File kosong atau tidak memiliki header.');
                setIsLoading(false);
                return;
            }

            const headers = json[0].map(String);
            const rows = json.slice(1);
            setFileHeaders(headers);
            setFileRows(rows);

            // AI-assisted mapping
            const prompt = `You are an expert data mapping assistant. Your task is to map column headers from a user's uploaded file to a predefined set of application fields. Provide the best possible mapping in JSON format.
            I have a file with the following column headers: ${headers.join(', ')}.
            Please map these headers to the following application fields, based on their descriptions:
            ${targetFields.map(f => `- ${f.key}: ${f.description}`).join('\n')}
            
            Provide the mapping as a JSON object where the keys are the application field names and the values are the corresponding headers from my file. If you cannot find a suitable match for a field, use null as the value.`;

            const properties: Record<string, any> = {};
            targetFields.forEach(field => {
                // FIX: Ensure field.key is treated as a string when used as an object key or in a template literal.
                properties[String(field.key)] = { type: Type.STRING, description: `The header from the user file that maps to ${String(field.key)}. Should be one of [${headers.join(', ')}] or null.` };
            });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { mapping: { type: Type.OBJECT, properties } },
                        required: ['mapping']
                    },
                },
            });
            
            const aiMapping = JSON.parse(response.text).mapping;
            
            // Validate AI mapping to ensure it only suggests headers that actually exist in the file
            const validatedMapping: Mapping = {};
            // FIX: Use `Object.keys` to iterate over keys as strings, preventing potential type issues with symbols.
            for (const key of Object.keys(aiMapping)) {
                if (headers.includes(aiMapping[key]) && Object.keys(emptyStudent).includes(key)) {
                    validatedMapping[key as keyof Omit<Student, 'id'>] = aiMapping[key];
                }
            }
            setMapping(validatedMapping);

        } catch (err) {
            console.error("Error processing file or calling AI:", err);
            setError("Gagal memproses file atau mendapatkan saran dari AI. Silakan coba lagi atau petakan kolom secara manual.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileProcess(selectedFile);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile) {
            handleFileProcess(selectedFile);
        }
    };

    const handleMappingChange = (fieldKey: keyof Student, header: string) => {
        setMapping(prev => ({ ...prev, [fieldKey]: header === "---" ? null : header }));
    };

    const handleImportClick = () => {
        const newStudents: Omit<Student, 'id'>[] = [];
        const keyToHeaderMap = new Map(Object.entries(mapping).map(([key, header]) => [key, header]));
        const headerToIndexMap = new Map(fileHeaders.map((header, index) => [header, index]));

        fileRows.forEach(rowArray => {
            const newStudent: Omit<Student, 'id'> = { ...emptyStudent };
            let hasRequiredData = false;
            
            keyToHeaderMap.forEach((header, key) => {
                if (header && headerToIndexMap.has(header)) {
                    const index = headerToIndexMap.get(header)!;
                    let value = rowArray[index];
                    
                    if (key === 'tanggalLahir' && value instanceof Date) {
                       value = value.toISOString().split('T')[0];
                    }

                    (newStudent as any)[key] = String(value || '').trim();

                    if (key === 'namaLengkap' && newStudent.namaLengkap) {
                        hasRequiredData = true;
                    }
                }
            });

            if (hasRequiredData) {
                newStudents.push(newStudent);
            }
        });

        if (newStudents.length > 0) {
            onImport(newStudents);
        } else {
            setError("Tidak ada data siswa yang valid untuk diimpor. Pastikan kolom 'Nama Lengkap' terpetakan dan memiliki data.");
        }
    };

    const previewData = useMemo(() => {
        const previewRows = fileRows.slice(0, 3);
        return previewRows.map(rowArray => {
            const studentData: Partial<Student> = {};
            targetFields.forEach(({ key }) => {
                const mappedHeader = mapping[key as keyof Student];
                if (mappedHeader) {
                    const headerIndex = fileHeaders.indexOf(mappedHeader);
                    if (headerIndex !== -1) {
                         let value = rowArray[headerIndex];
                         if (key === 'tanggalLahir' && value instanceof Date) {
                           value = value.toISOString().split('T')[0];
                         }
                        (studentData as any)[key] = value;
                    }
                }
            });
            return studentData;
        });
    }, [fileRows, mapping, fileHeaders, targetFields]);
    
    if (!isOpen) return null;

    const renderFileDropzone = () => (
        <div 
            className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
                ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input-smart')?.click()}
        >
            <input type="file" id="file-input-smart" className="hidden" onChange={handleFileSelected} accept=".xlsx, .xls, .csv" />
            <div className="mx-auto h-12 w-12 text-slate-400 text-4xl font-semibold" aria-hidden="true">↑</div>
            <p className="mt-2 font-semibold text-indigo-600">Klik untuk mengunggah atau seret file ke sini</p>
            <p className="text-sm text-slate-500 mt-1">Mendukung format .xlsx, .xls, dan .csv</p>
        </div>
    );
    
    const renderMappingUI = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Petakan Kolom File Anda</h3>
                <p className="text-sm text-slate-600 mt-1">Kami telah mencoba memetakan kolom dari file Anda secara otomatis. Harap periksa dan sesuaikan jika perlu.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-64 overflow-y-auto pr-2">
                {targetFields.map(({ key, label }) => (
                    // FIX: Ensure React key is a string.
                    <div key={String(key)}>
                        <label htmlFor={`map-${String(key)}`} className="block text-sm font-medium text-slate-700">
                            {label}
                            {mapping[key as keyof Student] && <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">✨ AI</span>}
                        </label>
                        <select
                            // FIX: Ensure id is a string.
                            id={`map-${String(key)}`}
                            value={mapping[key as keyof Student] || '---'}
                            onChange={(e) => handleMappingChange(key as keyof Student, e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="---">--- Abaikan Kolom Ini ---</option>
                            {fileHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div>
                 <h3 className="text-lg font-bold text-slate-800">Pratinjau Data</h3>
                 <div className="overflow-x-auto mt-2 border rounded-lg bg-slate-50">
                    <table className="w-full text-sm text-left">
                         <thead className="bg-slate-100 text-xs text-slate-700 uppercase">
                            <tr>
                                <th className="px-4 py-2">Nama Lengkap</th>
                                <th className="px-4 py-2">NIS</th>
                                <th className="px-4 py-2">NISN</th>
                                <th className="px-4 py-2">Tgl Lahir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((student, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2 whitespace-nowrap">{student.namaLengkap || ''}</td>
                                    <td className="px-4 py-2">{student.nis || ''}</td>
                                    <td className="px-4 py-2">{student.nisn || ''}</td>
                                    <td className="px-4 py-2">{student.tanggalLahir || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Impor Data Siswa Cerdas</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl leading-none">&times;</button>
                </div>
                <div className="overflow-y-auto p-6 flex-grow">
                    {isLoading && <div className="text-center p-10"><p className="text-slate-600 animate-pulse">Menganalisis file Anda dengan AI...</p></div>}
                    {!isLoading && error && <div className="text-center p-10 text-red-600 bg-red-50 rounded-lg">{error}</div>}
                    {!isLoading && !error && !file && renderFileDropzone()}
                    {!isLoading && !error && file && renderMappingUI()}
                </div>
                {file && !isLoading && (
                    <div className="flex justify-end items-center p-4 border-t">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button type="button" onClick={handleImportClick} disabled={!mapping.namaLengkap} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                            Impor {previewData.length > 0 ? `${fileRows.length} Siswa` : ''}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartImportModal;
