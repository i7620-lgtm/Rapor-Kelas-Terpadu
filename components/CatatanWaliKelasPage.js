import React, { useState } from 'react';

const CatatanWaliKelasPage = ({ students, notes, onUpdateNote, noteTemplates }) => {
    const [templateDropdown, setTemplateDropdown] = useState(null);

    const handleNoteChange = (studentId, note) => {
        onUpdateNote(studentId, note);
    };

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Catatan Wali Kelas"),
                 React.createElement('p', { className: "mt-1 text-slate-600" }, "Berikan catatan atau umpan balik mengenai perkembangan siswa selama satu semester.")
            ),
            
            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3 w-16" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Lengkap"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Catatan Wali Kelas")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50 align-top" },
                                        React.createElement('td', { className: "px-6 py-4" }, index + 1),
                                        React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap" }, student.namaLengkap),
                                        React.createElement('td', { className: "px-6 py-4" },
                                            React.createElement('textarea', {
                                                value: notes[student.id] || '',
                                                onChange: (e) => handleNoteChange(student.id, e.target.value),
                                                placeholder: "Tulis catatan untuk siswa di sini...",
                                                className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900",
                                                rows: 4,
                                                "aria-label": `Catatan wali kelas untuk ${student.namaLengkap}`
                                            }),
                                            React.createElement('div', { className: "relative mt-2 text-right" },
                                                React.createElement('button', {
                                                    onClick: () => setTemplateDropdown(templateDropdown === student.id ? null : student.id),
                                                    className: "text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                                }, "Gunakan Template"),
                                                templateDropdown === student.id && (
                                                    React.createElement('div', { className: "absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 border border-slate-200" },
                                                        React.createElement('ul', { className: "py-1" },
                                                            noteTemplates.map((template) => (
                                                                React.createElement('li', { key: template.id },
                                                                    React.createElement('a', {
                                                                        href: "#",
                                                                        onClick: (e) => {
                                                                            e.preventDefault();
                                                                            const newNote = template.content.replace(/\[Nama Siswa\]/g, student.namaLengkap);
                                                                            handleNoteChange(student.id, newNote);
                                                                            setTemplateDropdown(null);
                                                                        },
                                                                        className: "block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left"
                                                                    }, template.title)
                                                                )
                                                            ))
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ))
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: 3, className: "text-center py-10 text-slate-500" },
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

export default CatatanWaliKelasPage;
