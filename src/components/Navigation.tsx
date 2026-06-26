
import React from 'react';
import { NAV_ITEMS, DATA_ACTIONS } from '../constants';

const DesktopNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, currentPageName }) => {
  const handleDataAction = (id) => {
      if (id === 'EKSPORT') onExport();
      else if (id === 'IMPORT') onImport();
      else if (id === 'ISI_ERAPOR') onIsiERapor();
  };
  const handleNavClick = (id) => setActivePage(id);

  const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

  return (
    React.createElement('header', { className: "w-full bg-white border-b border-zinc-200 shadow-sm flex flex-col print-hidden flex-shrink-0 z-50 sticky top-0" },
      React.createElement('div', { className: "flex items-center justify-between px-6 h-16" },
        React.createElement('div', { className: "flex items-center" },
            React.createElement('h1', { className: "text-2xl font-extrabold text-indigo-600 tracking-tight" }, "RKT"),
            React.createElement('span', { className: 'mx-4 text-zinc-300' }, '/'),
            React.createElement('h2', { className: 'text-xl font-medium text-zinc-700' }, currentPageName)
        ),
        React.createElement('div', { className: "flex items-center gap-4" },
            React.createElement('a', { 
                href: "/terms.html", 
                target: "_blank", 
                rel: "noopener noreferrer", 
                className: "text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors" 
            }, "Ketentuan Layanan"),
            React.createElement('span', { className: "text-zinc-300" }, "•"),
            React.createElement('a', { 
                href: "/privacy.html", 
                target: "_blank", 
                rel: "noopener noreferrer", 
                className: "text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors" 
            }, "Kebijakan Privasi")
        )
      ),
      React.createElement('div', { className: "border-t border-zinc-100" }),
      React.createElement('nav', { className: "flex-1 px-6 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-3 items-center no-scrollbar" },
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
            className: `inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border ${
              activePage === item.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm'
            }`
          }, 
            React.createElement('span', { className: "truncate" }, item.label)
          )
        ))
      )
    )
  );
};

const MobileNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName }) => {
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
                className: 'h-16 flex items-center justify-between px-4 cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 select-none transition-colors duration-150',
                onClick: () => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                }
            },
                React.createElement('div', { className: "flex items-center" },
                    React.createElement('h1', { className: "text-lg font-bold text-indigo-600 tracking-tight" }, "RKT"),
                    React.createElement('span', { className: 'mx-2 text-zinc-300' }, '/'),
                    React.createElement('h2', { className: 'text-lg font-medium text-zinc-700' }, currentPageName)
                ),
                React.createElement('div', { 
                    className: 'p-2 relative z-50 text-zinc-600'
                },
                    React.createElement('svg', { className: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
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
                        className: `absolute top-16 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
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
