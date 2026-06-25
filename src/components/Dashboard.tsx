import React from 'react';
import useDashboardLogic from './Dashboard/useDashboardLogic';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  actionText: string;
  onActionClick?: () => void;
  showAction: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
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

interface AnalysisItemProps {
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'attention';
  actionText?: string | null;
  onActionClick?: (() => void) | null;
}

const AnalysisItem: React.FC<AnalysisItemProps> = ({
  title,
  description,
  status,
  actionText,
  onActionClick,
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
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
        statusClasses[status]
      } flex flex-col justify-between overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 truncate" title={title}>
              {title}
            </h4>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={description}>
              {description}
            </p>
          </div>
          <span
            className={`ml-4 flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${statusClasses[status]}`}
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
          className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-right self-end truncate max-w-full"
        >
          {actionText} →
        </button>
      )}
    </div>
  );
};

const StatusIcon: React.FC<{ status: 'good' | 'bad' }> = ({ status }) => {
  if (status === 'good') {
    return (
      <svg
        className="w-6 h-6 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg
      className="w-6 h-6 text-yellow-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
};

interface ChecklistItemProps {
  title: string;
  status: 'good' | 'bad';
  message: string;
  actionText: string;
  onActionClick?: () => void;
  percentage: number;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  title,
  status,
  message,
  actionText,
  onActionClick,
  percentage,
}) => {
  const percentageColorClass = percentage === 100 ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
  const buttonColorClass =
    percentage === 100 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200';

  return (
    <div
      onClick={onActionClick}
      className={`relative flex items-start py-4 pl-4 pr-16 bg-white rounded-lg shadow-sm border border-slate-200 space-x-4 overflow-hidden ${
        onActionClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div
        className={`absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold z-10 flex-shrink-0 ${percentageColorClass}`}
        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
      >
        {`${percentage}%`}
      </div>
      <div className="flex-shrink-0 mt-1">
        <StatusIcon status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 truncate" title={title}>
          {title}
        </h4>
        <p className="text-sm text-slate-600 mt-1 line-clamp-2" title={message}>
          {message}
        </p>
        {onActionClick && actionText && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
            className={`mt-3 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors truncate max-w-full w-fit ${buttonColorClass}`}
          >
            {actionText} →
          </button>
        )}
      </div>
    </div>
  );
};

interface DashboardProps {
  setActivePage: (page: string, anchor?: string) => void;
  onNavigateToNilai: (subjectId: string) => void;
  settings?: any;
  students?: any[];
  grades?: any[];
  subjects?: any[];
  notes?: Record<string, string>;
  cocurricularData?: any;
  attendance?: any[];
  studentExtracurriculars?: any[];
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { waliKelasName, stats, academicAlerts, completenessChecks } = useDashboardLogic(props);

  return (
    <div className="space-y-8 pt-4 sm:pt-8 w-full max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h2>
        <p className="mt-2 text-slate-600">Selamat datang, {waliKelasName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-800 mt-8">Status Kelengkapan Data</h3>
        <p className="mt-1 text-slate-600 mb-6 font-normal">Pastikan semua data terisi sebelum mencetak rapor.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completenessChecks.map((item) => (
            <ChecklistItem key={item.title} {...item} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-800 mt-8">Perhatian Akademik</h3>
        <p className="mt-1 text-slate-600 font-normal">Ringkasan data nilai siswa yang memerlukan perhatian Anda.</p>
        <div className="mt-6">
          {academicAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {academicAlerts.map((item) => (
                <AnalysisItem
                  key={item.title}
                  {...item}
                  actionText={
                    item.actionSubjectId
                      ? item.status === 'incomplete'
                        ? 'Lengkapi Nilai'
                        : 'Perbaiki Nilai'
                      : null
                  }
                  onActionClick={
                    item.actionSubjectId ? () => props.onNavigateToNilai(item.actionSubjectId) : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center col-span-full">
              <p className="text-slate-500 font-medium my-0">
                Semua data terlihat baik! Tidak ada item yang memerlukan perhatian khusus saat ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
