import React from "react";
import { getSections } from "./PanduanSections";
const PanduanPage = ({ setActivePage }) => {
    const sections = getSections(setActivePage);

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4 w-full pb-10" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight" }, "Panduan Penggunaan"),
                React.createElement('p', { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400" }, "Pelajari cara menggunakan aplikasi Rapor Kurikulum Merdeka ini dari awal hingga akhir.")
            ),

            React.createElement('div', { className: "space-y-4 mt-2" },
                sections.map((section, index) => (
                    React.createElement('div', { key: index, className: "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col" },
                        React.createElement('div', { className: "p-4 sm:p-5" },
                            React.createElement('h3', { className: "text-base font-bold text-slate-800 dark:text-slate-100 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2" }, 
                                React.createElement('span', { className: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold tabular-nums" }, index + 1),
                                section.title.replace(/^\d+\.\s/, '')
                            ),
                            React.createElement('div', { className: "text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm" }, section.content)
                        )
                    )
                ))
            ),

            React.createElement('div', { className: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl mt-2" },
                React.createElement('h3', { className: "text-sm font-bold text-indigo-800 dark:text-indigo-200 mb-1" }, "Butuh Bantuan Lebih Lanjut?"),
                React.createElement('p', { className: "text-xs text-indigo-700 dark:text-indigo-300" }, "Jika Anda mengalami kendala atau menemukan error, cobalah untuk memuat ulang (refresh) halaman browser Anda. Pastikan Anda selalu melakukan backup data secara berkala.")
            )
        )
    );
};

export default PanduanPage;
