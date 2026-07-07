import React, { useMemo } from 'react';
import { COCURRICULAR_DIMENSIONS, getTanggalRaporValue } from '../../constants';
import { capitalize } from './raporUtils';
import { EditableDescription } from './EditableDescription';
import { DecisionSection, CocurricularSection, ExtracurricularSection, SignaturesSection, HeadmasterSignatureSection, AttendanceAndNotesSection } from "./ReportFooterParts";

interface ReportFooterContentProps {
    student: any;
    settings: any;
    attendance: any[];
    notes: Record<string, string>;
    studentExtracurriculars: any[];
    extracurriculars: any[];
    cocurricularData: Record<string, any>;
    rank?: number | null;
    rankingOption?: string;
    showCocurricular?: boolean;
    showExtra?: boolean;
    showNotes?: boolean;
    showAttendance?: boolean;
    showDecision?: boolean;
    showParentFeedback?: boolean;
    showParentTeacherSignature?: boolean;
    showHeadmasterSignature?: boolean;
    printOptions?: any;
    onUpdateNote: (studentId: string, val: string) => void;
    onUpdateAttendance: (studentId: string, typeKey: string, val: string) => void;
    onUpdateExtraDescription: (studentId: string, extraId: string, val: string) => void;
    onUpdateCocurricularManual: (studentId: string, val: string) => void;
    onUpdateSettings: (key: string, val: any) => void;
    compactLevel?: number;
}

