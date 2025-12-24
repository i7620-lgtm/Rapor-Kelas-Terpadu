
export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'DATA_SISWA', label: 'Data Siswa' },
  { id: 'JURNAL_FORMATIF', label: 'Jurnal Formatif' },
  { id: 'DATA_NILAI', label: 'Data Nilai' },
  { id: 'DATA_KOKURIKULER', label: 'Data Kokurikuler' },
  { id: 'DATA_EKSTRAKURIKULER', label: 'Data Ekstrakurikuler' },
  { id: 'DATA_ABSENSI', label: 'Data Absensi' },
  { id: 'CATATAN_WALI_KELAS', label: 'Catatan Wali Kelas' },
  { id: 'PRINT_RAPOR', label: 'Print Rapor' },
  { id: 'PRINT_PIAGAM', label: 'Print Piagam' },
  { id: 'PRINT_LEGER', label: 'Print Leger' },
  { id: 'PENGATURAN', label: 'Pengaturan' },
];

export const DATA_ACTIONS = [
  { id: 'EKSPORT', label: 'Unduh Data dari RKT' },
  { id: 'IMPORT', label: 'Unggah Data ke RKT' },
  { id: 'ISI_ERAPOR', label: 'Isi Format E-Rapor' },
];

export const studentFieldDefinitions = [
    { key: 'namaLengkap', label: 'Nama Lengkap', description: 'Nama lengkap siswa (wajib diisi).', type: 'text', placeholder: 'e.g. I Made Hermawan Surya Putra' },
    { key: 'namaPanggilan', label: 'Nama Panggilan', description: 'Nama panggilan siswa.', type: 'text', placeholder: 'e.g. Hermawan' },
    { key: 'nis', label: 'NIS', description: 'Nomor Induk Siswa.', type: 'text', placeholder: 'e.g. 12345' },
    { key: 'nisn', label: 'NISN', description: 'Nomor Induk Siswa Nasional.', type: 'text', placeholder: 'e.g. 0123456789' },
    { key: 'ttl', label: 'Tempat, Tanggal Lahir', description: 'e.g. Denpasar, 19 Desember 2025', type: 'text', placeholder: 'e.g. Denpasar, 1 Mei 2025' },
    { key: 'jenisKelamin', label: 'Jenis Kelamin', description: 'Jenis kelamin siswa (Laki-laki atau Perempuan).', type: 'text', placeholder: 'e.g. Laki-laki / Perempuan' },
    { key: 'agama', label: 'Agama', description: 'Agama atau kepercayaan yang dianut siswa.', type: 'text', placeholder: 'e.g. Buddha' },
    { key: 'asalTk', label: 'Asal TK', description: 'Nama TK atau PAUD asal siswa.', type: 'text', placeholder: 'e.g. TK Merdeka Nusantara' },
    { key: 'alamatSiswa', label: 'Alamat Siswa', description: 'Alamat tempat tinggal siswa.', type: 'textarea', placeholder: 'e.g. Jl. Merdeka No. 1' },
    { key: 'diterimaDiKelas', label: 'Diterima di Kelas', description: 'Siswa diterima di kelas ini (misal: IA / I A / 1A / 1 A).', type: 'text', placeholder: 'e.g. IA / I A / 1A / 1 A' },
    { key: 'diterimaTanggal', label: 'Diterima Tanggal', description: 'Tanggal siswa diterima di sekolah ini.', type: 'text', placeholder: 'e.g. 1 Mei 2025' },
    { key: 'namaAyah', label: 'Nama Ayah', description: 'Nama lengkap ayah siswa.', type: 'text', placeholder: 'e.g. I Made Putra' },
    { key: 'namaIbu', label: 'Nama Ibu', description: 'Nama lengkap ibu siswa.', type: 'text', placeholder: 'e.g. I Kadek Putri' },
    { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', description: 'Pekerjaan ayah siswa.', type: 'text', placeholder: 'e.g. Petani' },
    { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', description: 'Pekerjaan ibu siswa.', type: 'text', placeholder: 'e.g. Ibu Rumah Tangga' },
    { key: 'alamatOrangTua', label: 'Alamat Orang Tua', description: 'Alamat tempat tinggal orang tua.', type: 'textarea', placeholder: 'e.g. Jl. Merdeka No. 1' },
    { key: 'teleponOrangTua', label: 'Telepon Orang Tua', description: 'Nomor telepon orang tua yang bisa dihubungi.', type: 'text', placeholder: 'e.g. 081234567890' },
    { key: 'namaWali', label: 'Nama Wali', description: 'Nama lengkap wali siswa (jika berbeda dari orang tua).', type: 'text', placeholder: 'Kosongkan jika sama' },
    { key: 'pekerjaanWali', label: 'Pekerjaan Wali', description: 'Pekerjaan wali siswa.', type: 'text', placeholder: 'Kosongkan jika sama' },
    { key: 'alamatWali', label: 'Alamat Wali', description: 'Alamat tempat tinggal wali siswa.', type: 'textarea', placeholder: 'Kosongkan jika sama' },
    { key: 'teleponWali', label: 'Telepon Wali', description: 'Nomor telepon wali siswa.', type: 'text', placeholder: 'Kosongkan jika sama' },
];

export const COCURRICULAR_DIMENSIONS = [
    { id: 'keimanan', label: 'Keimanan dan Ketakwaan' },
    { id: 'kewargaan', label: 'Kewargaan' },
    { id: 'penalaran_kritis', label: 'Penalaran Kritis' },
    { id: 'kreativitas', label: 'Kreativitas' },
    { id: 'kolaborasi', label: 'Kolaborasi' },
    { id: 'kemandirian', label: 'Kemandirian' },
    { id: 'kesehatan', label: 'Kesehatan' },
    { id: 'komunikasi', label: 'Komunikasi' },
];

export const COCURRICULAR_RATINGS = {
    BB: 'Belum Berkembang',
    MB: 'Mulai Berkembang',
    BSH: 'Berkembang Sesuai Harapan',
    SB: 'Sudah Berkembang',
};

export const QUALITATIVE_DESCRIPTORS = {
    SB: 'Sangat Baik',
    BSH: 'Berkembang Sesuai Harapan',
    MB: 'Mulai Berkembang',
    BB: 'Belum Berkembang',
};

export const FORMATIVE_ASSESSMENT_TYPES = [
    'Observasi',
    'Kuis Singkat',
    'Presentasi',
    'Diskusi Kelompok',
    'Penilaian Diri',
    'Penilaian Teman',
    'Projek Mini',
    'Lainnya'
];
