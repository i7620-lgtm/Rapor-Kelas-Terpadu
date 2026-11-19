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
    compactLevel = 0,
}, ref) => {
    const gradeNumber = getGradeNumber(settings.nama_kelas);
    const phase = getPhase(gradeNumber);

    const mbClass = compactLevel === 2 ? 'mb-1' : compactLevel === 1 ? 'mb-2' : 'mb-4';
    const titleStyle = { fontSize: compactLevel === 2 ? '11pt' : compactLevel === 1 ? '11.5pt' : '12pt' };
    const tableMbClass = compactLevel === 2 ? 'mb-0.5' : compactLevel === 1 ? 'mb-1' : 'mb-2';
    const tableStyle: React.CSSProperties = {
        fontSize: compactLevel === 2 ? '10pt' : compactLevel === 1 ? '10.5pt' : '11pt',
        tableLayout: 'fixed',
    };
    const pyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[1px]' : 'py-0.5';
    const baseFontPt = compactLevel === 2 ? 10 : compactLevel === 1 ? 10.5 : 11;

    return (
        <div ref={ref}>
            <h2 className={`text-center font-bold ${mbClass}`} style={titleStyle}>
                LAPORAN HASIL BELAJAR
            </h2>
            <table className={`w-full ${tableMbClass}`} style={tableStyle}>
                <tbody>
                    <tr className="align-top">
                        <td className={pyClass} style={{ width: '15%' }}>Nama Murid</td>
                        <td className={`${pyClass} text-center`} style={{ width: '1%' }}>:</td>
                        <td className={`${pyClass} font-bold`} style={{ width: '45%', wordBreak: 'break-word' }}>
                            <EditableDescription
                                value={(student.namaLengkap || '').toUpperCase()}
                                onSave={(val) => onUpdateStudent(student.id, 'namaLengkap', val)}
                                placeholder="NAMA MURID"
                                className="font-bold uppercase"
                                style={{ fontSize: `${baseFontPt}pt` }}
                            />
                        </td>
                        <td className={`${pyClass} pl-6`} style={{ width: '19%' }}>Kelas</td>
                        <td className={`${pyClass} text-center`} style={{ width: '1%' }}>:</td>
                        <td className={pyClass} style={{ width: '19%', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <EditableDescription
                                value={settings.nama_kelas || ''}
                                onSave={(val) => onUpdateSettings('nama_kelas', val)}
                                placeholder="Kelas"
                                style={getDynamicStyle(settings.nama_kelas, baseFontPt, 9, [10, 12])}
                            />
                        </td>
                    </tr>
                    <tr className="align-top">
                        <td className={pyClass}>NISN/NIS</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ width: '45%' }}>
                            <div className="flex gap-1 items-center">
                                <EditableDescription
                                    value={student.nisn || '-'}
                                    onSave={(val) => onUpdateStudent(student.id, 'nisn', val)}
                                    placeholder="-"
                                />
                                <span>/</span>
                                <EditableDescription
                                    value={student.nis || '-'}
                                    onSave={(val) => onUpdateStudent(student.id, 'nis', val)}
                                    placeholder="-"
                                />
                            </div>
                        </td>
                        <td className={`${pyClass} pl-6`} style={{ width: '19%' }}>Fase</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{phase}</td>
                    </tr>
                    <tr className="align-top">
                        <td className={pyClass}>Nama Sekolah</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ width: '45%', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <EditableDescription
                                value={settings.nama_sekolah || ''}
                                onSave={(val) => onUpdateSettings('nama_sekolah', val)}
                                placeholder="Nama Sekolah"
                                style={getDynamicStyle(settings.nama_sekolah, baseFontPt, 9, [40, 50])}
                            />
                        </td>
                        <td className={`${pyClass} pl-6`} style={{ width: '19%' }}>Semester</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <EditableDescription
                                value={settings.semester || ''}
                                onSave={(val) => onUpdateSettings('semester', val)}
                                placeholder="Semester"
                            />
                        </td>
                    </tr>
                    <tr className="align-top">
                        <td className={pyClass}>Alamat Sekolah</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ width: '45%', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <EditableDescription
                                value={settings.alamat_sekolah || ''}
                                onSave={(val) => onUpdateSettings('alamat_sekolah', val)}
                                placeholder="Alamat"
                                style={getDynamicStyle(settings.alamat_sekolah, baseFontPt, 9, [45, 55])}
                            />
                        </td>
                        <td className={`${pyClass} pl-6`} style={{ width: '19%' }}>Tahun Pelajaran</td>
                        <td className={`${pyClass} text-center`}>:</td>
                        <td className={pyClass} style={{ width: '19%', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <EditableDescription
                                value={settings.tahun_ajaran || ''}
                                onSave={(val) => onUpdateSettings('tahun_ajaran', val)}
                                placeholder="TA"
                                style={{
                                    ...getDynamicStyle(settings.tahun_ajaran, baseFontPt, 9, [12, 15]),
                                    width: 'calc(100% - 5px)',
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});

ReportStudentInfo.displayName = 'ReportStudentInfo';
