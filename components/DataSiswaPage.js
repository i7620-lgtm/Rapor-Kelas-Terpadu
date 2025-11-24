import React, { useState, useEffect, useMemo } from 'react';
import { studentFieldDefinitions } from '../constants.js';

const emptyStudent = studentFieldDefinitions.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
}, {});

const StudentModal = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const isEditing = !!studentToEdit;
    const [formData, setFormData] = useState(emptyStudent);

    useEffect(() => {
        if (isOpen) {
            setFormData(isEditing ? { ...studentToEdit } : emptyStudent);
        }
    }, [isOpen, studentToEdit, isEditing]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    
    const renderField = (fieldDef) => {
        const commonProps = {
            id: fieldDef.key,
            name: fieldDef.key,
            value: formData[fieldDef.key] || '',
            onChange: handleChange,
            required: fieldDef.key === 'namaLengkap',
            className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        };

        let fieldElement;
        switch (fieldDef.type) {
            case 'textarea':
                fieldElement = React.createElement('textarea', { ...commonProps, rows: 2 });
                break;
            case 'select':
                fieldElement = React.createElement('select', commonProps,
                    React.createElement('option', { value: '' }, `Pilih ${fieldDef.label}...`),
                    fieldDef.options.map(option => React.createElement('option', { key: option, value: option }, option))
                );
                break;
            case 'date':
                fieldElement = React.createElement('input', { ...commonProps, type: 'date' });
                break;
            default: // 'text'
                fieldElement = React.createElement('input', { ...commonProps, type: 'text', placeholder: fieldDef.description });
                break;
        }

        return React.createElement('div', { key: fieldDef.key, className: "col-span-1" },
            React.createElement('label', { htmlFor: commonProps.id, className: "block text-sm font-medium text-slate-700" }, fieldDef.label),
            fieldElement
        );
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4", "aria-modal": "true", role: "dialog" },
            React.createElement('div', { className: "bg-slate-50 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col" },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'),
                    React.createElement('button', { onClick: onClose, className: "text-slate-500 hover:text-slate-800 text-2xl" }, "\u00d7")
                ),
                React.createElement('form', { onSubmit: handleSubmit, className: "overflow-y-auto p-6" },
                   React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4" },
                        studentFieldDefinitions.map(fieldDef => renderField(fieldDef))
                    ),
                    React.createElement('div', { className: "flex justify-end items-center p-4 border-t mt-6 -mx-6 -mb-6 bg-slate-100 rounded-b-lg" },
                        React.createElement('button', { type: "button", onClick: onClose, className: "bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50" }, "Batal"),
                        React.createElement('button', { type: "submit", className: "ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700" }, isEditing ? "Simpan Perubahan" : "Simpan Siswa")
                    )
                )
            )
        )
    );
};


