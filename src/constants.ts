
export const defaultSubjects = [
    { id: 'PAIslam', fullName: 'Pendidikan Agama dan Budi Pekerti (Islam)', label: 'PA Islam', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Islam)' },
    { id: 'PAKristen', fullName: 'Pendidikan Agama dan Budi Pekerti (Kristen)', label: 'PA Kristen', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Kristen)' },
    { id: 'PAKatolik', fullName: 'Pendidikan Agama dan Budi Pekerti (Katolik)', label: 'PA Katolik', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Katolik)' },
    { id: 'PAHindu', fullName: 'Pendidikan Agama dan Budi Pekerti (Hindu)', label: 'PA Hindu', active: true, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Hindu)' },
    { id: 'PABuddha', fullName: 'Pendidikan Agama dan Budi Pekerti (Buddha)', label: 'PA Buddha', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Buddha)' },
    { id: 'PAKhonghucu', fullName: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)', label: 'PA Khonghucu', active: false, curriculumKey: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)' },
    { id: 'PAKTTMYME', fullName: 'Pendidikan Kepercayaan Terhadap Tuhan Yang Maha Esa dan Budi Pekerti', label: 'Kepercayaan', active: true, curriculumKey: 'Pendidikan Kepercayaan Terhadap Tuhan Yang Maha Esa dan Budi Pekerti' },
    { id: 'PP', fullName: 'Pendidikan Pancasila', label: 'PP', active: true, curriculumKey: 'Pendidikan Pancasila' },
    { id: 'BIndo', fullName: 'Bahasa Indonesia', label: 'B. Indo', active: true, curriculumKey: 'Bahasa Indonesia' },
    { id: 'MTK', fullName: 'Matematika', label: 'MTK', active: true, curriculumKey: 'Matematika' },
    { id: 'IPAS', fullName: 'Ilmu Pengetahuan Alam dan Sosial', label: 'IPAS', active: true, curriculumKey: 'Ilmu Pengetahuan Alam dan Sosial' },
    { id: 'SeniMusik', fullName: 'Seni Budaya (Seni Musik)', label: 'S. Musik', active: false, curriculumKey: 'Seni Budaya (Seni Musik)' },
    { id: 'SeniRupa', fullName: 'Seni Budaya (Seni Rupa)', label: 'S. Rupa', active: true, curriculumKey: 'Seni Budaya (Seni Rupa)' },
    { id: 'SeniTari', fullName: 'Seni Budaya (Seni Tari)', label: 'S. Tari', active: false, curriculumKey: 'Seni Budaya (Seni Tari)' },
    { id: 'SeniTeater', fullName: 'Seni Budaya (Seni Teater)', label: 'S. Teater', active: false, curriculumKey: 'Seni Budaya (Seni Teater)' },
    { id: 'PJOK', fullName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', label: 'PJOK', active: true, curriculumKey: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' },
    { id: 'BIng', fullName: 'Bahasa Inggris', label: 'B. Ing', active: true, curriculumKey: 'Bahasa Inggris' },
    { id: 'BBali', fullName: 'Muatan Lokal (Bahasa Bali)', label: 'B. Bali', active: true, curriculumKey: 'Muatan Lokal (Bahasa Bali)' },
    { id: 'KodingAI', fullName: 'Koding dan Kecerdasan Artifisial', label: 'KKA', active: true, curriculumKey: 'Koding dan Kecerdasan Artifisial' },
];

export const initialSettings = {
  nama_dinas_pendidikan: '', nama_sekolah: '', npsn: '', alamat_sekolah: '', desa_kelurahan: '',
  kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '', email_sekolah: '',
  telepon_sekolah: '', website_sekolah: '', faksimile: '', logo_sekolah: null,
  logo_dinas: null, logo_cover: null, piagam_background: null,
  ttd_kepala_sekolah: null, ttd_wali_kelas: null,
  nama_kelas: '', tahun_ajaran: '', semester: '', tanggal_rapor: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', nama_wali_kelas: '', nip_wali_kelas: '',
  nip_label_kepala_sekolah: 'NIP', nip_label_wali_kelas: 'NIP',
  cocurricular_theme: '', cocurricular_theme_Genap: '',
  predikats: { a: '90', b: '80', c: '70', d: '0' },
  gradeCalculation: {},
  qualitativeGradingMap: {},
  slmVisibility: {}, 
  kop_layout: [],
  piagam_layout: [],
  nilaiDisplayMode: 'kuantitatif saja', 
  enableExitWarning: false,
  enableAutoRegression: false,
};

export const initialStudents = [];
export const initialGrades = [];
export const initialNotes = {};
export const initialCocurricularData = {};
export const initialAttendance = [];
export const initialStudentExtracurriculars = [];
export const initialFormativeJournal = {};
export const initialLearningObjectives = {};

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'PANDUAN', label: 'Cara Penggunaan' },
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
    { key: 'foto', label: 'Foto 3x4', description: 'Foto siswa ukuran 3x4.', type: 'photo' },
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

export const getContextualKey = (settings, baseKey) => {
    if (!settings) return baseKey;
    const kls = String(settings.nama_kelas || '').replace(/[^a-zA-Z0-9]/g, '');
    const ta = String(settings.tahun_ajaran || '').replace(/[^a-zA-Z0-9]/g, '');
    const sem = String(settings.semester || '').replace(/[^a-zA-Z0-9]/g, '');
    return `${baseKey}_ctx_${kls}_${ta}_${sem}`;
};

export const getContextualValue = (settings, baseKey) => {
    if (!settings) return '';
    const dynKey = getContextualKey(settings, baseKey);
    return settings[dynKey] || settings[baseKey] || '';
};

export const getTanggalRaporKey = (settings) => {
    if (!settings) return 'tanggal_rapor';
    const kls = String(settings.nama_kelas || '').replace(/[^a-zA-Z0-9]/g, '');
    const ta = String(settings.tahun_ajaran || '').replace(/[^a-zA-Z0-9]/g, '');
    const sem = String(settings.semester || '').replace(/[^a-zA-Z0-9]/g, '');
    return `tanggal_rapor_ctx_${kls}_${ta}_${sem}`;
};

export const getTanggalRaporValue = (settings) => {
    if (!settings) return '';
    const dynKey = getTanggalRaporKey(settings);
    return settings[dynKey] || '';
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