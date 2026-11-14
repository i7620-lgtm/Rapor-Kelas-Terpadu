import React from "react";
import { TPSelectionModal } from "./TPSelectionModal";
import { OfflineOcrAssistantModal } from "./OfflineOcrAssistantModal";
import { ManageSlmItem } from "./ManageSlmItem";



import { useManageSlmLogic } from './useManageSlmLogic';
export const ManageSlmModal = (props) => {
  const { isOpen, onClose, subject, showToast, predefinedCurriculum } = props;
  // ... (content unchanged)
  
  if (!isOpen) return null;

  const logic = useManageSlmLogic(props);
  const {
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
  } = logic;

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
      currentGrade: props.gradeNumber,
    }),
    React.createElement(OfflineOcrAssistantModal, {
      isOpen: isOfflineOcrModalOpen,
      onClose: () => {
        setIsOfflineOcrModalOpen(false);
        setIsProcessingOcr(false);
      },
      onApply: handleApplyOfflineOcr,
      imageSrc: offlineOcrImageSrc,
      detectedLines: offlineOcrDetectedLines,
      isRunningOcr: offlineIsRunningOcr,
      showToast: showToast
    }),
    React.createElement(
      "div",
      {
        className:
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800",
        },
        React.createElement(
          "div",
          { className: "p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0" },
          React.createElement(
            "h3",
            { className: "text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100" },
            `Atur Lingkup Materi & TP untuk ${subject.label}`,
          ),
        ),
        React.createElement(
          "div",
          { className: "p-4 sm:p-6 space-y-4 overflow-y-auto" },
          localSlms.length > 0
            ? localSlms.map((slm) =>
                React.createElement(ManageSlmItem, {
                  key: slm.id,
                  slm: slm,
                  onSlmNameChange: handleSlmNameChange,
                  onDeleteSlm: handleDeleteSlm,
                  onSemesterToggle: handleSemesterToggle,
                  onTpTextChange: handleTpTextChange,
                  onDeleteTp: handleDeleteTp,
                  onAddManualTp: handleAddManualTp,
                  onOpenTpSelection: handleOpenTpSelection,
                })
              )
            : React.createElement(
                "p",
                { className: "text-slate-500 dark:text-slate-400 text-center py-8" },
                "Belum ada Lingkup Materi untuk mata pelajaran ini.",
              ),
          React.createElement(
            "button",
            {
              onClick: handleAddCustomSlm,
              className:
                "w-full mt-4 p-3 min-h-[44px] lg:min-h-0 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 transition-colors",
            },
            "+ Tambah Lingkup Materi Baru",
          ),
          React.createElement("input", {
            type: "file",
            accept: "image/*",
            ref: fileInputRef,
            onChange: handleOcrUpload,
            className: "hidden",
          }),
          React.createElement(
            "button",
            {
              onClick: () => fileInputRef.current?.click(),
              disabled: isProcessingOcr,
              className: `w-full mt-2 p-3 min-h-[44px] lg:min-h-0 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all ${isProcessingOcr ? "opacity-50 cursor-not-allowed" : ""}`,
            },
            isProcessingOcr ? "Memproses Gambar..." : "📷 Scan Lingkup Materi / TP dari Gambar (Offline)",
          ),
        ),
        React.createElement(
          "div",
          { className: "flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl flex-shrink-0" },
          React.createElement(
            "button",
            {
              onClick: onClose,
              className:
                "w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
            },
            "Batal",
          ),
          React.createElement(
            "button",
            {
              onClick: handleSaveChanges,
              className:
                "w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors",
            },
            `Simpan & Terapkan`,
          ),
        ),
      ),
    ),
  );
};

