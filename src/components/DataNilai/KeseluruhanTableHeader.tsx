import React from "react";

export const KeseluruhanTableHeader = ({ sortBy, displaySubjects }) => {
  return React.createElement(
    "thead",
    {
      className:
        "text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-30",
    },
    React.createElement(
      "tr",
      null,
      React.createElement(
        "th",
        {
          className:
            "w-[42px] min-w-[42px] max-w-[42px] sm:w-[60px] sm:min-w-[60px] sm:max-w-[60px] p-1.5 sm:p-2 text-center sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none border-b border-r border-slate-200 dark:border-slate-700 box-border select-none",
          style: {
            left: 0,
            top: 0,
          },
        },
        sortBy === "rank" ? "Rank" : "No",
      ),
      React.createElement(
        "th",
        {
          className:
            "p-1.5 sm:p-2 w-[135px] min-w-[130px] max-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-[260px] lg:max-w-[300px] break-words whitespace-normal border-b border-r border-slate-200 dark:border-slate-700 sticky top-0 z-30 lg:z-40 lg:left-[60px] bg-slate-100 dark:bg-slate-800 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] box-border select-none",
          style: {
            top: 0,
          },
        },
        "Nama Siswa",
      ),
      ...displaySubjects.map((s) =>
        React.createElement(
          "th",
          {
            key: s.id,
            className:
              "px-1.5 sm:px-2 py-3 w-16 sm:w-20 text-center border-b border-slate-200 dark:border-slate-700 select-none whitespace-nowrap",
            title: s.fullName,
          },
          s.label,
        ),
      ),
      React.createElement(
        "th",
        {
          className:
            "px-2 py-3 w-16 sm:w-20 text-center border-b border-slate-200 dark:border-slate-700 select-none whitespace-nowrap",
        },
        "Jumlah",
      ),
      React.createElement(
        "th",
        {
          className:
            "px-2 py-3 w-16 sm:w-20 text-center border-b border-slate-200 dark:border-slate-700 select-none whitespace-nowrap",
        },
        "Rata-rata",
      ),
    ),
  );
};
