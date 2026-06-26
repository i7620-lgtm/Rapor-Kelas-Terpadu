import React from "react";

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
        className="p-2 text-center border-b border-r border-slate-200 sticky top-0 z-40 bg-slate-100  box-border select-none cursor-default"
        style={{
          left: 0,
          top: 0,
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
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
        className="p-2 border-b border-r border-slate-200 min-w-[200px] max-w-[300px] lg:sticky top-0 lg:z-40 bg-slate-100 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] box-border select-none cursor-default"
        style={{
          left: "50px",
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

      {/* 4. Column STS */}
      {(!settings.semester || settings.semester === "Ganjil") && (
        <th
          rowSpan={headerRowSpan}
          className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem] select-none cursor-default"
          style={getSelectionStyle(-1, tpHeaders.length).selectionStyle}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, tpHeaders.length, "nilai-cell");
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, tpHeaders.length)}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span>STS I</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sts1")}
                title="Olah Nilai Otomatis (Regresi)"
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </th>
      )}
      {settings.semester === "Genap" && (
        <th
          rowSpan={headerRowSpan}
          className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem] select-none cursor-default"
          style={getSelectionStyle(-1, tpHeaders.length).selectionStyle}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, tpHeaders.length, "nilai-cell");
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, tpHeaders.length)}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span>STS II</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sts2")}
                title="Olah Nilai Otomatis (Regresi)"
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </th>
      )}

      {/* 5. Column SAS */}
      {(!settings.semester || settings.semester === "Ganjil") && (
        <th
          rowSpan={headerRowSpan}
          className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem] select-none cursor-default"
          style={getSelectionStyle(-1, tpHeaders.length + 1).selectionStyle}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, tpHeaders.length + 1, "nilai-cell");
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, tpHeaders.length + 1)}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span>SAS I</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sas1")}
                title="Olah Nilai Otomatis (Regresi)"
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </th>
      )}
      {settings.semester === "Genap" && (
        <th
          rowSpan={headerRowSpan}
          className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem] select-none cursor-default"
          style={getSelectionStyle(-1, tpHeaders.length + 1).selectionStyle}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, tpHeaders.length + 1, "nilai-cell");
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, tpHeaders.length + 1)}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span>{gradeNumber === 6 ? "US" : "SAS II"}</span>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegressionNonTP("sas2")}
                title="Olah Nilai Otomatis (Regresi)"
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </th>
      )}

      {/* 6. Nilai Akhir */}
      <th
        rowSpan={headerRowSpan}
        className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem]"
      >
        Nilai Akhir
      </th>

      {/* 7. Capaian Kompetensi */}
      <th
        rowSpan={headerRowSpan}
        className={`p-2 text-center border-b border-l border-slate-200 min-w-[600px] ${
          isCapaianPinned
            ? "sticky right-0 bg-slate-100 z-30 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]"
            : ""
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-semibold text-slate-800">Capaian Kompetensi</span>
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={handleBulkGenerateDescriptions}
              className="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-300 font-bold shadow-sm transition-colors cursor-pointer"
            >
              Generate Otomatis
            </button>
            <label className="flex items-center gap-1 text-[10px] text-slate-500 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCapaianPinned}
                onChange={(e) => handleToggleCapaianPinned(e.target.checked)}
                className="w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              Kunci Kolom (Sticky)
            </label>
          </div>
        </div>
      </th>
    </tr>
  );
};
