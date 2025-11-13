import React, { useState, useEffect } from 'react';

const DriveDataSelectionModal = ({ isOpen, onClose, onConfirm, files = [], isLoading }) => {
    const [selectedFileId, setSelectedFileId] = useState(null);

    // Reset selection when files change or modal opens
    useEffect(() => {
        if (isOpen && files.length > 0) {
            setSelectedFileId(files[0].id); // Pre-select the first (most recent) file
        } else {
            setSelectedFileId(null);
        }
    }, [isOpen, files]);

    if (!isOpen) {
        return null;
    }

    const handleConfirm = () => {
        if (selectedFileId) {
            onConfirm(selectedFileId);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                React.createElement('div', { className: "text-center p-8" },
                    React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" }),
                    React.createElement('p', { className: "mt-4 text-slate-600" }, "Mencari data di Google Drive...")
                )
            );
        }

        if (files.length === 0) {
            return (
                React.createElement('div', { className: "text-center p-8" },
                    React.createElement('p', { className: "text-slate-600" }, "Tidak ada file data RKT yang ditemukan di Google Drive Anda."),
                    React.createElement('p', { className: "text-sm text-slate-500 mt-2" }, "Anda bisa mulai bekerja dan menyimpan data baru ke Drive nanti.")
                )
            );
        }
        
        // Parse filename: RKT_NAMASEKOLAH_KELAS_TAHUNAJARAN_SEMESTER.XLSX
        const parseFileName = (name) => {
            try {
                const parts = name.replace(/\.XLSX$/i, '').split('_');
                if (parts.length >= 5) {
                    return {
                        school: parts[1].replace(/-/g, ' '),
                        class: parts[2].replace(/-/g, ' '),
                        year: parts[3].replace(/-/g, '/'),
                        semester: parts[4].replace(/-/g, ' ')
                    };
                }
            } catch (e) { /* fall through */ }
            return null;
        };

        return (
            React.createElement('div', { className: "space-y-4" },
                files.map(file => {
                    const parsed = parseFileName(file.name);
                    return (
                        React.createElement('label', { key: file.id, className: `flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedFileId === file.id ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300' : 'bg-white border-slate-300 hover:bg-slate-50'}` },
                            React.createElement('input', {
                                type: "radio",
                                name: "driveFile",
                                value: file.id,
                                checked: selectedFileId === file.id,
                                onChange: () => setSelectedFileId(file.id),
                                className: "h-5 w-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                            }),
                            React.createElement('div', { className: "ml-4" },
                                parsed ? (
                                    React.createElement(React.Fragment, null,
                                        React.createElement('p', { className: "font-semibold text-slate-800" }, `${parsed.school} - Kelas ${parsed.class}`),
                                        React.createElement('p', { className: "text-sm text-slate-600" }, `T.A ${parsed.year} - Semester ${parsed.semester}`)
                                    )
                                ) : (
                                    React.createElement('p', { className: "font-semibold text-slate-800" }, file.name)
                                ),
                                React.createElement('p', { className: "text-xs text-slate-500 mt-1" },
                                    `Terakhir diubah: ${new Date(file.modifiedTime).toLocaleString('id-ID')}`
                                )
                            )
                        )
                    )
                })
            )
        );
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4", onClick: onClose },
            React.createElement('div', { className: "bg-slate-100 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]", onClick: e => e.stopPropagation() },
                React.createElement('div', { className: "p-5 border-b bg-white rounded-t-lg" },
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Pilih Data dari Google Drive"),
                    React.createElement('p', { className: "text-sm text-slate-600 mt-1" }, "Data Rapor Kelas Terpadu (RKT) berikut ditemukan di akun Anda. Pilih data yang ingin Anda muat.")
                ),
                React.createElement('div', { className: "p-6 overflow-y-auto" },
                    renderContent()
                ),
                React.createElement('div', { className: "flex justify-end items-center p-4 border-t bg-white rounded-b-lg" },
                    React.createElement('button', {
                        onClick: onClose,
                        className: "bg-white py-2 px-5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    }, isLoading || files.length === 0 ? "Tutup" : "Batal"),
                    files.length > 0 && !isLoading && (
                        React.createElement('button', {
                            onClick: handleConfirm,
                            disabled: !selectedFileId,
                            className: "ml-3 py-2 px-5 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        }, "Unduh & Muat Pilihan")
                    )
                )
            )
        )
    );
};

export default DriveDataSelectionModal;
