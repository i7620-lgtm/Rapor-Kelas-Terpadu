import React, { useState, useEffect } from "react";

export type SyntheticPasteEvent = {
  preventDefault: () => void;
  clipboardData: {
    getData: (type: string) => string;
  };
};

export interface GradeInputProps {
  id?: string;
  min?: number;
  max?: number;
  value: string | number | null | undefined;
  onCommit: (value: string) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement> | SyntheticPasteEvent) => void;
  className?: string;
  readOnly?: boolean;
  kkm?: number | string | null;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onMouseDown?: React.MouseEventHandler<HTMLInputElement>;
  showTransparentInput?: boolean;
}

export const GradeInput = React.memo<GradeInputProps>(
  ({
    id,
    min = 0,
    max = 100,
    value,
    onCommit,
    onPaste,
    className = "",
    readOnly,
    kkm,
    onFocus,
    onMouseDown,
    showTransparentInput,
  }) => {
    const [localValue, setLocalValue] = useState<string>(String(value ?? ""));
    const isFilled =
      localValue !== null &&
      localValue !== undefined &&
      String(localValue).trim() !== "";

    let isBelowKkm = false;
    if (isFilled && kkm !== undefined && kkm !== null && String(kkm).trim() !== "") {
      const numValue = parseFloat(String(localValue));
      const numKkm = typeof kkm === "number" ? kkm : parseFloat(String(kkm));
      if (!isNaN(numValue) && !isNaN(numKkm) && numValue < numKkm) {
        isBelowKkm = true;
      }
    }

    useEffect(() => {
      setLocalValue(String(value ?? ""));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const hasSeparators =
        /[\n\r\t;]/.test(val) ||
        (/\s+/.test(val.trim()) && val.trim().split(/\s+/).length > 1);

      if (hasSeparators) {
        if (onPaste) {
          onPaste({
            preventDefault: () => {},
            clipboardData: {
              getData: () => val,
            },
          });
        }
        return;
      }

      if (val === "" || /^\d*$/.test(val)) {
        const num = parseInt(val, 10);
        if (val === "" || (!isNaN(num) && num >= min && num <= max)) {
          setLocalValue(val);
        }
      }
    };

    const handleBlur = () => {
      if (String(localValue) !== String(value ?? "")) {
        onCommit(localValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    return (
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        data-committed-value={String(value ?? "")}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
        readOnly={readOnly}
        className={`${className} transition-all border ${
          showTransparentInput
            ? "bg-white border-transparent shadow-none outline-none focus:outline-none focus:ring-0 relative z-10 font-bold"
            : !isFilled
              ? "border-red-500 ring-1 ring-red-500 bg-white"
              : isBelowKkm
                ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                : "border-green-500 ring-1 ring-green-500 bg-white"
        }`}
      />
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.value === next.value &&
      prev.className === next.className &&
      prev.readOnly === next.readOnly &&
      prev.kkm === next.kkm &&
      prev.showTransparentInput === next.showTransparentInput
    );
  }
);
