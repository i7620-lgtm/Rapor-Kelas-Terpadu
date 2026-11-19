import React from 'react';

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
  actionText: string;
  onActionClick?: () => void;
  showAction: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  actionText,
  onActionClick,
  showAction,
}) => {
  const isComplete = !showAction;
  const buttonColorClass = isComplete
    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60'
    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60';
  const displayActionText = isComplete ? 'Lihat Detail' : actionText;

  return (
    <div
      onClick={onActionClick}
      className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors' : ''
      }`}
    >
      <div className="overflow-hidden">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={title}>
          {title}
        </h3>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums truncate" title={value}>
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2" title={description}>
          {description}
        </p>
      </div>
      {onActionClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className={`mt-3 min-h-[44px] lg:min-h-0 px-3 lg:px-2.5 py-2 lg:py-1 text-xs font-medium rounded-md transition-colors text-left truncate w-fit inline-flex items-center ${buttonColorClass}`}
        >
          {displayActionText} →
        </button>
      )}
    </div>
  );
};
