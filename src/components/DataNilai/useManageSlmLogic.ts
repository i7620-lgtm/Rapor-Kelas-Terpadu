import { useState, useEffect, useRef, useMemo } from "react";

export const useManageSlmLogic = (props) => {
  const {
    isOpen,
    onClose,
    onSave,
    subject,
    students,
    grades,
    learningObjectives,
    onUpdateLearningObjectives,
    onBulkUpdateGrades,
    allSlms,
    initialActiveIds,
    showToast,
    gradeNumber,
    predefinedCurriculum,
  } = props;

  const [localSlms, setLocalSlms] = useState([]);
  const [isTpSelectionModalOpen, setIsTpSelectionModalOpen] = useState(false);
  const [slmForTpSelection, setSlmForTpSelection] = useState(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const fileInputRef = useRef(null);

  const [isOfflineOcrModalOpen, setIsOfflineOcrModalOpen] = useState(false);
  const [offlineOcrImageSrc, setOfflineOcrImageSrc] = useState(null);
  const [offlineOcrDetectedLines, setOfflineOcrDetectedLines] = useState([]);
  const [offlineIsRunningOcr, setOfflineIsRunningOcr] = useState(false);

  const handleApplyOfflineOcr = (judul, tpTexts) => {
    const newSlm = {
      id: `slm_ocr_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: judul,
      tps: tpTexts.map((text) => ({ text, isEdited: true })),
    };
    setLocalSlms((prev) => [...prev, newSlm]);
    showToast(
      `Materi "${judul}" berhasil ditambahkan lewat asisten gambar!`,
      "success"
    );
  };

  useEffect(() => {
    if (isOpen) {
      setLocalSlms(JSON.parse(JSON.stringify(allSlms))); // Deep copy
    }
  }, [isOpen, allSlms, initialActiveIds]);

  const availableTPsForSelection = useMemo(() => {
    if (!predefinedCurriculum) return [];
    const curriculumKey = subject.curriculumKey || subject.fullName;
    return predefinedCurriculum[curriculumKey] || [];
  }, [predefinedCurriculum, subject]);

  const handleSlmNameChange = (slmId, newName) => {
    setLocalSlms((prev) =>
      prev.map((slm) => (slm.id === slmId ? { ...slm, name: newName } : slm))
    );
  };

  const handleTpTextChange = (slmId, tpIndex, newText) => {
    setLocalSlms((prev) =>
      prev.map((slm) => {
        if (slm.id === slmId) {
          const newTps = [...slm.tps];
          newTps[tpIndex] = {
            ...newTps[tpIndex],
            text: newText,
            isEdited: true,
          };
          return { ...slm, tps: newTps };
        }
        return slm;
      })
    );
  };

  const handleSemesterToggle = (slmId, currentSemester, targetSemester) => {
    const newSemester =
      currentSemester === targetSemester ? "Semua" : targetSemester;
    setLocalSlms((prev) =>
      prev.map((slm) =>
        slm.id === slmId ? { ...slm, semester: newSemester } : slm
      )
    );
  };

  const handleAddCustomSlm = () => {
    const newSlm = {
      id: `slm_custom_${Date.now()}`,
      name: "Lingkup Materi Baru",
      tps: [],
    };
    setLocalSlms((prev) => [...prev, newSlm]);
  };

  const handleDeleteSlm = (slmId) => {
    if (
      window.confirm(
        "Menghapus Lingkup Materi ini juga akan menghapus semua TP dan nilai terkait. Lanjutkan?"
      )
    ) {
      setLocalSlms((prev) => prev.filter((slm) => slm.id !== slmId));
    }
  };

  const handleAddManualTp = (slmId) => {
    setLocalSlms((prev) =>
      prev.map((slm) =>
        slm.id === slmId
          ? { ...slm, tps: [...slm.tps, { text: "", isEdited: true }] }
          : slm
      )
    );
  };

  const handleDeleteTp = (slmId, tpIndex) => {
    setLocalSlms((prev) =>
      prev.map((slm) => {
        if (slm.id === slmId) {
          const newTps = [...slm.tps];
          newTps.splice(tpIndex, 1);
          return { ...slm, tps: newTps };
        }
        return slm;
      })
    );
  };

  const handleOpenTpSelection = (slmId) => {
    setSlmForTpSelection(slmId);
    setIsTpSelectionModalOpen(true);
  };

  const handleApplyTpSelection = (selectedTexts) => {
    if (!slmForTpSelection) return;
    setLocalSlms((prev) =>
      prev.map((slm) => {
        if (slm.id === slmForTpSelection) {
          const newTps = selectedTexts.map((text) => ({
            text,
            isEdited: true,
          }));
          return { ...slm, tps: [...slm.tps, ...newTps] };
        }
        return slm;
      })
    );
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsProcessingOcr(true);
      const isOnline = navigator.onLine;

      let geminiSuccess = false;

      if (isOnline) {
        showToast(
          "Online terdeteksi. Memproses menggunakan Gemini Flash Lite (AI)...",
          "info"
        );
        try {
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = (error) => reject(error);
          });

          const response = await fetch("/api/ocr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (
              data.result &&
              Array.isArray(data.result) &&
              data.result.length > 0
            ) {
              const newSlms = data.result
                .map((slm) => ({
                  id: `slm_ocr_ai_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
                  name: slm.name || "Hasil AI",
                  tps: (slm.tps || []).map((t) => ({
                    text: t,
                    isEdited: true,
                  })),
                }))
                .filter((slm) => slm.tps.length > 0);

              if (newSlms.length > 0) {
                setLocalSlms((prev) => [...prev, ...newSlms]);
                const totalTps = newSlms.reduce(
                  (acc, curr) => acc + curr.tps.length,
                  0
                );
                const friendlyModel = data.modelUsed
                  ? data.modelUsed.replace("gemini-3.1-", "").replace("-preview", "")
                  : "Gemini";
                showToast(
                  `AI (${friendlyModel}) berhasil menemukan ${newSlms.length} Lingkup Materi dan ${totalTps} TP.`,
                  "success"
                );
                geminiSuccess = true;
              }
            }
          } else {
            console.warn(
              "Gemini OCR failed or quota exceeded",
              await response.text()
            );
          }
        } catch (aiErr) {
          console.warn("Gemini OCR request failed:", aiErr);
        }
      }

      if (!geminiSuccess) {
        if (isOnline) {
          showToast(
            "Gemini AI gagal atau kuota habis. Membuka Asisten Input Gambar Offline...",
            "warning"
          );
        } else {
          showToast(
            "Offline terdeteksi. Membuka Asisten Input Gambar Offline...",
            "info"
          );
        }

        const fileUrl = URL.createObjectURL(file);
        setOfflineOcrImageSrc(fileUrl);
        setOfflineOcrDetectedLines([]);
        setOfflineIsRunningOcr(false);
        setIsOfflineOcrModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memproses gambar. Pastikan file valid.", "error");
    } finally {
      setIsProcessingOcr(false);
      e.target.value = "";
    }
  };

  const handleSaveChanges = () => {
    const gradeKey = `Kelas ${gradeNumber}`;
    const curriculumKey = subject.curriculumKey || subject.fullName;

    const allTpsForSubject = localSlms.flatMap((slm) =>
      slm.tps.map((tp) => ({
        slmId: slm.id,
        text: tp.text,
        isEdited: tp.isEdited,
        semester: slm.semester || "Semua",
      }))
    );
    const newLearningObjectives = {
      ...learningObjectives,
      [gradeKey]: {
        ...(learningObjectives[gradeKey] || {}),
        [curriculumKey]: allTpsForSubject,
      },
    };
    onUpdateLearningObjectives(newLearningObjectives);

    const updates = [];
    const localSlmIds = new Set(localSlms.map((s) => s.id));

    students.forEach((student) => {
      const studentGrade = grades.find((g) => g.studentId === student.id);
      const detailedGrade = JSON.parse(
        JSON.stringify(
          studentGrade?.detailedGrades?.[subject.id] || {
            slm: [],
            sts1: null,
            sts2: null,
            sas1: null,
            sas2: null,
          }
        )
      );
      if (!detailedGrade.slm) detailedGrade.slm = [];
      let hasChanged = false;

      localSlms.forEach((localSlm) => {
        let gradeSlm = detailedGrade.slm.find((s) => s.id === localSlm.id);
        if (gradeSlm) {
          if (gradeSlm.name !== localSlm.name) {
            gradeSlm.name = localSlm.name;
            hasChanged = true;
          }
          if (gradeSlm.scores.length !== localSlm.tps.length) {
            const newScores = Array(localSlm.tps.length).fill(null);
            for (
              let i = 0;
              i < Math.min(gradeSlm.scores.length, newScores.length);
              i++
            ) {
              newScores[i] = gradeSlm.scores[i];
            }
            gradeSlm.scores = newScores;
            hasChanged = true;
          }
        } else {
          detailedGrade.slm.push({
            id: localSlm.id,
            name: localSlm.name,
            scores: Array(localSlm.tps.length).fill(null),
          });
          hasChanged = true;
        }
      });

      const initialSlmCount = detailedGrade.slm.length;
      detailedGrade.slm = detailedGrade.slm.filter((s) =>
        localSlmIds.has(s.id)
      );
      if (detailedGrade.slm.length !== initialSlmCount) {
        hasChanged = true;
      }

      if (hasChanged) {
        updates.push({
          studentId: student.id,
          subjectId: subject.id,
          newDetailedGrade: detailedGrade,
        });
      }
    });

    if (updates.length > 0) {
      onBulkUpdateGrades(updates);
    }

    onSave.onSaveSlmSettings(localSlms.map((slm) => slm.id));
    showToast("Perubahan pada SLM & TP berhasil disimpan.", "success");
    onClose();
  };

  return {
    localSlms,
    isTpSelectionModalOpen,
    setIsTpSelectionModalOpen,
    isProcessingOcr,
    fileInputRef,
    isOfflineOcrModalOpen,
    setIsOfflineOcrModalOpen,
    offlineOcrImageSrc,
    offlineOcrDetectedLines,
    offlineIsRunningOcr,
    availableTPsForSelection,
    handleApplyOfflineOcr,
    handleSlmNameChange,
    handleTpTextChange,
    handleSemesterToggle,
    handleAddCustomSlm,
    handleDeleteSlm,
    handleAddManualTp,
    handleDeleteTp,
    handleOpenTpSelection,
    handleApplyTpSelection,
    handleOcrUpload,
    handleSaveChanges,
    setIsProcessingOcr
  };
};
