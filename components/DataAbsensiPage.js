import React, { useCallback } from 'react';

const DataAbsensiPage = ({ students, attendance, onUpdateAttendance, onBulkUpdateAttendance, showToast }) => {

    const getAttendanceForStudent = useCallback((studentId) => {
        const studentAtt = attendance.find(a => a.studentId === studentId);
        return {
            studentId,
            sakit: studentAtt?.sakit ?? null,
            izin: studentAtt?.izin ?? null,
            alpa: studentAtt?.alpa ?? null
        };
    }, [attendance]);

    const handleAttendanceChange = (studentId, type, value) => {
        onUpdateAttendance(studentId, type, value);
    };

    const handlePaste = (e, startStudentId, startFieldType) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        // Split rows by newline, PRESERVING empty rows to maintain index alignment
        let rows = pasteData.split(/\r\n|\n|\r/);
        // Remove the last element if it's empty (trailing newline from Excel copy)
        if (rows.length > 0 && rows[rows.length - 1] === '') {
            rows.pop();
        }
        
        if (rows.length === 0) return;

        const studentIndex = students.findIndex(s => s.id === startStudentId);
        if (studentIndex === -1) return;

        // Define field order for column mapping
        const fields = ['sakit', 'izin', 'alpa'];
        const startFieldIndex = fields.indexOf(startFieldType);
        
        if (startFieldIndex === -1) return;

        // Create a map of existing attendance to avoid O(N^2) lookups
        const attendanceMap = new Map(attendance.map(a => [a.studentId, a]));
        const newAttendanceList = [];
        let updatedCount = 0;

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = studentIndex + rIndex;
            if (currentStudentIndex >= students.length) return;

            const student = students[currentStudentIndex];
            // Use existing record or create new empty one
            let record = attendanceMap.get(student.id) || { studentId: student.id, sakit: null, izin: null, alpa: null };
            
            // Split columns by tab, preserving empty strings for empty cells
            const columns = row.split('\t');

            let rowUpdated = false;
            columns.forEach((value, cIndex) => {
                const currentFieldIndex = startFieldIndex + cIndex;
                if (currentFieldIndex < fields.length) {
                    const fieldName = fields[currentFieldIndex];
                    // Convert empty string to null, otherwise parse int
                    const cleanValue = value.trim() === '' ? null : parseInt(value.trim(), 10);
                    
                    // Update if value is valid number or null (clearing)
                    if (cleanValue === null || !isNaN(cleanValue)) {
                        record = { ...record, [fieldName]: cleanValue };
                        rowUpdated = true;
                    }
                }
            });

            if (rowUpdated) {
                newAttendanceList.push(record);
                // Update map to ensure subsequent logic uses latest if needed (though we push to list)
                attendanceMap.set(student.id, record);
                updatedCount++;
            }
        });

        if (newAttendanceList.length > 0) {
            // Merge new records with existing ones that weren't touched
            const finalAttendance = attendance.map(a => {
                const updated = newAttendanceList.find(u => u.studentId === a.studentId);
                return updated || a;
            });
            
            // Add records for students who didn't have attendance yet but were in the paste list
            newAttendanceList.forEach(newItem => {
                if (!finalAttendance.some(a => a.studentId === newItem.studentId)) {
                    finalAttendance.push(newItem);
                }
            });

            onBulkUpdateAttendance(finalAttendance);
            showToast && showToast(`${updatedCount} data absensi berhasil ditempel.`, 'success');
        }
    };
    
    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
             React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Absensi"),
                 React.createElement('p', { className: "mt-1 text-slate-600" }, 
                    "Catat jumlah ketidakhadiran siswa selama satu semester. Kosongkan kolom jika tidak ada ketidakhadiran.",
                    React.createElement('br', null),
                    React.createElement('span', { className: "text-sm text-indigo-600" }, "💡 Tips: Anda dapat copy-paste data dari Excel ke kolom Sakit, Izin, atau Alpa.")
                 )
            ),
            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3 sticky left-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 border-b border-slate-200 min-w-[200px]" }, "Nama Lengkap"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-slate-200" }, "Sakit (S)"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-slate-200" }, "Izin (I)"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center border-b border-slate-200" }, "Alpa (A)"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center border-b border-slate-200" }, "Total")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => {
                                    const studentAtt = getAttendanceForStudent(student.id);
                                    const total = (studentAtt.sakit ?? 0) + (studentAtt.izin ?? 0) + (studentAtt.alpa ?? 0);
                                    return (
                                        React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-6 py-4 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, index + 1),
                                            React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-200" }, student.namaLengkap),
                                            React.createElement('td', { className: "px-4 py-2 text-center border-b border-slate-200" },
                                                React.createElement('input', { 
                                                    type: "number", 
                                                    min: "0", 
                                                    value: studentAtt.sakit ?? '', 
                                                    onChange: (e) => handleAttendanceChange(student.id, 'sakit', e.target.value),
                                                    onPaste: (e) => handlePaste(e, student.id, 'sakit'),
                                                    className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", 
                                                    "aria-label": `Jumlah sakit untuk ${student.namaLengkap}` 
                                                })
                                            ),
                                            React.createElement('td', { className: "px-4 py-2 text-center border-b border-slate-200" },
                                                React.createElement('input', { 
                                                    type: "number", 
                                                    min: "0", 
                                                    value: studentAtt.izin ?? '', 
                                                    onChange: (e) => handleAttendanceChange(student.id, 'izin', e.target.value), 
                                                    onPaste: (e) => handlePaste(e, student.id, 'izin'),
                                                    className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", 
                                                    "aria-label": `Jumlah izin untuk ${student.namaLengkap}` 
                                                })
                                            ),
                                            React.createElement('td', { className: "px-4 py-2 text-center border-b border-slate-200" },
                                                React.createElement('input', { 
                                                    type: "number", 
                                                    min: "0", 
                                                    value: studentAtt.alpa ?? '', 
                                                    onChange: (e) => handleAttendanceChange(student.id, 'alpa', e.target.value), 
                                                    onPaste: (e) => handlePaste(e, student.id, 'alpa'),
                                                    className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", 
                                                    "aria-label": `Jumlah alpa untuk ${student.namaLengkap}` 
                                                })
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 text-center font-semibold text-slate-800 border-b border-slate-200" }, total)
                                        )
                                    )
                                })
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: 6, className: "text-center py-10 text-slate-500 border-b border-slate-200" },
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

export default DataAbsensiPage;
