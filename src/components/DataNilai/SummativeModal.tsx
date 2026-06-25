import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";
import { useGridSelection } from "../../hooks/useGridSelection";
import {
  getNumericValue,
  getQualitativeCode,
  splitRowIntoColumns,
  generateSubjectDescription
} from "../../utils/nilaiHelpers";
import { getClipboardText } from "../../utils/clipboard";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";
import { TPSelectionModal } from "./TPSelectionModal";
import { SummativeTableHeader } from "./SummativeTableHeader";
import { SummativeTableRow } from "./SummativeTableRow";

export const SummativeModal = ({
  isOpen,
  onClose,
  modalData,
  students,
  grades,
  subject,
  objectives,
  onUpdateObjectives,
  onBulkUpdateGrades,
  gradeNumber,
  settings,
  onUpdateGradeCalculation,
  showToast,
  predefinedCurriculum,
}) => {
  if (!isOpen) return null;

  const { type, item } = modalData;
  const isSLM = type === "slm";
  const calculationConfig = useMemo(
    () => settings.gradeCalculation?.[subject.id] || { method: "rata-rata" },
    [settings.gradeCalculation, subject.id],
  );
  const isWeighting = calculationConfig.method === "pembobotan";
  const weights = useMemo(
    () => calculationConfig.weights || {},
    [calculationConfig],
  );
  const { qualitativeGradingMap } = settings;

  const objectivesForSubject = useMemo(() => {
    const gradeKey = `Kelas ${gradeNumber}`;
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return objectives[gradeKey]?.[curriculumKey] || [];
  }, [objectives, gradeNumber, subject]);

  const currentObjectives = useMemo(() => {
    if (isSLM) {
      const otherObjectives = objectivesForSubject.filter(
        (o) => o.slmId !== item?.id,
      );
      const thisSlmObjectives = localObjectives.map((tp) => ({
        slmId: item?.id,
        text: tp.text,
        isEdited: tp.isEdited,
      }));
      return [...otherObjectives, ...thisSlmObjectives];
    }
    return objectivesForSubject;
  }, [isSLM, item?.id, objectivesForSubject, localObjectives]);

  const [slmName, setSlmName] = useState(isSLM ? item?.name || "" : "");
  const [localObjectives, setLocalObjectives] = useState([]);
  const [isTpSelectionModalOpen, setIsTpSelectionModalOpen] = useState(false);

  const [localGrades, setLocalGrades] = useState({});
  const [activeInput, setActiveInput] = useState({});

  const relevantStudents = useMemo(() => {
    const curriculumKey = subject.curriculumKey || subject.fullName;

    // Case 1: Kepercayaan specifically
    // The ID is defined in App.js as PAKTTMYME. Check ID OR fullName for robustness
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

    // Case 2: Standard Religions (Islam, Kristen, etc.)
    if (curriculumKey.toLowerCase().startsWith("pendidikan agama")) {
      const religionMatch = curriculumKey.match(/\(([^)]+)\)/);
      if (religionMatch) {
        const religion = religionMatch[1].trim().toLowerCase();
        return students.filter(
          (s) => String(s.agama || "").toLowerCase() === religion,
        );
      }
    }

    // Case 3: General subjects
    return students;
  }, [students, subject]);

  const {
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  } = useGridSelection({
    rowsCount: relevantStudents.length,
    colsCount: isSLM ? localObjectives.length * 2 : 1,
    minColIndex: -2,
    containerClass: "nilai-table-container",
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      setLocalGrades((prevGrades) => {
        const newGrades = JSON.parse(JSON.stringify(prevGrades));
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
          for (let c = bounds.minC; c <= bounds.maxC; c++) {
            if (r >= 0 && c >= 0) {
              const student = relevantStudents[r];
              if (student) {
                const studentGrade = newGrades[student.id];
                if (studentGrade) {
                  if (isSLM) {
                    let slm = studentGrade.slm?.find((s) => s.id === item.id);
                    const tpIndex = Math.floor(c / 2);
                    if (slm && slm.scores && tpIndex < slm.scores.length) {
                      if (slm.scores[tpIndex] !== null) {
                        slm.scores[tpIndex] = null;
                        updatedCount++;
                      }
                    }
                  } else {
                    if (studentGrade[type] !== null) {
                      studentGrade[type] = null;
                      updatedCount++;
                    }
                  }
                }
              }
            }
          }
        }
        return newGrades;
      });

      setActiveInput((prev) => {
        const newState = { ...prev };
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
          for (let c = bounds.minC; c <= bounds.maxC; c++) {
            if (r >= 0 && c >= 0) {
              const student = relevantStudents[r];
              if (student) {
                if (isSLM) {
                  const tpIndex = Math.floor(c / 2);
                  const key = `${student.id}_slm_${item.id}_tp_${tpIndex}`;
                  delete newState[key];
                } else {
                  const key = `${student.id}_${type}`;
                  delete newState[key];
                }
              }
            }
          }
        }
        return newState;
      });

      if (updatedCount > 0 && showToast) {
        showToast(`${updatedCount} nilai berhasil dihapus.`, "success");
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
        document.querySelector(".nilai-table-container")?.contains(document.activeElement);
      if (!isGridActive) return;

      let tsv = "";
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        let rowData = [];
        const student = relevantStudents[r];
        if (student) {
          const studentGrade = localGrades[student.id] || {};
          for (let c = bounds.minC; c <= bounds.maxC; c++) {
            if (isSLM) {
              const tpIndex = Math.floor(c / 2);
              const isKualitatif = (c % 2 !== 0);
              const slmData = studentGrade?.slm?.find((s) => s.id === item.id);
              const scoreVal = slmData?.scores?.[tpIndex] ?? null;
              if (isKualitatif) {
                const qualCode = getQualitativeCode(scoreVal, settings.predikats);
                rowData.push(qualCode ?? "");
              } else {
                const numericVal = getNumericValue(scoreVal, qualitativeGradingMap) ?? "";
                rowData.push(numericVal);
              }
            } else {
              const numericVal = getNumericValue(studentGrade[type], qualitativeGradingMap) ?? "";
              rowData.push(numericVal);
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
  }, [getSelectionBounds, relevantStudents, localGrades, isSLM, item?.id, settings.predikats, settings.qualitativeGradingMap, type, showToast]);

  useEffect(() => {
    if (isOpen) {
      const initialLocalGrades = {};
      students.forEach((student) => {
        const studentGrade = grades.find((g) => g.studentId === student.id);
        const gradeObj = JSON.parse(
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
        if (!gradeObj.slm) gradeObj.slm = [];
        initialLocalGrades[student.id] = gradeObj;
      });
      setLocalGrades(initialLocalGrades);
      setActiveInput({});

      if (isSLM && item) {
        const initialTps = objectivesForSubject
          .filter((obj) => obj.slmId === item.id)
          .map((obj, index) => ({
            id: `tp_${index}_${item.id}`,
            text: obj.text,
            isEdited: obj.isEdited,
          }));
        setLocalObjectives(initialTps);
      }
    }
  }, [isOpen, item, objectivesForSubject, isSLM, students, grades]);

  const handleSave = () => {
    if (isSLM) {
      const gradeKey = `Kelas ${gradeNumber}`;
      const curriculumKey = subject.curriculumKey || subject.fullName;
      const existingObjectives = objectives[gradeKey]?.[curriculumKey] || [];
      const otherSlmObjectives = existingObjectives.filter(
        (obj) => obj.slmId !== item.id,
      );
      const newSlmObjectives = localObjectives.map((tp) => ({
        slmId: item.id,
        text: tp.text,
        isEdited: tp.isEdited,
      }));
      const newObjectivesForSubject = [
        ...otherSlmObjectives,
        ...newSlmObjectives,
      ];
      const newObjectivesObject = {
        ...objectives,
        [gradeKey]: {
          ...(objectives[gradeKey] || {}),
          [curriculumKey]: newObjectivesForSubject,
        },
      };
      onUpdateObjectives(newObjectivesObject);
    }

    const gradesToUpdate = JSON.parse(JSON.stringify(localGrades));

    if (isSLM && item) {
      Object.values(gradesToUpdate).forEach((studentGrade) => {
        const slm = studentGrade.slm?.find((s) => s.id === item.id);
        if (slm) {
          slm.name = slmName;
        }
      });
    }

    const updates = Object.entries(gradesToUpdate).map(
      ([studentId, newDetailedGrade]) => ({
        studentId,
        subjectId: subject.id,
        newDetailedGrade,
      }),
    );
    onBulkUpdateGrades(updates);

    onClose();
  };

  const handleLocalGradeChange = useCallback(
    (studentId, value, inputType, tpIndex = null) => {
      const key = `${studentId}_${isSLM ? `slm_${item.id}_tp_${tpIndex}` : type}`;

      setLocalGrades((prevGrades) => {
        const newGrades = { ...prevGrades };
        const studentGrade = JSON.parse(JSON.stringify(newGrades[studentId]));

        let finalValue = value;

        if (inputType === "qnt") {
          finalValue = value === "" ? null : parseInt(value, 10);
          if (
            value !== "" &&
            (isNaN(finalValue) || finalValue < 0 || finalValue > 100)
          ) {
            return prevGrades;
          }
        } else if (inputType === "ql") {
          finalValue = value === "" ? null : value;
        }

        if (isSLM) {
          let slm = studentGrade.slm?.find((s) => s.id === item.id);
          if (!slm) {
            slm = {
              id: item.id,
              name: slmName,
              scores: Array(localObjectives.length).fill(null),
            };
            studentGrade.slm.push(slm);
          }
          while (slm.scores.length < localObjectives.length) {
            slm.scores.push(null);
          }
          slm.scores[tpIndex] = finalValue;
        } else {
          studentGrade[type] = finalValue;
        }

        newGrades[studentId] = studentGrade;
        return newGrades;
      });

      if (value !== "" && value !== null) {
        setActiveInput((prev) => ({ ...prev, [key]: inputType }));
      } else {
        setActiveInput((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    },
    [isSLM, item, slmName, localObjectives.length, type],
  );

  // Function to handle local description changes
  const handleLocalDescriptionChange = useCallback(
    (studentId, type, value) => {
      setLocalGrades((prevGrades) => {
        const newGrades = { ...prevGrades };
        const studentGrade = JSON.parse(JSON.stringify(newGrades[studentId]));
        const student = students.find((s) => s.id === studentId);
        const generated = generateSubjectDescription(
          student,
          studentGrade,
          currentObjectives,
          settings,
          settings.slmVisibility?.[subject.id],
        );

        if (!studentGrade.descriptions) {
          studentGrade.descriptions = {
            highest: generated.highest,
            lowest: generated.lowest,
          };
        } else {
          // If descriptions exist, ensure we have both fields (merge with generated if empty)
          if (
            !studentGrade.descriptions.highest ||
            !studentGrade.descriptions.highest.trim()
          ) {
            studentGrade.descriptions.highest = generated.highest;
          }
          if (
            !studentGrade.descriptions.lowest ||
            !studentGrade.descriptions.lowest.trim()
          ) {
            studentGrade.descriptions.lowest = generated.lowest;
          }
        }

        studentGrade.descriptions[type] = value;
        newGrades[studentId] = studentGrade;
        return newGrades;
      });
    },
    [students, currentObjectives, settings, subject.id],
  );

  const handleBulkGenerateDescriptions = () => {
    setLocalGrades((prevGrades) => {
      const newGrades = { ...prevGrades };

      relevantStudents.forEach((student) => {
        if (!newGrades[student.id]) return;

        const detailedGrade = newGrades[student.id];

        // We need to pass the student object, detailedGrade, and objectives.
        const generated = generateSubjectDescription(
          student,
          detailedGrade,
          currentObjectives,
          settings,
          settings.slmVisibility?.[subject.id],
        );

        if (!detailedGrade.descriptions)
          detailedGrade.descriptions = { highest: "", lowest: "" };
        detailedGrade.descriptions.highest = generated.highest;
        detailedGrade.descriptions.lowest = generated.lowest;
      });

      return newGrades;
    });

    showToast("Deskripsi kompetensi berhasil digenerate otomatis.", "success");
  };

  const handlePaste = useCallback(
    async (e, startStudentId, tpIndex = null) => {
      e.preventDefault();
      const pasteData = await getClipboardText(e);

      let pastedRows = pasteData.split(/\r\n|\n|\r/);
      if (pastedRows.length > 0 && pastedRows[pastedRows.length - 1] === "") {
        pastedRows.pop();
      }

      if (pastedRows.length === 0) return;

      const studentIds = relevantStudents.map((s) => s.id);
      const startStudentIndex = studentIds.indexOf(startStudentId);

      if (startStudentIndex === -1) return;

      setLocalGrades((prevLocalGrades) => {
        const newLocalGrades = JSON.parse(JSON.stringify(prevLocalGrades));
        let updatedCount = 0;

        pastedRows.forEach((pastedValue, rowIndex) => {
          const currentStudentIndex = startStudentIndex + rowIndex;
          if (currentStudentIndex >= studentIds.length) return;

          const studentIdToUpdate = studentIds[currentStudentIndex];
          const studentGradeToUpdate = newLocalGrades[studentIdToUpdate];
          if (!studentGradeToUpdate) return;
          if (!studentGradeToUpdate.slm) {
            studentGradeToUpdate.slm = [];
          }

          const valuesInRow = splitRowIntoColumns(pastedValue);

          // Iterate over columns to support horizontal pasting
          valuesInRow.forEach((val, colIndex) => {
            const gradeValueStr = val.trim();
            let currentTpIndex = tpIndex !== null ? tpIndex + colIndex : null;

            if (isSLM && currentTpIndex >= localObjectives.length) return;

            if (gradeValueStr === "") {
              updatedCount++;
              if (isSLM) {
                let slm = studentGradeToUpdate.slm?.find(
                  (s) => s.id === item.id,
                );
                if (!slm) {
                  slm = {
                    id: item.id,
                    name: slmName,
                    scores: Array(localObjectives.length).fill(null),
                  };
                  studentGradeToUpdate.slm.push(slm);
                }
                while (slm.scores.length < localObjectives.length) {
                  slm.scores.push(null);
                }
                if (
                  currentTpIndex !== null &&
                  currentTpIndex < slm.scores.length
                ) {
                  slm.scores[currentTpIndex] = null;
                }
              } else {
                // If it's not SLM, we only have one column basically (STS/SAS)
                if (colIndex === 0) {
                  studentGradeToUpdate[type] = null;
                }
              }
              return;
            }

            let finalValue = null;
            const qualitativeCode = gradeValueStr.toUpperCase();
            if (QUALITATIVE_DESCRIPTORS.hasOwnProperty(qualitativeCode)) {
              finalValue = qualitativeCode;
            } else {
              let numericValue = parseFloat(gradeValueStr.replace(",", "."));
              if (
                !isNaN(numericValue)
              ) {
                numericValue = Math.round(numericValue);
                if (numericValue >= 0 && numericValue <= 100) {
                  finalValue = numericValue;
                }
              }
            }

            if (finalValue !== null) {
              updatedCount++;
              if (isSLM) {
                let slm = studentGradeToUpdate.slm?.find(
                  (s) => s.id === item.id,
                );
                if (!slm) {
                  slm = {
                    id: item.id,
                    name: slmName,
                    scores: Array(localObjectives.length).fill(null),
                  };
                  studentGradeToUpdate.slm.push(slm);
                }
                while (slm.scores.length < localObjectives.length) {
                  slm.scores.push(null);
                }
                if (
                  currentTpIndex !== null &&
                  currentTpIndex < slm.scores.length
                ) {
                  slm.scores[currentTpIndex] = finalValue;
                }
              } else {
                if (colIndex === 0) {
                  studentGradeToUpdate[type] = finalValue;
                }
              }
            }
          });
        });

        if (updatedCount > 0) {
          showToast(`${updatedCount} nilai berhasil ditempel.`, "success");
        } else {
          showToast(
            "Tidak ada nilai valid yang ditemukan untuk ditempel.",
            "error",
          );
        }

        return newLocalGrades;
      });
    },
    [relevantStudents, isSLM, item, slmName, localObjectives, type, showToast],
  );

  const handleWeightChange = (
    weightType,
    value,
    slmId = null,
    tpIndex = null,
  ) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > 100))
      return;

    const newWeights = JSON.parse(JSON.stringify(weights));

    if (weightType === "TP" && slmId !== null && tpIndex !== null) {
      if (!newWeights.TP) newWeights.TP = {};
      if (!newWeights.TP[slmId]) newWeights.TP[slmId][tpIndex] = numValue;
    } else if (weightType === "STS" || weightType === "SAS") {
      newWeights[weightType] = numValue;
    }

    onUpdateGradeCalculation(subject.id, {
      ...calculationConfig,
      weights: newWeights,
    });
  };

  const handleAddManualTp = () => {
    setLocalObjectives((prev) => [
      ...prev,
      { id: `manual_${Date.now()}`, text: "", isEdited: true },
    ]);
  };

  const handleUpdateTpText = (id, text) => {
    setLocalObjectives((prev) =>
      prev.map((tp) => (tp.id === id ? { ...tp, text, isEdited: true } : tp)),
    );
  };

  const handleDeleteTp = (id, index) => {
    setLocalObjectives((prev) => prev.filter((tp) => tp.id !== id));
    setLocalGrades((prev) => {
      const newGrades = JSON.parse(JSON.stringify(prev));
      for (const studentId in newGrades) {
        const slm = newGrades[studentId].slm?.find((s) => s.id === item.id);
        if (slm && slm.scores?.length > index) {
          slm.scores.splice(index, 1);
        }
      }
      return newGrades;
    });

    if (isWeighting) {
      const newWeights = JSON.parse(JSON.stringify(weights));
      if (newWeights.TP && newWeights.TP[item.id]) {
        newWeights.TP[item.id].splice(index, 1);
        onUpdateGradeCalculation(subject.id, {
          ...calculationConfig,
          weights: newWeights,
        });
      }
    }
  };

  const handleApplyTpSelection = (selectedTexts) => {
    const newTps = selectedTexts.map((text) => ({
      id: `selected_${Date.now()}_${Math.random()}`,
      text,
      isEdited: true,
    }));
    setLocalObjectives((prev) => [...prev, ...newTps]);
  };

  const availableTPsForSelection = useMemo(() => {
    if (!predefinedCurriculum) return [];
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return predefinedCurriculum[curriculumKey] || [];
  }, [predefinedCurriculum, subject]);

  const headerRowSpan = isSLM ? (isWeighting ? 3 : 2) : isWeighting ? 2 : 1;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(TPSelectionModal, {
      isOpen: isTpSelectionModalOpen,
      onClose: () => setIsTpSelectionModalOpen(false),
      onApply: handleApplyTpSelection,
      subject: subject,
      availableTPs: availableTPsForSelection,
      isLoading: !predefinedCurriculum,
    }),
    React.createElement(
      "div",
      {
        className:
          "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col",
        },
        React.createElement(
          "div",
          {
            className:
              "p-5 border-b flex-shrink-0 flex justify-between items-center",
          },
          isSLM
            ? React.createElement("input", {
                type: "text",
                value: slmName,
                onChange: (e) => setSlmName(e.target.value),
                placeholder: "Nama Lingkup Materi",
                className: `text-xl font-bold text-slate-800 border-b-2 outline-none flex-grow bg-transparent ${slmName && slmName.trim() !== "" ? "border-green-500" : "border-red-500"}`,
              })
            : React.createElement(
                "h3",
                { className: "text-xl font-bold text-slate-800" },
                `Input Nilai ${type.toUpperCase()}`,
              ),
          React.createElement(
            "div",
            { className: "flex items-center gap-2" },
            React.createElement(
              "button",
              {
                onClick: onClose,
                className:
                  "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50",
              },
              "Batal",
            ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: handleAddManualTp,
                  className:
                    "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200",
                },
                "Ketik TP Manual",
              ),
            isSLM &&
              React.createElement(
                "button",
                {
                  onClick: () => setIsTpSelectionModalOpen(true),
                  className:
                    "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200",
                },
                "Pilih TP dari Data",
              ),
            React.createElement(
              "button",
              {
                onClick: handleSave,
                className:
                  "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700",
              },
              "Simpan & Tutup",
            ),
          ),
        ),

        React.createElement(
          "div",
          { className: "flex-1 overflow-auto" },
          isSLM &&
            React.createElement(
              "div",
              { className: "p-4 border-b space-y-2" },
              localObjectives.map((tp, index) =>
                React.createElement(
                  "div",
                  { key: tp.id, className: "flex items-start gap-2" },
                  React.createElement(
                    "span",
                    { className: "font-bold text-sm text-slate-500 pt-2" },
                    `TP ${index + 1}:`,
                  ),
                  React.createElement(AutoSizingTextarea, {
                    value: tp.text,
                    onChange: (e) => handleUpdateTpText(tp.id, e.target.value),
                    placeholder: "Deskripsi Tujuan Pembelajaran",
                    className: `flex-grow p-2 border rounded-md text-sm resize-none overflow-hidden ${tp.text && tp.text.trim() !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
                    rows: "1",
                  }),
                  React.createElement(
                    "button",
                    {
                      onClick: () => handleDeleteTp(tp.id, index),
                      className:
                        "text-red-500 hover:text-red-700 p-1 text-2xl leading-none flex-shrink-0 mt-1",
                    },
                    "×",
                  ),
                ),
              ),
            ),

          React.createElement(
            "div",
            { className: "overflow-x-auto nilai-table-container focus:outline-none" },
            React.createElement(
              "table",
              { className: "w-full text-sm text-left" },
              React.createElement(SummativeTableHeader, {
                isSLM,
                isWeighting,
                headerRowSpan,
                getSelectionStyle,
                handleMouseDownCell,
                handleMouseEnterCell,
                localObjectives,
                type,
                weights,
                item,
                handleWeightChange,
                handleBulkGenerateDescriptions,
              }),
              React.createElement(
                "tbody",
                null,
                relevantStudents.map((student, index) => {
                  const studentGrade = localGrades[student.id] || {};
                  return React.createElement(SummativeTableRow, {
                    key: student.id,
                    student,
                    index,
                    studentGrade,
                    currentObjectives,
                    settings,
                    subject,
                    isSLM,
                    item,
                    type,
                    qualitativeGradingMap,
                    activeInput,
                    getSelectionStyle,
                    handleMouseDownCell,
                    handleMouseEnterCell,
                    handleFocusCell,
                    handlePaste,
                    handleLocalGradeChange,
                    handleLocalDescriptionChange,
                  });
                })
              )
            )
          ),
        ),
      ),
    ),
  );
};

