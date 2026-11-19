import { jsPDF } from 'jspdf';
import type {
  ResolvedPdfImage,
  VectorKopElement,
  VectorLegerPayload,
  VectorPdfPayload,
  VectorPiagamPayload,
  VectorRaporPayload,
} from '../types/pdfExport';

type ProgressCallback = (current: number, total: number, statusText: string) => void;

const MARGIN_LR = 1.5;
const MARGIN_TOP = 1.5;
const HEADER_BOTTOM_Y = 5.8;
const MARGIN_BOTTOM = 1.6;
const FOOTER_RESERVE = 2.1;

function safeStr(val: unknown, fallback = '-'): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s === '' ? fallback : s;
}

function toRoman(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return '';
  const roman: Array<[string, number]> = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
  ];
  let n = Math.floor(num);
  let res = '';
  for (const [sym, val] of roman) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res;
}

function getGradeNumberLocal(namaKelas?: string): number | null {
  if (!namaKelas) return null;
  const str = String(namaKelas).toUpperCase();
  const numMatch = str.match(/\d+/);
  if (numMatch) {
    const n = parseInt(numMatch[0], 10);
    if (n >= 1 && n <= 6) return n;
  }
  if (/\bVI\b/.test(str)) return 6;
  if (/\bV\b/.test(str)) return 5;
  if (/\bIV\b/.test(str)) return 4;
  if (/\bIII\b/.test(str)) return 3;
  if (/\bII\b/.test(str)) return 2;
  if (/\bI\b/.test(str)) return 1;
  return null;
}

function getPhaseLocal(gradeNum: number | null): string {
  if (gradeNum === null) return '';
  if (gradeNum >= 5) return 'C';
  if (gradeNum >= 3) return 'B';
  if (gradeNum >= 1) return 'A';
  return '';
}

function getContextualVal(settings: any, key: string): string {
  if (!settings) return '';
  const sem = settings.semester || 'Ganjil';
  const kelas = settings.nama_kelas || '';
  const ta = settings.tahun_ajaran || '';
  const scopedKey = `${key}_ctx_${ta}_${kelas}_${sem}`;
  if (settings[scopedKey] !== undefined && settings[scopedKey] !== '') {
    return String(settings[scopedKey]);
  }
  const suffix = sem.toLowerCase().includes('genap') ? '_Genap' : '';
  if (suffix && settings[`${key}${suffix}`] !== undefined && settings[`${key}${suffix}`] !== '') {
    return String(settings[`${key}${suffix}`]);
  }
  return String(settings[key] || '');
}

function getTanggalRaporLocal(settings: any): string {
  const val = getContextualVal(settings, 'tanggal_rapor');
  if (val) return val;
  return `${settings?.kota_kabupaten || 'Tempat'}, ____-__-____`;
}

function resolveAcademicYear(settings: any): string {
  const tanggalRapor = getTanggalRaporLocal(settings);
  if (tanggalRapor && !tanggalRapor.includes('____')) {
    const parts = tanggalRapor.split(' ');
    if (parts.length >= 3) {
      const yearPart = parseInt(parts[parts.length - 1], 10);
      const monthName = parts[parts.length - 2]?.toLowerCase() || '';
      const months = [
        'januari', 'februari', 'maret', 'april', 'mei', 'juni',
        'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
      ];
      const monthIndex = months.indexOf(monthName);
      if (!Number.isNaN(yearPart) && monthIndex !== -1) {
        return monthIndex < 6 ? `${yearPart - 1}/${yearPart}` : `${yearPart}/${yearPart + 1}`;
      }
    }
  }
  return settings?.tahun_ajaran || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
}

function addImageSafe(
  pdf: jsPDF,
  img: ResolvedPdfImage | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!img || !img.data) return;
  try {
    pdf.addImage(img.data as any, img.format, x, y, w, h, undefined, 'FAST');
  } catch {
    // Skip corrupt/unsupported image gracefully so vector generation never fails
  }
}

function drawKopHeader(
  pdf: jsPDF,
  kopElements: VectorKopElement[],
  pageWidth: number,
  images: { logoDinas?: ResolvedPdfImage | null; logoSekolah?: ResolvedPdfImage | null }
) {
  const contentWidth = pageWidth - MARGIN_LR * 2;
  const viewBoxW = 800;
  const viewBoxH = 200;
  const boxHeight = (contentWidth * viewBoxH) / viewBoxW;
  const scaleX = contentWidth / viewBoxW;
  const scaleY = boxHeight / viewBoxH;

  for (const el of kopElements) {
    if (el.id?.includes('aksara_') || el.fontFamily === 'Noto Sans Balinese') {
      continue;
    }
    if (el.type === 'text') {
      const fontSizePt = Math.max(7, (el.fontSize || 12) * 0.68);
      pdf.setFont('times', el.fontWeight === 'bold' ? 'bold' : 'normal');
      pdf.setFontSize(fontSizePt);
      pdf.setTextColor(0, 0, 0);

      let align: 'left' | 'center' | 'right' = 'left';
      let xCm = MARGIN_LR + el.x * scaleX;
      if (el.textAlign === 'center') {
        align = 'center';
        xCm = MARGIN_LR + (el.x + (el.width || 0) / 2) * scaleX;
      } else if (el.textAlign === 'right') {
        align = 'right';
        xCm = MARGIN_LR + (el.x + (el.width || 0)) * scaleX;
      }
      const yCm = MARGIN_TOP + (el.y + (el.fontSize || 12) * 0.85) * scaleY;
      pdf.text(String(el.content || ''), xCm, yCm, { align });
    } else if (el.type === 'image') {
      const img =
        el.content === 'logo_dinas'
          ? images.logoDinas
          : el.content === 'logo_sekolah'
            ? images.logoSekolah
            : null;
      if (img) {
        addImageSafe(
          pdf,
          img,
          MARGIN_LR + el.x * scaleX,
          MARGIN_TOP + el.y * scaleY,
          (el.width || 80) * scaleX,
          (el.height || 80) * scaleY
        );
      }
    } else if (el.type === 'line') {
      const x1 = MARGIN_LR + el.x * scaleX;
      const x2 = MARGIN_LR + (el.x + (el.width || 780)) * scaleX;
      const yCm = MARGIN_TOP + el.y * scaleY;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(Math.max(0.03, ((el.height || 3) * scaleY)));
      pdf.line(x1, yCm, x2, yCm);
    }
  }
}

