import React, { useCallback } from 'react';
import { usePrintStore } from '../../stores/usePrintStore';
import { PAPER_SIZES } from './raporUtils';

interface PrintControlPanelProps {
  students: any[];
  isMobileDevice: boolean;
  isFaseA: boolean;
  handleDownloadPDF: () => void;
  handlePrint: () => void;
}

export const PrintControlPanel: React.FC<PrintControlPanelProps> = ({
  students,
  isMobileDevice,
  isFaseA,
  handleDownloadPDF,
  handlePrint,
}) => {
  const {
    paperSize,
    setPaperSize,
    selectedStudentId,
    setSelectedStudentId,
    rankingOption,
    setRankingOption,
    selectedPages,
    setSelectedPages,
    hideGradesForFaseA,
    setHideGradesForFaseA,
    printOptions,
    setPrintOptions,
    isPrinting,
  } = usePrintStore();

  const handlePageSelectionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name === 'all') {
      setSelectedPages({
        cover: checked,
        schoolIdentity: checked,
        studentIdentity: checked,
        academic: checked,
      });
    } else {
      setSelectedPages({ [name]: checked });
    }
  }, [setSelectedPages]);

  const handlePrintOptionChange = (key: 'showPrincipalSignature' | 'showTeacherSignature') => {
    setPrintOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const pageCheckboxes = [
    { key: 'cover', label: 'Sampul' },
    { key: 'schoolIdentity', label: 'Identitas Sekolah' },
    { key: 'studentIdentity', label: 'Identitas Murid' },
    { key: 'academic', label: 'Laporan Hasil Belajar' },
  ];

  const allSelected = Object.values(selectedPages).every(Boolean);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cetak Rapor</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk mencetak.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="rankingSelector" className="block text-sm font-medium text-slate-700 mb-1">
              Tampilkan Peringkat
            </label>
            <select
              id="rankingSelector"
              value={rankingOption}
              onChange={(e) => setRankingOption(e.target.value)}
              className="w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="none">Tidak Tampilkan</option>
              <option value="top3">Peringkat 1-3</option>
              <option value="top10">Peringkat 1-10</option>
            </select>
          </div>
          <div>
            <label htmlFor="studentSelector" className="block text-sm font-medium text-slate-700 mb-1">
              Pilih Murid
            </label>
            <select
              id="studentSelector"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Cetak Semua Murid</option>
              {students.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.namaLengkap}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paperSizeSelector" className="block text-sm font-medium text-slate-700 mb-1">
              Ukuran Kertas
            </label>
            <select
              id="paperSizeSelector"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.keys(PAPER_SIZES).map((key) => (
                <option key={key} value={key}>
                  {`${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`}
                </option>
              ))}
            </select>
          </div>
          {isMobileDevice ? (
            <button
              onClick={handleDownloadPDF}
              disabled={isPrinting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPrinting ? 'Mempersiapkan...' : 'Unduh PDF'}
            </button>
          ) : (
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPrinting ? 'Mempersiapkan...' : 'Cetak Rapor (Print)'}
            </button>
          )}
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="flex flex-wrap items-start gap-x-12 gap-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Pilih Halaman:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="all"
                  checked={allSelected === true || allSelected === 'true'}
                  onChange={handlePageSelectionChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm font-bold">Pilih Semua</span>
              </label>
              {pageCheckboxes.map((page) => (
                <label key={page.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={page.key}
                    checked={(selectedPages as any)[page.key] === true || (selectedPages as any)[page.key] === 'true'}
                    onChange={handlePageSelectionChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm">{page.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pl-0 sm:pl-6 border-l-0 sm:border-l mt-4 sm:mt-0">
            <p className="text-sm font-medium text-slate-700 mb-2">Opsi Tanda Tangan:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printOptions.showPrincipalSignature === true || printOptions.showPrincipalSignature === 'true'}
                  onChange={() => handlePrintOptionChange('showPrincipalSignature')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm">TTD Kepala Sekolah</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printOptions.showTeacherSignature === true || printOptions.showTeacherSignature === 'true'}
                  onChange={() => handlePrintOptionChange('showTeacherSignature')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm">TTD Wali Kelas</span>
              </label>
            </div>
          </div>
          {isFaseA && (
            <div className="pl-0 sm:pl-6 border-l-0 sm:border-l mt-4 sm:mt-0">
              <p className="text-sm font-medium text-slate-700 mb-2">Opsi Fase A:</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hideGrades"
                    checked={hideGradesForFaseA === true || hideGradesForFaseA === 'true'}
                    onChange={(e) => setHideGradesForFaseA(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm">Sembunyikan Nilai Angka</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
