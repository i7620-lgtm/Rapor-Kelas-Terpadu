import React, { useRef, useState, useEffect } from "react";

export interface AutoSizingTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onBlur"> {
  value?: string | number | null;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: (value: string) => void;
}

export const AutoSizingTextarea = React.memo<AutoSizingTextareaProps>(
  ({ value, onChange, onBlur, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [localValue, setLocalValue] = useState<string>(String(value ?? ""));

    useEffect(() => {
      setLocalValue(String(value ?? ""));
    }, [value]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [localValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      if (onChange) onChange(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (onBlur) onBlur(e.target.value);
    };

    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
