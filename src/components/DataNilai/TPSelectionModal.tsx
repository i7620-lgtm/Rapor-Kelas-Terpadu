import React, { useState, useEffect } from "react";

export const TPSelectionModal = ({
  isOpen,
  onClose,
  onApply,
  subject,
  availableTPs,
  isLoading,
}) => {
  const [selectedTPs, setSelectedTPs] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTPs([]);
    }
  }, [isOpen]);

  const handleCheckboxChange = (tpText) => {
    setSelectedTPs((prev) =>
      prev.includes(tpText)
        ? prev.filter((t) => t !== tpText)
        : [...prev, tpText],
    );
  };

  const handleApply = () => {
    onApply(selectedTPs);
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(
    "div",
    {
      className:
        "fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4",
    },
    React.createElement(
      "div",
      {
        className:
          "bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col",
      },
      React.createElement(
        "h3",
        { className: "text-lg font-bold text-slate-800 p-4 border-b" },
        `Pilih Tujuan Pembelajaran untuk ${subject.label}`,
      ),
      React.createElement(
        "div",
        { className: "p-6 overflow-y-auto" },
        isLoading
          ? React.createElement("p", null, "Memuat data TP...")
          : availableTPs && availableTPs.length > 0
            ? React.createElement(
                "div",
                { className: "space-y-4" },
                availableTPs.map((slmGroup, index) =>
                  React.createElement(
                    "div",
                    { key: index, className: "border rounded-lg" },
                    React.createElement(
                      "h4",
                      {
                        className:
                          "text-md font-semibold text-slate-800 p-3 bg-slate-50 rounded-t-lg border-b",
                      },
                      slmGroup.slm,
                    ),
                    React.createElement(
                      "div",
                      { className: "p-3 space-y-3" },
                      slmGroup.tp.map((tp, tpIndex) =>
                        React.createElement(
                          "label",
                          {
                            key: tpIndex,
                            className:
                              "flex items-start p-2 rounded-md cursor-pointer hover:bg-slate-100",
                          },
                          React.createElement("input", {
                            type: "checkbox",
                            checked: selectedTPs.includes(tp),
                            onChange: () => handleCheckboxChange(tp),
                            className: "mt-1 h-4 w-4 text-indigo-600",
                          }),
                          React.createElement(
                            "span",
                            { className: "ml-3 text-sm text-slate-700" },
                            tp,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              )
            : React.createElement(
                "p",
                { className: "text-slate-500" },
                `Tidak ada data TP yang ditemukan untuk mata pelajaran ini.`,
              ),
      ),
      React.createElement(
        "div",
        { className: "flex justify-end p-4 border-t bg-slate-50" },
        React.createElement(
          "button",
          {
            onClick: onClose,
            className:
              "px-4 py-2 text-sm font-medium bg-white border rounded-md",
          },
          "Batal",
        ),
        React.createElement(
          "button",
          {
            onClick: handleApply,
            disabled: selectedTPs.length === 0,
            className:
              "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md disabled:bg-indigo-300",
          },
          `Tambah ${selectedTPs.length} Pilihan`,
        ),
      ),
    ),
  );
};
