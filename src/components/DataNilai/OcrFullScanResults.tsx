import React from "react";

export const OcrFullScanResults = ({
  localLines,
  setLocalLines,
  isRunningOcr,
  isFullOcrRunning,
  runFullOcr,
  setAsJudulBab,
  addAsTp,
}) => {
  const isLoading = isRunningOcr || isFullOcrRunning;

  return React.createElement(
    "div",
    { className: "flex flex-col gap-2" },
    React.createElement(
      "div",
      { className: "flex items-center justify-between" },
      React.createElement(
        "span",
        { className: "text-xs font-semibold text-slate-300 uppercase tracking-wider" },
        "✂️ HASIL PEMINDAIAN GLOBAL / SOROTAN"
      ),
      localLines.length === 0 && !isLoading && React.createElement(
        "button",
        {
          onClick: runFullOcr,
          className: "px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 rounded text-[10px] font-semibold transition-all cursor-pointer"
        },
        "🔍 Pindai Seluruh Gambar Otomatis"
      )
    ),
    isLoading
      ? React.createElement(
          "div",
          { className: "p-8 border border-slate-800/80 rounded-lg bg-slate-950/80 flex flex-col items-center justify-center gap-2" },
          React.createElement("div", { className: "w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" }),
          React.createElement("span", { className: "text-xs text-indigo-400 font-medium animate-pulse" }, "Mengekstrak teks otomatis secara offline...")
        )
      : localLines.length === 0
      ? React.createElement(
          "div",
          { className: "p-4 border border-dashed border-slate-800 rounded-lg bg-slate-950/40 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2" },
          React.createElement("p", null, "Gunakan tombol alat mode di sebelah kiri untuk menyorot secara manual langsung dari gambar."),
          React.createElement("small", { className: "text-[10px] text-slate-500" }, "Atau klik tombol di bawah untuk memindai seluruh halaman sekaligus secara otomatis:"),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: runFullOcr,
              className: "px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-550 text-white rounded font-semibold transition-colors cursor-pointer"
            },
            "🔍 Mulai Pindai Semua Otomatis"
          )
        )
      : React.createElement(
          "div",
          { className: "max-h-[22vh] overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950 space-y-2 text-slate-100" },
          localLines.map((line, index) =>
            React.createElement(
              "div",
              { key: index, className: "flex items-center gap-2 p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-all" },
              React.createElement("input", {
                type: "text",
                value: line,
                onChange: (e) => {
                  const val = e.target.value;
                  setLocalLines(prev => {
                    const next = [...prev];
                    next[index] = val;
                    return next;
                  });
                },
                className: "flex-grow bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500"
              }),
              React.createElement(
                "button",
                {
                  onClick: () => setAsJudulBab(line),
                  className: "px-2 py-1 bg-indigo-600 hover:bg-indigo-555 text-white rounded text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                },
                "🏷️ Bab"
              ),
              React.createElement(
                "button",
                {
                  onClick: () => addAsTp(line),
                  className: "px-2 py-1 bg-emerald-600 hover:bg-emerald-555 text-white rounded text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                },
                "🎯 TP"
              )
            )
          )
        )
  );
};
