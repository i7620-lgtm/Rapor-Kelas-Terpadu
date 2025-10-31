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

  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between w-full max-w-xs p-4 rounded-lg shadow-lg animate-fade-in-down";
  const typeClasses = {
    success: 'text-green-800 bg-green-100',
    error: 'text-red-800 bg-red-100',
  };
  const iconClasses = {
      success: 'text-green-500 bg-green-100',
      error: 'text-red-500 bg-red-100',
  }

  return (
    React.createElement('div', { className: `${baseClasses} ${typeClasses[type]}`, role: "alert" },
        React.createElement('div', { className: "flex items-center" },
            React.createElement('div', { className: `inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconClasses[type]} rounded-lg` },
                type === 'success' ? (
                    React.createElement('svg', { className: "w-5 h-5", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 20 20" },
                        React.createElement('path', { d: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" })
                    )
                ) : (
                    React.createElement('svg', { className: "w-5 h-5", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 20 20" },
                        React.createElement('path', { d: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" })
                    )
                ),
                React.createElement('span', { className: "sr-only" }, type === 'success' ? 'Success' : 'Error', ' icon')
            ),
            React.createElement('div', { className: "ml-3 text-sm font-normal" }, message)
        ),
        React.createElement('button', {
            type: "button",
            className: "ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8",
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
