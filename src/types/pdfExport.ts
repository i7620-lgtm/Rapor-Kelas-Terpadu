export type PdfOrientation = 'portrait' | 'landscape';

export interface ResolvedPdfImage {
  data: string | Uint8Array;
  format: 'PNG' | 'JPEG';
}

export interface VectorKopElement {
  id: string;
  type: 'text' | 'image' | 'line' | 'rect';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | string;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  textDecoration?: string;
}

export interface VectorRaporSubjectItem {
  id: string;
  name: string;
  grade: number | string | null | undefined;
  highest: string;
  lowest: string;
}

export interface VectorRaporStudentEntry {
  student: any;
  rank: number | null;
  shouldDisplayRank: boolean;
  reportSubjects: VectorRaporSubjectItem[];
  cocurricularDescription: string;
  extraActivities: Array<{ id: string; name: string; description: string }>;
  attendance: { sakit: number; izin: number; alpa: number };
  noteContent: string;
  photoImage?: ResolvedPdfImage | null;
}

export interface VectorRaporPayload {
  kind: 'rapor';
  formatWidth: number;
  formatHeight: number;
  orientation: PdfOrientation;
  settings: any;
  selectedPages: {
    cover: boolean;
    schoolIdentity: boolean;
    studentIdentity: boolean;
    academic: boolean;
  };
  hideGradesForFaseA: boolean;
  kkm: number;
  printOptions: {
    showPrincipalSignature?: boolean;
    showTeacherSignature?: boolean;
  };
  kopElements: VectorKopElement[];
  images: {
    logoCover?: ResolvedPdfImage | null;
    logoDinas?: ResolvedPdfImage | null;
    logoSekolah?: ResolvedPdfImage | null;
    ttdKepalaSekolah?: ResolvedPdfImage | null;
    ttdWaliKelas?: ResolvedPdfImage | null;
  };
  entries: VectorRaporStudentEntry[];
}

export interface VectorPiagamEntry {
  student: any;
  rank: number | null;
  average: string;
}

export interface VectorPiagamPayload {
  kind: 'piagam';
  formatWidth: number;
  formatHeight: number;
  orientation: PdfOrientation;
  settings: any;
  printOptions: {
    showPrincipalSignature?: boolean;
    showTeacherSignature?: boolean;
  };
  layout: VectorKopElement[];
  images: {
    piagamBackground?: ResolvedPdfImage | null;
    logoDinas?: ResolvedPdfImage | null;
    logoSekolah?: ResolvedPdfImage | null;
    ttdKepalaSekolah?: ResolvedPdfImage | null;
    ttdWaliKelas?: ResolvedPdfImage | null;
  };
  entries: VectorPiagamEntry[];
}

export interface VectorLegerPayload {
  kind: 'leger';
  formatWidth: number;
  formatHeight: number;
  orientation: PdfOrientation;
  settings: any;
  displaySubjects: Array<{ id: string; label: string; fullName?: string }>;
  processedData: Array<{
    no: number;
    namaLengkap: string;
    nisn?: string;
    nis?: string;
    grades: Record<string, any>;
    total: number;
    average: string;
    rank: number;
  }>;
  statistics: {
    subjects: Record<string, { max: number; min: number; sum: number; avg: string }>;
    total: { max: number; min: number; sum: number; avg: string };
  } | null;
  kkm: number;
  printOptions: {
    showPrincipalSignature?: boolean;
    showTeacherSignature?: boolean;
  };
  kopElements: VectorKopElement[];
  images: {
    logoDinas?: ResolvedPdfImage | null;
    logoSekolah?: ResolvedPdfImage | null;
    ttdKepalaSekolah?: ResolvedPdfImage | null;
    ttdWaliKelas?: ResolvedPdfImage | null;
  };
}

export type VectorPdfPayload =
  | VectorRaporPayload
  | VectorPiagamPayload
  | VectorLegerPayload;

export interface PdfExportProgress {
  current: number;
  total: number;
  statusText: string;
}
