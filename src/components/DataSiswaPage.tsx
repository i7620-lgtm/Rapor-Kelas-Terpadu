

import React from 'react';
import { EmptyState } from './EmptyState';
import { BulkAddRowModal } from './DataSiswa/BulkAddRowModal';
import { SiswaTableRow } from './DataSiswa/SiswaTableRow';
import { useDataSiswaPageLogic } from './DataSiswa/useDataSiswaPageLogic';
import { processAndCropImage3x4 } from '../utils/imageDB';

const DataSiswaPage = (props) => {
    const logic = useDataSiswaPageLogic(props);
    const {
        students: localStudents,
        namaKelas,
        isModalOpen,
        setIsModalOpen,
        handleAddNew,
        handleBulkAdd,
        handleMoveStudent,
        handleDelete,
        handleInputChange,
        handleInputBlur,
        handlePaste,
        handleBulkPhotoUpload,
        isSelecting,
        setIsSelecting,
        getSelectionStyle,
        handleMouseDownCell,
        handleMouseEnterCell,
        handleFocusCell,
        nameField,
        otherFields,
        setLocalStudents,
        onBulkSaveStudents
    } = logic;

    const renderCellInput = (student, fieldDef, rowIndex, colIndex) => {
        const isFilled = student[fieldDef.key] && String(student[fieldDef.key]).trim() !== '';
        
        const { selectionStyle, showTransparentInput } = getSelectionStyle(rowIndex, colIndex);
        
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
                  : `bg-transparent border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-zinc-100 ${
                      !isFilled ? "bg-red-50/50 hover:bg-red-50/80" : ""
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

        const isNameField = fieldDef.key === "namaLengkap";
        const wrapperProps = {
            className: `px-2 py-2 border-b border-zinc-200/60 relative cursor-default select-none ${isNameField ? 'lg:sticky lg:left-[50px] lg:z-20 bg-white lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''} group-hover:bg-zinc-50`,
            style: { ...selectionStyle },
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
                    if (props.showToast) props.showToast("File harus berupa gambar", "error");
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    if (props.showToast) props.showToast("Ukuran foto terlalu besar. Maksimal 5MB.", "error");
                    return;
                }
                
                try {
                    const base64Data = await processAndCropImage3x4(file, 354, 472, 0.9);
                    setLocalStudents(prev => {
                        const newStudents = prev.map(s => s.id === student.id ? { ...s, [fieldDef.key]: base64Data } : s);
                        onBulkSaveStudents(newStudents);
                        return newStudents;
                    });
                    if (props.showToast) props.showToast("Foto berhasil diunggah", "success");
                } catch {
                    if (props.showToast) props.showToast("Gagal memproses foto", "error");
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
                React.createElement('div', { className: "flex-1 overflow-auto select-none siswa-table-container h-[70vh]" },
                    localStudents.length > 0 ? (
                        React.createElement('table', { className: "w-full text-sm text-left text-zinc-500 border-separate border-spacing-0" },
                            React.createElement('thead', { className: "text-xs text-zinc-700 uppercase bg-zinc-100 shadow-sm z-30" },
                                React.createElement('tr', null,
                                    React.createElement('th', { 
                                        scope: "col", 
                                        className: "w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 text-center border-b border-zinc-200/60 sticky top-0 left-0 z-40 bg-zinc-100 cursor-default select-none",
                                        style: getSelectionStyle(-1, -1).selectionStyle,
                                        onMouseDown: (e) => {
                                            if (e.button !== 0) return;
                                            handleMouseDownCell(e, -1, -1);
                                        },
                                        onMouseEnter: () => handleMouseEnterCell(-1, -1),
                                    }, "No"),
                                    React.createElement('th', { 
                                        scope: "col", 
                                        className: "px-4 py-3 text-left border-b border-zinc-200/60 min-w-[250px] sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-zinc-100 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-default select-none",
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
                                            className: "px-4 py-3 border-b border-zinc-200/60 min-w-[180px] whitespace-nowrap text-center sticky top-0 bg-zinc-100 z-30 cursor-default select-none",
                                            style: getSelectionStyle(-1, colIndex).selectionStyle,
                                            onMouseDown: (e) => {
                                                if (e.button !== 0) return;
                                                handleMouseDownCell(e, -1, colIndex);
                                            },
                                            onMouseEnter: () => handleMouseEnterCell(-1, colIndex),
                                        }, field.label);
                                    }),
                                    React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-zinc-200/60 min-w-[100px] sticky top-0 bg-zinc-100 z-30" }, "Aksi")
                                )
                            ),
                            React.createElement('tbody', null,
                                localStudents.map((student, rowIndex) => 
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-[#fafafa]" },
                                        React.createElement(SiswaTableRow, {
                                            student: student,
                                            rowIndex: rowIndex,
                                            otherFields: otherFields,
                                            nameField: nameField,
                                            getSelectionStyle: getSelectionStyle,
                                            handleMouseDownCell: handleMouseDownCell,
                                            handleMouseEnterCell: handleMouseEnterCell,
                                            handleMoveStudent: handleMoveStudent,
                                            renderCellInput: renderCellInput,
                                            handleDelete: handleDelete,
                                            isLastRow: rowIndex === localStudents.length - 1
                                        })
                                    )
                                )
                            )
                        )
                    ) : (
                        React.createElement('table', { className: "w-full border-separate border-spacing-0" },
                            React.createElement('tbody', null,
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: otherFields.length + 3, className: "p-0" },
                                        React.createElement(EmptyState, {
                                            title: "Belum ada data siswa",
                                            description: "Mulai kelola data kelas dengan menambahkan siswa baru secara manual. Anda juga dapat mengimpor data sekaligus dari Excel yang sudah terisi melalui menu Data -> Import (jika tersedia).",
                                            primaryActionLabel: "+ Tambah Siswa Baru",
                                            onPrimaryAction: handleAddNew
                                        })
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