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
}

export const AcademicTable = React.forwardRef<HTMLTableSectionElement, AcademicTableProps>(({ 
    subjectsToRender, 
    startingIndex = 1, 
    headerRef, 
    hideGradesForFaseA, 
    studentId, 
    onUpdateDescription, 
    compactLevel = 0 
}, ref) => {
    const tableStyle = { 
        fontSize: compactLevel === 2 ? '9pt' : compactLevel === 1 ? '9.5pt' : '10pt', 
        tableLayout: 'fixed' as const 
    };
    const pyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[0.5px]' : 'py-[1px]';
    const hrStyle = {
        border: 'none',
        borderTop: '1.5pt solid black',
        margin: compactLevel === 2 ? '0' : compactLevel === 1 ? '1px 0' : '2px 0'
    };

    const tableStyleMerged = {
        ...tableStyle,
        borderCollapse: 'collapse' as const,
        border: '1.5pt solid black'
    };

    return React.createElement('table', { className: 'w-full mt-1', style: tableStyleMerged },
        React.createElement('thead', { ref: headerRef as any, className: "report-header-group" },
            React.createElement('tr', { className: 'font-bold text-center' },
                React.createElement('td', { className: 'px-1 py-0 w-[5%]', style: { border: '1.5pt solid black' } }, 'No.'),
                React.createElement('td', { className: 'px-1 py-0 w-[20%]', style: { border: '1.5pt solid black' } }, 'Mata Pelajaran'),
                !hideGradesForFaseA && (
                    React.createElement('td', { className: 'px-1 py-0 w-[12%] whitespace-nowrap', style: { border: '1.5pt solid black' } }, 'Nilai Akhir')
                ),
                React.createElement('td', { className: 'px-1 py-0', style: { width: hideGradesForFaseA ? '75%' : '63%', border: '1.5pt solid black' } }, 'Capaian Kompetensi')
            )
        ),
        React.createElement('tbody', { ref: ref as any },
            subjectsToRender.map((item, index) => (
                React.createElement('tr', { key: item.id, id: `row-${studentId}-${item.id}` },
                    React.createElement('td', { className: `px-1 ${pyClass} text-center align-top`, style: { border: '1.5pt solid black' } }, startingIndex + index),
                    React.createElement('td', { className: `px-1 ${pyClass} align-top`, style: { border: '1.5pt solid black' } }, item.name),
                    !hideGradesForFaseA && (
                        React.createElement('td', { className: `px-1 ${pyClass} text-center align-top`, style: { border: '1.5pt solid black' } }, item.grade ?? '')
                    ),
                    React.createElement('td', { className: `px-1 ${pyClass} align-top leading-tight`, style: { border: '1.5pt solid black' } },
                        React.createElement(EditableDescription, { 
                            value: item.description.highest, 
                            onSave: (val) => onUpdateDescription && onUpdateDescription(studentId, item.id, 'highest', val, item.description),
                            placeholder: "Klik untuk edit deskripsi capaian tertinggi...",
                            multiline: true
                        }),
                        React.createElement(React.Fragment, null,
                            React.createElement('hr', { style: hrStyle }),
                            React.createElement(EditableDescription, { 
                                value: item.description.lowest, 
                                onSave: (val) => onUpdateDescription && onUpdateDescription(studentId, item.id, 'lowest', val, item.description),
                                placeholder: "Klik untuk edit deskripsi capaian terendah (opsional)...",
                                multiline: true
                            })
                        )
                    )
                )
            ))
        )
    );
});

AcademicTable.displayName = 'AcademicTable';
