import React from "react";

export interface OcrDraftEditorProps {
  judulBab: string;
  setJudulBab: (val: string) => void;
  tps: string[];
  handleUpdateTpText: (idx: number, val: string) => void;
  handleRemoveTp: (idx: number) => void;
  handleAddTpManual: () => void;
  handleClear: () => void;
}

export const OcrDraftEditor: React.FC<OcrDraftEditorProps> = ({
  judulBab,
  setJudulBab,
  tps,
  handleUpdateTpText,
  handleRemoveTp,
  handleAddTpManual,
  handleClear,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-slate-950 p-4 border border-slate-800 rounded-lg flex-grow overflow-y-auto max-h-[35vh]">
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1">
        ✏️ KONSTRUKSI MATERI & TP BARU
      </span>
      <div className="space-y-1 mt-2">
        <label className="text-xs font-medium text-slate-400">
          Nama Lingkup Materi (Judul Bab):
        </label>
        <input
          type="text"
          value={judulBab}
          onChange={(e) => setJudulBab(e.target.value)}
          placeholder="Contoh: Bab 1 Bilangan Cacah, atau sorot lewat '🏷️ Bab' diatas"
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded px-3 py-1.5 text-sm outline-none"
        />
      </div>
      <div className="space-y-2 mt-3">
        <label className="text-xs font-medium text-slate-400 block">
          Daftar Tujuan Pembelajaran (TP):
        </label>
        {tps.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-800 rounded-md">
            Belum ada TP. Sorot area TP di atas atau tambah manual di bawah.
          </p>
        ) : (
          tps.map((tp, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-bold pt-2.5">
                {`TP ${idx + 1}:`}
              </span>
              <textarea
                value={tp}
                onChange={(e) => handleUpdateTpText(idx, e.target.value)}
                placeholder={`Isi Tujuan Pembelajaran ${idx + 1}`}
                rows={2}
                className="flex-grow bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs rounded p-2 resize-none outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveTp(idx)}
                aria-label={`Hapus TP ${idx + 1}`}
                className="text-red-400 hover:text-red-500 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center font-bold text-lg p-1.5 self-center cursor-pointer rounded hover:bg-red-950/30"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 pt-2 justify-between flex-wrap">
        <button
          type="button"
          onClick={handleAddTpManual}
          className="px-3 py-1.5 min-h-[40px] lg:min-h-0 text-xs bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-900/60 rounded-md transition-colors cursor-pointer"
        >
          + Tambah TP Baru secara Manual
        </button>
        {(judulBab || tps.length > 0) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 min-h-[40px] lg:min-h-0 text-xs text-red-400 hover:text-red-500 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
          >
            Kosongkan Formulir
          </button>
        )}
      </div>
    </div>
  );
};
