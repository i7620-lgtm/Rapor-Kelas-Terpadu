import React from "react";
import { EmptyState } from "./EmptyState";
import { useDataAbsensiPageLogic } from "./DataAbsensi/useDataAbsensiPageLogic";

const DataAbsensiPage = (props: any) => {
  const {
    students,
    getAttendanceForStudent,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleAttendanceChange,
    handlePaste,
  } = useDataAbsensiPageLogic(props);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Absensi</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Catat jumlah ketidakhadiran siswa selama satu semester. Kosongkan kolom jika tidak ada ketidakhadiran.
        </p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Data absensi tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      ) : (
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden"
          onMouseLeave={() => {
            if (isSelecting) setIsSelecting(false);
          }}
        >
          <div className="flex-1 overflow-auto select-none absensi-table-container">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
              <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-30">
                <tr>
                  <th
                    scope="col"
                    className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 text-center sticky left-0 top-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                    style={getSelectionStyle(-1, -2).selectionStyle}
                    onMouseDown={(e: any) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -2);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -2)}
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-[135px] min-w-[135px] max-w-[165px] sm:w-auto sm:min-w-[200px] sm:max-w-[300px] sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 dark:bg-slate-800 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] relative cursor-default select-none"
                    style={getSelectionStyle(-1, -1).selectionStyle}
                    onMouseDown={(e: any) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -1);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -1)}
                  >
                    Nama Lengkap
                  </th>
                  {["Sakit (S)", "Izin (I)", "Alpa (A)"].map((colName, cIndex) => (
                    <th
                      key={colName}
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700 whitespace-nowrap relative cursor-default select-none"
                      style={getSelectionStyle(-1, cIndex).selectionStyle}
                      onMouseDown={(e: any) => {
                        if (e.button !== 0) return;
                        handleMouseDownCell(e, -1, cIndex);
                      }}
                      onMouseEnter={() => handleMouseEnterCell(-1, cIndex)}
                    >
                      {colName}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-center border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                    style={getSelectionStyle(-1, 3).selectionStyle}
                    onMouseDown={(e: any) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, 3);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, 3)}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => {
                  const studentAtt = getAttendanceForStudent(student.id);
                  const total = (studentAtt.sakit ?? 0) + (studentAtt.izin ?? 0) + (studentAtt.alpa ?? 0);
                  
                  return (
                    <tr key={student.id} id={student.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 focus-within:bg-slate-50 dark:focus-within:bg-slate-800/70 group">
                      <td
                        id={`cell-${index}--2`}
                        tabIndex={-1}
                        className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 sm:py-4 text-center tabular-nums sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                        style={getSelectionStyle(index, -2).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -2);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, -2)}
                      >
                        {index + 1}
                      </td>
                      <th
                        id={`cell-${index}--1`}
                        tabIndex={-1}
                        scope="row"
                        className="px-3 sm:px-4 py-3 sm:py-4 font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 w-[135px] min-w-[135px] max-w-[165px] sm:w-auto sm:min-w-[200px] sm:max-w-[300px] break-words lg:sticky lg:left-[50px] z-10 lg:z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] relative cursor-default select-none"
                        style={getSelectionStyle(index, -1).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -1);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, -1)}
                      >
                        {student.namaLengkap}
                      </th>
                      {["sakit", "izin", "alpa"].map((field, cIndex) => {
                        const { selectionStyle, showTransparentInput } = getSelectionStyle(index, cIndex);

                        return (
                          <td
                            key={field}
                            className="px-2 sm:px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
                            style={selectionStyle}
                            onMouseDown={(e: any) => {
                              if (e.target.tagName === "INPUT") return;
                              if (e.button !== 0) return;
                              handleMouseDownCell(e, index, cIndex);
                            }}
                            onMouseEnter={() => handleMouseEnterCell(index, cIndex)}
                          >
                            <input
                              id={`cell-${index}-${cIndex}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={studentAtt[field as keyof typeof studentAtt] ?? ""}
                              onChange={(e: any) => {
                                const val = e.target.value;
                                const hasSeparators = /[\n\r\t;]/.test(val) || (/\s+/.test(val.trim()) && val.trim().split(/\s+/).length > 1);
                                if (hasSeparators) {
                                  handlePaste({
                                    preventDefault: () => {},
                                    clipboardData: {
                                      getData: () => val
                                    }
                                  }, student.id, field);
                                  return;
                                }
                                if (val === "" || /^\d*$/.test(val)) {
                                  handleAttendanceChange(student.id, field, val);
                                }
                              }}
                              onFocus={() => handleFocusCell(index, cIndex)}
                              onPaste={(e) => handlePaste(e, student.id, field)}
                              className={`w-16 sm:w-20 p-2 text-center tabular-nums rounded-lg transition-all relative z-10 ${
                                showTransparentInput
                                  ? "bg-white border-transparent shadow-none focus:outline-none focus:ring-0"
                                  : `bg-white border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                      studentAtt[field as keyof typeof studentAtt] !== null &&
                                      studentAtt[field as keyof typeof studentAtt] !== undefined &&
                                      studentAtt[field as keyof typeof studentAtt] !== ""
                                        ? "border-green-500 ring-1 ring-green-500"
                                        : "border-red-500 ring-1 ring-red-500"
                                    }`
                              }`}
                              aria-label={`Jumlah ${field} untuk ${student.namaLengkap}`}
                              onMouseDown={(e: any) => {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  handleMouseDownCell(e, index, cIndex);
                                }
                              }}
                            />
                          </td>
                        );
                      })}
                      <td
                        id={`cell-${index}-3`}
                        tabIndex={-1}
                        className="px-3 sm:px-6 py-3 sm:py-4 text-center font-semibold tabular-nums text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70"
                        style={getSelectionStyle(index, 3).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, 3);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, 3)}
                      >
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAbsensiPage;
