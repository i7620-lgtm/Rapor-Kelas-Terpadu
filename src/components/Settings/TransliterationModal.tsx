import React, { useState, useEffect } from 'react';
import { transliterate } from '../../utils/TransliterationUtil';

interface TransliterationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (text: string) => void;
    initialText?: string;
}

export const TransliterationModal: React.FC<TransliterationModalProps> = ({ 
    isOpen, 
    onClose, 
    onApply, 
    initialText 
}) => {
    const [latinText, setLatinText] = useState('');
    const [balineseText, setBalineseText] = useState('');

    useEffect(() => {
        if (isOpen) {
            const latinOnly = initialText?.replace(/[^\u0000-\u007F]/g, "") || '';
            setLatinText(latinOnly);
        }
    }, [isOpen, initialText]);
    
    useEffect(() => {
        setBalineseText(transliterate(latinText));
    }, [latinText]);

    if (!isOpen) return null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-2 sm:p-4" },
            React.createElement('div', { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden" },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0" },
                    React.createElement('h3', { className: "text-lg font-bold text-slate-800 dark:text-slate-100" }, "Alat Tulis Aksara Bali"),
                    React.createElement('button', { onClick: onClose, className: "min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-2xl leading-none" }, "\u00d7")
                ),
                React.createElement('div', { className: "p-4 sm:p-6 space-y-4 overflow-y-auto" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "latin-input", className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" },
                            "Ketik teks Latin di sini:"
                        ),
                        React.createElement('input', {
                            id: "latin-input",
                            type: "text",
                            value: latinText,
                            onChange: (e) => setLatinText(e.target.value),
                            className: "w-full p-2.5 min-h-[44px] lg:min-h-0 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800",
                            placeholder: "Contoh: om swastyastu"
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" },
                            "Hasil Aksara Bali (Pratinjau):"
                        ),
                        React.createElement('div', { className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/60 min-h-[4rem] font-aksara-bali text-2xl text-slate-900 dark:text-slate-100" },
                            balineseText
                        )
                    )
                ),
                React.createElement('div', { className: "flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 rounded-b-xl shrink-0" },
                    React.createElement('button', { onClick: onClose, className: "bg-white dark:bg-slate-800 py-2 px-4 min-h-[44px] lg:min-h-0 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700" },
                        "Batal"
                    ),
                    React.createElement('button', { onClick: () => onApply(balineseText), className: "py-2 px-4 min-h-[44px] lg:min-h-0 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700" },
                        "Gunakan Teks Ini"
                    )
                )
            )
        )
    );
};
