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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-zinc-800 mb-2">Tambah Siswa</h3>
                <p className="text-sm text-zinc-600 mb-4">Masukkan jumlah siswa untuk membuat baris kosong.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Jumlah Siswa</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300/60 rounded-lg focus:ring-zinc-900 focus:border-zinc-900"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-700 bg-white border border-zinc-300/60 rounded-lg hover:bg-[#fafafa]">Batal</button>
                        <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Tambahkan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
