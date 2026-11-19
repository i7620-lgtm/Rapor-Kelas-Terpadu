// Safe Web Worker client manager with automatic timeout and main-thread fallback
import { processAndCropImage3x4 } from '../utils/imageDB';
import type { PdfExportProgress, PdfOrientation, VectorPdfPayload } from '../types/pdfExport';

const runExportFallback = async (payload: any): Promise<Blob> => {
  const { exportToExcelBlob } = await import('../utils/excelExport');
  const res = await exportToExcelBlob(payload);
  if (!res) throw new Error('Gagal menghasilkan file Excel.');
  return res;
};

let imageWorkerInstance: Worker | null = null;
let excelWorkerInstance: Worker | null = null;
let pdfWorkerInstance: Worker | null = null;

function getImageWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!imageWorkerInstance) {
    try {
      imageWorkerInstance = new Worker(new URL('./imageWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      console.warn('Failed to initialize imageWorker, will use main-thread fallback:', err);
      imageWorkerInstance = null;
    }
  }
  return imageWorkerInstance;
}

function getExcelWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!excelWorkerInstance) {
    try {
      excelWorkerInstance = new Worker(new URL('./excelWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      console.warn('Failed to initialize excelWorker, will use main-thread fallback:', err);
      excelWorkerInstance = null;
    }
  }
  return excelWorkerInstance;
}

function getPdfWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!pdfWorkerInstance) {
    try {
      pdfWorkerInstance = new Worker(new URL('./pdfWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      console.warn('Failed to initialize pdfWorker, will use fallback:', err);
      pdfWorkerInstance = null;
    }
  }
  return pdfWorkerInstance;
}

function nextRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Off-thread image crop and compression with automatic fallback
 */
export async function processImageWithWorker(
  file: File,
  targetWidth = 354,
  targetHeight = 472,
  quality = 0.9,
  abortSignal?: AbortSignal
): Promise<string> {
  const worker = getImageWorker();

  // If workers or OffscreenCanvas are not supported, use main thread directly
  if (!worker || typeof OffscreenCanvas === 'undefined') {
    return processAndCropImage3x4(file, targetWidth, targetHeight, quality);
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<string>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.removeEventListener('message', handleMessage);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      cleanup();
      reject(new Error('Image processing aborted'));
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.id === id) {
        cleanup();
        if (e.data.success && e.data.dataUrl) {
          resolve(e.data.dataUrl);
        } else {
          // Fallback to main thread
          console.warn('imageWorker reported failure, falling back to main-thread:', e.data.error);
          processAndCropImage3x4(file, targetWidth, targetHeight, quality)
            .then(resolve)
            .catch(reject);
        }
      }
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        return reject(new Error('Image processing aborted'));
      }
      abortSignal.addEventListener('abort', handleAbort);
    }

    // Set 10-second timeout guard
    timeoutId = setTimeout(() => {
      cleanup();
      console.warn('imageWorker timed out (10s), terminating worker and falling back to main-thread');
      try {
        worker.terminate();
        imageWorkerInstance = null;
      } catch (err) {
        console.warn('Failed to terminate imageWorker:', err);
      }
      processAndCropImage3x4(file, targetWidth, targetHeight, quality)
        .then(resolve)
        .catch(reject);
    }, 10000);

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, file, targetWidth, targetHeight, quality });
  });
}

/**
 * Off-thread Excel file generation with automatic fallback
 */
export async function exportExcelWithWorker(
  payload: any,
  abortSignal?: AbortSignal
): Promise<Blob> {
  const worker = getExcelWorker();

  // Fallback to main thread if Worker unavailable
  if (!worker) {
    return runExportFallback(payload);
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<Blob>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.removeEventListener('message', handleMessage);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      cleanup();
      reject(new Error('Excel export aborted'));
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.id === id) {
        cleanup();
        if (e.data.success && e.data.buffer) {
          const blob = new Blob([e.data.buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          resolve(blob);
        } else {
          console.warn('excelWorker reported failure, falling back to main-thread:', e.data.error);
          runExportFallback(payload)
            .then(resolve)
            .catch(reject);
        }
      }
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        return reject(new Error('Excel export aborted'));
      }
      abortSignal.addEventListener('abort', handleAbort);
    }

    // Set 25-second timeout guard
    timeoutId = setTimeout(() => {
      cleanup();
      console.warn('excelWorker timed out (25s), terminating worker and falling back to main-thread');
      try {
        worker.terminate();
        excelWorkerInstance = null;
      } catch (err) {
        console.warn('Failed to terminate excelWorker:', err);
      }
      runExportFallback(payload)
        .then(resolve)
        .catch(reject);
    }, 25000);

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, payload });
  });
}

function sendPdfWorkerRequest<T = any>(
  worker: Worker,
  message: Record<string, any>,
  transferables: Transferable[] = [],
  timeoutMs = 20000
): Promise<T> {
  const id = String(message.id);
  return new Promise<T>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    const handleError = (err: ErrorEvent) => {
      cleanup();
      reject(new Error(err.message || 'PDF Worker error'));
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.id === id && e.data?.type !== 'progress') {
        cleanup();
        if (e.data.success) {
          resolve(e.data as T);
        } else {
          reject(new Error(e.data.error || 'PDF Worker operation failed'));
        }
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      try {
        worker.terminate();
        pdfWorkerInstance = null;
      } catch {
        // ignore
      }
      reject(new Error('PDF Worker timed out'));
    }, timeoutMs);

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    if (transferables.length > 0) {
      worker.postMessage(message, transferables);
    } else {
      worker.postMessage(message);
    }
  });
}

