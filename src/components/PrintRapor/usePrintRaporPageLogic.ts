import { useMemo, useEffect, useRef, useState } from 'react';
import { getGradeNumber } from '../../utils/nilaiHelpers';
import { capitalize, generateDescription, PAPER_SIZES } from './raporUtils';
import { getFontEmbedCSS } from '../../utils/pdfFonts';
import { usePrintStore } from '../../stores/usePrintStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useAttendanceStore } from '../../stores/useAttendanceStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useExtracurricularStore } from '../../stores/useExtracurricularStore';
import { useCurriculumStore } from '../../stores/useCurriculumStore';
import { useCocurricularStore } from '../../stores/useCocurricularStore';
import { COCURRICULAR_DIMENSIONS } from '../../constants';
import { resolveKopLayout } from '../../utils/TransliterationUtil';
import { resolveImageForVectorPdf, runHybridPdfExportWithFallback } from '../../utils/pdfExportCoordinator';
import type { VectorRaporPayload, VectorRaporStudentEntry } from '../../types/pdfExport';

interface UsePrintRaporPageLogicProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

function buildCocurricularDescriptionText(student: any, settings: any, cocurricularData: Record<string, any>): string {
  const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);
  const studentCoData = cocurricularData?.[student.id];
  const ratings =
    studentCoData?.dimensionRatings && typeof studentCoData.dimensionRatings === 'object'
      ? studentCoData.dimensionRatings
      : studentCoData?.dimensionRatings_Genap && typeof studentCoData.dimensionRatings_Genap === 'object'
        ? studentCoData.dimensionRatings_Genap
        : {};

  const manualContent = ratings?.manualDescription || studentCoData?.manualDescription;
  if (manualContent) return String(manualContent);

  const theme = settings.cocurricular_theme || settings.cocurricular_theme_Genap;
  const hasRatings = Object.values(ratings).some((r) => r && r !== '---');
  if (!theme && !hasRatings) return 'Data kokurikuler belum diisi.';

  const descriptionParts: string[] = [];
  if (theme) {
    descriptionParts.push(`${nickname} berpartisipasi aktif dalam kegiatan kokurikuler dengan tema "${theme}".`);
  }

  const sbDimensions = COCURRICULAR_DIMENSIONS.filter((dim) => ratings[dim.id] === 'SB').map((dim) => dim.label.toLowerCase());
  const bshDimensions = COCURRICULAR_DIMENSIONS.filter((dim) => ratings[dim.id] === 'BSH').map((dim) => dim.label.toLowerCase());
  const developingDimensions = COCURRICULAR_DIMENSIONS.filter((dim) => ['MB', 'BB'].includes(ratings[dim.id])).map((dim) =>
    dim.label.toLowerCase()
  );

  const formatDims = (list: string[]) => {
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    const last = list[list.length - 1];
    const rest = list.slice(0, -1).join(', ');
    return `${rest}, dan ${last}`;
  };

  if (sbDimensions.length > 0 || bshDimensions.length > 0) {
    let positiveSentence = 'Ia menunjukkan perkembangan yang ';
    const parts: string[] = [];
    if (sbDimensions.length > 0) parts.push(`sangat baik dalam aspek ${formatDims(sbDimensions)}`);
    if (bshDimensions.length > 0) parts.push(`baik dalam aspek ${formatDims(bshDimensions)}`);
    positiveSentence += parts.join(' serta ') + '.';
    descriptionParts.push(positiveSentence);
  }

  if (developingDimensions.length > 0) {
    descriptionParts.push(`Perlu bimbingan untuk lebih meningkatkan kemampuan dalam aspek ${formatDims(developingDimensions)}.`);
  }

  if (descriptionParts.length > 0 && !hasRatings) {
    descriptionParts.push('Penilaian dimensi profil lulusan perlu ditambahkan.');
  } else if (descriptionParts.length === 0 && hasRatings) {
    descriptionParts.push(`${nickname} telah menyelesaikan kegiatan kokurikuler dengan baik.`);
  }

  return descriptionParts.join(' ');
}

