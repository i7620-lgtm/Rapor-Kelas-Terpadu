import React, { useState } from 'react';
import { EmptyState } from './EmptyState';
import { ExportProgressModal } from './ExportProgressModal';
import { LegerReportHeader } from './PrintLeger/LegerReportHeader';
import { LegerHeader } from './PrintLeger/LegerHeader';
import { LegerFooter } from './PrintLeger/LegerFooter';
import { LegerTable } from './PrintLeger/LegerTable';
import { usePrintLegerPageLogic } from './PrintLeger/usePrintLegerPageLogic';
import { useDashboardLogic } from './Dashboard/useDashboardLogic';
import { IncompleteDataModal } from './IncompleteDataModal';

const PAPER_SIZES: Record<string, { width: string; height: string }> = {
  A4: { width: '21cm', height: '29.7cm' },
  F4: { width: '21.5cm', height: '33cm' },
  Letter: { width: '21.59cm', height: '27.94cm' },
  Legal: { width: '21.59cm', height: '35.56cm' },
};

const HEADER_HEIGHT_CM = 6.0;
const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5;

interface PrintLegerPageProps {
  students?: any;
  settings?: any;
  grades?: any;
  subjects?: any;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActivePage?: (page: string) => void;
}

const PrintLegerPage: React.FC<PrintLegerPageProps> = (props) => {
  const {
    students,
    settings,
    grades,
    paperSize,
    setPaperSize,
    isPrinting,
    exportProgress,
    isCompact,
    isMeasuring,
    nameFontSize,
    printOptions,
    nameCellRefs,
    pageRef,
    contentRef,
    cmRef,
    printAreaRef,
    displaySubjects,
    processedData,
    statistics,
    handlePrintOptionChange,
    isMobileDevice,
    handleDownloadPDF,
    handlePrint,
    pageStyle,
  } = usePrintLegerPageLogic(props);

  const { completenessChecks } = useDashboardLogic({ setActivePage: props.setActivePage || (() => {}) } as any);
  const incompleteItems = completenessChecks.filter((check: any) => check.status === 'bad' && check.category !== 'Data Lainnya');

  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingPrintAction, setPendingPrintAction] = useState<(() => void) | null>(null);

  const onPrintRequest = (action: () => void) => {
    if (incompleteItems.length > 0) {
      setPendingPrintAction(() => action);
      setShowIncompleteModal(true);
    } else {
      action();
    }
  };

  const handleContinuePrint = () => {
    setShowIncompleteModal(false);
    if (pendingPrintAction) {
      pendingPrintAction();
      setPendingPrintAction(null);
    }
  };

  if (students.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Belum ada data siswa"
          description="Leger tidak dapat dicetak karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Menunggu Data Nilai"
          description="Semua data nilai siswa saat ini kosong. Leger nilai belum dapat dikalkulasikan. Lanjutkan ke halaman Data Nilai terlebih dahulu untuk melengkapinya."
          primaryActionLabel="Isi Data Nilai"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_NILAI')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="pt-4 sm:pt-8">
        <div ref={cmRef} style={{ height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 }} />
        
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Cetak Leger</h2>
              <p className="mt-1 text-sm text-slate-600">Pratinjau leger nilai akhir siswa.</p>
            </div>
            
            <div className="flex items-end gap-4 mt-4 md:mt-0">
              <div>
                <label htmlFor="paperSizeSelector" className="block text-sm font-medium text-slate-700 mb-1">Ukuran Kertas</label>
                <select 
                  id="paperSizeSelector" 
                  value={paperSize} 
                  onChange={(e) => setPaperSize(e.target.value)} 
                  className="w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm"
                >
                  {Object.keys(PAPER_SIZES).map(key => (
                    <option key={key} value={key}>{`${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`}</option>
                  ))}
                </select>
              </div>
              
              {isMobileDevice ? (
                <button 
                  onClick={() => onPrintRequest(handleDownloadPDF)} 
                  disabled={isPrinting} 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPrinting ? 'Mempersiapkan...' : 'Unduh PDF'}
                </button>
              ) : (
                <button 
                  onClick={() => onPrintRequest(handlePrint)} 
                  disabled={isPrinting} 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPrinting ? 'Mempersiapkan...' : 'Cetak Leger (Print)'}
                </button>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="text-sm font-medium text-slate-700 mb-0">Opsi Tanda Tangan:</p>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={printOptions.showPrincipalSignature === true || printOptions.showPrincipalSignature === 'true'} 
                  onChange={() => handlePrintOptionChange('showPrincipalSignature')} 
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded" 
                />
                <span className="text-sm">TTD Kepala Sekolah</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={printOptions.showTeacherSignature === true || printOptions.showTeacherSignature === 'true'} 
                  onChange={() => handlePrintOptionChange('showTeacherSignature')} 
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded" 
                />
                <span className="text-sm">TTD Wali Kelas</span>
              </label>
            </div>
          </div>
        </div>

        <IncompleteDataModal
          isOpen={showIncompleteModal}
          onClose={() => setShowIncompleteModal(false)}
          onContinue={handleContinuePrint}
          incompleteChecks={incompleteItems}
        />

        <div id="print-area" ref={printAreaRef} className="flex flex-col items-center space-y-8">
          {students.length > 0 && (
            <div 
              ref={pageRef}
              className="leger-page bg-white shadow-lg border relative"
              style={{ ...pageStyle, visibility: isMeasuring ? 'hidden' : 'visible' }}
            >
              <LegerReportHeader settings={settings} />
              
              <div 
                ref={contentRef}
                className="absolute flex flex-col"
                style={{
                  top: `${HEADER_HEIGHT_CM}cm`,
                  left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                  right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                }}
              >
                <LegerHeader settings={settings} isCompact={isCompact} />
                
                <div> 
                  <LegerTable 
                    students={processedData} 
                    displaySubjects={displaySubjects} 
                    statistics={statistics} 
                    isCompact={isCompact} 
                    nameFontSize={nameFontSize} 
                    nameCellRefs={nameCellRefs} 
                  />
                </div>
                
                <LegerFooter settings={settings} isCompact={isCompact} printOptions={printOptions} />
              </div>
            </div>
          )}
        </div>

        <ExportProgressModal 
          isOpen={exportProgress !== null}
          current={exportProgress?.current || 0}
          total={exportProgress?.total || 0}
          statusText={exportProgress?.statusText || ''}
          title="Mengunduh Lembar Leger"
        />
      </div>
    </>
  );
};

export default PrintLegerPage;
