import React, { useState } from 'react';

const emptyStudent = {
    namaLengkap: '', namaPanggilan: '', nis: '', nisn: '', tempatLahir: '',
    tanggalLahir: '', jenisKelamin: '', agama: '', kewarganegaraan: 'WNI',
    statusDalamKeluarga: '', anakKe: '', asalTk: '', alamatSiswa: '',
    diterimaDiKelas: '', diterimaTanggal: '',
    namaAyah: '', namaIbu: '', pekerjaanAyah: '', pekerjaanIbu: '',
    alamatOrangTua: '', teleponOrangTua: '', namaWali: '', pekerjaanWali: '',
    alamatWali: '', teleponWali: '',
};

const StudentModal = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const [formData, setFormData] = useState(emptyStudent);

    React.useEffect(() => {
        setFormData(studentToEdit ? { ...studentToEdit } : emptyStudent);
    }, [studentToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const FormField = ({name, label, type = 'text', required = false}) => (
        React.createElement('div', null,
            React.createElement('label', { htmlFor: name, className: "block text-sm font-medium text-slate-700" }, label),
            React.createElement('input', { type: type, name: name, id: name, value: formData[name] || '', onChange: handleChange, required: required, className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" })
        )
    );

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4", "aria-modal": "true", role: "dialog" },
            React.createElement('div', { className: "bg-slate-50 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, studentToEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'),
                    React.createElement('button', { onClick: onClose, className: "text-slate-500 hover:text-slate-800" }, "\u00d7")
                ),
                React.createElement('form', { onSubmit: handleSubmit, className: "overflow-y-auto p-6 space-y-6" },
                    React.createElement('fieldset', { className: "border p-4 rounded-md" },
                        React.createElement('legend', { className: "text-lg font-semibold text-slate-700 px-2" }, "Data Pribadi Siswa"),
                        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" },
                            React.createElement(FormField, { name: "namaLengkap", label: "Nama Lengkap", required: true }),
                            React.createElement(FormField, { name: "namaPanggilan", label: "Nama Panggilan" }),
                            React.createElement(FormField, { name: "nis", label: "NIS" }),
                            React.createElement(FormField, { name: "nisn", label: "NISN" }),
                            React.createElement(FormField, { name: "tempatLahir", label: "Tempat Lahir" }),
                            React.createElement(FormField, { name: "tanggalLahir", label: "Tanggal Lahir", type: "date" }),
                             React.createElement('div', null,
                                React.createElement('label', { htmlFor: "jenisKelamin", className: "block text-sm font-medium text-slate-700" }, "Jenis Kelamin"),
                                React.createElement('select', { name: "jenisKelamin", id: "jenisKelamin", value: formData.jenisKelamin || '', onChange: handleChange, className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" },
                                    React.createElement('option', { value: "" }, "Pilih..."),
                                    React.createElement('option', { value: "Laki-laki" }, "Laki-laki"),
                                    React.createElement('option', { value: "Perempuan" }, "Perempuan")
                                )
                            ),
                            React.createElement(FormField, { name: "agama", label: "Agama" }),
                            React.createElement(FormField, { name: "kewarganegaraan", label: "Kewarganegaraan" }),
                            React.createElement(FormField, { name: "statusDalamKeluarga", label: "Status dalam Keluarga" }),
                            React.createElement(FormField, { name: "anakKe", label: "Anak Ke-" }),
                            React.createElement(FormField, { name: "asalTk", label: "Asal TK" }),
                            React.createElement('div', { className: "md:col-span-2 lg:col-span-3" },
                                React.createElement('label', { htmlFor: "alamatSiswa", className: "block text-sm font-medium text-slate-700" }, "Alamat Siswa"),
                                React.createElement('textarea', { name: "alamatSiswa", id: "alamatSiswa", value: formData.alamatSiswa || '', onChange: handleChange, rows: 2, className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" })
                            ),
                            React.createElement(FormField, { name: "diterimaDiKelas", label: "Diterima di Kelas" }),
                            React.createElement(FormField, { name: "diterimaTanggal", label: "Diterima Tanggal", type: "date" })
                        )
                    ),
                    React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                        React.createElement('fieldset', { className: "border p-4 rounded-md" },
                            React.createElement('legend', { className: "text-lg font-semibold text-slate-700 px-2" }, "Data Orang Tua"),
                            React.createElement('div', { className: "space-y-4 mt-4" },
                                React.createElement(FormField, { name: "namaAyah", label: "Nama Ayah" }),
                                React.createElement(FormField, { name: "pekerjaanAyah", label: "Pekerjaan Ayah" }),
                                React.createElement(FormField, { name: "namaIbu", label: "Nama Ibu" }),
                                React.createElement(FormField, { name: "pekerjaanIbu", label: "Pekerjaan Ibu" }),
                                React.createElement(FormField, { name: "teleponOrangTua", label: "Telepon Orang Tua" }),
                                React.createElement('div', null,
                                React.createElement('label', { htmlFor: "alamatOrangTua", className: "block text-sm font-medium text-slate-700" }, "Alamat Orang Tua"),
                                React.createElement('textarea', { name: "alamatOrangTua", id: "alamatOrangTua", value: formData.alamatOrangTua || '', onChange: handleChange, rows: 2, className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" }))
                            )
                        ),
                        React.createElement('fieldset', { className: "border p-4 rounded-md" },
                             React.createElement('legend', { className: "text-lg font-semibold text-slate-700 px-2" }, "Data Wali (jika ada)"),
                            React.createElement('div', { className: "space-y-4 mt-4" },
                                React.createElement(FormField, { name: "namaWali", label: "Nama Wali" }),
                                React.createElement(FormField, { name: "pekerjaanWali", label: "Pekerjaan Wali" }),
                                React.createElement(FormField, { name: "teleponWali", label: "Telepon Wali" }),
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "alamatWali", className: "block text-sm font-medium text-slate-700" }, "Alamat Wali"),
                                    React.createElement('textarea', { name: "alamatWali", id: "alamatWali", value: formData.alamatWali || '', onChange: handleChange, rows: 2, className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" })
                                )
                            )
                        )
                    ),

                    React.createElement('div', { className: "flex justify-end items-center p-4 border-t mt-auto" },
                        React.createElement('button', { type: "button", onClick: onClose, className: "bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50" }, "Batal"),
                        React.createElement('button', { type: "submit", className: "ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700" }, "Simpan Data")
                    )
                )
            )
        )
    );
};

const DataSiswaPage = ({ students, namaKelas, onSaveStudent, onBulkSaveStudents, onDeleteStudent, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);

    const handleAddNew = () => {
        setStudentToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student) => {
        setStudentToEdit(student);
        setIsModalOpen(true);
    };

    const handleDelete = (student) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa bernama ${student.namaLengkap}?`)) {
            onDeleteStudent(student.id);
            showToast(`Siswa ${student.namaLengkap} berhasil dihapus.`, 'success');
        }
    };
    
    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement(StudentModal, { 
                isOpen: isModalOpen, 
                onClose: () => setIsModalOpen(false), 
                onSave: onSaveStudent,
                studentToEdit: studentToEdit
            }),
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Siswa"),
                React.createElement('p', { className: "mt-1 text-slate-600" },
                    "Kelola data identitas siswa di kelas ", namaKelas || '(Nama Kelas Belum Diatur)', "."
                )
            ),
            
            React.createElement('div', { className: "space-y-6" },
                React.createElement('div', { className: "flex flex-col md:flex-row justify-end md:items-center gap-4" },
                    React.createElement('div', { className: "flex items-center gap-2" },
                        React.createElement('button', { onClick: handleAddNew, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" },
                            "+ Tambah Siswa"
                        )
                    )
                ),

                React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                    React.createElement('div', { className: "overflow-x-auto" },
                        React.createElement('table', { className: "w-full text-sm text-left text-slate-500" },
                            React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" },
                                React.createElement('tr', null,
                                    React.createElement('th', { scope: "col", className: "px-6 py-3" }, "No"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Lengkap"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3" }, "Nama Panggilan"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3" }, "NIS"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3" }, "NISN"),
                                    React.createElement('th', { scope: "col", className: "px-6 py-3 text-center" }, "Aksi")
                                )
                            ),
                            React.createElement('tbody', null,
                                students.length > 0 ? (
                                    students.map((student, index) => (
                                        React.createElement('tr', { key: student.id, className: "bg-white border-b hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-6 py-4" }, index + 1),
                                            React.createElement('th', { scope: "row", className: "px-6 py-4 font-medium text-slate-900 whitespace-nowrap" }, student.namaLengkap),
                                            React.createElement('td', { className: "px-6 py-4" }, student.namaPanggilan),
                                            React.createElement('td', { className: "px-6 py-4" }, student.nis),
                                            React.createElement('td', { className: "px-6 py-4" }, student.nisn),
                                            React.createElement('td', { className: "px-6 py-4 text-center space-x-2" },
                                                React.createElement('button', { onClick: () => handleEdit(student), className: "font-medium text-indigo-600 hover:underline" }, "Edit"),
                                                React.createElement('button', { onClick: () => handleDelete(student), className: "font-medium text-red-600 hover:underline" }, "Hapus")
                                            )
                                        )
                                    ))
                                ) : (
                                    React.createElement('tr', null,
                                        React.createElement('td', { colSpan: 6, className: "text-center py-10 text-slate-500" },
                                            "Belum ada data siswa. Klik 'Tambah Siswa' untuk memulai."
                                        )
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

export default DataSiswaPage;
