

import { NavItem, DataAction, Student } from './types.ts';

export const NAV_ITEMS: NavItem[] = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'DATA_SISWA', label: 'Data Siswa' },
  { id: 'DATA_NILAI', label: 'Data Nilai' },
  { id: 'DATA_EKSTRAKURIKULER', label: 'Data Ekstrakurikuler' },
  { id: 'DATA_PROYEK_P5', label: 'Data Proyek P5' },
  { id: 'DATA_ABSENSI', label: 'Data Absensi' },
  { id: 'CATATAN_WALI_KELAS', label: 'Catatan Wali Kelas' },
  { id: 'PRINT_RAPOR', label: 'Print Rapor' },
  { id: 'PENGATURAN', label: 'Pengaturan' },
];

export const DATA_ACTIONS: DataAction[] = [
  { id: 'EKSPORT', label: 'Ekspor Seluruh Data' },
  { id: 'IMPORT', label: 'Impor Seluruh Data' },
];

export const studentFieldDefinitions: Array<{ key: keyof Student | 'no', label: string, description: string }> = [
    { key: 'no', label: "No", description: "Nomor urut siswa, biasanya sesuai absen." },
    { key: 'namaLengkap', label: "Nama Lengkap", description: "Nama lengkap siswa sesuai akta kelahiran." },
    { key: 'namaPanggilan', label: "Nama Panggilan", description: "Nama panggilan atau sapaan akrab siswa." },
    { key: 'nis', label: "NIS", description: "Nomor Induk Siswa (NIS) yang dikeluarkan oleh sekolah." },
    { key: 'nisn', label: "NISN", description: "Nomor Induk Siswa Nasional (NISN) yang unik." },
    { key: 'tempatLahir', label: "Tempat Lahir", description: "Kota atau kabupaten tempat siswa dilahirkan." },
    { key: 'tanggalLahir', label: "Tanggal Lahir", description: "Tanggal lahir siswa, format ideal: YYYY-MM-DD." },
    { key: 'jenisKelamin', label: "Jenis Kelamin", description: "Jenis kelamin siswa (Laki-laki atau Perempuan)." },
    { key: 'agama', label: "Agama", description: "Agama atau kepercayaan yang dianut siswa." },
    { key: 'kewarganegaraan', label: "Kewarganegaraan", description: "Kewarganegaraan siswa, contoh: WNI atau WNA." },
    { key: 'statusDalamKeluarga', label: "Status dalam Keluarga", description: "Posisi siswa dalam keluarga, contoh: Anak Kandung, Anak Tiri." },
    { key: 'anakKe', label: "Anak Ke-", description: "Urutan kelahiran siswa dalam keluarga, contoh: 1, 2, 3." },
    { key: 'asalTk', label: "Asal TK", description: "Nama Taman Kanak-kanak (TK) atau PAUD tempat siswa bersekolah sebelumnya." },
    { key: 'alamatSiswa', label: "Alamat Siswa", description: "Alamat lengkap tempat tinggal siswa saat ini." },
    { key: 'namaAyah', label: "Nama Ayah", description: "Nama lengkap ayah kandung siswa." },
    { key: 'namaIbu', label: "Nama Ibu", description: "Nama lengkap ibu kandung siswa." },
    { key: 'pekerjaanAyah', label: "Pekerjaan Ayah", description: "Pekerjaan atau profesi ayah siswa." },
    { key: 'pekerjaanIbu', label: "Pekerjaan Ibu", description: "Pekerjaan atau profesi ibu siswa." },
    { key: 'alamatOrangTua', label: "Alamat Orang Tua", description: "Alamat lengkap tempat tinggal orang tua jika berbeda dengan siswa." },
    { key: 'teleponOrangTua', label: "Telepon Orang Tua", description: "Nomor telepon orang tua yang bisa dihubungi." },
    { key: 'namaWali', label: "Nama Wali", description: "Nama lengkap wali siswa (jika ada, selain orang tua)." },
    { key: 'pekerjaanWali', label: "Pekerjaan Wali", description: "Pekerjaan atau profesi wali siswa." },
    { key: 'alamatWali', label: "Alamat Wali", description: "Alamat lengkap tempat tinggal wali siswa." },
    { key: 'teleponWali', label: "Telepon Wali", description: "Nomor telepon wali siswa yang bisa dihubungi." }
];
