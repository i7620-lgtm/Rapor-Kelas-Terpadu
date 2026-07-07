import React from "react";
import { OcrImagePreviewAndCropper } from "./OcrImagePreviewAndCropper";
import { OcrFullScanResults } from "./OcrFullScanResults";
import { OcrDraftEditor } from "./OcrDraftEditor";
import { useOfflineOcrAssistantLogic } from "./useOfflineOcrAssistantLogic";

export const OfflineOcrAssistantModal = ({
  isOpen,
  onClose,
  onApply,
  imageSrc,
  detectedLines,
  isRunningOcr,
  showToast
}: any) => {
  const {
    judulBab,
    setJudulBab,
    tps,
    localLines,
    setLocalLines,
    cropRole,
    setCropRole,
    isAnalyzingCrop,
    isFullOcrRunning,
    imageRef,
    handleAddTpManual,
    handleUpdateTpText,
    handleRemoveTp,
    setAsJudulBab,
    addAsTp,
    handleClear,
    handleSubmit,
    processCroppedOcr,
    runFullOcr
  } = useOfflineOcrAssistantLogic(
    isOpen,
    onClose,
    onApply,
    imageSrc,
    detectedLines,
    isRunningOcr,
    showToast
  );

  if (!isOpen) return null;

  return React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-2 sm:p-4",
    },
    React.createElement(
      "div",
      {
        className: "bg-slate-900 text-slate-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-700",
      },
      // Header
      React.createElement(
        "div",
        { className: "p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 rounded-t-xl flex-shrink-0" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h3",
            { className: "text-md sm:text-lg font-bold text-white flex items-center gap-2" },
            "📷 Asisten Input Gambar Offline (Penyunting Visual)"
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-400 mt-0.5" },
            "Atur mode sorot manual di bawah gambar acuan, lalu seret kotak langsung ke area bab/TP pada gambar untuk mengambil teks otomatis secara rapi."
          )
        ),
        React.createElement(
          "button",
          {
            onClick: onClose,
            className: "text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-full transition-all text-xl font-bold cursor-pointer",
          },
          "×"
        )
      ),
      // Body
      React.createElement(
        "div",
        { className: "flex-grow overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0" },
        
        // Left Column: Visual Image Previewer & Cropping Canvas
        React.createElement(OcrImagePreviewAndCropper, {
          imageSrc,
          cropRole,
          setCropRole,
          isAnalyzingCrop,
          onCropComplete: processCroppedOcr,
          imageRef,
          showToast,
        }),

        // Right Column: Full Scan Results & Live draft editors
        React.createElement(
          "div",
          { className: "lg:col-span-7 flex flex-col gap-4 min-h-0" },
          React.createElement(OcrFullScanResults, {
            localLines,
            setLocalLines,
            isRunningOcr,
            isFullOcrRunning,
            runFullOcr,
            setAsJudulBab,
            addAsTp,
          }),
          React.createElement(OcrDraftEditor, {
            judulBab,
            setJudulBab,
            tps,
            handleUpdateTpText,
            handleRemoveTp,
            handleAddTpManual,
            handleClear,
          })
        )
      ),
      // Footer
      React.createElement(
        "div",
        { className: "p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950 rounded-b-xl flex-shrink-0" },
        React.createElement(
          "button",
          {
            onClick: onClose,
            className: "px-4 py-2 text-sm font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-md transition-colors cursor-pointer",
          },
          "Batal"
        ),
        React.createElement(
          "button",
          {
            onClick: handleSubmit,
            className: "px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-505 rounded-md shadow-lg active:bg-indigo-700 transition-colors cursor-pointer",
          },
          "Impor & Masukkan ke Tabel"
        )
      )
    )
  );
};


