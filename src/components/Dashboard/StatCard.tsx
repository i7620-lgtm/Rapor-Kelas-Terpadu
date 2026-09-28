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
    ? 'bg-green-100 text-green-700 hover:bg-green-200'
    : 'bg-red-100 text-red-700 hover:bg-red-200';
  const displayActionText = isComplete ? 'Lihat Detail' : actionText;

  return (
    <div
      onClick={onActionClick}
      className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''
      }`}
    >
      <div className="overflow-hidden">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title={title}>
          {title}
        </h3>
        <p className="mt-1 text-2xl font-bold text-slate-900 tracking-tight truncate" title={value}>
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2" title={description}>
          {description}
        </p>
      </div>
      {onActionClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className={`mt-3 px-2.5 py-1 text-xs font-medium rounded-md transition-colors text-left truncate w-fit ${buttonColorClass}`}
        >
          {displayActionText} →
        </button>
      )}
    </div>
  );
};
