import { useMemo, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useAttendanceStore } from '../../stores/useAttendanceStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useExtracurricularStore } from '../../stores/useExtracurricularStore';
import { useCurriculumStore } from '../../stores/useCurriculumStore';
import { useCocurricularStore } from '../../stores/useCocurricularStore';
import { capitalize, generateDescription } from './raporUtils';

export function useReportPagesForStudentLogic(student: any, settings: any, rank: number | null, rankingOption: string) {
    const grades = useNilaiStore((state) => state.grades);
    const setGrades = useNilaiStore((state) => state.setGrades);
    const subjects = useSettingsStore((state) => state.subjects);
    const setStudents = useStudentsStore((state) => state.setStudents);
    const setSettings = useSettingsStore((state) => state.setSettings);
    const attendance = useAttendanceStore((state) => state.attendance);
    const setAttendance = useAttendanceStore((state) => state.setAttendance);
    const notes = useNotesStore((state) => state.notes);
    const studentExtracurriculars = useExtracurricularStore((state) => state.studentExtracurriculars);
    const setStudentExtracurriculars = useExtracurricularStore((state) => state.setStudentExtracurriculars);
    const extracurriculars = useSettingsStore((state) => state.extracurriculars);
    const learningObjectives = useCurriculumStore((state) => state.learningObjectives);
    const cocurricularData = useCocurricularStore((state) => state.cocurricularData);
    const setCocurricularData = useCocurricularStore((state) => state.setCocurricularData);

    const onUpdateDescription = useCallback((sid: string, subId: string, type: 'highest' | 'lowest', val: string, currentDescriptions: any) => {
        setGrades(prev => {
            const currentSemester = settings?.semester || "Ganjil";
            const descField = currentSemester === "Genap" ? "descriptions_Genap" : "descriptions";
            const n = JSON.parse(JSON.stringify(prev));
            const g = n.find((x: any) => x.studentId === sid);
            if (g) {
                if (!g.detailedGrades[subId]) g.detailedGrades[subId] = { slm: [], sts1: null, sts2: null, sas1: null, sas2: null };
                if (!g.detailedGrades[subId][descField]) {
                    g.detailedGrades[subId][descField] = currentDescriptions || { highest: "", lowest: "" };
                }
                g.detailedGrades[subId][descField][type] = val;
            }
            return n;
        });
    }, [setGrades, settings?.semester]);

    const onUpdateStudent = useCallback((id: string, k: string, v: string) => setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, [k]: v } : s))), [setStudents]);

    const onUpdateSettings = useCallback((k: string, v: any) => setSettings((s) => {
        const newS = { ...s, [k]: v };
        const ctxMatch = k.match(/^(.*?)_ctx_[^_]+_[^_]+_[^_]+$/);
        if (ctxMatch) newS[ctxMatch[1]] = v;
        return newS;
    }), [setSettings]);

    const onUpdateNote = useCallback((sid: string, v: string) => {
        useNotesStore.getState().updateNote(sid, v, settings?.semester);
    }, [settings?.semester]);

    const onUpdateAttendance = useCallback((sid: string, k: string, v: string) =>
        setAttendance((prev) => {
            const n = [...prev];
            const sem = settings?.semester || "Ganjil";
            const i = n.findIndex((a) => a.studentId === sid && (a.semester || "Ganjil") === sem);
            if (i > -1) n[i][k] = v === "" ? null : parseInt(v);
            else n.push({ studentId: sid, semester: sem, [k]: v === "" ? null : parseInt(v) });
            return n;
        }), [setAttendance, settings?.semester]);

    const onUpdateExtraDescription = useCallback((sid: string, eid: string, v: string) =>
        setStudentExtracurriculars((prev) =>
            prev.map((s) => {
                const sem = settings?.semester || "Ganjil";
                if (s.studentId === sid && (s.semester || "Ganjil") === sem) {
                    return { ...s, descriptions: { ...s.descriptions, [eid]: v } };
                }
                return s;
            })
        ), [setStudentExtracurriculars, settings?.semester]);

    const onUpdateCocurricularManual = useCallback((sid: string, v: string) =>
        setCocurricularData((prev) => {
            const currentSemester = settings?.semester || "Ganjil";
            const fieldName = currentSemester === "Genap" ? "dimensionRatings_Genap" : "dimensionRatings";
            return {
                ...prev,
                [sid]: {
                    ...prev[sid],
                    [fieldName]: { ...(prev[sid]?.[fieldName] || {}), manualDescription: v },
                },
            };
        }), [setCocurricularData, settings?.semester]);

    const currentSemester = settings?.semester || 'Ganjil';
    
    const gradeData = grades.find((g: any) => g.studentId === student.id);

    const shouldDisplayRank = useMemo(() => rank && rankingOption !== 'none' && (
        (rankingOption === 'top3' && rank <= 3) ||
        (rankingOption === 'top10' && rank <= 10)
    ), [rank, rankingOption]);

    const notesForMeasurement = useMemo(() => {
        const safeNotes = notes || {};
        const originalNoteKey = currentSemester === 'Genap' ? student.id + '_Genap' : student.id;
        if (shouldDisplayRank) {
            const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);
            const rankMessage = `Selamat! ${nickname} berhasil meraih Peringkat ${rank} di kelas. `;
            const originalNote = safeNotes[originalNoteKey] || '';
            const autoMsgPattern = new RegExp(`Selamat!.*Peringkat \\d+ di kelas\\.?\\s*`, 'i');
            const cleanNote = originalNote.replace(autoMsgPattern, '').trim();
            return {
                ...safeNotes,
                [originalNoteKey]: rankMessage + cleanNote
            };
        }
        return safeNotes;
    }, [notes, student, currentSemester, rank, shouldDisplayRank]);

    const reportSubjects = useMemo(() => {
        const result: any[] = [];
        const processedGroups = new Set<string>();
        const allActiveSubjects = subjects.filter(s => s.active);
        
        const groupConfigs: Record<string, (groupSubjects: any[]) => { subject: any; name: string } | null> = {
            'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
                const studentReligionLower = String(student.agama || '').trim().toLowerCase();
                if (!studentReligionLower) return null;

                let representative = null;
                if (studentReligionLower === 'kepercayaan') {
                    representative = groupSubjects.find(s => s.id === 'PAKTTMYME');
                } else {
                    representative = groupSubjects.find(s => {
                        const match = s.fullName.toLowerCase().match(/\(([^)]+)\)/);
                        return match && match[1].trim().toLowerCase() === studentReligionLower;
                    });
                }
                return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
            },
            'Seni Budaya': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects.find(s => s.fullName.includes("Seni Rupa")) || groupSubjects[0];
                return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
            },
            'Muatan Lokal': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
                if (chosen) {
                    const match = chosen.fullName.match(/\(([^)]+)\)/);
                    return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
                }
                return null;
            }
        };

        Object.keys(groupConfigs).forEach(groupName => {
            if (processedGroups.has(groupName)) return;
            const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
            if (groupSubjects.length > 0) {
                const config = groupConfigs[groupName](groupSubjects);
                if (config && config.subject) {
                     const grade = gradeData?.finalGrades?.[config.subject.id];
                     const description = generateDescription(student, config.subject, gradeData, learningObjectives, settings);
                     result.push({ id: config.subject.id, name: config.name, grade: grade, description: description });
                }
                processedGroups.add(groupName);
            }
        });
        
        allActiveSubjects.forEach(subject => {
            const isGrouped = Object.keys(groupConfigs).some(groupName => subject.fullName.startsWith(groupName));
            
            if (subject.id === 'PAKTTMYME') {
                const studentReligion = String(student.agama || '').trim().toLowerCase();
                if (studentReligion !== 'kepercayaan') return; 
            }

            if (!isGrouped) {
                const grade = gradeData?.finalGrades?.[subject.id];
                const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                result.push({ id: subject.id, name: subject.fullName, grade: grade, description: description });
            }
        });
        
        const sortOrder = [
            'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 
            'Ilmu Pengetahuan Alam dan Sosial', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 
            'Bahasa Inggris', 'Muatan Lokal'
        ];
        
        const findOriginalFullName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.fullName || '';

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
            const aIndex = sortOrder.findIndex(key => aSortKey.startsWith(key));
            const bIndex = sortOrder.findIndex(key => bSortKey.startsWith(key));
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });
        return result;
    }, [subjects, student, gradeData, learningObjectives, settings]);

    return {
        grades, setGrades, subjects, setStudents, setSettings, attendance, setAttendance,
        notes, studentExtracurriculars, setStudentExtracurriculars, extracurriculars,
        learningObjectives, cocurricularData, setCocurricularData,
        onUpdateDescription, onUpdateStudent, onUpdateSettings, onUpdateNote,
        onUpdateAttendance, onUpdateExtraDescription, onUpdateCocurricularManual,
        currentSemester, gradeData, shouldDisplayRank, notesForMeasurement, reportSubjects
    };
}
