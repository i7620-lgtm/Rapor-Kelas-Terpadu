import React from "react";

interface NilaiTableToolbarProps {
  onOpenSettings: () => void;
  onOpenManageSlm: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  onUndo: () => void;
  onRedo: () => void;
}

export const NilaiTableToolbar: React.FC<NilaiTableToolbarProps> = ({
  onOpenSettings,
  onOpenManageSlm,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
}) => {
  const undoTitle = canUndo
    ? `Urungkan${undoLabel ? `: ${undoLabel}` : ""} (Ctrl+Z)`
    : "Tidak ada perubahan untuk diurungkan (Ctrl+Z)";
  const redoTitle = canRedo
    ? `Ulangi${redoLabel ? `: ${redoLabel}` : ""} (Ctrl+Y)`
    : "Tidak ada perubahan untuk diulangi (Ctrl+Y)";

  const historyBtnClass =
    "min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:h-7 lg:w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-200 shrink-0";

  return (
    <div className="px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide w-full">
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Riwayat perubahan nilai">
          <button
            type="button"
            id="btn-undo-nilai"
            onClick={onUndo}
            disabled={!canUndo}
            title={undoTitle}
            aria-label={undoTitle}
            className={historyBtnClass}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.9}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </button>
          <button
            type="button"
            id="btn-redo-nilai"
            onClick={onRedo}
            disabled={!canRedo}
            title={redoTitle}
            aria-label={redoTitle}
            className={historyBtnClass}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.9}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
              />
            </svg>
          </button>
        </div>

        <div
          className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0"
          aria-hidden="true"
        />

        <button
          type="button"
          id="btn-rentang-nilai-pengolahan"
          onClick={onOpenSettings}
          className="min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-colors"
        >
          Rentang Nilai & Pengolahan
        </button>
        <button
          type="button"
          id="btn-atur-lingkup-materi"
          onClick={onOpenManageSlm}
          className="min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-colors"
        >
          Atur Lingkup Materi & TP
        </button>
      </div>
    </div>
  );
};
