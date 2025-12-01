
import React, { useEffect } from 'react';
import { NAV_ITEMS, DATA_ACTIONS } from '../constants.js';

const SyncStatus = ({ syncStatus, lastSyncTimestamp }) => {
    switch (syncStatus) {
        case 'unsaved':
            return React.createElement('p', { className: "text-xs text-yellow-600 font-medium" }, 'Perubahan belum disimpan');
        case 'saving':
            return React.createElement('div', { className: "flex items-center justify-center gap-2 text-xs text-slate-600 font-medium" }, 
                React.createElement('div', { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-slate-800" }), 'Menyimpan...');
        case 'saved':
            return React.createElement('p', { className: "text-xs text-green-600 font-medium" }, 'Semua perubahan disimpan');
        case 'error':
            return React.createElement('p', { className: "text-xs text-red-600 font-medium" }, 'Gagal menyimpan');
        case 'offline_pending':
            return React.createElement('p', { className: "text-xs text-blue-600 font-medium" }, 'Offline, sinkronisasi ditunda');
        default:
             if (lastSyncTimestamp) {
                return React.createElement('p', { className: "text-xs text-slate-500" }, `Tersimpan: ${new Date(lastSyncTimestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`);
            }
            return null;
    }
};

const UserAuthSection = ({ isSignedIn, userEmail, onSignInClick, onSignOutClick, isOnline, ...props }) => {
  const syncStatus = props.syncStatus;
  const lastSyncTimestamp = props.lastSyncTimestamp;

  if (isSignedIn) {
    return (
      React.createElement('div', { className: "flex flex-col items-stretch text-center gap-3 p-4 bg-slate-50 rounded-lg" },
        React.createElement('p', { className: "text-sm font-medium text-slate-700 truncate", title: userEmail }, userEmail),
        React.createElement('div', { className: "h-4 text-center" }, 
            React.createElement(SyncStatus, { syncStatus: syncStatus, lastSyncTimestamp: lastSyncTimestamp })
        ),
        React.createElement('button', {
          onClick: onSignOutClick,
          className: "w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors",
          "aria-label": "Keluar dari Google"
        }, "Keluar")
      )
    );
  }
  return (
    React.createElement('button', {
      onClick: onSignInClick,
      disabled: !isOnline,
      className: "w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
      "aria-label": "Masuk dengan Google"
    }, "Masuk dengan Google")
  );
};


const DesktopNav = ({ activePage, setActivePage, onExport, onImport, ...props }) => {
  const handleDataAction = (id) => id === 'EKSPORT' ? onExport() : onImport();
  const handleNavClick = (id) => setActivePage(id);

  const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

  return (
    React.createElement('aside', { className: "w-64 bg-white shadow-lg flex flex-col print-hidden" },
      React.createElement('div', { className: "flex items-center justify-center h-16 border-b px-4" },
        React.createElement('div', { className: "text-center" },
          React.createElement('h1', { className: "text-2xl font-extrabold text-indigo-600 tracking-tight" }, "RKT"),
          React.createElement('p', { className: "text-xs text-slate-500 font-medium tracking-wide" }, "Rapor Kelas Terpadu")
        )
      ),
      React.createElement('nav', { className: "flex-1 px-4 py-4 space-y-1 overflow-y-auto" },
        allNavItems.map((item) => (
          React.createElement('a', {
            key: item.id,
            href: "#",
            onClick: (e) => { 
                e.preventDefault(); 
                if (DATA_ACTIONS.some(da => da.id === item.id)) {
                    handleDataAction(item.id);
                } else {
                    handleNavClick(item.id);
                }
            },
            className: `block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activePage === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`
          }, item.label)
        )),
        
        // Divider and Legal Links styled as buttons
        React.createElement('div', { className: "my-2 border-t border-slate-100" }),
        
        React.createElement('a', { 
            href: "/terms.html", 
            target: "_blank", 
            rel: "noopener noreferrer", 
            className: "block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-600 hover:bg-slate-100" 
        }, "Ketentuan Layanan"),
        
        React.createElement('a', { 
            href: "/privacy.html", 
            target: "_blank", 
            rel: "noopener noreferrer", 
            className: "block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-600 hover:bg-slate-100" 
        }, "Kebijakan Privasi")
      ),
      React.createElement('div', { className: "px-4 py-4 border-t" },
        React.createElement('div', { className: "space-y-3" },
          React.createElement(UserAuthSection, {...props})
        )
      )
    )
  );
};

const MobileNav = ({ activePage, setActivePage, onExport, onImport, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName, ...props }) => {
    const handleNavClick = (id) => {
        setActivePage(id);
        setIsMobileMenuOpen(false);
    };
    const handleDataAction = (id) => {
        const action = id === 'EKSPORT' ? onExport : onImport;
        action();
        setIsMobileMenuOpen(false);
    };

    const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

    return (
        React.createElement('div', {className: "print-hidden sticky top-0 z-50 bg-white"},
            React.createElement('header', { 
                className: 'h-16 flex items-center justify-between px-4 border-b cursor-pointer',
                onClick: () => setIsMobileMenuOpen(prev => !prev)
            },
                React.createElement('div', { className: "flex items-center" },
                    React.createElement('h1', { className: "text-lg font-bold text-indigo-600 tracking-tight" }, "RKT"),
                    React.createElement('span', { className: 'mx-2 text-slate-300' }, '/'),
                    React.createElement('h2', { className: 'text-lg font-semibold text-slate-800' }, currentPageName)
                ),
                React.createElement('button', { 
                    className: 'p-2',
                    // We let the parent header click handler manage the toggle to maximize click area, 
                    // but keep the button for semantic correctness and potential focus management.
                    onClick: (e) => {
                        e.stopPropagation(); // Prevent double toggle if header also has click handler
                        setIsMobileMenuOpen(prev => !prev);
                    }
                },
                    React.createElement('svg', { className: 'h-6 w-6 text-slate-700', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
                        isMobileMenuOpen 
                        ? React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
                        : React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 6h16M4 12h16m-7 6h7' })
                    )
                )
            ),
            
            isMobileMenuOpen && (
                React.createElement(React.Fragment, null,
                    React.createElement('div', { 
                        className: "fixed top-16 inset-x-0 bottom-0 bg-black/30 backdrop-blur-sm z-40",
                        onClick: () => setIsMobileMenuOpen(false)
                    }),
                    React.createElement('div', {
                        className: `absolute left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
                            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
                        }`
                    },
                        React.createElement('div', { className: "p-6 w-full bg-white shadow-lg border-b" },
                            React.createElement('div', { className: "flex flex-wrap justify-center gap-2" },
                                allNavItems.map(item => (
                                    React.createElement('button', {
                                        key: item.id,
                                        onClick: (e) => {
                                            e.stopPropagation(); // Prevent header click from firing immediately after
                                            if (NAV_ITEMS.some(nav => nav.id === item.id)) {
                                                handleNavClick(item.id);
                                            } else {
                                                handleDataAction(item.id);
                                            }
                                        },
                                        className: `px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 ${
                                            activePage === item.id 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                        }`
                                    }, item.label)
                                )),
                                React.createElement('a', {
                                    href: "/terms.html",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(false);
                                    },
                                    className: "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
                                }, "Ketentuan"),
                                React.createElement('a', {
                                    href: "/privacy.html",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(false);
                                    },
                                    className: "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
                                }, "Privasi")
                            ),
                            React.createElement('div', { className: "mt-6 pt-6 border-t border-slate-200" },
                               React.createElement(UserAuthSection, { ...props })
                            )
                        )
                    )
                )
            )
        )
    );
};


const Navigation = ({ isMobile, ...props }) => {
    if (isMobile) {
        return React.createElement(MobileNav, props);
    }
    return React.createElement(DesktopNav, props);
};

export default Navigation;
