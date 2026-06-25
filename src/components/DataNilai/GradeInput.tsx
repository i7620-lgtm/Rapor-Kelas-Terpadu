import React, { useState, useEffect } from "react";

export const GradeInput = React.memo(({
  id,
  value,
  onCommit,
  onPaste,
  className,
  readOnly,
  kkm,
  onFocus,
  onMouseDown,
  showTransparentInput,
}) => {
  const [localValue, setLocalValue] = useState(value ?? "");
  const isFilled =
    localValue !== null &&
    localValue !== undefined &&
    String(localValue).trim() !== "";

  let isBelowKkm = false;
  if (isFilled && kkm !== undefined && kkm !== null) {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue) && numValue < kkm) {
      isBelowKkm = true;
    }
  }

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    const hasSeparators = /[\n\r\t;]/.test(val) || (/\s+/.test(val.trim()) && val.trim().split(/\s+/).length > 1);
    
    if (hasSeparators) {
      if (onPaste) {
        onPaste({
          preventDefault: () => {},
          clipboardData: {
            getData: () => val
          }
        });
      }
      return;
    }

    if (val === "" || /^\d*$/.test(val)) {
      const num = parseInt(val, 10);
      if (val === "" || (!isNaN(num) && num >= 0 && num <= 100)) {
        setLocalValue(val);
      }
    }
  };

  const handleBlur = () => {
    if (String(localValue) !== String(value ?? "")) {
      onCommit(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  return React.createElement("input", {
    id: id,
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: localValue,
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onPaste: onPaste,
    onFocus: onFocus,
    onMouseDown: onMouseDown,
    readOnly: readOnly,
    className: `${className} transition-all border ${
      showTransparentInput
        ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0 relative z-10 font-bold"
        : !isFilled
          ? "border-red-500 ring-1 ring-red-500"
          : isBelowKkm
            ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
            : "border-green-500 ring-1 ring-green-500"
    }`,
  });
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.value === next.value &&
    prev.className === next.className &&
    prev.readOnly === next.readOnly &&
    prev.kkm === next.kkm &&
    prev.showTransparentInput === next.showTransparentInput
  );
});
