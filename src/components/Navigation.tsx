import React from 'react';
import { NAV_ITEMS, DATA_ACTIONS } from '../constants';
import { AppearanceControls } from './AppearanceControls';

const DesktopNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, currentPageName }: any) => {
  const handleDataAction = (id: any) => {
      if (id === 'EKSPORT') onExport();
      else if (id === 'IMPORT') onImport();
      else if (id === 'ISI_ERAPOR') onIsiERapor();
  };
  const handleNavClick = (id: any) => setActivePage(id);

  const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col print-hidden flex-shrink-0 z-50 sticky top-0 transition-colors">
      <div className="flex items-center justify-between px-4 h-11">
        <div className="flex items-center">
            <h1 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">RKT</h1>
            <span className="mx-2.5 text-zinc-300 dark:text-zinc-600">/</span>
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{currentPageName}</h2>
        </div>
        <div className="flex items-center gap-3">
            <AppearanceControls />
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block"></div>
            <div className="flex items-center gap-4 hidden sm:flex">
                <a 
                    href="/terms.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors" 
                >Ketentuan Layanan</a>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <a 
                    href="/privacy.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors" 
                >Kebijakan Privasi</a>
            </div>
        </div>
      </div>
      <div className="border-t border-zinc-100 dark:border-zinc-800"></div>
      <nav className="flex-1 px-4 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-1.5 items-center no-scrollbar">
        {allNavItems.map((item: any) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => { 
                e.preventDefault(); 
                if (DATA_ACTIONS.some(da => da.id === item.id)) {
                    handleDataAction(item.id);
                } else {
                    handleNavClick(item.id);
                }
            }}
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 border ${
              activePage === item.id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white dark:bg-slate-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-slate-750 hover:text-zinc-900 dark:hover:text-white shadow-sm'
            }`}
          >
            <span className="truncate">{item.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
};

const MobileNav = ({ activePage, setActivePage, onExport, onImport, onIsiERapor, isMobileMenuOpen, setIsMobileMenuOpen, currentPageName }: any) => {
    const handleNavClick = (id: any) => {
        setActivePage(id);
        setIsMobileMenuOpen(false);
    };
    const handleDataAction = (id: any) => {
        const action = id === 'EKSPORT' ? onExport : id === 'IMPORT' ? onImport : onIsiERapor;
        if (action) action();
        setIsMobileMenuOpen(false);
    };

    const allNavItems = [...NAV_ITEMS, ...DATA_ACTIONS];

    return (
        <div className="print-hidden sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            <header 
                className="h-11 flex items-center justify-between px-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-800 active:bg-zinc-100 dark:active:bg-slate-700 select-none transition-colors duration-150"
                onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
            >
                <div className="flex items-center min-w-0 mr-2">
                    <h1 className="text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-tight flex-shrink-0">RKT</h1>
                    <span className="mx-1.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0">/</span>
                    <h2 className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{currentPageName}</h2>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <AppearanceControls compact={true} />
                    <button 
                        type="button"
                        aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                        className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isMobileMenuOpen 
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            }
                        </svg>
                    </button>
                </div>
            </header>
            
            {isMobileMenuOpen && (
                <>
                    <div 
                        className="fixed top-11 inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                    <div
                        className={`absolute top-11 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
                            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
                        }`}
                    >
                        <div className="p-4 w-full bg-white dark:bg-slate-900 shadow-md border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex flex-wrap justify-center gap-2">
                                {allNavItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (NAV_ITEMS.some(nav => nav.id === item.id)) {
                                                handleNavClick(item.id);
                                            } else {
                                                handleDataAction(item.id);
                                            }
                                        }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-xl shadow-sm transition-all duration-200 ${
                                            activePage === item.id 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <a
                                    href="/terms.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-xl shadow-sm transition-all duration-200 bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-slate-700"
                                >
                                    Ketentuan Layanan
                                </a>
                                <a
                                    href="/privacy.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-xl shadow-sm transition-all duration-200 bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-slate-700"
                                >
                                    Kebijakan Privasi
                                </a>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const Navigation = (props: any) => {
    if (props.isMobile) {
        return <MobileNav {...props} isMobileMenuOpen={props.isMobileMenuOpen} setIsMobileMenuOpen={props.setIsMobileMenuOpen} />;
    }
    return <DesktopNav {...props} />;
};

export default Navigation;
