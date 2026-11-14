import React from "react";

export const NilaiTableToolbar = ({
  onOpenSettings,
  onOpenManageSlm,
}) => {
  return React.createElement(
    "div",
    {
      className:
        "px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2",
    },
    React.createElement(
      "div",
      { className: "flex flex-wrap items-center gap-2" },
      React.createElement(
        "button",
        {
          id: "btn-rentang-nilai-pengolahan",
          onClick: onOpenSettings,
          className:
            "min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer inline-flex items-center justify-center",
        },
        "Rentang Nilai & Pengolahan",
      ),
      React.createElement(
        "button",
        {
          id: "btn-atur-lingkup-materi",
          onClick: onOpenManageSlm,
          className:
            "min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 cursor-pointer inline-flex items-center justify-center",
        },
        "Atur Lingkup Materi & TP",
      ),
    )
  );
};

