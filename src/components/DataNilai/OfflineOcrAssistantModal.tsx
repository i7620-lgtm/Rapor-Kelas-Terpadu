import React, { useState, useEffect, useRef } from "react";
import * as Tesseract from "tesseract.js";
import { OcrImagePreviewAndCropper } from "./OcrImagePreviewAndCropper";
import { OcrFullScanResults } from "./OcrFullScanResults";
import { OcrDraftEditor } from "./OcrDraftEditor";



export const OfflineOcrAssistantModal = ({
  isOpen,
  onClose,
  onApply,
  imageSrc,
  detectedLines,
  isRunningOcr,
  showToast
}) => {
  const [judulBab, setJudulBab] = useState("");
  const [tps, setTps] = useState([]);
  const [localLines, setLocalLines] = useState([]);

  // New cropping & interactive selection helper states
  const [cropRole, setCropRole] = useState("none"); // "none" | "bab" | "tp"
  const [isAnalyzingCrop, setIsAnalyzingCrop] = useState(false);
  const [isFullOcrRunning, setIsFullOcrRunning] = useState(false);

  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setJudulBab("");
      setTps([]);
      setLocalLines([...detectedLines]);
      setCropRole("none");
      setIsAnalyzingCrop(false);
      setIsFullOcrRunning(false);
    }
  }, [isOpen, detectedLines]);

  if (!isOpen) return null;

  const handleAddTpManual = () => {
    setTps(prev => [...prev, ""]);
  };

  const handleUpdateTpText = (index, val) => {
    setTps(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveTp = (index) => {
    setTps(prev => prev.filter((_, i) => i !== index));
  };

  const setAsJudulBab = (text) => {
    if (!text || !text.trim()) return;
    setJudulBab(text.trim());
    showToast("Berhasil diatur sebagai Judul Bab!", "success");
  };

  const addAsTp = (text) => {
    if (!text || !text.trim()) return;
    setTps(prev => [...prev, text.trim()]);
    showToast("Berhasil ditambahkan ke daftar TP!", "success");
  };

  const handleClear = () => {
    setJudulBab("");
    setTps([]);
  };

  const handleSubmit = () => {
    if (!judulBab.trim()) {
      showToast("Judul Bab tidak boleh kosong.", "error");
      return;
    }
    const filteredTps = tps.map(t => t.trim()).filter(t => t.length > 0);
    if (filteredTps.length === 0) {
      showToast("Tambahkan minimal 1 Tujuan Pembelajaran (TP).", "error");
      return;
    }
    onApply(judulBab.trim(), filteredTps);
    onClose();
  };

  const processCroppedOcr = async (x1, y1, x2, y2, role) => {
    if (!imageRef.current) return;
    const imgEl = imageRef.current;
    
    const nw = imgEl.naturalWidth;
    const nh = imgEl.naturalHeight;
    
    const px = Math.min(x1, x2) * nw;
    const py = Math.min(y1, y2) * nh;
    const pw = Math.abs(x1 - x2) * nw;
    const ph = Math.abs(y1 - y2) * nh;
    
    if (pw < 8 || ph < 8) return;
    
    setIsAnalyzingCrop(true);
    showToast("Mengekstrak teks daerah sorotan...", "info");
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = pw;
      canvas.height = ph;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgEl, px, py, pw, ph, 0, 0, pw, ph);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsAnalyzingCrop(false);
          return;
        }
        try {
          const origin = window.location.origin;
          const worker = await Tesseract.createWorker('ind+eng', 1, {
            workerPath: `${origin}/tesseract/worker.min.js`,
            corePath: `${origin}/tesseract/tesseract-core.wasm.js`,
            langPath: `${origin}/tesseract`,
            workerBlobURL: false,
          });

          const ret = await worker.recognize(blob);
          await worker.terminate();

          const text = (ret.data.text || "")
            .replace(/[|❑■●○•♦❖✿/_\\°©®()[\]{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (!text) {
            showToast("Teks tidak terdeteksi di area ini. Coba perbesar area sorotan.", "warning");
          } else {
            if (role === "bab") {
              setJudulBab(text);
              showToast("Judul Bab diisi dari sorotan gambar!", "success");
            } else if (role === "tp") {
              setTps(prev => [...prev, text]);
              showToast("Tujuan Pembelajaran (TP) ditambahkan dari sorotan gambar!", "success");
            }
          }
        } catch (err) {
          console.error("Local Cropped OCR error:", err);
          showToast("Terjadi kesalahan pengolahan gambar offline.", "error");
        } finally {
          setIsAnalyzingCrop(false);
        }
      }, "image/jpeg", 0.95);
    } catch (cropErr) {
      console.error(cropErr);
      setIsAnalyzingCrop(false);
      showToast("Gagal memotong area gambar.", "error");
    }
  };

  const runFullOcr = async () => {
    if (isFullOcrRunning) return;
    setIsFullOcrRunning(true);
    showToast("Memproses OCR offline seluruh gambar, harap tunggu...", "info");
    
    try {
      const imgEl = imageRef.current || new Image();
      if (!imgEl.src) {
        imgEl.src = imageSrc;
      }
      
      const width = imgEl.naturalWidth || 1500;
      const height = imgEl.naturalHeight || 2000;
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgEl, 0, 0, width, height);
      
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      let totalLuma = 0;
      const numPixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      }
      const avgLuma = totalLuma / numPixels;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        let val = 255;
        if (luma < avgLuma * 0.88) {
          val = Math.max(0, Math.round((luma / avgLuma) * 110 - 15));
        } else {
          val = 255;
        }
        data[i] = val;
        data[i+1] = val;
        data[i+2] = val;
      }
      ctx.putImageData(imgData, 0, 0);
      
      canvas.toBlob(async (blob) => {
        try {
          const origin = window.location.origin;
          const worker = await Tesseract.createWorker('ind+eng', 1, {
            workerPath: `${origin}/tesseract/worker.min.js`,
            corePath: `${origin}/tesseract/tesseract-core.wasm.js`,
            langPath: `${origin}/tesseract`,
            workerBlobURL: false,
          });

          const ret = await worker.recognize(blob || canvas);
          await worker.terminate();

          const text = ret.data.text || "";
          const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
          const cleanedLines = rawLines.map(line => {
            return line
              .replace(/[|❑■●○•♦❖✿/_\\°©®()[\]{}]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          }).filter(line => line.length > 2);

          setLocalLines(cleanedLines);
          showToast("Selesai memindai! Potongan kalimat teks berhasil diekstrak.", "success");
        } catch (err) {
          console.error("Full scan error:", err);
          showToast("Gagal memindai gambar otomatis.", "error");
        } finally {
          setIsFullOcrRunning(false);
        }
      }, "image/jpeg", 0.95);
    } catch (err) {
      console.error(err);
      showToast("Gagal memproses gambar untuk scan otomatis.", "error");
      setIsFullOcrRunning(false);
    }
  };

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


