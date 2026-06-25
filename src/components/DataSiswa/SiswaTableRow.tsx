import React from 'react';

interface SiswaTableRowProps {
    student: any;
    rowIndex: number;
    otherFields: any[];
    nameField: any;
    getSelectionStyle: (r: number, c: number) => any;
    handleMouseDownCell: (e: any, r: number, c: number) => void;
    handleMouseEnterCell: (r: number, c: number) => void;
    handleMoveStudent: (idx: number, dir: number) => void;
    renderCellInput: (student: any, fieldDef: any, rowIndex: number, colIndex: number) => React.ReactNode;
    handleDelete: (id: string) => void;
    isLastRow: boolean;
}

export const SiswaTableRow = React.memo(({
    student,
    rowIndex,
    otherFields,
    nameField,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
    handleMoveStudent,
    renderCellInput,
    handleDelete,
    isLastRow
}: SiswaTableRowProps) => {

    const rowContents = (
        <>
            {/* No Column -> colIndex: -1 */}
            <td 
                id={`cell-${rowIndex}--1`}
                tabIndex={-1}
                className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-2 text-center border-b border-zinc-200/60 sticky left-0 z-20 bg-white relative cursor-default select-none"
                style={getSelectionStyle(rowIndex, -1).selectionStyle}
                onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    handleMouseDownCell(e, rowIndex, -1);
                }}
                onMouseEnter={() => handleMouseEnterCell(rowIndex, -1)}
            > 
                <div className="flex flex-col items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleMoveStudent(rowIndex, -1); }}
                        disabled={rowIndex === 0}
                        className={`p-0.5 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${rowIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                        title="Pindah ke atas"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <span className="text-xs font-semibold text-zinc-700 leading-none my-0.5">{rowIndex + 1}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleMoveStudent(rowIndex, 1); }}
                        disabled={isLastRow}
                        className={`p-0.5 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${isLastRow ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                        title="Pindah ke bawah"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </td>
            {/* Name Column -> colIndex: 0 */}
            {renderCellInput(student, nameField, rowIndex, 0)}
            {/* Other Fields Columns -> colIndex: 1 to N */}
            {otherFields.map((field, colIndexOffset) => {
                const cell = renderCellInput(student, field, rowIndex, colIndexOffset + 1);
                return React.cloneElement(cell as React.ReactElement, { key: field.key });
            })}
            {/* Action Column -> Skipped grid selection as it's not a data field */}
            <td className="px-4 py-2 text-center border-b border-zinc-200/60">
                <button
                    onClick={() => handleDelete(student.id)}
                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                    title={`Hapus ${student.namaLengkap}`}
                > 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </>
    );

    return rowContents;
}, (prev, next) => {
    if (prev.student.id !== next.student.id) return false;
    if (prev.rowIndex !== next.rowIndex) return false;
    if (prev.isLastRow !== next.isLastRow) return false;

    if (JSON.stringify(prev.student) !== JSON.stringify(next.student)) return false;

    const maxCols = prev.otherFields.length + 1;
    for (let c = -1; c <= maxCols; c++) {
        const prevStyle = prev.getSelectionStyle(prev.rowIndex, c);
        const nextStyle = next.getSelectionStyle(next.rowIndex, c);
        if (
            prevStyle.isCellSelected !== nextStyle.isCellSelected ||
            prevStyle.showTransparentInput !== nextStyle.showTransparentInput ||
            prevStyle.selectionStyle?.backgroundColor !== nextStyle.selectionStyle?.backgroundColor ||
            prevStyle.selectionStyle?.boxShadow !== nextStyle.selectionStyle?.boxShadow
        ) {
            return false;
        }
    }
    return true;
});
