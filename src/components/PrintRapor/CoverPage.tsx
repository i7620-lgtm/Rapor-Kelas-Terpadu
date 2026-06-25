import React, { useMemo } from 'react';
import { getTanggalRaporValue } from '../../constants';
import { EditableDescription } from './EditableDescription';

interface CoverPageProps {
    student: any;
    settings: any;
    onUpdateStudent: (id: string, field: string, val: string) => void;
}

export const CoverPage: React.FC<CoverPageProps> = ({ student, settings, onUpdateStudent }) => {
    const tanggalRapor = getTanggalRaporValue(settings);

    const year = useMemo(() => {
        if (tanggalRapor) {
            try {
                const parts = tanggalRapor.split(' ');
                if (parts.length >= 3) {
                    const yearPart = parts[parts.length - 1];
                    const monthName = parts[parts.length - 2];
                    const monthIndex = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].indexOf(monthName.toLowerCase());

                    if (!isNaN(parseInt(yearPart, 10)) && monthIndex !== -1) {
                        const reportYear = parseInt(yearPart, 10);
                        if (monthIndex < 6) {
                            return `${reportYear - 1}/${reportYear}`;
                        }
                        return `${reportYear}/${reportYear + 1}`;
                    }
                }
            } catch { /* Fallback below */ }
        }
        if (settings.tahun_ajaran) {
            return settings.tahun_ajaran;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        if (currentMonth < 6) {
             return `${currentYear - 1}/${currentYear}`;
        }
        return `${currentYear}/${currentYear + 1}`;
    }, [tanggalRapor, settings.tahun_ajaran]);

    const coverLogo = settings.logo_cover || '';

    return React.createElement('div', {
        className: 'flex flex-col items-center text-center p-8 box-border font-times',
        style: {
            position: 'absolute',
            top: '1.5cm',
            left: '1.5cm',
            right: '1.5cm',
            bottom: '1.5cm',
            border: '6px double #000'
        }
    },
        React.createElement('div', { className: 'w-full pt-16' },
            React.createElement('div', { className: 'flex justify-center mb-10' },
                coverLogo && React.createElement('img', { 
                    src: coverLogo,
                    alt: "Logo Cover Rapor",
                    className: 'h-48 w-48 object-contain'
                })
            ),
            React.createElement('h1', { className: 'text-2xl font-bold tracking-widest' }, 'RAPOR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'MURID'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'SEKOLAH DASAR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, '(SD)'),

            React.createElement('div', { className: 'mt-24 w-full px-8' },
                React.createElement('p', { className: 'text-sm' }, 'Nama Murid:'),
                React.createElement('div', { className: 'rounded-lg p-2 mt-2', style: { border: '1.5pt solid black' } },
                    React.createElement('div', { className: 'text-2xl font-bold tracking-wider' },
                        React.createElement(EditableDescription, {
                            value: (student.namaLengkap || 'NAMA MURID').toUpperCase(),
                            onSave: (val) => onUpdateStudent(student.id, 'namaLengkap', val),
                            placeholder: "NAMA MURID",
                            className: "text-center w-full"
                        })
                    )
                ),
                React.createElement('p', { className: 'text-sm mt-4' }, 'NISN/NIS:'),
                React.createElement('div', { className: 'rounded-lg p-2 mt-2', style: { border: '1.5pt solid black' } },
                    React.createElement('div', { className: 'text-2xl font-bold tracking-wider flex justify-center items-center gap-2 mx-auto max-w-full' },
                        React.createElement(EditableDescription, { value: student.nisn || '-', onSave: (val) => onUpdateStudent(student.id, 'nisn', val), placeholder: "NISN", className: "text-center min-w-0" }),
                        React.createElement('span', { className: 'px-1 shrink-0' }, '/'),
                        React.createElement(EditableDescription, { value: student.nis || '-', onSave: (val) => onUpdateStudent(student.id, 'nis', val), placeholder: "NIS", className: "text-center min-w-0" })
                    )
                )
            )
        ),
        React.createElement('div', { className: 'flex-grow' }),
        React.createElement('div', { className: 'mb-8 space-y-2' },
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'REPUBLIK INDONESIA'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, year)
        )
    );
};
