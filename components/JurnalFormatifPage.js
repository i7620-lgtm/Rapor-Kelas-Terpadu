import React, { useState, useEffect } from 'react';
import { FORMATIVE_ASSESSMENT_TYPES } from '../constants.js';

const NoteEditorModal = ({ isOpen, onClose, onSave, studentName, noteToEdit, showToast }) => {
    const isEditing = !!noteToEdit;
    const [noteData, setNoteData] = useState({});

    useEffect(() => {
        if (isOpen) {
            setNoteData(isEditing ? { ...noteToEdit } : {
                id: null,
                date: new Date().toISOString().split('T')[0],
                topic: '',
                type: FORMATIVE_ASSESSMENT_TYPES[0],
                note: ''
            });
        }
    }, [isOpen, noteToEdit, isEditing]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNoteData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!noteData.note.trim()) {
            showToast('Catatan tidak boleh kosong.', 'error');
            return;
        }
        onSave(noteData);
        onClose();
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col" },
                React.createElement('div', { className: "p-4 border-b" },
                    React.createElement('h3', { className: "text-lg font-bold text-slate-800" }, isEditing ? 'Edit Catatan Formatif' : 'Tambah Catatan Baru'),
                    React.createElement('p', { className: "text-sm text-slate-500" }, `Untuk: ${studentName}`)
                ),
                React.createElement('div', { className: "p-6 space-y-4" },
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'date', className: "block text-sm font-medium text-slate-700" }, "Tanggal"),
                            React.createElement('input', { type: "date", name: "date", id: "date", value: noteData.date || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md" })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'topic', className: "block text-sm font-medium text-slate-700" }, "Topik/Mapel (Opsional)"),
                            React.createElement('input', { type: "text", name: "topic", id: "topic", value: noteData.topic || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md", placeholder: "Contoh: IPAS Bab 1" })
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: 'type', className: "block text-sm font-medium text-slate-700" }, "Jenis Asesmen"),
                        React.createElement('select', { name: "type", id: "type", value: noteData.type || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md" },
                            FORMATIVE_ASSESSMENT_TYPES.map(type => React.createElement('option', { key: type, value: type }, type))
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: 'note', className: "block text-sm font-medium text-slate-700" }, "Catatan/Observasi"),
                        React.createElement('textarea', { name: "note", id: "note", value: noteData.note || '', onChange: handleChange, rows: "5", className: "mt-1 block w-full p-2 border border-slate-300 rounded-md", placeholder: "Tuliskan observasi Anda di sini..." })
                    )
                ),
                React.createElement('div', { className: "flex justify-end p-4 border-t bg-slate-50" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm bg-white border rounded-md" }, "Batal"),
                    React.createElement('button', { onClick: handleSave, className: "ml-3 px-4 py-2 text-sm text-white bg-indigo-600 rounded-md" }, isEditing ? 'Simpan Perubahan' : 'Simpan Catatan')
                )
            )
        )
    );
};

const StudentJournalModal = ({ isOpen, onClose, student, notes, onUpdate, onDelete, showToast }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState(null);

    const handleAddNew = () => {
        setNoteToEdit(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (note) => {
        setNoteToEdit(note);
        setIsEditorOpen(true);
    };

    const handleDelete = (noteId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
            onDelete(student.id, noteId);
            showToast('Catatan berhasil dihapus.', 'success');
        }
    };

    const handleSaveNote = (noteData) => {
        onUpdate(student.id, noteData);
        showToast(noteData.id ? 'Catatan berhasil diperbarui.' : 'Catatan baru berhasil disimpan.', 'success');
    };
    
    if (!isOpen) return null;

    return (
        React.createElement(React.Fragment, null,
            React.createElement(NoteEditorModal, { isOpen: isEditorOpen, onClose: () => setIsEditorOpen(false), onSave: handleSaveNote, studentName: student.namaLengkap, noteToEdit: noteToEdit, showToast: showToast }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" },
                    React.createElement('div', { className: "flex justify-between items-center p-4 border-b" },
                        React.createElement('div', null,
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Jurnal Formatif Siswa"),
                            React.createElement('p', { className: "text-sm text-slate-500" }, student.namaLengkap)
                        ),
                        React.createElement('button', { onClick: handleAddNew, className: "px-4 py-2 text-sm text-white bg-indigo-600 rounded-md" }, "+ Tambah Catatan Baru")
                    ),
                    React.createElement('div', { className: "p-6 overflow-y-auto" },
                        notes && notes.length > 0 ? (
                            React.createElement('div', { className: "space-y-4" },
                                notes.map(note => (
                                    React.createElement('div', { key: note.id, className: "p-4 border rounded-lg bg-slate-50" },
                                        React.createElement('div', { className: "flex justify-between items-start" },
                                            React.createElement('div', null,
                                                React.createElement('p', { className: "text-sm font-semibold text-slate-800" }, `[${new Date(note.date).toLocaleDateString('id-ID')}] ${note.topic || note.type}`),
                                                React.createElement('p', { className: "text-xs text-slate-500" }, `Jenis: ${note.type}`)
                                            ),
                                            React.createElement('div', { className: "flex gap-2" },
                                                React.createElement('button', { onClick: () => handleEdit(note), className: "text-xs font-medium text-indigo-600" }, "Edit"),
                                                React.createElement('button', { onClick: () => handleDelete(note.id), className: "text-xs font-medium text-red-600" }, "Hapus")
                                            )
                                        ),
                                        React.createElement('p', { className: "mt-2 text-sm text-slate-700 whitespace-pre-wrap" }, note.note)
                                    )
                                ))
                            )
                        ) : (
                            React.createElement('p', { className: "text-center text-slate-500 py-10" }, "Belum ada catatan formatif untuk siswa ini.")
                        )
                    ),
                    React.createElement('div', { className: "flex justify-end p-4 border-t" },
                        React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm bg-slate-100 rounded-md" }, "Tutup")
                    )
                )
            )
        )
    );
};


const JurnalFormatifPage = ({ students, formativeJournal, onUpdate, onDelete, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const handleOpenModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    return (
        React.createElement('div', { className: "space-y-6" },
            selectedStudent && React.createElement(StudentJournalModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                student: selectedStudent, 
                notes: formativeJournal[selectedStudent.id] || [],
                onUpdate: onUpdate,
                onDelete: onDelete,
                showToast: showToast
            }),
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Jurnal Formatif"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Catat perkembangan dan observasi harian siswa. Data di sini tidak akan memengaruhi nilai rapor.")
            ),
            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Siswa"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center" }, "Jumlah Catatan"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center" }, "Aksi")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => {
                                    const noteCount = formativeJournal[student.id]?.length || 0;
                                    return (
                                        React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-6 py-4" }, index + 1),
                                            React.createElement('td', { className: "px-6 py-4 font-medium text-slate-900" }, student.namaLengkap),
                                            React.createElement('td', { className: "px-6 py-4 text-center" }, noteCount),
                                            React.createElement('td', { className: "px-6 py-4 text-center" },
                                                React.createElement('button', {
                                                    onClick: () => handleOpenModal(student),
                                                    className: "text-indigo-600 hover:text-indigo-900 font-medium"
                                                },
                                                    "Lihat & Tambah Catatan"
                                                )
                                            )
                                        )
                                    )
                                })
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: "4", className: "text-center py-10 text-slate-500" },
                                        "Belum ada data siswa. Silakan tambahkan siswa di halaman 'Data Siswa'."
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

export default JurnalFormatifPage;
