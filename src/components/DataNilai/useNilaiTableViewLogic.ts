import { useNilaiTableActionsLogic } from "./useNilaiTableActionsLogic";
import { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import { useGridSelection } from "../../hooks/useGridSelection";
import { useTableVirtualizer } from "../../hooks/useTableVirtualizer";
import { useAllSlms } from "./useAllSlms";
import { useNilaiStore } from "../../stores/useNilaiStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useCurriculumStore } from "../../stores/useCurriculumStore";
import {
  areDetailedGradesEqual,
  cloneDetailedGrade,
  GradeSnapshotChange,
  useNilaiHistoryStore,
  type CellPatchField,
} from "../../stores/useNilaiHistoryStore";
import {
  getGradeNumber,
  getNumericValue,
  getQualitativeCode,
  generateSubjectDescription
} from "../../utils/nilaiHelpers";

export const useNilaiTableViewLogic = (props) => {
  const {
    subject,
    students,
    grades,
    settings,
    learningObjectives,
    onBulkUpdateGrades,
    onUpdateGradeCalculation,
    mode,
    showToast,
    onUpdateSlmVisibility,
    predefinedCurriculum,
  } = props;

  const [isManageSlmModalOpen, setIsManageSlmModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });
  const [isCapaianPinned, setIsCapaianPinned] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("rkt_is_capaian_pinned");
        return saved === "true";
      }
    } catch {
      return false;
    }
    return false;
  });

  const handleToggleCapaianPinned = (val) => {
    setIsCapaianPinned(val);
    try {
      localStorage.setItem("rkt_is_capaian_pinned", String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const tableContainerRef = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const subjectHistory = useNilaiHistoryStore(
    useCallback((state) => state.historyBySubject[subject.id], [subject.id])
  );
  const canUndo = Boolean(subjectHistory && subjectHistory.past.length > 0);
  const canRedo = Boolean(subjectHistory && subjectHistory.future.length > 0);
  const undoLabel = canUndo
    ? subjectHistory!.past[subjectHistory!.past.length - 1]?.label
    : undefined;
  const redoLabel = canRedo
    ? subjectHistory!.future[subjectHistory!.future.length - 1]?.label
    : undefined;

  const resolvedSubjects = props.subjects || useSettingsStore.getState().subjects;

  const handleUndo = useCallback(() => {
    const entry = useNilaiHistoryStore.getState().popUndo(subject.id);
    if (!entry) return;

    const latestSettingsState = useSettingsStore.getState();
    const latestCurriculumState = useCurriculumStore.getState();
    useNilaiStore.getState().applyHistoryChanges(subject.id, entry.changes, "undo", {
      settings: latestSettingsState.settings || settings,
      learningObjectives: latestCurriculumState.learningObjectives || learningObjectives,
      predefinedCurriculum: latestCurriculumState.predefinedCurriculum || predefinedCurriculum,
      subjects: latestSettingsState.subjects || resolvedSubjects,
    });
    if (showToast) {
      showToast(`Urungkan: ${entry.label}`, "info");
    }
  }, [subject.id, settings, learningObjectives, predefinedCurriculum, resolvedSubjects, showToast]);

  const handleRedo = useCallback(() => {
    const entry = useNilaiHistoryStore.getState().popRedo(subject.id);
    if (!entry) return;

    const latestSettingsState = useSettingsStore.getState();
    const latestCurriculumState = useCurriculumStore.getState();
    useNilaiStore.getState().applyHistoryChanges(subject.id, entry.changes, "redo", {
      settings: latestSettingsState.settings || settings,
      learningObjectives: latestCurriculumState.learningObjectives || learningObjectives,
      predefinedCurriculum: latestCurriculumState.predefinedCurriculum || predefinedCurriculum,
      subjects: latestSettingsState.subjects || resolvedSubjects,
    });
    if (showToast) {
      showToast(`Ulangi: ${entry.label}`, "info");
    }
  }, [subject.id, settings, learningObjectives, predefinedCurriculum, resolvedSubjects, showToast]);

  const gradeNumber = useMemo(
    () => getGradeNumber(settings.nama_kelas) ?? 6,
    [settings.nama_kelas],
  );

  const slmTextRefs = useRef({});
  const [truncatedSlmIds, setTruncatedSlmIds] = useState({});

  const predefinedSlms = useMemo(() => {
    if (!predefinedCurriculum) return [];
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return predefinedCurriculum[curriculumKey] || [];
  }, [predefinedCurriculum, subject]);

  const calculationConfig = useMemo(
    () => settings.gradeCalculation?.[subject.id] || { method: "rata-rata" },
    [settings.gradeCalculation, subject.id],
  );
  
  const isWeighting = calculationConfig.method === "pembobotan";
  const weights = useMemo(
    () => calculationConfig.weights || {},
    [calculationConfig],
  );

  const objectivesForSubject = useMemo(() => {
    const gradeKey = `Kelas ${gradeNumber || 6}`;
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return (
      (learningObjectives &&
        learningObjectives[gradeKey] &&
        learningObjectives[gradeKey][curriculumKey]) ||
      []
    );
  }, [
    learningObjectives,
    gradeNumber,
    subject.curriculumKey,
    subject.fullName,
  ]);

  const allSlms = useAllSlms({
    predefinedSlms,
    subjectId: subject.id,
    objectivesForSubject,
    grades,
  });

  const [activeSlmIds, setActiveSlmIds] = useState(() => {
    const savedVisibility = settings.slmVisibility?.[subject.id];
    const allIds = allSlms.map((s) => s.id);

    if (savedVisibility && Array.isArray(savedVisibility)) {
      return savedVisibility.filter((id) => allIds.includes(id));
    }
    return allIds;
  });

  const prevAllSlmsIdsRef = useRef(allSlms.map((s) => s.id));

  useEffect(() => {
    const currentIds = allSlms.map((s) => s.id);
    const prevIds = prevAllSlmsIdsRef.current;
    const newIds = currentIds.filter((id) => !prevIds.includes(id));

    if (newIds.length > 0) {
      setActiveSlmIds((prev) => {
        const next = [...prev, ...newIds];
        if (onUpdateSlmVisibility) {
          setTimeout(() => {
            onUpdateSlmVisibility(subject.id, next);
          }, 0);
        }
        return next;
      });
    }
    prevAllSlmsIdsRef.current = currentIds;
  }, [allSlms, subject.id, onUpdateSlmVisibility]);

  const relevantStudents = useMemo(() => {
    const curriculumKey = subject.curriculumKey || subject.fullName;

    if (
      subject.id === "PAKTTMYME" ||
      curriculumKey.toLowerCase().includes("kepercayaan terhadap tuhan")
    ) {
      return students.filter(
        (s) =>
          String(s.agama || "")
            .trim()
            .toLowerCase() === "kepercayaan",
      );
    }

    if (curriculumKey.toLowerCase().startsWith("pendidikan agama")) {
      const religionMatch = curriculumKey.match(/\(([^)]+)\)/);
      if (religionMatch) {
        const religion = religionMatch[1].trim().toLowerCase();
        return students.filter(
          (s) => String(s.agama || "").toLowerCase() === religion,
        );
      }
    }

    return students;
  }, [students, subject.fullName, subject.curriculumKey, subject.id]);

  const { slmHeaders, tpHeaders, columnKeys } = useMemo(() => {
    const slmHeaders = [];
    const tpHeaders = [];
    const columnKeys = [];
    let tpCounter = 0;

    allSlms.forEach((slm) => {
      if (activeSlmIds.includes(slm.id)) {
        const colSpan = Math.max(1, slm.tps.length);
        slmHeaders.push({ id: slm.id, name: slm.name, colSpan: colSpan });
        slm.tps.forEach((tp, index) => {
          tpCounter++;
          const header = {
            slmId: slm.id,
            tpIndex: index,
            text: tp.text,
            displayIndex: tpCounter,
          };
          tpHeaders.push(header);
          columnKeys.push(`tp|${slm.id}|${index}`);
        });
        if (slm.tps.length === 0) {
          tpCounter++;
          const header = {
            slmId: slm.id,
            tpIndex: 0,
            text: "No TP defined",
            displayIndex: tpCounter,
          };
          tpHeaders.push(header);
          columnKeys.push(`tp|${slm.id}|0`);
        }
      }
    });
    columnKeys.push("sts", "sas");
    return { slmHeaders, tpHeaders, columnKeys };
  }, [allSlms, activeSlmIds]);

  const gradeByStudentIdMap = useMemo(() => {
    const map = new Map<string, any>();
    (grades || []).forEach((g) => {
      if (g?.studentId) map.set(String(g.studentId), g);
    });
    return map;
  }, [grades]);

  const getNilaiRowKey = useCallback(
    (idx: number) => relevantStudents[idx]?.id ?? idx,
    [relevantStudents],
  );

  const {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
    scrollToIndex,
  } = useTableVirtualizer({
    count: relevantStudents.length,
    scrollContainerRef,
    estimateRowHeight: 96,
    overscan: 8,
    getItemKey: getNilaiRowKey,
  });

  const {
    selectionBounds,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  } = useGridSelection({
    rowsCount: relevantStudents.length,
    colsCount: columnKeys.length,
    minColIndex: -2,
    containerClass: "mapel-table-container",
    onEnsureRowVisible: scrollToIndex,
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      const updates: any[] = [];
      const historyChanges: GradeSnapshotChange[] = [];
      const nilaiState = useNilaiStore.getState();

      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        if (r < 0 || r >= relevantStudents.length) continue;
        const student = relevantStudents[r];
        const studentGrade =
          nilaiState.gradesByStudentId[student.id] ||
          nilaiState.grades.find((g) => g.studentId === student.id);
        const beforeRaw = studentGrade?.detailedGrades?.[subject.id];
        const before = cloneDetailedGrade(beforeRaw);

        const detailedGrade = cloneDetailedGrade(beforeRaw) || {
          slm: [],
          sts: null,
          sas: null,
        };
        if (!detailedGrade.slm) detailedGrade.slm = [];
        
        let hasChanged = false;
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (c < 0 || c >= columnKeys.length) continue;
          const key = columnKeys[c];
          if (key.startsWith("tp|")) {
            const [, slmId, tpIndexStr] = key.split("|");
            const tpIndex = parseInt(tpIndexStr, 10);
            const slm = detailedGrade.slm?.find((s) => s.id === slmId);
            if (slm && slm.scores && tpIndex < slm.scores.length) {
              if (slm.scores[tpIndex] !== null) {
                slm.scores[tpIndex] = null;
                updatedCount++;
                hasChanged = true;
              }
            }
          } else if (["sts1", "sts2", "sas1", "sas2", "sts", "sas"].includes(key)) {
            if (detailedGrade[key] !== null) {
              detailedGrade[key] = null;
              updatedCount++;
              hasChanged = true;
            }
          }
        }
        if (hasChanged && !areDetailedGradesEqual(before, detailedGrade)) {
          updates.push({
            studentId: student.id,
            subjectId: subject.id,
            newDetailedGrade: detailedGrade,
          });
          historyChanges.push({
            studentId: student.id,
            before,
            after: detailedGrade,
          });
        }
      }
      if (updates.length > 0) {
        onBulkUpdateGrades(updates);
        useNilaiHistoryStore
          .getState()
          .recordHistory(subject.id, `Hapus ${updatedCount} nilai`, historyChanges);
        if (showToast) {
          showToast(`${updatedCount} nilai berhasil dihapus.`, "success");
        }
      }
    }
  });

  useEffect(() => {
    const handleCopyGlobal = (e) => {
      const bounds = getSelectionBounds();
      if (!bounds) return;

      if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.tagName === "SELECT")
        ) {
          return;
        }
      }

      const isGridActive =
        document.activeElement?.tagName === "BODY" ||
        document.querySelector(".mapel-table-container")?.contains(document.activeElement);
      if (!isGridActive) return;

      let tsv = "";
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        let rowData = [];
        const student = relevantStudents[r];
        if (student) {
          const studentGrade = gradeByStudentIdMap.get(String(student.id));
          const detailedGrade = studentGrade?.detailedGrades?.[subject.id] || {};
          for (let c = bounds.minC; c <= bounds.maxC; c++) {
            if (c < 0 || c >= columnKeys.length) continue;
            const key = columnKeys[c];
            if (key.startsWith("tp|")) {
              const [, slmId, tpIndexStr] = key.split("|");
              const tpIndex = parseInt(tpIndexStr, 10);
              const slm = detailedGrade.slm?.find((s) => s.id === slmId);
              const value = slm?.scores?.[tpIndex] ?? null;
              
              if (mode === "kualitatif") {
                const qualitativeCode = getQualitativeCode(value, settings.predikats);
                rowData.push(qualitativeCode ?? "");
              } else {
                const numericVal = getNumericValue(value, settings.qualitativeGradingMap) ?? "";
                rowData.push(numericVal);
              }
            } else if (["sts1", "sts2", "sas1", "sas2", "sts", "sas"].includes(key)) {
              const value = detailedGrade[key] ?? null;
              if (mode === "kualitatif") {
                const qualitativeCode = getQualitativeCode(value, settings.predikats);
                rowData.push(qualitativeCode ?? "");
              } else {
                const numericVal = getNumericValue(value, settings.qualitativeGradingMap) ?? "";
                rowData.push(numericVal);
              }
            }
          }
        }
        tsv += rowData.join("\t") + "\n";
      }

      if (tsv) {
        e.preventDefault();
        e.clipboardData.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, relevantStudents, gradeByStudentIdMap, columnKeys, mode, settings.predikats, settings.qualitativeGradingMap, subject.id, showToast]);

  const handleSaveSlmSettings = (newActiveIds) => {
    setActiveSlmIds(newActiveIds);
    if (onUpdateSlmVisibility) {
      onUpdateSlmVisibility(subject.id, newActiveIds);
    }
  };

  const handleSingleGradeChange = useCallback((
    studentId: string,
    value: any,
    type: string,
    slmId: string | null = null,
    tpIndex: number | null = null,
  ) => {
    const nilaiState = useNilaiStore.getState();
    const studentGrade =
      nilaiState.gradesByStudentId[studentId] ||
      nilaiState.grades.find((g) => g.studentId === studentId);
    const beforeRaw = studentGrade?.detailedGrades?.[subject.id];

    let finalValue: any = value === "" ? null : value;

    if (mode === "kuantitatif" && finalValue !== null && finalValue !== "") {
      const parsed = parseInt(finalValue, 10);
      finalValue = isNaN(parsed) ? null : parsed;
    }

    let prevValue: any = null;
    let resolvedSlmName: string | undefined;

    if (type === "tp" && slmId !== null && tpIndex !== null) {
      const existingSlm = beforeRaw?.slm?.find((s: any) => s.id === slmId);
      prevValue = existingSlm?.scores?.[tpIndex] ?? null;
      resolvedSlmName = existingSlm?.name || allSlms.find((s: any) => s.id === slmId)?.name;
    } else if (
      ["sts1", "sts2", "sas1", "sas2", "sts", "sas"].includes(type)
    ) {
      prevValue = beforeRaw?.[type] ?? null;
    } else {
      return;
    }

    if ((prevValue ?? null) === (finalValue ?? null)) {
      return;
    }

    const latestSettingsState = useSettingsStore.getState();
    const latestCurriculumState = useCurriculumStore.getState();

    nilaiState.updateSingleGrade(
      studentId,
      subject.id,
      finalValue,
      type,
      slmId ?? undefined,
      tpIndex ?? undefined,
      resolvedSlmName,
      {
        settings: latestSettingsState.settings || settings,
        learningObjectives: latestCurriculumState.learningObjectives || learningObjectives,
        predefinedCurriculum: latestCurriculumState.predefinedCurriculum || predefinedCurriculum,
        subjects: latestSettingsState.subjects || resolvedSubjects,
      }
    );

    useNilaiHistoryStore.getState().recordHistory(
      subject.id,
      "Ubah nilai",
      [
        {
          kind: "cell",
          studentId,
          field: type as CellPatchField,
          slmId: slmId ?? undefined,
          slmName: resolvedSlmName,
          tpIndex: tpIndex ?? undefined,
          prevValue,
          nextValue: finalValue,
        },
      ],
    );
  }, [subject.id, mode, allSlms, settings, learningObjectives, predefinedCurriculum, resolvedSubjects]);

  const handleDescriptionChange = useCallback((studentId: string, type: 'highest' | 'lowest', value: string) => {
    const nilaiState = useNilaiStore.getState();
    const studentGrade =
      nilaiState.gradesByStudentId[studentId] ||
      nilaiState.grades.find((g) => g.studentId === studentId);
    const beforeRaw = studentGrade?.detailedGrades?.[subject.id];
    const existingDesc = beforeRaw?.descriptions;
    const prevValue = existingDesc?.[type] ?? "";

    if ((prevValue ?? "") === (value ?? "")) {
      return;
    }

    let fallbackDescriptions: { highest?: string; lowest?: string } | undefined;
    const needsHighest = !existingDesc?.highest || !String(existingDesc.highest).trim();
    const needsLowest = !existingDesc?.lowest || !String(existingDesc.lowest).trim();

    if (needsHighest || needsLowest) {
      const student = students.find((s: any) => s.id === studentId);
      const generated = generateSubjectDescription(
        student,
        beforeRaw || { slm: [], sts: null, sas: null },
        objectivesForSubject,
        settings,
        settings.slmVisibility?.[subject.id],
      );
      fallbackDescriptions = {
        highest: generated.highest,
        lowest: generated.lowest,
      };
    }

    const otherType: 'highest' | 'lowest' = type === 'highest' ? 'lowest' : 'highest';

    nilaiState.updateSingleDescription(
      studentId,
      subject.id,
      type,
      value,
      fallbackDescriptions,
    );

    useNilaiHistoryStore.getState().recordHistory(
      subject.id,
      "Ubah deskripsi",
      [
        {
          kind: "cell",
          studentId,
          field: "desc",
          descType: type,
          prevValue,
          nextValue: value,
          prevDescriptionsExisted: Boolean(existingDesc),
          baselineOtherDescType: !existingDesc ? otherType : undefined,
          baselineOtherDescValue: !existingDesc ? (fallbackDescriptions?.[otherType] ?? "") : undefined,
        },
      ],
      `desc:${studentId}:${type}`,
    );
  }, [subject.id, students, objectivesForSubject, settings]);

  const handleWeightChange = (
    weightType,
    value,
    slmId = null,
    tpIndex = null,
  ) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > 100))
      return;

    const currentSettings = useSettingsStore.getState().settings;
    const currentCalcConfig = currentSettings.gradeCalculation?.[subject.id] || { method: "rata-rata" };
    const currentWeights = currentCalcConfig.weights || {};

    const newWeights: any = { ...currentWeights };

    if (weightType === "TP" && slmId !== null && tpIndex !== null) {
      const prevTp = currentWeights.TP || {};
      newWeights.TP = {
        ...prevTp,
        [slmId]: {
          ...(prevTp[slmId] || {}),
          [tpIndex]: numValue,
        },
      };
    } else if (weightType === "STS" || weightType === "SAS") {
      newWeights[weightType] = numValue;
    }

    onUpdateGradeCalculation(subject.id, {
      ...calculationConfig,
      weights: newWeights,
    });
  };


  const { 
    handleBulkGenerateDescriptions, 
    handleAutoRegression, 
    handleAutoRegressionNonTP, 
    handlePaste, 
  } = useNilaiTableActionsLogic({ 
    relevantStudents, 
    grades, 
    subject, 
    settings, 
    allSlms, 
    objectivesForSubject, 
    onBulkUpdateGrades, 
    showToast, 
    columnKeys, 
  });

  const showTooltip = (e, text) => {
    if (!tableContainerRef.current) return;
    const targetRect = e.target.getBoundingClientRect();
    const containerRect = tableContainerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      content: text,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.bottom - containerRect.top + 8,
    });
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const headerRowSpan = isWeighting ? 3 : 2;

  useLayoutEffect(() => {
    const newTruncatedSlmIds = {};
    slmHeaders.forEach((h) => {
      const el = slmTextRefs.current[h.id];
      if (el) {
        newTruncatedSlmIds[h.id] = el.scrollHeight > el.clientHeight;
      }
    });
    if (
      Object.keys(newTruncatedSlmIds).length !==
        Object.keys(truncatedSlmIds).length ||
      Object.keys(newTruncatedSlmIds).some(
        (key) => newTruncatedSlmIds[key] !== truncatedSlmIds[key],
      )
    ) {
      setTruncatedSlmIds(newTruncatedSlmIds);
    }
  }, [slmHeaders, truncatedSlmIds]);

  useEffect(() => {
    const handleUndoRedoKeyDown = (e: KeyboardEvent) => {
      if (isManageSlmModalOpen || isSettingsModalOpen) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;

      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = (key === "y" && !e.shiftKey) || (key === "z" && e.shiftKey);
      if (!isUndo && !isRedo) return;

      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isGridContext =
        !activeEl ||
        activeEl === document.body ||
        Boolean(tableContainerRef.current?.contains(activeEl));
      if (!isGridContext) return;

      if (activeEl && activeEl.tagName === "INPUT" && isUndo) {
        const inputEl = activeEl as HTMLInputElement;
        const committedValue = inputEl.dataset?.committedValue;
        if (committedValue !== undefined && inputEl.value !== committedValue) {
          return;
        }
      }

      e.preventDefault();
      if (isUndo) {
        handleUndo();
      } else {
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleUndoRedoKeyDown);
    return () => window.removeEventListener("keydown", handleUndoRedoKeyDown);
  }, [isManageSlmModalOpen, isSettingsModalOpen, handleUndo, handleRedo]);

  return {
    isManageSlmModalOpen,
    setIsManageSlmModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    tooltip,
    isCapaianPinned,
    handleToggleCapaianPinned,
    tableContainerRef,
    gradeNumber,
    slmTextRefs,
    truncatedSlmIds,
    predefinedSlms,
    calculationConfig,
    isWeighting,
    weights,
    objectivesForSubject,
    allSlms,
    activeSlmIds,
    relevantStudents,
    slmHeaders,
    tpHeaders,
    columnKeys,
    selectionBounds,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleSaveSlmSettings,
    handleSingleGradeChange,
    handleDescriptionChange,
    handleBulkGenerateDescriptions,
    handleAutoRegression,
    handleAutoRegressionNonTP,
    handleWeightChange,
    handlePaste,
    showTooltip,
    hideTooltip,
    headerRowSpan,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    handleUndo,
    handleRedo,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  };
};
