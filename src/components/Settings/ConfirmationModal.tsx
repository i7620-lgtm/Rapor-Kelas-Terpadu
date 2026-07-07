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
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4 text-left" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg" },
                React.createElement('div', { className: "p-6" },
                    React.createElement('div', { className: "flex items-start" },
                        React.createElement('div', { className: "flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10" },
                            React.createElement('svg', { className: "h-6 w-6 text-red-600", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true" },
                                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
                            )
                        ),
                        React.createElement('div', { className: "ml-4 text-left" },
                            React.createElement('h3', { className: "text-lg leading-6 font-bold text-slate-900", id: "modal-title" }, title),
                            React.createElement('div', { className: "mt-2" },
                                React.createElement('div', { className: "text-sm text-slate-600 space-y-2" }, children)
                            )
                        )
                    )
                ),
                React.createElement('div', { className: "bg-slate-50 px-6 py-3 flex flex-row-reverse rounded-b-lg gap-2" },
                    React.createElement('button', {
                        type: "button",
                        onClick: onConfirm,
                        className: "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                    }, "Konfirmasi & Lanjutkan"),
                    React.createElement('button', {
                        type: "button",
                        onClick: onClose,
                        className: "mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:w-auto sm:text-sm"
                    }, "Batal")
                )
            )
        )
    );
};
