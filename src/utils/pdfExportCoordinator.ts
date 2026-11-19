import type {
  PdfExportProgress,
  PdfOrientation,
  ResolvedPdfImage,
  VectorPdfPayload,
} from '../types/pdfExport';
import {
  abortPdfWorkerSession,
  addPdfPageWithWorker,
  finalizePdfWorkerSession,
  generateVectorPdfWithWorker,
  initPdfWorkerSession,
} from '../workers/workerManager';

let cachedFontCss: string | null = null;
let inFlightFontCssPromise: Promise<string> | null = null;

async function getCachedFontEmbedCSS(loader: () => Promise<string>): Promise<string> {
  if (cachedFontCss !== null) {
    return cachedFontCss;
  }
  if (inFlightFontCssPromise) {
    return inFlightFontCssPromise;
  }

  inFlightFontCssPromise = (async () => {
    try {
      const css = await loader();
      if (css) {
        cachedFontCss = css;
      }
      return css || '';
    } catch {
      return '';
    } finally {
      inFlightFontCssPromise = null;
    }
  })();

  return inFlightFontCssPromise;
}

function downloadBlobFile(blob: Blob, fileName: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 15000);
}

function base64DataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64Index = dataUrl.indexOf(',');
  const base64 = base64Index >= 0 ? dataUrl.slice(base64Index + 1) : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function canvasToJpegArrayBuffer(canvas: HTMLCanvasElement, quality = 0.96): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
    } catch {
      resolve(null);
    }
  });

  if (blob) {
    return blob.arrayBuffer();
  }

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return base64DataUrlToArrayBuffer(dataUrl);
}

async function convertBlobToPngDataUrl(blob: Blob): Promise<string | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return null;
  const objUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode error'));
      el.src = objUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, img.naturalWidth || img.width || 200);
    canvas.height = Math.max(1, img.naturalHeight || img.height || 200);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

export async function resolveImageForVectorPdf(
  src: string | undefined | null
): Promise<ResolvedPdfImage | null> {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/png')) {
    return { data: trimmed, format: 'PNG' };
  }
  if (trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg')) {
    return { data: trimmed, format: 'JPEG' };
  }

  try {
    const response = await fetch(trimmed);
    if (!response.ok) return null;
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { data: bytes, format: 'PNG' };
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { data: bytes, format: 'JPEG' };
    }

    const pngDataUrl = await convertBlobToPngDataUrl(blob);
    if (pngDataUrl) {
      return { data: pngDataUrl, format: 'PNG' };
    }
    return null;
  } catch {
    return null;
  }
}

