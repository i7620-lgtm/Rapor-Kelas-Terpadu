import React from "react";
import { COCURRICULAR_DIMENSIONS, COCURRICULAR_RATINGS } from "../constants";
import { EmptyState } from "./EmptyState";
import { useDataKokurikulerPageLogic } from "./DataKokurikuler/useDataKokurikulerPageLogic";

const DataKokurikulerPage = (props: any) => {
  const {
    students,
    settings,
    cocurricularData,
    currentSemester,
    dimensionField,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    handleRatingChange,
    handlePaste,
    handleSetAllRatings,
    onSettingsChange,
    showIncompleteHighlight,
    setShowIncompleteHighlight,
    showBelowKkmHighlight,
    setShowBelowKkmHighlight,
    stats,
  } = useDataKokurikulerPageLogic(props);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Kokurikuler</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Isi tema kegiatan dan berikan penilaian capaian kokurikuler siswa yang berfokus pada perkembangan dimensi profil lulusan.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tema Kegiatan</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
          Masukkan nama tema kegiatan kokurikuler yang dilaksanakan pada semester ini. Tema ini akan muncul pada deskripsi di rapor.
        </p>
        <input
          type="text"
          name={currentSemester === "Genap" ? "cocurricular_theme_Genap" : "cocurricular_theme"}
          value={currentSemester === "Genap" ? (settings.cocurricular_theme_Genap || "") : (settings.cocurricular_theme || "")}
          onChange={onSettingsChange}
          placeholder="Contoh: Kearifan Lokal"
          className="w-full max-w-lg px-3 py-2 lg:py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Data Kokurikuler tidak dapat dikelola karena belum ada siswa di kelas ini. Silakan tambahkan siswa di halaman 'Data Siswa' terlebih dahulu."
          primaryActionLabel="Isi Data Siswa"
          onPrimaryAction={() => props.setActivePage && props.setActivePage('DATA_SISWA')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden">
          <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Penilaian Dimensi Profil</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Masukkan kode penilaian pada kolom dimensi yang sesuai.</p>
              </div>
              {/* Legend Panel */}
              <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 text-xs bg-slate-50 dark:bg-slate-800/70 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {Object.entries(COCURRICULAR_RATINGS).map(([code, desc]) => (
                  <div key={code} className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">{code}</span>
                    <span className="text-slate-600 dark:text-slate-300">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlight Controls */}
            <div className="flex items-center gap-2.5 text-xs font-semibold select-none flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowIncompleteHighlight(!showIncompleteHighlight);
                }}
                className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  showIncompleteHighlight
                    ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
                    showIncompleteHighlight ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span>Nilai Tidak Lengkap</span>
                {stats?.incompleteCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-full text-[10px] font-bold tabular-nums">
                    {stats.incompleteCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowBelowKkmHighlight(!showBelowKkmHighlight);
                }}
                className={`min-h-[44px] lg:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  showBelowKkmHighlight
                    ? "bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
                    showBelowKkmHighlight ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span>Nilai di Bawah KKM (BB)</span>
                {stats?.belowKkmCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-100 rounded-full text-[10px] font-bold tabular-nums">
                    {stats.belowKkmCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div
            className="flex-1 overflow-auto select-none cocurricular-table-container"
            onMouseLeave={() => {
              if (isSelecting) setIsSelecting(false);
            }}
          >
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
              <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-30">
                <tr>
                  <th
                    scope="col"
                    className="w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-3 sticky left-0 top-0 z-40 bg-slate-100 dark:bg-slate-800 text-center border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none"
                    style={getSelectionStyle(-1, -2).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (e.shiftKey) e.preventDefault();
                      handleMouseDownCell(e, -1, -2);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -2)}
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 w-[135px] min-w-[135px] sm:w-auto sm:min-w-[200px] border-b border-slate-200 dark:border-slate-700 sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 dark:bg-slate-800 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none"
                    style={getSelectionStyle(-1, -1).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (e.shiftKey) e.preventDefault();
                      handleMouseDownCell(e, -1, -1);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -1)}
                  >
                    Nama Siswa
                  </th>
                  {COCURRICULAR_DIMENSIONS.map((dim, dimIndex) => (
                    <th
                      key={dim.id}
                      scope="col"
                      className="px-2 sm:px-3 py-2 w-[112px] sm:w-[116px] min-w-[112px] sm:min-w-[116px] text-center border-b border-slate-200 dark:border-slate-700 align-bottom relative cursor-default select-none"
                      style={getSelectionStyle(-1, dimIndex).selectionStyle}
                      onMouseDown={(e) => {
                        if (e.target.tagName === "BUTTON") return;
                        if (e.button !== 0) return;
                        if (e.shiftKey) e.preventDefault();
                        handleMouseDownCell(e, -1, dimIndex);
                      }}
                      onMouseEnter={() => handleMouseEnterCell(-1, dimIndex)}
                    >
                      <div className="mb-1 text-[10px] leading-tight flex items-end justify-center min-h-[28px] pb-1">
                        {dim.label}
                      </div>
                      <div className="flex justify-center flex-nowrap gap-1 mt-1">
                        {["BB", "MB", "BSH", "SB"].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleSetAllRatings(dim.id, rating)}
                            className="min-h-[30px] lg:min-h-0 px-1.5 lg:px-1 py-1 lg:py-0.5 text-[9px] lg:text-[8px] font-bold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                            title={`Set semua siswa menjadi ${rating}`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => {
                  const studentRatings = cocurricularData[student.id]?.[dimensionField] || {};
                  const hasMissingRating = COCURRICULAR_DIMENSIONS.some(dim => !studentRatings[dim.id] || studentRatings[dim.id] === "-" || studentRatings[dim.id] === "");
                  const hasBbRating = COCURRICULAR_DIMENSIONS.some(dim => studentRatings[dim.id] === "BB");
                  const studentRowHighlight = (hasMissingRating && showIncompleteHighlight)
                    ? "bg-red-50 dark:bg-red-900/35 text-red-700 dark:text-red-200 font-bold"
                    : (hasBbRating && showBelowKkmHighlight)
                      ? "bg-rose-50 dark:bg-rose-900/35 text-red-600 dark:text-red-200 font-bold"
                      : "";

                  return (
                    <React.Fragment key={student.id}>
                      <tr id={student.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 group">
                        <td
                          id={`cocurricular-cell-${index}--2`}
                          tabIndex={-1}
                          className={`w-[40px] min-w-[40px] max-w-[40px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-1.5 sm:px-2 py-2 text-center tabular-nums border-b border-slate-200 dark:border-slate-700 sticky left-0 z-20 relative cursor-default select-none ${studentRowHighlight || "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70"}`}
                          style={getSelectionStyle(index, -2).selectionStyle}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            if (e.shiftKey) e.preventDefault();
                            handleMouseDownCell(e, index, -2);
                          }}
                          onMouseEnter={() => handleMouseEnterCell(index, -2)}
                        >
                          {index + 1}
                        </td>
                        <th
                          id={`cocurricular-cell-${index}--1`}
                          tabIndex={-1}
                          scope="row"
                          className={`px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-normal sm:whitespace-nowrap break-words text-left border-b border-slate-200 dark:border-slate-700 lg:sticky lg:left-[50px] lg:z-20 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] relative cursor-default select-none group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 ${studentRowHighlight ? studentRowHighlight : "text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"}`}
                          style={getSelectionStyle(index, -1).selectionStyle}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            if (e.shiftKey) e.preventDefault();
                            handleMouseDownCell(e, index, -1);
                          }}
                          onMouseEnter={() => handleMouseEnterCell(index, -1)}
                        >
                          {student.namaLengkap}
                        </th>
                        {COCURRICULAR_DIMENSIONS.map((dim, dimIndex) => {
                          const rating = cocurricularData[student.id]?.[dimensionField]?.[dim.id] || "";
                          const isRatingBB = rating === "BB";
                          const isRatingPassing = ["MB", "BSH", "SB"].includes(rating);
                          const isRatingInvalid = rating && !["BB", "MB", "BSH", "SB", "-"].includes(rating);

                          let inputHighlightClass = "bg-white shadow-sm border focus:ring-indigo-500 focus:border-indigo-500 relative z-10 ";
                          if (isRatingInvalid) {
                            inputHighlightClass += "border-red-500 ring-1 ring-red-500 bg-rose-100 text-rose-800 font-bold";
                          } else if (isRatingBB) {
                            if (showBelowKkmHighlight) {
                              inputHighlightClass += "border-red-500 ring-2 ring-red-500 bg-rose-50 text-red-700 font-extrabold shadow-sm";
                            } else {
                              inputHighlightClass += "border-red-400 text-red-600 bg-rose-50/50 font-bold";
                            }
                          } else if (isRatingPassing) {
                            inputHighlightClass += "border-green-500 ring-1 ring-green-500 text-emerald-700 bg-emerald-50/20 font-bold";
                          } else {
                            if (showIncompleteHighlight) {
                              inputHighlightClass += "border-red-500 ring-1 ring-red-500 bg-red-50/30 text-red-600 placeholder:text-red-400 font-semibold";
                            } else {
                              inputHighlightClass += "border-slate-300 dark:border-slate-600 text-slate-500";
                            }
                          }

                          const { selectionStyle, isRightmost, isBottommost, showTransparentInput } = getSelectionStyle(index, dimIndex);

                          return (
                            <td
                              key={dim.id}
                              className="relative px-2 sm:px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-center align-middle transition-colors"
                              style={selectionStyle}
                              onMouseDown={(e) => {
                                const target = e.target as HTMLElement;
                                if (target && target.tagName === "INPUT") return;
                                if (e.button !== 0) return;
                                if (e.shiftKey) e.preventDefault();
                                handleMouseDownCell(e, index, dimIndex);
                              }}
                              onMouseEnter={() => handleMouseEnterCell(index, dimIndex)}
                            >
                              <input
                                type="text"
                                id={`cocurricular-cell-${index}-${dimIndex}`}
                                value={rating}
                                onChange={(e) => handleRatingChange(student.id, dim.id, e.target.value)}
                                onPaste={(e) => handlePaste(e, student.id, dim.id)}
                                onFocus={() => handleFocusCell(index, dimIndex)}
                                onMouseDown={(e) => {
                                  if (e.button !== 0) return;
                                }}
                                className={`block w-14 sm:w-11 mx-auto px-1 py-1.5 sm:py-1 text-center text-sm uppercase rounded-md transition-all ${
                                  showTransparentInput
                                    ? "bg-transparent border-transparent shadow-[none_!important] outline-none focus:outline-none focus:ring-0 relative z-10 font-bold"
                                    : inputHighlightClass
                                }`}
                                placeholder="-"
                              />
                              {isBottommost && isRightmost && (
                                <div className="absolute bottom-[-3px] right-[-3px] w-2 h-2 bg-indigo-600 border border-white z-10"></div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
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

export default DataKokurikulerPage;
