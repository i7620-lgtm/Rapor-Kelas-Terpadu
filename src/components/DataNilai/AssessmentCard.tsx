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
        "bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between",
      onClick: () => handleOpenModal(type, item),
    },
    React.createElement(
      "div",
      { className: "p-4" },
      React.createElement(
        "h4",
        { className: "font-bold text-slate-800" },
        title,
      ),
      type === "slm" &&
        React.createElement(
          "p",
          { className: "text-xs text-slate-500 mt-1" },
          `${item.tps?.length || 0} Tujuan Pembelajaran`,
        ),
    ),
    React.createElement(
      "div",
      { className: "p-4 bg-slate-50 rounded-b-lg border-t" },
      React.createElement(
        "div",
        { className: "flex justify-between items-center text-sm mb-2" },
        React.createElement(
          "span",
          { className: "text-slate-600" },
          "Progress Pengisian",
        ),
        React.createElement(
          "span",
          { className: "font-semibold text-slate-800" },
          `${percentage}%`,
        ),
      ),
      React.createElement(
        "div",
        { className: "w-full bg-slate-200 rounded-full h-2 overflow-hidden" },
        React.createElement("div", {
          className: `${statusColor} h-2 transition-all duration-300`,
          style: { width: `${percentage}%` },
        }),
      ),
      React.createElement(
        "p",
        { className: "text-xs text-slate-500 mt-2 text-center" },
        `${filled} dari ${total} nilai terisi`,
      ),
    ),
  );
};
