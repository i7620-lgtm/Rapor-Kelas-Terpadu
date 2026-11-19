import { create } from "zustand";

export const MAX_NILAI_HISTORY = 50;
export const COALESCE_WINDOW_MS = 900;

export interface GradeBulkSnapshotChange {
  kind?: "bulk";
  studentId: string;
  before: any;
  after: any;
}

export type CellPatchField =
  | "tp"
  | "sts"
  | "sas"
  | "sts1"
  | "sts2"
  | "sas1"
  | "sas2"
  | "desc";

export interface GradeCellPatchChange {
  kind: "cell";
  studentId: string;
  field: CellPatchField;
  slmId?: string;
  slmName?: string;
  tpIndex?: number;
  descType?: "highest" | "lowest";
  prevValue: any;
  nextValue: any;
  prevDescriptionsExisted?: boolean;
  baselineOtherDescType?: "highest" | "lowest";
  baselineOtherDescValue?: string;
}

export type GradeSnapshotChange = GradeBulkSnapshotChange | GradeCellPatchChange;

export interface NilaiHistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  coalesceKey?: string;
  changes: GradeSnapshotChange[];
}

interface SubjectHistoryStacks {
  past: NilaiHistoryEntry[];
  future: NilaiHistoryEntry[];
}

interface NilaiHistoryState {
  historyBySubject: Record<string, SubjectHistoryStacks>;
  recordHistory: (
    subjectId: string,
    label: string,
    changes: GradeSnapshotChange[],
    coalesceKey?: string
  ) => void;
  popUndo: (subjectId: string) => NilaiHistoryEntry | null;
  popRedo: (subjectId: string) => NilaiHistoryEntry | null;
  clearSubjectHistory: (subjectId: string) => void;
  clearAllHistory: () => void;
  pruneStudentsFromHistory: (validStudentIds: Set<string>) => void;
}

/**
 * Fast structural clone for a student's single subject DetailedGrade object.
 * Replaces expensive JSON.parse(JSON.stringify(...)) across grid & modal edits.
 */
export const cloneDetailedGrade = (detailedGrade: any): any => {
  if (detailedGrade === undefined || detailedGrade === null) {
    return undefined;
  }

  const copy: Record<string, any> = { ...detailedGrade };

  if (Array.isArray(detailedGrade.slm)) {
    copy.slm = detailedGrade.slm.map((s: any) =>
      s && typeof s === "object"
        ? {
            ...s,
            scores: Array.isArray(s.scores) ? [...s.scores] : [],
          }
        : s
    );
  }

  if (detailedGrade.descriptions && typeof detailedGrade.descriptions === "object") {
    copy.descriptions = { ...detailedGrade.descriptions };
  }

  if (detailedGrade.descriptions_Genap && typeof detailedGrade.descriptions_Genap === "object") {
    copy.descriptions_Genap = { ...detailedGrade.descriptions_Genap };
  }

  return copy;
};

/**
 * Fast structural equality check for a single subject's DetailedGrade object.
 * Avoids double JSON.stringify serialization on every cell or bulk operation.
 */
export const areDetailedGradesEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (typeof a !== "object" || typeof b !== "object") return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    const valA = a[key];
    const valB = b[key];
    if (valA === valB) continue;

    if (key === "slm") {
      if (!Array.isArray(valA) || !Array.isArray(valB) || valA.length !== valB.length) {
        return false;
      }
      for (let i = 0; i < valA.length; i++) {
        const sA = valA[i];
        const sB = valB[i];
        if (sA === sB) continue;
        if (!sA || !sB || sA.id !== sB.id || sA.name !== sB.name) return false;
        const scoresA = Array.isArray(sA.scores) ? sA.scores : [];
        const scoresB = Array.isArray(sB.scores) ? sB.scores : [];
        if (scoresA.length !== scoresB.length) return false;
        for (let j = 0; j < scoresA.length; j++) {
          if ((scoresA[j] ?? null) !== (scoresB[j] ?? null)) return false;
        }
      }
      continue;
    }

    if (key === "descriptions" || key === "descriptions_Genap") {
      if (!valA && !valB) continue;
      if (!valA || !valB) return false;
      if ((valA.highest ?? "") !== (valB.highest ?? "")) return false;
      if ((valA.lowest ?? "") !== (valB.lowest ?? "")) return false;
      continue;
    }

    if (valA !== valB) return false;
  }

  return true;
};

