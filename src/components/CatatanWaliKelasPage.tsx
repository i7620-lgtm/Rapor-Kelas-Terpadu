import React from "react";
import { EmptyState } from "./EmptyState";
import { useCatatanWaliKelasPageLogic } from "./CatatanWaliKelas/useCatatanWaliKelasPageLogic";

export interface CatatanWaliKelasPageProps {
  setActivePage?: (page: string, anchor?: string) => void;
  showToast?: (message: string, type?: string) => void;
}

const CatatanWaliKelasPage: React.FC<CatatanWaliKelasPageProps> = (props) => {
  const {
    students,
    notes,
    getNoteKey,
    handleGenerateNote,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleNoteChange,
    handlePaste,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  } = useCatatanWaliKelasPageLogic(props);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Catatan Wali Kelas
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Berikan catatan atau umpan balik mengenai perkembangan siswa selama satu semester.
        </p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Catatan wali kelas tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage("DATA_SISWA")}
        />
      ) : (
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden"
          onMouseLeave={() => {
            if (isSelecting) setIsSelecting(false);
          }}
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto select-none catatan-table-container"
          >
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
              <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-30">
                <tr>
                  <th
                    scope="col"
                    className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 text-center sticky left-0 top-0 z-40 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                    style={getSelectionStyle(-1, -2).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -2);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -2)}
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 w-[135px] min-w-[135px] sm:w-auto sm:min-w-[250px] sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 dark:bg-slate-800 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none"
                    style={getSelectionStyle(-1, -1).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -1);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -1)}
                  >
                    Nama Lengkap
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 min-w-[250px] sm:min-w-[400px] relative cursor-default select-none"
                    style={getSelectionStyle(-1, 0).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, 0);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, 0)}
                  >
                    Catatan Wali Kelas
                  </th>
                </tr>
              </thead>
              <tbody>
                {topSpacerHeight > 0 && (
                  <tr key="__top-spacer__" aria-hidden={true} className="pointer-events-none">
                    <td
                      colSpan={3}
                      style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
                {students.slice(startIndex, endIndex + 1).map((student: any, sliceIdx: number) => {
                  const index = startIndex + sliceIdx;
                  const { selectionStyle, showTransparentInput } = getSelectionStyle(index, 0);
                  const noteVal = notes[getNoteKey(student.id)] || "";

                  return (
                    <tr
                      key={student.id}
                      id={student.id}
                      ref={(el) => measureRow(index, el)}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 align-top group"
                    >
                      <td
                        id={`cell-${index}--2`}
                        tabIndex={-1}
                        className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 sm:py-4 text-center tabular-nums sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                        style={getSelectionStyle(index, -2).selectionStyle}
                        onMouseDown={(e) => {
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
                        className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-normal sm:whitespace-nowrap break-words border-b border-slate-200 dark:border-slate-700 lg:sticky lg:left-[50px] lg:z-20 bg-white dark:bg-slate-900 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70"
                        style={getSelectionStyle(index, -1).selectionStyle}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, -1);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, -1)}
                      >
                        {student.namaLengkap}
                      </th>
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                        style={selectionStyle}
                        onMouseDown={(e) => {
                          const targetTag = (e.target as HTMLElement).tagName;
                          if (targetTag === "TEXTAREA" || targetTag === "BUTTON") return;
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, index, 0);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(index, 0)}
                      >
                        <textarea
                          id={`cell-${index}-0`}
                          value={noteVal}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          onFocus={() => handleFocusCell(index, 0)}
                          onPaste={(e) => handlePaste(e, student.id)}
                          placeholder="Tulis catatan untuk siswa di sini..."
                          className={`w-full p-2 text-sm rounded-lg transition-all relative z-10 ${
                            showTransparentInput
                              ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                              : `bg-white border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                  noteVal && noteVal.trim() !== ""
                                    ? "border-green-500 ring-1 ring-green-500"
                                    : "border-red-500 ring-1 ring-red-500"
                                }`
                          }`}
                          rows={4}
                          aria-label={`Catatan wali kelas untuk ${student.namaLengkap}`}
                          onMouseDown={(e) => {
                            if (e.shiftKey) {
                              e.preventDefault();
                              handleMouseDownCell(e, index, 0);
                            }
                          }}
                        />
                        <div
                          className={`flex justify-end mt-2 ${
                            showTransparentInput ? "opacity-0" : "opacity-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleGenerateNote(student)}
                            className="min-h-[44px] lg:min-h-0 px-3 py-1.5 lg:py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer inline-flex items-center"
                            title="Buat catatan cerdas berdasarkan peringkat dan nilai siswa"
                          >
                            Buat Catatan Otomatis
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bottomSpacerHeight > 0 && (
                  <tr key="__bottom-spacer__" aria-hidden={true} className="pointer-events-none">
                    <td
                      colSpan={3}
                      style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatatanWaliKelasPage;
