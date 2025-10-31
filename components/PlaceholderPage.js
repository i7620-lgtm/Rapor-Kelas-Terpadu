import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    React.createElement('div', { className: "flex items-center justify-center h-full" },
      React.createElement('div', { className: "bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center" },
        React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, title),
        React.createElement('p', { className: "mt-2 text-slate-600" }, "Fitur ini sedang dalam pengembangan dan akan segera tersedia.")
      )
    )
  );
};

export default PlaceholderPage;