function buildVectorRapor(payload: VectorRaporPayload, onProgress?: ProgressCallback): ArrayBuffer {
  const { formatWidth, formatHeight, orientation, settings, selectedPages, entries, images } = payload;
  const pdf = new jsPDF({
    orientation,
    unit: 'cm',
    format: [formatWidth, formatHeight],
  });

  const contentW = formatWidth - MARGIN_LR * 2;
  const maxBodyY = formatHeight - FOOTER_RESERVE;
  let isFirstPageOverall = true;

  const ensureNewPage = () => {
    if (isFirstPageOverall) {
      isFirstPageOverall = false;
    } else {
      pdf.addPage([formatWidth, formatHeight], orientation);
    }
  };

  const totalEntries = Math.max(1, entries.length);

  entries.forEach((entry, entryIdx) => {
    const { student } = entry;
    onProgress?.(
      entryIdx,
      totalEntries,
      `Membuat PDF vektor rapor ${entryIdx + 1} dari ${totalEntries}: ${safeStr(student?.namaLengkap, 'Siswa')}...`
    );

    // 1. Cover Page
    if (selectedPages.cover) {
      ensureNewPage();
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.08);
      pdf.rect(MARGIN_LR, MARGIN_TOP, contentW, formatHeight - MARGIN_TOP - MARGIN_BOTTOM);
      pdf.setLineWidth(0.025);
      pdf.rect(
        MARGIN_LR + 0.14,
        MARGIN_TOP + 0.14,
        contentW - 0.28,
        formatHeight - MARGIN_TOP - MARGIN_BOTTOM - 0.28
      );

      let y = 4.2;
      if (images.logoCover) {
        addImageSafe(pdf, images.logoCover, (formatWidth - 4.4) / 2, y, 4.4, 4.4);
        y += 5.4;
      } else {
        y += 3.0;
      }

      pdf.setFont('times', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      ['RAPOR', 'MURID', 'SEKOLAH DASAR', '(SD)'].forEach((line) => {
        pdf.text(line, formatWidth / 2, y, { align: 'center' });
        y += 0.85;
      });

      y += 2.2;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text('Nama Murid:', formatWidth / 2, y, { align: 'center' });
      y += 0.3;

      const boxW = contentW - 3.0;
      const boxX = (formatWidth - boxW) / 2;
      pdf.setLineWidth(0.045);
      pdf.roundedRect(boxX, y, boxW, 1.35, 0.2, 0.2);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      pdf.text(safeStr(student?.namaLengkap, 'NAMA MURID').toUpperCase(), formatWidth / 2, y + 0.88, {
        align: 'center',
        maxWidth: boxW - 0.6,
      });

      y += 2.1;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text('NISN/NIS:', formatWidth / 2, y, { align: 'center' });
      y += 0.3;

      pdf.roundedRect(boxX, y, boxW, 1.35, 0.2, 0.2);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      pdf.text(`${safeStr(student?.nisn)} / ${safeStr(student?.nis)}`, formatWidth / 2, y + 0.88, {
        align: 'center',
      });

      const bottomBaseY = formatHeight - 3.6;
      pdf.setFontSize(14);
      pdf.text('KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH', formatWidth / 2, bottomBaseY, { align: 'center' });
      pdf.text('REPUBLIK INDONESIA', formatWidth / 2, bottomBaseY + 0.75, { align: 'center' });
      pdf.text(resolveAcademicYear(settings), formatWidth / 2, bottomBaseY + 1.5, { align: 'center' });
    }

    // 2. School Identity Page
    if (selectedPages.schoolIdentity) {
      ensureNewPage();
      drawKopHeader(pdf, payload.kopElements, formatWidth, images);
      let y = HEADER_BOTTOM_Y + 0.4;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text('IDENTITAS SEKOLAH', formatWidth / 2, y, { align: 'center' });
      y += 0.9;

      const rows = [
        ['1.', 'Nama Sekolah', settings?.nama_sekolah],
        ['2.', 'NPSN', settings?.npsn],
        ['3.', 'Alamat Sekolah', settings?.alamat_sekolah],
        ['4.', 'Kelurahan/Desa', settings?.desa_kelurahan],
        ['5.', 'Kecamatan', settings?.kecamatan],
        ['6.', 'Kabupaten/Kota', settings?.kota_kabupaten],
        ['7.', 'Provinsi', settings?.provinsi],
        ['8.', 'Website', settings?.website_sekolah],
        ['9.', 'E-mail', settings?.email_sekolah],
        ['10.', 'Kode Pos', settings?.kode_pos],
        ['11.', 'Telepon', settings?.telepon_sekolah],
      ];

      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      for (const [no, label, val] of rows) {
        pdf.text(String(no), MARGIN_LR, y);
        pdf.text(String(label), MARGIN_LR + 0.9, y);
        pdf.text(':', MARGIN_LR + 6.1, y);
        const wrapped = pdf.splitTextToSize(safeStr(val), contentW - 6.6);
        pdf.text(wrapped, MARGIN_LR + 6.5, y);
        y += Math.max(0.65, wrapped.length * 0.5 + 0.15);
      }
    }

    // 3. Student Identity Page
    if (selectedPages.studentIdentity) {
      ensureNewPage();
      drawKopHeader(pdf, payload.kopElements, formatWidth, images);
      let y = HEADER_BOTTOM_Y + 0.35;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text('IDENTITAS MURID', formatWidth / 2, y, { align: 'center' });
      y += 0.8;

      const sRows: Array<{ no: string; label: string; value: string; sub?: boolean }> = [
        { no: '1.', label: 'Nama Murid', value: safeStr(student?.namaLengkap, '').toUpperCase() || '-' },
        { no: '2.', label: 'NISN / NIS', value: `${safeStr(student?.nisn)} / ${safeStr(student?.nis)}` },
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: safeStr(student?.ttl) },
        { no: '4.', label: 'Jenis Kelamin', value: safeStr(student?.jenisKelamin) },
        { no: '5.', label: 'Agama', value: safeStr(student?.agama) },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: safeStr(student?.asalTk) },
        { no: '7.', label: 'Alamat Murid', value: safeStr(student?.alamatSiswa) },
        { no: '8.', label: 'Nama Orang Tua', value: '' },
        { no: '', label: 'a. Ayah', value: safeStr(student?.namaAyah), sub: true },
        { no: '', label: 'b. Ibu', value: safeStr(student?.namaIbu), sub: true },
        { no: '9.', label: 'Pekerjaan Orang Tua', value: '' },
        { no: '', label: 'a. Ayah', value: safeStr(student?.pekerjaanAyah), sub: true },
        { no: '', label: 'b. Ibu', value: safeStr(student?.pekerjaanIbu), sub: true },
        { no: '10.', label: 'Alamat Orang Tua', value: safeStr(student?.alamatOrangTua) },
        { no: '11.', label: 'Telepon Orang Tua', value: safeStr(student?.teleponOrangTua) },
        { no: '12.', label: 'Wali Murid', value: '' },
        { no: '', label: 'a. Nama', value: safeStr(student?.namaWali), sub: true },
        { no: '', label: 'b. Pekerjaan', value: safeStr(student?.pekerjaanWali), sub: true },
        { no: '', label: 'c. Alamat', value: safeStr(student?.alamatWali), sub: true },
      ];

      pdf.setFont('times', 'normal');
      pdf.setFontSize(10.5);
      for (const row of sRows) {
        if (row.no) pdf.text(row.no, MARGIN_LR, y);
        pdf.text(row.label, MARGIN_LR + (row.sub ? 1.4 : 0.9), y);
        pdf.text(':', MARGIN_LR + 6.4, y);
        const valText = row.value || '';
        if (valText) {
          const wrapped = pdf.splitTextToSize(valText, contentW - 6.8);
          pdf.text(wrapped, MARGIN_LR + 6.8, y);
          y += Math.max(0.55, wrapped.length * 0.45 + 0.1);
        } else {
          y += 0.55;
        }
      }

      const photoBoxY = Math.max(y + 0.6, formatHeight - 6.2);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.045);
      pdf.rect(MARGIN_LR + 0.8, photoBoxY, 3.0, 4.0);
      if (entry.photoImage) {
        addImageSafe(pdf, entry.photoImage, MARGIN_LR + 0.82, photoBoxY + 0.02, 2.96, 3.96);
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text('Pas Foto 3x4', MARGIN_LR + 2.3, photoBoxY + 2.05, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }

      const sigX = formatWidth - MARGIN_LR - 3.6;
      pdf.setFontSize(10.5);
      pdf.text(getTanggalRaporLocal(settings), sigX, photoBoxY + 0.3, { align: 'center' });
      pdf.text('Kepala Sekolah,', sigX, photoBoxY + 0.8, { align: 'center' });
      if (images.ttdKepalaSekolah) {
        addImageSafe(pdf, images.ttdKepalaSekolah, sigX - 1.5, photoBoxY + 0.95, 3.0, 1.9);
      }
      const kepsekName = getContextualVal(settings, 'nama_kepala_sekolah') || '_________________';
      const kepsekNipLabel = getContextualVal(settings, 'nip_label_kepala_sekolah') || 'NIP';
      const kepsekNip = getContextualVal(settings, 'nip_kepala_sekolah') || '-';
      pdf.setFont('times', 'bold');
      pdf.text(kepsekName, sigX, photoBoxY + 3.3, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.text(`${kepsekNipLabel}. ${kepsekNip}`, sigX, photoBoxY + 3.8, { align: 'center' });
    }

    // 4. Academic Pages
    if (selectedPages.academic) {
      let academicPageNumber = 1;
      ensureNewPage();
      drawKopHeader(pdf, payload.kopElements, formatWidth, images);

      const drawPageFooter = (pageNum: number) => {
        const footerY = formatHeight - 1.0;
        pdf.setFont('times', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const leftText = `${safeStr(settings?.nama_kelas, '')} | ${safeStr(student?.namaLengkap, '').toUpperCase()} | ${safeStr(student?.nisn)}`;
        pdf.text(leftText, MARGIN_LR, footerY);
        pdf.text(`Halaman ${pageNum}`, formatWidth - MARGIN_LR, footerY, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
      };

      const startContinuationPage = () => {
        drawPageFooter(academicPageNumber);
        academicPageNumber += 1;
        pdf.addPage([formatWidth, formatHeight], orientation);
        return MARGIN_TOP;
      };

      let y = HEADER_BOTTOM_Y + 0.25;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text('LAPORAN HASIL BELAJAR', formatWidth / 2, y, { align: 'center' });
      y += 0.65;

      // Student info 2-col table
      const gradeNum = getGradeNumberLocal(settings?.nama_kelas);
      const phase = getPhaseLocal(gradeNum);
      const infoRows: Array<[string, string, string, string]> = [
        ['Nama Murid', safeStr(student?.namaLengkap, '').toUpperCase(), 'Kelas', safeStr(settings?.nama_kelas, '')],
        ['NISN/NIS', `${safeStr(student?.nisn)} / ${safeStr(student?.nis)}`, 'Fase', phase || '-'],
        ['Nama Sekolah', safeStr(settings?.nama_sekolah, ''), 'Semester', safeStr(settings?.semester, '')],
        ['Alamat Sekolah', safeStr(settings?.alamat_sekolah, ''), 'Tahun Pelajaran', safeStr(settings?.tahun_ajaran, '')],
      ];

      pdf.setFontSize(10);
      for (let i = 0; i < infoRows.length; i++) {
        const [lLabel, lVal, rLabel, rVal] = infoRows[i];
        pdf.setFont('times', 'normal');
        pdf.text(lLabel, MARGIN_LR, y);
        pdf.text(':', MARGIN_LR + 2.8, y);
        pdf.setFont('times', i === 0 ? 'bold' : 'normal');
        const lWrapped = pdf.splitTextToSize(lVal, 7.6);
        pdf.text(lWrapped, MARGIN_LR + 3.1, y);

        pdf.setFont('times', 'normal');
        pdf.text(rLabel, MARGIN_LR + 11.4, y);
        pdf.text(':', MARGIN_LR + 14.5, y);
        pdf.text(safeStr(rVal, ''), MARGIN_LR + 14.8, y, { maxWidth: contentW - 14.8 });
        y += Math.max(0.46, lWrapped.length * 0.42);
      }

      y += 0.2;

      // Academic Table Columns
      const colNoW = 0.9;
      const colMapelW = 3.7;
      const colNilaiW = payload.hideGradesForFaseA ? 0 : 1.9;
      const colCapW = contentW - colNoW - colMapelW - colNilaiW;
      const xNo = MARGIN_LR;
      const xMapel = xNo + colNoW;
      const xNilai = xMapel + colMapelW;
      const xCap = xNilai + colNilaiW;

      const drawAcademicHeader = (topY: number): number => {
        const h = 0.65;
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.035);
        pdf.rect(xNo, topY, contentW, h);
        pdf.line(xMapel, topY, xMapel, topY + h);
        if (!payload.hideGradesForFaseA) {
          pdf.line(xNilai, topY, xNilai, topY + h);
        }
        pdf.line(xCap, topY, xCap, topY + h);

        pdf.setFont('times', 'bold');
        pdf.setFontSize(9.5);
        pdf.text('No.', xNo + colNoW / 2, topY + 0.44, { align: 'center' });
        pdf.text('Mata Pelajaran', xMapel + colMapelW / 2, topY + 0.44, { align: 'center' });
        if (!payload.hideGradesForFaseA) {
          pdf.text('Nilai Akhir', xNilai + colNilaiW / 2, topY + 0.44, { align: 'center' });
        }
        pdf.text('Capaian Kompetensi', xCap + colCapW / 2, topY + 0.44, { align: 'center' });
        return topY + h;
      };

      y = drawAcademicHeader(y);

      const lineH = 0.37;
      entry.reportSubjects.forEach((subj, idx) => {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(9);
        const mapelLines = pdf.splitTextToSize(safeStr(subj.name, ''), colMapelW - 0.25);
        const hiText = safeStr(subj.highest, '');
        const loText = safeStr(subj.lowest, '');
        const hiLines = hiText && hiText !== '-' ? pdf.splitTextToSize(hiText, colCapW - 0.25) : [];
        const loLines = loText && loText !== '-' ? pdf.splitTextToSize(loText, colCapW - 0.25) : [];
        const hasDivider = hiLines.length > 0 && loLines.length > 0;
        const capHeight =
          Math.max(1, hiLines.length) * lineH +
          (hasDivider ? 0.16 : 0) +
          (loLines.length > 0 ? loLines.length * lineH : 0) +
          0.16;
        const rowH = Math.max(0.75, mapelLines.length * lineH + 0.16, capHeight);

        if (y + rowH > maxBodyY) {
          y = startContinuationPage();
          y = drawAcademicHeader(y);
        }

        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.03);
        pdf.rect(xNo, y, contentW, rowH);
        pdf.line(xMapel, y, xMapel, y + rowH);
        if (!payload.hideGradesForFaseA) {
          pdf.line(xNilai, y, xNilai, y + rowH);
        }
        pdf.line(xCap, y, xCap, y + rowH);

        pdf.setFont('times', 'normal');
        pdf.setFontSize(9.5);
        pdf.text(String(idx + 1), xNo + colNoW / 2, y + 0.42, { align: 'center' });
        pdf.setFontSize(9);
        pdf.text(mapelLines, xMapel + 0.12, y + 0.4);

        if (!payload.hideGradesForFaseA) {
          const gradeStr = subj.grade === null || subj.grade === undefined || subj.grade === '' ? '-' : String(subj.grade);
          pdf.setFont('times', 'normal');
          pdf.setFontSize(10);
          pdf.text(gradeStr, xNilai + colNilaiW / 2, y + 0.45, { align: 'center' });
        }

        let capY = y + 0.38;
        pdf.setFont('times', 'normal');
        pdf.setFontSize(8.8);
        if (hiLines.length > 0) {
          pdf.text(hiLines, xCap + 0.12, capY);
          capY += hiLines.length * lineH;
        }
        if (hasDivider) {
          pdf.line(xCap, capY + 0.04, xCap + colCapW, capY + 0.04);
          capY += 0.16 + lineH * 0.7;
        }
        if (loLines.length > 0) {
          if (!hasDivider && hiLines.length === 0) capY = y + 0.38;
          pdf.text(loLines, xCap + 0.12, capY);
        }

        y += rowH;
      });

      const ensureSectionSpace = (neededH: number) => {
        if (y + neededH > maxBodyY) {
          y = startContinuationPage();
        }
      };

      // Kokurikuler
      y += 0.25;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9.5);
      const coLines = pdf.splitTextToSize(safeStr(entry.cocurricularDescription, '-'), contentW - 0.35);
      const coH = Math.max(1.2, 0.58 + coLines.length * 0.4);
      ensureSectionSpace(coH);
      pdf.setLineWidth(0.035);
      pdf.rect(MARGIN_LR, y, contentW, coH);
      pdf.setFont('times', 'bold');
      pdf.text('Kokurikuler', MARGIN_LR + 0.15, y + 0.42);
      pdf.setFont('times', 'normal');
      pdf.text(coLines, MARGIN_LR + 0.15, y + 0.82);
      y += coH + 0.2;

      // Ekstrakurikuler
      if (entry.extraActivities.length > 0) {
        const headerH = 0.6;
        ensureSectionSpace(headerH + 0.7);
        const exNoW = 0.9;
        const exNameW = 5.5;
        const exDescW = contentW - exNoW - exNameW;
        pdf.setLineWidth(0.035);
        pdf.rect(MARGIN_LR, y, contentW, headerH);
        pdf.line(MARGIN_LR + exNoW, y, MARGIN_LR + exNoW, y + headerH);
        pdf.line(MARGIN_LR + exNoW + exNameW, y, MARGIN_LR + exNoW + exNameW, y + headerH);
        pdf.setFont('times', 'bold');
        pdf.setFontSize(9.5);
        pdf.text('No.', MARGIN_LR + exNoW / 2, y + 0.42, { align: 'center' });
        pdf.text('Ekstrakurikuler', MARGIN_LR + exNoW + exNameW / 2, y + 0.42, { align: 'center' });
        pdf.text('Keterangan', MARGIN_LR + exNoW + exNameW + exDescW / 2, y + 0.42, { align: 'center' });
        y += headerH;

        entry.extraActivities.forEach((ex, exIdx) => {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(9);
          const descLines = pdf.splitTextToSize(safeStr(ex.description, '-'), exDescW - 0.25);
          const rowH = Math.max(0.62, descLines.length * 0.38 + 0.18);
          ensureSectionSpace(rowH);
          pdf.rect(MARGIN_LR, y, contentW, rowH);
          pdf.line(MARGIN_LR + exNoW, y, MARGIN_LR + exNoW, y + rowH);
          pdf.line(MARGIN_LR + exNoW + exNameW, y, MARGIN_LR + exNoW + exNameW, y + rowH);
          pdf.text(String(exIdx + 1), MARGIN_LR + exNoW / 2, y + 0.4, { align: 'center' });
          pdf.text(safeStr(ex.name, ''), MARGIN_LR + exNoW + 0.12, y + 0.4, { maxWidth: exNameW - 0.2 });
          pdf.text(descLines, MARGIN_LR + exNoW + exNameW + 0.12, y + 0.4);
          y += rowH;
        });
        y += 0.2;
      }

      // Attendance & Teacher Notes
      const attW = 5.6;
      const gapW = 0.25;
      const notesW = contentW - attW - gapW;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9.5);
      const noteLines = pdf.splitTextToSize(safeStr(entry.noteContent, 'Tidak ada catatan.'), notesW - 0.35);
      const attNotesH = Math.max(2.1, 0.72 + noteLines.length * 0.4);
      ensureSectionSpace(attNotesH);

      pdf.setLineWidth(0.035);
      pdf.rect(MARGIN_LR, y, attW, attNotesH);
      pdf.line(MARGIN_LR, y + 0.52, MARGIN_LR + attW, y + 0.52);
      pdf.setFont('times', 'bold');
      pdf.text('Ketidakhadiran', MARGIN_LR + attW / 2, y + 0.37, { align: 'center' });
      pdf.setFont('times', 'normal');
      const attItems: Array<[string, number]> = [
        ['Sakit', entry.attendance.sakit],
        ['Izin', entry.attendance.izin],
        ['Tanpa Keterangan', entry.attendance.alpa],
      ];
      const rowStep = (attNotesH - 0.52) / 3;
      attItems.forEach(([label, count], i) => {
        const rowTop = y + 0.52 + i * rowStep;
        if (i < 2) pdf.line(MARGIN_LR, rowTop + rowStep, MARGIN_LR + attW, rowTop + rowStep);
        pdf.text(label, MARGIN_LR + 0.15, rowTop + rowStep * 0.65);
        pdf.text(':', MARGIN_LR + 2.8, rowTop + rowStep * 0.65);
        pdf.text(`${count} hari`, MARGIN_LR + 3.1, rowTop + rowStep * 0.65);
      });

      const notesX = MARGIN_LR + attW + gapW;
      pdf.rect(notesX, y, notesW, attNotesH);
      pdf.setFont('times', 'bold');
      pdf.text('Catatan Wali Kelas', notesX + 0.15, y + 0.4);
      pdf.setFont('times', 'normal');
      pdf.text(noteLines, notesX + 0.15, y + 0.8);
      y += attNotesH + 0.22;

      // Decision section in Semester Genap
      const isGenap = String(settings?.semester || '').toLowerCase().includes('genap');
      if (isGenap) {
        const gLevel = getGradeNumberLocal(settings?.nama_kelas);
        const nextGrade = gLevel ? gLevel + 1 : '';
        const nextRoman = ({ 1: 'II', 2: 'III', 3: 'IV', 4: 'V', 5: 'VI' } as Record<number, string>)[Number(nextGrade) - 1] || '';
        const decisionText = gLevel === 6 ? 'LULUS' : `Naik ke Kelas ${nextGrade} (${nextRoman})`;
        const decH = 1.2;
        ensureSectionSpace(decH);
        pdf.rect(MARGIN_LR, y, contentW, decH);
        pdf.line(MARGIN_LR, y + 0.58, MARGIN_LR + contentW, y + 0.58);
        pdf.setFont('times', 'bold');
        pdf.text(
          `Berdasarkan hasil belajar yang dicapai, ${safeStr(student?.namaPanggilan || (student?.namaLengkap || '').split(' ')[0], 'Murid')} dinyatakan:`,
          formatWidth / 2,
          y + 0.4,
          { align: 'center' }
        );
        pdf.text(decisionText, formatWidth / 2, y + 0.98, { align: 'center' });
        y += decH + 0.22;
      }

      // Parent feedback box
      ensureSectionSpace(1.25);
      pdf.rect(MARGIN_LR, y, contentW, 1.15);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Tanggapan Orang Tua/Wali Murid', MARGIN_LR + 0.15, y + 0.42);
      y += 1.45;

      // Signatures Block
      ensureSectionSpace(5.4);
      const leftSigX = MARGIN_LR + 2.2;
      const rightSigX = formatWidth - MARGIN_LR - 2.6;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.text('Mengetahui:', leftSigX, y, { align: 'center' });
      pdf.text('Orang Tua/Wali,', leftSigX, y + 0.42, { align: 'center' });
      pdf.text('.........................', leftSigX, y + 2.35, { align: 'center' });

      pdf.text(getTanggalRaporLocal(settings), rightSigX, y, { align: 'center' });
      pdf.text('Wali Kelas,', rightSigX, y + 0.42, { align: 'center' });
      if (payload.printOptions?.showTeacherSignature && images.ttdWaliKelas) {
        addImageSafe(pdf, images.ttdWaliKelas, rightSigX - 1.3, y + 0.55, 2.6, 1.5);
      }
      pdf.setFont('times', 'bold');
      pdf.text(getContextualVal(settings, 'nama_wali_kelas') || '_________________', rightSigX, y + 2.35, { align: 'center' });
      pdf.setFont('times', 'normal');
      const waliNipLabel = getContextualVal(settings, 'nip_label_wali_kelas') || 'NIP';
      pdf.text(`${waliNipLabel}. ${getContextualVal(settings, 'nip_wali_kelas') || '-'}`, rightSigX, y + 2.75, { align: 'center' });

      // Headmaster centered signature
      const headY = y + 3.2;
      pdf.text('Mengetahui,', formatWidth / 2, headY, { align: 'center' });
      pdf.text('Kepala Sekolah,', formatWidth / 2, headY + 0.42, { align: 'center' });
      if (payload.printOptions?.showPrincipalSignature && images.ttdKepalaSekolah) {
        addImageSafe(pdf, images.ttdKepalaSekolah, formatWidth / 2 - 1.4, headY + 0.55, 2.8, 1.6);
      }
      pdf.setFont('times', 'bold');
      pdf.text(getContextualVal(settings, 'nama_kepala_sekolah') || '_________________', formatWidth / 2, headY + 2.35, { align: 'center' });
      pdf.setFont('times', 'normal');
      const kepNipLabel = getContextualVal(settings, 'nip_label_kepala_sekolah') || 'NIP';
      pdf.text(`${kepNipLabel}. ${getContextualVal(settings, 'nip_kepala_sekolah') || '-'}`, formatWidth / 2, headY + 2.75, { align: 'center' });

      drawPageFooter(academicPageNumber);
    }
  });

  onProgress?.(totalEntries, totalEntries, 'Menyimpan file PDF vektor...');
  return pdf.output('arraybuffer');
}

