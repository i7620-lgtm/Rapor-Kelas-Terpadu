import React from "react";
const _MockupContainer = ({ children }: any) => (
    React.createElement('div', { className: "w-full h-56 sm:h-72 bg-slate-100 border-t border-zinc-200 relative overflow-hidden flex items-center justify-center p-4" },
        React.createElement('div', { className: "w-full max-w-4xl h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" },
            React.createElement('div', { className: "h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-2 flex-shrink-0" },
                React.createElement('div', { className: "w-3 h-3 rounded-full bg-red-400" }),
                React.createElement('div', { className: "w-3 h-3 rounded-full bg-amber-400" }),
                React.createElement('div', { className: "w-3 h-3 rounded-full bg-green-400" }),
                React.createElement('div', { className: "ml-4 h-4 w-48 bg-white rounded-sm border border-slate-200" })
            ),
            React.createElement('div', { className: "flex-1 p-4 relative overflow-hidden bg-slate-50 flex items-center justify-center" }, children)
        )
    )
);
const _Pointer = ({ className }: any) => (
    React.createElement('div', { className: `absolute z-20 flex items-center justify-center animate-bounce ${className}` },
        React.createElement('svg', { className: "w-7 h-7 text-red-500 fill-current drop-shadow-md", viewBox: "0 0 24 24" },
            React.createElement('path', { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" })
        )
    )
);
export const getSections = (_setActivePage: any) => {
    return [
        {
            title: "1. Konsep Dasar Aplikasi (Penting!)",
            content: "Aplikasi Rapor Kurikulum Merdeka ini berjalan 100% secara offline di dalam browser Anda. Data tidak dikirim ke server internet melainkan disimpan di memori browser. Keuntungannya sangat aman, cepat. Kelemahannya jika menghapus data browser, data hilang. Selalu lakukan backup secara berkala.",
            mockup: null
        },
        {
            title: "2. Pengaturan Awal",
            content: "Sebelum mulai mengisi data, pastikan Anda mengatur identitas sekolah melalui menu Pengaturan. Isi identitas sekolah, rentang nilai, mata pelajaran, dan logo yang diperlukan.",
            mockup: null
        },
        {
            title: "3. Mengisi Data Siswa",
            content: "Langkah selanjutnya adalah mengisi data siswa. Anda bisa menambahkan satu per satu atau menyalin-tempel massal dari Excel. Anda juga dapat mengunggah foto siswa massal di sini.",
            mockup: null
        },
        {
            title: "4. Memasukkan Nilai",
            content: "Anda bisa memasukkan nilai pada halaman Data Nilai. Nilai dapat dimasukkan secara manual, disalin-tempel dari Excel, atau menggunakan fitur scan gambar (OCR).",
            mockup: null
        },
        {
            title: "5. Cetak Rapor",
            content: "Setelah semua data dan nilai lengkap, buka menu Cetak Rapor untuk mencetak Rapor, Piagam, maupun Leger kelas.",
            mockup: null
        }
    ];
};
