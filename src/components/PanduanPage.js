import React from 'react';
import { NAV_ITEMS } from '../constants.js';

const MockupContainer = ({ children }) => (
    React.createElement('div', { className: "w-full h-56 sm:h-72 bg-slate-100 border-b border-zinc-200 relative overflow-hidden flex items-center justify-center p-4" },
        React.createElement('div', { className: "w-full max-w-2xl h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" },
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

const Pointer = ({ className, text = "Klik di sini" }) => (
    React.createElement('div', { className: `absolute z-20 flex flex-col items-center animate-bounce ${className}` },
        React.createElement('div', { className: "bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap" }, text),
        React.createElement('svg', { className: "w-5 h-5 text-red-500 fill-current", viewBox: "0 0 24 24" },
            React.createElement('path', { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })
        )
    )
);

const PanduanPage = ({ setActivePage }) => {
    const sections = [
        {
            title: "1. Konsep Dasar Aplikasi (Penting!)",
            mockup: (
                React.createElement('div', { className: "flex flex-col items-center gap-4 w-full max-w-md" },
                    React.createElement('div', { className: "flex items-center gap-4 w-full justify-center" },
                        React.createElement('div', { className: "w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm border border-indigo-200" }, "RKT"),
                        React.createElement('div', { className: "flex flex-col gap-2" },
                            React.createElement('div', { className: "h-2 w-16 bg-slate-300 rounded" }),
                            React.createElement('div', { className: "h-2 w-16 bg-slate-300 rounded" }),
                            React.createElement('div', { className: "h-2 w-16 bg-slate-300 rounded" })
                        ),
                        React.createElement('div', { className: "w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200" },
                            React.createElement('svg', { className: "w-8 h-8 text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }))
                        )
                    ),
                    React.createElement('div', { className: "p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2 w-full justify-center shadow-sm" },
                        React.createElement('svg', { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })),
                        React.createElement('span', { className: "font-medium" }, "Data otomatis tersimpan di browser Anda")
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Aplikasi Rapor Kurikulum Merdeka ini berjalan ", React.createElement('strong', null, "100% secara offline"), " di dalam browser perangkat Anda (seperti Google Chrome, Edge, atau Safari)."),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Data Anda ", React.createElement('strong', null, "tidak dikirim ke server internet"), ", melainkan disimpan di dalam memori browser laptop/komputer Anda sendiri."),
                        React.createElement('li', null, "Keuntungannya: Sangat aman, cepat, dan tidak memerlukan koneksi internet sama sekali saat digunakan."),
                        React.createElement('li', null, "Kelemahannya: Jika Anda menghapus data browser (Clear Browsing Data), melakukan instal ulang browser, atau laptop rusak, data rapor bisa hilang."),
                        React.createElement('li', { className: "text-red-600 font-semibold mt-2" }, "Solusi Wajib: Selalu lakukan \"Unduh Data dari RKT\" (Export) secara berkala untuk mencadangkan data Anda ke dalam file komputer atau flashdisk.")
                    )
                )
            )
        },
        {
            title: "2. Pengaturan Awal",
            mockup: (
                React.createElement('div', { className: "flex w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden" },
                    React.createElement('div', { className: "w-1/4 bg-slate-50 border-r border-slate-200 p-3 flex flex-col gap-2" },
                        React.createElement('div', { className: "h-4 w-3/4 bg-slate-200 rounded mb-2" }),
                        React.createElement('div', { className: "h-8 w-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center px-2 rounded-md font-bold border border-indigo-200 relative" }, 
                            React.createElement('svg', { className: "w-3 h-3 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })),
                            "Pengaturan",
                            React.createElement(Pointer, { className: "-right-4 top-2 scale-75", text: "1. Klik Menu" })
                        ),
                        React.createElement('div', { className: "h-6 w-full bg-transparent text-slate-500 text-[10px] flex items-center px-2 rounded-md" }, "Data Siswa")
                    ),
                    React.createElement('div', { className: "w-3/4 p-4 flex flex-col gap-3" },
                        React.createElement('div', { className: "text-sm font-bold text-slate-800 border-b pb-1" }, "Profil Sekolah"),
                        React.createElement('div', { className: "flex flex-col gap-1 relative" },
                            React.createElement('label', { className: "text-[10px] font-medium text-slate-600" }, "Nama Sekolah"),
                            React.createElement('div', { className: "h-8 w-full bg-white border border-slate-300 rounded-md px-2 flex items-center text-xs text-slate-800 shadow-sm" }, "SDN 1 Contoh"),
                            React.createElement(Pointer, { className: "right-4 top-2 scale-75", text: "2. Isi Data" })
                        ),
                        React.createElement('div', { className: "flex flex-col gap-1" },
                            React.createElement('label', { className: "text-[10px] font-medium text-slate-600" }, "Nama Kepala Sekolah"),
                            React.createElement('div', { className: "h-8 w-full bg-white border border-slate-300 rounded-md px-2 flex items-center text-xs text-slate-800 shadow-sm" }, "Budi Santoso, S.Pd.")
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Sebelum mulai mengisi data, pastikan Anda mengatur identitas sekolah terlebih dahulu:"),
                    React.createElement('ol', { className: "list-decimal pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Buka menu ", React.createElement('button', { onClick: () => setActivePage('PENGATURAN'), className: "text-blue-600 hover:underline font-medium" }, "Pengaturan"), "."),
                        React.createElement('li', null, "Isi lengkap Identitas Sekolah, Identitas Kepala Sekolah, dan Identitas Wali Kelas."),
                        React.createElement('li', null, "Unggah Logo Sekolah dan Logo Dinas (jika diperlukan)."),
                        React.createElement('li', null, "Atur rentang nilai (Predikat) sesuai standar sekolah Anda."),
                        React.createElement('li', null, "Pilih Mata Pelajaran dan Ekstrakurikuler yang aktif di kelas Anda.")
                    )
                )
            )
        },
        {
            title: "3. Mengisi Data Siswa",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col" },
                    React.createElement('div', { className: "flex justify-between items-center mb-4" },
                        React.createElement('div', { className: "text-sm font-bold text-slate-800" }, "Data Siswa"),
                        React.createElement('div', { className: "relative" },
                            React.createElement('div', { className: "px-3 py-1.5 bg-zinc-900 rounded-lg text-white text-[10px] flex items-center font-medium shadow-sm" }, "+ Tambah Siswa Baru"),
                            React.createElement(Pointer, { className: "-top-6 -left-2 scale-75", text: "Klik Tambah" })
                        )
                    ),
                    React.createElement('div', { className: "border border-slate-200 rounded-lg overflow-hidden flex-1" },
                        React.createElement('div', { className: "bg-slate-100 h-8 border-b border-slate-200 flex items-center px-3 gap-4 text-[10px] font-bold text-slate-700 uppercase" },
                            React.createElement('div', { className: "w-8 text-center" }, "No"),
                            React.createElement('div', { className: "flex-1" }, "Nama Lengkap"),
                            React.createElement('div', { className: "w-20" }, "NISN")
                        ),
                        React.createElement('div', { className: "h-10 border-b border-slate-100 flex items-center px-3 gap-4 text-xs text-slate-800 bg-white hover:bg-slate-50 relative" },
                            React.createElement('div', { className: "w-8 text-center font-medium" }, "1"),
                            React.createElement('div', { className: "flex-1" }, "Ahmad Budi"),
                            React.createElement('div', { className: "w-20" }, "00123456"),
                            React.createElement(Pointer, { className: "top-2 left-1/3 scale-75", text: "Atau Paste dari Excel" })
                        ),
                        React.createElement('div', { className: "h-10 flex items-center px-3 gap-4 text-xs text-slate-800 bg-white hover:bg-slate-50" },
                            React.createElement('div', { className: "w-8 text-center font-medium" }, "2"),
                            React.createElement('div', { className: "flex-1" }, "Siti Aminah"),
                            React.createElement('div', { className: "w-20" }, "00123457")
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Langkah selanjutnya adalah memasukkan daftar siswa:"),
                    React.createElement('ol', { className: "list-decimal pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Buka menu ", React.createElement('button', { onClick: () => setActivePage('DATA_SISWA'), className: "text-blue-600 hover:underline font-medium" }, "Data Siswa"), "."),
                        React.createElement('li', null, "Anda bisa menambah siswa satu per satu dengan mengklik tombol \"+ Tambah Siswa Baru\"."),
                        React.createElement('li', null, "Untuk cara cepat, Anda bisa menyalin (copy) data dari Microsoft Excel dan menempelkannya (paste) langsung ke dalam tabel Data Siswa.")
                    )
                )
            )
        },
        {
            title: "4. Mengisi Data Nilai Akademik",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col" },
                    React.createElement('div', { className: "flex gap-2 mb-3 border-b border-slate-200 pb-2 overflow-x-hidden" },
                        React.createElement('div', { className: "px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] flex items-center font-medium shadow-sm relative" }, 
                            "Pend. Agama",
                            React.createElement(Pointer, { className: "-top-6 left-4 scale-75", text: "1. Pilih Mapel" })
                        ),
                        React.createElement('div', { className: "px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[10px] flex items-center font-medium shadow-sm" }, "PPKn"),
                        React.createElement('div', { className: "px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[10px] flex items-center font-medium shadow-sm" }, "B. Indo")
                    ),
                    React.createElement('div', { className: "border border-slate-200 rounded-lg overflow-hidden flex-1" },
                        React.createElement('div', { className: "bg-slate-100 h-10 border-b border-slate-200 flex items-center px-2 gap-1 text-[9px] font-bold text-slate-700 uppercase" },
                            React.createElement('div', { className: "flex-1" }, "Nama Siswa"),
                            React.createElement('div', { className: "w-10 text-center" }, "TP 1"),
                            React.createElement('div', { className: "w-10 text-center" }, "TP 2"),
                            React.createElement('div', { className: "w-10 text-center bg-indigo-50 text-indigo-700 rounded px-1 py-0.5" }, "STS"),
                            React.createElement('div', { className: "w-10 text-center bg-indigo-50 text-indigo-700 rounded px-1 py-0.5" }, "SAS")
                        ),
                        React.createElement('div', { className: "h-12 border-b border-slate-100 flex items-center px-2 gap-1 text-xs text-slate-800 bg-white relative" },
                            React.createElement('div', { className: "flex-1 font-medium truncate" }, "Ahmad Budi"),
                            React.createElement('div', { className: "w-10 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-inner" }, "85"),
                            React.createElement('div', { className: "w-10 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-inner" }, "90"),
                            React.createElement('div', { className: "w-10 h-8 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-indigo-700 font-bold" }, "88"),
                            React.createElement('div', { className: "w-10 h-8 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-indigo-700 font-bold" }, "92"),
                            React.createElement(Pointer, { className: "top-6 right-16 scale-75", text: "2. Isi Nilai" })
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Pengisian nilai dilakukan per mata pelajaran:"),
                    React.createElement('ol', { className: "list-decimal pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Buka menu ", React.createElement('button', { onClick: () => setActivePage('DATA_NILAI'), className: "text-blue-600 hover:underline font-medium" }, "Data Nilai"), "."),
                        React.createElement('li', null, "Pilih tab mata pelajaran yang ingin diisi."),
                        React.createElement('li', null, "Tambahkan Tujuan Pembelajaran (TP) / Lingkup Materi (LM) sesuai kurikulum yang diajarkan."),
                        React.createElement('li', null, "Isi nilai Sumatif Lingkup Materi (SLM), Sumatif Tengah Semester (STS), dan Sumatif Akhir Semester (SAS)."),
                        React.createElement('li', null, "Anda dapat melakukan copy-paste nilai dari Excel langsung ke kolom-kolom nilai tersebut.")
                    )
                )
            )
        },
        {
            title: "5. Mengisi Data Kokurikuler (P5)",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col" },
                    React.createElement('div', { className: "mb-3 relative" },
                        React.createElement('label', { className: "text-[10px] font-bold text-slate-800 mb-1 block" }, "Tema Kegiatan"),
                        React.createElement('div', { className: "h-8 w-full bg-white border border-slate-300 rounded-md px-2 flex items-center text-xs text-slate-800 shadow-sm" }, "Gaya Hidup Berkelanjutan"),
                        React.createElement(Pointer, { className: "-top-2 right-4 scale-75", text: "1. Isi Tema" })
                    ),
                    React.createElement('div', { className: "border border-slate-200 rounded-lg overflow-hidden flex-1" },
                        React.createElement('div', { className: "bg-slate-100 h-8 border-b border-slate-200 flex items-center px-3 gap-2 text-[10px] font-bold text-slate-700 uppercase" },
                            React.createElement('div', { className: "flex-1" }, "Nama Siswa"),
                            React.createElement('div', { className: "w-24 text-center" }, "Dimensi 1")
                        ),
                        React.createElement('div', { className: "h-12 flex items-center px-3 gap-2 text-xs text-slate-800 bg-white relative" },
                            React.createElement('div', { className: "flex-1 font-medium" }, "Ahmad Budi"),
                            React.createElement('div', { className: "w-24 relative" },
                                React.createElement('div', { className: "h-8 w-full bg-white border border-slate-300 rounded-md flex items-center justify-between px-2 shadow-sm" },
                                    React.createElement('span', { className: "font-medium" }, "BSH"),
                                    React.createElement('svg', { className: "w-3 h-3 text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }))
                                ),
                                React.createElement(Pointer, { className: "top-6 -right-2 scale-75", text: "2. Pilih Predikat" })
                            )
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Penilaian Projek Penguatan Profil Pelajar Pancasila (P5):"),
                    React.createElement('ol', { className: "list-decimal pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Buka menu ", React.createElement('button', { onClick: () => setActivePage('DATA_KOKURIKULER'), className: "text-blue-600 hover:underline font-medium" }, "Data Kokurikuler"), "."),
                        React.createElement('li', null, "Masukkan Tema Kegiatan yang sedang dilaksanakan."),
                        React.createElement('li', null, "Isi nilai dimensi profil menggunakan singkatan: ", React.createElement('strong', null, "BB"), " (Belum Berkembang), ", React.createElement('strong', null, "MB"), " (Mulai Berkembang), ", React.createElement('strong', null, "BSH"), " (Berkembang Sesuai Harapan), atau ", React.createElement('strong', null, "SB"), " (Sangat Baik).")
                    )
                )
            )
        },
        {
            title: "6. Ekstrakurikuler, Absensi, dan Catatan",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col" },
                    React.createElement('div', { className: "flex gap-2 mb-3 border-b border-slate-200 pb-2" },
                        React.createElement('div', { className: "px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[10px] flex items-center font-medium shadow-sm" }, "Ekskul"),
                        React.createElement('div', { className: "px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] flex items-center font-medium shadow-sm relative" }, 
                            "Absensi",
                            React.createElement(Pointer, { className: "-top-6 left-4 scale-75", text: "Pilih Tab" })
                        ),
                        React.createElement('div', { className: "px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[10px] flex items-center font-medium shadow-sm" }, "Catatan")
                    ),
                    React.createElement('div', { className: "border border-slate-200 rounded-lg overflow-hidden flex-1" },
                        React.createElement('div', { className: "bg-slate-100 h-8 border-b border-slate-200 flex items-center px-3 gap-2 text-[10px] font-bold text-slate-700 uppercase" },
                            React.createElement('div', { className: "flex-1" }, "Nama Siswa"),
                            React.createElement('div', { className: "w-10 text-center" }, "S"),
                            React.createElement('div', { className: "w-10 text-center" }, "I"),
                            React.createElement('div', { className: "w-10 text-center" }, "A")
                        ),
                        React.createElement('div', { className: "h-12 flex items-center px-3 gap-2 text-xs text-slate-800 bg-white relative" },
                            React.createElement('div', { className: "flex-1 font-medium" }, "Ahmad Budi"),
                            React.createElement('div', { className: "w-10 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-inner" }, "1"),
                            React.createElement('div', { className: "w-10 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-inner" }, "0"),
                            React.createElement('div', { className: "w-10 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-inner" }, "0"),
                            React.createElement(Pointer, { className: "top-6 right-10 scale-75", text: "Isi Angka" })
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Lengkapi data pendukung rapor:"),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-2 text-zinc-600" },
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Data Ekstrakurikuler:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('DATA_EKSTRAKURIKULER'), className: "text-blue-600 hover:underline font-medium" }, "Data Ekstrakurikuler"), " untuk memilih kegiatan ekskul yang diikuti tiap siswa beserta predikat dan deskripsinya."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Data Absensi:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('DATA_ABSENSI'), className: "text-blue-600 hover:underline font-medium" }, "Data Absensi"), " untuk merekap jumlah hari Sakit, Izin, dan Tanpa Keterangan (Alpa)."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Catatan Wali Kelas:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('CATATAN_WALI_KELAS'), className: "text-blue-600 hover:underline font-medium" }, "Catatan Wali Kelas"), ". Anda bisa mengetik manual, copy-paste dari Excel, atau menggunakan tombol ", React.createElement('strong', null, "\"Buat Catatan Otomatis\""), " yang akan men-generate kalimat berdasarkan peringkat dan nilai siswa."
                        )
                    )
                )
            )
        },
        {
            title: "7. Jurnal Formatif (Opsional)",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col" },
                    React.createElement('div', { className: "flex justify-between items-center mb-4" },
                        React.createElement('div', { className: "text-sm font-bold text-slate-800" }, "Jurnal Formatif"),
                        React.createElement('div', { className: "relative" },
                            React.createElement('div', { className: "px-3 py-1.5 bg-zinc-900 rounded-lg text-white text-[10px] flex items-center font-medium shadow-sm" }, "+ Tambah Jurnal"),
                            React.createElement(Pointer, { className: "-top-6 -left-2 scale-75", text: "Klik Tambah" })
                        )
                    ),
                    React.createElement('div', { className: "p-3 border border-slate-200 rounded-lg bg-amber-50/50 shadow-sm" },
                        React.createElement('div', { className: "flex justify-between mb-2 items-center" },
                            React.createElement('div', { className: "text-[10px] font-bold text-slate-700 flex items-center gap-1" }, 
                                React.createElement('svg', { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" })),
                                "15 Juli 2026"
                            ),
                            React.createElement('div', { className: "text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold" }, "Sikap")
                        ),
                        React.createElement('div', { className: "text-xs text-slate-800 leading-relaxed" }, "Ahmad Budi menunjukkan sikap gotong royong yang sangat baik saat piket kelas.")
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Fitur tambahan untuk memantau perkembangan harian:"),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-1 text-zinc-600" },
                        React.createElement('li', null, "Buka menu ", React.createElement('button', { onClick: () => setActivePage('JURNAL_FORMATIF'), className: "text-blue-600 hover:underline font-medium" }, "Jurnal Formatif"), "."),
                        React.createElement('li', null, "Gunakan fitur ini untuk mencatat observasi, kuis singkat, atau penilaian sikap harian siswa."),
                        React.createElement('li', null, "Catatan ini bersifat internal untuk wali kelas dan tidak akan dicetak di rapor utama.")
                    )
                )
            )
        },
        {
            title: "8. Mencetak Rapor, Piagam, dan Leger",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex gap-4" },
                    React.createElement('div', { className: "w-1/3 flex flex-col gap-2 border-r border-slate-100 pr-4" },
                        React.createElement('div', { className: "text-[10px] font-bold text-slate-800 mb-1" }, "Pilih Halaman"),
                        React.createElement('div', { className: "flex items-center gap-2" },
                            React.createElement('div', { className: "w-3 h-3 border border-indigo-600 bg-indigo-600 rounded-sm flex items-center justify-center" },
                                React.createElement('svg', { className: "w-2 h-2 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }))
                            ),
                            React.createElement('div', { className: "text-[10px] text-slate-700 font-medium" }, "Sampul")
                        ),
                        React.createElement('div', { className: "flex items-center gap-2 relative" },
                            React.createElement('div', { className: "w-3 h-3 border border-indigo-600 bg-indigo-600 rounded-sm flex items-center justify-center" },
                                React.createElement('svg', { className: "w-2 h-2 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }))
                            ),
                            React.createElement('div', { className: "text-[10px] text-slate-700 font-medium" }, "Nilai Akademik"),
                            React.createElement(Pointer, { className: "-top-3 left-16 scale-75", text: "Pilih" })
                        )
                    ),
                    React.createElement('div', { className: "w-2/3 flex flex-col items-center justify-center gap-3" },
                        React.createElement('div', { className: "w-24 h-32 bg-white border border-slate-300 shadow-md flex flex-col items-center p-2 relative" },
                            React.createElement('div', { className: "w-8 h-8 rounded-full bg-slate-200 mb-2" }),
                            React.createElement('div', { className: "w-16 h-1 bg-slate-200 mb-1" }),
                            React.createElement('div', { className: "w-12 h-1 bg-slate-200 mb-4" }),
                            React.createElement('div', { className: "w-full h-10 bg-slate-100 border border-slate-200" }),
                            React.createElement('div', { className: "absolute inset-0 bg-indigo-600/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" })
                        ),
                        React.createElement('div', { className: "relative" },
                            React.createElement('div', { className: "px-4 py-1.5 bg-indigo-600 rounded-lg text-white text-[10px] flex items-center gap-1 font-bold shadow-sm" }, 
                                React.createElement('svg', { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" })),
                                "Cetak Rapor"
                            ),
                            React.createElement(Pointer, { className: "-top-6 -right-6 scale-75", text: "Klik Cetak" })
                        )
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Setelah semua data terisi, Anda siap untuk mencetak:"),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-2 text-zinc-600" },
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Print Rapor:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('PRINT_RAPOR'), className: "text-blue-600 hover:underline font-medium" }, "Print Rapor"), ". Pilih siswa, pilih halaman yang ingin dicetak (Sampul, Identitas, atau Nilai), atur ukuran kertas (A4/F4), lalu klik tombol Cetak."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Print Piagam:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('PRINT_PIAGAM'), className: "text-blue-600 hover:underline font-medium" }, "Print Piagam"), " untuk mencetak penghargaan bagi siswa berprestasi."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Print Leger:"), " Buka menu ", React.createElement('button', { onClick: () => setActivePage('PRINT_LEGER'), className: "text-blue-600 hover:underline font-medium" }, "Print Leger"), " untuk mencetak rekapitulasi nilai seluruh siswa dalam satu kelas."
                        )
                    )
                )
            )
        },
        {
            title: "9. Backup dan Restore Data (Sangat Penting)",
            mockup: (
                React.createElement('div', { className: "w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center gap-4" },
                    React.createElement('div', { className: "flex gap-4" },
                        React.createElement('div', { className: "relative" },
                            React.createElement('div', { className: "px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-700 rounded-xl text-[10px] flex items-center gap-2 font-bold shadow-sm" }, 
                                React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" })),
                                "Unduh Data (.rkt)"
                            ),
                            React.createElement(Pointer, { className: "-top-6 left-8 scale-75", text: "Backup Rutin" })
                        ),
                        React.createElement('div', { className: "px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-[10px] flex items-center gap-2 font-medium shadow-sm" }, 
                            React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" })),
                            "Unggah Data"
                        )
                    ),
                    React.createElement('div', { className: "text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1" }, 
                        React.createElement('svg', { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })),
                        "Simpan file .rkt di Flashdisk atau Google Drive"
                    )
                )
            ),
            content: (
                React.createElement(React.Fragment, null,
                    React.createElement('p', { className: "mb-2" }, "Untuk mencegah kehilangan data, lakukan hal berikut:"),
                    React.createElement('ul', { className: "list-disc pl-5 space-y-2 text-zinc-600" },
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Backup (Unduh Data):"), " Klik ikon menu di pojok kiri atas (atau lihat bagian bawah sidebar), lalu pilih ", React.createElement('strong', null, "\"Unduh Data dari RKT\""), ". Simpan file berekstensi ", React.createElement('code', { className: "bg-zinc-100 px-1 rounded" }, ".rkt"), " ini di tempat yang aman (Flashdisk/Google Drive)."
                        ),
                        React.createElement('li', null, 
                            React.createElement('strong', null, "Restore (Unggah Data):"), " Jika Anda berpindah laptop atau data terhapus, buka aplikasi ini, klik ", React.createElement('strong', null, "\"Unggah Data ke RKT\""), ", dan pilih file ", React.createElement('code', { className: "bg-zinc-100 px-1 rounded" }, ".rkt"), " yang pernah Anda simpan sebelumnya. Semua data akan kembali seperti semula."
                        )
                    )
                )
            )
        }
    ];

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-6 max-w-4xl mx-auto pb-10" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-zinc-800" }, "Panduan Penggunaan"),
                React.createElement('p', { className: "mt-2 text-zinc-600 text-lg" }, "Pelajari cara menggunakan aplikasi Rapor Kurikulum Merdeka ini dari awal hingga akhir.")
            ),

            React.createElement('div', { className: "bg-blue-50 border border-blue-200 p-4 rounded-xl mb-2 flex gap-3 items-start" },
                React.createElement('svg', { className: "w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })),
                React.createElement('div', { className: "text-sm text-blue-800" },
                    "Sebagai AI, saya tidak memiliki kemampuan untuk mengambil ", React.createElement('strong', null, "screenshot"), " langsung dari aplikasi Anda. Namun, saya telah merancang ulang ilustrasi di bawah ini agar ", React.createElement('strong', null, "sangat mirip dengan tampilan asli aplikasi"), ", lengkap dengan petunjuk (pointer) merah yang menunjukkan tombol mana yang harus diklik."
                )
            ),

            React.createElement('div', { className: "space-y-8" },
                sections.map((section, index) => (
                    React.createElement('div', { key: index, className: "bg-white rounded-xl shadow-sm border border-zinc-200/60 overflow-hidden" },
                        section.mockup && React.createElement(MockupContainer, null, section.mockup),
                        React.createElement('div', { className: "p-6" },
                            React.createElement('h3', { className: "text-xl font-bold text-zinc-800 mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2" }, 
                                React.createElement('span', { className: "bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm" }, index + 1),
                                section.title.replace(/^\d+\.\s/, '')
                            ),
                            React.createElement('div', { className: "text-zinc-700 leading-relaxed text-lg" }, section.content)
                        )
                    )
                ))
            ),

            React.createElement('div', { className: "bg-blue-50 border border-blue-200 p-6 rounded-xl mt-4" },
                React.createElement('h3', { className: "text-lg font-bold text-blue-800 mb-2" }, "Butuh Bantuan Lebih Lanjut?"),
                React.createElement('p', { className: "text-blue-700" }, "Jika Anda mengalami kendala atau menemukan error, cobalah untuk memuat ulang (refresh) halaman browser Anda. Pastikan Anda selalu melakukan backup data secara berkala.")
            )
        )
    );
};

export default PanduanPage;