const isCellChangeNoop = (c: GradeCellPatchChange): boolean => {
  if (c.field === "desc") {
    return (c.prevValue ?? "") === (c.nextValue ?? "");
  }
  return (c.prevValue ?? null) === (c.nextValue ?? null);
};

const isChangeNoop = (c: GradeSnapshotChange): boolean => {
  if (c.kind === "cell") {
    return isCellChangeNoop(c);
  }
  return areDetailedGradesEqual(c.before, c.after);
};

const getCoalesceMergeKey = (c: GradeSnapshotChange): string => {
  if (c.kind === "cell") {
    return `cell|${c.studentId}|${c.field}|${c.slmId ?? ""}|${c.tpIndex ?? ""}|${c.descType ?? ""}`;
  }
  return `bulk|${c.studentId}`;
};

const createEntryId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useNilaiHistoryStore = create<NilaiHistoryState>((set, get) => ({
  historyBySubject: {},

  recordHistory: (subjectId, label, rawChanges, coalesceKey) => {
    if (!subjectId || !Array.isArray(rawChanges) || rawChanges.length === 0) return;

    const validChanges: GradeSnapshotChange[] = [];
    for (const change of rawChanges) {
      if (!change?.studentId) continue;

      if (change.kind === "cell") {
        if (!isCellChangeNoop(change)) {
          validChanges.push({
            ...change,
            studentId: String(change.studentId),
          });
        }
      } else {
        const beforeClone = cloneDetailedGrade(change.before);
        const afterClone = cloneDetailedGrade(change.after);
        if (!areDetailedGradesEqual(beforeClone, afterClone)) {
          validChanges.push({
            kind: "bulk",
            studentId: String(change.studentId),
            before: beforeClone,
            after: afterClone,
          });
        }
      }
    }

    if (validChanges.length === 0) return;

    const now = Date.now();

    set((state) => {
      const current = state.historyBySubject[subjectId] || { past: [], future: [] };
      const nextPast = [...current.past];

      if (coalesceKey && nextPast.length > 0) {
        const top = nextPast[nextPast.length - 1];
        if (
          top.coalesceKey === coalesceKey &&
          now - top.timestamp <= COALESCE_WINDOW_MS
        ) {
          const mergedMap = new Map<string, GradeSnapshotChange>();
          for (const c of top.changes) {
            mergedMap.set(getCoalesceMergeKey(c), c);
          }
          for (const c of validChanges) {
            const mKey = getCoalesceMergeKey(c);
            const existing = mergedMap.get(mKey);
            if (existing) {
              if (existing.kind === "cell" && c.kind === "cell") {
                mergedMap.set(mKey, {
                  ...existing,
                  nextValue: c.nextValue,
                });
              } else if (existing.kind !== "cell" && c.kind !== "cell") {
                mergedMap.set(mKey, {
                  kind: "bulk",
                  studentId: c.studentId,
                  before: existing.before,
                  after: c.after,
                });
              } else {
                mergedMap.set(`${mKey}#${mergedMap.size}`, c);
              }
            } else {
              mergedMap.set(mKey, c);
            }
          }

          const mergedChanges = Array.from(mergedMap.values()).filter(
            (c) => !isChangeNoop(c)
          );

          if (mergedChanges.length === 0) {
            nextPast.pop();
          } else {
            nextPast[nextPast.length - 1] = {
              ...top,
              label,
              timestamp: now,
              changes: mergedChanges,
            };
          }

          return {
            historyBySubject: {
              ...state.historyBySubject,
              [subjectId]: {
                past: nextPast,
                future: [],
              },
            },
          };
        }
      }

      nextPast.push({
        id: createEntryId(),
        label,
        timestamp: now,
        coalesceKey,
        changes: validChanges,
      });

      if (nextPast.length > MAX_NILAI_HISTORY) {
        nextPast.splice(0, nextPast.length - MAX_NILAI_HISTORY);
      }

      return {
        historyBySubject: {
          ...state.historyBySubject,
          [subjectId]: {
            past: nextPast,
            future: [],
          },
        },
      };
    });
  },

  popUndo: (subjectId) => {
    const current = get().historyBySubject[subjectId];
    if (!current || current.past.length === 0) return null;

    const entry = current.past[current.past.length - 1];
    set((state) => {
      const latest = state.historyBySubject[subjectId];
      if (!latest || latest.past.length === 0) return state;

      const popped = latest.past[latest.past.length - 1];
      const nextPast = latest.past.slice(0, -1);
      const nextFuture = [...latest.future, popped];
      if (nextFuture.length > MAX_NILAI_HISTORY) {
        nextFuture.splice(0, nextFuture.length - MAX_NILAI_HISTORY);
      }

      return {
        historyBySubject: {
          ...state.historyBySubject,
          [subjectId]: {
            past: nextPast,
            future: nextFuture,
          },
        },
      };
    });

    return entry;
  },

  popRedo: (subjectId) => {
    const current = get().historyBySubject[subjectId];
    if (!current || current.future.length === 0) return null;

    const entry = current.future[current.future.length - 1];
    set((state) => {
      const latest = state.historyBySubject[subjectId];
      if (!latest || latest.future.length === 0) return state;

      const popped = latest.future[latest.future.length - 1];
      const nextFuture = latest.future.slice(0, -1);
      const nextPast = [...latest.past, popped];
      if (nextPast.length > MAX_NILAI_HISTORY) {
        nextPast.splice(0, nextPast.length - MAX_NILAI_HISTORY);
      }

      return {
        historyBySubject: {
          ...state.historyBySubject,
          [subjectId]: {
            past: nextPast,
            future: nextFuture,
          },
        },
      };
    });

    return entry;
  },

  clearSubjectHistory: (subjectId) => {
    if (!subjectId) return;
    set((state) => {
      if (!state.historyBySubject[subjectId]) return state;
      const next = { ...state.historyBySubject };
      delete next[subjectId];
      return { historyBySubject: next };
    });
  },

  clearAllHistory: () => {
    set((state) => {
      if (Object.keys(state.historyBySubject).length === 0) return state;
      return { historyBySubject: {} };
    });
  },

  pruneStudentsFromHistory: (validStudentIds) => {
    set((state) => {
      const subjectKeys = Object.keys(state.historyBySubject);
      if (subjectKeys.length === 0) return state;

      let changed = false;
      const nextHistoryBySubject: Record<string, SubjectHistoryStacks> = {};

      const pruneStack = (entries: NilaiHistoryEntry[]) => {
        const result: NilaiHistoryEntry[] = [];
        for (const entry of entries) {
          const filtered = entry.changes.filter((c) => validStudentIds.has(c.studentId));
          if (filtered.length !== entry.changes.length) {
            changed = true;
          }
          if (filtered.length > 0) {
            result.push(
              filtered.length === entry.changes.length
                ? entry
                : { ...entry, changes: filtered }
            );
          }
        }
        return result;
      };

      for (const sid of subjectKeys) {
        const stacks = state.historyBySubject[sid];
        const nextPast = pruneStack(stacks.past);
        const nextFuture = pruneStack(stacks.future);
        if (nextPast.length > 0 || nextFuture.length > 0) {
          nextHistoryBySubject[sid] = { past: nextPast, future: nextFuture };
        }
      }

      if (!changed) return state;
      return { historyBySubject: nextHistoryBySubject };
    });
  },
}));
