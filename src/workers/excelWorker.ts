import { exportToExcelBlob } from '../utils/excelExport';

self.onmessage = async (e: MessageEvent) => {
  const { id, payload } = e.data;

  try {
    const blob = await exportToExcelBlob(payload);
    if (!blob) {
      throw new Error('Gagal menghasilkan file Excel.');
    }

    const arrayBuffer = await blob.arrayBuffer();
    // Transfer arrayBuffer back to main thread with zero copy
    self.postMessage({ id, success: true, buffer: arrayBuffer }, [arrayBuffer]);
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || 'Excel export worker error' });
  }
};
