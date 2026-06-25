import { QUALITATIVE_DESCRIPTORS } from "../constants";

export const getGradeNumber = (str) => {
  if (!str) return null;
  const trimmedStr = String(str).trim();

  // Priority 1: Check for any Arabic numeral within the string.
  const arabicMatch = trimmedStr.match(/\d+/);
  if (arabicMatch) {
    return parseInt(arabicMatch[0], 10);
  }

  // Priority 2: Check for Roman numerals at the beginning of the string.
  // The order of checks is important.
  const upperStr = trimmedStr.toUpperCase();
  if (upperStr.startsWith("VI")) return 6;
  if (upperStr.startsWith("V")) return 5;
  if (upperStr.startsWith("IV")) return 4;
  if (upperStr.startsWith("III")) return 3;
  if (upperStr.startsWith("II")) return 2;
  if (upperStr.startsWith("I")) return 1;

  return null;
};

export const getNumericValue = (score, qualitativeGradingMap) => {
  if (typeof score === "number") return score;
  if (
    typeof score === "string" &&
    qualitativeGradingMap &&
    qualitativeGradingMap[score]
  ) {
    return qualitativeGradingMap[score];
  }
  return null;
};

export const getQualitativeCode = (score, predikats) => {
  if (typeof score !== "number") return score || ""; // It's already a code or null/undefined
  const valA = parseInt(predikats.a, 10);
  const valB = parseInt(predikats.b, 10);
  const valC = parseInt(predikats.c, 10);

  if (isNaN(valA) || isNaN(valB) || isNaN(valC)) return ""; // Not configured

  if (score >= valA) return "SB";
  if (score >= valB) return "BSH";
  if (score >= valC) return "MB";
  if (score < valC) return "BB";
  return "";
};

// --- Helper: split row into columns supporting tabs, semicolons, and spaces (especially for Android/mobile compatibility) ---
export const splitRowIntoColumns = (row) => {
  if (typeof row !== "string") return [row];
  const trimmed = row.trim();
  if (trimmed.includes("\t")) {
    return trimmed.split("\t");
  }
  if (trimmed.includes(";")) {
    return trimmed.split(";");
  }
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length > 1) {
    const isProbablySpaceSeparated = spaceParts.every((part) => {
      const clean = part.toUpperCase().trim();
      return (
        clean === "" ||
        clean === "-" ||
        !isNaN(parseFloat(clean.replace(",", "."))) ||
        QUALITATIVE_DESCRIPTORS[clean]
      );
    });
    if (isProbablySpaceSeparated) {
      return spaceParts;
    }
  }
  return [row];
};

// --- Helper: Generate Description Logic (Moved from Print Rapor) ---
export const capitalize = (s) => {
  if (typeof s !== "string" || !s) return "";
  const trimmed = s.trim().replace(/[.,;]$/, "");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const lowercaseFirst = (s) => {
  if (typeof s !== "string" || !s) return "";
  const trimmed = s.trim().replace(/[.,;]$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};

export const generateSubjectDescription = (
  student,
  detailedGrade,
  objectivesForSubject,
  settings,
  activeSlmIds,
) => {
  const studentNameRaw =
    student.namaPanggilan || (student.namaLengkap || "").split(" ")[0];
  const studentName = capitalize(studentNameRaw);

  const cleanTpText = (text) => {
    if (!text) return "";
    let cleanedText = String(text).trim();
    // Remove common prefixes if they exist in the source TP text
    cleanedText = cleanedText.replace(
      new RegExp(`^ananda\\s+${studentNameRaw}\\s`, "i"),
      "",
    );
    cleanedText = cleanedText.replace(/^ananda\s+/i, "");
    cleanedText = cleanedText.replace(/^peserta didik mampu\s+/i, "");
    cleanedText = cleanedText.replace(/^siswa mampu\s+/i, "");
    return cleanedText.trim();
  };

  if (!objectivesForSubject || objectivesForSubject.length === 0) {
    return { highest: "", lowest: "" };
  }

  const gradedTps = [];

  if (detailedGrade && detailedGrade.slm) {
    // Determine current semester
    const currentAppSemester = settings?.semester || "Ganjil";
    
    // Create a lookup map for faster access to TP texts, grouped by slmId.
    // Also build a map of SLM semesters.
    const tpTextMap = new Map();
    const slmSemesterMap = new Map();
    
    objectivesForSubject.forEach((obj) => {
      if (!tpTextMap.has(obj.slmId)) {
        tpTextMap.set(obj.slmId, []);
        slmSemesterMap.set(obj.slmId, obj.semester || "Semua");
      }
      tpTextMap.get(obj.slmId).push(cleanTpText(obj.text));
    });

    // Filter SLMs based on visibility settings and semester
    const visibleSlms = detailedGrade.slm.filter((slm) => {
      const isVisible = activeSlmIds ? activeSlmIds.includes(slm.id) : true;
      const slmSemester = slmSemesterMap.get(slm.id) || "Semua";
      const isCorrectSemester = slmSemester === "Semua" || slmSemester === currentAppSemester;
      return isVisible && isCorrectSemester;
    });

    // Iterate over the student's graded SLMs.
    visibleSlms.forEach((slm) => {
      const tpTextsForThisSlm = tpTextMap.get(slm.id);
      if (tpTextsForThisSlm && slm.scores) {
        slm.scores.forEach((score, index) => {
          // Check for numeric score. If string (qualitative), convert roughly or skip.
          let numericScore = score;

          if (typeof score === "string") {
            // Simple mapping for qualitative generation
            if (score === "SB") numericScore = 95;
            else if (score === "BSH") numericScore = 85;
            else if (score === "MB") numericScore = 75;
            else if (score === "BB") numericScore = 60;
            else numericScore = null;
          }

          if (
            typeof numericScore === "number" &&
            index < tpTextsForThisSlm.length
          ) {
            gradedTps.push({
              text: tpTextsForThisSlm[index],
              score: numericScore,
            });
          }
        });
      }
    });
  }

  if (gradedTps.length === 0) {
    return {
      highest: `${studentName} belum memiliki nilai TP yang cukup untuk deskripsi.`,
      lowest: "",
    };
  }

  if (gradedTps.length === 1) {
    return {
      highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(gradedTps[0].text)}.`,
      lowest: "",
    };
  }

  const scores = gradedTps.map((tp) => tp.score);
  const allScoresEqual = scores.every((s) => s === scores[0]);

  if (allScoresEqual) {
    return {
      highest: `${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
      lowest: `Terus pertahankan prestasi dan semangat belajar.`,
    };
  } else {
    // Find the single highest and single lowest scored TPs
    let highestTp = gradedTps[0];
    let lowestTp = gradedTps[0];

    for (let i = 1; i < gradedTps.length; i++) {
      if (gradedTps[i].score > highestTp.score) {
        highestTp = gradedTps[i];
      }
      if (gradedTps[i].score < lowestTp.score) {
        lowestTp = gradedTps[i];
      }
    }

    return {
      highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(highestTp.text)}.`,
      lowest: `${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`,
    };
  }
};
