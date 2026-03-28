import React from 'react';
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from '../constants.js';

const DataKokurikulerPage = ({ students, settings, cocurricularData, onSettingsChange, onUpdateCocurricularData, showToast }) => {

    const handleRatingChange = (studentId, dimensionId, value) => {
        // Convert empty string to null, otherwise keep value as is (text input)
        onUpdateCocurricularData(studentId, dimensionId, value === "" ? null : value.toUpperCase());
    };

    const handlePaste = (e, startStudentId, startDimensionId) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        // Split rows by newline, PRESERVING empty rows to maintain index alignment
        let rows = pasteData.split(/\r\n|\n|\r/);
        if (rows.length > 0 && rows[rows.length - 1] === '') {
            rows.pop();
        }

        if (rows.length === 0) return;

        const studentIndex = students.findIndex(s => s.id === startStudentId);
        const dimensionIndex = COCURRICULAR_DIMENSIONS.findIndex(d => d.id === startDimensionId);
        
        if (studentIndex === -1 || dimensionIndex === -1) return;
        
        let updatedCount = 0;

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = studentIndex + rIndex;
            if (currentStudentIndex >= students.length) return;
            const student = students[currentStudentIndex];
            
            const columns = row.split('\t');
            columns.forEach((val, cIndex) => {
                const currentDimIndex = dimensionIndex + cIndex;
                if (currentDimIndex >= COCURRICULAR_DIMENSIONS.length) return;
                const dim = COCURRICULAR_DIMENSIONS[currentDimIndex];
                
                let cleanVal = val.trim();
                // Auto-uppercase if it matches standard codes to help consistency
                const upperVal = cleanVal.toUpperCase();
                if (['BB', 'MB', 'BSH', 'SB', '-'].includes(upperVal)) {
                    cleanVal = upperVal;
                }
                
                const finalVal = cleanVal === '' ? null : cleanVal;
                
                // Call update function for each cell
                onUpdateCocurricularData(student.id, dim.id, finalVal);
                updatedCount++;
            });
        });
        
        if (updatedCount > 0 && showToast) {
            showToast(`${updatedCount} nilai berhasil ditempel.`, 'success');
        }
    };

    const handleSetAllRatings = (dimensionId, rating) => {
        students.forEach(student => {
            onUpdateCocurricularData(student.id, dimensionId, rating);
        });
        if (showToast) {
            showToast(`Nilai ${rating} diterapkan ke semua siswa untuk dimensi ini.`, 'success');
        }
    };

    return (
        React.createElement('div', { className: "flex flex-col gap-4 pt-4 sm:pt-8" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-zinc-800" }, "Data Kokurikuler"),
                React.createElement('p', { className: "mt-1 text-zinc-600" }, 
                    "Isi tema kegiatan dan berikan penilaian capaian kokurikuler siswa yang berfokus pada perkembangan dimensi profil lulusan.",
                    React.createElement('br', null),
                    React.createElement('span', { className: "text-sm text-zinc-900" }, "💡 Tips: Anda dapat menyalin nilai (BB, MB, BSH, SB) dari Excel dan menempelkannya (paste) ke tabel di bawah.")
                )
            ),

            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-sm border border-zinc-200/60 flex-shrink-0" },
                React.createElement('h3', { className: "text-xl font-bold text-zinc-800" }, "Tema Kegiatan"),
                React.createElement('p', { className: "mt-1 text-sm text-zinc-600 mb-4" },
                    "Masukkan nama tema kegiatan kokurikuler yang dilaksanakan pada semester ini. Tema ini akan muncul pada deskripsi di rapor."
                ),
                React.createElement('input', {
                    type: "text",
                    name: "cocurricular_theme",
                    value: settings.cocurricular_theme || '',
                    onChange: onSettingsChange,
                    placeholder: "Contoh: Kearifan Lokal",
                    className: "w-full max-w-lg px-3 py-2 bg-white border border-zinc-300/60 rounded-lg shadow-sm focus:ring-zinc-900 focus:border-zinc-900"
                })
            ),

            students.length === 0 ? (
                React.createElement('div', { className: "bg-white p-10 rounded-xl shadow-sm border border-zinc-200/60 text-center flex items-center justify-center min-h-[400px]" },
                    React.createElement('div', null,
                        React.createElement('h3', { className: "text-lg font-semibold mb-2 text-zinc-800" }, "Belum ada data siswa"),
                        React.createElement('p', { className: "text-zinc-500" }, "Silakan tambahkan siswa di halaman 'Data Siswa'.")
                    )
                )
            ) : (
                React.createElement('div', { className: "bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden" },
                    React.createElement('div', { className: "p-6 border-b border-zinc-200/60 flex-shrink-0 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4" },
                        React.createElement('div', null,
                             React.createElement('h3', { className: "text-xl font-bold text-zinc-800" }, "Penilaian Dimensi Profil"),
                             React.createElement('p', { className: "text-sm text-zinc-500 mt-1" }, "Masukkan kode penilaian pada kolom dimensi yang sesuai.")
                        ),
                        // Legend Panel
                        React.createElement('div', { className: "flex flex-wrap gap-x-4 gap-y-2 text-xs bg-[#fafafa] p-3 rounded-xl border border-zinc-200/60" },
                            Object.entries(COCURRICULAR_RATINGS).map(([code, desc]) => (
                                React.createElement('div', { key: code, className: "flex items-center gap-1.5" },
                                    React.createElement('span', { className: "font-bold text-zinc-800 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/60" }, code),
                                    React.createElement('span', { className: "text-zinc-600" }, desc)
                                )
                            ))
                        )
                    ),
                    React.createElement('div', { className: "flex-1 overflow-auto" },
                        React.createElement('table', { className: "w-full text-sm text-left text-zinc-500 border-separate border-spacing-0" },
                            React.createElement('thead', { className: "text-xs text-zinc-700 uppercase bg-zinc-100 sticky top-0 z-30" },
                                React.createElement('tr', null,
                                    React.createElement('th', { scope: "col", className: "px-3 py-3 sticky left-0 z-40 bg-zinc-100 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-zinc-200/60" }, "No"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3 min-w-[200px] border-b border-zinc-200/60" }, "Nama Siswa"),
                                    COCURRICULAR_DIMENSIONS.map(dim => (
                                        React.createElement('th', { key: dim.id, scope: "col", className: "px-4 py-3 min-w-[120px] text-center border-b border-zinc-200/60 align-top" }, 
                                            React.createElement('div', { className: "mb-1" }, dim.label),
                                            React.createElement('div', { className: "flex justify-center flex-wrap gap-1 mt-1" },
                                                ['BB', 'MB', 'BSH', 'SB'].map(rating => (
                                                    React.createElement('button', {
                                                        key: rating,
                                                        onClick: () => handleSetAllRatings(dim.id, rating),
                                                        className: "px-1.5 py-0.5 text-[9px] font-bold text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-100 hover:text-zinc-900 transition-colors",
                                                        title: `Set semua siswa menjadi ${rating}`
                                                    }, rating)
                                                ))
                                            )
                                        )
                                    ))
                                )
                            ),
                            React.createElement('tbody', null,
                                students.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-[#fafafa]" },
                                        React.createElement('td', { className: "px-3 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                        React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-zinc-900 whitespace-nowrap text-left border-b border-zinc-200/60" }, student.namaLengkap),
                                        COCURRICULAR_DIMENSIONS.map(dim => {
                                            const rating = cocurricularData[student.id]?.dimensionRatings?.[dim.id] || "";
                                            // Check validity for styling
                                            const isValidRating = ['BB', 'MB', 'BSH', 'SB', '-'].includes(rating);

                                            return (
                                                React.createElement('td', { key: dim.id, className: "px-2 py-2 border-b border-zinc-200/60" },
                                                    React.createElement('input', {
                                                        type: "text",
                                                        value: rating,
                                                        onChange: e => handleRatingChange(student.id, dim.id, e.target.value),
                                                        onPaste: e => handlePaste(e, student.id, dim.id),
                                                        className: `w-full p-2 text-center text-sm uppercase border rounded-lg shadow-sm focus:ring-zinc-900 focus:border-zinc-900 transition-all ${
                                                            isValidRating 
                                                                ? 'border-green-500 ring-1 ring-green-500' 
                                                                : rating && !isValidRating
                                                                    ? 'border-red-500 ring-1 ring-red-500 bg-rose-50 text-rose-800'
                                                                    : 'border-red-500 ring-1 ring-red-500'
                                                        }`,
                                                        placeholder: "-"
                                                    })
                                                )
                                            );
                                        })
                                    )
                                ))
                            )
                        )
                    )
                )
            )
        )
    );
};

export default DataKokurikulerPage;