export const ReportFooterContent = React.forwardRef<any, ReportFooterContentProps>((props, ref) => {
    const { 
        student, settings, attendance, notes, studentExtracurriculars, extracurriculars, cocurricularData,
        rank, rankingOption,
        showCocurricular, showExtra, showNotes, showAttendance, showDecision, 
        showParentFeedback, showParentTeacherSignature, showHeadmasterSignature,
        printOptions,
        onUpdateNote, onUpdateAttendance, onUpdateExtraDescription, onUpdateCocurricularManual, onUpdateSettings,
        compactLevel = 0
    } = props;

    const { cocurricularRef, extraRef, attendanceAndNotesRef, decisionRef, parentFeedbackRef, signaturesRef, headmasterRef } = (ref as any) || {};

    const shouldDisplayRank = rank && rankingOption !== 'none' && (
        (rankingOption === 'top3' && rank <= 3) ||
        (rankingOption === 'top10' && rank <= 10)
    );
    
    const nickname = capitalize(student.namaPanggilan || (student.namaLengkap || '').split(' ')[0]);
    const currentSemester = settings.semester || 'Ganjil';
    const tanggalRaporValue = getTanggalRaporValue(settings) || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`;

    const originalNoteKey = currentSemester === 'Genap' ? student.id + '_Genap' : student.id;
    const originalNote = notes[originalNoteKey] || '';
    
    let studentNoteContent;
    if (shouldDisplayRank) {
        let cleanNote = originalNote.trim();
        const autoMsgPattern = new RegExp(`Selamat!.*Peringkat \\d+ di kelas\\.?\\s*`, 'i');
        cleanNote = cleanNote.replace(autoMsgPattern, '').trim();

        studentNoteContent = (
            <>
                <span>{`Selamat! ${nickname} berhasil meraih `}</span>
                <strong>{`Peringkat ${rank}`}</strong>
                <span>{` di kelas. `}</span>
                <EditableDescription 
                    value={cleanNote} 
                    onSave={(val) => onUpdateNote(student.id, val)} 
                    placeholder="Tulis catatan..." 
                    multiline={true}
                    className="inline"
                />
            </>
        );
    } else {
        studentNoteContent = (
            <EditableDescription 
                value={originalNote} 
                onSave={(val) => onUpdateNote(student.id, val)} 
                placeholder="Tidak ada catatan." 
                multiline={true} 
            />
        );
    }

    const attendanceData = attendance.find(a => a.studentId === student.id && (a.semester || 'Ganjil') === currentSemester) || { sakit: null, izin: null, alpa: null };
    const sakitCount = (attendanceData.sakit === null || attendanceData.sakit === undefined || attendanceData.sakit === '') ? 0 : attendanceData.sakit;
    const izinCount = (attendanceData.izin === null || attendanceData.izin === undefined || attendanceData.izin === '') ? 0 : attendanceData.izin;
    const alpaCount = (attendanceData.alpa === null || attendanceData.alpa === undefined || attendanceData.alpa === '') ? 0 : attendanceData.alpa;

    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id && (se.semester || 'Ganjil') === currentSemester);
    
    const extraActivities = (studentExtraData?.assignedActivities || [])
        .map((activityId: string) => {
            if (!activityId) return null;
            const activity = extracurriculars.find(e => e.id === activityId);
            const description = studentExtraData.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.';
            return { id: activityId, name: activity?.name, description };
        }).filter(Boolean);
        
    const cocurricularDescription = useMemo(() => {
        const studentCoData = cocurricularData?.[student.id];
        const fieldName = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
        
        let manualContent = studentCoData?.[fieldName]?.manualDescription;
        if (!manualContent && currentSemester === 'Ganjil' && studentCoData?.manualDescription) {
             manualContent = studentCoData.manualDescription;
        }

        if (manualContent) return manualContent;

        const theme = currentSemester === 'Genap' ? settings.cocurricular_theme_Genap : settings.cocurricular_theme;
        const ratings = (studentCoData && typeof studentCoData[fieldName] === 'object' && studentCoData[fieldName] !== null)
            ? studentCoData[fieldName]
            : {};
        
        const hasRatings = Object.values(ratings).some(r => r && r !== "---");

        if (!theme && !hasRatings) return "Data kokurikuler belum diisi.";

        let descriptionParts = [];

        if (theme) {
            descriptionParts.push(`${nickname} berpartisipasi aktif dalam kegiatan kokurikuler dengan tema "${theme}".`);
        }
        
        const sbDimensions = COCURRICULAR_DIMENSIONS.filter(dim => ratings[dim.id] === 'SB').map(dim => dim.label.toLowerCase());
        const bshDimensions = COCURRICULAR_DIMENSIONS.filter(dim => ratings[dim.id] === 'BSH').map(dim => dim.label.toLowerCase());
        const developingDimensions = COCURRICULAR_DIMENSIONS.filter(dim => ['MB', 'BB'].includes(ratings[dim.id])).map(dim => dim.label.toLowerCase());
        
        const formatDims = (list: string[]) => {
            if (list.length === 0) return '';
            if (list.length === 1) return list[0];
            const last = list[list.length - 1];
            const rest = list.slice(0, -1).join(', ');
            return `${rest}, dan ${last}`;
        };

        if (sbDimensions.length > 0 || bshDimensions.length > 0) {
            let positiveSentence = "Ia menunjukkan perkembangan yang ";
            const parts = [];
            if (sbDimensions.length > 0) parts.push(`sangat baik dalam aspek ${formatDims(sbDimensions)}`);
            if (bshDimensions.length > 0) parts.push(`baik dalam aspek ${formatDims(bshDimensions)}`);
            positiveSentence += parts.join(' serta ') + ".";
            descriptionParts.push(positiveSentence);
        }

        if (developingDimensions.length > 0) {
            descriptionParts.push(`Perlu bimbingan untuk lebih meningkatkan kemampuan dalam aspek ${formatDims(developingDimensions)}.`);
        }

        if (descriptionParts.length > 0 && !hasRatings) {
             descriptionParts.push('Penilaian dimensi profil lulusan perlu ditambahkan.');
        } else if (descriptionParts.length === 0 && hasRatings) {
            descriptionParts.push(`${nickname} telah menyelesaikan kegiatan kokurikuler dengan baik.`);
        }

        return descriptionParts.join(' ');
        
    }, [student, settings, cocurricularData, nickname, currentSemester]);

    const fontSizeClass = compactLevel === 2 ? '9pt' : compactLevel === 1 ? '9.5pt' : '10pt';
    const paddingClass = compactLevel === 2 ? 'p-1' : compactLevel === 1 ? 'p-1.5' : 'p-2';
    const marginClass = compactLevel === 2 ? 'mt-0.5' : compactLevel === 1 ? 'mt-1' : 'mt-1';
    
    const extraPyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[1px]' : 'py-[2px]';
    const extraFontSizeClass = compactLevel === 2 ? '9pt' : compactLevel === 1 ? '9.5pt' : '10pt';

    const attAndNotesGap = compactLevel === 2 ? 'gap-0.5 mt-0.5' : compactLevel === 1 ? 'gap-1 mt-1' : 'gap-1 mt-1';
    const attRowPadding = compactLevel === 2 ? 'py-0.5' : compactLevel === 1 ? 'py-1' : 'py-1';
    const attendanceW = compactLevel === 2 ? '4.9cm' : compactLevel === 1 ? '5.3cm' : '5.6cm';
    const attendanceLabelW = compactLevel === 2 ? '2.3cm' : compactLevel === 1 ? '2.5cm' : '2.7cm';
    const notesMinHeight = compactLevel === 2 ? '1.5rem' : compactLevel === 1 ? '2.2rem' : '3rem';

    const sigFontSizeClass = '10pt';
    const sigWrapperHeight = 'h-16';
    const waliImgHeight = 'h-14';
    const kepsekImgHeight = 'h-16';

    
    return (
        <div className={marginClass}>
            {showCocurricular && (
                <CocurricularSection 
                    cocurricularRef={cocurricularRef}
                    paddingClass={paddingClass}
                    fontSizeClass={fontSizeClass}
                    cocurricularDescription={cocurricularDescription}
                    studentId={student.id}
                    onUpdateCocurricularManual={onUpdateCocurricularManual}
                />
            )}
            {showExtra && extraActivities.length > 0 && (
                <ExtracurricularSection 
                    extraRef={extraRef}
                    extraFontSizeClass={extraFontSizeClass}
                    extraPyClass={extraPyClass}
                    extraActivities={extraActivities}
                    studentId={student.id}
                    onUpdateExtraDescription={onUpdateExtraDescription}
                />
            )}
            {(showAttendance || showNotes) && (
                <AttendanceAndNotesSection 
                    attendanceAndNotesRef={attendanceAndNotesRef}
                    attAndNotesGap={attAndNotesGap}
                    showAttendance={showAttendance}
                    showNotes={showNotes}
                    fontSizeClass={fontSizeClass}
                    attendanceW={attendanceW}
                    extraPyClass={extraPyClass}
                    sakitCount={sakitCount}
                    izinCount={izinCount}
                    alpaCount={alpaCount}
                    studentId={student.id}
                    attRowPadding={attRowPadding}
                    attendanceLabelW={attendanceLabelW}
                    onUpdateAttendance={onUpdateAttendance}
                    paddingClass={paddingClass}
                    notesMinHeight={notesMinHeight}
                    studentNoteContent={studentNoteContent}
                />
            )}
            {showDecision && (
                <div ref={decisionRef} className={marginClass}>
                    <DecisionSection 
                        settings={settings}
                        nickname={nickname}
                        paddingClass={paddingClass}
                        fontSizeClass={fontSizeClass}
                    />
                </div>
            )}
            {showParentFeedback && (
                <div ref={parentFeedbackRef} className={marginClass}>
                    <div className={paddingClass} style={{ fontSize: fontSizeClass, border: '1.5pt solid black' }}>
                        <div className="font-bold py-0.5" style={{ borderBottom: '1.5pt solid transparent' }}>Tanggapan Orang Tua/Wali Murid</div>
                        <div className="font-bold mt-0.5 py-0.5"><br /></div>
                    </div>
                </div>
            )}
            {showParentTeacherSignature && (
                <div className={marginClass}>
                    <SignaturesSection 
                        signaturesRef={signaturesRef}
                        sigFontSizeClass={sigFontSizeClass}
                        sigWrapperHeight={sigWrapperHeight}
                        waliImgHeight={waliImgHeight}
                        tanggalRaporValue={tanggalRaporValue}
                        settings={settings}
                        printOptions={printOptions}
                        onUpdateSettings={onUpdateSettings}
                    />
                </div>
            )}
            {showHeadmasterSignature && (
                <div className={marginClass}>
                    <HeadmasterSignatureSection 
                        headmasterRef={headmasterRef}
                        sigFontSizeClass={sigFontSizeClass}
                        sigWrapperHeight={sigWrapperHeight}
                        kepsekImgHeight={kepsekImgHeight}
                        settings={settings}
                        printOptions={printOptions}
                        onUpdateSettings={onUpdateSettings}
                    />
                </div>
            )}
        </div>
    );
});
ReportFooterContent.displayName = 'ReportFooterContent';
