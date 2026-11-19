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
    ocrStatus,
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

  const showStatusBanner =
    ocrStatus.phase === 'downloading' ||
    ocrStatus.phase === 'initializing' ||
    ocrStatus.phase === 'recognizing' ||
    ocrStatus.phase === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 text-slate-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92dvh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-start sm:items-center justify-between gap-3 bg-slate-950 rounded-t-xl flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Asisten Input Gambar Offline (Penyunting Visual)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur mode sorot manual di bawah gambar acuan, lalu seret kotak langsung ke area bab/TP pada gambar untuk mengambil teks otomatis secara rapi.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-white hover:bg-slate-800 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center px-3 py-1.5 rounded-full transition-all text-xl font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Transparent OCR Asset Download / Initialization Banner */}
        {showStatusBanner && (
          <div
            className={`mx-4 mt-3 px-4 py-3 rounded-lg border flex flex-col gap-1.5 flex-shrink-0 ${
              ocrStatus.phase === 'error'
                ? 'bg-red-950/60 border-red-800 text-red-100'
                : 'bg-indigo-950/60 border-indigo-800/80 text-indigo-100'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold">
                {ocrStatus.message}
              </span>
              {ocrStatus.phase !== 'error' && (
                <span className="text-xs font-mono tabular-nums font-bold text-indigo-300 shrink-0">
                  {ocrStatus.progress}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ocrStatus.detail}
            </p>
            {ocrStatus.phase !== 'error' && (
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${ocrStatus.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Column: Visual Image Previewer & Cropping Canvas */}
          <OcrImagePreviewAndCropper
            imageSrc={imageSrc}
            cropRole={cropRole}
            setCropRole={setCropRole}
            isAnalyzingCrop={isAnalyzingCrop}
            onCropComplete={processCroppedOcr}
            imageRef={imageRef}
            showToast={showToast}
          />

          {/* Right Column: Full Scan Results & Live draft editors */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
            <OcrFullScanResults
              localLines={localLines}
              setLocalLines={setLocalLines}
              isRunningOcr={isRunningOcr}
              isFullOcrRunning={isFullOcrRunning}
              runFullOcr={runFullOcr}
              setAsJudulBab={setAsJudulBab}
              addAsTp={addAsTp}
            />
            <OcrDraftEditor
              judulBab={judulBab}
              setJudulBab={setJudulBab}
              tps={tps}
              handleUpdateTpText={handleUpdateTpText}
              handleRemoveTp={handleRemoveTp}
              handleAddTpManual={handleAddTpManual}
              handleClear={handleClear}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-slate-950 rounded-b-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-5 py-2 min-h-[44px] lg:min-h-0 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg active:bg-indigo-700 transition-colors cursor-pointer"
          >
            Impor &amp; Masukkan ke Tabel
          </button>
        </div>
      </div>
    </div>
  );
};
