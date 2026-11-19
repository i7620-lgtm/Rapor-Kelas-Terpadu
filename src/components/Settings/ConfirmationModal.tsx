import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    children 
}) => {
    if (!isOpen) return null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-2 sm:p-4 text-left" },
            React.createElement('div', { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden" },
                React.createElement('div', { className: "p-4 sm:p-6 overflow-y-auto" },
                    React.createElement('div', { className: "flex items-start" },
                        React.createElement('div', { className: "flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 sm:mx-0" },
                            React.createElement('svg', { className: "h-6 w-6 text-red-600 dark:text-red-400", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true" },
                                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
                            )
                        ),
                        React.createElement('div', { className: "ml-4 text-left" },
                            React.createElement('h3', { className: "text-lg leading-6 font-bold text-slate-900 dark:text-slate-100", id: "modal-title" }, title),
                            React.createElement('div', { className: "mt-2" },
                                React.createElement('div', { className: "text-sm text-slate-600 dark:text-slate-300 space-y-2" }, children)
                            )
                        )
                    )
                ),
                React.createElement('div', { className: "bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end rounded-b-xl gap-2 shrink-0" },
                    React.createElement('button', {
                        type: "button",
                        onClick: onClose,
                        className: "w-full inline-flex justify-center items-center rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 min-h-[44px] lg:min-h-0 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:w-auto"
                    }, "Batal"),
                    React.createElement('button', {
                        type: "button",
                        onClick: onConfirm,
                        className: "w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 min-h-[44px] lg:min-h-0 bg-red-600 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
                    }, "Konfirmasi & Lanjutkan")
                )
            )
        )
    );
};
