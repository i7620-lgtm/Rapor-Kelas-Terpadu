import React, { useState } from 'react';

interface FormFieldProps {
    label: React.ReactNode;
    id: string;
    type?: string;
    placeholder?: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    status?: 'good' | 'bad' | string;
    readOnly?: boolean;
    [key: string]: any;
}

export const FormField: React.FC<FormFieldProps> = ({ 
    label, 
    id, 
    type = 'text', 
    placeholder = '', 
    value, 
    onChange, 
    onBlur, 
    onKeyDown, 
    className, 
    status, 
    readOnly,
    ...props 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    let borderClass = "border-slate-300 focus-within:ring-indigo-500 focus-within:border-indigo-500";
    if (status === 'bad') {
        borderClass = "border-red-500 focus-within:ring-red-500 focus-within:border-red-500 ring-1 ring-red-500";
    } else if (status === 'good') {
        borderClass = "border-green-500 focus-within:ring-green-500 focus-within:border-green-500 ring-1 ring-green-500";
    }

    return React.createElement('div', { className: "w-full text-left" },
        React.createElement('label', { htmlFor: String(id), className: "block text-sm font-medium text-slate-700 mb-1" },
            label
        ),
        React.createElement('div', { 
            className: `flex items-center w-full border rounded-md shadow-sm focus-within:ring-1 overflow-hidden ${borderClass} ${className || 'bg-white'}`
        },
            React.createElement('input', {
                type: inputType,
                id: String(id),
                name: String(id),
                value: value ?? '',
                onChange: onChange,
                onBlur: onBlur,
                onKeyDown: onKeyDown,
                readOnly: readOnly,
                className: "flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none sm:text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50",
                placeholder: placeholder,
                ...props
            }),
            isPassword && React.createElement('button', {
                type: "button",
                onClick: () => setShowPassword(!showPassword),
                className: "px-3 py-2 text-slate-400 hover:text-slate-600 focus:outline-none flex-shrink-0 bg-transparent",
                tabIndex: -1
            },
                showPassword ? 
                React.createElement('svg', { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" })
                ) :
                React.createElement('svg', { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
                )
            )
        )
    );
};
