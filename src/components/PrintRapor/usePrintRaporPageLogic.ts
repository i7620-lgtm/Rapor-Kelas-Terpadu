import { useMemo, useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getGradeNumber } from '../../utils/nilaiHelpers';
import { getFontEmbedCSS, PAPER_SIZES } from './raporUtils';
import { usePrintStore } from '../../stores/usePrintStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudentsStore } from '../../stores/useStudentsStore';

interface UsePrintRaporPageLogicProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const usePrintRaporPageLogic = ({ showToast }: UsePrintRaporPageLogicProps) => {
  const settings = useSettingsStore((state) => state.settings);
  const grades = useNilaiStore((state) => state.grades);
  const subjects = useSettingsStore((state) => state.subjects);
  const students = useStudentsStore((state) => state.students);

  const {
    paperSize,
    selectedStudentId,
    rankingOption,
    selectedPages,
    hideGradesForFaseA,
    printOptions,
    isPrinting,
    setIsPrinting,
  } = usePrintStore();

  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; statusText: string } | null>(null);

  const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);
  const isFaseA = useMemo(() => gradeNumber === 1 || gradeNumber === 2, [gradeNumber]);

  const studentRanks = useMemo(() => {
    if (rankingOption === 'none' || !students.length || !grades.length || !subjects.length) {
      return new Map();
    }

    const allActiveSubjects = subjects.filter((s) => s.active);

    const studentsWithTotals = students.map((student) => {
      const gradeData = grades.find((g) => g.studentId === student.id);
      if (!gradeData || !gradeData.finalGrades) {
        return { studentId: student.id, totalScore: 0 };
      }

      const studentReligionLower = String(student.agama || '').trim().toLowerCase();

      const totalScore = Object.entries(gradeData.finalGrades).reduce((sum, [subjectId, score]) => {
        const subjectInfo = allActiveSubjects.find((s) => s.id === subjectId);
        if (subjectInfo && typeof score === 'number') {
          const subjectFullNameLower = subjectInfo.fullName.toLowerCase();

          if (subjectFullNameLower.startsWith('pendidikan agama')) {
            if (!studentReligionLower) return sum;

            const religionMatch = subjectFullNameLower.match(/\(([^)]+)\)/);
            if (religionMatch) {
              if (religionMatch[1].trim().toLowerCase() === studentReligionLower) {
                return sum + score;
              }
            } else if (subjectInfo.id === 'PAKTTMYME' && studentReligionLower === 'kepercayaan') {
              return sum + score;
            }
            return sum;
          }
          return sum + score;
        }
        return sum;
      }, 0);

      return { studentId: student.id, totalScore };
    });

    const sortedStudents = studentsWithTotals.sort((a, b) => b.totalScore - a.totalScore);

    const ranksMap = new Map();
    if (sortedStudents.length > 0) {
      let currentRank = 1;
      ranksMap.set(sortedStudents[0].studentId, {
        ...sortedStudents[0],
        rank: sortedStudents[0].totalScore > 0 ? currentRank : null,
      });
      for (let i = 1; i < sortedStudents.length; i++) {
        if (sortedStudents[i].totalScore < sortedStudents[i - 1].totalScore) {
          currentRank = i + 1;
        }
        if (sortedStudents[i].totalScore > 0) {
          ranksMap.set(sortedStudents[i].studentId, { ...sortedStudents[i], rank: currentRank });
        }
      }
    }

    return ranksMap;
  }, [rankingOption, students, grades, subjects]);

  const isMobileDevice = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
  }, []);

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    showToast('Mempersiapkan PDF (Ini mungkin memakan waktu)...', 'info');

    try {
      if (printAreaRef.current) {
        const pages = Array.from(
          printAreaRef.current.querySelectorAll('.rapor-page, .report-page')
        ) as HTMLElement[];

        if (pages.length === 0) {
          showToast('Gagal menemukan halaman.', 'error');
          return;
        }

        setExportProgress({ current: 0, total: pages.length, statusText: 'Mempersiapkan konversi halaman...' });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pxPerCm = 37.7952755906;
        const widthPx = parseFloat(PAPER_SIZES[paperSize].width) * pxPerCm;
        const heightPx = parseFloat(PAPER_SIZES[paperSize].height) * pxPerCm;
        const formatWidth = parseFloat(PAPER_SIZES[paperSize].width);
        const formatHeight = parseFloat(PAPER_SIZES[paperSize].height);

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'cm',
          format: [formatWidth, formatHeight],
        });

        const fontEmbedCSSStr = await getFontEmbedCSS();

        for (let i = 0; i < pages.length; i++) {
          setExportProgress({
            current: i,
            total: pages.length,
            statusText: `Mengonversi halaman ${i + 1} dari ${pages.length} ke format gambar...`
          });

          const node = pages[i];

          const originalTransform = node.style.transform;
          const originalWidth = node.style.width;
          const originalHeight = node.style.height;
          const originalPosition = node.style.position;
          const originalLeft = node.style.left;
          const originalTop = node.style.top;
          const originalZIndex = node.style.zIndex;

          node.style.transform = 'none';
          node.style.width = widthPx + 'px';
          node.style.height = heightPx + 'px';
          node.style.position = 'absolute';
          node.style.left = '0px';
          node.style.top = '0px';
          node.style.zIndex = '-9999';

          await new Promise((resolve) => setTimeout(resolve, 150));

          const scaleFactor = 2;
          const imgData = await htmlToImage.toJpeg(node, {
            quality: 0.98,
            backgroundColor: '#ffffff',
            pixelRatio: scaleFactor,
            fontEmbedCSS: fontEmbedCSSStr,
            style: {
              margin: '0',
            },
          });

          node.style.transform = originalTransform;
          node.style.width = originalWidth;
          node.style.height = originalHeight;
          node.style.position = originalPosition;
          node.style.left = originalLeft;
          node.style.top = originalTop;
          node.style.zIndex = originalZIndex;

          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, formatWidth, formatHeight);
        }

        setExportProgress({
          current: pages.length,
          total: pages.length,
          statusText: 'Menyimpan file PDF...'
        });

        let fileName = 'Rapor.pdf';
        if (selectedStudentId !== 'all') {
          const student = students.find((s) => String(s.id) === selectedStudentId);
          if (student) fileName = `Rapor_${student.namaLengkap.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        }

        pdf.save(fileName);
        showToast('PDF berhasil diunduh.', 'success');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast('Gagal menghasilkan PDF. Silahkan coba lagi.', 'error');
    } finally {
      setIsPrinting(false);
      setExportProgress(null);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    showToast('Mempersiapkan pratinjau cetak...', 'success');

    const paperSizeCss =
      ({
        A4: 'size: A4 portrait;',
        F4: 'size: 21.5cm 33cm;',
        Letter: 'size: letter portrait;',
        Legal: 'size: legal portrait;',
      } as any)[paperSize] || 'size: portrait;';

    const style = document.createElement('style');
    style.id = 'print-page-style';
    style.innerHTML = `@page { ${paperSizeCss} margin: 0 !important; }`;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      document.getElementById('print-page-style')?.remove();
      setIsPrinting(false);
    }, 500);
  };

  const studentsToRender = useMemo(() => {
    if (selectedStudentId === 'all') {
      return students;
    }
    return students.filter((s) => String(s.id) === selectedStudentId);
  }, [students, selectedStudentId]);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      if (printAreaRef.current && !isPrinting) {
        const containerWidth = printAreaRef.current.clientWidth;
        const paperWidthCm = parseFloat(PAPER_SIZES[paperSize].width);
        const paperWidthPx = paperWidthCm * 37.7952755906;
        const margin = 32;
        const availableWidth = containerWidth - margin;
        if (availableWidth < paperWidthPx) {
          setScale(availableWidth / paperWidthPx);
        } else {
          setScale(1);
        }
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [paperSize, isPrinting]);

  const pageStyle = useMemo(() => ({
    width: PAPER_SIZES[paperSize].width,
    height: PAPER_SIZES[paperSize].height,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    marginBottom: `calc(${PAPER_SIZES[paperSize].height} * ${scale - 1})`,
  }), [paperSize, scale]);

  return {
    settings,
    grades,
    students,
    paperSize,
    selectedStudentId,
    rankingOption,
    selectedPages,
    hideGradesForFaseA,
    printOptions,
    isPrinting,
    printAreaRef,
    exportProgress,
    isFaseA,
    studentRanks,
    isMobileDevice,
    handleDownloadPDF,
    handlePrint,
    studentsToRender,
    pageStyle,
  };
};
