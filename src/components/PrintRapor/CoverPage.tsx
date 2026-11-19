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
                    const monthIndex = [
                        'januari',
                        'februari',
                        'maret',
                        'april',
                        'mei',
                        'juni',
                        'juli',
                        'agustus',
                        'september',
                        'oktober',
                        'november',
                        'desember',
                    ].indexOf(monthName.toLowerCase());

                    if (!isNaN(parseInt(yearPart, 10)) && monthIndex !== -1) {
                        const reportYear = parseInt(yearPart, 10);
                        if (monthIndex < 6) {
                            return `${reportYear - 1}/${reportYear}`;
                        }
                        return `${reportYear}/${reportYear + 1}`;
                    }
                }
            } catch {
                /* Fallback below */
            }
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

    return (
        <div
            className="flex flex-col items-center text-center p-8 box-border font-times"
            style={{
                position: 'absolute',
                top: '1.5cm',
                left: '1.5cm',
                right: '1.5cm',
                bottom: '1.5cm',
                border: '6px double #000',
            }}
        >
            <div className="w-full pt-16">
                <div className="flex justify-center mb-10">
                    {coverLogo && <img src={coverLogo} alt="Logo Cover Rapor" className="h-48 w-48 object-contain" />}
                </div>
                <h1 className="text-2xl font-bold tracking-widest">RAPOR</h1>
                <h2 className="text-2xl font-bold tracking-widest">MURID</h2>
                <h2 className="text-2xl font-bold tracking-widest">SEKOLAH DASAR</h2>
                <h2 className="text-2xl font-bold tracking-widest">(SD)</h2>

                <div className="mt-24 w-full px-8">
                    <p className="text-sm">Nama Murid:</p>
                    <div className="rounded-lg p-2 mt-2" style={{ border: '1.5pt solid black' }}>
                        <div className="text-2xl font-bold tracking-wider">
                            <EditableDescription
                                value={(student.namaLengkap || 'NAMA MURID').toUpperCase()}
                                onSave={(val) => onUpdateStudent(student.id, 'namaLengkap', val)}
                                placeholder="NAMA MURID"
                                className="text-center w-full"
                            />
                        </div>
                    </div>
                    <p className="text-sm mt-4">NISN/NIS:</p>
                    <div className="rounded-lg p-2 mt-2" style={{ border: '1.5pt solid black' }}>
                        <div className="text-2xl font-bold tracking-wider flex justify-center items-center gap-2 mx-auto max-w-full">
                            <EditableDescription
                                value={student.nisn || '-'}
                                onSave={(val) => onUpdateStudent(student.id, 'nisn', val)}
                                placeholder="NISN"
                                className="text-center min-w-0"
                            />
                            <span className="px-1 shrink-0">/</span>
                            <EditableDescription
                                value={student.nis || '-'}
                                onSave={(val) => onUpdateStudent(student.id, 'nis', val)}
                                placeholder="NIS"
                                className="text-center min-w-0"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-grow" />
            <div className="mb-8 space-y-2">
                <p className="text-xl font-bold tracking-wider">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</p>
                <p className="text-xl font-bold tracking-wider">REPUBLIK INDONESIA</p>
                <p className="text-xl font-bold tracking-wider">{year}</p>
            </div>
        </div>
    );
};
