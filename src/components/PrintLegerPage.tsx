import React, { useMemo } from 'react';
import { EmptyState } from './EmptyState';
import { ExportProgressModal } from './ExportProgressModal';
import { LegerReportHeader } from './PrintLeger/LegerReportHeader';
import { LegerHeader } from './PrintLeger/LegerHeader';
import { LegerFooter } from './PrintLeger/LegerFooter';
import { usePrintLegerPageLogic } from './PrintLeger/usePrintLegerPageLogic';

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

  const tableHeader = useMemo(() => (
    <thead className={isCompact ? 'text-[6pt]' : 'text-[6.5pt]'}>
      <tr className="text-center font-bold">
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NO</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NAMA MURID</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NISN</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NIS</td>
        <td colSpan={displaySubjects.length} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}`}>NILAI MATA PELAJARAN</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>JML</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>RATA-RATA</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>RANK</td>
      </tr>
      <tr className="text-center font-bold">
        {displaySubjects.map((subject: any) => (
          <td key={subject.id} className="border border-black" style={{ height: isCompact ? '1.75rem' : '2.45rem' }}>
            <div className="h-full flex items-center justify-center">
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: isCompact ? '6.5pt' : '7pt' }}>
                {subject.label}
              </div>
            </div>
          </td>
        ))}
      </tr>
    </thead>
  ), [displaySubjects, isCompact]);
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-200';
    if (rank === 2) return 'bg-slate-300';
    if (rank === 3) return 'bg-orange-200';
    if (rank >= 4 && rank <= 10) return 'bg-indigo-100';
    return '';
  };

  const renderTable = (rows: any[]) => (
    <table className={`w-full border-collapse border border-black font-times ${isCompact ? 'text-[7.5pt]' : 'text-[8pt]'}`} style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '3%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '4.5%' }} />
        {displaySubjects.map((_: any, i: number) => <col key={i} style={{ width: `${(100 - 3 - 25 - 9 - 4.5 - 4.5 - 5.5 - 6.5) / displaySubjects.length}%` }} />)}
        <col style={{ width: '4.5%' }} />
        <col style={{ width: '5.5%' }} />
        <col style={{ width: '6.5%' }} />
      </colgroup>
      {tableHeader}
      <tbody className="leading-snug">
        {rows.map((student, index) => {
          const rowColor = getRankColor(student.rank);
          
          return (
            <tr key={student.no} className={rowColor ? `${rowColor} border-black` : ''}>
              <td className="border border-black px-1 text-center">{student.no}</td>
              <td 
                ref={el => { nameCellRefs.current[index] = el; }}
                className="border border-black px-2 whitespace-nowrap overflow-hidden"
                style={nameFontSize ? { fontSize: `${nameFontSize}pt`, lineHeight: 1.2 } : {}}
              >
                {student.namaLengkap}
              </td>
              <td className="border border-black px-1 text-center">{student.nisn}</td>
              <td className="border border-black px-1 text-center">{student.nis}</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{student.grades[subject.id] ?? ''}</td>
              ))}
              <td className="border border-black px-1 text-center font-bold">{student.total}</td>
              <td className="border border-black px-1 text-center font-bold">{student.average}</td>
              <td className="border border-black px-1 text-center font-bold">{student.rank}</td>
            </tr>
          );
        })}
        {statistics && (
          <>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Nilai Tertinggi</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].max}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.max}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Nilai Terendah</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].min}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.min}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Total Nilai</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].sum}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.sum}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Rata-rata Nilai</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].avg}</td>
              ))}
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
          </>
        )}
      </tbody>
    </table>
  );

  if (students.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Belum ada data siswa"
          description="Leger tidak dapat dicetak karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
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
                <select id="paperSizeSelector" value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm">
                  {Object.keys(PAPER_SIZES).map(key => <option key={key} value={key}>{`${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`}</option>)}
                </select>
              </div>
              {isMobileDevice ? (
                <button onClick={handleDownloadPDF} disabled={isPrinting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                  {isPrinting ? 'Mempersiapkan...' : 'Unduh PDF'}
                </button>
              ) : (
                <button onClick={handlePrint} disabled={isPrinting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                  {isPrinting ? 'Mempersiapkan...' : 'Cetak Leger (Print)'}
                </button>
              )}
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="text-sm font-medium text-slate-700 mb-0">Opsi Tanda Tangan:</p>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={printOptions.showPrincipalSignature} onChange={() => handlePrintOptionChange('showPrincipalSignature')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <span className="text-sm">TTD Kepala Sekolah</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={printOptions.showTeacherSignature} onChange={() => handlePrintOptionChange('showTeacherSignature')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <span className="text-sm">TTD Wali Kelas</span>
              </label>
            </div>
          </div>
        </div>
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
                   {renderTable(processedData)}
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
