import { useState, useEffect, useRef } from 'react';
import * as Tesseract from "tesseract.js";

export function useOfflineOcrAssistantLogic(
    isOpen: boolean,
    onClose: () => void,
    onApply: (judulBab: string, tps: string[]) => void,
    imageSrc: string | null,
    detectedLines: string[],
    isRunningOcr: boolean,
    showToast: (msg: string, type: string) => void
) {
    const [judulBab, setJudulBab] = useState("");
    const [tps, setTps] = useState<string[]>([]);
    const [localLines, setLocalLines] = useState<string[]>([]);

    const [cropRole, setCropRole] = useState("none"); // "none" | "bab" | "tp"
    const [isAnalyzingCrop, setIsAnalyzingCrop] = useState(false);
    const [isFullOcrRunning, setIsFullOcrRunning] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);

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

    const handleAddTpManual = () => {
        setTps(prev => [...prev, ""]);
    };

    const handleUpdateTpText = (index: number, val: string) => {
        setTps(prev => {
            const next = [...prev];
            next[index] = val;
            return next;
        });
    };

    const handleRemoveTp = (index: number) => {
        setTps(prev => prev.filter((_, i) => i !== index));
    };

    const setAsJudulBab = (text: string) => {
        if (!text || !text.trim()) return;
        setJudulBab(text.trim());
        showToast("Berhasil diatur sebagai Judul Bab!", "success");
    };

    const addAsTp = (text: string) => {
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

    const processCroppedOcr = async (x1: number, y1: number, x2: number, y2: number, role: string) => {
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
            if(ctx) ctx.drawImage(imgEl, px, py, pw, ph, 0, 0, pw, ph);
            
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
                imgEl.src = imageSrc || "";
            }
            
            const width = imgEl.naturalWidth || 1500;
            const height = imgEl.naturalHeight || 2000;
            
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if(ctx) {
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
            }
            
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

    return {
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
    };
}
