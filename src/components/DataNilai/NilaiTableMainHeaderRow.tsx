import React from "react";
import { StsSasHeaders } from "./NilaiTableRowParts";

interface SlmHeader {
  id: string;
  name: string;
  colSpan: number;
}

interface TpHeader {
  slmId: string;
  tpIndex: number;
  text: string;
  displayIndex: string;
}

interface NilaiTableMainHeaderRowProps {
  headerRowSpan: number;
  getSelectionStyle: (row: number, col: number) => { selectionStyle?: React.CSSProperties };
  handleMouseDownCell: (e: React.MouseEvent, row: number, col: number, type: string) => void;
  handleMouseEnterCell: (row: number, col: number) => void;
  slmHeaders: SlmHeader[];
  tpHeaders: TpHeader[];
  settings: {
    semester?: string;
    enableAutoRegression?: boolean;
  };
  handleAutoRegressionNonTP: (type: "sts1" | "sts2" | "sas1" | "sas2") => void;
  showTooltip: (e: React.MouseEvent, content: string) => void;
  hideTooltip: () => void;
  slmTextRefs: React.RefObject<Record<string, HTMLSpanElement | null>>;
  isCapaianPinned: boolean;
  handleToggleCapaianPinned: (checked: boolean) => void;
  handleBulkGenerateDescriptions: () => void;
  gradeNumber: number;
}

export const NilaiTableMainHeaderRow: React.FC<NilaiTableMainHeaderRowProps> = ({
  headerRowSpan,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  slmHeaders,
  tpHeaders,
  settings,
  handleAutoRegressionNonTP,
  showTooltip,
  hideTooltip,
  slmTextRefs,
  isCapaianPinned,
  handleToggleCapaianPinned,
  handleBulkGenerateDescriptions,
  gradeNumber,
}) => {
  return (
    <tr>
      {/* 1. Column NO */}
      <th
        rowSpan={headerRowSpan}
        className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] p-1.5 sm:p-2 text-center border-b border-r border-slate-200 dark:border-slate-700 sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none box-border select-none cursor-default"
        style={{
          left: 0,
          top: 0,
          ...getSelectionStyle(-1, -2).selectionStyle,
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, -1, -2, "nilai-cell");
        }}
        onMouseEnter={() => handleMouseEnterCell(-1, -2)}
      >
        No
      </th>

      {/* 2. Column NAMA SISWA */}
      <th
        rowSpan={headerRowSpan}
        className="p-1.5 sm:p-2 border-b border-r border-slate-200 dark:border-slate-700 w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal sticky top-0 z-30 lg:z-40 lg:left-[50px] bg-slate-100 dark:bg-slate-800 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] box-border select-none cursor-default"
        style={{
          top: 0,
          ...getSelectionStyle(-1, -1).selectionStyle,
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, -1, -1, "nilai-cell");
        }}
        onMouseEnter={() => handleMouseEnterCell(-1, -1)}
      >
        Nama Siswa
      </th>

      {/* 3. dynamic SLM/Bab headers */}
      {slmHeaders.map((h, slmIdx) => {
        const dynamicMinWidth = `${h.colSpan * 5}rem`;

        return (
          <th
            key={h.id}
            colSpan={h.colSpan}
            className="p-2 text-center border-b border-l border-slate-200"
            style={{ minWidth: dynamicMinWidth }}
          >
            <button
              className="tp-header-button"
              onMouseEnter={(e) => showTooltip(e, h.name)}
              onMouseLeave={hideTooltip}
            >
              <span
                ref={(el) => {
                  if (slmTextRefs && slmTextRefs.current) {
                    slmTextRefs.current[h.id] = el;
                  }
                }}
                className="slm-header-text-clamp"
              >
                Bab {slmIdx + 1}
              </span>
            </button>
          </th>
        );
      })}

      <StsSasHeaders
        settings={settings}
        tpHeadersLength={tpHeaders.length}
        headerRowSpan={headerRowSpan}
        getSelectionStyle={getSelectionStyle}
        handleMouseDownCell={handleMouseDownCell}
        handleMouseEnterCell={handleMouseEnterCell}
        handleAutoRegressionNonTP={handleAutoRegressionNonTP}
        gradeNumber={gradeNumber}
      />
      {/* 6. Nilai Akhir */}
      <th
        rowSpan={headerRowSpan}
        className="p-1.5 sm:p-2 text-center border-b border-l border-slate-200 dark:border-slate-700 w-16 sm:w-20 min-w-[4rem] sm:min-w-[5rem]"
      >
        Nilai Akhir
      </th>

      {/* 7. Capaian Kompetensi */}
      <th
        rowSpan={headerRowSpan}
        className={`p-2 text-center border-b border-l border-slate-200 dark:border-slate-700 min-w-[260px] sm:min-w-[460px] lg:min-w-[600px] ${
          isCapaianPinned
            ? "sticky right-0 bg-slate-100 dark:bg-slate-800 z-30 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]"
            : ""
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-semibold text-slate-800 dark:text-slate-100">Capaian Kompetensi</span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center">
            <button
              onClick={handleBulkGenerateDescriptions}
              className="min-h-[36px] sm:min-h-[40px] lg:min-h-0 px-2.5 lg:px-2 py-1 lg:py-0.5 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-900/60 border border-green-300 dark:border-green-700 font-bold shadow-sm transition-colors cursor-pointer"
            >
              Generate Otomatis
            </button>
            <label className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none min-h-[36px] sm:min-h-[40px] lg:min-h-0 px-1">
              <input
                type="checkbox"
                checked={isCapaianPinned}
                onChange={(e) => handleToggleCapaianPinned(e.target.checked)}
                className="w-3.5 h-3.5 lg:w-3 lg:h-3 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              Kunci Kolom (Sticky)
            </label>
          </div>
        </div>
      </th>
    </tr>
  );
};
