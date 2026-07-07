import React from "react";
import { EmptyState } from "./EmptyState";
import { useDataEkstrakurikulerPageLogic, MAX_EXTRA_FIELDS } from "./DataEkstrakurikuler/useDataEkstrakurikulerPageLogic";

const DataEkstrakurikulerPage = (props: any) => {
  const {
    students,
    activeExtracurriculars,
    studentExtracurriculars,
    currentSemester,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleAssignmentChange,
    handleDescriptionChange,
    handlePasteActivity,
    handlePasteDescription,
  } = useDataEkstrakurikulerPageLogic(props);

  return (
    <div className="flex flex-col gap-4 pt-4 sm:pt-8">
      <div className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800">Data Ekstrakurikuler</h2>
        <p className="mt-1 text-slate-600">Kelola kegiatan ekstrakurikuler yang diikuti oleh siswa.</p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Data Ekstrakurikuler tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      ) : (
        <div
          className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden"
          onMouseLeave={() => {
            if (isSelecting) setIsSelecting(false);
          }}
        >
          <div className="flex-1 overflow-auto select-none ekstra-table-container">
            <table className="w-full text-sm text-left text-slate-500 border-separate border-spacing-0">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30">
                <tr>
                  <th
                    scope="col"
                    className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 sticky left-0 top-0 bg-slate-100 z-40 text-center  border-b border-slate-200 relative cursor-default select-none"
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
                    className="px-6 py-3 min-w-[200px] border-b border-slate-200 sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none"
                    style={getSelectionStyle(-1, -1).selectionStyle}
                    onMouseDown={(e: any) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -1);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -1)}
                  >
                    Nama Siswa
                  </th>
                  {Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => (
                    <React.Fragment key={i}>
                      <th
                        scope="col"
                        className="px-4 py-3 min-w-[200px] border-b border-slate-200 relative cursor-default select-none"
                        style={getSelectionStyle(-1, i * 2).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, i * 2);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(-1, i * 2)}
                      >
                        {`Ekstrakurikuler ${i + 1}`}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 min-w-[300px] border-b border-slate-200 relative cursor-default select-none"
                        style={getSelectionStyle(-1, i * 2 + 1).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, i * 2 + 1);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(-1, i * 2 + 1)}
                      >
                        {`Deskripsi ${i + 1}`}
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => {
                  const studentExtra = studentExtracurriculars.find(
                    (se: any) => se.studentId === student.id && (se.semester || 'Ganjil') === currentSemester,
                  );
                  const allAssignedIdsForStudent = (studentExtra?.assignedActivities || []).filter(Boolean);

                  return (
                    <tr key={student.id} id={student.id} className="bg-white hover:bg-slate-50">
                      <td
                        id={`cell-${index}--2`}
                        tabIndex={-1}
                        className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-2 text-center border-b border-slate-200 sticky left-0 z-20 bg-white  relative cursor-default select-none"
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
                        className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap text-left border-b border-slate-200 lg:sticky lg:left-[50px] lg:z-20 bg-white lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none group-hover:bg-[#fafafa]"
                        style={getSelectionStyle(index, -1).selectionStyle}
                        onMouseDown={(e: any) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -1);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, -1)}
                      >
                        {student.namaLengkap}
                      </th>
                      {Array.from({ length: MAX_EXTRA_FIELDS }).map((_, i) => {
                        const currentAssignedId = studentExtra?.assignedActivities?.[i] || null;

                        const optionsForThisDropdown = activeExtracurriculars.filter(
                          (ex: any) => ex.id === currentAssignedId || !allAssignedIdsForStudent.includes(ex.id),
                        );

                        const colSelectIdx = i * 2;
                        const colDescIdx = i * 2 + 1;
                        const { selectionStyle: styleSelect, showTransparentInput: showTransSelect } = getSelectionStyle(index, colSelectIdx);
                        const { selectionStyle: styleDesc, showTransparentInput: showTransDesc } = getSelectionStyle(index, colDescIdx);

                        return (
                          <React.Fragment key={i}>
                            <td
                              className="px-4 py-2 border-b border-slate-200 relative cursor-default select-none"
                              style={styleSelect}
                              onMouseDown={(e: any) => {
                                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
                                if (e.button !== 0) return;
                                handleMouseDownCell(e, index, colSelectIdx);
                              }}
                              onMouseEnter={() => handleMouseEnterCell(index, colSelectIdx)}
                            >
                              <select
                                id={`cell-${index}-${colSelectIdx}`}
                                value={currentAssignedId || "---"}
                                onChange={(e: any) => handleAssignmentChange(student.id, i, e.target.value)}
                                onFocus={() => handleFocusCell(index, colSelectIdx)}
                                onPaste={(e: any) => handlePasteActivity(e, student.id, i)}
                                className={`w-full p-2 text-sm rounded-md transition-all relative z-10 ${
                                  showTransSelect
                                    ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                                    : `bg-white border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                        currentAssignedId
                                          ? "border-green-500 ring-1 ring-green-500"
                                          : "border-red-500 ring-1 ring-red-500"
                                      }`
                                }`}
                                onMouseDown={(e: any) => {
                                  if (e.shiftKey) {
                                    e.preventDefault();
                                    handleMouseDownCell(e, index, colSelectIdx);
                                  }
                                }}
                              >
                                <option value="---">--- Pilih ---</option>
                                {optionsForThisDropdown.map((ex: any) => (
                                  <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td
                              className="px-4 py-2 border-b border-slate-200 relative cursor-default select-none"
                              style={styleDesc}
                              onMouseDown={(e: any) => {
                                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
                                if (e.button !== 0) return;
                                handleMouseDownCell(e, index, colDescIdx);
                              }}
                              onMouseEnter={() => handleMouseEnterCell(index, colDescIdx)}
                            >
                              {currentAssignedId && (
                                <textarea
                                  id={`cell-${index}-${colDescIdx}`}
                                  value={studentExtra?.descriptions?.[currentAssignedId] || ""}
                                  onChange={(e: any) => handleDescriptionChange(student.id, currentAssignedId, e.target.value)}
                                  onFocus={() => handleFocusCell(index, colDescIdx)}
                                  onPaste={(e: any) => handlePasteDescription(e, student.id, i)}
                                  rows={2}
                                  className={`w-full p-2 text-sm rounded-md transition-all relative z-10 ${
                                    showTransDesc
                                      ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                                      : `bg-white border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                          studentExtra?.descriptions?.[currentAssignedId] &&
                                          studentExtra.descriptions[currentAssignedId].trim() !== ""
                                            ? "border-green-500 ring-1 ring-green-500"
                                            : "border-red-500 ring-1 ring-red-500"
                                        }`
                                  }`}
                                  onMouseDown={(e: any) => {
                                    if (e.shiftKey) {
                                      e.preventDefault();
                                      handleMouseDownCell(e, index, colDescIdx);
                                    }
                                  }}
                                />
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
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

export default DataEkstrakurikulerPage;
