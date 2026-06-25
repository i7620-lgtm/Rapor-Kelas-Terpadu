import React, { useState } from 'react';

interface Subject {
    id: string;
    fullName: string;
    label: string;
    active: boolean;
}

interface PengaturanMapelProps {
    subjects: Subject[];
    onUpdateSubjects: (subjects: Subject[]) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PengaturanMapel = React.memo<PengaturanMapelProps>(({ 
    subjects, 
    onUpdateSubjects, 
    showToast 
}) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectLabel, setNewSubjectLabel] = useState('');

    const handleToggle = (subjectId: string) => {
        onUpdateSubjects(subjects.map(s => s.id === subjectId ? { ...s, active: !s.active } : s));
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim() || !newSubjectLabel.trim()) {
            showToast("Nama mata pelajaran dan singkatan tidak boleh kosong.", 'error');
            return;
        }
        const newId = newSubjectLabel.trim().toUpperCase().replace(/\s+/g, '');
        if (subjects.some(s => s.id === newId)) {
            showToast("Singkatan mata pelajaran sudah ada. Harap gunakan singkatan yang unik.", 'error');
            return;
        }

        const newSubject = {
            id: newId,
            fullName: newSubjectName.trim(),
            label: newSubjectLabel.trim(),
            active: true
        };

        onUpdateSubjects([...subjects, newSubject]);
        setNewSubjectName('');
        setNewSubjectLabel('');
        showToast('Mata pelajaran baru berhasil ditambahkan.', 'success');
    };

    const handleKeyDownForAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubject();
            (e.target as HTMLInputElement).blur();
        }
    };
    
    return (
        React.createElement('div', { className: "space-y-4 text-left" },
            React.createElement('div', { className: "p-4 border rounded-lg bg-slate-50" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-3" }, "Pilih Mata Pelajaran Aktif"),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    subjects.map(subject => (
                        React.createElement('button', {
                            key: subject.id,
                            onClick: () => handleToggle(subject.id),
                            title: subject.fullName,
                            className: `px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border ${
                                subject.active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                            }`
                        }, subject.label)
                    ))
                )
            ),
            React.createElement('div', { className: "pt-4 border-t border-slate-200" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-2" }, "Tambah Mata Pelajaran Baru"),
                React.createElement('div', { className: "flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200" },
                    React.createElement('div', { className: "flex-1 w-full" },
                        React.createElement('label', { htmlFor: "new-subject-name", className: "block text-xs font-medium text-slate-700 mb-1" }, "Nama Mata Pelajaran"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-subject-name",
                            value: newSubjectName,
                            onChange: e => setNewSubjectName(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: Bahasa Sunda",
                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 focus:outline-none"
                        })
                    ),
                    React.createElement('div', { className: "flex-1 w-full" },
                        React.createElement('label', { htmlFor: "new-subject-label", className: "block text-xs font-medium text-slate-700 mb-1" }, "Singkatan (ID Unik)"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-subject-label",
                            value: newSubjectLabel,
                            onChange: e => setNewSubjectLabel(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: BSunda",
                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 focus:outline-none"
                        })
                    ),
                    React.createElement('button', {
                        onClick: handleAddSubject,
                        className: "w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 h-10"
                    }, "+ Tambah")
                )
            )
        )
    );
});
