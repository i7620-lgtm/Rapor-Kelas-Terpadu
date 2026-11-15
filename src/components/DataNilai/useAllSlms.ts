import { useMemo, useRef } from "react";

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

const areSlmListsStructurallyEqual = (a: SlmItem[], b: SlmItem[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const slmA = a[i];
    const slmB = b[i];
    if (slmA.id !== slmB.id || slmA.name !== slmB.name) return false;
    if (slmA.tps.length !== slmB.tps.length) return false;
    for (let j = 0; j < slmA.tps.length; j++) {
      if (
        slmA.tps[j].text !== slmB.tps[j].text ||
        slmA.tps[j].isEdited !== slmB.tps[j].isEdited
      ) {
        return false;
      }
    }
  }
  return true;
};

export function useAllSlms({
  predefinedSlms,
  subjectId,
  objectivesForSubject,
  grades,
}: UseAllSlmsParams): SlmItem[] {
  const prevSlmsRef = useRef<SlmItem[]>([]);

  return useMemo(() => {
    const slmMap = new Map<string, SlmItem>();

    // Step 1: Populate with predefined SLMs
    predefinedSlms.forEach((pSlm, index) => {
      const slmId = `slm_predefined_${subjectId}_${index}`;
      slmMap.set(slmId, {
        id: slmId,
        name: pSlm.slm,
        tps: pSlm.tp.map((tpText) => ({ text: tpText, isEdited: false })),
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
      });
      return acc;
    }, {});

    // Step 3: Merge user objectives. This adds custom SLMs and overrides TPs of predefined ones.
    Object.entries(userObjectivesBySlm).forEach(([slmId, tps]) => {
      if (slmMap.has(slmId)) {
        // User has edited the TPs for a predefined SLM. Override them.
        const existingSlm = slmMap.get(slmId)!;
        slmMap.set(slmId, { ...existingSlm, tps });
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

    const nextList = Array.from(slmMap.values());
    if (areSlmListsStructurallyEqual(prevSlmsRef.current, nextList)) {
      return prevSlmsRef.current;
    }
    prevSlmsRef.current = nextList;
    return nextList;
  }, [objectivesForSubject, grades, subjectId, predefinedSlms]);
}