/**
 * Initialize stateful jsPDF assembly session in pdfWorker.
 * Returns false if Web Worker is unavailable in the environment.
 */
export async function initPdfWorkerSession(
  sessionId: string,
  orientation: PdfOrientation,
  formatWidth: number,
  formatHeight: number
): Promise<boolean> {
  const worker = getPdfWorker();
  if (!worker) return false;

  const id = nextRequestId('pdf_init');
  await sendPdfWorkerRequest(worker, {
    id,
    action: 'initSession',
    sessionId,
    orientation,
    formatWidth,
    formatHeight,
  });
  return true;
}

/**
 * Transfer captured page image ArrayBuffer (zero-copy) to pdfWorker session.
 */
export async function addPdfPageWithWorker(
  sessionId: string,
  pageIndex: number,
  imageBuffer: ArrayBuffer,
  imageFormat: 'JPEG' | 'PNG',
  width: number,
  height: number
): Promise<void> {
  const worker = getPdfWorker();
  if (!worker) {
    throw new Error('PDF Worker tidak tersedia.');
  }

  const id = nextRequestId('pdf_page');
  await sendPdfWorkerRequest(
    worker,
    {
      id,
      action: 'addImagePage',
      sessionId,
      pageIndex,
      imageBuffer,
      imageFormat,
      width,
      height,
    },
    [imageBuffer],
    20000
  );
}

/**
 * Finalize stateful jsPDF session in pdfWorker and return PDF Blob.
 */
export async function finalizePdfWorkerSession(sessionId: string): Promise<Blob> {
  const worker = getPdfWorker();
  if (!worker) {
    throw new Error('PDF Worker tidak tersedia.');
  }

  const id = nextRequestId('pdf_fin');
  const res = await sendPdfWorkerRequest<{ success: boolean; pdfBuffer: ArrayBuffer }>(
    worker,
    {
      id,
      action: 'finalizeSession',
      sessionId,
    },
    [],
    45000
  );

  return new Blob([res.pdfBuffer], { type: 'application/pdf' });
}

/**
 * Clean up abandoned stateful PDF session in pdfWorker.
 */
export function abortPdfWorkerSession(sessionId: string): void {
  if (!pdfWorkerInstance || !sessionId) return;
  try {
    pdfWorkerInstance.postMessage({
      id: nextRequestId('pdf_abort'),
      action: 'abortSession',
      sessionId,
    });
  } catch {
    // ignore
  }
}

async function runVectorPdfMainThreadFallback(
  payload: VectorPdfPayload,
  onProgress?: (progress: PdfExportProgress) => void
): Promise<Blob> {
  const { buildVectorPdfArrayBuffer } = await import('./pdfVectorGenerator');
  const buffer = buildVectorPdfArrayBuffer(payload, (current, total, statusText) => {
    onProgress?.({ current, total, statusText });
  });
  return new Blob([buffer], { type: 'application/pdf' });
}

/**
 * Generate pure vector PDF inside pdfWorker (with streaming progress & main-thread fallback).
 */
export async function generateVectorPdfWithWorker(
  payload: VectorPdfPayload,
  onProgress?: (progress: PdfExportProgress) => void
): Promise<Blob> {
  const worker = getPdfWorker();
  if (!worker) {
    return runVectorPdfMainThreadFallback(payload, onProgress);
  }

  const id = nextRequestId('pdf_vec');

  return new Promise<Blob>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cleanup();
        console.warn('pdfWorker vector generation timed out, falling back to main-thread');
        try {
          worker.terminate();
          pdfWorkerInstance = null;
        } catch {
          // ignore
        }
        runVectorPdfMainThreadFallback(payload, onProgress).then(resolve).catch(reject);
      }, 60000);
    };

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    const handleError = (err: ErrorEvent) => {
      cleanup();
      console.warn('pdfWorker error during vector PDF, falling back to main-thread:', err.message);
      try {
        worker.terminate();
        pdfWorkerInstance = null;
      } catch {
        // ignore
      }
      runVectorPdfMainThreadFallback(payload, onProgress).then(resolve).catch(reject);
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.id !== id) return;

      if (e.data.type === 'progress') {
        resetTimeout();
        onProgress?.({
          current: Number(e.data.current ?? 0),
          total: Number(e.data.total ?? 1),
          statusText: String(e.data.statusText ?? 'Membuat PDF vektor...'),
        });
        return;
      }

      cleanup();
      if (e.data.success && e.data.pdfBuffer) {
        resolve(new Blob([e.data.pdfBuffer], { type: 'application/pdf' }));
      } else {
        console.warn('pdfWorker vector generation failed, falling back to main-thread:', e.data.error);
        runVectorPdfMainThreadFallback(payload, onProgress).then(resolve).catch(reject);
      }
    };

    resetTimeout();
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage({ id, action: 'generateVectorPdf', payload });
  });
}

/**
 * Terminate all active worker instances (safe cleanup)
 */
export function terminateAllWorkers(): void {
  if (imageWorkerInstance) {
    try {
      imageWorkerInstance.terminate();
    } catch {
      // ignore
    }
    imageWorkerInstance = null;
  }
  if (excelWorkerInstance) {
    try {
      excelWorkerInstance.terminate();
    } catch {
      // ignore
    }
    excelWorkerInstance = null;
  }
  if (pdfWorkerInstance) {
    try {
      pdfWorkerInstance.terminate();
    } catch {
      // ignore
    }
    pdfWorkerInstance = null;
  }
}
