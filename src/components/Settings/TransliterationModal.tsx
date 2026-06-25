import React, { useState, useEffect } from 'react';
import { transliterate } from '../TransliterationUtil';

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
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col" },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b" },
                    React.createElement('h3', { className: "text-lg font-bold text-slate-800" }, "Alat Tulis Aksara Bali"),
                    React.createElement('button', { onClick: onClose, className: "text-slate-500 hover:text-slate-800 text-2xl" }, "\u00d7")
                ),
                React.createElement('div', { className: "p-6 space-y-4" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "latin-input", className: "block text-sm font-medium text-slate-700 mb-1" },
                            "Ketik teks Latin di sini:"
                        ),
                        React.createElement('input', {
                            id: "latin-input",
                            type: "text",
                            value: latinText,
                            onChange: (e) => setLatinText(e.target.value),
                            className: "w-full p-2 border border-slate-300 rounded-md text-slate-900 bg-white",
                            placeholder: "Contoh: om swastyastu"
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" },
                            "Hasil Aksara Bali (Pratinjau):"
                        ),
                        React.createElement('div', { className: "w-full p-2 border border-slate-200 rounded-md bg-slate-50 min-h-[4rem] font-aksara-bali text-2xl text-slate-900" },
                            balineseText
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-end items-center p-4 border-t bg-slate-50 rounded-b-lg" },
                    React.createElement('button', { onClick: onClose, className: "bg-white py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50" },
                        "Batal"
                    ),
                    React.createElement('button', { onClick: () => onApply(balineseText), className: "ml-3 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700" },
                        "Gunakan Teks Ini"
                    )
                )
            )
        )
    );
};
