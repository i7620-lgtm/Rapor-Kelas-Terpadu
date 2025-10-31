import React, { useState } from 'react';
import { Student } from '../types.ts';

const emptyStudent: Omit<Student, 'id'> = {
    namaLengkap: '', namaPanggilan: '', nis: '', nisn: '', tempatLahir: '',
    tanggalLahir: '', jenisKelamin: '', agama: '', kewarganegaraan: 'WNI',
    statusDalamKeluarga: '', anakKe: '', asalTk: '', alamatSiswa: '',
    diterimaDiKelas: '', diterimaTanggal: '',
    namaAyah: '', namaIbu: '', pekerjaanAyah: '', pekerjaanIbu: '',
    alamatOrangTua: '', teleponOrangTua: '', namaWali: '', pekerjaanWali: '',
    alamatWali: '', teleponWali: '',
};

interface StudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Omit<Student, 'id'> & { id?: number }) => void;
    studentToEdit: (Omit<Student, 'id'> & { id?: number }) | null;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const [formData, setFormData] = useState(emptyStudent);

    React.useEffect(() => {
        setFormData(studentToEdit ? { ...studentToEdit } : emptyStudent);
    }, [studentToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const FormField: React.FC<{name: keyof typeof emptyStudent, label: string, type?: string, required?: boolean}> = ({ name, label, type = 'text', required = false}) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
            <input type={type} name={name} id={name} value={formData[name] || ''} onChange={handleChange} required={required} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">{studentToEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    {/* Data Pribadi Siswa */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold text-slate-700 px-2">Data Pribadi Siswa</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <FormField name="namaLengkap" label="Nama Lengkap" required />
                            <FormField name="namaPanggilan" label="Nama Panggilan" />
                            <FormField name="nis" label="NIS" />
                            <FormField name="nisn" label="NISN" />
                            <FormField name="tempatLahir" label="Tempat Lahir" />
                            <FormField name="tanggalLahir" label="Tanggal Lahir" type="date" />
                             <div>
                                <label htmlFor="jenisKelamin" className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                                <select name="jenisKelamin" id="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="">Pilih...</option>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                            <FormField name="agama" label="Agama" />
                            <FormField name="kewarganegaraan" label="Kewarganegaraan" />
                            <FormField name="statusDalamKeluarga" label="Status dalam Keluarga" />
                            <FormField name="anakKe" label="Anak Ke-" />
                            <FormField name="asalTk" label="Asal TK" />
                            <div className="md:col-span-2 lg:col-span-3">
                                <label htmlFor="alamatSiswa" className="block text-sm font-medium text-slate-700">Alamat Siswa</label>
                                <textarea name="alamatSiswa" id="alamatSiswa" value={formData.alamatSiswa} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <FormField name="diterimaDiKelas" label="Diterima di Kelas" />
                            <FormField name="diterimaTanggal" label="Diterima Tanggal" type="date" />
                        </div>
                    </fieldset>
                     {/* Data Orang Tua & Wali */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <fieldset className="border p-4 rounded-md">
                            <legend className="text-lg font-semibold text-slate-700 px-2">Data Orang Tua</legend>
                            <div className="space-y-4 mt-4">
                                <FormField name="namaAyah" label="Nama Ayah" />
                                <FormField name="pekerjaanAyah" label="Pekerjaan Ayah" />
                                <FormField name="namaIbu" label="Nama Ibu" />
                                <FormField name="pekerjaanIbu" label="Pekerjaan Ibu" />
                                <FormField name="teleponOrangTua" label="Telepon Orang Tua" />
                                <div>
                                <label htmlFor="alamatOrangTua" className="block text-sm font-medium text-slate-700">Alamat Orang Tua</label>
                                <textarea name="alamatOrangTua" id="alamatOrangTua" value={formData.alamatOrangTua} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            </div>
                        </fieldset>
                        <fieldset className="border p-4 rounded-md">
                             <legend className="text-lg font-semibold text-slate-700 px-2">Data Wali (jika ada)</legend>
                            <div className="space-y-4 mt-4">
                                <FormField name="namaWali" label="Nama Wali" />
                                <FormField name="pekerjaanWali" label="Pekerjaan Wali" />
                                <FormField name="teleponWali" label="Telepon Wali" />
                                <div>
                                    <label htmlFor="alamatWali" className="block text-sm font-medium text-slate-700">Alamat Wali</label>
                                    <textarea name="alamatWali" id="alamatWali" value={formData.alamatWali} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    <div className="flex justify-end items-center p-4 border-t mt-auto">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Simpan Data</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface DataSiswaPageProps {
    students: Student[];
    namaKelas: string;
    onSaveStudent: (student: Omit<Student, 'id'> & { id?: number }) => void;
    onBulkSaveStudents: (students: Omit<Student, 'id'>[]) => void;
    onDeleteStudent: (studentId: number) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const DataSiswaPage: React.FC<DataSiswaPageProps> = ({ students, namaKelas, onSaveStudent, onBulkSaveStudents, onDeleteStudent, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<(Omit<Student, 'id'> & { id?: number }) | null>(null);

    const handleAddNew = () => {
        setStudentToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student: Student) => {
        setStudentToEdit(student);
        setIsModalOpen(true);
    };

    const handleDelete = (student: Student) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa bernama ${student.namaLengkap}?`)) {
            onDeleteStudent(student.id);
            showToast(`Siswa ${student.namaLengkap} berhasil dihapus.`, 'success');
        }
    };
    
    return (
        <div className="space-y-6">
            <StudentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={onSaveStudent}
                studentToEdit={studentToEdit}
            />
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Siswa</h2>
                <p className="mt-1 text-slate-600">
                    Kelola data identitas siswa di kelas {namaKelas || '(Nama Kelas Belum Diatur)'}.
                </p>
            </div>
            
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-end md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handleAddNew} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700">
                            + Tambah Siswa
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">No</th>
                                    <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                                    <th scope="col" className="px-6 py-3">Nama Panggilan</th>
                                    <th scope="col" className="px-6 py-3">NIS</th>
                                    <th scope="col" className="px-6 py-3">NISN</th>
                                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? (
                                    students.map((student, index) => (
                                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{index + 1}</td>
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{student.namaLengkap}</th>
                                            <td className="px-6 py-4">{student.namaPanggilan}</td>
                                            <td className="px-6 py-4">{student.nis}</td>
                                            <td className="px-6 py-4">{student.nisn}</td>
                                            <td className="px-6 py-4 text-center space-x-2">
                                                <button onClick={() => handleEdit(student)} className="font-medium text-indigo-600 hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(student)} className="font-medium text-red-600 hover:underline">Hapus</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-slate-500">
                                            Belum ada data siswa. Klik 'Tambah Siswa' untuk memulai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataSiswaPage;
