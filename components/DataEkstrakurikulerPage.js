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
    showToast
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

    const handlePasteDescription = (e, startStudentId, extraIndex) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        // Split rows by newline, PRESERVING empty rows to maintain alignment.
        // Only remove the very last empty element if it exists (common in Excel copy)
        let rows = pasteData.split(/\r\n|\n|\r/);
        if (rows.length > 0 && rows[rows.length - 1] === '') {
            rows.pop();
        }

        if (rows.length === 0) return;

        const studentIndex = students.findIndex(s => s.id === startStudentId);
        if (studentIndex === -1) return;

        let updatedCount = 0;
        const currentStudentExtracurriculars = [...studentExtracurriculars];
        
        // Create lookup for easier update
        const studentExtraMap = new Map();
        currentStudentExtracurriculars.forEach(se => studentExtraMap.set(se.studentId, se));

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = studentIndex + rIndex;
            if (currentStudentIndex >= students.length) return;

            const student = students[currentStudentIndex];
            const columns = row.split('\t');
            
            // Get current record or create new
            let record = studentExtraMap.get(student.id);
            if (!record) {
                record = { studentId: student.id, assignedActivities: [], descriptions: {} };
            } else {
                // Clone simple object for immutability in loop
                record = { ...record, descriptions: { ...record.descriptions } };
            }

            // Logic: We map the pasted columns to the description fields starting from `extraIndex`.
            // E.g. pasting 2 columns into Deskripsi 1 will fill Deskripsi 1 and Deskripsi 2
            
            let rowUpdated = false;
            columns.forEach((value, cIndex) => {
                const targetExtraIndex = extraIndex + cIndex;
                if (targetExtraIndex < MAX_EXTRA_FIELDS) {
                    // We need the activity ID at this index to set the description
                    const activityId = record.assignedActivities?.[targetExtraIndex];
                    
                    if (activityId) {
                        // Update description even if empty (allows clearing)
                        record.descriptions[activityId] = value;
                        rowUpdated = true;
                    }
                }
            });

            if (rowUpdated) {
                studentExtraMap.set(student.id, record);
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            const newExtracurricularsList = Array.from(studentExtraMap.values());
            onUpdateStudentExtracurriculars(newExtracurricularsList);
            showToast && showToast(`${updatedCount} deskripsi berhasil ditempel.`, 'success');
        }
    };
    
    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Ekstrakurikuler"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, 
                    "Kelola kegiatan ekstrakurikuler yang diikuti oleh siswa.",
                    React.createElement('br', null),
                    React.createElement('span', { className: "text-sm text-indigo-600" }, "💡 Tips: Anda dapat copy-paste deskripsi dari Excel ke kolom Deskripsi.")
                )
            ),

            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-3 py-3 sticky left-0 bg-slate-100 z-40 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-12 border-b border-slate-200" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 min-w-[200px] border-b border-slate-200" }, "Nama Siswa"),
                                ...Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => (
                                    React.createElement(React.Fragment, { key: i },
                                        React.createElement('th', { scope: "col", className: "px-4 py-3 min-w-[200px] border-b border-slate-200" }, `Ekstrakurikuler ${i + 1}`),
                                        React.createElement('th', { scope: "col", className: "px-4 py-3 min-w-[300px] border-b border-slate-200" }, `Deskripsi ${i + 1}`)
                                    )
                                ))
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => {
                                    const studentExtra = studentExtracurriculars.find(se => se.studentId === student.id);
                                    const allAssignedIdsForStudent = (studentExtra?.assignedActivities || []).filter(Boolean);
                                    
                                    return (
                                        React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-3 py-2 text-center border-b border-slate-200 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                            React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap text-left border-b border-slate-200" }, student.namaLengkap),
                                            ...Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => {
                                                const currentAssignedId = studentExtra?.assignedActivities?.[i] || null;
                                                
                                                const optionsForThisDropdown = activeExtracurriculars.filter(ex => 
                                                    ex.id === currentAssignedId || !allAssignedIdsForStudent.includes(ex.id)
                                                );

                                                return (
                                                    React.createElement(React.Fragment, { key: i },
                                                        React.createElement('td', { className: "px-4 py-2 border-b border-slate-200" },
                                                            React.createElement('select', {
                                                                value: currentAssignedId || "---",
                                                                onChange: (e) => handleAssignmentChange(student.id, i, e.target.value),
                                                                className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            },
                                                                React.createElement('option', { value: "---" }, "--- Pilih ---"),
                                                                optionsForThisDropdown.map(ex => (
                                                                    React.createElement('option', { key: ex.id, value: ex.id }, ex.name)
                                                                ))
                                                            )
                                                        ),
                                                        React.createElement('td', { className: "px-4 py-2 border-b border-slate-200" },
                                                            currentAssignedId && (
                                                                React.createElement('textarea', {
                                                                    value: studentExtra?.descriptions?.[currentAssignedId] || '',
                                                                    onChange: (e) => handleDescriptionChange(student.id, currentAssignedId, e.target.value),
                                                                    onPaste: (e) => handlePasteDescription(e, student.id, i),
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
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: (MAX_EXTRA_FIELDS * 2) + 2, className: "text-center py-10 text-slate-500 border-b border-slate-200" },
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

export default DataEkstrakurikulerPage;
