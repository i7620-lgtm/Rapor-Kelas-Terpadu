import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { getFontEmbedCSS } from '../../utils/pdfFonts';

const PAPER_SIZES: Record<string, { width: string; height: string }> = {
  A4: { width: '21cm', height: '29.7cm' },
  F4: { width: '21.5cm', height: '33cm' },
  Letter: { width: '21.59cm', height: '27.94cm' },
  Legal: { width: '21.59cm', height: '35.56cm' },
};

const HEADER_HEIGHT_CM = 6.0;
const PAGE_BOTTOM_MARGIN_CM = 1.5;

export const usePrintLegerPageLogic = (props: any) => {
  const { storeSettings, storeSubjects } = useSettingsStore(
    useShallow((state) => ({
      storeSettings: state.settings,
      storeSubjects: state.subjects,
    }))
  );
  const storeStudents = useStudentsStore(useShallow((state) => state.students));
  const storeGrades = useNilaiStore(useShallow((state) => state.grades));

  const settings = props.settings || storeSettings;
  const subjects = props.subjects || storeSubjects;
  const students = props.students || storeStudents;
  const grades = props.grades || storeGrades;
  const showToast = props.showToast;

  const [paperSize, setPaperSize] = useState('A4');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingState, setIsPrintingState] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; statusText: string } | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [nameFontSize, setNameFontSize] = useState<number | null>(null);
  const [printOptions, setPrintOptions] = useState({
    showPrincipalSignature: true,
    showTeacherSignature: true
  });
  const [cmToPx, setCmToPx] = useState(0);
  const [scale, setScale] = useState(1);

  const nameCellRefs = useRef<any[]>([]);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cmRef = useRef<HTMLDivElement | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const beforePrint = () => setIsPrintingState(true);
    const afterPrint = () => setIsPrintingState(false);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  useEffect(() => {
    if (cmRef.current) {
      setCmToPx(cmRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (printAreaRef.current && !isPrinting && !isPrintingState) {
        const containerWidth = printAreaRef.current.clientWidth;
        const paperWidthCm = parseFloat(PAPER_SIZES[paperSize].width);
        const paperWidthPx = paperWidthCm * 37.7952755906;
        const margin = 32; // 2rem margin
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
  }, [paperSize, isPrinting, isPrintingState]);

  const activeSubjects = useMemo(() => (subjects || []).filter((s: any) => s.active), [subjects]);

  const displaySubjects = useMemo(() => {
    const finalDisplaySubjects = [];
    const addedGroupPrefixes = new Set();
    const groups = [
      { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti', active: true } },
      { prefix: 'Seni Budaya', base: { id: 'SB', label: 'S. Rupa', fullName: 'Seni Budaya', active: true } },
      { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'B. Bali', fullName: 'Muatan Lokal', active: true } }
    ];
    for (const subject of activeSubjects) {
      let group = groups.find(g => subject.fullName.startsWith(g.prefix));
      
      if (!group && (subject.id === 'PAKTTMYME' || subject.fullName.toLowerCase().includes('kepercayaan terhadap tuhan'))) {
        group = groups.find(g => g.base.id === 'PABP');
      }

      if (group) {
        if (!addedGroupPrefixes.has(group.prefix)) {
          finalDisplaySubjects.push(group.base);
          addedGroupPrefixes.add(group.prefix);
        }
      } else {
        finalDisplaySubjects.push(subject);
      }
    }
    const sortOrder: Record<string, number> = { 'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5, 'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9 };
    finalDisplaySubjects.sort((a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));

    const labelMap: Record<string, string> = { 'BIndo': 'B. INDO', 'BIng': 'B. ING', 'Mulok': 'B. BALI' };
    
    return finalDisplaySubjects.map(s => ({
      ...s,
      label: labelMap[s.id] || s.label.toUpperCase().replace(/\./g, '')
    }));
  }, [activeSubjects]);

  const processedData = useMemo(() => {
    if (!students || !grades) return [];
    const dataWithScores = students.map((student: any, index: number) => {
      const finalGrades = grades.find((g: any) => g.studentId === student.id)?.finalGrades || {};
      let total = 0, count = 0;
      const studentGrades: Record<string, any> = {};

      displaySubjects.forEach(ds => {
        let grade;
        if (ds.id === 'PABP') {
          const religion = String(student.agama || '').trim().toLowerCase();
          if (religion) {
            if (religion === 'kepercayaan') {
              const beliefSubject = activeSubjects.find((s: any) => s.id === 'PAKTTMYME');
              if (beliefSubject) grade = finalGrades[beliefSubject.id];
            } else {
              const relSubject = activeSubjects.find((s: any) => s.fullName.startsWith(ds.fullName) && s.fullName.toLowerCase().includes(`(${religion})`));
              if (relSubject) grade = finalGrades[relSubject.id];
            }
          }
        } else if (['SB', 'Mulok'].includes(ds.id)) {
          const memberSubjects = activeSubjects.filter((s: any) => s.fullName.startsWith(ds.fullName));
          grade = memberSubjects.map(ms => finalGrades[ms.id]).find(g => g != null);
        } else {
          grade = finalGrades[ds.id];
        }

        if (typeof grade === 'number') { total += grade; count++; }
        studentGrades[ds.id] = grade;
      });
      return { id: student.id, no: index + 1, namaLengkap: student.namaLengkap, nisn: student.nisn, nis: student.nis, grades: studentGrades, total, average: count > 0 ? (total / count).toFixed(2) : "0.00" };
    });

    const sortedData = [...dataWithScores].sort((a, b) => b.total - a.total);
    const rankMap = new Map();
    if (sortedData.length > 0) {
      let currentRank = 1;
      rankMap.set(sortedData[0].id, currentRank);
      for (let i = 1; i < sortedData.length; i++) {
        if (sortedData[i].total < sortedData[i - 1].total) {
          currentRank = i + 1;
        }
        rankMap.set(sortedData[i].id, currentRank);
      }
    }

    return dataWithScores.map(d => ({
      ...d,
      rank: rankMap.get(d.id)
    }));
  }, [students, grades, activeSubjects, displaySubjects]);

  const statistics = useMemo(() => {
    if (!processedData.length) return null;

    const subjectStats: Record<string, any> = {};
    displaySubjects.forEach(s => {
      const values = processedData.map(d => d.grades[s.id]).filter(v => typeof v === 'number');
      subjectStats[s.id] = {
        max: values.length ? Math.max(...values) : 0,
        min: values.length ? Math.min(...values) : 0,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0.00"
      };
    });

    const totalValues = processedData.map(d => d.total);
    const avgValues = processedData.map(d => parseFloat(d.average));

    return {
      subjects: subjectStats,
      total: {
        max: totalValues.length ? Math.max(...totalValues) : 0,
        min: totalValues.length ? Math.min(...totalValues) : 0,
        sum: totalValues.reduce((a, b) => a + b, 0),
        avg: totalValues.length ? (totalValues.reduce((a, b) => a + b, 0) / totalValues.length).toFixed(2) : "0.00"
      },
      average: {
        max: avgValues.length ? Math.max(...avgValues).toFixed(2) : 0,
        min: avgValues.length ? Math.min(...avgValues).toFixed(2) : 0,
        sum: avgValues.reduce((a, b) => a + b, 0).toFixed(2),
        avg: avgValues.length ? (avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(2) : "0.00"
      }
    };
  }, [processedData, displaySubjects]);

  useEffect(() => {
    setNameFontSize(null);
  }, [processedData, isCompact, paperSize]);

  useLayoutEffect(() => {
    if (!processedData.length || !cmToPx) {
      setIsMeasuring(false);
      setIsCompact(false);
      return;
    }

    setIsMeasuring(true);
    setIsCompact(false);

    const timer = setTimeout(() => {
      if (contentRef.current && cmToPx > 0) {
        const pageHeightInCm = parseFloat(PAPER_SIZES[paperSize].height);
        const availableHeightInCm = pageHeightInCm - HEADER_HEIGHT_CM - PAGE_BOTTOM_MARGIN_CM;
        const availableHeightInPx = availableHeightInCm * cmToPx;
        
        const contentHeight = contentRef.current.scrollHeight;
        
        if (contentHeight > availableHeightInPx) {
          setIsCompact(true);
        } else {
          setIsCompact(false);
        }
      }
      setIsMeasuring(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [processedData, paperSize, cmToPx]);

  useLayoutEffect(() => {
    if (isMeasuring || !processedData.length || !cmToPx) return;

    nameCellRefs.current = nameCellRefs.current.slice(0, processedData.length);

    const initialSize = isCompact ? 7.5 : 8;
    const currentSize = nameFontSize ?? initialSize;

    if (nameFontSize === null) {
      setNameFontSize(initialSize);
      return;
    }

    let needsResize = false;
    for (const cell of nameCellRefs.current) {
      if (cell && cell.scrollWidth > cell.clientWidth + 1) {
        needsResize = true;
        break;
      }
    }
    
    if (needsResize && currentSize > 5) { 
      setNameFontSize(size => Math.max(5, (size || 8) - 0.2));
    }
  }, [isMeasuring, processedData, isCompact, nameFontSize, cmToPx]);

  const handlePrintOptionChange = (key: 'showPrincipalSignature' | 'showTeacherSignature') => {
    setPrintOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    showToast('Mempersiapkan PDF (Ini mungkin memakan waktu)...', 'info');

    try {
      if (pageRef.current) {
        setExportProgress({ current: 0, total: 1, statusText: 'Mempersiapkan konversi lembar leger...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const originalTransform = pageRef.current.style.transform;
        const originalWidth = pageRef.current.style.width;
        const originalHeight = pageRef.current.style.height;
        const originalPosition = pageRef.current.style.position;
        const originalLeft = pageRef.current.style.left;
        const originalTop = pageRef.current.style.top;
        const originalZIndex = pageRef.current.style.zIndex;

        const pxPerCm = 37.7952755906;
        const widthPx = parseFloat(PAPER_SIZES[paperSize].width) * pxPerCm;
        const heightPx = parseFloat(PAPER_SIZES[paperSize].height) * pxPerCm;

        pageRef.current.style.transform = 'none';
        pageRef.current.style.width = widthPx + 'px';
        pageRef.current.style.height = heightPx + 'px';
        pageRef.current.style.position = 'absolute';
        pageRef.current.style.left = '0px';
        pageRef.current.style.top = '0px';
        pageRef.current.style.zIndex = '-9999';
        
        await new Promise(resolve => setTimeout(resolve, 150));

        setExportProgress({ current: 0, total: 1, statusText: 'Mengonversi lembar leger ke format gambar...' });

        const node = pageRef.current;
        const scaleFactor = 2;
        const fontEmbedCSSStr = await getFontEmbedCSS();
        const imgData = await htmlToImage.toJpeg(node, {
          quality: 0.98,
          backgroundColor: '#ffffff',
          pixelRatio: scaleFactor,
          fontEmbedCSS: fontEmbedCSSStr,
          style: {
            margin: '0'
          }
        });
        
        pageRef.current.style.transform = originalTransform;
        pageRef.current.style.width = originalWidth;
        pageRef.current.style.height = originalHeight;
        pageRef.current.style.position = originalPosition;
        pageRef.current.style.left = originalLeft;
        pageRef.current.style.top = originalTop;
        pageRef.current.style.zIndex = originalZIndex;
        
        const formatWidth = parseFloat(PAPER_SIZES[paperSize].width);
        const formatHeight = parseFloat(PAPER_SIZES[paperSize].height);
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'cm',
          format: [formatWidth, formatHeight]
        });
        
        setExportProgress({ current: 1, total: 1, statusText: 'Menyimpan file PDF...' });
        pdf.addImage(imgData, 'JPEG', 0, 0, formatWidth, formatHeight);
        pdf.save(`Leger_${settings.nama_kelas || 'Kelas'}_${settings.semester || 'Semester'}.pdf`);
        
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

    const paperSizeCss = {
      A4: 'size: A4 portrait;',
      F4: 'size: 21.5cm 33cm;',
      Letter: 'size: letter portrait;',
      Legal: 'size: legal portrait;',
    }[paperSize] || 'size: portrait;';

    const style = document.createElement('style');
    style.id = 'print-leger-style';
    style.innerHTML = `
      @page { 
        ${paperSizeCss} 
        margin: 0 !important; 
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      document.getElementById('print-leger-style')?.remove();
      setIsPrinting(false);
    }, 500);
  };

  const pageStyle = {
    width: PAPER_SIZES[paperSize].width,
    height: PAPER_SIZES[paperSize].height,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    marginBottom: `calc(${PAPER_SIZES[paperSize].height} * ${scale - 1})`,
  };

  return {
    students,
    settings,
    grades,
    subjects,
    paperSize,
    setPaperSize,
    isPrinting,
    isPrintingState,
    exportProgress,
    isCompact,
    isMeasuring,
    nameFontSize,
    printOptions,
    scale,
    cmToPx,
    nameCellRefs,
    pageRef,
    contentRef,
    cmRef,
    printAreaRef,
    displaySubjects,
    processedData,
    statistics,
    handlePrintOptionChange,
    isMobileDevice,
    handleDownloadPDF,
    handlePrint,
    pageStyle,
  };
};
