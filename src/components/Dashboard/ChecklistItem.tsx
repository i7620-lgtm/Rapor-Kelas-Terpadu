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
      ? 'bg-green-100 text-green-700 hover:bg-green-200'
      : 'bg-red-100 text-red-700 hover:bg-red-200';
  const displayActionText = isComplete ? 'Lihat Detail' : actionText;

  return (
    <div
      onClick={onActionClick}
      className={`flex items-start p-4 border rounded-xl bg-white shadow-sm hover:border-indigo-300 transition-colors cursor-pointer`}
    >
      <div className="flex-shrink-0 mt-1">
        <StatusIcon status={status} />
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800 truncate" title={title}>
            {title}
          </h4>
          {percentage !== undefined && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${percentageColorClass}`}>
              {percentage}%
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={description}>
          {description}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className={`mt-3 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors w-fit ${buttonColorClass}`}
        >
          {displayActionText} →
        </button>
      </div>
    </div>
  );
};
