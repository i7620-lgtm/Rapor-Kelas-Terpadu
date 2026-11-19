import React from 'react';
import { EmptyState } from './EmptyState';
import { useJurnalFormatifPageLogic } from './JurnalFormatif/useJurnalFormatifPageLogic';
import { StudentJournalModal } from './JurnalFormatif/StudentJournalModal';
interface JurnalFormatifPageProps {
  students?: any;
  formativeJournal?: any;
  onUpdate?: (sid: string, data: any) => void;
  onDelete?: (sid: string, id: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActivePage?: (page: string) => void;
  subjects?: any;
  grades?: any;
  settings?: any;
  predefinedCurriculum?: any;
}

const JurnalFormatifPage: React.FC<JurnalFormatifPageProps> = (props) => {
  const {
    students,
    settings,
    subjects,
    grades,
    formativeJournal,
    predefinedCurriculum,
    isModalOpen,
    setIsModalOpen,
    selectedStudent,
    handleUpdate,
    handleDelete,
    handleOpenModal,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  } = useJurnalFormatifPageLogic(props);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {selectedStudent && (
        <StudentJournalModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          student={selectedStudent} 
          notes={formativeJournal[selectedStudent.id] || []}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showToast={props.showToast}
          subjects={subjects}
          grades={grades}
          settings={settings}
          predefinedCurriculum={predefinedCurriculum}
        />
      )}
      <div className="flex-shrink-0 mb-1 sm:mb-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Jurnal Formatif</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Catat perkembangan, observasi harian, dan asesmen formatif siswa. Catatan ini membantu dalam memantau proses belajar namun tidak mempengaruhi nilai rapor secara langsung.</p>
      </div>
      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Jurnal Formatif tidak dapat dibuat karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      ) : (
        <div className="space-y-4">
          {/* Table container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-10rem)] overflow-hidden">
            <div ref={scrollContainerRef} className="flex-1 overflow-auto jurnal-table-container">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
                <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-30">
                  <tr>
                    <th scope="col" className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 sticky top-0 left-0 z-40 bg-slate-100 dark:bg-slate-800 text-center border-b border-slate-200 dark:border-slate-700">No</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 w-[135px] min-w-[135px] sm:w-auto sm:min-w-[250px] border-b border-slate-200 dark:border-slate-700 sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 dark:bg-slate-800 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-center border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">Jumlah Catatan</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-center border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {topSpacerHeight > 0 && (
                    <tr aria-hidden="true" className="pointer-events-none">
                      <td colSpan={4} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }} />
                    </tr>
                  )}
                  {students.slice(startIndex, endIndex + 1).map((student: any, sliceIdx: number) => {
                      const index = startIndex + sliceIdx;
                      const studentNotes = formativeJournal[student.id] || [];
                      const noteCount = studentNotes.length;
                      return (
                        <tr key={student.id} ref={(el) => measureRow(index, el)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group">
                          <td className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-2 text-center tabular-nums border-b border-slate-200 dark:border-slate-700 sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70">{index + 1}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 lg:sticky lg:left-[50px] lg:z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] break-words">{student.namaLengkap}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center border-b border-slate-200 dark:border-slate-700"> 
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap ${noteCount > 0 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              {noteCount} Catatan
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center border-b border-slate-200 dark:border-slate-700">
                            <button
                              id={`look-btn-${student.id}`}
                              onClick={() => handleOpenModal(student)}
                              className="min-h-[44px] lg:min-h-0 inline-flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium px-3 py-1.5 lg:py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Lihat & Tambah Catatan
                            </button>
                          </td>
                        </tr>
                      );
                  })}
                  {bottomSpacerHeight > 0 && (
                    <tr aria-hidden="true" className="pointer-events-none">
                      <td colSpan={4} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JurnalFormatifPage;
