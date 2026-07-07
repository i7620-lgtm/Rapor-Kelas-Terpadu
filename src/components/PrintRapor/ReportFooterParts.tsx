import React from 'react';
import { EditableDescription } from './EditableDescription';
import { getGradeNumber } from '../../utils/nilaiHelpers';
import { getContextualValue, getContextualKey, getTanggalRaporKey } from '../../constants';

export const DecisionSection = ({
    settings,
    nickname,
    paddingClass,
    fontSizeClass,
}: any) => {
    const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
    if (!isSemesterGenap) return null;

    const gradeLevel = getGradeNumber(settings.nama_kelas);
    let promotionText;
    if (gradeLevel === 6) {
        promotionText = 'LULUS';
    } else {
        const nextGrade = gradeLevel ? gradeLevel + 1 : '';
        const nextGradeRoman = {1: 'II', 2: 'III', 3: 'IV', 4: 'V', 5: 'VI'}[Number(nextGrade) - 1] || '';
        promotionText = `Naik ke Kelas ${nextGrade} (${nextGradeRoman})`;
    }
    
    return (
        <div className={paddingClass} style={{ fontSize: fontSizeClass, border: '1.5pt solid black' }}>
            <div className="font-bold text-center py-0.5" style={{ borderBottom: '1.5pt solid black' }}>
                {`Berdasarkan hasil belajar yang dicapai, ${nickname} dinyatakan:`}
            </div>
            <div className="font-bold mt-0.5 text-center py-0.5">
                <EditableDescription 
                    value={promotionText} 
                    onSave={() => {}} 
                    placeholder={promotionText} 
                    className="text-center justify-center font-bold" 
                />
            </div>
        </div>
    );
};

export const CocurricularSection = ({
    cocurricularRef,
    paddingClass,
    fontSizeClass,
    cocurricularDescription,
    studentId,
    onUpdateCocurricularManual
}: any) => (
    <div ref={cocurricularRef} className={paddingClass} style={{ fontSize: fontSizeClass, border: '1.5pt solid black' }}>
        <div className="font-bold mb-1">Kokurikuler</div>
        <div className="min-h-[1.5rem]">
            <EditableDescription
                value={cocurricularDescription}
                onSave={(val) => onUpdateCocurricularManual(studentId, val)}
                placeholder="Deskripsi kokurikuler..."
                multiline={true}
            />
        </div>
    </div>
);

