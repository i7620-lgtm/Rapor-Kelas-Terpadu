export type Page = 
  | 'DASHBOARD'
  | 'DATA_SISWA'
  | 'DATA_NILAI'
  | 'DATA_ABSENSI'
  | 'DATA_EKSTRAKURIKULER'
  | 'DATA_PROYEK_P5'
  | 'CATATAN_WALI_KELAS'
  | 'PRINT_RAPOR'
  | 'PENGATURAN';

export interface NavItem {
  id: Page;
  label: string;
}

export interface DataAction {
    id: 'EKSPORT' | 'IMPORT';
    label: string;
}

export interface KopElement {
  id: string;
  type: 'text' | 'image' | 'line';
  content: string; // For text, this is the text itself. For images, it can be a key like 'logo_sekolah'. For lines, it's not used.
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: 'Poppins' | 'Noto Sans Balinese';
  isLocked?: boolean; // To prevent moving/editing certain auto-filled elements
}

export type KopLayout = KopElement[];

export interface AppSettings {
  nama_dinas_pendidikan: string;
  nama_sekolah: string;
  npsn: string;
  alamat_sekolah: string;
  desa_kelurahan: string;
  kecamatan: string;
  kota_kabupaten: string;
  provinsi: string;
  kode_pos: string;
  email_sekolah: string;
  telepon_sekolah: string;
  website_sekolah: string;
  faksimile: string;
  logo_sekolah: File | null | string;
  logo_dinas: File | null | string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester: string;
  tanggal_rapor: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
  nama_wali_kelas: string;
  nip_wali_kelas: string;
  kop_layout: KopLayout;
}

export interface Student {
    id: number;
    namaLengkap: string;
    namaPanggilan: string;
    nis: string;
    nisn: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: 'Laki-laki' | 'Perempuan' | '';
    agama: string;
    kewarganegaraan: string;
    statusDalamKeluarga: string;
    anakKe: string;
    asalTk: string;
    alamatSiswa: string;
    namaAyah: string;
    namaIbu: string;
    pekerjaanAyah: string;
    pekerjaanIbu: string;
    alamatOrangTua: string;
    teleponOrangTua: string;
    namaWali: string;
    pekerjaanWali: string;
    alamatWali: string;
    teleponWali: string;
}

export type SubjectKey = string;

export interface Subject {
    id: SubjectKey;
    fullName: string;
    label: string;
    active: boolean;
}

export const defaultSubjects: Subject[] = [
    { id: 'PAI', fullName: 'Pendidikan Agama dan Budi Pekerti (Islam)', label: 'PAI', active: false },
    { id: 'PAKristen', fullName: 'Pendidikan Agama dan Budi Pekerti (Kristen)', label: 'PA Kristen', active: true },
    { id: 'PAKatolik', fullName: 'Pendidikan Agama dan Budi Pekerti (Katolik)', label: 'PA Katolik', active: true },
    { id: 'PAHindu', fullName: 'Pendidikan Agama dan Budi Pekerti (Hindu)', label: 'PA Hindu', active: true },
    { id: 'PABuddha', fullName: 'Pendidikan Agama dan Budi Pekerti (Buddha)', label: 'PA Buddha', active: true },
    { id: 'PAKhonghucu', fullName: 'Pendidikan Agama dan Budi Pekerti (Khonghucu)', label: 'PA Khonghucu', active: true },
    { id: 'PP', fullName: 'Pendidikan Pancasila', label: 'PP', active: true },
    { id: 'BIndo', fullName: 'Bahasa Indonesia', label: 'B. Indo', active: true },
    { id: 'MTK', fullName: 'Matematika', label: 'MTK', active: true },
    { id: 'IPAS', fullName: 'Ilmu Pengetahuan Alam dan Sosial', label: 'IPAS', active: true },
    { id: 'SeniMusik', fullName: 'Seni Budaya (Seni Musik)', label: 'S. Musik', active: true },
    { id: 'SeniRupa', fullName: 'Seni Budaya (Seni Rupa)', label: 'S. Rupa', active: false },
    { id: 'SeniTari', fullName: 'Seni Budaya (Seni Tari)', label: 'S. Tari', active: false },
    { id: 'SeniTeater', fullName: 'Seni Budaya (Seni Teater)', label: 'S. Teater', active: false },
    { id: 'PJOK', fullName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', label: 'PJOK', active: true },
    { id: 'BIng', fullName: 'Bahasa Inggris', label: 'B. Ing', active: true },
    { id: 'BSunda', fullName: 'Muatan Lokal (Bahasa Sunda)', label: 'B. Sunda', active: false },
    { id: 'BBali', fullName: 'Muatan Lokal (Bahasa Bali)', label: 'B. Bali', active: true },
];

export interface DetailedSubjectGrade {
    tp: (number | null)[];
    sts: number | null;
    sas: number | null;
}

export interface StudentGrade {
    studentId: number;
    detailedGrades: {
        [key: SubjectKey]: DetailedSubjectGrade;
    };
    finalGrades: {
        [key: SubjectKey]: number | null;
    };
    [key: string]: any;
}

export interface LearningObjectives {
    [grade: string]: {
        [subject: string]: string[];
    };
}

export interface StudentDescriptions {
    [studentId: number]: {
        [subject: SubjectKey]: string;
    };
}

export interface StudentAttendance {
    studentId: number;
    sakit: number;
    izin: number;
    alpa: number;
}

export interface Extracurricular {
    id: string;
    name: string;
    active: boolean;
}

export interface StudentExtracurricular {
    studentId: number;
    assignedActivities: (string | null)[];
    descriptions: {
        [activityId: string]: string;
    };
}

export interface StudentNotes {
    [studentId: number]: string;
}

export interface NoteTemplate {
    id: string;
    title: string;
    content: string;
}

export type P5AssessmentLevel =
  | 'Belum Berkembang'
  | 'Mulai Berkembang'
  | 'Berkembang sesuai Harapan'
  | 'Sangat Berkembang';

export interface P5ProjectSubElement {
    name: string;
    targets: string[];
}

export interface P5ProjectDimension {
    name: string;
    subElements: P5ProjectSubElement[];
}

export interface P5Project {
    id: string;
    title: string;
    description: string;
    dimensions: P5ProjectDimension[];
}

export interface P5ProjectAssessment {
    studentId: number;
    projectId: string;
    assessments: {
        [subElementKey: string]: P5AssessmentLevel | '';
    };
}

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
}

export interface AnalysisItemProps {
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'attention';
}
