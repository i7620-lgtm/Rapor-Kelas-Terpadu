import React, { useState } from 'react';

interface Extracurricular {
    id: string;
    name: string;
    active: boolean;
}

interface PengaturanEkstraProps {
    extracurriculars: Extracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PengaturanEkstra = React.memo<PengaturanEkstraProps>(({ 
    extracurriculars, 
    onUpdateExtracurriculars, 
    showToast 
}) => {
    const [newExtraName, setNewExtraName] = useState('');

    const handleToggle = (id: string) => {
        const updated = extracurriculars.map(ex => ex.id === id ? { ...ex, active: !ex.active } : ex);
        onUpdateExtracurriculars(updated);
    };

    const handleAdd = () => {
        if (!newExtraName.trim()) {
            showToast("Nama ekstrakurikuler tidak boleh kosong.", 'error');
            return;
        }
        const newId = newExtraName.trim().toUpperCase().replace(/\s+/g, '_');
        if (extracurriculars.some(ex => ex.id === newId)) {
            showToast("Ekstrakurikuler dengan ID ini sudah ada.", 'error');
            return;
        }
        const newExtra = { id: newId, name: newExtraName.trim(), active: true };
        onUpdateExtracurriculars([...extracurriculars, newExtra]);
        setNewExtraName('');
        showToast('Ekstrakurikuler baru berhasil ditambahkan.', 'success');
    };

    const handleKeyDownForAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        React.createElement('div', { className: "space-y-4 text-left" },
             React.createElement('div', { className: "p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 dark:text-slate-200 mb-3" }, "Pilih Ekstrakurikuler Aktif"),
                 React.createElement('div', { className: "flex flex-wrap gap-2" },
                    extracurriculars.map(extra => (
                        React.createElement('button', {
                            key: extra.id,
                            onClick: () => handleToggle(extra.id),
                            className: `px-3 py-1.5 min-h-[44px] lg:min-h-0 text-sm font-medium rounded-lg transition-all duration-200 border ${
                                extra.active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-800'
                            }`
                        }, extra.name)
                    ))
                )
            ),
             React.createElement('div', { className: "pt-4 border-t border-slate-200 dark:border-slate-700" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 dark:text-slate-200 mb-2" }, "Tambah Ekstrakurikuler Baru"),
                React.createElement('div', { className: "flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700" },
                    React.createElement('div', { className: "flex-1 w-full" },
                        React.createElement('label', { htmlFor: "new-extra-name", className: "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Nama Ekstrakurikuler"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-extra-name",
                            value: newExtraName,
                            onChange: e => setNewExtraName(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: Seni Lukis",
                            className: "w-full px-3 py-2 min-h-[44px] lg:min-h-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                        })
                    ),
                    React.createElement('button', {
                        onClick: handleAdd,
                        className: "w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 lg:h-10 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 whitespace-nowrap shrink-0"
                    }, "+ Tambah")
                )
            )
        )
    );
});
