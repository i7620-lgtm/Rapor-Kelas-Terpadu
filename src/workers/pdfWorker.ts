import { jsPDF } from 'jspdf';
import { buildVectorPdfArrayBuffer } from './pdfVectorGenerator';
import type { PdfOrientation, VectorPdfPayload } from '../types/pdfExport';

interface PdfWorkerSession {
  pdf: jsPDF;
  orientation: PdfOrientation;
  formatWidth: number;
  formatHeight: number;
}

const sessions = new Map<string, PdfWorkerSession>();

self.onmessage = (e: MessageEvent) => {
  const { id, action } = e.data || {};
  if (!id || !action) return;

  try {
    if (action === 'initSession') {
      const { sessionId, orientation, formatWidth, formatHeight } = e.data;
      const pdf = new jsPDF({
        orientation,
        unit: 'cm',
        format: [formatWidth, formatHeight],
      });
      sessions.set(sessionId, {
        pdf,
        orientation,
        formatWidth,
        formatHeight,
      });
      self.postMessage({ id, success: true });
      return;
    }

    if (action === 'addImagePage') {
      const { sessionId, pageIndex, imageBuffer, imageFormat, width, height } = e.data;
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error(`PDF session '${sessionId}' not found`);
      }

      if (pageIndex > 0) {
        session.pdf.addPage([width, height], session.orientation);
      }
      const bytes = new Uint8Array(imageBuffer as ArrayBuffer);
      session.pdf.addImage(bytes, imageFormat || 'JPEG', 0, 0, width, height, undefined, 'FAST');
      self.postMessage({ id, success: true });
      return;
    }

    if (action === 'finalizeSession') {
      const { sessionId } = e.data;
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error(`PDF session '${sessionId}' not found`);
      }
      const pdfBuffer = session.pdf.output('arraybuffer');
      sessions.delete(sessionId);
      (self as any).postMessage({ id, success: true, pdfBuffer }, [pdfBuffer]);
      return;
    }

    if (action === 'abortSession') {
      const { sessionId } = e.data;
      if (sessionId) {
        sessions.delete(sessionId);
      }
      self.postMessage({ id, success: true });
      return;
    }

    if (action === 'generateVectorPdf') {
      const payload = e.data.payload as VectorPdfPayload;
      const pdfBuffer = buildVectorPdfArrayBuffer(payload, (current, total, statusText) => {
        self.postMessage({
          id,
          type: 'progress',
          current,
          total,
          statusText,
        });
      });
      (self as any).postMessage({ id, success: true, pdfBuffer }, [pdfBuffer]);
      return;
    }

    self.postMessage({ id, success: false, error: `Unknown PDF worker action: ${action}` });
  } catch (err: any) {
    if (e.data?.sessionId) {
      sessions.delete(e.data.sessionId);
    }
    self.postMessage({
      id,
      success: false,
      error: err?.message || String(err),
    });
  }
};
