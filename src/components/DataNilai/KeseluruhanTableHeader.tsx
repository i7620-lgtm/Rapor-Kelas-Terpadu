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
            "p-2 text-center sticky top-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-r border-slate-200 box-border select-none",
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
            "p-2 min-w-[200px] max-w-[300px] border-b border-r border-slate-200 sticky top-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] box-border select-none",
          style: { left: "60px", top: 0 },
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
