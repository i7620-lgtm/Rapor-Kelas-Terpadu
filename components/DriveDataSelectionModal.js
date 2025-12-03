import React, { useState, useEffect } from 'react';

const DataCard = ({ title, timestamp, score, isRemote }) => {
    const formattedDate = timestamp ? new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum pernah disimpan';
    
    // Determine color based on score
    let scoreColor = 'bg-red-500';
    if (score >= 80) scoreColor = 'bg-green-500';
    else if (score >= 50) scoreColor = 'bg-yellow-500';

    return (
        React.createElement('div', { className: `p-4 rounded-lg border ${isRemote ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'} flex-1` },
            React.createElement('h4', { className: "font-bold text-slate-700 text-sm uppercase tracking-wide mb-2" }, title),
            React.createElement('div', { className: "mb-3" },
                React.createElement('p', { className: "text-xs text-slate-500 mb-1" }, "Terakhir Diubah"),
                React.createElement('p', { className: "text-sm font-medium text-slate-800" }, formattedDate)
            ),
            React.createElement('div', null,
                React.createElement('div', { className: "flex justify-between items-end mb-1" },
                    React.createElement('p', { className: "text-xs text-slate-500" }, "Kelengkapan Data"),
                    React.createElement('p', { className: "text-sm font-bold text-slate-800" }, `${score}%`)
                ),
                React.createElement('div', { className: "w-full bg-slate-200 rounded-full h-2.5" },
                    React.createElement('div', { className: `h-2.5 rounded-full transition-all duration-500 ${scoreColor}`, style: { width: `${score}%` } })
                )
            )
        )
    );
};

const DriveDataSelectionModal = ({ isOpen, onClose, onConfirm, files = [], isLoading, onDelete, conflictData, onConfirmAction }) => {
    const [selectedFileId, setSelectedFileId] = useState(null);

    // Reset selection when files change or modal opens
    useEffect(() => {
        if (isOpen && files.length > 0 && !conflictData) {
            setSelectedFileId(files[0].id); // Pre-select the first (most recent) file
        } else if (!isOpen) {
            setSelectedFileId(null);
        }
    }, [isOpen, files, conflictData]);

    if (!isOpen) {
        return null;
    }

    const handleFileSelect = () => {
        if (selectedFileId) {
            onConfirm(selectedFileId);
        }
    };

    const handleAction = (action) => {
        if (onConfirmAction && conflictData) {
            const payload = action === 'overwrite_local' ? conflictData.remote.blob : conflictData.fileId;
            onConfirmAction(action, payload);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                React.createElement('div', { className: "text-center p-8" },
                    React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" }),
                    React.createElement('p', { className: "mt-4 text-slate-600" }, "Memproses data...")
                )
            );
        }

        // --- COMPARISON VIEW ---
        if (conflictData) {
            return (
                React.createElement('div', { className: "space-y-6" },
                    React.createElement('div', { className: "bg-yellow-50 border-l-4 border-yellow-400 p-4" },
                        React.createElement('div', { className: "flex" },
                            React.createElement('div', { className: "flex-shrink-0" },
                                React.createElement('svg', { className: "h-5 w-5 text-yellow-400", viewBox: "0 0 20 20", fill: "currentColor" },
                                    React.createElement('path', { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" })
                                )
                            ),
                            React.createElement('div', { className: "ml-3" },
                                React.createElement('p', { className: "text-sm text-yellow-700" },
                                    "File yang dipilih berbeda dengan data yang ada di perangkat Anda. Silakan pilih tindakan yang diinginkan."
                                )
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: "flex flex-col md:flex-row gap-4" },
                        React.createElement(DataCard, { 
                            title: "Data di Perangkat", 
                            timestamp: conflictData.local.timestamp, 
                            score: conflictData.local.score,
                            isRemote: false
                        }),
                        React.createElement('div', { className: "flex items-center justify-center text-slate-400 font-bold" }, "VS"),
                        React.createElement(DataCard, { 
                            title: "Data di Drive (Dipilih)", 
                            timestamp: conflictData.remote.timestamp, 
                            score: conflictData.remote.score,
                            isRemote: true
                        })
                    )
                )
            );
        }

        // --- FILE SELECTION VIEW ---
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
            React.createElement('div', { className: "space-y-3" },
                files.map(file => {
                    const parsed = parseFileName(file.name);
                    return (
                        React.createElement('div', { key: file.id, className: "group flex items-stretch gap-2" },
                            React.createElement('label', { className: `flex-grow flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedFileId === file.id ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300' : 'bg-white border-slate-300 hover:bg-slate-50'}` },
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
                            ),
                            React.createElement('button', {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    onDelete(file.id, file.name);
                                },
                                className: "p-3 flex-shrink-0 text-slate-400 hover:text-red-600 bg-white border border-slate-300 group-hover:border-slate-300 group-hover:bg-red-50 rounded-lg transition-colors",
                                title: `Hapus file ${file.name}`
                            },
                                React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" },
                                    React.createElement('path', { fillRule: "evenodd", d: "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z", clipRule: "evenodd" })
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
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, conflictData ? "Konfirmasi Sinkronisasi Data" : "Pilih Data dari Google Drive"),
                    React.createElement('p', { className: "text-sm text-slate-600 mt-1" }, 
                        conflictData 
                        ? "Bandingkan data sebelum memutuskan." 
                        : "Data Rapor Kelas Terpadu (RKT) berikut ditemukan di akun Anda."
                    )
                ),
                React.createElement('div', { className: "p-6 overflow-y-auto" },
                    renderContent()
                ),
                React.createElement('div', { className: "flex justify-end items-center p-4 border-t bg-white rounded-b-lg gap-3 flex-wrap" },
                    React.createElement('button', {
                        onClick: onClose,
                        className: "bg-white py-2 px-5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    }, "Batal"),
                    
                    conflictData ? (
                        React.createElement(React.Fragment, null,
                            React.createElement('button', {
                                onClick: () => handleAction('overwrite_drive'),
                                className: "py-2 px-5 border border-indigo-600 text-indigo-600 bg-white rounded-md text-sm font-medium hover:bg-indigo-50"
                            }, "Simpan ke Drive (Upload)"),
                            React.createElement('button', {
                                onClick: () => handleAction('overwrite_local'),
                                className: "py-2 px-5 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            }, "Timpa Data Perangkat (Download)")
                        )
                    ) : (
                        files.length > 0 && !isLoading && (
                            React.createElement('button', {
                                onClick: handleFileSelect,
                                disabled: !selectedFileId,
                                className: "ml-3 py-2 px-5 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                            }, "Pilih File")
                        )
                    )
                )
            )
        )
    );
};

export default DriveDataSelectionModal;
