import React from "react";
import { GradeInput } from "./GradeInput";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";
import { getNumericValue, getQualitativeCode } from "../../utils/nilaiHelpers";

interface NilaiTableGradingCellProps {
  id: string;
  value: any;
  mode: "kualitatif" | "kuantitatif";
  settings: {
    qualitativeGradingMap?: any;
    predikats?: { c?: number; [key: string]: any };
  };
  onChange: (newValue: string) => void;
  onCommit: (newValue: any) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  onFocus: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  showTransparentInput: boolean;
  className?: string;
}

export const NilaiTableGradingCell: React.FC<NilaiTableGradingCellProps> = React.memo(({
  id,
  value,
  mode,
  settings,
  onChange,
  onCommit,
  onPaste,
  onFocus,
  onMouseDown,
  showTransparentInput,
  className = "w-full p-2 text-center",
}) => {
  if (mode === "kualitatif") {
    const qualitativeCode = getQualitativeCode(value, settings.predikats);
    const isFilled = qualitativeCode && qualitativeCode !== "";
    const isBelowKkm = qualitativeCode === "BB";

    return (
      <select
        id={id}
        value={qualitativeCode}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onMouseDown={(e) => {
          if (e.shiftKey) {
            e.preventDefault();
            if (onMouseDown) onMouseDown(e);
          }
        }}
        className={`w-full p-2 text-sm border rounded-md transition-all relative z-10 ${
          showTransparentInput
            ? "bg-transparent border-transparent shadow-[none_!important] outline-none focus:outline-none focus:ring-0"
            : !isFilled
              ? "text-rose-700 bg-rose-50/30 border-red-500 ring-1 ring-red-500"
              : isBelowKkm
                ? "text-red-600 bg-rose-50 border-red-500 ring-1 ring-red-500"
                : "text-emerald-700 bg-emerald-50/30 border-green-500 ring-1 ring-green-500"
        }`}
      >
        <option value="">-</option>
        {Object.keys(QUALITATIVE_DESCRIPTORS).map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    );
  }

  const numericValue = getNumericValue(value, settings.qualitativeGradingMap);

  return (
    <GradeInput
      id={id}
      min={0}
      max={100}
      value={numericValue}
      onChange={onChange}
      onCommit={onCommit}
      onPaste={onPaste}
      onFocus={onFocus}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if (onMouseDown) onMouseDown(e);
      }}
      showTransparentInput={showTransparentInput}
      className={className}
      kkm={settings.predikats?.c}
    />
  );
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.value === next.value &&
    prev.mode === next.mode &&
    prev.settings === next.settings &&
    prev.showTransparentInput === next.showTransparentInput &&
    prev.className === next.className
  );
});
