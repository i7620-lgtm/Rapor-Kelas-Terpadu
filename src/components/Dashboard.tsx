import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboardLogic } from './Dashboard/useDashboardLogic';
import { StatCard } from './Dashboard/StatCard';
import { AnalysisItem } from './Dashboard/AnalysisItem';
import { ChecklistItem } from './Dashboard/ChecklistItem';

interface DashboardProps {
  students?: any;
  settings?: any;
  grades?: any;
  activeSubjects?: any;
  learningObjectives?: any;
  cocurricularData?: any;
  studentExtracurriculars?: any;
  attendance?: any;
  notes?: any;
  setActivePage?: (page: string, anchor?: string) => void;
  onNavigateToNilai?: (id: string, anchor?: string) => void;
  formativeJournal?: any;
  isUpdateAvailable?: boolean;
  isUpdating?: boolean;
  onUpdateApp?: () => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { isUpdateAvailable, isUpdating, onUpdateApp } = props;
  const { waliKelasName, stats, academicAlerts, completenessChecks } = useDashboardLogic(props);

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Ringkasan Eksekutif</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Selamat datang, <span className="font-semibold text-indigo-700 dark:text-indigo-400">{waliKelasName}</span>! Berikut adalah ikhtisar terkini mengenai progres kelas Anda.
        </p>
      </div>

      {isUpdateAvailable && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">
              Pembaruan Versi Aplikasi Tersedia
            </h3>
            <p className="mt-0.5 text-xs text-indigo-800/90 dark:text-indigo-200/80 leading-relaxed">
              Versi terbaru RKT sudah siap diterapkan. Data lokal Anda aman dan otomatis disimpan sebelum memuat ulang halaman.
            </p>
          </div>
          <button
            type="button"
            onClick={onUpdateApp}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] lg:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Memperbarui...' : 'Perbarui Sekarang'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat: any, index: number) => (
          <StatCard
            key={index}
            {...stat}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-1">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex justify-between items-center gap-2 mb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Kelengkapan Data Rapor</h3>
            <span className="text-xs font-semibold tabular-nums px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full flex-shrink-0">
              {completenessChecks.filter((c: any) => c.percentage === 100).length} / {completenessChecks.length} Selesai
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {completenessChecks.map((check: any, index: number) => (
              <ChecklistItem key={index} {...check} />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Analisis Data</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {academicAlerts.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg lg:col-span-full">
                Tidak ada peringatan atau saran saat ini. Semuanya berjalan baik.
              </div>
            ) : (
              academicAlerts.map((alert: any, index: number) => (
                <AnalysisItem
                  key={index}
                  {...alert}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
