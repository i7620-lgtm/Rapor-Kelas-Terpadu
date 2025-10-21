import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
        <p className="mt-2 text-slate-600">Fitur ini sedang dalam pengembangan dan akan segera tersedia.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
