// Safe Web Worker client manager with automatic timeout and main-thread fallback
import { processAndCropImage3x4 } from '../utils/imageDB';
import { exportToExcelBlob } from '../utils/excelExport';

let imageWorkerInstance: Worker | null = null;
let excelWorkerInstance: Worker | null = null;

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
    const res = await exportToExcelBlob(payload);
    if (!res) throw new Error('Gagal menghasilkan file Excel.');
    return res;
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
          exportToExcelBlob(payload)
            .then((res) => {
              if (!res) throw new Error('Gagal menghasilkan file Excel.');
              resolve(res);
            })
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
      exportToExcelBlob(payload)
        .then((res) => {
          if (!res) throw new Error('Gagal menghasilkan file Excel.');
          resolve(res);
        })
        .catch(reject);
    }, 25000);

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, payload });
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
}

