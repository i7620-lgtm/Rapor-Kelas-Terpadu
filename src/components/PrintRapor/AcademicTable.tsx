import React from 'react';
import { EditableDescription } from './EditableDescription';

interface AcademicTableProps {
    subjectsToRender: any[];
    startingIndex?: number;
    headerRef?: React.RefObject<HTMLTableSectionElement | null>;
    hideGradesForFaseA: boolean;
    studentId: string;
    onUpdateDescription: (studentId: string, subjectId: string, type: 'highest' | 'lowest', val: string, currentDesc: any) => void;
    compactLevel?: number;
    kkm?: number;
}

export const AcademicTable = React.forwardRef<HTMLTableSectionElement, AcademicTableProps>(({
    subjectsToRender,
    startingIndex = 1,
    headerRef,
    hideGradesForFaseA,
    studentId,
    onUpdateDescription,
    compactLevel = 0,
    kkm,
}, ref) => {
    const tableStyle: React.CSSProperties = {
        fontSize: compactLevel === 2 ? '9pt' : compactLevel === 1 ? '9.5pt' : '10pt',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        border: '1.5pt solid black',
    };
    const pyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[0.5px]' : 'py-[1px]';
    const hrStyle: React.CSSProperties = {
        border: 'none',
        borderTop: '1.5pt solid black',
        margin: compactLevel === 2 ? '0' : compactLevel === 1 ? '1px 0' : '2px 0',
    };
    const cellBorderStyle: React.CSSProperties = { border: '1.5pt solid black' };

    return (
        <table className="w-full mt-1" style={tableStyle}>
            <thead ref={headerRef} className="report-header-group">
                <tr className="font-bold text-center">
                    <td className="px-1 py-0 w-[5%]" style={cellBorderStyle}>No.</td>
                    <td className="px-1 py-0 w-[20%]" style={cellBorderStyle}>Mata Pelajaran</td>
                    {!hideGradesForFaseA && (
                        <td className="px-1 py-0 w-[12%] whitespace-nowrap" style={cellBorderStyle}>Nilai Akhir</td>
                    )}
                    <td
                        className="px-1 py-0"
                        style={{ width: hideGradesForFaseA ? '75%' : '63%', ...cellBorderStyle }}
                    >
                        Capaian Kompetensi
                    </td>
                </tr>
            </thead>
            <tbody ref={ref}>
                {subjectsToRender.map((item, index) => {
                    const isMissing = item.grade === undefined || item.grade === null || item.grade === '';
                    const numGrade = typeof item.grade === 'number' ? item.grade : parseFloat(item.grade);
                    const isBelowKkm = !isMissing && !isNaN(numGrade) && kkm != null && !isNaN(kkm) && numGrade < kkm;

                    return (
                        <tr key={item.id} id={`row-${studentId}-${item.id}`}>
                            <td className={`px-1 ${pyClass} text-center align-top`} style={cellBorderStyle}>
                                {startingIndex + index}
                            </td>
                            <td className={`px-1 ${pyClass} align-top`} style={cellBorderStyle}>
                                {item.name}
                            </td>
                            {!hideGradesForFaseA && (
                                <td
                                    className={`px-1 ${pyClass} text-center align-top ${
                                        isMissing
                                            ? 'text-red-500 font-bold bg-red-50/40 print:text-black print:bg-transparent'
                                            : isBelowKkm
                                              ? 'text-red-600 font-bold bg-rose-50/50 print:text-black print:bg-transparent'
                                              : ''
                                    }`}
                                    style={cellBorderStyle}
                                >
                                    {item.grade ?? '-'}
                                </td>
                            )}
                            <td className={`px-1 ${pyClass} align-top leading-tight`} style={cellBorderStyle}>
                                <EditableDescription
                                    value={item.description.highest}
                                    onSave={(val) => onUpdateDescription && onUpdateDescription(studentId, item.id, 'highest', val, item.description)}
                                    placeholder="Klik untuk edit deskripsi capaian tertinggi..."
                                    multiline={true}
                                />
                                <hr style={hrStyle} />
                                <EditableDescription
                                    value={item.description.lowest}
                                    onSave={(val) => onUpdateDescription && onUpdateDescription(studentId, item.id, 'lowest', val, item.description)}
                                    placeholder="Klik untuk edit deskripsi capaian terendah (opsional)..."
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
});

AcademicTable.displayName = 'AcademicTable';
