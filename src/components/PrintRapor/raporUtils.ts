import { getGradeNumber } from '../../utils/nilaiHelpers';

export const HEADER_HEIGHT_CM = 6.0;
export const PAGE_TOP_MARGIN_CM = 1.5;
export const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5;
export const PAGE_BOTTOM_MARGIN_CM = 1.5;
export const PAGE_NUMBER_FOOTER_HEIGHT_CM = 1.0;
export const REPORT_CONTENT_BOTTOM_OFFSET_CM = PAGE_BOTTOM_MARGIN_CM + PAGE_NUMBER_FOOTER_HEIGHT_CM;

export const PAPER_SIZES: Record<string, { width: string; height: string }> = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

export const getPhase = (gradeNumber: number | null): string => {
    if (gradeNumber === null) return '';
    if (gradeNumber >= 5) return 'C'; // Kelas 5 & 6
    if (gradeNumber >= 3) return 'B'; // Kelas 3 & 4
    if (gradeNumber >= 1) return 'A'; // Kelas 1 & 2
    return '';
};

export const capitalize = (s: string): string => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const lowercaseFirst = (s: string): string => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};

export const getDynamicStyle = (text: string, baseSize = 11, smallSize = 9, thresholds = [35, 45]) => {
    const len = (text || '').length;
    let fontSize = baseSize;
    if (len > thresholds[1]) {
        fontSize = smallSize;
    } else if (len > thresholds[0]) {
        fontSize = baseSize - 1;
    }
    return { fontSize: `${fontSize}pt` };
};

export const generateDescription = (student: any, subject: any, gradeData: any, learningObjectives: any, settings: any) => {
    const currentSemester = settings?.semester || 'Ganjil';
    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    
    const descField = currentSemester === 'Genap' ? 'descriptions_Genap' : 'descriptions';
    const manualDescriptions = detailedGrade?.[descField] || {};
    
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);

    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };

    const cleanTpText = (text: string) => {
        if (!text) return '';
        let cleanedText = String(text).trim();
        const safeStudentName = escapeRegExp(studentNameRaw);
        cleanedText = cleanedText.replace(new RegExp(`^ananda\\s+${safeStudentName}\\s`, 'i'), '');
        cleanedText = cleanedText.replace(/^ananda\s+/i, '');
        return cleanedText.trim();
    };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    
    const merge = (generated: { highest: string; lowest: string }) => ({
        highest: (manualDescriptions.highest && manualDescriptions.highest.trim()) ? manualDescriptions.highest : generated.highest,
        lowest: (manualDescriptions.lowest && manualDescriptions.lowest.trim()) ? manualDescriptions.lowest : generated.lowest
    });

    if (currentGradeNumber === null) {
        return merge({ highest: `${studentName} menunjukkan perkembangan yang baik.`, lowest: "" });
    }
    
    let objectivesForCurrentClass = null;
    for (const key in learningObjectives) {
        if (getGradeNumber(key) === currentGradeNumber) {
            objectivesForCurrentClass = learningObjectives[key];
            break;
        }
    }

    const objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
    if (!objectivesForSubject || objectivesForSubject.length === 0) {
        return merge({ highest: `${studentName} menunjukkan penguasaan pada tujuan pembelajaran yang belum diisi.`, lowest: "" });
    }

    const gradedTps: any[] = [];
    
    if (detailedGrade && detailedGrade.slm) {
        const tpTextMap = new Map();
        const slmSemesterMap = new Map();

        objectivesForSubject.forEach((obj: any) => {
            if (!tpTextMap.has(obj.slmId)) {
                tpTextMap.set(obj.slmId, []);
                slmSemesterMap.set(obj.slmId, obj.semester || 'Semua');
            }
            tpTextMap.get(obj.slmId).push(cleanTpText(obj.text));
        });

        const activeSlmIds = settings.slmVisibility?.[subject.id];
        const visibleSlms = detailedGrade.slm.filter((slm: any) => {
            const isVisible = activeSlmIds ? activeSlmIds.includes(slm.id) : true;
            const slmSemester = slmSemesterMap.get(slm.id) || 'Semua';
            const isCorrectSemester = slmSemester === 'Semua' || slmSemester === currentSemester;
            return isVisible && isCorrectSemester;
        });

        visibleSlms.forEach((slm: any) => {
            const tpTextsForThisSlm = tpTextMap.get(slm.id);
            if (tpTextsForThisSlm && slm.scores) {
                slm.scores.forEach((score: any, index: number) => {
                    let numericScore = score;
                    if (typeof score === 'string') {
                         if (score === 'SB') numericScore = 95;
                         else if (score === 'BSH') numericScore = 85;
                         else if (score === 'MB') numericScore = 75;
                         else if (score === 'BB') numericScore = 60;
                         else numericScore = null;
                    }

                    if (typeof numericScore === 'number' && index < tpTextsForThisSlm.length) {
                        gradedTps.push({
                            text: tpTextsForThisSlm[index],
                            score: numericScore
                        });
                    }
                });
            }
        });
    }
    
    if (gradedTps.length === 0) {
        return merge({ highest: `${studentName} menunjukkan penguasaan yang belum terukur.`, lowest: "" });
    }
    
    if (gradedTps.length === 1) {
        return merge({ highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' });
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        return merge({ 
            highest: `${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        });
    } else {
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
        
        return merge({ 
            highest: `${studentName} menunjukkan penguasaan dalam ${lowercaseFirst(highestTp.text)}.`,
            lowest: `${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
        });
    }
};

export async function getFontEmbedCSS() {
    const urls = [
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Balinese&display=swap',
        'https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pinyon+Script&family=Alex+Brush&family=Dancing+Script:wght@400;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    ];
    let cssText = '';
    for (const url of urls) {
        try {
            const res = await fetch(url);
            let text = await res.text();
            const urlRegex = /url\(([^)]+)\)/g;
            let match;
            const fontMatches = [];
            while ((match = urlRegex.exec(text)) !== null) {
                fontMatches.push(match[1].replace(/['"]/g, ''));
            }
            const uniqueFontUrls = [...new Set(fontMatches)];
            
            for (const fontUrl of uniqueFontUrls) {
                try {
                    const fontRes = await fetch(fontUrl);
                    const fontBlob = await fontRes.blob();
                    const base64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(fontBlob);
                    });
                    text = text.split(fontUrl).join(base64 as string);
                } catch (err) {
                    console.error('Failed to fetch font', fontUrl, err);
                }
            }
            cssText += text + '\n';
        } catch (e) {
            console.error('Failed to fetch font css', url, e);
        }
    }
    return cssText;
}
