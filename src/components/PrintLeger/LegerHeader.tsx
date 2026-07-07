import React from 'react';

export const LegerHeader = React.forwardRef(({ settings, isCompact }, ref) => (
    <div ref={ref} className={`font-times text-center ${isCompact ? 'mb-1' : 'mb-2'}`}>
        <h2 className={`font-bold uppercase ${isCompact ? 'text-xs mb-0.5' : 'text-sm mb-1'}`}>
            {`LEGER NILAI RAPOR MURID TAHUN PELAJARAN ${settings.tahun_ajaran || '[Tahun Ajaran]'} SEMESTER ${settings.semester || '[Semester]'}`}
        </h2>
        <h2 className={`font-bold uppercase ${isCompact ? 'text-xs mb-0.5' : 'text-sm mb-1'}`}>
            {(settings.nama_sekolah || '[Nama Sekolah]')}
        </h2>
        <h2 className={`font-bold uppercase ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {`KELAS: ${(settings.nama_kelas || '[Nama Kelas]')}`}
        </h2>
    </div>
));

LegerHeader.displayName = 'LegerHeader';