function waitTwoAnimationFrames(): Promise<void> {
  if (typeof requestAnimationFrame === 'undefined') {
    return new Promise((resolve) => setTimeout(resolve, 32));
  }
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export interface HybridPdfExportOptions {
  pages: HTMLElement[];
  widthPx: number;
  heightPx: number;
  formatWidth: number;
  formatHeight: number;
  orientation: PdfOrientation;
  fileName: string;
  loadFontEmbedCSS: () => Promise<string>;
  pageLabelSingular: string;
  onProgress: (progress: PdfExportProgress) => void;
  isMounted?: () => boolean;
  prepareVectorPayload: () => Promise<VectorPdfPayload>;
}

export interface HybridPdfExportResult {
  aborted: boolean;
  usedVectorFallback: boolean;
}

export async function runHybridPdfExportWithFallback(
  options: HybridPdfExportOptions
): Promise<HybridPdfExportResult> {
  const {
    pages,
    widthPx,
    heightPx,
    formatWidth,
    formatHeight,
    orientation,
    fileName,
    loadFontEmbedCSS,
    pageLabelSingular,
    onProgress,
    isMounted,
    prepareVectorPayload,
  } = options;

  const checkMounted = () => (isMounted ? isMounted() : true);
  const totalPages = pages.length;
  const sessionId = `pdf_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    onProgress({
      current: 0,
      total: totalPages,
      statusText: 'Mempersiapkan modul PDF & worker latar belakang...',
    });

    const [htmlToImage, fontEmbedCSSStr, workerInitialized] = await Promise.all([
      import('html-to-image'),
      getCachedFontEmbedCSS(loadFontEmbedCSS),
      initPdfWorkerSession(sessionId, orientation, formatWidth, formatHeight),
      typeof document !== 'undefined' && document.fonts?.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve(),
    ]);

    if (!checkMounted()) {
      abortPdfWorkerSession(sessionId);
      return { aborted: true, usedVectorFallback: false };
    }

    let fallbackMainThreadPdf: any = null;
    if (!workerInitialized) {
      const { jsPDF } = await import('jspdf');
      fallbackMainThreadPdf = new jsPDF({
        orientation,
        unit: 'cm',
        format: [formatWidth, formatHeight],
      });
    }

    for (let i = 0; i < totalPages; i++) {
      if (!checkMounted()) {
        abortPdfWorkerSession(sessionId);
        return { aborted: true, usedVectorFallback: false };
      }

      onProgress({
        current: i,
        total: totalPages,
        statusText: `Mengonversi ${pageLabelSingular} ${i + 1} dari ${totalPages} (hibrida worker)...`,
      });

      const node = pages[i];
      const originalStyle = {
        transform: node.style.transform,
        width: node.style.width,
        height: node.style.height,
        position: node.style.position,
        left: node.style.left,
        top: node.style.top,
        zIndex: node.style.zIndex,
      };

      let imageBuffer: ArrayBuffer;
      try {
        node.style.transform = 'none';
        node.style.width = `${widthPx}px`;
        node.style.height = `${heightPx}px`;
        node.style.position = 'absolute';
        node.style.left = '0px';
        node.style.top = '0px';
        node.style.zIndex = '-9999';

        await waitTwoAnimationFrames();

        const canvas = await htmlToImage.toCanvas(node, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          fontEmbedCSS: fontEmbedCSSStr,
          style: {
            margin: '0',
          },
        });

        try {
          imageBuffer = await canvasToJpegArrayBuffer(canvas, 0.96);
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      } finally {
        node.style.transform = originalStyle.transform;
        node.style.width = originalStyle.width;
        node.style.height = originalStyle.height;
        node.style.position = originalStyle.position;
        node.style.left = originalStyle.left;
        node.style.top = originalStyle.top;
        node.style.zIndex = originalStyle.zIndex;
      }

      if (!checkMounted()) {
        abortPdfWorkerSession(sessionId);
        return { aborted: true, usedVectorFallback: false };
      }

      if (workerInitialized) {
        await addPdfPageWithWorker(sessionId, i, imageBuffer, 'JPEG', formatWidth, formatHeight);
      } else if (fallbackMainThreadPdf) {
        if (i > 0) {
          fallbackMainThreadPdf.addPage([formatWidth, formatHeight], orientation);
        }
        fallbackMainThreadPdf.addImage(
          new Uint8Array(imageBuffer),
          'JPEG',
          0,
          0,
          formatWidth,
          formatHeight,
          undefined,
          'FAST'
        );
      }

      // Brief yield to keep modal progress responsive between pages
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (!checkMounted()) {
      abortPdfWorkerSession(sessionId);
      return { aborted: true, usedVectorFallback: false };
    }

    onProgress({
      current: totalPages,
      total: totalPages,
      statusText: 'Merakit & menyimpan file PDF...',
    });

    if (workerInitialized) {
      const pdfBlob = await finalizePdfWorkerSession(sessionId);
      if (!checkMounted()) {
        return { aborted: true, usedVectorFallback: false };
      }
      downloadBlobFile(pdfBlob, fileName);
    } else if (fallbackMainThreadPdf) {
      const pdfBuffer = fallbackMainThreadPdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      downloadBlobFile(pdfBlob, fileName);
    }

    return { aborted: false, usedVectorFallback: false };
  } catch (hybridErr) {
    abortPdfWorkerSession(sessionId);
    console.warn('Hybrid PDF export failed, switching to pure vector Web Worker fallback:', hybridErr);

    if (!checkMounted()) {
      return { aborted: true, usedVectorFallback: false };
    }

    onProgress({
      current: 0,
      total: Math.max(1, totalPages),
      statusText: 'Konversi gambar terkendala, membuat PDF vektor murni di worker...',
    });

    const vectorPayload = await prepareVectorPayload();
    if (!checkMounted()) {
      return { aborted: true, usedVectorFallback: false };
    }

    const vectorBlob = await generateVectorPdfWithWorker(vectorPayload, (prog) => {
      if (checkMounted()) {
        onProgress(prog);
      }
    });

    if (!checkMounted()) {
      return { aborted: true, usedVectorFallback: false };
    }

    downloadBlobFile(vectorBlob, fileName);
    return { aborted: false, usedVectorFallback: true };
  }
}
