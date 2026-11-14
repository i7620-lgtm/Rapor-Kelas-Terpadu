import React, { useState, useEffect } from 'react';

export const BulkAddRowModal = ({ isOpen, onClose, onAdd }) => {
    const [count, setCount] = useState(1);

    useEffect(() => {
        if (isOpen) setCount(1);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const num = parseInt(count.toString(), 10);
        if (num > 0) {
            onAdd(num);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-5 sm:p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Tambah Siswa</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Masukkan jumlah siswa untuk membuat baris kosong.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah Siswa</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Batal</button>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Tambahkan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
