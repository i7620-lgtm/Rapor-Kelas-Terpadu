
import React, { useEffect } from 'react';
import { NAV_ITEMS, DATA_ACTIONS } from '../constants.js';

const DesktopNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, ...props }) => {
  const handleDataAction = (id) => {
      if (id === 'EKSPORT') onExport();
      else if (id === 'IMPORT') onImport();
      else if (id === 'ISI_ERAPOR') onIsiERapor();
  };
  const handleNavClick = (id) => setActivePage(id);

  const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

  return (
    React.createElement('aside', { className: "w-64 bg-white border-r border-zinc-200 shadow-sm flex flex-col print-hidden" },
      React.createElement('div', { className: "flex items-center justify-center h-16 border-b border-zinc-100 px-4" },
        React.createElement('div', { className: "text-center" },
          React.createElement('h1', { className: "text-2xl font-extrabold text-indigo-600 tracking-tight" }, "RKT"),
          React.createElement('p', { className: "text-xs text-zinc-500 font-medium tracking-wide" }, "Rapor Kelas Terpadu")
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
            className: `block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              activePage === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
            }`
          }, item.label)
        )),
        
        // Divider and Legal Links styled as buttons
        React.createElement('div', { className: "my-2 border-t border-zinc-100" }),
        
        React.createElement('a', { 
            href: "/terms.html", 
            target: "_blank", 
            rel: "noopener noreferrer", 
            className: "block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900" 
        }, "Ketentuan Layanan"),
        
        React.createElement('a', { 
            href: "/privacy.html", 
            target: "_blank", 
            rel: "noopener noreferrer", 
            className: "block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900" 
        }, "Kebijakan Privasi")
      )
    )
  );
};

const MobileNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName, ...props }) => {
    const handleNavClick = (id) => {
        setActivePage(id);
        setIsMobileMenuOpen(false);
    };
    const handleDataAction = (id) => {
        const action = id === 'EKSPORT' ? onExport : id === 'IMPORT' ? onImport : onIsiERapor;
        if (action) action();
        setIsMobileMenuOpen(false);
    };

    const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

    return (
        React.createElement('div', {className: "print-hidden sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm"},
            React.createElement('header', { 
                className: 'h-16 flex items-center justify-between px-4 cursor-pointer',
                onClick: () => setIsMobileMenuOpen(prev => !prev)
            },
                React.createElement('div', { className: "flex items-center" },
                    React.createElement('h1', { className: "text-lg font-bold text-indigo-600 tracking-tight" }, "RKT"),
                    React.createElement('span', { className: 'mx-2 text-zinc-300' }, '/'),
                    React.createElement('h2', { className: 'text-lg font-medium text-zinc-700' }, currentPageName)
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
                    React.createElement('svg', { className: 'h-6 w-6 text-zinc-600', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
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
                        React.createElement('div', { className: "p-6 w-full bg-white shadow-md border-b" },
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
                                        className: `px-4 py-2 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 ${
                                            activePage === item.id 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80'
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
                                    className: "px-4 py-2 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80"
                                }, "Ketentuan Layanan"),
                                React.createElement('a', {
                                    href: "/privacy.html",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(false);
                                    },
                                    className: "px-4 py-2 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80"
                                }, "Kebijakan Privasi")
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
        return React.createElement(MobileNav, { ...props, isMobileMenuOpen: props.isMobileMenuOpen, setIsMobileMenuOpen: props.setIsMobileMenuOpen });
    }
    return React.createElement(DesktopNav, props);
};

export default Navigation;
