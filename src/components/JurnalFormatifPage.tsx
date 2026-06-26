import React, { useState, useEffect } from 'react';
import { FORMATIVE_ASSESSMENT_TYPES } from '../constants';
import { EmptyState } from './EmptyState';
import { useJurnalFormatifPageLogic } from './JurnalFormatif/useJurnalFormatifPageLogic';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  studentName: string;
  noteToEdit: any;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  subjects: any[];
  predefinedCurriculum: any;
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  studentName, 
  noteToEdit, 
  showToast, 
  subjects = [], 
  predefinedCurriculum 
}) => {
  const [noteData, setNoteData] = useState<any>({});
  const [availableSlms, setAvailableSlms] = useState<any[]>([]);
  const [availableTps, setAvailableTps] = useState<any[]>([]);

  const isEditing = !!noteToEdit;

  useEffect(() => {
    if (isOpen) {
      setNoteData(isEditing ? { ...noteToEdit } : {
        id: null,
        date: new Date().toISOString().split('T')[0],
        topic: '',
        subjectId: '',
        slmId: '',
        tpId: '',
        type: FORMATIVE_ASSESSMENT_TYPES[0],
        note: ''
      });
    }
  }, [isOpen, noteToEdit, isEditing]);

  useEffect(() => {
    if (!noteData.subjectId || !predefinedCurriculum) {
      setAvailableSlms([]);
      return;
    }
    
    const subject = subjects.find(s => s.id === noteData.subjectId);
    if (subject) {
      const curriculumKey = subject.curriculumKey || subject.fullName;
      if (predefinedCurriculum[curriculumKey]) {
        const slms = predefinedCurriculum[curriculumKey].map((item: any) => ({
          id: item.slm, 
          name: item.slm
        }));
        setAvailableSlms(slms);
      } else {
        setAvailableSlms([]);
      }
    } else {
      setAvailableSlms([]);
    }
  }, [noteData.subjectId, predefinedCurriculum, subjects]);

  useEffect(() => {
    if (!noteData.subjectId || !noteData.slmId || !predefinedCurriculum) {
      setAvailableTps([]);
      return;
    }
    
    const subject = subjects.find(s => s.id === noteData.subjectId);
    if (subject) {
      const curriculumKey = subject.curriculumKey || subject.fullName;
      if (predefinedCurriculum[curriculumKey]) {
        const slmItem = predefinedCurriculum[curriculumKey].find((item: any) => item.slm === noteData.slmId);
        if (slmItem && slmItem.tp) {
          setAvailableTps(slmItem.tp);
        } else {
          setAvailableTps([]);
        }
      } else {
        setAvailableTps([]);
      }
    } else {
      setAvailableTps([]);
    }
  }, [noteData.subjectId, noteData.slmId, predefinedCurriculum, subjects]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNoteData((prev: any) => {
      const updates: any = { [name]: value };
      if (name === 'subjectId') {
        updates.slmId = '';
        updates.tpId = '';
      }
      if (name === 'slmId') {
        updates.tpId = '';
      }
      return { ...prev, ...updates };
    });
  };

  const handleSave = () => {
    if (!noteData.note || !noteData.note.trim()) {
      showToast('Catatan tidak boleh kosong.', 'error');
      return;
    }
    onSave(noteData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-65 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-bold text-zinc-800">{isEditing ? 'Edit Catatan Formatif' : 'Tambah Catatan Baru'}</h3>
          <p className="text-sm text-zinc-500">{"Untuk: "}{studentName}</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-zinc-700">Tanggal</label>
              <input type="date" name="date" id="date" value={noteData.date || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-zinc-700">Jenis Asesmen</label>
              <select name="type" id="type" value={noteData.type || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white">
                {FORMATIVE_ASSESSMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Konteks Pembelajaran (Opsional)</p>
            
            <div>
              <label htmlFor="subjectId" className="block text-sm font-medium text-zinc-700">Mata Pelajaran</label>
              <select name="subjectId" id="subjectId" value={noteData.subjectId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">- Pilih Mapel (Opsional) -</option>
                {subjects.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {noteData.subjectId && (
              <div>
                <label htmlFor="slmId" className="block text-sm font-medium text-zinc-700">Lingkup Materi (SLM)</label>
                <select name="slmId" id="slmId" value={noteData.slmId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white">
                  <option value="">- Pilih Lingkup Materi (Opsional) -</option>
                  {availableSlms.map(slm => <option key={slm.id} value={slm.id}>{slm.name}</option>)}
                </select>
              </div>
            )}

            {noteData.slmId && (
              <div>
                <label htmlFor="tpId" className="block text-sm font-medium text-zinc-700">Tujuan Pembelajaran (TP)</label>
                <select name="tpId" id="tpId" value={noteData.tpId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white">
                  <option value="">- Pilih TP (Opsional) -</option>
                  {availableTps.map((tp, idx) => <option key={idx} value={tp}>{tp}</option>)}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-zinc-700">Topik Lainnya / Catatan Tambahan</label>
              <input type="text" name="topic" id="topic" value={noteData.topic || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm" placeholder="Contoh: Perilaku di Kantin, Kebersihan, dll." />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label htmlFor="note" className="block text-sm font-medium text-zinc-700">Catatan/Observasi</label>
            <textarea name="note" id="note" value={noteData.note || ''} onChange={handleChange} rows={5} className="mt-1 block w-full p-2 border border-zinc-300 rounded-lg text-sm bg-white" placeholder="Tuliskan observasi Anda di sini..." />
          </div>
        </div>
        <div className="flex justify-end p-4 border-t bg-[#fafafa] rounded-b-lg flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-[#fafafa]">Batal</button>
          <button onClick={handleSave} className="ml-3 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{isEditing ? 'Simpan Perubahan' : 'Simpan Catatan'}</button>
        </div>
      </div>
    </div>
  );
};

interface StudentJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  notes: any[];
  onUpdate: (sid: string, data: any) => void;
  onDelete: (sid: string, id: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  subjects: any[];
  grades: any[];
  settings: any;
  predefinedCurriculum: any;
}

const StudentJournalModal: React.FC<StudentJournalModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  notes, 
  onUpdate, 
  onDelete, 
  showToast, 
  subjects, 
  grades, 
  settings, 
  predefinedCurriculum 
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any>(null);

  const handleAddNew = () => {
    setNoteToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (note: any) => {
    setNoteToEdit(note);
    setIsEditorOpen(true);
  };

  const handleDelete = (noteId: any) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      onDelete(student.id, noteId);
      showToast('Catatan berhasil dihapus.', 'success');
    }
  };

  const handleSaveNote = (noteData: any) => {
    const enrichedNote = {
      ...noteData,
      semester: noteData.semester || settings?.semester || 'Ganjil'
    };
    onUpdate(student.id, enrichedNote);
    showToast(enrichedNote.id ? 'Catatan berhasil diperbarui.' : 'Catatan baru berhasil disimpan.', 'success');
  };
  
  const getSlmName = (note: any) => {
    if (note.slmId && !note.slmId.startsWith('slm_')) {
      return note.slmId;
    }
    const fromGrades = grades[0]?.detailedGrades?.[note.subjectId]?.slm?.find((s: any) => s.id === note.slmId)?.name;
    return fromGrades || note.slmId || '-';
  };

  if (!isOpen) return null;

  return (
    <>
      <NoteEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        onSave={handleSaveNote} 
        studentName={student.namaLengkap} 
        noteToEdit={noteToEdit} 
        showToast={showToast}
        subjects={subjects}
        predefinedCurriculum={predefinedCurriculum}
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-65 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b bg-[#fafafa] rounded-t-lg">
            <div>
              <h3 className="text-xl font-bold text-zinc-800">Jurnal Formatif Siswa</h3>
              <p className="text-sm text-zinc-500">{student.namaLengkap}</p>
            </div>
            <button onClick={handleAddNew} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">+ Tambah Catatan Baru</button>
          </div>
          <div className="p-6 overflow-y-auto bg-zinc-50">
            {notes && notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map(note => {
                  const subjectLabel = subjects.find(s => s.id === note.subjectId)?.label;
                  const slmName = getSlmName(note);
                  return (
                    <div key={note.id} className="p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-200 text-zinc-700">
                              {new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800">{note.type}</span>
                            {subjectLabel && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">{subjectLabel}</span>}
                          </div>
                          {(note.topic || note.tpId) && (
                            <p className="text-sm font-semibold text-zinc-800 mt-1"> 
                              {note.topic ? note.topic : (note.tpId ? (note.tpId.length > 100 ? `${note.tpId.substring(0, 100)}...` : note.tpId) : '')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(note)} className="text-xs font-medium text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded transition-colors">Edit</button>
                          <button onClick={() => handleDelete(note.id)} className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Hapus</button>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-zinc-200">{note.note}</div>
                      {(note.slmId && note.tpId) && (
                        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-zinc-500 flex flex-col gap-0.5">
                          <span>{`Lingkup Materi: `}{slmName}</span>
                          <span>{`TP: `}{note.tpId}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p>Belum ada catatan formatif untuk siswa ini.</p>
                <p className="text-sm mt-1">Klik tombol 'Tambah Catatan Baru' untuk memulai.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t bg-white rounded-b-lg">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-200 font-medium transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </>
  );
};

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
