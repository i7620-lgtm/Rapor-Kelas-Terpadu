import React from 'react';

const CatatanWaliKelasPage = ({ students, notes, onUpdateNote, grades, subjects, settings, showToast }) => {

    const handleGenerateNote = (student) => {
        const predA = parseInt(settings.predikats?.a || 90, 10);
        const predB = parseInt(settings.predikats?.b || 80, 10);
        const nickname = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];

        const studentGradeData = grades.find(g => g.studentId === student.id);
        if (!studentGradeData || !studentGradeData.finalGrades) {
            onUpdateNote(student.id, `${nickname} menunjukkan perkembangan yang baik dalam berbagai aspek. Pertahankan semangat belajar.`);
            return;
        }

        const activeSubjects = subjects.filter(s => s.active);
        const finalGrades = studentGradeData.finalGrades;

        // Condition A: Check for >= 5 'A' grades
        const aGradeSubjects = activeSubjects
            .filter(s => finalGrades[s.id] >= predA)
            .map(s => {
                let name = s.fullName;
                if (name.startsWith('Pendidikan Agama')) return 'P. Agama';
                if (name.startsWith('Pendidikan Pancasila')) return 'Pancasila';
                if (name.startsWith('Ilmu Pengetahuan Alam dan Sosial')) return 'IPAS';
                if (name.startsWith('Pendidikan Jasmani')) return 'PJOK';
                return name;
            });

        if (aGradeSubjects.length >= 5) {
            const note = `${nickname} menunjukkan keaktifan dan prestasi akademik yang sangat baik, terutama dalam ${aGradeSubjects.slice(0, 2).join(' dan ')}. Pertahankan terus prestasi yang telah dicapai.`;
            onUpdateNote(student.id, note);
            return;
        }

        // Condition C: Check for Religion and Pancasila grades >= B
        const studentReligion = student.agama?.trim().toLowerCase();
        const religionSubject = activeSubjects.find(s => 
            s.fullName.startsWith('Pendidikan Agama dan Budi Pekerti') && 
            s.fullName.toLowerCase().includes(`(${studentReligion})`)
        );
        const pancasilaSubject = activeSubjects.find(s => s.id === 'PP');

        const religionGrade = religionSubject ? finalGrades[religionSubject.id] : null;
        const pancasilaGrade = pancasilaSubject ? finalGrades[pancasilaSubject.id] : null;

        if (typeof religionGrade === 'number' && typeof pancasilaGrade === 'number' && religionGrade >= predB && pancasilaGrade >= predB) {
            const note = `${nickname} menunjukkan sikap dan perilaku yang baik, santun, dan bertanggung jawab. Selalu aktif dalam diskusi dan menunjukkan kepedulian terhadap teman.`;
            onUpdateNote(student.id, note);
            return;
        }

        // Condition B: Fallback to general academic development
        let highestGrade = -1;
        let highestSubject = null;
        activeSubjects.forEach(s => {
            const grade = finalGrades[s.id];
            if (typeof grade === 'number' && grade > highestGrade) {
                highestGrade = grade;
                let name = s.fullName;
                if (name.startsWith('Pendidikan Agama')) highestSubject = 'P. Agama';
                else highestSubject = name;
            }
        });

        if (highestSubject) {
            const note = `${nickname} menunjukkan perkembangan akademik yang positif secara keseluruhan. Terlihat menonjol dalam ${highestSubject}. Perlu terus didukung untuk meningkatkan konsentrasi dan partisipasi di beberapa mata pelajaran lain.`;
            onUpdateNote(student.id, note);
            return;
        }

        // Absolute fallback
        const fallbackNote = `${nickname} menunjukkan perkembangan yang baik dalam berbagai aspek. Pertahankan semangat belajar.`;
        onUpdateNote(student.id, fallbackNote);
    };

    const handleNoteChange = (studentId, note) => {
        onUpdateNote(studentId, note);
    };

    const handlePaste = (e, startStudentId) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
        
        if (rows.length === 0) return;

        const studentIndex = students.findIndex(s => s.id === startStudentId);
        if (studentIndex === -1) return;

        let updatedCount = 0;

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = studentIndex + rIndex;
            if (currentStudentIndex >= students.length) return;

            const student = students[currentStudentIndex];
            // Handle potential multiple columns in paste data (though usually notes are 1 col)
            // We take the first column for the note
            const columns = row.split('\t');
            const noteValue = columns[0];

            onUpdateNote(student.id, noteValue);
            updatedCount++;
        });

        if (updatedCount > 0) {
            showToast && showToast(`${updatedCount} catatan berhasil ditempel.`, 'success');
        }
    };

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Catatan Wali Kelas"),
                 React.createElement('p', { className: "mt-1 text-slate-600" }, 
                    "Berikan catatan atau umpan balik mengenai perkembangan siswa selama satu semester.",
                    React.createElement('br', null),
                    React.createElement('span', { className: "text-sm text-indigo-600" }, "💡 Tips: Anda dapat copy-paste catatan dari Excel/Word ke kolom Catatan.")
                 )
            ),
            
            React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col" },
                React.createElement('div', { className: "flex-1 overflow-auto" },
                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                        React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "px-6 py-3 w-16 sticky left-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, "No"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 border-b border-slate-200 min-w-[250px]" }, "Nama Lengkap"),
                                React.createElement('th', { scope: "col", className: "px-6 py-3 border-b border-slate-200 min-w-[400px]" }, "Catatan Wali Kelas")
                            )
                        ),
                        React.createElement('tbody', null,
                            students.length > 0 ? (
                                students.map((student, index) => (
                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50 align-top" },
                                        React.createElement('td', { className: "px-6 py-4 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, index + 1),
                                        React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-200" }, student.namaLengkap),
                                        React.createElement('td', { className: "px-6 py-4 border-b border-slate-200" },
                                            React.createElement('textarea', {
                                                value: notes[student.id] || '',
                                                onChange: (e) => handleNoteChange(student.id, e.target.value),
                                                onPaste: (e) => handlePaste(e, student.id),
                                                placeholder: "Tulis catatan untuk siswa di sini...",
                                                className: "w-full p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900",
                                                rows: 4,
                                                "aria-label": `Catatan wali kelas untuk ${student.namaLengkap}`
                                            }),
                                            React.createElement('div', { className: "flex justify-end mt-2" },
                                                React.createElement('button', {
                                                    onClick: () => handleGenerateNote(student),
                                                    className: "px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors",
                                                    title: "Buat catatan dasar berdasarkan data nilai dan sikap siswa"
                                                }, "Buat Catatan Otomatis")
                                            )
                                        )
                                    )
                                ))
                            ) : (
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: 3, className: "text-center py-10 text-slate-500 border-b border-slate-200" },
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
