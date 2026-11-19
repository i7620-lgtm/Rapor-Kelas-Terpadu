import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = "fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[120] flex items-center justify-between w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm p-3.5 sm:p-4 rounded-xl shadow-lg border animate-fade-in-down";
  const typeClasses: Record<string, string> = {
    success: 'text-green-800 bg-green-100 border-green-200 dark:bg-green-950/90 dark:text-green-200 dark:border-green-800',
    error: 'text-red-800 bg-red-100 border-red-200 dark:bg-red-950/90 dark:text-red-200 dark:border-red-800',
    info: 'text-indigo-800 bg-indigo-100 border-indigo-200 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-800',
  };
  const iconClasses: Record<string, string> = {
      success: 'text-green-500 bg-green-100 dark:bg-green-900/60 dark:text-green-300',
      error: 'text-red-500 bg-red-100 dark:bg-red-900/60 dark:text-red-300',
      info: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/60 dark:text-indigo-300',
  };
  const resolvedType = typeClasses[type] ? type : 'info';

  return (
    React.createElement('div', { className: `${baseClasses} ${typeClasses[resolvedType]}`, role: "alert" },
        React.createElement('div', { className: "flex items-center min-w-0" },
            React.createElement('div', { className: `inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconClasses[resolvedType]} rounded-xl` },
                type === 'success' ? (
                    React.createElement('svg', { className: "w-5 h-5", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 20 20" },
                        React.createElement('path', { d: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" })
                    )
                ) : (
                    React.createElement('svg', { className: "w-5 h-5", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 20 20" },
                        React.createElement('path', { d: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" })
                    )
                ),
                React.createElement('span', { className: "sr-only" }, type === 'success' ? 'Success' : 'Notification', ' icon')
            ),
            React.createElement('div', { className: "ml-3 text-sm font-normal break-words" }, message)
        ),
        React.createElement('button', {
            type: "button",
            className: "ml-2 -mx-1 -my-1 bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-white dark:hover:bg-slate-700 inline-flex items-center justify-center min-h-[36px] min-w-[36px] sm:h-8 sm:w-8 flex-shrink-0 cursor-pointer",
            onClick: onClose,
            "aria-label": "Close"
        },
            React.createElement('span', { className: "sr-only" }, "Close"),
            React.createElement('svg', { className: "w-3 h-3", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 14 14" },
                React.createElement('path', { stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" })
            )
      )
    )
  );
};

export default Toast;