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
            <button type="button" onClick={handleAddNew} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">+ Tambah Catatan Baru</button>
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
                          <button type="button" onClick={() => handleEdit(note)} className="text-xs font-medium text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded transition-colors">Edit</button>
                          <button type="button" onClick={() => handleDelete(note.id)} className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Hapus</button>
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
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-200 font-medium transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </>
  );
};

