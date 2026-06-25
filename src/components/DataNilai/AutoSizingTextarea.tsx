import React, { useRef, useState, useEffect } from "react";

export const AutoSizingTextarea = React.memo(({ value, onChange, onBlur, ...props }) => {
  const textareaRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e.target.value);
  };

  return React.createElement("textarea", {
    ref: textareaRef,
    value: localValue,
    onChange: handleChange,
    onBlur: handleBlur,
    ...props,
  });
});
