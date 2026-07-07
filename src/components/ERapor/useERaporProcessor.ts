import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getGradeNumber } from '../../utils/nilaiHelpers';

interface Subject {
  id: string;
  fullName: string;
  label: string;
  active: boolean;
}

interface Student {
  id: string;
  namaLengkap: string;
  nisn: string;
}

interface Settings {
  nama_kelas?: string;
  semester?: string;
  slmVisibility?: Record<string, string[]>;
  qualitativeGradingMap?: Record<string, number>;
}

interface UseERaporProcessorProps {
  students: Student[];
  grades: any[];
  subjects: Subject[];
  settings: Settings;
  learningObjectives: any;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

const getNumericValue = (score: any, qualitativeGradingMap: Record<string, number> | undefined) => {
  if (typeof score === 'number') return score;
  if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
    return qualitativeGradingMap[score];
  }
  return null;
};

export const useERaporProcessor = ({
  students,
  grades,
  subjects,
  settings,
  learningObjectives,
  showToast,
  onClose,
}: UseERaporProcessorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar. Maksimal 10MB.', 'error');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setConfirmationData(null);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcessFile = async () => {
    if (!file) {
      showToast('Silakan pilih file format e-Rapor terlebih dahulu.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });

      const analysis = {
        workbook,
        ws,
        studentMap: new Map<number, string>(),
        tpMapping: new Map<string, { text: string; columnIndex: number }>(),
        fileName,
        nilaiRaporColIndex: 4,
      };

      const subjectNameMatch = fileName.match(/Kelas\s*\d+\s*[_-]\s*(.+?)(?:\s*\(\d+\)|_fase)?\.xlsx/i);
      const subjectNameFromFileRaw = subjectNameMatch ? subjectNameMatch[1] : null;

      let bestMatch: Subject | null = null;
      if (subjectNameFromFileRaw) {
        const normalizeAndTokenize = (str: string | null) => {
          if (!str) return [];
          return str
            .toLowerCase()
            .replace(/\(.*\)/g, '') // remove content in parentheses like (1)
            .replace(/[,.]/g, '') // remove common punctuation
            .replace(/[-_]/g, ' ') // replace separators with space
            .split(/\s+/) // split into words
            .filter(Boolean); // remove empty strings
        };

        const fileNameTokens = normalizeAndTokenize(subjectNameFromFileRaw);
        let highestScore = 0;
        const MATCH_THRESHOLD = 0.75;

        subjects
          .filter((s) => s.active)
          .forEach((subject) => {
            const appSubjectTokens = normalizeAndTokenize(subject.fullName);
            if (appSubjectTokens.length === 0) return;

            let matchingWords = 0;
            const fileNameTokenSet = new Set(fileNameTokens);

            for (const token of appSubjectTokens) {
              if (fileNameTokenSet.has(token)) {
                matchingWords++;
              }
            }
            const score = matchingWords / appSubjectTokens.length;

            if (score > highestScore) {
              highestScore = score;
              bestMatch = score >= MATCH_THRESHOLD ? subject : null;
            }
          });
      }

      let nisnColIndex = -1;
      let nilaiRaporColIndex = 4; // Default to Column E
      const headerRowIndex = jsonData.findIndex((row) =>
        row.some((cell) => typeof cell === 'string' && cell.toUpperCase() === 'NISN')
      );

      if (headerRowIndex !== -1) {
        const headerRow = jsonData[headerRowIndex];
        nisnColIndex = headerRow.findIndex(
          (cell) => typeof cell === 'string' && cell.toUpperCase() === 'NISN'
        );
        const nrIndex = headerRow.findIndex(
          (cell) => typeof cell === 'string' && cell.toUpperCase().includes('NILAI RAPOR')
        );
        if (nrIndex !== -1) {
          nilaiRaporColIndex = nrIndex;
        }
      }

      if (nisnColIndex === -1) throw new Error("Kolom 'NISN' tidak ditemukan di file Excel.");

      jsonData.forEach((row, index) => {
        const nisn = row[nisnColIndex];
        if (nisn) {
          const student = students.find((s) => String(s.nisn) === String(nisn));
          if (student) analysis.studentMap.set(index, student.id);
        }
      });

      const tpSectionRow = jsonData.findIndex((row) =>
        row.some((cell) => typeof cell === 'string' && cell.toUpperCase().includes('KETERANGAN'))
      );
      if (tpSectionRow === -1) throw new Error("Bagian 'KETERANGAN' untuk pemetaan TP tidak ditemukan.");

      let tpHeaderRowIndex = -1;
      jsonData.slice(tpSectionRow + 1).forEach((row) => {
        const cell1 = String(row[0] || '').trim();
        const cell2 = String(row[1] || '').trim();
        if (!cell1.startsWith('TP') || !cell2) return;

        const tpCode = cell1.replace(':', '').trim();
        const tpText = cell2;

        if (tpHeaderRowIndex === -1) {
          tpHeaderRowIndex = jsonData.findIndex((r) => r.includes(tpCode));
        }
        if (tpHeaderRowIndex === -1) return;

        const colIndex = jsonData[tpHeaderRowIndex].indexOf(tpCode);
        if (colIndex === -1) return;

        analysis.tpMapping.set(tpCode, { text: tpText, columnIndex: colIndex });
      });

      analysis.nilaiRaporColIndex = nilaiRaporColIndex;
      setConfirmationData({ analysis, matchedSubject: bestMatch });
    } catch (error: any) {
      showToast(error.message, 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillAndDownload = async (analysisResult: any) => {
    if (!analysisResult) return;
    setIsLoading(true);
    try {
      const { workbook, ws, subject, studentMap, tpMapping, fileName: currentFileName, nilaiRaporColIndex } = analysisResult;

      const currentSemester = settings?.semester || 'Ganjil';
      const currentGradeNumber = getGradeNumber(settings?.nama_kelas);
      let objectivesForSubject: any[] = [];

      if (currentGradeNumber !== null && learningObjectives) {
        let objectivesForCurrentClass = null;
        for (const key in learningObjectives) {
          if (getGradeNumber(key) === currentGradeNumber) {
            objectivesForCurrentClass = learningObjectives[key];
            break;
          }
        }
        objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
      }

      const activeSlmIds = settings?.slmVisibility?.[subject.id];

      const tpTextMap = new Map<string, string[]>();
      const slmSemesterMap = new Map<string, string>();

      objectivesForSubject.forEach((obj) => {
        if (!tpTextMap.has(obj.slmId)) {
          tpTextMap.set(obj.slmId, []);
          slmSemesterMap.set(obj.slmId, obj.semester || 'Semua');
        }
        tpTextMap.get(obj.slmId)?.push(obj.text);
      });

      for (const [rowIndex, studentId] of studentMap.entries()) {
        const studentData = students.find((s) => s.id === studentId);
        const gradeData = grades.find((g) => g.studentId === studentId);
        if (!studentData || !gradeData) continue;

        const finalGrade = gradeData.finalGrades?.[subject.id];
        if (finalGrade !== null && finalGrade !== undefined) {
          const cellRef = XLSX.utils.encode_cell({ c: nilaiRaporColIndex || 4, r: rowIndex });
          XLSX.utils.sheet_add_aoa(ws, [[finalGrade]], { origin: cellRef });
        }

        const allTpsWithScores: { score: number; text: string }[] = [];
        const detailedGrade = gradeData.detailedGrades?.[subject.id];

        if (detailedGrade?.slm) {
          const visibleSlms = detailedGrade.slm.filter((slm: any) => {
            const isVisible = activeSlmIds ? activeSlmIds.includes(slm.id) : true;
            const slmSemester = slmSemesterMap.get(slm.id) || 'Semua';
            const isCorrectSemester = slmSemester === 'Semua' || slmSemester === currentSemester;
            return isVisible && isCorrectSemester;
          });

          visibleSlms.forEach((slm: any) => {
            const tpTextsForThisSlm = tpTextMap.get(slm.id);
            if (tpTextsForThisSlm && slm.scores) {
              slm.scores.forEach((score: any, tpIndex: number) => {
                const numericScore = getNumericValue(score, settings.qualitativeGradingMap);
                if (typeof numericScore === 'number' && tpIndex < tpTextsForThisSlm.length) {
                  allTpsWithScores.push({
                    score: numericScore,
                    text: tpTextsForThisSlm[tpIndex],
                  });
                }
              });
            }
          });
        }

        if (allTpsWithScores.length >= 2) {
          allTpsWithScores.sort((a, b) => a.score - b.score);
          const lowestTp = allTpsWithScores[0];
          const highestTp = allTpsWithScores[allTpsWithScores.length - 1];

          let highestColIndex = -1;
          let lowestColIndex = -1;

          for (const [, { text, columnIndex }] of tpMapping.entries()) {
            if (text.trim() === highestTp.text.trim()) highestColIndex = columnIndex;
            if (text.trim() === lowestTp.text.trim()) lowestColIndex = columnIndex;
          }

          if (highestColIndex !== -1) {
            const cellRef = XLSX.utils.encode_cell({ c: highestColIndex, r: rowIndex });
            XLSX.utils.sheet_add_aoa(ws, [['T']], { origin: cellRef });
          }
          if (lowestColIndex !== -1) {
            const cellRef = XLSX.utils.encode_cell({ c: lowestColIndex, r: rowIndex });
            XLSX.utils.sheet_add_aoa(ws, [['R']], { origin: cellRef });
          }
        }
      }

      const newFileName = `TERISI_${currentFileName}`;
      XLSX.writeFile(workbook, newFileName);
      showToast(`File "${newFileName}" berhasil diunduh.`, 'success');
    } catch (error: any) {
      showToast('Gagal memproses file: ' + error.message, 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleConfirmAndFill = (finalSubject: any) => {
    if (!confirmationData || !finalSubject) return;
    const fullAnalysisResult = { ...confirmationData.analysis, subject: finalSubject };
    setConfirmationData(null);
    fillAndDownload(fullAnalysisResult);
  };

  const handleClose = () => {
    setFile(null);
    setFileName('');
    setConfirmationData(null);
    onClose();
  };

  return {
    file,
    fileName,
    isLoading,
    confirmationData,
    fileInputRef,
    handleFileChange,
    handleAreaClick,
    handleProcessFile,
    handleConfirmAndFill,
    handleClose,
    setConfirmationData,
  };
};
