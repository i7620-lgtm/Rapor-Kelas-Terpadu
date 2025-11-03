import React from 'react';

const MAX_EXTRA_FIELDS = 5;

const defaultDescriptions = {
    'CATUR': 'menunjukkan kemampuan berpikir strategis yang baik.',
    'IPA': 'sangat antusias dan aktif dalam setiap percobaan.',
    'KARATE': 'menunjukkan disiplin dan motivasi yang tinggi dalam latihan.',
    'KEWIRAUSAHAAN': 'memiliki ide-ide kreatif dan motivasi yang kuat.',
    'KODING': 'menunjukkan kemampuan pemecahan masalah yang baik.',
    'MADING': 'aktif berkolaborasi dan menyumbangkan ide-ide kreatif.',
    'MATEMATIKA': 'menunjukkan kemampuan analisis dan pemecahan masalah yang tajam.',
    'MENGGAMBAR': 'memiliki kreativitas dan kemampuan visual yang menonjol.',
    'MENARI': 'menunjukkan kelenturan dan ekspresi yang baik dalam setiap gerakan.',
    'NYURAT_AKSARA_BALI': 'menunjukkan ketekunan dan kemauan belajar yang tinggi.',
    'PRAMUKA': 'sangat aktif, kolaboratif, dan menunjukkan jiwa kepemimpinan.',
    'SILAT': 'menunjukkan disiplin dan semangat yang tinggi dalam berlatih.',
    'VOLI': 'menunjukkan kemampuan kerjasama tim yang baik di lapangan.',
    'XIANGQI': 'menunjukkan kemampuan strategi dan konsentrasi yang baik.'
};

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    const trimmed = string.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

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
        const newActivityId = activityId === "---" ? null : activityId;
        newAssigned[index] = newActivityId;

        const newDescriptions = { ...(studentExtra.descriptions || {}) };

        if (newActivityId && !newDescriptions[newActivityId]) {
            const student = students.find(s => s.id === studentId);
            if (student) {
                const nickname = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
                const template = defaultDescriptions[newActivityId];
                const generatedDescription = template
                    ? `${capitalizeFirstLetter(nickname)} ${template}`
                    : `${capitalizeFirstLetter(nickname)} mengikuti kegiatan dengan baik.`;
                newDescriptions[newActivityId] = generatedDescription;
            }
        }

        const updatedStudentExtra = {
            ...studentExtra,
            assignedActivities: newAssigned,
            descriptions: newDescriptions
        };

        const newStudentExtracurriculars = studentExtracurriculars
            .filter(se => se.studentId !== studentId)
            .concat(updatedStudentExtra);

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
