import { getGradeNumber } from './nilaiHelpers';

// --- Sanitization helpers ---
export const sanitizeGrades = (gradesList, semester, loList, namaKelas, subjects = []) => {
    const isGenap = semester === "Genap";
    const gradeKey = `Kelas ${getGradeNumber(namaKelas) || '5'}`;
    return (gradesList || []).map(g => {
        const newDetailedGrades = {};
        if (g.detailedGrades) {
            Object.entries(g.detailedGrades).forEach(([subId, detailed]) => {
                if (!detailed) return;

                // Only keep SLM (TP) scores that belong to the active semester
                const subj = subjects.find(s => s.id === subId);
                const curriculumKey = subj ? (subj.curriculumKey || subj.fullName) : subId;
                const activeObjectives = loList?.[gradeKey]?.[curriculumKey] || [];
                const activeSlmIds = new Set(
                    activeObjectives
                        .filter(obj => (obj.semester || "Ganjil").toLowerCase().trim() === semester.toLowerCase().trim())
                        .map(obj => obj.slmId)
                        .filter(Boolean)
                );

                const filteredSlm = (detailed.slm || []).filter(slm => slm.id && activeSlmIds.has(slm.id));

                const newDet = {
                    ...detailed,
                    slm: filteredSlm,
                };

                if (isGenap) {
                    newDet.sts1 = null;
                    newDet.sas1 = null;
                    delete newDet.descriptions;
                } else {
                    newDet.sts2 = null;
                    newDet.sas2 = null;
                    delete newDet.descriptions_Genap;
                }
                newDetailedGrades[subId] = newDet;
            });
        }
        return {
            ...g,
            detailedGrades: newDetailedGrades,
            finalGrades: g.finalGrades || {}
        };
    });
};

export const sanitizeNotes = (notesData, semester) => {
    const isGenap = semester === "Genap";
    const newNotes = {};
    Object.entries(notesData || {}).forEach(([key, val]) => {
        const isNoteGenap = key.endsWith("_Genap");
        if (isGenap === isNoteGenap) {
            newNotes[key] = val;
        }
    });
    return newNotes;
};

export const sanitizeAttendance = (attendanceList, semester) => {
    return (attendanceList || []).filter(item => (item.semester || "Ganjil") === semester);
};

export const sanitizeStudentExtracurriculars = (list, semester) => {
    return (list || []).filter(item => (item.semester || "Ganjil") === semester);
};

export const sanitizeCocurricularData = (coData, semester) => {
    const isGenap = semester === "Genap";
    const newCo = {};
    Object.entries(coData || {}).forEach(([sid, data]) => {
        if (!data) return;
        const sData = { ...data };
        if (isGenap) {
            delete sData.dimensionRatings;
        } else {
            delete sData.dimensionRatings_Genap;
        }
        if (isGenap && sData.dimensionRatings_Genap) {
            newCo[sid] = sData;
        } else if (!isGenap && sData.dimensionRatings) {
            newCo[sid] = sData;
        }
    });
    return newCo;
};

export const sanitizeLearningObjectives = (lo, _semester) => {
    return lo;
};

export const sanitizeFormativeJournal = (fj, semester) => {
    const newFj = {};
    Object.entries(fj || {}).forEach(([sid, list]) => {
        if (Array.isArray(list)) {
            const filtered = list.filter(row => (row.semester || "Ganjil") === semester);
            if (filtered.length > 0) {
                newFj[sid] = filtered;
            }
        }
    });
    return newFj;
};

export const sanitizeSettings = (settings, _semester) => {
    const imageKeys = ['logoSistem', 'ttdKepsek', 'ttdKepsek_Genap', 'logo_sekolah', 'logo_dinas', 'logo_cover', 'piagam_background', 'ttd_kepala_sekolah', 'ttd_wali_kelas'];
    
    if (settings) {
        imageKeys.forEach(key => {
            if (settings[key] === "null" || settings[key] === "undefined" || settings[key] === "") {
                settings[key] = null;
            } else if (typeof settings[key] === 'string' && settings[key].length === 32767) {
                // Truncated by Excel cell limit
                settings[key] = null;
            }
        });
    }

    return settings;
};

// --- Core functions ---