function buildVectorPiagam(payload: VectorPiagamPayload, onProgress?: ProgressCallback): ArrayBuffer {
  const { formatWidth, formatHeight, orientation, settings, entries, images, layout, printOptions } = payload;
  const pdf = new jsPDF({
    orientation,
    unit: 'cm',
    format: [formatWidth, formatHeight],
  });

  const vbW = 1115;
  const vbH = 749;
  const pad = 0.5;
  const areaW = formatWidth - pad * 2;
  const areaH = formatHeight - pad * 2;
  const scale = Math.min(areaW / vbW, areaH / vbH);
  const offsetX = (formatWidth - vbW * scale) / 2;
  const offsetY = (formatHeight - vbH * scale) / 2;
  const total = Math.max(1, entries.length);

  entries.forEach((entry, idx) => {
    const { student, rank, average } = entry;
    onProgress?.(
      idx,
      total,
      `Membuat PDF vektor piagam ${idx + 1} dari ${total}: ${safeStr(student?.namaLengkap, 'Siswa')}...`
    );

    if (idx > 0) {
      pdf.addPage([formatWidth, formatHeight], orientation);
    }

    if (images.piagamBackground) {
      addImageSafe(pdf, images.piagamBackground, 0, 0, formatWidth, formatHeight);
    } else {
      // Classic decorative double border in navy & gold
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.14);
      pdf.rect(0.7, 0.7, formatWidth - 1.4, formatHeight - 1.4);
      pdf.setDrawColor(217, 119, 6);
      pdf.setLineWidth(0.05);
      pdf.rect(0.92, 0.92, formatWidth - 1.84, formatHeight - 1.84);
    }

    const rankString = rank ? `PERINGKAT ${toRoman(rank)}` : '';
    const classRoman = toRoman(parseInt(settings?.nama_kelas, 10)) || settings?.nama_kelas || '';
    const tanggalRapor = getTanggalRaporLocal(settings);

    const replacePlaceholders = (text: string) => {
      if (!text) return '';
      let res = text
        .replace(/\[NAMA SISWA\]/gi, safeStr(student?.namaLengkap, ''))
        .replace(/\[RANK\]/gi, rank ? toRoman(rank) : '')
        .replace(/\[RANK TEXT\]/gi, rankString)
        .replace(/PERINGKAT \[RANK\]/gi, rankString)
        .replace(/\[nama kelas\]/gi, classRoman)
        .replace(/\[semester\]/gi, settings?.semester || '')
        .replace(/\[tahun pelajaran\]/gi, settings?.tahun_ajaran || '')
        .replace(/\[nilai rata-rata\]/gi, average || '')
        .replace(/\[nama kepala sekolah\]/gi, getContextualVal(settings, 'nama_kepala_sekolah') || '')
        .replace(/\[nip kepala sekolah\]/gi, getContextualVal(settings, 'nip_kepala_sekolah') || '')
        .replace(/\[nama wali kelas\]/gi, getContextualVal(settings, 'nama_wali_kelas') || '')
        .replace(/\[nip wali kelas\]/gi, getContextualVal(settings, 'nip_wali_kelas') || '')
        .replace(/Tempat, Tanggal Rapor/gi, tanggalRapor);

      const nipKepLabel = getContextualVal(settings, 'nip_label_kepala_sekolah') || 'NIP';
      const nipWaliLabel = getContextualVal(settings, 'nip_label_wali_kelas') || 'NIP';
      if (text.toLowerCase().includes('[nip kepala sekolah]')) {
        res = res.replace(/NIP\./gi, `${nipKepLabel}.`);
      } else if (text.toLowerCase().includes('[nip wali kelas]')) {
        res = res.replace(/NIP\./gi, `${nipWaliLabel}.`);
      }
      return res;
    };

    for (const el of layout) {
      if (settings?.show_aksara_bali === false && (el.id?.includes('aksara_') || el.fontFamily === 'Noto Sans Balinese')) {
        continue;
      }
      if (el.fontFamily === 'Noto Sans Balinese') {
        continue;
      }

      if (el.type === 'rect' || el.type === 'line') {
        let rx = el.x;
        let rw = el.width || 0;
        let ry = el.y;
        const rh = el.height || 0;
        if (el.id === 'rank_box' && rankString) {
          rw = Math.max(240, rankString.length * 16 + 70);
          rx = (vbW - rw) / 2;
          ry = el.y + 1;
        }
        const xCm = offsetX + rx * scale;
        const yCm = offsetY + ry * scale;
        const wCm = rw * scale;
        const hCm = Math.max(0.03, rh * scale);
        if (el.id === 'rank_box') {
          pdf.setFillColor(239, 246, 255);
          pdf.setDrawColor(30, 58, 138);
          pdf.setLineWidth(0.07);
          pdf.roundedRect(xCm, yCm, wCm, hCm, 0.18, 0.18, 'FD');
        } else {
          pdf.setFillColor(0, 0, 0);
          pdf.rect(xCm, yCm, wCm, hCm, 'F');
        }
      } else if (el.type === 'image') {
        const img =
          el.content === 'logo_dinas'
            ? images.logoDinas
            : el.content === 'logo_sekolah'
              ? images.logoSekolah
              : null;
        if (img) {
          addImageSafe(
            pdf,
            img,
            offsetX + el.x * scale,
            offsetY + el.y * scale,
            (el.width || 80) * scale,
            (el.height || 80) * scale
          );
        }
      } else if (el.type === 'text') {
        const txt = replacePlaceholders(el.content || '');
        const fontPt = Math.max(7, (el.fontSize || 16) * 0.72);
        const isBold = el.fontWeight === 'bold';
        const isCalligraphic =
          el.id === 'student_name' ||
          /pinyon|great vibes|alex brush|dancing script/i.test(el.fontFamily || '');
        pdf.setFont('times', isBold ? 'bold' : isCalligraphic ? 'italic' : 'normal');
        pdf.setFontSize(fontPt);

        let align: 'left' | 'center' | 'right' = 'left';
        let xPx = el.x;
        if (el.textAlign === 'center') {
          align = 'center';
          xPx = el.x + (el.width || 0) / 2;
        } else if (el.textAlign === 'right') {
          align = 'right';
          xPx = el.x + (el.width || 0);
        }
        const xCm = offsetX + xPx * scale;
        const yCm = offsetY + el.y * scale;

        if (el.id === 'piagam_title') {
          pdf.setTextColor(245, 158, 11);
          pdf.text(txt, xCm + 0.06, yCm + 0.06, { align });
          pdf.setTextColor(128, 0, 0);
          pdf.text(txt, xCm, yCm, { align });
        } else if (el.id === 'rank_text') {
          pdf.setTextColor(30, 58, 138);
          pdf.text(txt, xCm, yCm + 0.14, { align });
        } else {
          pdf.setTextColor(0, 0, 0);
          pdf.text(txt, xCm, yCm, { align });
        }

        if (el.id === 'headmaster_name' && printOptions?.showPrincipalSignature && images.ttdKepalaSekolah) {
          addImageSafe(pdf, images.ttdKepalaSekolah, xCm - 1.3, yCm - 1.85, 2.6, 1.7);
        } else if (el.id === 'teacher_name' && printOptions?.showTeacherSignature && images.ttdWaliKelas) {
          addImageSafe(pdf, images.ttdWaliKelas, xCm - 1.3, yCm - 1.8, 2.6, 1.55);
        }
      }
    }
  });

  onProgress?.(total, total, 'Menyimpan file PDF vektor...');
  return pdf.output('arraybuffer');
}

