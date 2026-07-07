import React from 'react';
import { getGradeNumber } from '../../utils/nilaiHelpers';
import { getPhase, getDynamicStyle } from './raporUtils';
import { EditableDescription } from './EditableDescription';

interface ReportStudentInfoProps {
    student: any;
    settings: any;
    onUpdateStudent: (id: string, field: string, val: string) => void;
    onUpdateSettings: (key: string, val: any) => void;
    compactLevel?: number;
}

export const ReportStudentInfo = React.forwardRef<HTMLDivElement, ReportStudentInfoProps>(({ 
    student, 
    settings, 
    onUpdateStudent, 
    onUpdateSettings, 
    compactLevel = 0 
}, ref) => {
    const gradeNumber = getGradeNumber(settings.nama_kelas);
    const phase = getPhase(gradeNumber);
    
    const mbClass = compactLevel === 2 ? 'mb-1' : compactLevel === 1 ? 'mb-2' : 'mb-4';
    const titleStyle = { fontSize: compactLevel === 2 ? '11pt' : compactLevel === 1 ? '11.5pt' : '12pt' };
    const tableMbClass = compactLevel === 2 ? 'mb-0.5' : compactLevel === 1 ? 'mb-1' : 'mb-2';
    const tableStyle = { fontSize: compactLevel === 2 ? '10pt' : compactLevel === 1 ? '10.5pt' : '11pt', tableLayout: 'fixed' as const };
    const pyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[1px]' : 'py-0.5';
    
    return React.createElement('div', { ref: ref },
        React.createElement('h2', { className: `text-center font-bold ${mbClass}`, style: titleStyle }, 'LAPORAN HASIL BELAJAR'),
        React.createElement('table', { className: `w-full ${tableMbClass}`, style: tableStyle },
            React.createElement('tbody', null,
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: pyClass, style: { width: '15%' } }, 'Nama Murid'),
                    React.createElement('td', { className: `${pyClass} text-center`, style: { width: '1%' } }, ':'),
                    React.createElement('td', { className: `${pyClass} font-bold`, style: { width: '45%', wordBreak: 'break-word' } },
                        React.createElement(EditableDescription, {
                            value: (student.namaLengkap || '').toUpperCase(),
                            onSave: (val) => onUpdateStudent(student.id, 'namaLengkap', val),
                            placeholder: "NAMA MURID",
                            className: "font-bold uppercase",
                            style: { fontSize: compactLevel === 2 ? '10pt' : compactLevel === 1 ? '10.5pt' : '11pt' }
                        })
                    ),
                    React.createElement('td', { className: `${pyClass} pl-6`, style: { width: '19%' } }, 'Kelas'),
                    React.createElement('td', { className: `${pyClass} text-center`, style: { width: '1%' } }, ':'),
                    React.createElement('td', { className: pyClass, style: { width: '19%', whiteSpace: 'nowrap', overflow: 'hidden' } },
                        React.createElement(EditableDescription, {
                            value: settings.nama_kelas || '',
                            onSave: (val) => onUpdateSettings('nama_kelas', val),
                            placeholder: "Kelas",
                            style: getDynamicStyle(settings.nama_kelas, compactLevel === 2 ? 10 : compactLevel === 1 ? 10.5 : 11, 9, [10, 12])
                        })
                    )
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: pyClass }, 'NISN/NIS'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: `${pyClass}`, style: { width: '45%' } },
                        React.createElement('div', { className: 'flex gap-1 items-center' },
                            React.createElement(EditableDescription, { value: student.nisn || '-', onSave: (val) => onUpdateStudent(student.id, 'nisn', val), placeholder: "-" }),
                            React.createElement('span', null, '/'),
                            React.createElement(EditableDescription, { value: student.nis || '-', onSave: (val) => onUpdateStudent(student.id, 'nis', val), placeholder: "-" })
                        )
                    ),
                    React.createElement('td', { className: `${pyClass} pl-6`, style: { width: '19%' } }, 'Fase'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: pyClass, style: { whiteSpace: 'nowrap', overflow: 'hidden' } }, phase)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: pyClass }, 'Nama Sekolah'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: `${pyClass}`, style: { width: '45%', whiteSpace: 'nowrap', overflow: 'hidden' } },
                        React.createElement(EditableDescription, {
                            value: settings.nama_sekolah || '',
                            onSave: (val) => onUpdateSettings('nama_sekolah', val),
                            placeholder: "Nama Sekolah",
                            style: getDynamicStyle(settings.nama_sekolah, compactLevel === 2 ? 10 : compactLevel === 1 ? 10.5 : 11, 9, [40, 50])
                        })
                    ),
                    React.createElement('td', { className: `${pyClass} pl-6`, style: { width: '19%' } }, 'Semester'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: pyClass, style: { whiteSpace: 'nowrap', overflow: 'hidden' } },
                        React.createElement(EditableDescription, { value: settings.semester || '', onSave: (val) => onUpdateSettings('semester', val), placeholder: "Semester" })
                    )
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: pyClass }, 'Alamat Sekolah'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: `${pyClass}`, style: { width: '45%', whiteSpace: 'nowrap', overflow: 'hidden' } },
                        React.createElement(EditableDescription, {
                            value: settings.alamat_sekolah || '',
                            onSave: (val) => onUpdateSettings('alamat_sekolah', val),
                            placeholder: "Alamat",
                            style: getDynamicStyle(settings.alamat_sekolah, compactLevel === 2 ? 10 : compactLevel === 1 ? 10.5 : 11, 9, [45, 55])
                        })
                    ),
                    React.createElement('td', { className: `${pyClass} pl-6`, style: { width: '19%' } }, 'Tahun Pelajaran'),
                    React.createElement('td', { className: `${pyClass} text-center` }, ':'),
                    React.createElement('td', { className: pyClass, style: { width: '19%', whiteSpace: 'nowrap', overflow: 'hidden' } },
                        React.createElement(EditableDescription, {
                            value: settings.tahun_ajaran || '',
                            onSave: (val) => onUpdateSettings('tahun_ajaran', val),
                            placeholder: "TA",
                            style: { ...getDynamicStyle(settings.tahun_ajaran, compactLevel === 2 ? 10 : compactLevel === 1 ? 10.5 : 11, 9, [12, 15]), width: 'calc(100% - 5px)' }
                        })
                    )
                )
            )
        )
    );
});

ReportStudentInfo.displayName = 'ReportStudentInfo';