const DataSiswaPage = ({ students, namaKelas, onSaveStudent, onBulkSaveStudents, onDeleteStudent, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localStudents, setLocalStudents] = useState(students);

    useEffect(() => {
        setLocalStudents(students);
    }, [students]);

    // Separate columns for fixed (Name) and scrollable (Details)
    const nameField = studentFieldDefinitions.find(f => f.key === 'namaLengkap');
    const otherFields = studentFieldDefinitions.filter(f => f.key !== 'namaLengkap');
    // Create a flat array of fields representing the table column order for paste logic
    const allEditableFields = useMemo(() => [nameField, ...otherFields], [nameField, otherFields]);

    const handleAddNew = () => {
        setIsModalOpen(true);
    };

    const handleDelete = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa bernama ${student.namaLengkap}? Tindakan ini tidak dapat diurungkan.`)) {
            onDeleteStudent(studentId);
            showToast(`Siswa ${student.namaLengkap} berhasil dihapus.`, 'success');
        }
    };

    const handleInputChange = (studentId, fieldKey, value) => {
        setLocalStudents(prev => 
            prev.map(s => s.id === studentId ? { ...s, [fieldKey]: value } : s)
        );
    };

    const handleInputBlur = () => {
        onBulkSaveStudents(localStudents);
    };

    const handlePaste = (e, startStudentId, startFieldKey) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        // Split rows by newline
        const rows = pasteData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');

        if (rows.length === 0) return;

        const startStudentIndex = localStudents.findIndex(s => s.id === startStudentId);
        const startFieldIndex = allEditableFields.findIndex(f => f.key === startFieldKey);

        if (startStudentIndex === -1 || startFieldIndex === -1) return;

        const newStudents = [...localStudents];
        let updatedCount = 0;

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = startStudentIndex + rIndex;
            // Stop if we run out of students
            if (currentStudentIndex >= newStudents.length) return;

            // Split columns by tab
            const columns = row.split('\t');

            columns.forEach((value, cIndex) => {
                const currentFieldIndex = startFieldIndex + cIndex;
                // Stop if we run out of fields/columns
                if (currentFieldIndex >= allEditableFields.length) return;

                const targetField = allEditableFields[currentFieldIndex];
                const rawValue = value.trim();

                // Update the specific field for the specific student
                newStudents[currentStudentIndex] = {
                    ...newStudents[currentStudentIndex],
                    [targetField.key]: rawValue
                };
                updatedCount++;
            });
        });

        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
        showToast(`${updatedCount} data berhasil ditempel (paste).`, 'success');
    };

    const renderCellInput = (student, fieldDef) => {
        const commonProps = {
            id: `${student.id}-${fieldDef.key}`,
            name: fieldDef.key,
            value: student[fieldDef.key] || '',
            onChange: (e) => handleInputChange(student.id, fieldDef.key, e.target.value),
            onBlur: handleInputBlur,
            onPaste: (e) => handlePaste(e, student.id, fieldDef.key),
            className: "w-full px-2 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
        };

        if (fieldDef.type === 'select') {
            return React.createElement('select', { ...commonProps, className: `${commonProps.className} appearance-none cursor-pointer` },
                React.createElement('option', { value: '' }, "-"),
                fieldDef.options.map(option => React.createElement('option', { key: option, value: option }, option))
            );
        }
        
        if (fieldDef.type === 'date') {
             return React.createElement('input', { ...commonProps, type: 'date' });
        }

        return React.createElement('input', { ...commonProps, type: 'text', placeholder: "..." });
    };

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
            React.createElement(StudentModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                onSave: onSaveStudent
            }),
            
            // Fixed Header Section
            React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Siswa"),
                    React.createElement('p', { className: "mt-1 text-slate-600" },
                        "Kelola data identitas siswa di kelas ", namaKelas || '(Nama Kelas Belum Diatur)', ". Perubahan disimpan otomatis.",
                        React.createElement('br', null),
                        React.createElement('span', { className: "text-sm text-indigo-600" }, "💡 Tips: Anda dapat menyalin data dari Excel (blok sel) dan menempelkannya (paste) langsung ke tabel di bawah.")
                    )
                ),
                React.createElement('button', { 
                    onClick: handleAddNew, 
                    className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" 
                }, "+ Tambah Siswa Baru")
            ),

            // Scrollable Table Container
            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-3 py-3 text-center border-b border-slate-200 w-12 sticky left-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-left border-b border-slate-200 min-w-[250px]" }, "Nama Lengkap"),
                                otherFields.map(field => 
                                    React.createElement('th', { key: field.key, scope: "col", className: "px-4 py-3 border-b border-slate-200 min-w-[180px] whitespace-nowrap text-center" }, field.label)
                                ),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-slate-200 w-24" }, "Aksi")
                            )
                        ),
                        React.createElement('tbody', null,
                            localStudents.length > 0 ? (
                                localStudents.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                        React.createElement('td', { className: "px-3 py-2 text-center border-b border-slate-200 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                        React.createElement('td', { className: "px-4 py-2 border-b border-slate-200" }, 
                                            renderCellInput(student, nameField)
                                        ),
                                        otherFields.map(field => 
                                            React.createElement('td', { key: field.key, className: "px-2 py-2 border-b border-slate-200" }, 
                                                renderCellInput(student, field)
                                            )
                                        ),
                                        React.createElement('td', { className: "px-4 py-2 text-center border-b border-slate-200" },
                                            React.createElement('button', {
                                                onClick: () => handleDelete(student.id),
                                                className: "p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-200 transition-colors",
                                                title: `Hapus ${student.namaLengkap}`
                                            }, 
                                                React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
                                                )
                                            )
                                        )
                                    )
                                ))
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: otherFields.length + 3, className: "text-center py-12 text-slate-500 italic" },
                                        "Belum ada data siswa. Klik 'Tambah Siswa Baru' di pojok kanan atas untuk memulai."
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

export default DataSiswaPage;
