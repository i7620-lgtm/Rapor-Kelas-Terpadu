import React from 'react';

const MAX_EXTRA_FIELDS = 5;

const DataEkstrakurikulerPage = ({
    students,
    extracurriculars,
    studentExtracurriculars,
    onUpdateStudentExtracurriculars,
}) => {
    const activeExtracurriculars = extracurriculars.filter(e => e.active);

    const handleAssignmentChange = (studentId, index, activityId) => {
        const studentExtra = studentExtracurriculars.find(se => se.studentId === studentId) || { studentId, assignedActivities: [], descriptions: {} };
        const newAssigned = [...(studentExtra.assignedActivities || [])];
        while (newAssigned.length < MAX_EXTRA_FIELDS) {
            newAssigned.push(null);
        }
        newAssigned[index] = activityId === "---" ? null : activityId;
        
        const updatedStudentExtra = { ...studentExtra, assignedActivities: newAssigned };
        
        const newStudentExtracurriculars = studentExtracurriculars.filter(se => se.studentId !== studentId);
        newStudentExtracurriculars.push(updatedStudentExtra);
        onUpdateStudentExtracurriculars(newStudentExtracurriculars);
    };
    
    const handleDescriptionChange = (studentId, activityId, description) => {
        const studentExtra = studentExtracurriculars.find(se => se.studentId === studentId) || { studentId, assignedActivities: [], descriptions: {} };
        const newDescriptions = { ...studentExtra.descriptions, [activityId]: description };

        const updatedStudentExtra = { ...studentExtra, descriptions: newDescriptions };

        const newStudentExtracurriculars = studentExtracurriculars.filter(se => se.studentId !== studentId);
        newStudentExtracurriculars.push(updatedStudentExtra);
        onUpdateStudentExtracurriculars(newStudentExtracurriculars);
    };
    
    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Ekstrakurikuler"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Kelola kegiatan ekstrakurikuler yang diikuti oleh siswa. Pengaturan daftar ekstrakurikuler dapat diakses di halaman Pengaturan.")
            ),

            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3 sticky left-0 bg-slate-100 z-10 min-w-[200px]" }, "Nama Siswa"),
                                ...Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => (
                                    React.createElement(React.Fragment, { key: i },
                                        React.createElement('th', { scope: "col", className: "px-4 py-3 min-w-[200px]" }, `Ekstrakurikuler ${i + 1}`),
                                        React.createElement('th', { scope: "col", className: "px-4 py-3 min-w-[300px]" }, `Deskripsi ${i + 1}`)
                                    )
                                ))
                            )
                        ),
                        React.createElement('tbody', null,
                            students.map(student => {
                                const studentExtra = studentExtracurriculars.find(se => se.studentId === student.id);
                                return (
                                    React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50" },
                                        React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10" }, student.namaLengkap),
                                        ...Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => {
                                            const assignedId = studentExtra?.assignedActivities?.[i] || null;
                                            return (
                                                React.createElement(React.Fragment, { key: i },
                                                    React.createElement('td', { className: "px-4 py-2" },
                                                        React.createElement('select', {
                                                            value: assignedId || "---",
                                                            onChange: (e) => handleAssignmentChange(student.id, i, e.target.value),
                                                            className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        },
                                                            React.createElement('option', { value: "---" }, "--- Pilih ---"),
                                                            activeExtracurriculars.map(ex => (
                                                                React.createElement('option', { key: ex.id, value: ex.id }, ex.name)
                                                            ))
                                                        )
                                                    ),
                                                    React.createElement('td', { className: "px-4 py-2" },
                                                        assignedId && (
                                                            React.createElement('textarea', {
                                                                value: studentExtra?.descriptions?.[assignedId] || '',
                                                                onChange: (e) => handleDescriptionChange(student.id, assignedId, e.target.value),
                                                                rows: 2,
                                                                className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            })
                                                        )
                                                    )
                                                )
                                            )
                                        })
                                    )
                                )
                            })
                        )
                    )
                )
            )
        )
    );
};

export default DataEkstrakurikulerPage;
