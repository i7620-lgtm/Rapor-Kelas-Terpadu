import React from 'react';
import { EmptyState } from './EmptyState';
import { BulkAddRowModal } from './DataSiswa/BulkAddRowModal';
import { SiswaTableRow } from './DataSiswa/SiswaTableRow';
import { useDataSiswaPageLogic } from './DataSiswa/useDataSiswaPageLogic';
import { processImageWithWorker } from '../workers/workerManager';
import { dataURLToBlob, saveStudentPhotoBlob } from '../utils/imageDB';
import { useStudentsStore } from '../stores/useStudentsStore';

export interface DataSiswaPageProps {
  showToast?: (message: string, type?: string) => void;
}

const DataSiswaPage: React.FC<DataSiswaPageProps> = (props) => {
  const logic = useDataSiswaPageLogic(props);
  const {
    students: localStudents,
    studentPhotoUrls,
    namaKelas,
    isModalOpen,
    setIsModalOpen,
    handleAddNew,
    handleBulkAdd,
    handleMoveStudent,
    handleDelete,
    handleInputChange,
    handleInputBlur,
    handlePaste,
    handleBulkPhotoUpload,
    selectionBounds,
    isSelecting,
    setIsSelecting,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleFocusCell,
    nameField,
    otherFields,
    setLocalStudents,
    onBulkSaveStudents,
    scrollContainerRef,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    measureRow,
  } = logic;

  const renderCellInput = (
    student: any,
    fieldDef: any,
    rowIndex: number,
    colIndex: number,
    photoSrcOverride = ''
  ) => {
    const isFilled = student[fieldDef.key] && String(student[fieldDef.key]).trim() !== '';
    const { selectionStyle, showTransparentInput } = getSelectionStyle(rowIndex, colIndex);

    const commonInputClass = `w-full px-2 py-1.5 text-sm rounded-lg transition-all relative z-10 ${
      showTransparentInput
        ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
        : `bg-transparent border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${
            !isFilled ? "bg-red-50/50 dark:bg-red-950/30 hover:bg-red-50/80 dark:hover:bg-red-950/50" : ""
          }`
    }`;

    const isNameField = fieldDef.key === "namaLengkap";
    const wrapperClassName = `px-2 py-2 border-b border-slate-200 dark:border-slate-700 relative cursor-default select-none ${
      isNameField
        ? 'lg:sticky lg:left-[50px] z-10 lg:z-20 bg-white dark:bg-slate-900 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] w-[135px] min-w-[135px] max-w-[165px] sm:w-auto sm:min-w-[200px] sm:max-w-[300px]'
        : ''
    } group-hover:bg-slate-50 dark:group-hover:bg-slate-800/70 group-focus-within:bg-slate-50 dark:group-focus-within:bg-slate-800/70`;

    const handleWrapperMouseDown = (e: React.MouseEvent<HTMLTableCellElement>) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'LABEL' || tag === 'IMG') return;
      if (e.button !== 0) return;
      handleMouseDownCell(e, rowIndex, colIndex);
    };

    if (fieldDef.type === 'select') {
      return (
        <td
          className={wrapperClassName}
          style={{ ...selectionStyle }}
          onMouseDown={handleWrapperMouseDown}
          onMouseEnter={() => handleMouseEnterCell(rowIndex, colIndex)}
        >
          <select
            id={`cell-${rowIndex}-${colIndex}`}
            name={fieldDef.key}
            value={student[fieldDef.key] || ''}
            onChange={(e) => handleInputChange(student.id, fieldDef.key, e.target.value)}
            onBlur={handleInputBlur}
            onFocus={() => handleFocusCell(rowIndex, colIndex)}
            onPaste={(e) => handlePaste(e, student.id, fieldDef.key)}
            className={`${commonInputClass} appearance-none cursor-pointer`}
            onMouseDown={(e) => {
              if (e.shiftKey) {
                e.preventDefault();
                handleMouseDownCell(e, rowIndex, colIndex);
              }
            }}
          >
            <option value="">-</option>
            {(fieldDef.options || []).map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (fieldDef.type === 'photo') {
      const resolvedPhotoSrc = photoSrcOverride || studentPhotoUrls?.[student.id] || student[fieldDef.key] || '';
      const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          if (props.showToast) props.showToast("File harus berupa gambar", "error");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          if (props.showToast) props.showToast("Ukuran foto terlalu besar. Maksimal 5MB.", "error");
          return;
        }

        try {
          const base64Data = await processImageWithWorker(file, 354, 472, 0.9);
          const blob = dataURLToBlob(base64Data);
          const blobUrl = await saveStudentPhotoBlob(String(student.id), blob);
          useStudentsStore.getState().setStudentPhotoUrl(String(student.id), blobUrl);
          if (student[fieldDef.key]) {
            const cleaned = (localStudents || []).map((s: any) => {
              if (s.id !== student.id) return s;
              const copy = { ...s };
              delete copy[fieldDef.key];
              return copy;
            });
            setLocalStudents(cleaned);
            onBulkSaveStudents(cleaned);
          }
          if (props.showToast) props.showToast("Foto berhasil diunggah", "success");
        } catch {
          if (props.showToast) props.showToast("Gagal memproses foto", "error");
        } finally {
          if (e.target) e.target.value = '';
        }
      };

      return (
        <td
          className={wrapperClassName}
          style={{ ...selectionStyle }}
          onMouseDown={handleWrapperMouseDown}
          onMouseEnter={() => handleMouseEnterCell(rowIndex, colIndex)}
        >
          <div className={`flex flex-col items-center min-w-[80px] ${showTransparentInput ? 'opacity-50' : 'opacity-100'}`}>
            <label className="cursor-pointer group relative overflow-hidden rounded border border-zinc-300 shadow-sm transition-all hover:border-indigo-400">
              {resolvedPhotoSrc ? (
                <img src={resolvedPhotoSrc} alt="Foto Siswa" className="w-12 h-16 object-cover" />
              ) : (
                <div className="w-12 h-16 bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs text-center p-1 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  3x4
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </td>
      );
    }

    return (
      <td
        className={wrapperClassName}
        style={{ ...selectionStyle }}
        onMouseDown={handleWrapperMouseDown}
        onMouseEnter={() => handleMouseEnterCell(rowIndex, colIndex)}
      >
        <input
          id={`cell-${rowIndex}-${colIndex}`}
          name={fieldDef.key}
          type="text"
          value={student[fieldDef.key] || ''}
          onChange={(e) => handleInputChange(student.id, fieldDef.key, e.target.value)}
          onBlur={handleInputBlur}
          onFocus={() => handleFocusCell(rowIndex, colIndex)}
          onPaste={(e) => handlePaste(e, student.id, fieldDef.key)}
          placeholder={fieldDef.placeholder || fieldDef.label}
          className={commonInputClass}
          onMouseDown={(e) => {
            if (e.shiftKey) {
              e.preventDefault();
              handleMouseDownCell(e, rowIndex, colIndex);
            }
          }}
        />
      </td>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <BulkAddRowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleBulkAdd}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0 mb-1 sm:mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Siswa</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Kelola data identitas siswa di kelas {namaKelas || '(Nama Kelas Belum Diatur)'}. Perubahan disimpan otomatis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <label className="cursor-pointer min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-700 rounded-lg shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center justify-center text-center">
            Upload Foto
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkPhotoUpload} />
          </label>
          <button
            type="button"
            onClick={handleAddNew}
            className="min-h-[44px] lg:min-h-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 inline-flex items-center justify-center cursor-pointer"
          >
            + Tambah Siswa Baru
          </button>
        </div>
      </div>

      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sticky top-0 z-20 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-9.5rem)] overflow-hidden"
        onMouseLeave={() => {
          if (isSelecting) setIsSelecting(false);
        }}
      >
        <div ref={scrollContainerRef} className="flex-1 overflow-auto select-none siswa-table-container">
          {localStudents.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-separate border-spacing-0">
              <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 shadow-sm z-30">
                <tr>
                  <th
                    scope="col"
                    className="w-[42px] min-w-[42px] max-w-[42px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] px-2 py-3 text-center border-b border-slate-200 dark:border-slate-700 sticky top-0 left-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] lg:shadow-none cursor-default select-none"
                    style={getSelectionStyle(-1, -1).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, -1);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, -1)}
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-4 py-3 text-left border-b border-slate-200 dark:border-slate-700 w-[135px] min-w-[135px] max-w-[165px] sm:w-auto sm:min-w-[200px] sm:max-w-[300px] sticky top-0 lg:left-[50px] z-30 lg:z-40 bg-slate-100 dark:bg-slate-800 shadow-none lg:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] cursor-default select-none"
                    style={getSelectionStyle(-1, 0).selectionStyle}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleMouseDownCell(e, -1, 0);
                    }}
                    onMouseEnter={() => handleMouseEnterCell(-1, 0)}
                  >
                    Nama Lengkap
                  </th>
                  {otherFields.map((field: any, index: number) => {
                    const colIndex = index + 1;
                    return (
                      <th
                        key={field.key}
                        scope="col"
                        className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-700 min-w-[155px] sm:min-w-[180px] whitespace-nowrap text-center sticky top-0 bg-slate-100 dark:bg-slate-800 z-30 cursor-default select-none"
                        style={getSelectionStyle(-1, colIndex).selectionStyle}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          handleMouseDownCell(e, -1, colIndex);
                        }}
                        onMouseEnter={() => handleMouseEnterCell(-1, colIndex)}
                      >
                        {field.label}
                      </th>
                    );
                  })}
                  <th
                    scope="col"
                    className="px-3 sm:px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700 min-w-[80px] sm:min-w-[100px] sticky top-0 bg-slate-100 dark:bg-slate-800 z-30"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {topSpacerHeight > 0 && (
                  <tr key="__top-spacer__" aria-hidden={true} className="pointer-events-none">
                    <td
                      colSpan={otherFields.length + 3}
                      style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
                {localStudents.slice(startIndex, endIndex + 1).map((student: any, sliceIdx: number) => {
                  const rowIndex = startIndex + sliceIdx;
                  return (
                    <tr
                      key={student.id}
                      id={student.id}
                      ref={(el) => measureRow(rowIndex, el)}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 focus-within:bg-slate-50 dark:focus-within:bg-slate-800/70 group"
                    >
                      <SiswaTableRow
                        student={student}
                        photoSrc={studentPhotoUrls?.[student.id] || student.foto || ''}
                        rowIndex={rowIndex}
                        otherFields={otherFields}
                        nameField={nameField}
                        selectionBounds={selectionBounds}
                        getSelectionStyle={getSelectionStyle}
                        handleMouseDownCell={handleMouseDownCell}
                        handleMouseEnterCell={handleMouseEnterCell}
                        handleMoveStudent={handleMoveStudent}
                        renderCellInput={renderCellInput}
                        handleDelete={handleDelete}
                        isLastRow={rowIndex === localStudents.length - 1}
                      />
                    </tr>
                  );
                })}
                {bottomSpacerHeight > 0 && (
                  <tr key="__bottom-spacer__" aria-hidden={true} className="pointer-events-none">
                    <td
                      colSpan={otherFields.length + 3}
                      style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  <td colSpan={otherFields.length + 3} className="p-0">
                    <EmptyState
                      title="Belum ada data siswa"
                      description="Mulai kelola data kelas dengan menambahkan siswa baru secara manual. Anda juga dapat mengimpor data sekaligus dari Excel yang sudah terisi melalui menu Data -> Import (jika tersedia)."
                      primaryActionLabel="+ Tambah Siswa Baru"
                      onPrimaryAction={handleAddNew}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSiswaPage;