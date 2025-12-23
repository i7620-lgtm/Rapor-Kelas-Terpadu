
import React, { useState, useEffect, useMemo } from 'react';
import { FORMATIVE_ASSESSMENT_TYPES } from '../constants.js';
import { getGradeNumber } from './DataNilaiPage.js';

const NoteEditorModal = ({ isOpen, onClose, onSave, studentName, noteToEdit, showToast, subjects = [], grades = [], settings = {}, predefinedCurriculum }) => {
    const isEditing = !!noteToEdit;
    const [noteData, setNoteData] = useState({});
    
    // State for dependent dropdowns
    const [availableSlms, setAvailableSlms] = useState([]);
    const [availableTps, setAvailableTps] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setNoteData(isEditing ? { ...noteToEdit } : {
                id: null,
                date: new Date().toISOString().split('T')[0],
                topic: '',
                subjectId: '',
                slmId: '', // Will store the SLM Name string directly now
                tpId: '', // Will store the TP Text string directly
                type: FORMATIVE_ASSESSMENT_TYPES[0],
                note: ''
            });
        }
    }, [isOpen, noteToEdit, isEditing]);

    // Update available SLMs when Subject changes
    useEffect(() => {
        if (!noteData.subjectId || !predefinedCurriculum) {
            setAvailableSlms([]);
            return;
        }
        
        const subject = subjects.find(s => s.id === noteData.subjectId);
        if (subject) {
            const curriculumKey = subject.curriculumKey || subject.fullName;
            if (predefinedCurriculum[curriculumKey]) {
                const slms = predefinedCurriculum[curriculumKey].map(item => ({
                    id: item.slm, 
                    name: item.slm
                }));
                setAvailableSlms(slms);
            } else {
                setAvailableSlms([]);
            }
        } else {
            setAvailableSlms([]);
        }
    }, [noteData.subjectId, predefinedCurriculum, subjects]);

    // Update available TPs when SLM changes
    useEffect(() => {
        if (!noteData.subjectId || !noteData.slmId || !predefinedCurriculum) {
            setAvailableTps([]);
            return;
        }
        
        const subject = subjects.find(s => s.id === noteData.subjectId);
        if (subject) {
            const curriculumKey = subject.curriculumKey || subject.fullName;
            if (predefinedCurriculum[curriculumKey]) {
                const slmItem = predefinedCurriculum[curriculumKey].find(item => item.slm === noteData.slmId);
                if (slmItem && slmItem.tp) {
                    setAvailableTps(slmItem.tp);
                } else {
                    setAvailableTps([]);
                }
            } else {
                setAvailableTps([]);
            }
        } else {
            setAvailableTps([]);
        }
    }, [noteData.subjectId, noteData.slmId, predefinedCurriculum, subjects]);


    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNoteData(prev => {
            const updates = { [name]: value };
            // Reset dependent fields if parent changes
            if (name === 'subjectId') {
                updates.slmId = '';
                updates.tpId = '';
            }
            if (name === 'slmId') {
                updates.tpId = '';
            }
            return { ...prev, ...updates };
        });
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
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" },
                React.createElement('div', { className: "p-4 border-b flex-shrink-0" },
                    React.createElement('h3', { className: "text-lg font-bold text-slate-800" }, isEditing ? 'Edit Catatan Formatif' : 'Tambah Catatan Baru'),
                    React.createElement('p', { className: "text-sm text-slate-500" }, `Untuk: ${studentName}`)
                ),
                React.createElement('div', { className: "p-6 space-y-4 overflow-y-auto" },
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'date', className: "block text-sm font-medium text-slate-700" }, "Tanggal"),
                            React.createElement('input', { type: "date", name: "date", id: "date", value: noteData.date || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm" })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'type', className: "block text-sm font-medium text-slate-700" }, "Jenis Asesmen"),
                            React.createElement('select', { name: "type", id: "type", value: noteData.type || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm" },
                                FORMATIVE_ASSESSMENT_TYPES.map(type => React.createElement('option', { key: type, value: type }, type))
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: "space-y-3 pt-2 border-t border-slate-100" },
                        React.createElement('p', { className: "text-xs font-semibold text-slate-500 uppercase tracking-wider" }, "Konteks Pembelajaran (Opsional)"),
                        
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'subjectId', className: "block text-sm font-medium text-slate-700" }, "Mata Pelajaran"),
                            React.createElement('select', { name: "subjectId", id: "subjectId", value: noteData.subjectId || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm" },
                                React.createElement('option', { value: "" }, "- Pilih Mapel (Opsional) -"),
                                subjects.filter(s => s.active).map(s => React.createElement('option', { key: s.id, value: s.id }, s.label))
                            )
                        ),

                        noteData.subjectId && (
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: 'slmId', className: "block text-sm font-medium text-slate-700" }, "Lingkup Materi (SLM)"),
                                React.createElement('select', { name: "slmId", id: "slmId", value: noteData.slmId || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm" },
                                    React.createElement('option', { value: "" }, "- Pilih Lingkup Materi (Opsional) -"),
                                    availableSlms.map(slm => React.createElement('option', { key: slm.id, value: slm.id }, slm.name))
                                )
                            )
                        ),

                        noteData.slmId && (
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: 'tpId', className: "block text-sm font-medium text-slate-700" }, "Tujuan Pembelajaran (TP)"),
                                React.createElement('select', { name: "tpId", id: "tpId", value: noteData.tpId || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm" },
                                    React.createElement('option', { value: "" }, "- Pilih TP (Opsional) -"),
                                    availableTps.map((tp, idx) => React.createElement('option', { key: idx, value: tp }, tp))
                                )
                            )
                        ),

                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'topic', className: "block text-sm font-medium text-slate-700" }, "Topik Lainnya / Catatan Tambahan"),
                            React.createElement('input', { type: "text", name: "topic", id: "topic", value: noteData.topic || '', onChange: handleChange, className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm", placeholder: "Contoh: Perilaku di Kantin, Kebersihan, dll." })
                        )
                    ),

                    React.createElement('div', {className: "pt-2 border-t border-slate-100"},
                        React.createElement('label', { htmlFor: 'note', className: "block text-sm font-medium text-slate-700" }, "Catatan/Observasi"),
                        React.createElement('textarea', { name: "note", id: "note", value: noteData.note || '', onChange: handleChange, rows: "5", className: "mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm", placeholder: "Tuliskan observasi Anda di sini..." })
                    )
                ),
                React.createElement('div', { className: "flex justify-end p-4 border-t bg-slate-50 rounded-b-lg flex-shrink-0" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50" }, "Batal"),
                    React.createElement('button', { onClick: handleSave, className: "ml-3 px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700" }, isEditing ? 'Simpan Perubahan' : 'Simpan Catatan')
                )
            )
        )
    );
};

