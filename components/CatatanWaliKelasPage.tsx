import React, { useState, useCallback, useRef } from 'react';
import { Student, StudentNotes, NoteTemplate } from '../types.ts';

interface CatatanWaliKelasPageProps {
    students: Student[];
    notes: StudentNotes;
    onUpdateNote: (studentId: number, note: string) => void;
    onBulkUpdateNotes: (newNotes: StudentNotes) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    noteTemplates: NoteTemplate[];
}

const CatatanWaliKelasPage: React.FC<CatatanWaliKelasPageProps> = ({ students, notes, onUpdateNote, onBulkUpdateNotes, showToast, noteTemplates }) => {
    const [templateDropdown, setTemplateDropdown] = useState<number | null>(null);

    const handleNoteChange = (studentId: number, note: string) => {
        onUpdateNote(studentId, note);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Catatan Wali Kelas</h2>
                 <p className="mt-1 text-slate-600">Berikan catatan atau umpan balik mengenai perkembangan siswa selama satu semester.</p>
            </div>
            
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
                                            <div className="relative mt-2 text-right">
                                                <button
                                                    onClick={() => setTemplateDropdown(templateDropdown === student.id ? null : student.id)}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Gunakan Template
                                                </button>
                                                {templateDropdown === student.id && (
                                                    <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                                        <ul className="py-1">
                                                            {noteTemplates.map((template) => (
                                                                <li key={template.id}>
                                                                    <a
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            const newNote = template.content.replace(/\[Nama Siswa\]/g, student.namaLengkap);
                                                                            handleNoteChange(student.id, newNote);
                                                                            setTemplateDropdown(null);
                                                                        }}
                                                                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left"
                                                                    >
                                                                        {template.title}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
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
        </div>
    );
};

export default CatatanWaliKelasPage;
