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
          "fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col",
        },
        React.createElement(
          "div",
          { className: "p-4 border-b flex-shrink-0" },
          React.createElement(
            "h3",
            { className: "text-lg font-bold text-slate-800" },
            `Atur Lingkup Materi & TP untuk ${subject.label}`,
          ),
        ),
        React.createElement(
          "div",
          { className: "p-6 space-y-4 overflow-y-auto" },
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
                { className: "text-slate-500 text-center py-8" },
                "Belum ada Lingkup Materi untuk mata pelajaran ini.",
              ),
          React.createElement(
            "button",
            {
              onClick: handleAddCustomSlm,
              className:
                "w-full mt-4 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400",
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
              className: `w-full mt-2 p-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all ${isProcessingOcr ? "opacity-50 cursor-not-allowed" : ""}`,
            },
            isProcessingOcr ? "Memproses Gambar..." : "📷 Scan Lingkup Materi / TP dari Gambar (Offline)",
          ),
        ),
        React.createElement(
          "div",
          { className: "flex justify-end p-4 border-t bg-slate-50" },
          React.createElement(
            "button",
            {
              onClick: onClose,
              className:
                "px-4 py-2 text-sm font-medium bg-white border rounded-md",
            },
            "Batal",
          ),
          React.createElement(
            "button",
            {
              onClick: handleSaveChanges,
              className:
                "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md",
            },
            `Simpan & Terapkan`,
          ),
        ),
      ),
    ),
  );
};

