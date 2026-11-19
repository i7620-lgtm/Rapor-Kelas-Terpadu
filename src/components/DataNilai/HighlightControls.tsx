import React from "react";

export interface HighlightControlsProps {
  showIncompleteHighlight: boolean;
  setShowIncompleteHighlight: (val: boolean) => void;
  showBelowKkmHighlight: boolean;
  setShowBelowKkmHighlight?: (val: boolean) => void;
  showMaxHighlight: boolean;
  setShowMaxHighlight: (val: boolean) => void;
  showMinHighlight: boolean;
  setShowMinHighlight: (val: boolean) => void;
  sortBy: "no" | "rank" | string;
  setSortBy: (val: "no" | "rank") => void;
}

export const HighlightControls: React.FC<HighlightControlsProps> = ({
  showIncompleteHighlight,
  setShowIncompleteHighlight,
  showBelowKkmHighlight,
  setShowBelowKkmHighlight,
  showMaxHighlight,
  setShowMaxHighlight,
  showMinHighlight,
  setShowMinHighlight,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 flex-wrap gap-2">
      <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold select-none flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowIncompleteHighlight(!showIncompleteHighlight);
          }}
          className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showIncompleteHighlight
              ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
              showIncompleteHighlight ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
          <span>Nilai Tidak Lengkap</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setShowBelowKkmHighlight) {
              setShowBelowKkmHighlight(!showBelowKkmHighlight);
            }
          }}
          className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showBelowKkmHighlight
              ? "bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
              showBelowKkmHighlight ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
          <span>Nilai di Bawah KKM</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMaxHighlight(!showMaxHighlight);
          }}
          className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showMaxHighlight
              ? "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
              showMaxHighlight ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
          <span>Nilai Tertinggi</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMinHighlight(!showMinHighlight);
          }}
          className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showMinHighlight
              ? "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-200"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
              showMinHighlight ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
          <span>Nilai Terendah</span>
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mr-1 sm:mr-2">
          Urutkan:
        </span>
        <div className="flex items-center gap-3 sm:gap-4">
          <label className="min-h-[44px] lg:min-h-0 flex items-center cursor-pointer py-1">
            <input
              type="radio"
              name="sort"
              value="no"
              checked={sortBy === "no"}
              onChange={() => setSortBy("no")}
              className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600"
            />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              No. Absen
            </span>
          </label>
          <label className="min-h-[44px] lg:min-h-0 flex items-center cursor-pointer py-1">
            <input
              type="radio"
              name="sort"
              value="rank"
              checked={sortBy === "rank"}
              onChange={() => setSortBy("rank")}
              className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600"
            />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Peringkat (Rank)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
