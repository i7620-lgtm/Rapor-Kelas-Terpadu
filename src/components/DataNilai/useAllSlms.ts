import { useMemo } from "react";

interface TpItem {
  text: string;
  isEdited: boolean;
  semester?: string;
}

interface SlmItem {
  id: string;
  name: string;
  tps: TpItem[];
  semester?: string;
}

interface PredefinedSlm {
  slm: string;
  tp: string[];
}

interface UserObjective {
  slmId: string;
  text: string;
  isEdited?: boolean;
  semester?: string;
}

interface GradeItem {
  detailedGrades?: Record<string, {
    slm?: Array<{
      id: string;
      name?: string;
      scores?: any[];
    }>;
  }>;
}

interface UseAllSlmsParams {
  predefinedSlms: PredefinedSlm[];
  subjectId: string;
  objectivesForSubject: UserObjective[];
  grades: GradeItem[];
}

export function useAllSlms({
  predefinedSlms,
  subjectId,
  objectivesForSubject,
  grades,
}: UseAllSlmsParams): SlmItem[] {
  return useMemo(() => {
    const slmMap = new Map<string, SlmItem>();

    // Step 1: Populate with predefined SLMs
    const preHalf = Math.ceil(predefinedSlms.length / 2);
    predefinedSlms.forEach((pSlm, index) => {
      const slmId = `slm_predefined_${subjectId}_${index}`;
      const defaultSemester = index < preHalf ? "Ganjil" : "Genap";
      slmMap.set(slmId, {
        id: slmId,
        name: pSlm.slm,
        tps: pSlm.tp.map((tpText) => ({ text: tpText, isEdited: false })),
        semester: defaultSemester,
      });
    });

    // Step 2: Group user objectives by SLM ID
    const userObjectivesBySlm = objectivesForSubject.reduce<Record<string, TpItem[]>>((acc, tp) => {
      if (!acc[tp.slmId]) {
        acc[tp.slmId] = [];
      }
      acc[tp.slmId].push({
        text: tp.text,
        isEdited: tp.isEdited === true,
        semester: tp.semester || "Semua",
      });
      return acc;
    }, {});

    // Step 3: Merge user objectives. This adds custom SLMs and overrides TPs of predefined ones.
    Object.entries(userObjectivesBySlm).forEach(([slmId, tps]) => {
      const semester = tps[0]?.semester || "Semua";
      if (slmMap.has(slmId)) {
        // User has edited the TPs for a predefined SLM. Override them.
        const existingSlm = slmMap.get(slmId)!;
        slmMap.set(slmId, { ...existingSlm, tps, semester });
      } else {
        // This is a completely custom SLM. Add it to the map.
        const slmNameFromGrades =
          grades.length > 0
            ? (grades[0].detailedGrades?.[subjectId]?.slm || []).find(
                (s) => s.id === slmId,
              )?.name
            : null;
        slmMap.set(slmId, {
          id: slmId,
          name: slmNameFromGrades || "Lingkup Materi Kustom",
          tps,
          semester,
        });
      }
    });

    // Step 4: Ensure all SLMs from grades data exist and use their names as the source of truth.
    grades.forEach((grade) => {
      (grade.detailedGrades?.[subjectId]?.slm || []).forEach((gradeSlm) => {
        if (gradeSlm && gradeSlm.id) {
          if (!slmMap.has(gradeSlm.id)) {
            // This SLM exists in grade data but nowhere else. Add it.
            slmMap.set(gradeSlm.id, {
              id: gradeSlm.id,
              name: gradeSlm.name || "Lingkup Materi Lama",
              tps: (gradeSlm.scores || []).map(() => ({
                text: "TP dari data lama",
                isEdited: true,
              })),
            });
          } else {
            // Update the name in the map with the one from grades, as it's the user-edited version.
            const existingSlm = slmMap.get(gradeSlm.id)!;
            if (gradeSlm.name && gradeSlm.name !== existingSlm.name) {
              slmMap.set(gradeSlm.id, { ...existingSlm, name: gradeSlm.name });
            }
          }
        }
      });
    });

    return Array.from(slmMap.values());
  }, [objectivesForSubject, grades, subjectId, predefinedSlms]);
}
