import React from 'react';
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
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { waliKelasName, stats, academicAlerts, completenessChecks } = useDashboardLogic(props);

  return (
    <div className="flex flex-col gap-6 pt-4 sm:pt-8 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Ringkasan Eksekutif</h2>
        <p className="mt-2 text-slate-600">
          Selamat datang, <span className="font-semibold text-indigo-700">{waliKelasName}</span>! Berikut adalah ikhtisar terkini mengenai progres kelas Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any, index: number) => (
          <StatCard
            key={index}
            {...stat}
          />
        ))}
      </div>

      <div className="flex flex-col gap-6 mt-4">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Kelengkapan Data Rapor</h3>
            <span className="text-sm font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              {completenessChecks.filter((c: any) => c.percentage === 100).length} / {completenessChecks.length} Selesai
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {completenessChecks.map((check: any, index: number) => (
              <ChecklistItem key={index} {...check} />
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Analisis Data</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {academicAlerts.length === 0 ? (
              <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 rounded-lg lg:col-span-full">
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
