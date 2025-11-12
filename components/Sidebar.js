import React from 'react';
import { NAV_ITEMS, DATA_ACTIONS } from '../constants.js';

const Sidebar = ({ 
  activePage, 
  setActivePage, 
  onExport, 
  onImport,
  isSignedIn,
  userEmail,
  isOnline,
  lastSyncTimestamp,
  onSignInClick,
  onSignOutClick,
  onSyncToDrive,
  isSyncing
}) => {
  const handleDataAction = (id) => {
    if (id === 'EKSPORT') {
      onExport();
    } else {
      onImport();
    }
  };

  const statusText = isOnline ? 'Online' : 'Offline';
  const statusColor = isOnline ? 'text-green-600' : 'text-red-600';
  
  return (
    React.createElement('aside', { className: "w-64 bg-white shadow-lg flex flex-col print-hidden" },
      React.createElement('div', { className: "flex items-center justify-center h-20 border-b px-4" },
        React.createElement('div', { className: "text-center" },
          React.createElement('h1', { className: "text-3xl font-extrabold text-indigo-600 tracking-tight" }, "RKT"),
          React.createElement('p', { className: "text-sm text-slate-500 font-medium tracking-wide mt-1" }, "Rapor Kelas Terpadu")
        )
      ),
      React.createElement('nav', { className: "flex-1 px-4 py-6 space-y-2" },
        NAV_ITEMS.map((item) => (
          React.createElement('a', {
            key: item.id,
            href: "#",
            onClick: (e) => {
              e.preventDefault();
              setActivePage(item.id);
            },
            className: `block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activePage === item.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }, item.label)
        ))
      ),
      React.createElement('div', { className: "px-4 py-6 border-t" },
        React.createElement('div', { className: "space-y-2" },
          DATA_ACTIONS.map((action) => (
            React.createElement('button', {
              key: action.id,
              onClick: () => handleDataAction(action.id),
              className: "w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
            }, action.label)
          ))
        ),
        React.createElement('div', { className: "mt-4 pt-4 border-t border-slate-200" },
          isSignedIn ? (
            React.createElement('div', { className: "space-y-3" },
              React.createElement('div', { className: "flex items-center text-sm" },
                React.createElement('span', { className: "block w-2 h-2 rounded-full mr-2", style: { backgroundColor: isOnline ? '#22c55e' : '#ef4444' } }),
                React.createElement('span', { className: "text-slate-600" }, statusText),
                React.createElement('span', { className: "ml-auto text-slate-500 font-semibold truncate", title: userEmail }, userEmail)
              ),
              lastSyncTimestamp && React.createElement('p', { className: "text-xs text-slate-500 mt-1" }, `Terakhir disinkronkan: ${new Date(lastSyncTimestamp).toLocaleString()}`),
              React.createElement('button', {
                onClick: onSyncToDrive,
                disabled: !isOnline || isSyncing,
                className: "w-full text-left px-4 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                "aria-label": "Sinkronkan ke Google Drive"
              }, isSyncing ? 'Sinkronisasi...' : 'Sinkronkan ke Drive'),
              React.createElement('button', {
                onClick: onSignOutClick,
                className: "w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200",
                "aria-label": "Keluar dari Google"
              }, "Keluar Google")
            )
          ) : (
            React.createElement('button', {
              onClick: onSignInClick,
              disabled: !isOnline,
              className: "w-full text-left px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              "aria-label": "Masuk dengan Google"
            }, "Masuk dengan Google")
          )
        )
      ),
      React.createElement('div', { className: "px-4 py-4 mt-auto border-t" },
        React.createElement('div', { className: "flex justify-between items-center text-xs text-slate-500" },
          React.createElement('a', {
            href: "/terms.html",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-medium hover:text-indigo-600 transition-colors duration-200"
          }, "Ketentuan Layanan"),
          React.createElement('a', {
            href: "/privacy.html",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-medium hover:text-indigo-600 transition-colors duration-200"
          }, "Kebijakan Privasi")
        )
      )
    )
  );
};

export default Sidebar;
