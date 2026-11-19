import { exportToExcelBlob } from '../utils/excelExport';

interface ExcelWorkerScope {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
}

const workerScope = self as unknown as ExcelWorkerScope;

workerScope.onmessage = async (e: MessageEvent) => {
  const { id, payload } = e.data;

  try {
    const blob = await exportToExcelBlob(payload);
    if (!blob) {
      throw new Error('Gagal menghasilkan file Excel.');
    }

    const arrayBuffer = await blob.arrayBuffer();
    // Transfer arrayBuffer back to main thread with zero copy
    workerScope.postMessage({ id, success: true, buffer: arrayBuffer }, [arrayBuffer]);
  } catch (err: any) {
    workerScope.postMessage({ id, success: false, error: err?.message || 'Excel export worker error' });
  }
};
