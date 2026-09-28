import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    React.createElement('div', { className: "flex items-center justify-center h-full" },
      React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-sm border border-zinc-200/60 text-center max-w-md mx-auto" },
        React.createElement('h2', { className: "text-xl font-bold text-zinc-800" }, title),
        React.createElement('p', { className: "mt-1 text-xs text-zinc-500" }, "Fitur ini sedang dalam pengembangan dan akan segera tersedia.")
      )
    )
  );
};

export default PlaceholderPage;