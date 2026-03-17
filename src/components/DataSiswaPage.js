

import React, { useState, useEffect, useMemo } from 'react';
import { studentFieldDefinitions } from '../constants.js';

const emptyStudent = studentFieldDefinitions.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
}, {});

const BulkAddRowModal = ({ isOpen, onClose, onAdd }) => {
    const [count, setCount] = useState(1);

    useEffect(() => {
        if (isOpen) setCount(1);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const num = parseInt(count, 10);
        if (num > 0) {
            onAdd(num);
            onClose();
        }
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" },
            React.createElement('div', { className: "bg-white rounded-xl shadow-xl w-full max-w-sm p-6" },
                React.createElement('h3', { className: "text-lg font-bold text-zinc-800 mb-2" }, "Tambah Siswa"),
                React.createElement('p', { className: "text-sm text-zinc-600 mb-4" }, "Masukkan jumlah siswa untuk membuat baris kosong."),
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: "mb-4" },
                        React.createElement('label', { className: "block text-sm font-medium text-zinc-700 mb-1" }, "Jumlah Siswa"),
                        React.createElement('input', {
                            type: "number",
                            min: "1",
                            max: "100",
                            value: count,
                            onChange: (e) => setCount(e.target.value),
                            className: "w-full px-3 py-2 border border-zinc-300/60 rounded-lg focus:ring-zinc-900 focus:border-zinc-900",
                            autoFocus: true
                        })
                    ),
                    React.createElement('div', { className: "flex justify-end gap-2" },
                        React.createElement('button', { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-zinc-700 bg-white border border-zinc-300/60 rounded-lg hover:bg-[#fafafa]" }, "Batal"),
                        React.createElement('button', { type: "submit", className: "px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800" }, "Tambahkan")
                    )
                )
            )
        )
    );
};

const DataSiswaPage = ({ students, namaKelas, onBulkSaveStudents, onDeleteStudent, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localStudents, setLocalStudents] = useState(students);

    useEffect(() => {
        setLocalStudents(students);
    }, [students]);

    // Separate columns for fixed (Name) and scrollable (Details)
    const nameField = studentFieldDefinitions.find(f => f.key === 'namaLengkap');
    const otherFields = studentFieldDefinitions.filter(f => f.key !== 'namaLengkap');
    
    // Create a flat array of fields representing the table column order for paste logic
    // Note: The render order in table is Name -> Others.
    const allEditableFields = useMemo(() => [nameField, ...otherFields], [nameField, otherFields]);

    const handleAddNew = () => {
        setIsModalOpen(true);
    };
    
    const handleBulkAdd = (count) => {
        const newStudents = [];
        const timestamp = Date.now();
        for (let i = 0; i < count; i++) {
            newStudents.push({
                ...emptyStudent,
                id: `student_${timestamp}_${i}`
            });
        }
        
        const updatedStudents = [...localStudents, ...newStudents];
        setLocalStudents(updatedStudents);
        onBulkSaveStudents(updatedStudents);
        showToast(`${count} baris siswa baru berhasil ditambahkan.`, 'success');
    };

    const handleDelete = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa ${student.namaLengkap || 'ini'}? Tindakan ini tidak dapat diurungkan.`)) {
            onDeleteStudent(studentId);
            showToast(`Siswa berhasil dihapus.`, 'success');
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
        
        // Split rows by newline, preserving empty rows to maintain index alignment
        let rows = pasteData.split(/\r\n|\n|\r/);
        // Remove the last element if it's empty (trailing newline from Excel copy)
        if (rows.length > 0 && rows[rows.length - 1] === '') {
            rows.pop();
        }

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
            className: "w-full px-2 py-1.5 text-sm text-zinc-700 bg-white border border-zinc-300/60 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-shadow",
            placeholder: fieldDef.placeholder || fieldDef.label // Use specific placeholder or fallback to label
        };

        if (fieldDef.type === 'select') {
            return React.createElement('select', { ...commonProps, className: `${commonProps.className} appearance-none cursor-pointer` },
                React.createElement('option', { value: '' }, "-"),
                fieldDef.options.map(option => React.createElement('option', { key: option, value: option }, option))
            );
        }
        
        if (fieldDef.type === 'date') {
             return React.createElement('input', { ...commonProps, type: 'text' });
        }

        return React.createElement('input', { ...commonProps, type: 'text' });
    };

    return (
        React.createElement('div', { className: "flex flex-col flex-1 min-h-0 min-w-0 h-full gap-4" },
            React.createElement(BulkAddRowModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                onAdd: handleBulkAdd
            }),
            
            // Fixed Header Section
            React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-3xl font-bold text-zinc-800" }, "Data Siswa"),
                    React.createElement('p', { className: "mt-1 text-zinc-600" },
                        "Kelola data identitas siswa di kelas ", namaKelas || '(Nama Kelas Belum Diatur)', ". Perubahan disimpan otomatis.",
                        React.createElement('br', null),
                        React.createElement('span', { className: "text-sm text-zinc-900" }, "💡 Tips: Anda dapat menyalin data dari Excel (blok sel) dan menempelkannya (paste) langsung ke tabel di bawah.")
                    )
                ),
                React.createElement('button', { 
                    onClick: handleAddNew, 
                    className: "px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-transparent rounded-xl shadow-sm hover:bg-zinc-800" 
                }, "+ Tambah Siswa Baru")
            ),

            // Scrollable Table Container
            React.createElement('div', { className: "bg-white border border-zinc-200/60 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-zinc-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-zinc-700 uppercase bg-zinc-100/50 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-3 py-3 text-center border-b border-zinc-200/60 w-12 sticky left-0 z-40 bg-zinc-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-left border-b border-zinc-200/60 min-w-[250px]" }, "Nama Lengkap"),
                                otherFields.map(field => 
                                    React.createElement('th', { key: field.key, scope: "col", className: "px-4 py-3 border-b border-zinc-200/60 min-w-[180px] whitespace-nowrap text-center" }, field.label)
                                ),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-zinc-200/60 w-24" }, "Aksi")
                            )
                        ),
                        React.createElement('tbody', null,
                            localStudents.length > 0 ? (
                                localStudents.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-[#fafafa]" },
                                        React.createElement('td', { className: "px-3 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                        React.createElement('td', { className: "px-4 py-2 border-b border-zinc-200/60" }, 
                                            renderCellInput(student, nameField)
                                        ),
                                        otherFields.map(field => 
                                            React.createElement('td', { key: field.key, className: "px-2 py-2 border-b border-zinc-200/60" }, 
                                                renderCellInput(student, field)
                                            )
                                        ),
                                        React.createElement('td', { className: "px-4 py-2 text-center border-b border-zinc-200/60" },
                                            React.createElement('button', {
                                                onClick: () => handleDelete(student.id),
                                                className: "p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors",
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
                                    React.createElement('td', { colSpan: otherFields.length + 3, className: "text-center py-12" },
                                        React.createElement('div', { className: "bg-zinc-50 border border-zinc-200/60 text-zinc-600 rounded-xl p-6 max-w-md mx-auto shadow-sm" },
                                            React.createElement('h3', { className: "text-lg font-semibold mb-2" }, "Belum ada data siswa"),
                                            React.createElement('p', null, "Silakan tambahkan siswa dengan mengklik tombol '+ Tambah Siswa Baru'.")
                                        )
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
