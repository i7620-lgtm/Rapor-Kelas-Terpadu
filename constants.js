import React from 'react';
import { Page, NavItem, DataAction, Student } from './types';

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

export const studentFieldDefinitions: { key: keyof Omit<Student, 'id' | 'no'>; label: string; description: string }[] = [
    { key: 'namaLengkap', label: 'Nama Lengkap', description: 'Nama lengkap siswa (wajib diisi).' },
    { key: 'namaPanggilan', label: 'Nama Panggilan', description: 'Nama panggilan siswa.' },
    { key: 'nis', label: 'NIS', description: 'Nomor Induk Siswa.' },
    { key: 'nisn', label: 'NISN', description: 'Nomor Induk Siswa Nasional.' },
    { key: 'tempatLahir', label: 'Tempat Lahir', description: 'Kota atau tempat kelahiran siswa.' },
    { key: 'tanggalLahir', label: 'Tanggal Lahir', description: 'Tanggal lahir siswa (format YYYY-MM-DD).' },
    { key: 'jenisKelamin', label: 'Jenis Kelamin', description: 'Jenis kelamin siswa (Laki-laki atau Perempuan).' },
    { key: 'agama', label: 'Agama', description: 'Agama atau kepercayaan yang dianut siswa.' },
    { key: 'kewarganegaraan', label: 'Kewarganegaraan', description: 'Kewarganegaraan siswa (e.g., WNI).' },
    { key: 'statusDalamKeluarga', label: 'Status dalam Keluarga', description: 'Status siswa dalam keluarga (e.g., Anak Kandung).' },
    { key: 'anakKe', label: 'Anak Ke-', description: 'Urutan kelahiran siswa (e.g., 1, 2).' },
    { key: 'asalTk', label: 'Asal TK', description: 'Nama TK atau PAUD asal siswa.' },
    { key: 'alamatSiswa', label: 'Alamat Siswa', description: 'Alamat tempat tinggal siswa.' },
    { key: 'namaAyah', label: 'Nama Ayah', description: 'Nama lengkap ayah siswa.' },
    { key: 'namaIbu', label: 'Nama Ibu', description: 'Nama lengkap ibu siswa.' },
    { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', description: 'Pekerjaan ayah siswa.' },
    { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', description: 'Pekerjaan ibu siswa.' },
    { key: 'alamatOrangTua', label: 'Alamat Orang Tua', description: 'Alamat tempat tinggal orang tua.' },
    { key: 'teleponOrangTua', label: 'Telepon Orang Tua', description: 'Nomor telepon orang tua yang bisa dihubungi.' },
    { key: 'namaWali', label: 'Nama Wali', description: 'Nama lengkap wali siswa (jika berbeda dari orang tua).' },
    { key: 'pekerjaanWali', label: 'Pekerjaan Wali', description: 'Pekerjaan wali siswa.' },
    { key: 'alamatWali', label: 'Alamat Wali', description: 'Alamat tempat tinggal wali siswa.' },
    { key: 'teleponWali', label: 'Telepon Wali', description: 'Nomor telepon wali siswa.' },
];