const StudentJournalModal = ({ isOpen, onClose, student, notes, onUpdate, onDelete, showToast, subjects, grades, settings, predefinedCurriculum }) => {
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
    
    const getSlmName = (note) => {
        // First check if slmId contains the name directly (new behavior)
        if (note.slmId && !note.slmId.startsWith('slm_')) {
            return note.slmId;
        }
        // Fallback to looking up in grades (legacy behavior for existing notes)
        const fromGrades = grades[0]?.detailedGrades?.[note.subjectId]?.slm?.find(s => s.id === note.slmId)?.name;
        return fromGrades || note.slmId || '-';
    };

    if (!isOpen) return null;

    return (
        React.createElement(React.Fragment, null,
            React.createElement(NoteEditorModal, { 
                isOpen: isEditorOpen, 
                onClose: () => setIsEditorOpen(false), 
                onSave: handleSaveNote, 
                studentName: student.namaLengkap, 
                noteToEdit: noteToEdit, 
                showToast: showToast,
                subjects: subjects,
                grades: grades,
                settings: settings,
                predefinedCurriculum: predefinedCurriculum
            }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" },
                    React.createElement('div', { className: "flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-lg" },
                        React.createElement('div', null,
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Jurnal Formatif Siswa"),
                            React.createElement('p', { className: "text-sm text-slate-500" }, student.namaLengkap)
                        ),
                        React.createElement('button', { onClick: handleAddNew, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm" }, "+ Tambah Catatan Baru")
                    ),
                    React.createElement('div', { className: "p-6 overflow-y-auto bg-slate-100" },
                        notes && notes.length > 0 ? (
                            React.createElement('div', { className: "space-y-4" },
                                notes.map(note => {
                                    const subjectLabel = subjects.find(s => s.id === note.subjectId)?.label;
                                    const slmName = getSlmName(note);
                                    return (
                                    React.createElement('div', { key: note.id, className: "p-4 border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow" },
                                        React.createElement('div', { className: "flex justify-between items-start mb-3" },
                                            React.createElement('div', null,
                                                React.createElement('div', { className: "flex items-center gap-2 mb-1" },
                                                    React.createElement('span', { className: "px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700" }, new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })),
                                                    React.createElement('span', { className: "px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800" }, note.type),
                                                    subjectLabel && React.createElement('span', { className: "px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800" }, subjectLabel)
                                                ),
                                                (note.topic || note.tpId) && (
                                                    React.createElement('p', { className: "text-sm font-semibold text-slate-800 mt-1" }, 
                                                        note.topic ? note.topic : (note.tpId ? (note.tpId.length > 100 ? note.tpId.substring(0, 100) + '...' : note.tpId) : '')
                                                    )
                                                )
                                            ),
                                            React.createElement('div', { className: "flex gap-2" },
                                                React.createElement('button', { onClick: () => handleEdit(note), className: "text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded" }, "Edit"),
                                                React.createElement('button', { onClick: () => handleDelete(note.id), className: "text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded" }, "Hapus")
                                            )
                                        ),
                                        React.createElement('div', { className: "text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-slate-200" }, note.note),
                                        (note.slmId && note.tpId) && (
                                            React.createElement('div', { className: "mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex flex-col gap-0.5" },
                                                React.createElement('span', null, `Lingkup Materi: ${slmName}`),
                                                React.createElement('span', null, `TP: ${note.tpId}`)
                                            )
                                        )
                                    )
                                )})
                            )
                        ) : (
                            React.createElement('div', { className: "flex flex-col items-center justify-center py-12 text-slate-500" },
                                React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 mb-4 text-slate-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" })
                                ),
                                React.createElement('p', null, "Belum ada catatan formatif untuk siswa ini."),
                                React.createElement('p', { className: "text-sm mt-1" }, "Klik tombol 'Tambah Catatan Baru' untuk memulai.")
                            )
                        )
                    ),
                    React.createElement('div', { className: "flex justify-end p-4 border-t bg-white rounded-b-lg" },
                        React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm bg-slate-100 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-200 font-medium" }, "Tutup")
                    )
                )
            )
        )
    );
};


