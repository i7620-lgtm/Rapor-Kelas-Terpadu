import React, { useCallback } from 'react';

const DataAbsensiPage = ({ students, attendance, onUpdateAttendance }) => {

    const getAttendanceForStudent = useCallback((studentId) => {
        return attendance.find(a => a.studentId === studentId) || { studentId, sakit: 0, izin: 0, alpa: 0 };
    }, [attendance]);

    const handleAttendanceChange = (studentId, type, value) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue >= 0) {
            onUpdateAttendance(studentId, type, numericValue);
        } else if (value === '') {
            onUpdateAttendance(studentId, type, 0);
        }
    };
    
    return (
        React.createElement('div', { className: "space-y-6" },
             React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Absensi"),
                 React.createElement('p', { className: "mt-1 text-slate-600" }, "Catat jumlah ketidakhadiran siswa selama satu semester.")
            ),
            React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Lengkap"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Panggilan"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center" }, "Sakit (S)"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center" }, "Izin (I)"),
                                React.createElement('th', { scope: "col", className: "px-4 py-3 text-center" }, "Alpa (A)"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 text-center" }, "Total")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => {
                                    const studentAtt = getAttendanceForStudent(student.id);
                                    const total = studentAtt.sakit + studentAtt.izin + studentAtt.alpa;
                                    return (
                                        React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-6 py-4" }, index + 1),
                                            React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap" }, student.namaLengkap),
                                            React.createElement('td', { className: "px-6 py-4" }, student.namaPanggilan),
                                            React.createElement('td', { className: "px-4 py-2 text-center" },
                                                React.createElement('input', { type: "number", min: "0", value: studentAtt.sakit, onChange: (e) => handleAttendanceChange(student.id, 'sakit', e.target.value), className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" })
                                            ),
                                            React.createElement('td', { className: "px-4 py-2 text-center" },
                                                React.createElement('input', { type: "number", min: "0", value: studentAtt.izin, onChange: (e) => handleAttendanceChange(student.id, 'izin', e.target.value), className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" })
                                            ),
                                            React.createElement('td', { className: "px-4 py-2 text-center" },
                                                React.createElement('input', { type: "number", min: "0", value: studentAtt.alpa, onChange: (e) => handleAttendanceChange(student.id, 'alpa', e.target.value), className: "w-20 p-2 text-center bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" })
                                            ),
                                            React.createElement('td', { className: "px-6 py-4 text-center font-semibold text-slate-800" }, total)
                                        )
                                    )
                                })
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: 7, className: "text-center py-10 text-slate-500" },
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
