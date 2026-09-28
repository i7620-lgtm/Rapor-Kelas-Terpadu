import React from 'react';

export interface AnalysisItemProps {
  missingItems?: { label: string; onClick: () => void }[];
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'attention';
  actionText?: string | null;
  onActionClick?: (() => void) | null;
}

export const AnalysisItem: React.FC<AnalysisItemProps> = ({
  title,
  description,
  status,
  actionText,
  onActionClick,
  missingItems,
}) => {
  const statusClasses = {
    complete: 'bg-green-100 text-green-800 border-green-400',
    incomplete: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    attention: 'bg-red-100 text-red-800 border-red-400',
  };

  const statusText = {
    complete: 'Lengkap',
    incomplete: 'Belum Lengkap',
    attention: 'Perhatian',
  };

  return (
    <div
      onClick={onActionClick || undefined}
      className={`bg-white p-3 sm:p-3.5 rounded-lg shadow-sm border-l-4 ${
        statusClasses[status]
      } flex flex-col justify-between overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 text-xs sm:text-sm truncate" title={title}>
              {title}
            </h4>
            {missingItems && missingItems.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-xs text-slate-500 my-auto">Belum lengkap:</span>
                {missingItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                    className="text-[11px] font-semibold px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition-colors shadow-sm"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2" title={description}>
                {description}
              </p>
            )}
          </div>
          <span
            className={`ml-3 flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${statusClasses[status]}`}
          >
            {statusText[status]}
          </span>
        </div>
      </div>
      {onActionClick && actionText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 text-right self-end truncate max-w-full"
        >
          {actionText} →
        </button>
      )}
    </div>
  );
};
