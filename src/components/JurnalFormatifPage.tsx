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
    currentSemester,
    isModalOpen,
    setIsModalOpen,
    selectedStudent,
    handleUpdate,
    handleDelete,
    handleOpenModal,
  } = useJurnalFormatifPageLogic(props);

  return (
    <div className="flex flex-col gap-6 space-y-0 pt-4 sm:pt-8 animate-fade-in">
      {selectedStudent && (
        <StudentJournalModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          student={selectedStudent} 
          notes={(formativeJournal[selectedStudent.id] || []).filter((n: any) => (n.semester || 'Ganjil') === currentSemester)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showToast={props.showToast}
          subjects={subjects}
          grades={grades}
          settings={settings}
          predefinedCurriculum={predefinedCurriculum}
        />
      )}
      <div className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-zinc-800">Jurnal Formatif</h2>
        <p className="mt-1 text-zinc-600">Catat perkembangan, observasi harian, dan asesmen formatif siswa. Catatan ini membantu dalam memantau proses belajar namun tidak mempengaruhi nilai rapor secara langsung.</p>
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
          <div className="bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-12rem)] sm:max-h-[calc(100dvh-10rem)] overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left text-zinc-500 border-separate border-spacing-0">
                <thead className="text-xs text-zinc-700 uppercase bg-zinc-100 sticky top-0 z-30">
                  <tr>
                    <th scope="col" className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 sticky top-0 left-0 z-40 bg-zinc-100 text-center  border-b border-zinc-200/60">No</th>
                    <th scope="col" className="px-6 py-3 min-w-[250px] border-b border-zinc-200/60 sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-zinc-100 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</th>
                    <th scope="col" className="px-6 py-3 text-center border-b border-zinc-200/60">Jumlah Catatan</th>
                    <th scope="col" className="px-6 py-3 text-center border-b border-zinc-200/60">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any, index: number) => {
                      const studentNotes = (formativeJournal[student.id] || []).filter((n: any) => (n.semester || 'Ganjil') === currentSemester);
                      const noteCount = studentNotes.length;
                      return (
                        <tr key={student.id} className="bg-white hover:bg-[#fafafa] transition-colors">
                          <td className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white">{index + 1}</td>
                          <td className="px-6 py-4 font-medium text-zinc-900 border-b border-zinc-200/60 lg:sticky lg:left-[50px] lg:z-20 bg-white lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.namaLengkap}</td>
                          <td className="px-6 py-4 text-center border-b border-zinc-200/60"> 
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${noteCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-zinc-100 text-zinc-500'}`}>
                              {noteCount} Catatan
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center border-b border-zinc-200/60">
                            <button
                              id={`look-btn-${student.id}`}
                              onClick={() => handleOpenModal(student)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                            >
                              Lihat & Tambah Catatan
                            </button>
                          </td>
                        </tr>
                      );
                  })}
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
