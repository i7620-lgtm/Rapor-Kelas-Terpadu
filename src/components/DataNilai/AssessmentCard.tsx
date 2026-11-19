import React from "react";

export const AssessmentCard = ({ title, type, item, getCompletionStatus, handleOpenModal }: any) => {
  const { filled, total, percentage } = getCompletionStatus(type, item);
  let statusColor = "bg-slate-200";
  if (percentage > 0) statusColor = "bg-yellow-400";
  if (percentage === 100) statusColor = "bg-green-500";
  return React.createElement(
    "div",
    {
      className:
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between",
      onClick: () => handleOpenModal(type, item),
    },
    React.createElement(
      "div",
      { className: "p-3 sm:p-3.5" },
      React.createElement(
        "h4",
        { className: "text-sm font-bold text-slate-800 dark:text-slate-100" },
        title,
      ),
      type === "slm" &&
        React.createElement(
          "p",
          { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums" },
          `${item.tps?.length || 0} Tujuan Pembelajaran`,
        ),
    ),
    React.createElement(
      "div",
      { className: "p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-b-lg border-t border-slate-200 dark:border-slate-700" },
      React.createElement(
        "div",
        { className: "flex justify-between items-center text-xs mb-1.5" },
        React.createElement(
          "span",
          { className: "text-slate-600 dark:text-slate-300" },
          "Progress Pengisian",
        ),
        React.createElement(
          "span",
          { className: "font-semibold text-slate-800 dark:text-slate-100 tabular-nums" },
          `${percentage}%`,
        ),
      ),
      React.createElement(
        "div",
        { className: "w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden" },
        React.createElement("div", {
          className: `${statusColor} h-2 transition-all duration-300`,
          style: { width: `${percentage}%` },
        }),
      ),
      React.createElement(
        "p",
        { className: "text-xs text-slate-500 dark:text-slate-400 mt-2 text-center tabular-nums" },
        `${filled} dari ${total} nilai terisi`,
      ),
    ),
  );
};
