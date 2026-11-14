import React from 'react';
import { StatusIcon } from './StatusIcon';

export interface ChecklistItemProps {
  title: string;
  description: string;
  status: 'good' | 'bad';
  percentage?: number;
  actionText: string;
  onActionClick: () => void;
  category: string;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  title,
  description,
  status,
  percentage,
  actionText,
  onActionClick,
}) => {
  const isComplete = percentage === 100;
  const percentageColorClass = percentage === 100 ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
  const buttonColorClass =
    isComplete
      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60'
      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60';
  const displayActionText = isComplete ? 'Lihat Detail' : actionText;

  return (
    <div
      onClick={onActionClick}
      className={`flex items-start p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors cursor-pointer`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon status={status} />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={title}>
            {title}
          </h4>
          {percentage !== undefined && (
            <span className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-full flex-shrink-0 ${percentageColorClass}`}>
              {percentage}%
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2" title={description}>
          {description}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className={`mt-2 min-h-[44px] lg:min-h-0 px-3 lg:px-2.5 py-2 lg:py-1 text-[11px] font-medium rounded-md transition-colors w-fit inline-flex items-center ${buttonColorClass}`}
        >
          {displayActionText} →
        </button>
      </div>
    </div>
  );
};
