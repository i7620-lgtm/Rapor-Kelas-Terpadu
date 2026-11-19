import React from "react";

interface ManageSlmItemProps {
  slm: {
    id: string;
    name: string;
    tps: Array<{ text: string; isEdited?: boolean }>;
  };
  onSlmNameChange: (slmId: string, newName: string) => void;
  onDeleteSlm: (slmId: string) => void;
  onTpTextChange: (slmId: string, tpIndex: number, newText: string) => void;
  onDeleteTp: (slmId: string, tpIndex: number) => void;
  onAddManualTp: (slmId: string) => void;
  onOpenTpSelection: (slmId: string) => void;
}

export const ManageSlmItem: React.FC<ManageSlmItemProps> = ({
  slm,
  onSlmNameChange,
  onDeleteSlm,
  onTpTextChange,
  onDeleteTp,
  onAddManualTp,
  onOpenTpSelection,
}) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/40">
      <div className="flex items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-t-lg border-b border-slate-200 dark:border-slate-700 gap-2 sm:gap-4">
        <input
          type="text"
          value={slm.name}
          onChange={(e) => onSlmNameChange(slm.id, e.target.value)}
          className="flex-grow min-w-0 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none"
        />
        <button
          onClick={() => onDeleteSlm(slm.id)}
          aria-label="Hapus Lingkup Materi"
          className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 text-2xl leading-none flex-shrink-0 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          &times;
        </button>
      </div>
      <div className="p-3 sm:p-4 space-y-2.5">
        {slm.tps.map((tp, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="font-semibold text-xs text-slate-400 dark:text-slate-500 pt-2 tabular-nums shrink-0">
              TP {index + 1}:
            </span>
            <textarea
              value={tp.text}
              onChange={(e) => onTpTextChange(slm.id, index, e.target.value)}
              className="flex-grow p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none outline-none focus:border-indigo-500"
              rows={2}
            />
            <button
              onClick={() => onDeleteTp(slm.id, index)}
              aria-label={`Hapus TP ${index + 1}`}
              className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 text-xl leading-none flex-shrink-0 mt-0.5 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              &times;
            </button>
          </div>
        ))}
        {slm.tps.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
            Belum ada Tujuan Pembelajaran.
          </p>
        )}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-row flex-wrap gap-2 justify-end items-center">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAddManualTp(slm.id)}
              className="px-3 py-1.5 min-h-[40px] lg:min-h-0 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 transition-all cursor-pointer"
            >
              + Tambah TP Manual
            </button>
            <button
              type="button"
              onClick={() => onOpenTpSelection(slm.id)}
              className="px-3 py-1.5 min-h-[40px] lg:min-h-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 cursor-pointer"
            >
              Pilih TP dari Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
