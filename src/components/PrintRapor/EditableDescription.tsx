import React, { useState, useEffect, useRef } from 'react';

interface EditableDescriptionProps {
    value: string;
    onSave: (val: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    multiline?: boolean;
}

export const EditableDescription: React.FC<EditableDescriptionProps> = ({ 
    value, 
    onSave, 
    placeholder, 
    className, 
    style, 
    multiline = false 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onSave(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter for new line in textarea
            e.preventDefault(); 
            handleSave(); 
        }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (multiline) {
                inputRef.current.style.height = 'auto';
                inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
            }
        }
    }, [isEditing, multiline]);

    if (isEditing) {
        if (multiline) {
            return React.createElement('textarea', {
                ref: inputRef as React.RefObject<HTMLTextAreaElement>,
                value: localValue,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setLocalValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                },
                onBlur: handleSave,
                onKeyDown: handleKeyDown,
                className: `w-full bg-white border border-indigo-500 rounded p-1 outline-none resize-none font-inherit text-inherit leading-tight ${className || ''}`,
                style: { minHeight: '1.5em', overflow: 'hidden', ...style }
            });
        }
        return React.createElement('input', {
            ref: inputRef as React.RefObject<HTMLInputElement>,
            value: localValue,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value),
            onBlur: handleSave,
            onKeyDown: handleKeyDown,
            className: `w-full bg-white border border-indigo-500 rounded p-1 outline-none font-inherit text-inherit leading-tight ${className || ''}`,
            style: { ...style }
        });
    }

    return React.createElement('div', {
        onClick: handleStartEditing,
        className: `cursor-text relative group hover:bg-yellow-50 rounded px-1 -mx-1 transition-colors print:hover:bg-transparent ${className || ''}`,
        style: style
    },
        (localValue !== undefined && localValue !== null && localValue !== '') ? localValue : React.createElement('span', { className: "text-gray-400 italic print:hidden" }, placeholder),
        React.createElement('span', { className: "absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 print:hidden pointer-events-none" }, 
            React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" })
            )
        )
    );
};
