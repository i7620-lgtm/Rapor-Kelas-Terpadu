import React, { useState } from 'react';
import { ReportPagesForStudent } from './PrintRapor/ReportPagesForStudent';
import { PrintControlPanel } from './PrintRapor/PrintControlPanel';
import { EmptyState } from './EmptyState';
import { ExportProgressModal } from './ExportProgressModal';
import { ErrorBoundary } from './ErrorBoundary';
import { usePrintRaporPageLogic } from './PrintRapor/usePrintRaporPageLogic';
import { useDashboardLogic } from './Dashboard/useDashboardLogic';
import { IncompleteDataModal } from './IncompleteDataModal';
import { AlertTriangle } from 'lucide-react';
import { useProgressiveRender } from './PrintRapor/useProgressiveRender';

interface PrintRaporPageProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActivePage?: (page: string) => void;
}

const NOOP = () => {};

const PrintRaporPage: React.FC<PrintRaporPageProps> = ({ showToast, setActivePage }) => {
  const {
    settings,
    grades,
    students,
    paperSize,
    selectedStudentId,
    rankingOption,
    selectedPages,
    
    printAreaRef,
    exportProgress,
    isFaseA,
    studentRanks,
    isMobileDevice,
    handleDownloadPDF,
    handlePrint,
    studentsToRender,
    pageStyle,
  } = usePrintRaporPageLogic({ showToast });

  const isAllStudents = selectedStudentId === 'all';
  const {
    renderedItems: progressiveStudents,
    renderedCount,
    totalCount,
    isBatchComplete,
    flushAll,
  } = useProgressiveRender({
    items: studentsToRender,
    batchSize: 3,
    enabled: isAllStudents,
  });

  const { completenessChecks, academicAlerts } = useDashboardLogic({ setActivePage: setActivePage || NOOP });
  
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingPrintAction, setPendingPrintAction] = useState<(() => void) | null>(null);

  const incompleteItems = completenessChecks.filter(check => check.status === 'bad');
  
  const belowKkmItems = (academicAlerts || [])
    .filter((alert: any) => alert.status === 'attention')
    .map((alert: any) => ({
      title: alert.title,
      message: alert.description,
      actionText: alert.actionText || 'Lihat Nilai',
      onActionClick: alert.onActionClick
    }));

  const combinedIncompleteItems = [...incompleteItems, ...belowKkmItems];

  const onPrintRequest = async (action: () => void) => {
    if (!isBatchComplete && isAllStudents) {
      flushAll();
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    if (combinedIncompleteItems.length > 0) {
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
      <div className="space-y-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Cetak Rapor</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk mencetak.</p>
        </div>
        <EmptyState
          title="Belum ada data siswa"
          description="Cetak rapor tidak dapat dilakukan karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => setActivePage && setActivePage('DATA_SISWA')}
        />
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Cetak Rapor</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk mencetak.</p>
        </div>
        <EmptyState
          title="Menunggu Data Nilai"
          description="Semua data nilai siswa saat ini kosong. Rapor tidak akan memiliki nilai numerik yang terisi. Lanjutkan ke halaman Data Nilai terlebih dahulu untuk melengkapinya."
          primaryActionLabel="Isi Data Nilai"
          onPrimaryAction={() => setActivePage && setActivePage('DATA_NILAI')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {combinedIncompleteItems.length > 0 && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-amber-800 dark:text-amber-200 print-hidden shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Perhatian: </span>
                {incompleteItems.length > 0 && (
                  <span className="tabular-nums">{incompleteItems.length} data belum lengkap. </span>
                )}
                {belowKkmItems.length > 0 && (
                  <span className="tabular-nums">{belowKkmItems.length} siswa memiliki nilai di bawah KKM. </span>
                )}
                <span className="text-amber-700 dark:text-amber-300">Periksa rincian sebelum mencetak rapor.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIncompleteModal(true)}
              className="px-3 py-1.5 min-h-[44px] lg:min-h-0 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 shadow-sm transition-colors"
            >
              Lihat Rincian
            </button>
          </div>
        )}

        <PrintControlPanel
          students={students}
          isMobileDevice={isMobileDevice}
          isFaseA={isFaseA}
          handleDownloadPDF={() => onPrintRequest(handleDownloadPDF)}
          handlePrint={() => onPrintRequest(handlePrint)}
        />
      </div>

      <IncompleteDataModal
        isOpen={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        onContinue={handleContinuePrint}
        incompleteChecks={combinedIncompleteItems}
      />

      <div id="print-area" ref={printAreaRef} className="w-full overflow-x-auto pb-4 flex flex-col items-start md:items-center space-y-8 animate-fade-in">
        {!isBatchComplete && isAllStudents && (
          <div className="w-full max-w-xl mx-auto py-2.5 px-4 bg-indigo-50/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-medium shadow-sm flex items-center justify-center gap-2.5 print-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
            <span>Menyiapkan pratinjau ({renderedCount} dari {totalCount} siswa)...</span>
          </div>
        )}

        {(isAllStudents ? progressiveStudents : studentsToRender).map((student) => {
          const rank = studentRanks.get(student.id)?.rank;
          return (
            <ErrorBoundary
              key={student.id}
              fallback={
                <div className="w-full max-w-[21cm] bg-white border-2 border-dashed border-red-200 rounded-lg p-6 text-center shadow-sm" id={`student-error-fallback-${student.id}`}>
                  <p className="text-red-500 font-medium font-sans">Gagal memuat halaman rapor untuk siswa: {student.namaLengkap || "Siswa Tidak Dikenal"}</p>
                  <p className="text-xs text-gray-500 font-sans mt-1">Silakan sunting data atau periksa kesesuaian nilai siswa.</p>
                </div>
              }
            >
              <ReportPagesForStudent
                student={student}
                settings={settings}
                pageStyle={pageStyle}
                selectedPages={selectedPages}
                paperSize={paperSize}
                rank={rank}
                rankingOption={rankingOption}
                hideGradesForFaseA={isFaseA && settings.hideGradesForFaseA}
                printOptions={settings.printOptions}
              />
            </ErrorBoundary>
          );
        })}
      </div>

      <ExportProgressModal
        isOpen={exportProgress !== null}
        current={exportProgress?.current || 0}
        total={exportProgress?.total || 0}
        statusText={exportProgress?.statusText || ""}
        title="Mengunduh Dokumen Rapor"
      />
    </>
  );
};

export default PrintRaporPage;
