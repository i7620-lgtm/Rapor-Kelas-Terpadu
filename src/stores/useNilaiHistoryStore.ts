import { create } from "zustand";

export const MAX_NILAI_HISTORY = 50;
export const COALESCE_WINDOW_MS = 900;

export interface GradeSnapshotChange {
  studentId: string;
  before: any;
  after: any;
}

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

export const cloneDetailedGrade = (detailedGrade: any): any => {
  if (detailedGrade === undefined || detailedGrade === null) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(detailedGrade));
};

export const areDetailedGradesEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
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
      const beforeClone = cloneDetailedGrade(change.before);
      const afterClone = cloneDetailedGrade(change.after);
      if (!areDetailedGradesEqual(beforeClone, afterClone)) {
        validChanges.push({
          studentId: String(change.studentId),
          before: beforeClone,
          after: afterClone,
        });
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
            mergedMap.set(c.studentId, c);
          }
          for (const c of validChanges) {
            const existing = mergedMap.get(c.studentId);
            if (existing) {
              mergedMap.set(c.studentId, {
                studentId: c.studentId,
                before: existing.before,
                after: c.after,
              });
            } else {
              mergedMap.set(c.studentId, c);
            }
          }

          const mergedChanges = Array.from(mergedMap.values()).filter(
            (c) => !areDetailedGradesEqual(c.before, c.after)
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