function buildVectorLeger(payload: VectorLegerPayload, onProgress?: ProgressCallback): ArrayBuffer {
  const { formatWidth, formatHeight, orientation, settings, displaySubjects, processedData, statistics, kkm, printOptions, kopElements, images } = payload;
  const pdf = new jsPDF({
    orientation,
    unit: 'cm',
    format: [formatWidth, formatHeight],
  });

  onProgress?.(0, 1, 'Menyusun leger nilai vektor...');

  const contentW = formatWidth - MARGIN_LR * 2;
  drawKopHeader(pdf, kopElements, formatWidth, images);

  let y = HEADER_BOTTOM_Y + 0.25;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('LEGER NILAI AKHIR SISWA', formatWidth / 2, y, { align: 'center' });
  y += 0.55;

  pdf.setFont('times', 'normal');
  pdf.setFontSize(9.5);
  const metaText = `Kelas: ${safeStr(settings?.nama_kelas, '-')}   |   Semester: ${safeStr(settings?.semester, '-')}   |   Tahun Pelajaran: ${safeStr(settings?.tahun_ajaran, '-')}`;
  pdf.text(metaText, formatWidth / 2, y, { align: 'center' });
  y += 0.45;

  const noW = 0.7;
  const namaW = 4.5;
  const nisnW = 1.8;
  const nisW = 1.0;
  const jmlW = 1.0;
  const avgW = 1.15;
  const rankW = 0.95;
  const subjCount = Math.max(1, displaySubjects.length);
  const subjAreaW = Math.max(4, contentW - noW - namaW - nisnW - nisW - jmlW - avgW - rankW);
  const colSubjW = subjAreaW / subjCount;

  const drawLegerHeader = (topY: number): number => {
    const h = 1.05;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.03);
    pdf.rect(MARGIN_LR, topY, contentW, h);

    let cx = MARGIN_LR;
    const cols: Array<{ label: string; w: number }> = [
      { label: 'NO', w: noW },
      { label: 'NAMA MURID', w: namaW },
      { label: 'NISN', w: nisnW },
      { label: 'NIS', w: nisW },
    ];
    cols.forEach((col) => {
      pdf.line(cx + col.w, topY, cx + col.w, topY + h);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(7.5);
      pdf.text(col.label, cx + col.w / 2, topY + 0.62, { align: 'center' });
      cx += col.w;
    });

    // Subjects group header
    pdf.line(cx, topY + 0.42, cx + subjAreaW, topY + 0.42);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(7);
    pdf.text('NILAI MATA PELAJARAN', cx + subjAreaW / 2, topY + 0.29, { align: 'center' });

    displaySubjects.forEach((s, idx) => {
      const sx = cx + idx * colSubjW;
      pdf.line(sx + colSubjW, topY + (idx === displaySubjects.length - 1 ? 0 : 0.42), sx + colSubjW, topY + h);
      pdf.setFontSize(6);
      pdf.text(String(s.label || s.id).slice(0, 8), sx + colSubjW / 2, topY + 0.82, {
        align: 'center',
        maxWidth: colSubjW - 0.08,
      });
    });
    cx += subjAreaW;

    const tailCols: Array<{ label: string; w: number }> = [
      { label: 'JML', w: jmlW },
      { label: 'RATA', w: avgW },
      { label: 'RANK', w: rankW },
    ];
    tailCols.forEach((col, i) => {
      if (i < tailCols.length - 1) {
        pdf.line(cx + col.w, topY, cx + col.w, topY + h);
      }
      pdf.setFont('times', 'bold');
      pdf.setFontSize(7);
      pdf.text(col.label, cx + col.w / 2, topY + 0.62, { align: 'center' });
      cx += col.w;
    });

    return topY + h;
  };

  y = drawLegerHeader(y);
  const rowH = processedData.length > 34 ? 0.43 : 0.5;
  const maxLegerY = formatHeight - MARGIN_BOTTOM - 0.4;

  processedData.forEach((student) => {
    if (y + rowH > maxLegerY) {
      pdf.addPage([formatWidth, formatHeight], orientation);
      y = drawLegerHeader(MARGIN_TOP);
    }

    if (student.rank === 1) pdf.setFillColor(254, 240, 138);
    else if (student.rank === 2) pdf.setFillColor(254, 215, 170);
    else if (student.rank === 3) pdf.setFillColor(253, 186, 116);
    else if (student.rank >= 4 && student.rank <= 10) pdf.setFillColor(224, 231, 255);
    else pdf.setFillColor(255, 255, 255);

    pdf.rect(MARGIN_LR, y, contentW, rowH, 'FD');

    let cx = MARGIN_LR;
    const textY = y + rowH * 0.68;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);

    pdf.text(String(student.no), cx + noW / 2, textY, { align: 'center' });
    cx += noW;
    pdf.line(cx, y, cx, y + rowH);

    pdf.text(safeStr(student.namaLengkap, ''), cx + 0.1, textY, { maxWidth: namaW - 0.2 });
    cx += namaW;
    pdf.line(cx, y, cx, y + rowH);

    pdf.text(safeStr(student.nisn, ''), cx + nisnW / 2, textY, { align: 'center', maxWidth: nisnW - 0.1 });
    cx += nisnW;
    pdf.line(cx, y, cx, y + rowH);

    pdf.text(safeStr(student.nis, ''), cx + nisW / 2, textY, { align: 'center', maxWidth: nisW - 0.1 });
    cx += nisW;
    pdf.line(cx, y, cx, y + rowH);

    displaySubjects.forEach((s) => {
      const grade = student.grades?.[s.id];
      const missing = grade === undefined || grade === null || grade === '';
      const num = typeof grade === 'number' ? grade : parseFloat(grade);
      const belowKkm = !missing && !Number.isNaN(num) && Number.isFinite(kkm) && num < kkm;
      if (missing || belowKkm) {
        pdf.setTextColor(220, 38, 38);
        pdf.setFont('times', 'bold');
      } else {
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('times', 'normal');
      }
      pdf.text(missing ? '-' : String(grade), cx + colSubjW / 2, textY, { align: 'center' });
      cx += colSubjW;
      pdf.line(cx, y, cx, y + rowH);
    });

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('times', 'bold');
    pdf.text(String(student.total), cx + jmlW / 2, textY, { align: 'center' });
    cx += jmlW;
    pdf.line(cx, y, cx, y + rowH);

    pdf.text(String(student.average), cx + avgW / 2, textY, { align: 'center' });
    cx += avgW;
    pdf.line(cx, y, cx, y + rowH);

    pdf.text(String(student.rank), cx + rankW / 2, textY, { align: 'center' });

    y += rowH;
  });

  if (statistics) {
    const statRows: Array<{ label: string; values: Array<string | number>; totalVal: string | number }> = [
      {
        label: 'Nilai Tertinggi',
        values: displaySubjects.map((s) => statistics.subjects[s.id]?.max ?? '-'),
        totalVal: statistics.total.max,
      },
      {
        label: 'Nilai Terendah',
        values: displaySubjects.map((s) => statistics.subjects[s.id]?.min ?? '-'),
        totalVal: statistics.total.min,
      },
      {
        label: 'Total Nilai',
        values: displaySubjects.map((s) => statistics.subjects[s.id]?.sum ?? '-'),
        totalVal: statistics.total.sum,
      },
      {
        label: 'Rata-rata Nilai',
        values: displaySubjects.map((s) => statistics.subjects[s.id]?.avg ?? '-'),
        totalVal: '',
      },
    ];

    const labelColW = noW + namaW + nisnW + nisW;
    for (const st of statRows) {
      if (y + rowH > maxLegerY) {
        pdf.addPage([formatWidth, formatHeight], orientation);
        y = drawLegerHeader(MARGIN_TOP);
      }
      pdf.setFillColor(248, 250, 252);
      pdf.rect(MARGIN_LR, y, contentW, rowH, 'FD');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(0, 0, 0);
      const textY = y + rowH * 0.68;

      pdf.text(st.label, MARGIN_LR + labelColW - 0.15, textY, { align: 'right' });
      let cx = MARGIN_LR + labelColW;
      pdf.line(cx, y, cx, y + rowH);

      st.values.forEach((v) => {
        pdf.text(String(v), cx + colSubjW / 2, textY, { align: 'center' });
        cx += colSubjW;
        pdf.line(cx, y, cx, y + rowH);
      });

      if (st.totalVal !== '') {
        pdf.text(String(st.totalVal), cx + jmlW / 2, textY, { align: 'center' });
      }
      cx += jmlW;
      pdf.line(cx, y, cx, y + rowH);
      cx += avgW;
      pdf.line(cx, y, cx, y + rowH);

      y += rowH;
    }
  }

  y += 0.5;
  if (y + 3.2 > maxLegerY) {
    pdf.addPage([formatWidth, formatHeight], orientation);
    y = MARGIN_TOP + 0.5;
  }

  const leftSigX = MARGIN_LR + 2.8;
  const rightSigX = formatWidth - MARGIN_LR - 2.8;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9.5);

  pdf.text('Mengetahui,', leftSigX, y, { align: 'center' });
  pdf.text('Kepala Sekolah,', leftSigX, y + 0.4, { align: 'center' });
  if (printOptions?.showPrincipalSignature && images.ttdKepalaSekolah) {
    addImageSafe(pdf, images.ttdKepalaSekolah, leftSigX - 1.3, y + 0.5, 2.6, 1.5);
  }
  pdf.setFont('times', 'bold');
  pdf.text(getContextualVal(settings, 'nama_kepala_sekolah') || '_________________', leftSigX, y + 2.25, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(
    `${getContextualVal(settings, 'nip_label_kepala_sekolah') || 'NIP'}. ${getContextualVal(settings, 'nip_kepala_sekolah') || '-'}`,
    leftSigX,
    y + 2.65,
    { align: 'center' }
  );

  pdf.text(getTanggalRaporLocal(settings), rightSigX, y, { align: 'center' });
  pdf.text('Wali Kelas,', rightSigX, y + 0.4, { align: 'center' });
  if (printOptions?.showTeacherSignature && images.ttdWaliKelas) {
    addImageSafe(pdf, images.ttdWaliKelas, rightSigX - 1.3, y + 0.5, 2.6, 1.5);
  }
  pdf.setFont('times', 'bold');
  pdf.text(getContextualVal(settings, 'nama_wali_kelas') || '_________________', rightSigX, y + 2.25, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(
    `${getContextualVal(settings, 'nip_label_wali_kelas') || 'NIP'}. ${getContextualVal(settings, 'nip_wali_kelas') || '-'}`,
    rightSigX,
    y + 2.65,
    { align: 'center' }
  );

  onProgress?.(1, 1, 'Menyimpan file PDF vektor...');
  return pdf.output('arraybuffer');
}

export function buildVectorPdfArrayBuffer(
  payload: VectorPdfPayload,
  onProgress?: ProgressCallback
): ArrayBuffer {
  if (payload.kind === 'rapor') {
    return buildVectorRapor(payload, onProgress);
  }
  if (payload.kind === 'piagam') {
    return buildVectorPiagam(payload, onProgress);
  }
  return buildVectorLeger(payload, onProgress);
}
