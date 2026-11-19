import React from "react";

export interface SummativeTableHeaderProps {
  isSLM: boolean;
  isWeighting: boolean;
  headerRowSpan: number;
  getSelectionStyle: (
    row: number,
    col: number
  ) => { selectionStyle?: React.CSSProperties };
  handleMouseDownCell: (
    e: React.MouseEvent,
    row: number,
    col: number
  ) => void;
  handleMouseEnterCell: (row: number, col: number) => void;
  localObjectives: any[];
  type: string;
  weights: any;
  item: any;
  handleWeightChange: (
    weightType: string,
    val: string,
    itemId?: string,
    tpIndex?: number
  ) => void;
  handleBulkGenerateDescriptions: () => void;
}

export const SummativeTableHeader: React.FC<SummativeTableHeaderProps> = ({
  isSLM,
  isWeighting,
  headerRowSpan,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  localObjectives,
  type,
  weights,
  item,
  handleWeightChange,
  handleBulkGenerateDescriptions,
}) => {
  return (
    <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-[30]">
      <tr>
        <th
          rowSpan={headerRowSpan}
          className="p-1.5 sm:p-2 text-center sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none align-middle border-b border-r border-slate-200 dark:border-slate-700 w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] box-border select-none cursor-default tabular-nums"
          style={{
            left: 0,
            top: 0,
            ...getSelectionStyle(-1, -2).selectionStyle,
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, -2);
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, -2)}
        >
          No
        </th>
        <th
          rowSpan={headerRowSpan}
          className="p-2 align-middle border-b border-r border-slate-200 dark:border-slate-700 sticky top-0 z-10 lg:z-20 lg:left-[50px] bg-slate-100 dark:bg-slate-800 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal box-border select-none cursor-default"
          style={{
            top: 0,
            ...getSelectionStyle(-1, -1).selectionStyle,
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, -1);
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, -1)}
        >
          Nama Siswa
        </th>
        {isSLM ? (
          localObjectives.map((_, i) => (
            <th
              key={`tp-header-${i}`}
              colSpan={2}
              className="px-2 py-3 text-center border-b border-l border-slate-200 dark:border-slate-700 select-none cursor-default"
              style={getSelectionStyle(-1, i * 2).selectionStyle}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                if (e.shiftKey) e.preventDefault();
                handleMouseDownCell(e, -1, i * 2);
              }}
              onMouseEnter={() => handleMouseEnterCell(-1, i * 2)}
            >
              {`TP ${i + 1}`}
            </th>
          ))
        ) : (
          <th
            rowSpan={headerRowSpan}
            className="px-2 py-3 text-center align-middle border-b border-slate-200 dark:border-slate-700 select-none cursor-default"
            style={getSelectionStyle(-1, 0).selectionStyle}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              if (e.shiftKey) e.preventDefault();
              handleMouseDownCell(e, -1, 0);
            }}
            onMouseEnter={() => handleMouseEnterCell(-1, 0)}
          >
            {`Nilai ${type.toUpperCase()}`}
          </th>
        )}
        {isSLM && (
          <th
            rowSpan={headerRowSpan}
            className="px-3 sm:px-4 py-3 text-center bg-slate-200 dark:bg-slate-700/80 align-middle border-b border-l border-slate-200 dark:border-slate-700"
          >
            Rata-rata
          </th>
        )}
        <th
          rowSpan={headerRowSpan}
          className="px-3 sm:px-4 py-3 text-center align-middle border-b border-l border-slate-200 dark:border-slate-700 min-w-[260px] sm:min-w-[460px] lg:min-w-[600px]"
        >
          <div className="flex flex-col items-center gap-2">
            Capaian Kompetensi
            <button
              type="button"
              onClick={handleBulkGenerateDescriptions}
              className="px-3 py-1.5 min-h-[38px] lg:min-h-0 text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 font-bold transition-colors"
            >
              Generate Otomatis
            </button>
          </div>
        </th>
      </tr>

      {isSLM && isWeighting && (
        <tr>
          {localObjectives.map((_, i) => (
            <th
              key={`weight-header-${i}`}
              colSpan={2}
              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 align-middle text-center border-b border-l border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-indigo-900 dark:text-indigo-300 text-xs font-bold">
                  BOBOT
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.TP?.[item.id]?.[i] ?? ""}
                  onChange={(e) =>
                    handleWeightChange("TP", e.target.value, item.id, i)
                  }
                  className={`w-16 p-1 text-center tabular-nums border rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                    weights.TP?.[item.id]?.[i] !== null &&
                    weights.TP?.[item.id]?.[i] !== undefined &&
                    weights.TP?.[item.id]?.[i] !== ""
                      ? "border-green-500 ring-1 ring-green-500"
                      : "border-red-500 ring-1 ring-red-500"
                  }`}
                />
              </div>
            </th>
          ))}
        </tr>
      )}

      {isSLM && (
        <tr>
          {localObjectives.map((_, i) => (
            <React.Fragment key={`sub-header-${i}`}>
              <th className="px-2 py-2 text-center font-normal border-b border-l border-slate-200 dark:border-slate-700">
                Kuantitatif
              </th>
              <th className="px-2 py-2 text-center font-normal border-b border-slate-200 dark:border-slate-700">
                Kualitatif
              </th>
            </React.Fragment>
          ))}
        </tr>
      )}

      {!isSLM && isWeighting && (
        <tr>
          <th className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 align-middle text-center border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-1">
              <span className="text-indigo-900 dark:text-indigo-300 text-xs font-bold">
                BOBOT
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={weights[type.toUpperCase()] ?? ""}
                onChange={(e) =>
                  handleWeightChange(type.toUpperCase(), e.target.value)
                }
                className={`w-20 p-2 text-center tabular-nums border rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  weights[type.toUpperCase()] !== null &&
                  weights[type.toUpperCase()] !== undefined &&
                  weights[type.toUpperCase()] !== ""
                    ? "border-green-500 ring-1 ring-green-500"
                    : "border-red-500 ring-1 ring-red-500"
                }`}
              />
            </div>
          </th>
        </tr>
      )}
    </thead>
  );
};
