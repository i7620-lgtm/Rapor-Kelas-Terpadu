import React, { useState, useEffect } from 'react';
import { FORMATIVE_ASSESSMENT_TYPES } from '../../constants';

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

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ 
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
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Catatan Formatif' : 'Tambah Catatan Baru'}</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{"Untuk: "}{studentName}</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal</label>
              <input type="date" name="date" id="date" value={noteData.date || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Jenis Asesmen</label>
              <select name="type" id="type" value={noteData.type || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {FORMATIVE_ASSESSMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Konteks Pembelajaran (Opsional)</p>
            
            <div>
              <label htmlFor="subjectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
              <select name="subjectId" id="subjectId" value={noteData.subjectId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <option value="">- Pilih Mapel (Opsional) -</option>
                {subjects.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {noteData.subjectId && (
              <div>
                <label htmlFor="slmId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Lingkup Materi (SLM)</label>
                <select name="slmId" id="slmId" value={noteData.slmId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <option value="">- Pilih Lingkup Materi (Opsional) -</option>
                  {availableSlms.map(slm => <option key={slm.id} value={slm.id}>{slm.name}</option>)}
                </select>
              </div>
            )}

            {noteData.slmId && (
              <div>
                <label htmlFor="tpId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tujuan Pembelajaran (TP)</label>
                <select name="tpId" id="tpId" value={noteData.tpId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <option value="">- Pilih TP (Opsional) -</option>
                  {availableTps.map((tp, idx) => <option key={idx} value={tp}>{tp}</option>)}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Topik Lainnya / Catatan Tambahan</label>
              <input type="text" name="topic" id="topic" value={noteData.topic || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder="Contoh: Perilaku di Kantin, Kebersihan, dll." />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan/Observasi</label>
            <textarea name="note" id="note" value={noteData.note || ''} onChange={handleChange} rows={5} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder="Tuliskan observasi Anda di sini..." />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl flex-shrink-0">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Batal</button>
          <button type="button" onClick={handleSave} className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{isEditing ? 'Simpan Perubahan' : 'Simpan Catatan'}</button>
        </div>
      </div>
    </div>
  );
};