export const ExtracurricularSection = ({
    extraRef,
    extraFontSizeClass,
    extraPyClass,
    extraActivities,
    studentId,
    onUpdateExtraDescription
}: any) => (
    <div ref={extraRef}>
        <table className="w-full border-collapse" style={{ fontSize: extraFontSizeClass, tableLayout: 'fixed', border: '1.5pt solid black' }}>
            <thead>
                <tr className="font-bold text-center">
                    <td className={`px-2 ${extraPyClass} w-[5%]`} style={{ border: '1.5pt solid black' }}>No.</td>
                    <td className={`px-2 ${extraPyClass} w-[32%]`} style={{ border: '1.5pt solid black' }}>Ekstrakurikuler</td>
                    <td className={`px-2 ${extraPyClass} w-[63%]`} style={{ border: '1.5pt solid black' }}>Keterangan</td>
                </tr>
            </thead>
            <tbody>
                {extraActivities.map((item: any, index: number) => (
                    <tr key={index} className="align-top" id={`row-extra-${studentId}-${index}`}>
                        <td className={`px-2 ${extraPyClass} text-center`} style={{ border: '1.5pt solid black' }}>{index + 1}</td>
                        <td className={`px-2 ${extraPyClass}`} style={{ border: '1.5pt solid black' }}>{item.name}</td>
                        <td className={`px-2 ${extraPyClass}`} style={{ border: '1.5pt solid black' }}>
                            <EditableDescription
                                value={item.description}
                                onSave={(val) => onUpdateExtraDescription(studentId, item.id, val)}
                                placeholder="Keterangan..."
                                multiline={true}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const SignaturesSection = ({
    signaturesRef,
    sigFontSizeClass,
    sigWrapperHeight,
    waliImgHeight,
    tanggalRaporValue,
    settings,
    printOptions,
    onUpdateSettings
}: any) => (
    <div ref={signaturesRef} className={`flex justify-between`} style={{ fontSize: sigFontSizeClass }}>
        <div className="text-center">
            <div>Mengetahui:</div>
            <div>Orang Tua/Wali,</div>
            <div className={sigWrapperHeight}></div>
            <div>.........................</div>
        </div>
        <div className="text-center relative">
            <EditableDescription 
                value={tanggalRaporValue} 
                onSave={(val: string) => onUpdateSettings(getTanggalRaporKey(settings), val)} 
                placeholder="Tempat, Tanggal"
                className="text-center justify-center"
            />
            <div>Wali Kelas,</div>
            <div className={`${sigWrapperHeight} w-full flex items-center justify-center relative`}>
                {settings.ttd_wali_kelas && printOptions?.showTeacherSignature && (
                    <img src={settings.ttd_wali_kelas} alt="TTD Wali Kelas" className={`${waliImgHeight} object-contain absolute z-10 p-2`} />
                )}
            </div>
            <div className="font-bold underline relative z-20">
                <EditableDescription 
                    value={getContextualValue(settings, 'nama_wali_kelas') || '_________________'} 
                    onSave={(val: string) => onUpdateSettings(getContextualKey(settings, 'nama_wali_kelas'), val)} 
                    placeholder="Nama Wali Kelas"
                    className="text-center justify-center font-bold"
                />
            </div>
            <div className="flex justify-center gap-1">
                {`${getContextualValue(settings, 'nip_label_wali_kelas') || 'NIP'}.`}
                <EditableDescription 
                    value={getContextualValue(settings, 'nip_wali_kelas') || '-'} 
                    onSave={(val: string) => onUpdateSettings(getContextualKey(settings, 'nip_wali_kelas'), val)} 
                    placeholder="-" 
                />
            </div>
        </div>
    </div>
);

export const HeadmasterSignatureSection = ({
    headmasterRef,
    sigFontSizeClass,
    sigWrapperHeight,
    kepsekImgHeight,
    settings,
    printOptions,
    onUpdateSettings
}: any) => (
    <div ref={headmasterRef} className={`flex justify-center text-center`} style={{ fontSize: sigFontSizeClass }}>
        <div className="relative">
            <div>Mengetahui,</div>
            <div>Kepala Sekolah,</div>
            <div className={`${sigWrapperHeight} w-full flex items-center justify-center relative`}>
                {settings.ttd_kepala_sekolah && printOptions?.showPrincipalSignature && (
                    <img src={settings.ttd_kepala_sekolah} alt="TTD Kepala Sekolah" className={`${kepsekImgHeight} object-contain absolute z-10 p-2`} />
                )}
            </div>
            <div className="font-bold underline relative z-20">
                <EditableDescription 
                    value={getContextualValue(settings, 'nama_kepala_sekolah') || '_________________'} 
                    onSave={(val: string) => onUpdateSettings(getContextualKey(settings, 'nama_kepala_sekolah'), val)} 
                    placeholder="Nama Kepala Sekolah"
                    className="text-center justify-center font-bold"
                />
            </div>
            <div className="flex justify-center gap-1">
                {`${getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP'}.`}
                <EditableDescription 
                    value={getContextualValue(settings, 'nip_kepala_sekolah') || '-'} 
                    onSave={(val: string) => onUpdateSettings(getContextualKey(settings, 'nip_kepala_sekolah'), val)} 
                    placeholder="-" 
                />
            </div>
        </div>
    </div>
);

export const AttendanceAndNotesSection = ({
    attendanceAndNotesRef,
    attAndNotesGap,
    showAttendance,
    showNotes,
    fontSizeClass,
    attendanceW,
    extraPyClass,
    sakitCount,
    izinCount,
    alpaCount,
    studentId,
    attRowPadding,
    attendanceLabelW,
    onUpdateAttendance,
    paddingClass,
    notesMinHeight,
    studentNoteContent
}: any) => (
    <div ref={attendanceAndNotesRef} className={`w-full flex ${attAndNotesGap} items-stretch`}>
        {showAttendance && (
            <div className="flex flex-col flex-shrink-0" style={{ fontSize: fontSizeClass, width: attendanceW, border: '1.5pt solid black' }}>
                <div className={`font-bold px-2 ${extraPyClass} text-center`} style={{ borderBottom: '1.5pt solid black' }}>Ketidakhadiran</div>
                <div className="flex-grow flex flex-col justify-around">
                    {['Sakit', 'Izin', 'Tanpa Keterangan'].map((item, index, arr) => {
                        const typeKey = item === 'Sakit' ? 'sakit' : item === 'Izin' ? 'izin' : 'alpa';
                        const value = item === 'Sakit' ? sakitCount : item === 'Izin' ? izinCount : alpaCount;
                        return (
                            <div 
                                key={item} 
                                id={`row-attendance-${studentId}-${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className={`flex items-center px-2 ${attRowPadding} flex-1`}
                                style={index < arr.length - 1 ? { borderBottom: '1.5pt solid black' } : undefined}
                            >
                                <span className="whitespace-nowrap" style={{ width: attendanceLabelW }}>{item}</span>
                                <span className="px-1">:</span>
                                <div className="flex-1 text-left flex gap-1 items-center">
                                    <EditableDescription
                                        value={value}
                                        onSave={(val: string) => onUpdateAttendance(studentId, typeKey, val)}
                                        placeholder="0"
                                        className="w-8 text-center"
                                    />
                                    <span>hari</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        {showNotes && (
            <div className={`${paddingClass} flex-grow flex-1`} style={{ fontSize: fontSizeClass, border: '1.5pt solid black' }}>
                <div className="font-bold mb-1">Catatan Wali Kelas</div>
                <div style={{ minHeight: notesMinHeight }}>{studentNoteContent}</div>
            </div>
        )}
    </div>
);
