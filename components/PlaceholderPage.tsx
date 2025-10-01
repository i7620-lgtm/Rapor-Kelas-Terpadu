import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white p-10 rounded-xl shadow-md border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">{title}</h1>
      <p className="mt-4 text-slate-600 max-w-md">
        Halaman ini sedang dalam pengembangan. Fitur untuk mengelola {title.toLowerCase()} akan segera tersedia di sini.
      </p>
    </div>
  );
};

export default PlaceholderPage;
