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
      className={`bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col justify-between overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''
      }`}
    >
      <div className="overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-700 truncate" title={title}>
          {title}
        </h3>
        <p className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 truncate" title={value}>
          {value}
        </p>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2" title={description}>
          {description}
        </p>
      </div>
      {onActionClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className={`mt-4 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors text-left truncate w-fit ${buttonColorClass}`}
        >
          {displayActionText} →
        </button>
      )}
    </div>
  );
};
