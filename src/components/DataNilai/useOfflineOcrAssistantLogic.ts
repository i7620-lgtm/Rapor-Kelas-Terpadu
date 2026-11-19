import { useState, useEffect, useRef, useCallback } from 'react';

export interface OcrEngineStatus {
  phase: 'idle' | 'downloading' | 'initializing' | 'recognizing' | 'ready' | 'error';
  progress: number;
  isFirstTimeDownload: boolean;
  message: string;
  detail: string;
}

const IDLE_OCR_STATUS: OcrEngineStatus = {
  phase: 'idle',
  progress: 0,
  isFirstTimeDownload: false,
  message: '',
  detail: '',
};

async function checkIsFirstTimeOcrDownload(): Promise<boolean> {
  if (typeof caches === 'undefined') return true;
  try {
    const [indMatch, engMatch] = await Promise.all([
      caches.match('/tesseract/ind.traineddata.gz'),
      caches.match('/tesseract/eng.traineddata.gz'),
    ]);
    return !(indMatch && engMatch);
  } catch {
    return true;
  }
}

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
  const [ocrStatus, setOcrStatus] = useState<OcrEngineStatus>(IDLE_OCR_STATUS);

  const imageRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef(true);
  const activeWorkerRef = useRef<any>(null);
  const workerPromiseRef = useRef<Promise<any> | null>(null);
  const isFirstTimeRef = useRef(false);

  const terminateActiveWorker = useCallback(async () => {
    workerPromiseRef.current = null;
    if (activeWorkerRef.current) {
      const workerToStop = activeWorkerRef.current;
      activeWorkerRef.current = null;
      try {
        await workerToStop.terminate();
      } catch (e) {
        console.warn("Failed to terminate OCR worker:", e);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      terminateActiveWorker();
    };
  }, [terminateActiveWorker]);

  useEffect(() => {
    if (isOpen) {
      setJudulBab("");
      setTps([]);
      setLocalLines([...detectedLines]);
      setCropRole("none");
      setIsAnalyzingCrop(false);
      setIsFullOcrRunning(false);
      setOcrStatus(IDLE_OCR_STATUS);
    } else {
      terminateActiveWorker();
    }
  }, [isOpen, detectedLines, terminateActiveWorker]);

  const handleLoggerUpdate = useCallback((m: { status?: string; progress?: number }) => {
    if (!isMountedRef.current || !m?.status) return;
    const pct = typeof m.progress === 'number' ? Math.max(0, Math.min(100, Math.round(m.progress * 100))) : 0;
    const isFirst = isFirstTimeRef.current;

    if (m.status.includes('loading tesseract core')) {
      setOcrStatus({
        phase: isFirst ? 'downloading' : 'initializing',
        progress: pct,
        isFirstTimeDownload: isFirst,
        message: isFirst
          ? 'Mengunduh Mesin Pengenalan Teks Offline...'
          : 'Memuat Mesin OCR dari Penyimpanan Lokal...',
        detail: isFirst
          ? 'Unduhan sekali saja (~18 MB total) untuk menyiapkan mesin pengenal teks agar fitur scan gambar buku/TP dapat bekerja 100% offline tanpa kuota internet.'
          : 'Memuat komponen WebAssembly dari cache perangkat.',
      });
    } else if (m.status.includes('loading language traineddata')) {
      setOcrStatus({
        phase: isFirst ? 'downloading' : 'initializing',
        progress: pct,
        isFirstTimeDownload: isFirst,
        message: isFirst
          ? 'Mengunduh Kamus Bahasa Indonesia & Inggris untuk OCR...'
          : 'Memuat Kamus Bahasa Indonesia & Inggris dari Cache...',
        detail: isFirst
          ? 'Model bahasa ini disimpan di perangkat Anda agar pembacaan teks dokumen sekolah tetap akurat saat offline.'
          : 'Membaca kamus bahasa lokal yang sudah tersimpan.',
      });
    } else if (m.status.includes('initializing tesseract') || m.status.includes('initializing api')) {
      setOcrStatus({
        phase: 'initializing',
        progress: pct,
        isFirstTimeDownload: isFirst,
        message: 'Menyiapkan Mesin OCR Offline...',
        detail: 'Mesin akan tetap aktif selama jendela ini terbuka agar sorotan berikutnya berjalan instan.',
      });
    } else if (m.status.includes('recognizing text')) {
      setOcrStatus({
        phase: 'recognizing',
        progress: pct,
        isFirstTimeDownload: false,
        message: `Membaca Teks pada Gambar (${pct}%)`,
        detail: 'Mengekstrak teks secara lokal langsung di perangkat Anda.',
      });
    }
  }, []);

  const getOrCreateWorker = useCallback(async () => {
    if (activeWorkerRef.current) {
      return activeWorkerRef.current;
    }
    if (workerPromiseRef.current) {
      return workerPromiseRef.current;
    }

    const initPromise = (async () => {
      const isFirst = await checkIsFirstTimeOcrDownload();
      isFirstTimeRef.current = isFirst;

      if (isMountedRef.current) {
        setOcrStatus({
          phase: isFirst ? 'downloading' : 'initializing',
          progress: 5,
          isFirstTimeDownload: isFirst,
          message: isFirst
            ? 'Mengunduh File OCR Offline (Hanya Pertama Kali)...'
            : 'Menyiapkan Mesin OCR Offline...',
          detail: isFirst
            ? 'Mengunduh modul pengenal teks & kamus Bahasa Indonesia/Inggris agar fitur scan foto dapat digunakan tanpa internet pada pemakaian berikutnya.'
            : 'Memuat modul pengenal teks yang sudah tersimpan di cache perangkat.',
        });
      }

      const Tesseract = await import("tesseract.js");
      const origin = window.location.origin;
      const worker = await Tesseract.createWorker('ind+eng', 1, {
        workerPath: `${origin}/tesseract/worker.min.js`,
        corePath: `${origin}/tesseract/tesseract-core.wasm.js`,
        langPath: `${origin}/tesseract`,
        workerBlobURL: false,
        logger: handleLoggerUpdate,
      });

      if (!isMountedRef.current) {
        await worker.terminate();
        return null;
      }

      activeWorkerRef.current = worker;
      isFirstTimeRef.current = false;
      return worker;
    })();

    workerPromiseRef.current = initPromise;
    try {
      const worker = await initPromise;
      return worker;
    } catch (err) {
      workerPromiseRef.current = null;
      throw err;
    }
  }, [handleLoggerUpdate]);

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

  const handleOcrError = useCallback(async (err: unknown, fallbackToast: string) => {
    console.error("Offline OCR error:", err);
    await terminateActiveWorker();
    if (!isMountedRef.current) return;

    const firstTimeOffline = typeof navigator !== 'undefined' && !navigator.onLine && (await checkIsFirstTimeOcrDownload());
    if (firstTimeOffline) {
      const msg = "Modul OCR belum pernah diunduh sebelumnya. Hubungkan internet sebentar untuk mengunduh kamus OCR sekali saja, lalu fitur dapat digunakan 100% offline.";
      setOcrStatus({
        phase: 'error',
        progress: 0,
        isFirstTimeDownload: true,
        message: 'Modul OCR Offline Belum Tersedia di Perangkat',
        detail: msg,
      });
      showToast(msg, "error");
    } else {
      setOcrStatus({
        phase: 'error',
        progress: 0,
        isFirstTimeDownload: false,
        message: 'Gagal memproses pengenalan teks',
        detail: fallbackToast,
      });
      showToast(fallbackToast, "error");
    }
  }, [showToast, terminateActiveWorker]);

  const processCroppedOcr = async (x1: number, y1: number, x2: number, y2: number, role: string) => {
    if (!imageRef.current || isAnalyzingCrop || isFullOcrRunning) return;
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
      if (ctx) ctx.drawImage(imgEl, px, py, pw, ph, 0, 0, pw, ph);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );
      if (!blob) {
        if (isMountedRef.current) setIsAnalyzingCrop(false);
        return;
      }

      const worker = await getOrCreateWorker();
      if (!worker || !isMountedRef.current) return;

      const ret = await worker.recognize(blob);
      if (!isMountedRef.current) return;

      setOcrStatus({
        phase: 'ready',
        progress: 100,
        isFirstTimeDownload: false,
        message: 'Mesin OCR offline siap digunakan',
        detail: 'Anda dapat menyorot area lain secara langsung tanpa mengunduh ulang.',
      });

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
      await handleOcrError(err, "Terjadi kesalahan pengolahan gambar offline.");
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzingCrop(false);
      }
    }
  };

  const runFullOcr = async () => {
    if (isFullOcrRunning || isAnalyzingCrop) return;
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
      if (ctx) {
        ctx.drawImage(imgEl, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let totalLuma = 0;
        const numPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgLuma = totalLuma / numPixels;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          let val = 255;
          if (luma < avgLuma * 0.88) {
            val = Math.max(0, Math.round((luma / avgLuma) * 110 - 15));
          }
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );

      const worker = await getOrCreateWorker();
      if (!worker || !isMountedRef.current) return;

      const ret = await worker.recognize(blob || canvas);
      if (!isMountedRef.current) return;

      setOcrStatus({
        phase: 'ready',
        progress: 100,
        isFirstTimeDownload: false,
        message: 'Mesin OCR offline siap digunakan',
        detail: 'Pemindaian selesai dan modul OCR telah tersimpan untuk penggunaan offline.',
      });

      const text = ret.data.text || "";
      const rawLines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 2);
      const cleanedLines = rawLines
        .map((line: string) =>
          line
            .replace(/[|❑■●○•♦❖✿/_\\°©®()[\]{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter((line: string) => line.length > 2);
      setLocalLines(cleanedLines);
      showToast("Selesai memindai! Potongan kalimat teks berhasil diekstrak.", "success");
    } catch (err) {
      await handleOcrError(err, "Gagal memproses gambar untuk scan otomatis.");
    } finally {
      if (isMountedRef.current) {
        setIsFullOcrRunning(false);
      }
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
    runFullOcr,
  };
}
