import React from "react";

export const NilaiTableToolbar = ({
  onOpenSettings,
  onOpenManageSlm,
}) => {
  return React.createElement(
    "div",
    {
      className:
        "p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
    },
    React.createElement(
      "div",
      { className: "flex items-center gap-2" },
      React.createElement(
        "button",
        {
          id: "btn-rentang-nilai-pengolahan",
          onClick: onOpenSettings,
          className:
            "px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer",
        },
        "Rentang Nilai & Pengolahan",
      ),
      React.createElement(
        "button",
        {
          id: "btn-atur-lingkup-materi",
          onClick: onOpenManageSlm,
          className:
            "px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 cursor-pointer",
        },
        "Atur Lingkup Materi & TP",
      ),
    ),
    React.createElement(
      "p",
      { id: "tips-salin-nilai", className: "text-sm text-slate-500" },
      "Tips: Salin data dari Excel dan tempel (paste) ke dalam tabel. Perubahan disimpan otomatis.",
    ),
  );
};