const JurnalFormatifPage = ({ students, formativeJournal, onUpdate, onDelete, showToast, subjects, grades, settings, predefinedCurriculum }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const handleOpenModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    return (
        React.createElement('div', { className: "space-y-6 h-full flex flex-col" },
            selectedStudent && React.createElement(StudentJournalModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                student: selectedStudent, 
                notes: formativeJournal[selectedStudent.id] || [],
                onUpdate: onUpdate,
                onDelete: onDelete,
                showToast: showToast,
                subjects: subjects,
                grades: grades,
                settings: settings,
                predefinedCurriculum: predefinedCurriculum
            }),
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Jurnal Formatif"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Catat perkembangan, observasi harian, dan asesmen formatif siswa. Catatan ini membantu dalam memantau proses belajar namun tidak mempengaruhi nilai rapor secara langsung.")
            ),
            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-3 py-3 sticky left-0 z-40 bg-slate-100 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-slate-200" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 min-w-[250px] border-b border-slate-200" }, "Nama Siswa"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center border-b border-slate-200" }, "Jumlah Catatan"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center border-b border-slate-200" }, "Aksi")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => {
                                    const noteCount = formativeJournal[student.id]?.length || 0;
                                    return (
                                        React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-3 py-2 text-center border-b border-slate-200 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                            React.createElement('td', { className: "px-6 py-4 font-medium text-slate-900 border-b border-slate-200" }, student.namaLengkap),
                                            React.createElement('td', { className: "px-6 py-4 text-center border-b border-slate-200" }, 
                                                React.createElement('span', { className: `inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${noteCount > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}` },
                                                    noteCount
                                                )
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 text-center border-b border-slate-200" },
                                                React.createElement('button', {
                                                    onClick: () => handleOpenModal(student),
                                                    className: "text-indigo-600 hover:text-indigo-900 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                                                },
                                                    "Lihat & Tambah Catatan"
                                                )
                                            )
                                        )
                                    )
                                })
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: "4", className: "text-center py-12 text-slate-500 italic border-b border-slate-200" },
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
