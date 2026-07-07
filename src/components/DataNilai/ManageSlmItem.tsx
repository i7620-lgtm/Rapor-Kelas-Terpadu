import React from "react";

interface ManageSlmItemProps {
  slm: {
    id: string;
    name: string;
    semester?: string;
    tps: Array<{ text: string; isEdited?: boolean }>;
  };
  onSlmNameChange: (slmId: string, newName: string) => void;
  onDeleteSlm: (slmId: string) => void;
  onSemesterToggle: (slmId: string, currentSemester: string, targetSemester: string) => void;
  onTpTextChange: (slmId: string, tpIndex: number, newText: string) => void;
  onDeleteTp: (slmId: string, tpIndex: number) => void;
  onAddManualTp: (slmId: string) => void;
  onOpenTpSelection: (slmId: string) => void;
}

export const ManageSlmItem: React.FC<ManageSlmItemProps> = ({
  slm,
  onSlmNameChange,
  onDeleteSlm,
  onSemesterToggle,
  onTpTextChange,
  onDeleteTp,
  onAddManualTp,
  onOpenTpSelection,
}) => {
  return (
    <div className="border rounded-lg">
      <div className="flex items-center p-3 bg-slate-50 rounded-t-lg border-b gap-4">
        <input
          type="text"
          value={slm.name}
          onChange={(e) => onSlmNameChange(slm.id, e.target.value)}
          className="flex-grow text-md font-semibold text-slate-800 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none"
        />
        <button
          onClick={() => onDeleteSlm(slm.id)}
          className="text-red-500 hover:text-red-700 p-1 text-2xl leading-none flex-shrink-0 cursor-pointer"
        >
          &times;
        </button>
      </div>
      <div className="p-4 space-y-2">
        {slm.tps.map((tp, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="font-semibold text-xs text-slate-400 pt-2">
              TP {index + 1}:
            </span>
            <textarea
              value={tp.text}
              onChange={(e) => onTpTextChange(slm.id, index, e.target.value)}
              className="flex-grow p-1.5 border rounded-md text-sm resize-none outline-none focus:border-indigo-500"
              rows={2}
            />
            <button
              onClick={() => onDeleteTp(slm.id, index)}
              className="text-red-500 hover:text-red-700 p-1 text-xl leading-none flex-shrink-0 mt-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        ))}
        {slm.tps.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">
            Belum ada Tujuan Pembelajaran.
          </p>
        )}
        <div className="pt-3 border-t flex flex-row flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() =>
                onSemesterToggle(
                  slm.id,
                  slm.semester || "Semua",
                  "Ganjil",
                )
              }
              className={`px-3 py-1 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
                !slm.semester || slm.semester === "Semua" || slm.semester === "Ganjil"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300 shadow-inner"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semester Ganjil
            </button>
            <button
              type="button"
              onClick={() =>
                onSemesterToggle(
                  slm.id,
                  slm.semester || "Semua",
                  "Genap",
                )
              }
              className={`px-3 py-1 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
                !slm.semester || slm.semester === "Semua" || slm.semester === "Genap"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300 shadow-inner"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semester Genap
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAddManualTp(slm.id)}
              className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer"
            >
              + Tambah TP Manual
            </button>
            <button
              type="button"
              onClick={() => onOpenTpSelection(slm.id)}
              className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 cursor-pointer"
            >
              Pilih TP dari Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
