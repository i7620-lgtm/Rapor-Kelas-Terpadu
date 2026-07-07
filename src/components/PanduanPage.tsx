import React from "react";
import { getSections } from "./PanduanSections";
const PanduanPage = ({ setActivePage }) => {
    const sections = getSections(setActivePage);

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-6 w-full pb-10 pt-4 sm:pt-8" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-zinc-800" }, "Panduan Penggunaan"),
                React.createElement('p', { className: "mt-2 text-zinc-600 text-lg" }, "Pelajari cara menggunakan aplikasi Rapor Kurikulum Merdeka ini dari awal hingga akhir.")
            ),

            React.createElement('div', { className: "space-y-8 mt-4" },
                sections.map((section, index) => (
                    React.createElement('div', { key: index, className: "bg-white rounded-xl shadow-sm border border-zinc-200/60 overflow-hidden flex flex-col" },
                        React.createElement('div', { className: "p-6" },
                            React.createElement('h3', { className: "text-xl font-bold text-zinc-800 mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2" }, 
                                React.createElement('span', { className: "bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" }, index + 1),
                                section.title.replace(/^\d+\.\s/, '')
                            ),
                            React.createElement('div', { className: "text-zinc-700 leading-relaxed text-lg" }, section.content)
                        ),
                        section.mockup && React.createElement(MockupContainer, null, section.mockup)
                    )
                ))
            ),

            React.createElement('div', { className: "bg-indigo-50 border border-indigo-200 p-6 rounded-xl mt-4" },
                React.createElement('h3', { className: "text-lg font-bold text-indigo-800 mb-2" }, "Butuh Bantuan Lebih Lanjut?"),
                React.createElement('p', { className: "text-indigo-700" }, "Jika Anda mengalami kendala atau menemukan error, cobalah untuk memuat ulang (refresh) halaman browser Anda. Pastikan Anda selalu melakukan backup data secara berkala.")
            )
        )
    );
};

export default PanduanPage;
