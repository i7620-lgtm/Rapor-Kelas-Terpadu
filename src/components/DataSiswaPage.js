

import React, { useState, useEffect, useMemo } from 'react';
import { studentFieldDefinitions } from '../constants.js';
import { processAndCropImage3x4 } from '../utils/imageDB.js';
import { getClipboardText } from '../utils/clipboard.js';
import { useGridSelection } from '../hooks/useGridSelection.js';

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
                        React.createElement('button', { type: "submit", className: "px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Tambahkan")
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

    const {
        selectionStart,
        isSelecting,
        setIsSelecting,
        getSelectionBounds,
        getSelectionStyle,
        handleMouseDownCell,
        handleMouseEnterCell,
        handleFocusCell
    } = useGridSelection({
        rowsCount: localStudents.length,
        colsCount: allEditableFields.length,
        containerClass: 'siswa-table-container',
        onDeleteSelection: (bounds) => {
            let updatedCount = 0;
            const newStudents = [...localStudents];
            for (let r = bounds.minR; r <= bounds.maxR; r++) {
                for (let c = bounds.minC; c <= bounds.maxC; c++) {
                    if (r >= 0 && c >= 0) {
                        const fieldDef = allEditableFields[c];
                        if (fieldDef && fieldDef.type !== 'photo') {
                            const student = newStudents[r];
                            if (student && student[fieldDef.key] !== "") {
                                student[fieldDef.key] = "";
                                updatedCount++;
                            }
                        }
                    }
                }
            }
            if (updatedCount > 0) {
                setLocalStudents(newStudents);
                onBulkSaveStudents(newStudents);
                if (showToast) showToast(`${updatedCount} data berhasil dihapus.`, "success");
            }
        }
    });

    React.useEffect(() => {
        const handleCopyGlobal = (e) => {
            const bounds = getSelectionBounds();
            if (!bounds) return;

            if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
                if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT")) {
                    return;
                }
            }

            let tsv = "";
            for (let r = bounds.minR; r <= bounds.maxR; r++) {
                let rowData = [];
                for (let c = bounds.minC; c <= bounds.maxC; c++) {
                    if (r === -1) {
                        if (c === -1) rowData.push("No");
                        else {
                            const field = allEditableFields[c];
                            rowData.push(field ? field.label : "");
                        }
                    } else {
                        const student = localStudents[r];
                        if (student) {
                            if (c === -1) {
                                rowData.push(r + 1);
                            } else {
                                const field = allEditableFields[c];
                                if (field && field.type !== 'photo') {
                                    rowData.push(student[field.key] || "");
                                } else {
                                    rowData.push(""); // no text copy for photo
                                }
                            }
                        }
                    }
                }
                tsv += rowData.join("\t") + "\n";
            }

            if (tsv) {
                e.preventDefault();
                e.clipboardData.setData("text/plain", tsv.trimEnd());
                if (showToast) {
                    showToast("Berhasil disalin ke clipboard", "success");
                }
            }
        };

        document.addEventListener("copy", handleCopyGlobal);
        return () => document.removeEventListener("copy", handleCopyGlobal);
    }, [getSelectionBounds, localStudents, allEditableFields, showToast]);

    const handleBulkPhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        showToast(`Memproses ${files.length} foto...`, "info");
        
        let newStudents = [...localStudents];
        let processedCount = 0;
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            // Extract number from filename (e.g., "1.jpg", "01.png", "absen 1.jpg")
            const match = file.name.match(/\d+/);
            if (match) {
                const number = parseInt(match[0], 10);
                if (number > 0 && number <= newStudents.length) {
                    try {
                        const base64Data = await processAndCropImage3x4(file, 354, 472, 0.9);
                        newStudents[number - 1] = { ...newStudents[number - 1], foto: base64Data };
                        processedCount++;
                    } catch (error) {
                        console.error(`Failed to process photo ${file.name}`, error);
                    }
                }
            }
        }
        
        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
        
        if (processedCount > 0) {
            showToast(`Berhasil memproses ${processedCount} foto siswa.`, "success");
        } else {
            showToast("Tidak ada foto yang terpeta ke nomor absen. Pastikan nama file mengandung nomor absen.", "error");
        }
        
        // Reset input
        e.target.value = '';
    };

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

    const handleMoveStudent = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === localStudents.length - 1)) return;
        
        const newStudents = [...localStudents];
        const temp = newStudents[index];
        newStudents[index] = newStudents[index + direction];
        newStudents[index + direction] = temp;
        
        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
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

    const handlePaste = async (e, startStudentId, startFieldKey) => {
        e.preventDefault();
        const pasteData = await getClipboardText(e);
        
        if (!pasteData) return;
        
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

    const renderCellInput = (student, fieldDef, rowIndex, colIndex) => {
        const isFilled = student[fieldDef.key] && String(student[fieldDef.key]).trim() !== '';
        
        const { isCellSelected, selectionStyle, showTransparentInput } = getSelectionStyle(rowIndex, colIndex);
        
        const commonProps = {
            id: `cell-${rowIndex}-${colIndex}`,
            name: fieldDef.key,
            value: student[fieldDef.key] || '',
            onChange: (e) => handleInputChange(student.id, fieldDef.key, e.target.value),
            onBlur: handleInputBlur,
            onFocus: () => handleFocusCell(rowIndex, colIndex),
            onPaste: (e) => handlePaste(e, student.id, fieldDef.key),
            className: `w-full px-2 py-1.5 text-sm rounded-lg transition-all relative z-10 ${
                showTransparentInput
                  ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                  : `bg-white border focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 ${
                      isFilled 
                      ? "border-green-500 ring-1 ring-green-500" 
                      : "border-red-500 ring-1 ring-red-500"
                    }`
            }`,
            placeholder: fieldDef.placeholder || fieldDef.label,
            onMouseDown: (e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    handleMouseDownCell(e, rowIndex, colIndex);
                }
            }
        };

        const wrapperProps = {
            className: "px-2 py-2 border-b border-zinc-200/60 relative cursor-default select-none",
            style: selectionStyle,
            onMouseDown: (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'LABEL' || e.target.tagName === 'IMG') return;
                if (e.button !== 0) return;
                handleMouseDownCell(e, rowIndex, colIndex);
            },
            onMouseEnter: () => handleMouseEnterCell(rowIndex, colIndex),
        };

        if (fieldDef.type === 'select') {
            return React.createElement('td', wrapperProps, 
                React.createElement('select', { ...commonProps, className: `${commonProps.className} appearance-none cursor-pointer` },
                    React.createElement('option', { value: '' }, "-"),
                    fieldDef.options.map(option => React.createElement('option', { key: option, value: option }, option))
                )
            );
        }
        
        if (fieldDef.type === 'photo') {
            const handlePhotoUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.type.startsWith('image/')) {
                    showToast("File harus berupa gambar", "error");
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showToast("Ukuran foto terlalu besar. Maksimal 5MB.", "error");
                    return;
                }
                
                try {
                    const base64Data = await processAndCropImage3x4(file, 354, 472, 0.9);
                    setLocalStudents(prev => {
                        const newStudents = prev.map(s => s.id === student.id ? { ...s, [fieldDef.key]: base64Data } : s);
                        onBulkSaveStudents(newStudents);
                        return newStudents;
                    });
                    showToast("Foto berhasil diunggah", "success");
                } catch (error) {
                    console.error("Failed to process photo:", error);
                    showToast("Gagal memproses foto", "error");
                }
            };

            return React.createElement('td', wrapperProps, 
                React.createElement('div', { className: `flex flex-col items-center min-w-[80px] ${showTransparentInput ? 'opacity-50' : 'opacity-100'}` },
                    React.createElement('label', { className: "cursor-pointer group relative overflow-hidden rounded border border-zinc-300 shadow-sm transition-all hover:border-indigo-400" },
                        student[fieldDef.key] ? React.createElement('img', { src: student[fieldDef.key], alt: "Foto Siswa", className: "w-12 h-16 object-cover" }) : React.createElement('div', { className: "w-12 h-16 bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs text-center p-1 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors" }, "3x4"),
                        React.createElement('input', { type: "file", accept: "image/*", className: "hidden", onChange: handlePhotoUpload })
                    )
                )
            );
        }

        if (fieldDef.type === 'date') {
             return React.createElement('td', wrapperProps, React.createElement('input', { ...commonProps, type: 'text' }));
        }

        return React.createElement('td', wrapperProps, React.createElement('input', { ...commonProps, type: 'text' }));
    };

    return (
        React.createElement('div', { className: "flex flex-col gap-4" },
            React.createElement(BulkAddRowModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                onAdd: handleBulkAdd
            }),
            
            // Fixed Header Section
            React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0 pt-0 pb-2 sm:pb-4" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-3xl font-bold text-zinc-800" }, "Data Siswa"),
                    React.createElement('p', { className: "mt-1 text-zinc-600" },
                        "Kelola data identitas siswa di kelas ", namaKelas || '(Nama Kelas Belum Diatur)', ". Perubahan disimpan otomatis.",
                        React.createElement('br', null),
                        React.createElement('span', { className: "text-sm text-zinc-900" }, "💡 Tips: Anda dapat menyalin data dari Excel (blok sel) dan menempelkannya (paste) langsung ke tabel di bawah."),
                        React.createElement('br', null),
                        React.createElement('span', { className: "text-sm text-zinc-900" }, "💡 Tips: Anda dapat mengupload foto seluruh siswa sekaligus dengan menamai masing-masing foto sesuai dengan nomor absen siswa (contoh: 1.jpg, 2.png, dst).")
                    )
                ),
                React.createElement('div', { className: "flex gap-2" },
                    React.createElement('label', { 
                        className: "cursor-pointer px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm hover:bg-indigo-100 flex items-center justify-center text-center" 
                    }, "Upload Foto",
                        React.createElement('input', { type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: handleBulkPhotoUpload })
                    ),
                    React.createElement('button', { 
                        onClick: handleAddNew, 
                        className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl shadow-sm hover:bg-indigo-700" 
                    }, "+ Tambah Siswa Baru")
                )
            ),

            // Scrollable Table Container
            React.createElement('div', { 
                className: "bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden",
                onMouseLeave: () => {
                    if (isSelecting) setIsSelecting(false);
                }
            },
                React.createElement('div', { className: "flex-1 overflow-auto select-none siswa-table-container" },
                    React.createElement('table', { className: "w-full text-sm text-left text-zinc-500 border-separate border-spacing-0" },
                    React.createElement('thead', { className: "text-xs text-zinc-700 uppercase bg-zinc-100 sticky top-0 z-30 shadow-sm" },
                            React.createElement('tr', null,
                                React.createElement('th', { 
                                    scope: "col", 
                                    className: "px-3 py-3 text-center border-b border-zinc-200/60 w-12 sticky left-0 top-0 z-40 bg-zinc-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none",
                                    style: getSelectionStyle(-1, -1).selectionStyle,
                                    onMouseDown: (e) => {
                                        if (e.button !== 0) return;
                                        handleMouseDownCell(e, -1, -1);
                                    },
                                    onMouseEnter: () => handleMouseEnterCell(-1, -1),
                                }, "No"),
                                React.createElement('th', { 
                                    scope: "col", 
                                    className: "px-4 py-3 text-left border-b border-zinc-200/60 min-w-[250px] relative cursor-default select-none",
                                    style: getSelectionStyle(-1, 0).selectionStyle,
                                    onMouseDown: (e) => {
                                        if (e.button !== 0) return;
                                        handleMouseDownCell(e, -1, 0);
                                    },
                                    onMouseEnter: () => handleMouseEnterCell(-1, 0),
                                }, "Nama Lengkap"),
                                otherFields.map((field, index) => {
                                    const colIndex = index + 1;
                                    return React.createElement('th', { 
                                        key: field.key, 
                                        scope: "col", 
                                        className: "px-4 py-3 border-b border-zinc-200/60 min-w-[180px] whitespace-nowrap text-center relative cursor-default select-none",
                                        style: getSelectionStyle(-1, colIndex).selectionStyle,
                                        onMouseDown: (e) => {
                                            if (e.button !== 0) return;
                                            handleMouseDownCell(e, -1, colIndex);
                                        },
                                        onMouseEnter: () => handleMouseEnterCell(-1, colIndex),
                                    }, field.label);
                                }),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-zinc-200/60 w-24" }, "Aksi")
                            )
                        ),
                        React.createElement('tbody', null,
                            localStudents.length > 0 ? (
                                localStudents.map((student, rowIndex) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-[#fafafa]" },
                                        // No Column -> colIndex: -1
                                        React.createElement('td', { 
                                            className: "px-3 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none",
                                            style: getSelectionStyle(rowIndex, -1).selectionStyle,
                                            onMouseDown: (e) => {
                                                if (e.button !== 0) return;
                                                handleMouseDownCell(e, rowIndex, -1);
                                            },
                                            onMouseEnter: () => handleMouseEnterCell(rowIndex, -1),
                                        }, 
                                            React.createElement('div', { className: "flex flex-col items-center justify-center", onMouseDown: (e) => e.stopPropagation() },
                                                React.createElement('button', {
                                                    onClick: (e) => { e.stopPropagation(); handleMoveStudent(rowIndex, -1); },
                                                    disabled: rowIndex === 0,
                                                    className: `p-0.5 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${rowIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`,
                                                    title: "Pindah ke atas"
                                                },
                                                    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 },
                                                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 15l7-7 7 7" })
                                                    )
                                                ),
                                                React.createElement('span', { className: "text-xs font-semibold text-zinc-700 leading-none my-0.5" }, rowIndex + 1),
                                                React.createElement('button', {
                                                    onClick: (e) => { e.stopPropagation(); handleMoveStudent(rowIndex, 1); },
                                                    disabled: rowIndex === localStudents.length - 1,
                                                    className: `p-0.5 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${rowIndex === localStudents.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`,
                                                    title: "Pindah ke bawah"
                                                },
                                                    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 },
                                                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
                                                    )
                                                )
                                            )
                                        ),
                                        // Name Column -> colIndex: 0
                                        renderCellInput(student, nameField, rowIndex, 0),
                                        // Other Fields Columns -> colIndex: 1 to N
                                        otherFields.map((field, colIndexOffset) => 
                                            React.cloneElement(renderCellInput(student, field, rowIndex, colIndexOffset + 1), { key: field.key })
                                        ),
                                        // Action Column -> Skipped grid selection as it's not a data field
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
