import React, { useState } from 'react';
import { NoteEditorModal } from './NoteEditorModal';

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

export const StudentJournalModal: React.FC<StudentJournalModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  notes, 
  onUpdate, 
  onDelete, 
  showToast, 
  subjects, 
  grades, 
  settings: _settings, 
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
    const { semester: _ignoredSemester, ...cleanNote } = noteData || {};
    onUpdate(student.id, cleanNote);
    showToast(cleanNote.id ? 'Catatan berhasil diperbarui.' : 'Catatan baru berhasil disimpan.', 'success');
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
      
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Jurnal Formatif Siswa</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{student.namaLengkap}</p>
            </div>
            <button type="button" onClick={handleAddNew} className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">+ Tambah Catatan Baru</button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 flex-1">
            {notes && notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map(note => {
                  const subjectLabel = subjects.find(s => s.id === note.subjectId)?.label;
                  const slmName = getSlmName(note);
                  return (
                    <div key={note.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold tabular-nums bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{note.type}</span>
                            {subjectLabel && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">{subjectLabel}</span>}
                          </div>
                          {(note.topic || note.tpId) && (
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1"> 
                              {note.topic ? note.topic : (note.tpId ? (note.tpId.length > 100 ? `${note.tpId.substring(0, 100)}...` : note.tpId) : '')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button type="button" onClick={() => handleEdit(note)} className="text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 min-h-[38px] lg:min-h-0 rounded-md transition-colors">Edit</button>
                          <button type="button" onClick={() => handleDelete(note.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 min-h-[38px] lg:min-h-0 rounded-md transition-colors">Hapus</button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-slate-200 dark:border-slate-700">{note.note}</div>
                      {(note.slmId && note.tpId) && (
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-0.5">
                          <span>{`Lingkup Materi: `}{slmName}</span>
                          <span>{`TP: `}{note.tpId}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p>Belum ada catatan formatif untuk siswa ini.</p>
                <p className="text-sm mt-1">Klik tombol 'Tambah Catatan Baru' untuk memulai.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </>
  );
};

