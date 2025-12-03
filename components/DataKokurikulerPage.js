import React from 'react';
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from '../constants.js';

const DataKokurikulerPage = ({ students, settings, cocurricularData, onSettingsChange, onUpdateCocurricularData, showToast }) => {

    const handleRatingChange = (studentId, dimensionId, rating) => {
        onUpdateCocurricularData(studentId, dimensionId, rating === "---" ? null : rating);
    };

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Kokurikuler"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Isi tema kegiatan dan berikan penilaian capaian kokurikuler siswa yang berfokus pada perkembangan dimensi profil lulusan.")
            ),

            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200 flex-shrink-0" },
                React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Tema Kegiatan"),
                React.createElement('p', { className: "mt-1 text-sm text-slate-600 mb-4" },
                    "Masukkan nama tema kegiatan kokurikuler yang dilaksanakan pada semester ini. Tema ini akan muncul pada deskripsi di rapor."
                ),
                React.createElement('input', {
                    type: "text",
                    name: "cocurricular_theme",
                    value: settings.cocurricular_theme || '',
                    onChange: onSettingsChange,
                    placeholder: "Contoh: Kearifan Lokal",
                    className: "w-full max-w-lg px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                })
            ),

            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "p-6 border-b border-slate-200 flex-shrink-0" },
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Penilaian Dimensi Profil")
                ),
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-3 py-3 sticky left-0 z-40 bg-slate-100 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-slate-200" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 min-w-[200px] border-b border-slate-200" }, "Nama Siswa"),
                                COCURRICULAR_DIMENSIONS.map(dim => (
                                    React.createElement('th', { key: dim.id, scope: "col", className: "px-4 py-3 min-w-[180px] text-center border-b border-slate-200" }, dim.label)
                                ))
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                        React.createElement('td', { className: "px-3 py-2 text-center border-b border-slate-200 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                        React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap text-left border-b border-slate-200" }, student.namaLengkap),
                                        COCURRICULAR_DIMENSIONS.map(dim => {
                                            const rating = cocurricularData[student.id]?.dimensionRatings?.[dim.id] || "---";
                                            return (
                                                React.createElement('td', { key: dim.id, className: "px-4 py-2 border-b border-slate-200" },
                                                    React.createElement('select', {
                                                        value: rating,
                                                        onChange: e => handleRatingChange(student.id, dim.id, e.target.value),
                                                        className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500",
                                                        "aria-label": `Penilaian ${dim.label} untuk ${student.namaLengkap}`
                                                    },
                                                        React.createElement('option', { value: "---" }, "--- Pilih ---"),
                                                        Object.entries(COCURRICULAR_RATINGS).map(([code, description]) => (
                                                            React.createElement('option', { key: code, value: code, title: description }, code)
                                                        ))
                                                    )
                                                )
                                            );
                                        })
                                    )
                                ))
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: COCURRICULAR_DIMENSIONS.length + 2, className: "text-center py-10 text-slate-500 border-b border-slate-200" },
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

export default DataKokurikulerPage;
