

import React from 'react';
import { Page, StatCardProps, AnalysisItemProps, AppSettings, Student } from '../types.js';

// Define StatCard component inside Dashboard file scope as it's only used here
const StatCard: React.FC<StatCardProps> = ({ title, value, description, actionText, onActionClick }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
            <p className="mt-4 text-4xl font-bold text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        {actionText && onActionClick && (
             <button onClick={onActionClick} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-left">
                {actionText} &rarr;
            </button>
        )}
    </div>
);

// Define AnalysisItem component inside Dashboard file scope
const AnalysisItem: React.FC<AnalysisItemProps> = ({ title, description, status }) => {
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
        <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${statusClasses[status]}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                </div>
                <span className={`ml-4 text-xs font-bold px-2 py-1 rounded-full ${statusClasses[status]}`}>{statusText[status]}</span>
            </div>
        </div>
    );
};


interface DashboardProps {
  setActivePage: (page: Page) => void;
  settings: AppSettings;
  students: Student[];
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage, settings, students }) => {
  const waliKelasName = settings.nama_wali_kelas || "Wali Kelas";

  const stats: StatCardProps[] = [
    { 
        title: "Kelas", 
        value: settings.nama_kelas || "-", 
        description: "Kelas yang diampu saat ini.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
    { 
        title: "Jumlah Siswa", 
        value: students.length.toString(), 
        description: "Siswa yang terdaftar di kelas.",
        actionText: "Klik Data Siswa untuk menambah",
        onActionClick: () => setActivePage('DATA_SISWA'),
    },
    { 
        title: "Tahun Ajaran", 
        value: settings.tahun_ajaran || "-", 
        description: "Tahun ajaran yang sedang berjalan.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
    { 
        title: "Semester", 
        value: settings.semester || "-", 
        description: "Semester yang sedang berlangsung.",
        actionText: "Klik Pengaturan untuk mengubah",
        onActionClick: () => setActivePage('PENGATURAN'),
    },
  ];
  
  const analysisItems: AnalysisItemProps[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="mt-2 text-slate-600">Selamat datang, {waliKelasName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-slate-800">Analisis Data</h3>
        <p className="mt-1 text-slate-600">Ringkasan data penting yang memerlukan perhatian Anda.</p>
        <div className="mt-6">
          {analysisItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analysisItems.map(item => <AnalysisItem key={item.title} {...item} />)}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-slate-500">Tidak ada data analisis yang tersedia untuk ditampilkan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
