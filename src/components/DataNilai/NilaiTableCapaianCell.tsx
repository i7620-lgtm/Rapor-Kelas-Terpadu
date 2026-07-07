import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";

interface NilaiTableCapaianCellProps {
  studentId: string;
  descriptions: {
    highest: string;
    lowest: string;
  };
  handleDescriptionChange: (
    studentId: string,
    field: "highest" | "lowest",
    value: string
  ) => void;
  isCapaianPinned: boolean;
}

export const NilaiTableCapaianCell: React.FC<NilaiTableCapaianCellProps> = React.memo(({
  studentId,
  descriptions,
  handleDescriptionChange,
  isCapaianPinned,
}) => {
  return (
    <td
      className={`p-2 border-b border-l border-slate-200 min-w-[600px] ${
        isCapaianPinned
          ? "sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]"
          : ""
      }`}
    >
      <div className="flex flex-row gap-2">
        <AutoSizingTextarea
          value={descriptions.highest}
          onChange={(e) =>
            handleDescriptionChange(studentId, "highest", e.target.value)
          }
          placeholder="Deskripsi Tinggi"
          className={`w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-green-500 ${
            descriptions.highest && descriptions.highest.trim() !== ""
              ? "border-green-500 ring-1 ring-green-500"
              : "border-red-500 ring-1 ring-red-500"
          }`}
          rows={2}
        />
        <AutoSizingTextarea
          value={descriptions.lowest}
          onChange={(e) =>
            handleDescriptionChange(studentId, "lowest", e.target.value)
          }
          placeholder="Deskripsi Rendah"
          className={`w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-yellow-500 ${
            descriptions.lowest && descriptions.lowest.trim() !== ""
              ? "border-green-500 ring-1 ring-green-500"
              : "border-red-500 ring-1 ring-red-500"
          }`}
          rows={2}
        />
      </div>
    </td>
  );
}, (prev, next) => {
  return (
    prev.studentId === next.studentId &&
    prev.descriptions.highest === next.descriptions.highest &&
    prev.descriptions.lowest === next.descriptions.lowest &&
    prev.isCapaianPinned === next.isCapaianPinned
  );
});
