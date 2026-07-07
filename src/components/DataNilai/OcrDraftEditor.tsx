import React from "react";

export const OcrDraftEditor = ({
  judulBab,
  setJudulBab,
  tps,
  handleUpdateTpText,
  handleRemoveTp,
  handleAddTpManual,
  handleClear,
}) => {
  return React.createElement(
    "div",
    { className: "flex flex-col gap-2 bg-slate-950 p-4 border border-slate-800 rounded-lg flex-grow overflow-y-auto max-h-[35vh]" },
    React.createElement(
      "span",
      { className: "text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1" },
      "✏️ KONSTRUKSI MATERI & TP BARU"
    ),
    React.createElement(
      "div",
      { className: "space-y-1 mt-2" },
      React.createElement(
        "label",
        { className: "text-xs font-medium text-slate-400" },
        "Nama Lingkup Materi (Judul Bab):"
      ),
      React.createElement("input", {
        type: "text",
        value: judulBab,
        onChange: (e) => setJudulBab(e.target.value),
        placeholder: "Contoh: Bab 1 Bilangan Cacah, atau sorot lewat '🏷️ Bab' diatas",
        className: "w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded px-3 py-1.5 text-sm outline-none"
      })
    ),
    React.createElement(
      "div",
      { className: "space-y-2 mt-3" },
      React.createElement(
        "label",
        { className: "text-xs font-medium text-slate-400 block" },
        "Daftar Tujuan Pembelajaran (TP):"
      ),
      tps.length === 0
        ? React.createElement(
            "p",
            { className: "text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-800 rounded-md" },
            "Belum ada TP. Sorot area TP di atas atau tambah manual di bawah."
          )
        : tps.map((tp, idx) =>
            React.createElement(
              "div",
              { key: idx, className: "flex items-start gap-2" },
              React.createElement(
                "span",
                { className: "text-xs text-slate-500 font-bold pt-2.5" },
                `TP ${idx + 1}:`
              ),
              React.createElement("textarea", {
                value: tp,
                onChange: (e) => handleUpdateTpText(idx, e.target.value),
                placeholder: `Isi Tujuan Pembelajaran ${idx + 1}`,
                rows: 2,
                className: "flex-grow bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs rounded p-2 resize-none outline-none"
              }),
              React.createElement(
                "button",
                {
                  onClick: () => handleRemoveTp(idx),
                  className: "text-red-400 hover:text-red-500 font-bold text-lg p-1.5 self-center cursor-pointer"
                },
                "×"
              )
            )
          )
    ),
    React.createElement(
      "div",
      { className: "flex gap-2 pt-2 justify-between flex-wrap" },
      React.createElement(
        "button",
        {
          onClick: handleAddTpManual,
          className: "px-3 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-900/60 rounded-md transition-colors cursor-pointer"
        },
        "+ Tambah TP Baru secara Manual"
      ),
      (judulBab || tps.length > 0)
        ? React.createElement(
            "button",
            {
              onClick: handleClear,
              className: "px-3 py-1 text-xs text-red-400 hover:text-red-500 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
            },
            "Kosongkan Formulir"
          )
        : null
    )
  );
};
