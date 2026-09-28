import { useNilaiTableActionsLogic } from "./useNilaiTableActionsLogic";
import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { useGridSelection } from "../../hooks/useGridSelection";
import { useAllSlms } from "./useAllSlms";
import { useNilaiStore } from "../../stores/useNilaiStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
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

  const gradeNumber = useMemo(
    () => getGradeNumber(settings.nama_kelas),
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
    const gradeKey = `Kelas ${gradeNumber}`;
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

    const currentAppSemester = settings.semester || "Ganjil";

    allSlms.forEach((slm) => {
      if (activeSlmIds.includes(slm.id)) {
        const slmSemester = slm.semester || "Semua";
        if (slmSemester !== "Semua" && slmSemester !== currentAppSemester) {
          return;
        }

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
    if (!settings.semester || settings.semester === "Ganjil") {
      columnKeys.push("sts1");
    }
    if (settings.semester === "Genap") {
      columnKeys.push("sts2");
    }
    if (!settings.semester || settings.semester === "Ganjil") {
      columnKeys.push("sas1");
    }
    if (settings.semester === "Genap") {
      columnKeys.push("sas2");
    }
    return { slmHeaders, tpHeaders, columnKeys };
  }, [allSlms, activeSlmIds, settings.semester]);

  const {
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
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      const updates = [];
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        if (r < 0 || r >= relevantStudents.length) continue;
        const student = relevantStudents[r];
        const studentGrade = grades.find((g) => g.studentId === student.id);
        const detailedGrade = JSON.parse(
          JSON.stringify(
            studentGrade?.detailedGrades?.[subject.id] || {
              slm: [],
              sts1: null,
              sts2: null,
              sas1: null,
              sas2: null,
            },
          ),
        );
        if (!detailedGrade.slm) detailedGrade.slm = [];
        
        let hasChanged = false;
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (c < 0 || c >= columnKeys.length) continue;
          const key = columnKeys[c];
          if (key.startsWith("tp|")) {
            const [, slmId, tpIndexStr] = key.split("|");
            const tpIndex = parseInt(tpIndexStr, 10);
            let slm = detailedGrade.slm?.find((s) => s.id === slmId);
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
        if (hasChanged) {
          updates.push({
            studentId: student.id,
            subjectId: subject.id,
            newDetailedGrade: detailedGrade,
          });
        }
      }
      if (updates.length > 0) {
        onBulkUpdateGrades(updates);
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
          const studentGrade = grades.find((g) => g.studentId === student.id);
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
  }, [getSelectionBounds, relevantStudents, grades, columnKeys, mode, settings.predikats, settings.qualitativeGradingMap, subject.id, showToast]);

  const handleSaveSlmSettings = (newActiveIds) => {
    setActiveSlmIds(newActiveIds);
    if (onUpdateSlmVisibility) {
      onUpdateSlmVisibility(subject.id, newActiveIds);
    }
  };

  const handleSingleGradeChange = (
    studentId,
    value,
    type,
    slmId = null,
    tpIndex = null,
  ) => {
    const currentGrades = useNilaiStore.getState().grades;
    const studentGrade = currentGrades.find((g) => g.studentId === studentId);
    const detailedGrade = JSON.parse(
      JSON.stringify(
        studentGrade?.detailedGrades?.[subject.id] || {
          slm: [],
          sts1: null,
          sts2: null,
          sas1: null,
          sas2: null,
         },
      ),
    );
    if (!detailedGrade.slm) detailedGrade.slm = [];

    let finalValue = value === "" ? null : value;

    if (mode === "kuantitatif" && finalValue !== null && finalValue !== "") {
      const parsed = parseInt(finalValue, 10);
      finalValue = isNaN(parsed) ? null : parsed;
    }

    if (type === "tp") {
      let slmToUpdate = detailedGrade.slm?.find((s) => s.id === slmId);
      if (!slmToUpdate) {
        slmToUpdate = {
          id: slmId,
          name: allSlms.find((s) => s.id === slmId)?.name,
          scores: [],
        };
        detailedGrade.slm.push(slmToUpdate);
      }
      while (slmToUpdate.scores.length <= tpIndex) {
        slmToUpdate.scores.push(null);
      }
      slmToUpdate.scores[tpIndex] = finalValue;
    } else if (
      ["sts1", "sts2", "sas1", "sas2"].includes(type) ||
      type === "sts" ||
      type === "sas"
    ) {
      detailedGrade[type] = finalValue;
    }

    onBulkUpdateGrades([
      { studentId, subjectId: subject.id, newDetailedGrade: detailedGrade },
    ]);
  };

  const handleDescriptionChange = (studentId, type, value) => {
    const currentGrades = useNilaiStore.getState().grades;
    const studentGrade = currentGrades.find((g) => g.studentId === studentId);
    const detailedGrade = JSON.parse(
      JSON.stringify(
        studentGrade?.detailedGrades?.[subject.id] || {
          slm: [],
          sts1: null,
          sts2: null,
          sas1: null,
          sas2: null,
        },
      ),
    );
    if (!detailedGrade.slm) detailedGrade.slm = [];
    const student = students.find((s) => s.id === studentId);
    const generated = generateSubjectDescription(
      student,
      detailedGrade,
      objectivesForSubject,
      settings,
      settings.slmVisibility?.[subject.id],
    );

    if (!detailedGrade.descriptions) {
      detailedGrade.descriptions = {
        highest: generated.highest,
        lowest: generated.lowest,
      };
    } else {
      if (
        !detailedGrade.descriptions.highest ||
        !detailedGrade.descriptions.highest.trim()
      ) {
        detailedGrade.descriptions.highest = generated.highest;
      }
      if (
        !detailedGrade.descriptions.lowest ||
        !detailedGrade.descriptions.lowest.trim()
      ) {
        detailedGrade.descriptions.lowest = generated.lowest;
      }
    }

    detailedGrade.descriptions[type] = value;

    onBulkUpdateGrades([
      {
        studentId: studentId,
        subjectId: subject.id,
        newDetailedGrade: detailedGrade,
      },
    ]);
  };




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

    const newWeights = JSON.parse(JSON.stringify(currentWeights));

    if (weightType === "TP" && slmId !== null && tpIndex !== null) {
      if (!newWeights.TP) newWeights.TP = {};
      if (!newWeights.TP[slmId]) newWeights.TP[slmId] = {};
      newWeights.TP[slmId][tpIndex] = numValue;
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
    headerRowSpan
  };
};
