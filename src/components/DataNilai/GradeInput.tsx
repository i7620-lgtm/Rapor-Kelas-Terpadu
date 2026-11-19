import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { registerPendingFlush } from "../../utils/dataIntegrity";

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
    const initialStr = String(value ?? "");
    const [localValue, setLocalValue] = useState<string>(initialStr);
    const flushKey = useId();
    const localValueRef = useRef<string>(initialStr);
    const committedValueRef = useRef<string>(initialStr);
    const isDirtyRef = useRef<boolean>(false);
    const onCommitRef = useRef(onCommit);
    const readOnlyRef = useRef(readOnly);

    onCommitRef.current = onCommit;
    readOnlyRef.current = readOnly;

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
      const nextStr = String(value ?? "");
      setLocalValue(nextStr);
      localValueRef.current = nextStr;
      committedValueRef.current = nextStr;
      isDirtyRef.current = false;
    }, [value]);

    const commitIfDirty = useCallback(() => {
      if (readOnlyRef.current) return;
      const currentVal = String(localValueRef.current ?? "");
      if (isDirtyRef.current && currentVal !== committedValueRef.current) {
        isDirtyRef.current = false;
        committedValueRef.current = currentVal;
        onCommitRef.current(currentVal);
      }
    }, []);

    useEffect(() => {
      const unregister = registerPendingFlush(`grade-input:${flushKey}`, commitIfDirty);
      return () => {
        unregister();
        commitIfDirty();
      };
    }, [flushKey, commitIfDirty]);

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
          localValueRef.current = val;
          isDirtyRef.current = val !== committedValueRef.current;
        }
      }
    };

    const handleBlur = () => {
      commitIfDirty();
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
