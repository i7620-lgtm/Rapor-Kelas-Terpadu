import { useEffect } from "react";
import { useGridSelection } from '../../hooks/useGridSelection';
import { getClipboardText } from "../../utils/clipboard";
import { useStudentsStore } from "../../stores/useStudentsStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useExtracurricularStore } from "../../stores/useExtracurricularStore";

export const MAX_EXTRA_FIELDS = 5;

const defaultDescriptions: { [key: string]: string } = {
  CATUR: "menunjukkan kemampuan berpikir strategis yang baik.",
  IPA: "sangat antusias dan aktif dalam setiap percobaan.",
  KARATE: "menunjukkan disiplin dan motivasi yang tinggi dalam latihan.",
  KEWIRAUSAHAAN: "memiliki ide-ide kreatif dan motivasi yang kuat.",
  KODING: "menunjukkan kemampuan pemecahan masalah yang baik.",
  MADING: "aktif berkolaborasi dan menyumbangkan ide-ide kreatif.",
  MATEMATIKA: "menunjukkan kemampuan analisis dan pemecahan masalah yang tajam.",
  MENGGAMBAR: "memiliki kreativitas dan kemampuan visual yang menonjol.",
  MENARI: "menunjukkan kelenturan dan ekspresi yang baik dalam setiap gerakan.",
  NYURAT_AKSARA_BALI: "menunjukkan ketekunan dan kemauan belajar yang tinggi.",
  PRAMUKA: "sangat aktif, kolaboratif, and menunjukkan jiwa kepemimpinan.",
  SILAT: "menunjukkan disiplin dan semangat yang tinggi dalam berlatih.",
  VOLI: "menunjukkan kemampuan kerjasama tim yang baik di lapangan.",
  XIANGQI: "menunjukkan kemampuan strategi dan konsentrasi yang baik.",
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return "";
  const trimmed = String(string).trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const useDataEkstrakurikulerPageLogic = (props: any) => {
  const storeStudents = useStudentsStore((state) => state.students);
  const storeSettings = useSettingsStore((state) => state.settings);
  const storeExtracurriculars = useSettingsStore((state) => state.extracurriculars);
  const storeStudentExtracurriculars = useExtracurricularStore((state) => state.studentExtracurriculars);

  const students = props.students || storeStudents;
  const settings = props.settings || storeSettings;
  const extracurriculars = props.extracurriculars || storeExtracurriculars;
  const studentExtracurriculars = props.studentExtracurriculars || storeStudentExtracurriculars;
  const showToast = props.showToast;

  const onUpdateStudentExtracurriculars = props.onUpdateStudentExtracurriculars || ((newStudentEx: any) => {
    useExtracurricularStore.getState().setStudentExtracurriculars(newStudentEx);
  });

  const currentSemester = settings?.semester || 'Ganjil';
  const activeExtracurriculars = extracurriculars.filter((e: any) => e.active);

  const handleAssignmentChange = (studentId: string, index: number, activityId: string) => {
    const studentExtra = studentExtracurriculars.find(
      (se: any) => se.studentId === studentId && (se.semester || 'Ganjil') === currentSemester,
    ) || { studentId, assignedActivities: [], descriptions: {}, semester: currentSemester };

    const newAssigned = [...(studentExtra.assignedActivities || [])];
    while (newAssigned.length < MAX_EXTRA_FIELDS) {
      newAssigned.push(null);
    }
    const newActivityId = activityId === "---" ? null : activityId;
    newAssigned[index] = newActivityId;

    const newDescriptions = { ...(studentExtra.descriptions || {}) };

    if (newActivityId && !newDescriptions[newActivityId]) {
      const student = students.find((s: any) => s.id === studentId);
      if (student) {
        const nickname =
          student.namaPanggilan || (student.namaLengkap || "").split(" ")[0];
        const template = defaultDescriptions[newActivityId];
        const generatedDescription = template
          ? `${capitalizeFirstLetter(nickname)} ${template}`
          : `${capitalizeFirstLetter(nickname)} mengikuti kegiatan dengan baik.`;
        newDescriptions[newActivityId] = generatedDescription;
      }
    }

    const updatedStudentExtra = {
      ...studentExtra,
      assignedActivities: newAssigned,
      descriptions: newDescriptions,
      semester: currentSemester
    };

    const newStudentExtracurriculars = studentExtracurriculars
      .filter((se: any) => !(se.studentId === studentId && (se.semester || 'Ganjil') === currentSemester))
      .concat(updatedStudentExtra);

    onUpdateStudentExtracurriculars(newStudentExtracurriculars);
  };

  const handleDescriptionChange = (studentId: string, activityId: string, description: string) => {
    const studentExtra = studentExtracurriculars.find(
      (se: any) => se.studentId === studentId && (se.semester || 'Ganjil') === currentSemester,
    ) || { studentId, assignedActivities: [], descriptions: {}, semester: currentSemester };
    const newDescriptions = {
      ...studentExtra.descriptions,
      [activityId]: description,
    };

    const updatedStudentExtra = {
      ...studentExtra,
      descriptions: newDescriptions,
      semester: currentSemester
    };

    const newStudentExtracurriculars = studentExtracurriculars.filter(
      (se: any) => !(se.studentId === studentId && (se.semester || 'Ganjil') === currentSemester),
    );
    newStudentExtracurriculars.push(updatedStudentExtra);
    onUpdateStudentExtracurriculars(newStudentExtracurriculars);
  };

  const {
    isSelecting,
    setIsSelecting,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell
  } = useGridSelection({
    rowsCount: students.length,
    colsCount: MAX_EXTRA_FIELDS * 2,
    minColIndex: -2,
    containerClass: 'ekstra-table-container',
    onDeleteSelection: (bounds) => {
      let updatedCount = 0;
      const newStudentExtracurricularsMap = new Map(studentExtracurriculars.map((se: any) => [`${se.studentId}_${se.semester || 'Ganjil'}`, { ...se }]));
      
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r >= 0 && c >= 0) {
            const student = students[r];
            if (student) {
              const isDesc = c % 2 !== 0;
              const extraIdx = Math.floor(c / 2);
              const key = `${student.id}_${currentSemester}`;
              let extraData: any = newStudentExtracurricularsMap.get(key);
              
              if (!extraData) {
                extraData = { studentId: student.id, assignedActivities: [], descriptions: {}, semester: currentSemester };
                newStudentExtracurricularsMap.set(key, extraData);
              }
              
              const assigned = [...(extraData.assignedActivities || [])];
              while (assigned.length < MAX_EXTRA_FIELDS) assigned.push(null);
              const descriptions = { ...(extraData.descriptions || {}) };
              
              if (!isDesc) {
                if (assigned[extraIdx] !== null) {
                  assigned[extraIdx] = null;
                  updatedCount++;
                }
              } else {
                const actId = assigned[extraIdx];
                if (actId && descriptions[actId]) {
                  descriptions[actId] = "";
                  updatedCount++;
                }
              }
              extraData.assignedActivities = assigned;
              extraData.descriptions = descriptions;
            }
          }
        }
      }
      
      if (updatedCount > 0) {
        const resultList = Array.from(newStudentExtracurricularsMap.values());
        onUpdateStudentExtracurriculars(resultList);
        if (showToast) showToast(`${updatedCount} data berhasil dihapus.`, "success");
      }
    }
  });

  useEffect(() => {
    const handleCopyGlobal = (e: ClipboardEvent) => {
      const bounds = getSelectionBounds();
      if (!bounds) return;

      if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT")) {
          return;
        }
      }

      let tsv = "";
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        let rowData = [];
        for (let c = bounds.minC; c <= bounds.maxC; c++) {
          if (r === -1) {
            if (c === -2) rowData.push("No");
            else if (c === -1) rowData.push("Nama Siswa");
            else {
              const isDesc = c % 2 !== 0;
              const extraIdx = Math.floor(c / 2);
              rowData.push(isDesc ? `Deskripsi ${extraIdx + 1}` : `Ekstrakurikuler ${extraIdx + 1}`);
            }
          } else {
            const student = students[r];
            if (student) {
              if (c === -2) {
                rowData.push(r + 1);
              } else if (c === -1) {
                rowData.push(student.namaLengkap);
              } else {
                const studentExtra = studentExtracurriculars.find((se: any) => se.studentId === student.id && (se.semester || 'Ganjil') === currentSemester);
                const extraIdx = Math.floor(c / 2);
                const isDesc = c % 2 !== 0;
                const currentAssignedId = studentExtra?.assignedActivities?.[extraIdx] || null;

                if (isDesc) {
                  if (currentAssignedId) {
                    let desc = studentExtra?.descriptions?.[currentAssignedId] || "";
                    desc = desc.replace(/[\n\t]/g, " ");
                    rowData.push(desc);
                  } else {
                    rowData.push("");
                  }
                } else {
                  if (currentAssignedId) {
                    const exObj = activeExtracurriculars.find((item: any) => item.id === currentAssignedId);
                    rowData.push(exObj ? exObj.name : currentAssignedId);
                  } else {
                    rowData.push("---");
                  }
                }
              }
            }
          }
        }
        tsv += rowData.join("\t") + "\n";
      }

      if (tsv) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", tsv.trimEnd());
        if (showToast) {
          showToast("Berhasil disalin ke clipboard", "success");
        }
      }
    };

    document.addEventListener("copy", handleCopyGlobal);
    return () => document.removeEventListener("copy", handleCopyGlobal);
  }, [getSelectionBounds, students, studentExtracurriculars, activeExtracurriculars, showToast]);

  const handlePasteActivity = async (e: any, startStudentId: string, extraIndex: number) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);

    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }

    if (rows.length === 0) return;

    const studentIndex = students.findIndex((s: any) => s.id === startStudentId);
    if (studentIndex === -1) return;

    let updatedCount = 0;
    const currentStudentExtracurriculars = [...studentExtracurriculars];

    const studentExtraMap = new Map();
    currentStudentExtracurriculars.forEach((se) => {
      if ((se.semester || 'Ganjil') === currentSemester) {
        studentExtraMap.set(se.studentId, se);
      }
    });

    rows.forEach((row, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;

      const student = students[currentStudentIndex];
      const columns = row.includes("\t") ? row.split("\t") : (row.includes(";") ? row.split(";") : [row]);

      let record = studentExtraMap.get(student.id);
      if (!record) {
        record = {
          studentId: student.id,
          assignedActivities: [],
          descriptions: {},
          semester: currentSemester
        };
      } else {
        record = {
          ...record,
          assignedActivities: [...(record.assignedActivities || [])],
        };
      }

      columns.forEach((value, cIndex) => {
        const targetExtraIndex = extraIndex + cIndex;
        if (targetExtraIndex < MAX_EXTRA_FIELDS) {
          const cleanValue = value.trim();
          if (cleanValue === "" || cleanValue === "---") {
            record.assignedActivities[targetExtraIndex] = null;
            updatedCount++;
          } else {
            const matchingEx = activeExtracurriculars.find(
              (item: any) => item.name.toLowerCase() === cleanValue.toLowerCase(),
            );
            if (
              (matchingEx &&
                !record.assignedActivities.includes(matchingEx.id)) ||
              record.assignedActivities[targetExtraIndex] === matchingEx?.id
            ) {
              record.assignedActivities[targetExtraIndex] = matchingEx.id;
              updatedCount++;
            }
          }
        }
      });

      studentExtraMap.set(student.id, record);
    });

    if (updatedCount > 0) {
      const newExtracurricularsList = studentExtracurriculars.filter((se: any) => (se.semester || 'Ganjil') !== currentSemester).concat(Array.from(studentExtraMap.values()));
      onUpdateStudentExtracurriculars(newExtracurricularsList);
      if (showToast) {
        showToast(
          `${updatedCount} ekstrakurikuler berhasil ditempel.`,
          "success",
        );
      }
    }
  };

  const handlePasteDescription = async (e: any, startStudentId: string, extraIndex: number) => {
    e.preventDefault();
    const pasteData = await getClipboardText(e);

    let rows = pasteData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1] === "") {
      rows.pop();
    }

    if (rows.length === 0) return;

    const studentIndex = students.findIndex((s: any) => s.id === startStudentId);
    if (studentIndex === -1) return;

    let updatedCount = 0;
    const currentStudentExtracurriculars = [...studentExtracurriculars];

    const studentExtraMap = new Map();
    currentStudentExtracurriculars.forEach((se) => {
      if ((se.semester || 'Ganjil') === currentSemester) {
        studentExtraMap.set(se.studentId, se);
      }
    });

    rows.forEach((row, rIndex) => {
      const currentStudentIndex = studentIndex + rIndex;
      if (currentStudentIndex >= students.length) return;

      const student = students[currentStudentIndex];
      const columns = row.includes("\t") ? row.split("\t") : (row.includes(";") ? row.split(";") : [row]);

      let record = studentExtraMap.get(student.id);
      if (!record) {
        record = {
          studentId: student.id,
          assignedActivities: [],
          descriptions: {},
          semester: currentSemester
        };
      } else {
        record = { ...record, descriptions: { ...record.descriptions } };
      }

      let rowUpdated = false;
      columns.forEach((value, cIndex) => {
        const targetExtraIndex = extraIndex + cIndex;
        if (targetExtraIndex < MAX_EXTRA_FIELDS) {
          const activityId = record.assignedActivities?.[targetExtraIndex];

          if (activityId) {
            record.descriptions[activityId] = value;
            rowUpdated = true;
          }
        }
      });

      if (rowUpdated) {
        studentExtraMap.set(student.id, record);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      const newExtracurricularsList = studentExtracurriculars.filter((se: any) => (se.semester || 'Ganjil') !== currentSemester).concat(Array.from(studentExtraMap.values()));
      onUpdateStudentExtracurriculars(newExtracurricularsList);
      if (showToast) {
        showToast(`${updatedCount} deskripsi berhasil ditempel.`, "success");
      }
    }
  };

  return {
    students,
    activeExtracurriculars,
    studentExtracurriculars,
    currentSemester,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleAssignmentChange,
    handleDescriptionChange,
    handlePasteActivity,
    handlePasteDescription,
  };
};