function buildReportSubjectsForStudent(
  student: any,
  gradeData: any,
  subjects: any[],
  learningObjectives: any,
  settings: any
) {
  const result: Array<{ id: string; name: string; grade: any; highest: string; lowest: string }> = [];
  const processedGroups = new Set<string>();
  const allActiveSubjects = subjects.filter((s) => s.active);

  const groupConfigs: Record<string, (groupSubjects: any[]) => { subject: any; name: string } | null> = {
    'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
      const studentReligionLower = String(student.agama || '').trim().toLowerCase();
      if (!studentReligionLower) return null;
      let representative = null;
      if (studentReligionLower === 'kepercayaan') {
        representative = groupSubjects.find((s) => s.id === 'PAKTTMYME');
      } else {
        representative = groupSubjects.find((s) => {
          const match = s.fullName.toLowerCase().match(/\(([^)]+)\)/);
          return match && match[1].trim().toLowerCase() === studentReligionLower;
        });
      }
      return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
    },
    'Seni Budaya': (groupSubjects) => {
      const chosen =
        groupSubjects.find((s) => gradeData?.finalGrades?.[s.id] != null) ||
        groupSubjects.find((s) => s.fullName.includes('Seni Rupa')) ||
        groupSubjects[0];
      return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
    },
    'Muatan Lokal': (groupSubjects) => {
      const chosen = groupSubjects.find((s) => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
      if (chosen) {
        const match = chosen.fullName.match(/\(([^)]+)\)/);
        return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
      }
      return null;
    },
  };

  Object.keys(groupConfigs).forEach((groupName) => {
    if (processedGroups.has(groupName)) return;
    const groupSubjects = allActiveSubjects.filter((s) => s.fullName.startsWith(groupName));
    if (groupSubjects.length > 0) {
      const config = groupConfigs[groupName](groupSubjects);
      if (config && config.subject) {
        const grade = gradeData?.finalGrades?.[config.subject.id];
        const desc = generateDescription(student, config.subject, gradeData, learningObjectives, settings);
        result.push({
          id: config.subject.id,
          name: config.name,
          grade,
          highest: desc.highest || '',
          lowest: desc.lowest || '',
        });
      }
      processedGroups.add(groupName);
    }
  });

  allActiveSubjects.forEach((subject) => {
    const isGrouped = Object.keys(groupConfigs).some((groupName) => subject.fullName.startsWith(groupName));
    if (subject.id === 'PAKTTMYME') {
      const studentReligion = String(student.agama || '').trim().toLowerCase();
      if (studentReligion !== 'kepercayaan') return;
    }
    if (!isGrouped) {
      const grade = gradeData?.finalGrades?.[subject.id];
      const desc = generateDescription(student, subject, gradeData, learningObjectives, settings);
      result.push({
        id: subject.id,
        name: subject.fullName,
        grade,
        highest: desc.highest || '',
        lowest: desc.lowest || '',
      });
    }
  });

  const sortOrder = [
    'Pendidikan Agama dan Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika',
    'Ilmu Pengetahuan Alam dan Sosial',
    'Seni Budaya',
    'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    'Bahasa Inggris',
    'Muatan Lokal',
  ];

  const findOriginalFullName = (subjectId: string) => subjects.find((s) => s.id === subjectId)?.fullName || '';

  result.sort((a, b) => {
    const getSortKey = (item: any) => {
      const originalFullName = findOriginalFullName(item.id);
      if (originalFullName.startsWith('Pendidikan Agama')) return 'Pendidikan Agama dan Budi Pekerti';
      if (originalFullName.startsWith('Seni Budaya')) return 'Seni Budaya';
      if (originalFullName.startsWith('Muatan Lokal')) return 'Muatan Lokal';
      return item.name;
    };
    const aSortKey = getSortKey(a);
    const bSortKey = getSortKey(b);
    const aIndex = sortOrder.findIndex((key) => aSortKey.startsWith(key));
    const bIndex = sortOrder.findIndex((key) => bSortKey.startsWith(key));
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return result;
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
  const isMountedRef = useRef(true);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; statusText: string } | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      document.getElementById('print-page-style')?.remove();
    };
  }, []);

  const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);
  const isFaseA = useMemo(() => gradeNumber === 1 || gradeNumber === 2, [gradeNumber]);

  const studentRanks = useMemo(() => {
    if (rankingOption === 'none' || !students.length || !grades.length || !subjects.length) {
      return new Map();
    }

    const allActiveSubjects = subjects.filter((s) => s.active);
    const activeSubjectMap = new Map<string, any>();
    allActiveSubjects.forEach((s) => activeSubjectMap.set(s.id, s));

    const gradeMap = new Map<string, any>();
    grades.forEach((g) => {
      if (g?.studentId) gradeMap.set(String(g.studentId), g);
    });

    const studentsWithTotals = students.map((student) => {
      const gradeData = gradeMap.get(String(student.id));
      if (!gradeData || !gradeData.finalGrades) {
        return { studentId: student.id, totalScore: 0 };
      }

      const studentReligionLower = String(student.agama || '').trim().toLowerCase();

      const totalScore = Object.entries(gradeData.finalGrades).reduce((sum, [subjectId, score]) => {
        const subjectInfo = activeSubjectMap.get(subjectId);
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

  const prepareRaporVectorPayload = async (
    targetStudents: any[],
    formatWidth: number,
    formatHeight: number
  ): Promise<VectorRaporPayload> => {
    const currentSettings = useSettingsStore.getState().settings;
    const currentSubjects = useSettingsStore.getState().subjects;
    const currentGrades = useNilaiStore.getState().grades;
    const currentAttendance = useAttendanceStore.getState().attendance;
    const currentNotes = useNotesStore.getState().notes;
    const currentStudentExtra = useExtracurricularStore.getState().studentExtracurriculars;
    const currentExtracurriculars = useSettingsStore.getState().extracurriculars;
    const currentLearningObjectives = useCurriculumStore.getState().learningObjectives;
    const currentCocurricularData = useCocurricularStore.getState().cocurricularData;
    const studentPhotoUrls = useStudentsStore.getState().studentPhotoUrls;

    const [logoCover, logoDinas, logoSekolah, ttdKepalaSekolah, ttdWaliKelas] = await Promise.all([
      resolveImageForVectorPdf(currentSettings.logo_cover),
      resolveImageForVectorPdf(currentSettings.logo_dinas),
      resolveImageForVectorPdf(currentSettings.logo_sekolah),
      resolveImageForVectorPdf(currentSettings.ttd_kepala_sekolah),
      resolveImageForVectorPdf(currentSettings.ttd_wali_kelas),
    ]);

    const entries: VectorRaporStudentEntry[] = await Promise.all(
      targetStudents.map(async (student) => {
        const gradeData = currentGrades.find((g: any) => String(g.studentId) === String(student.id));
        const rank = studentRanks.get(student.id)?.rank ?? null;
        const shouldDisplayRank = Boolean(
          rank &&
            rankingOption !== 'none' &&
            ((rankingOption === 'top3' && rank <= 3) || (rankingOption === 'top10' && rank <= 10))
        );

        const attRow = currentAttendance.find((a: any) => String(a.studentId) === String(student.id));
        const toInt = (val: any) => (val === null || val === undefined || val === '' ? 0 : Number(val) || 0);
        const attendanceObj = {
          sakit: toInt(attRow?.sakit),
          izin: toInt(attRow?.izin),
          alpa: toInt(attRow?.alpa),
        };

        const rawNote = currentNotes?.[student.id] || currentNotes?.[`${student.id}_Genap`] || '';
        let noteContent = String(rawNote).trim();
        if (shouldDisplayRank) {
          const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);
          const cleanNote = noteContent.replace(/Selamat!.*Peringkat \d+ di kelas\.?\s*/i, '').trim();
          noteContent = `Selamat! ${nickname} berhasil meraih Peringkat ${rank} di kelas.${cleanNote ? ` ${cleanNote}` : ''}`;
        }

        const studentExtra = currentStudentExtra.find((se: any) => String(se.studentId) === String(student.id));
        const extraActivities = (studentExtra?.assignedActivities || [])
          .filter(Boolean)
          .map((activityId: string) => {
            const act = currentExtracurriculars.find((e: any) => e.id === activityId);
            return {
              id: activityId,
              name: act?.name || '',
              description: studentExtra?.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.',
            };
          });

        const photoSrc = studentPhotoUrls[student.id] || student.foto || '';
        const photoImage = await resolveImageForVectorPdf(photoSrc);

        return {
          student,
          rank,
          shouldDisplayRank,
          reportSubjects: buildReportSubjectsForStudent(
            student,
            gradeData,
            currentSubjects,
            currentLearningObjectives,
            currentSettings
          ),
          cocurricularDescription: buildCocurricularDescriptionText(student, currentSettings, currentCocurricularData),
          extraActivities,
          attendance: attendanceObj,
          noteContent,
          photoImage,
        };
      })
    );

    const kopElements = resolveKopLayout(currentSettings, currentSettings?.semester || 'Ganjil');
    const kkm = parseInt(currentSettings?.predikats?.c || '70', 10);

    return {
      kind: 'rapor',
      formatWidth,
      formatHeight,
      orientation: 'portrait',
      settings: currentSettings,
      selectedPages,
      hideGradesForFaseA: isFaseA && Boolean(hideGradesForFaseA),
      kkm: Number.isNaN(kkm) ? 70 : kkm,
      printOptions,
      kopElements,
      images: {
        logoCover,
        logoDinas,
        logoSekolah,
        ttdKepalaSekolah,
        ttdWaliKelas,
      },
      entries,
    };
  };

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    showToast('Mempersiapkan PDF (Ini mungkin memakan waktu)...', 'info');

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Proses pembuatan PDF sedang berlangsung. Yakin ingin meninggalkan halaman?';
      return e.returnValue;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    try {
      if (printAreaRef.current) {
        // Yield briefly so full DOM render after flushAll settles
        await new Promise((resolve) => setTimeout(resolve, 120));

        const pages = Array.from(
          printAreaRef.current.querySelectorAll('.rapor-page, .report-page')
        ) as HTMLElement[];

        if (pages.length === 0) {
          showToast('Gagal menemukan halaman.', 'error');
          return;
        }

        const pxPerCm = 37.7952755906;
        const formatWidth = parseFloat(PAPER_SIZES[paperSize].width);
        const formatHeight = parseFloat(PAPER_SIZES[paperSize].height);
        const widthPx = formatWidth * pxPerCm;
        const heightPx = formatHeight * pxPerCm;

        let fileName = 'Rapor.pdf';
        if (selectedStudentId !== 'all') {
          const student = students.find((s) => String(s.id) === selectedStudentId);
          if (student) fileName = `Rapor_${student.namaLengkap.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        }

        const targetStudents =
          selectedStudentId === 'all'
            ? students
            : students.filter((s) => String(s.id) === selectedStudentId);

        const result = await runHybridPdfExportWithFallback({
          pages,
          widthPx,
          heightPx,
          formatWidth,
          formatHeight,
          orientation: 'portrait',
          fileName,
          loadFontEmbedCSS: getFontEmbedCSS,
          pageLabelSingular: 'halaman',
          onProgress: (prog) => {
            if (isMountedRef.current) {
              setExportProgress(prog);
            }
          },
          isMounted: () => isMountedRef.current,
          prepareVectorPayload: () => prepareRaporVectorPayload(targetStudents, formatWidth, formatHeight),
        });

        if (result.aborted || !isMountedRef.current) {
          return;
        }

        if (result.usedVectorFallback) {
          showToast('PDF berhasil dibuat (mode vektor latar belakang).', 'success');
        } else {
          showToast('PDF berhasil diunduh.', 'success');
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      if (isMountedRef.current) {
        showToast('Gagal menghasilkan PDF. Silahkan coba lagi.', 'error');
      }
    } finally {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      if (isMountedRef.current) {
        setIsPrinting(false);
        setExportProgress(null);
      }
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
