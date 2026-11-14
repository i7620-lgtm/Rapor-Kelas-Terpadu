import React from 'react';
import { useAppearanceStore } from '../stores/useAppearanceStore';

interface AppearanceControlsProps {
  compact?: boolean;
}

export const AppearanceControls: React.FC<AppearanceControlsProps> = ({ compact = false }) => {
  const { theme, toggleTheme, fontSize, setFontSize } = useAppearanceStore();

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      {/* Font Size Selector: A- | A | A+ */}
      <div 
        className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 p-0.5 shadow-xs"
        role="group"
        aria-label="Pengaturan ukuran font"
      >
        <button
          type="button"
          onClick={() => setFontSize('small')}
          title="Perkecil ukuran font (A-)"
          aria-label="Perkecil ukuran font"
          aria-pressed={fontSize === 'small'}
          className={`min-h-[38px] min-w-[34px] sm:min-h-[44px] sm:min-w-[40px] lg:min-h-0 lg:min-w-0 px-1.5 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer inline-flex items-center justify-center ${
            fontSize === 'small'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          A-
        </button>
        <button
          type="button"
          onClick={() => setFontSize('normal')}
          title="Ukuran font normal (A)"
          aria-label="Ukuran font normal"
          aria-pressed={fontSize === 'normal'}
          className={`min-h-[38px] min-w-[34px] sm:min-h-[44px] sm:min-w-[40px] lg:min-h-0 lg:min-w-0 px-1.5 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer inline-flex items-center justify-center ${
            fontSize === 'normal'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          A
        </button>
        <button
          type="button"
          onClick={() => setFontSize('large')}
          title="Perbesar ukuran font (A+)"
          aria-label="Perbesar ukuran font"
          aria-pressed={fontSize === 'large'}
          className={`min-h-[38px] min-w-[34px] sm:min-h-[44px] sm:min-w-[40px] lg:min-h-0 lg:min-w-0 px-1.5 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer inline-flex items-center justify-center ${
            fontSize === 'large'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          A+
        </button>
      </div>

      {/* Dark / Light Mode Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
        aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
        className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs cursor-pointer"
      >
        {theme === 'dark' ? (
          // Sun Icon (Switch to light)
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Moon Icon (Switch to dark)
          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
        {!compact && (
          <span className="ml-1.5 hidden sm:inline text-[11px] font-medium">
            {theme === 'dark' ? 'Gelap' : 'Terang'}
          </span>
        )}
      </button>
    </div>
  );
};
