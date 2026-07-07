import React from "react";

interface TpHeader {
  slmId: string;
  tpIndex: number;
  text: string;
  displayIndex: string;
}

interface NilaiTableTpHeaderRowProps {
  tpHeaders: TpHeader[];
  getSelectionStyle: (row: number, col: number) => { selectionStyle?: React.CSSProperties };
  handleMouseDownCell: (e: React.MouseEvent, row: number, col: number, type: string) => void;
  handleMouseEnterCell: (row: number, col: number) => void;
  showTooltip: (e: React.MouseEvent, content: string) => void;
  hideTooltip: () => void;
  settings: {
    enableAutoRegression?: boolean;
  };
  handleAutoRegression: (slmId: string, tpIndex: number) => void;
}

export const NilaiTableTpHeaderRow: React.FC<NilaiTableTpHeaderRowProps> = ({
  tpHeaders,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  showTooltip,
  hideTooltip,
  settings,
  handleAutoRegression,
}) => {
  return (
    <tr>
      {tpHeaders.map((h, colIdx) => (
        <th
          key={`${h.slmId}-${h.tpIndex}`}
          className="p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem] select-none cursor-default"
          style={getSelectionStyle(-1, colIdx).selectionStyle}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (e.shiftKey) e.preventDefault();
            handleMouseDownCell(e, -1, colIdx, "nilai-cell");
          }}
          onMouseEnter={() => handleMouseEnterCell(-1, colIdx)}
        >
          <div className="flex items-center justify-center gap-1">
            <button
              className="tp-header-button"
              onMouseEnter={(e) => showTooltip(e, h.text)}
              onMouseLeave={hideTooltip}
            >
              TP {h.displayIndex}
            </button>
            {settings.enableAutoRegression && (
              <button
                onClick={() => handleAutoRegression(h.slmId, h.tpIndex)}
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
      ))}
    </tr>
  );
};
