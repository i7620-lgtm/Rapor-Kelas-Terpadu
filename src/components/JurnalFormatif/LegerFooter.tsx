import React from 'react';
import { getTanggalRaporValue, getContextualValue } from '../../constants';

export const LegerFooter = React.forwardRef(({ settings, isCompact, printOptions }, ref) => {
    const getTanggalRapor = () => {
        const rawTanggalRapor = getTanggalRaporValue(settings) || '';
        
        if (!rawTanggalRapor) {
            return `${settings.kota_kabupaten || '[Tempat]'}, _________________`;
        }
        const parts = rawTanggalRapor.split(',');
        return parts.length > 1
            ? `${parts[0]}, ${parts.slice(1).join(',').trim()}`
            : `${settings.kota_kabupaten || '[Tempat]'}, ${rawTanggalRapor}`;
    };

    return (
        <div ref={ref} className={`font-times w-full ${isCompact ? 'mt-0.5 text-xs' : 'mt-2 text-sm'}`}>
            <div className="pt-2 flex justify-between">
                <div className="text-center w-2/5 relative">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah,</p>
                    <div style={{ height: isCompact ? '1.8rem' : '3.5rem' }} className="flex justify-center items-center relative">
                        {settings.ttd_kepala_sekolah && printOptions?.showPrincipalSignature && (
                            <img
                                src={settings.ttd_kepala_sekolah}
                                alt="TTD Kepala Sekolah"
                                className={`object-contain absolute z-10 ${isCompact ? 'h-10' : 'h-16'}`}
                            />
                        )}
                    </div>
                    <p className="font-bold underline relative z-20">{getContextualValue(settings, 'nama_kepala_sekolah') || '____________________'}</p>
                    <p>{`${getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP'}. ${getContextualValue(settings, 'nip_kepala_sekolah') || '-'}`}</p>
                </div>
                <div className="text-center w-2/5 relative">
                    <p>{getTanggalRapor()}</p>
                    <p>Wali Kelas,</p>
                    <div style={{ height: isCompact ? '1.8rem' : '3.5rem' }} className="flex justify-center items-center relative">
                        {settings.ttd_wali_kelas && printOptions?.showTeacherSignature && (
                            <img
                                src={settings.ttd_wali_kelas}
                                alt="TTD Wali Kelas"
                                className={`object-contain absolute z-10 ${isCompact ? 'h-8' : 'h-14'}`}
                            />
                        )}
                    </div>
                    <p className="font-bold underline relative z-20">{getContextualValue(settings, 'nama_wali_kelas') || '____________________'}</p>
                    <p>{`${getContextualValue(settings, 'nip_label_wali_kelas') || 'NIP'}. ${getContextualValue(settings, 'nip_wali_kelas') || '-'}`}</p>
                </div>
            </div>
        </div>
    );
});

LegerFooter.displayName = 'LegerFooter';
