import React from "react";

interface TpHeader {
  slmId: string;
  tpIndex: number;
}

interface NilaiTableWeightingHeaderRowProps {
  tpHeaders: TpHeader[];
  weights: {
    TP?: Record<string, Record<string, number | string>>;
    STS?: number | string;
    SAS?: number | string;
  };
  handleWeightChange: (
    type: "TP" | "STS" | "SAS",
    value: string,
    slmId?: string,
    tpIndex?: number
  ) => void;
  settings: {
    semester?: string;
  };
}

export const NilaiTableWeightingHeaderRow: React.FC<NilaiTableWeightingHeaderRowProps> = ({
  tpHeaders,
  weights,
  handleWeightChange,
  settings: _settings,
}) => {
  return (
    <tr>
      {tpHeaders.map((h) => {
        const value = weights.TP?.[h.slmId]?.[h.tpIndex] ?? "";
        const isSet = value !== null && value !== undefined && value !== "";

        return (
          <th
            key={`w-${h.slmId}-${h.tpIndex}`}
            className="p-1 text-center border-b border-l border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/40"
          >
            <input
              type="number"
              min={0}
              max={100}
              value={value}
              onChange={(e) =>
                handleWeightChange(
                  "TP",
                  e.target.value,
                  h.slmId,
                  h.tpIndex
                )
              }
              className={`w-full p-1 text-center text-xs tabular-nums border rounded shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 ${
                isSet
                  ? "border-green-500 ring-1 ring-green-500"
                  : "border-red-500 ring-1 ring-red-500"
              }`}
            />
          </th>
        );
      })}

      {/* Weighting for STS Section */}
      <th className="p-1 text-center border-b border-l border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/40">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="%"
          value={weights.STS ?? ""}
          onChange={(e) => handleWeightChange("STS", e.target.value)}
          className={`w-full p-1 text-center text-xs tabular-nums border rounded shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 ${
            weights.STS !== null && weights.STS !== undefined && weights.STS !== ""
              ? "border-green-500 ring-1 ring-green-500"
              : "border-red-500 ring-1 ring-red-500"
          }`}
        />
      </th>

      {/* Weighting for SAS Section */}
      <th className="p-1 text-center border-b border-l border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/40">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="%"
          value={weights.SAS ?? ""}
          onChange={(e) => handleWeightChange("SAS", e.target.value)}
          className={`w-full p-1 text-center text-xs tabular-nums border rounded shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 ${
            weights.SAS !== null && weights.SAS !== undefined && weights.SAS !== ""
              ? "border-green-500 ring-1 ring-green-500"
              : "border-red-500 ring-1 ring-red-500"
          }`}
        />
      </th>
    </tr>
  );
};
