import React from "react";

export const KeseluruhanTableHeader = ({ sortBy, displaySubjects }) => {
  return React.createElement(
    "thead",
    {
      className:
        "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30",
    },
    React.createElement(
      "tr",
      null,
      React.createElement(
        "th",
        {
          className:
            "p-2 text-center sticky top-0 z-40 bg-slate-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none border-b border-r border-slate-200 box-border select-none",
          style: {
            left: 0,
            top: 0,
            width: "60px",
            minWidth: "60px",
            maxWidth: "60px",
          },
        },
        sortBy === "rank" ? "Rank" : "No",
      ),
      React.createElement(
        "th",
        {
          className:
            "p-2 w-[260px] min-w-[200px] max-w-[300px] break-words whitespace-normal border-b border-r border-slate-200 sticky top-0 z-30 lg:z-40 lg:left-[60px] bg-slate-100 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] box-border select-none",
          style: {
            top: 0,
            width: "260px",
            minWidth: "200px",
            maxWidth: "300px",
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
              "px-2 py-3 w-20 text-center border-b border-slate-200 select-none",
            title: s.fullName,
          },
          s.label,
        ),
      ),
      React.createElement(
        "th",
        {
          className:
            "px-2 py-3 w-20 text-center border-b border-slate-200 select-none",
        },
        "Jumlah",
      ),
      React.createElement(
        "th",
        {
          className:
            "px-2 py-3 w-20 text-center border-b border-slate-200 select-none",
        },
        "Rata-rata",
      ),
    ),
  );
};
