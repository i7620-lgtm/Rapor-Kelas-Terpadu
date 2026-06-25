import React, { useMemo } from 'react';
import { COCURRICULAR_DIMENSIONS, getTanggalRaporValue, getTanggalRaporKey, getContextualValue, getContextualKey } from '../../constants';
import { getGradeNumber } from '../DataNilaiPage';
import { capitalize } from './raporUtils';
import { EditableDescription } from './EditableDescription';

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
        const rankMessageStart = `Selamat! ${nickname} berhasil meraih `;
        const rankText = `Peringkat ${rank}`;
        const rankMessageEnd = ` di kelas. `;
        
        // Strip if the note already starts with a similar message
        let cleanNote = originalNote.trim();
        const autoMsgPattern = new RegExp(`Selamat!.*Peringkat \\d+ di kelas\\.?\\s*`, 'i');
        cleanNote = cleanNote.replace(autoMsgPattern, '').trim();

        studentNoteContent = React.createElement(React.Fragment, null, 
            React.createElement('span', null, rankMessageStart),
            React.createElement('strong', null, rankText),
            React.createElement('span', null, rankMessageEnd),
            React.createElement(EditableDescription, { 
                value: cleanNote, 
                onSave: (val) => onUpdateNote(student.id, val), 
                placeholder: "Tulis catatan...", 
                multiline: true,
                className: "inline"
            })
        );
    } else {
        studentNoteContent = React.createElement(EditableDescription, { 
            value: originalNote, 
            onSave: (val) => onUpdateNote(student.id, val), 
            placeholder: "Tidak ada catatan.", 
            multiline: true 
        });
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
        // Priority: Manual > Auto
        const studentCoData = cocurricularData?.[student.id];
        const fieldName = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
        
        let manualContent = studentCoData?.[fieldName]?.manualDescription;
        if (!manualContent && currentSemester === 'Ganjil' && studentCoData?.manualDescription) {
             manualContent = studentCoData.manualDescription; // legacy fallback for Ganjil
        }

        if (manualContent) {
            return manualContent;
        }

        const theme = currentSemester === 'Genap' ? settings.cocurricular_theme_Genap : settings.cocurricular_theme;
        const ratings = (studentCoData && typeof studentCoData[fieldName] === 'object' && studentCoData[fieldName] !== null)
            ? studentCoData[fieldName]
            : {};
        
        const hasRatings = Object.values(ratings).some(r => r && r !== "---");

        if (!theme && !hasRatings) {
            return "Data kokurikuler belum diisi.";
        }

        let descriptionParts = [];

        if (theme) {
            descriptionParts.push(`${nickname} berpartisipasi aktif dalam kegiatan kokurikuler dengan tema "${theme}".`);
        }
        
        const sbDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ratings[dim.id] === 'SB')
            .map(dim => dim.label.toLowerCase());

        const bshDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ratings[dim.id] === 'BSH')
            .map(dim => dim.label.toLowerCase());

        const developingDimensions = COCURRICULAR_DIMENSIONS
            .filter(dim => ['MB', 'BB'].includes(ratings[dim.id]))
            .map(dim => dim.label.toLowerCase());
        
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
            
            if (sbDimensions.length > 0) {
                parts.push(`sangat baik dalam aspek ${formatDims(sbDimensions)}`);
            }
            
            if (bshDimensions.length > 0) {
                parts.push(`baik dalam aspek ${formatDims(bshDimensions)}`);
            }
            
            positiveSentence += parts.join(' serta ') + ".";
            descriptionParts.push(positiveSentence);
        }

        if (developingDimensions.length > 0) {
            const dimensionText = formatDims(developingDimensions);
            descriptionParts.push(`Perlu bimbingan untuk lebih meningkatkan kemampuan dalam aspek ${dimensionText}.`);
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
    
    // Extra curves table
    const extraPyClass = compactLevel === 2 ? 'py-0' : compactLevel === 1 ? 'py-[1px]' : 'py-[2px]';
    const extraFontSizeClass = compactLevel === 2 ? '9pt' : compactLevel === 1 ? '9.5pt' : '10pt';

    // Attendance and notes
    const attAndNotesGap = compactLevel === 2 ? 'gap-0.5 mt-0.5' : compactLevel === 1 ? 'gap-1 mt-1' : 'gap-1 mt-1';
    const attRowPadding = compactLevel === 2 ? 'py-0.5' : compactLevel === 1 ? 'py-1' : 'py-1';
    const attendanceW = compactLevel === 2 ? '4.9cm' : compactLevel === 1 ? '5.3cm' : '5.6cm';
    const attendanceLabelW = compactLevel === 2 ? '2.3cm' : compactLevel === 1 ? '2.5cm' : '2.7cm';
    const notesMinHeight = compactLevel === 2 ? '1.5rem' : compactLevel === 1 ? '2.2rem' : '3rem';

    // Signatures
    const sigFontSizeClass = '10pt';
    const sigWrapperHeight = 'h-16';
    const waliImgHeight = 'h-14';
    const kepsekImgHeight = 'h-16';

    const renderDecision = () => {
        const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
        if (!isSemesterGenap) return null;

        const gradeLevel = getGradeNumber(settings.nama_kelas);

        let promotionText;
        if (gradeLevel === 6) {
            promotionText = 'LULUS';
        } else {
            const nextGrade = gradeLevel ? gradeLevel + 1 : '';
            const nextGradeRoman = {1: 'II', 2: 'III', 3: 'IV', 4: 'V', 5: 'VI'}[nextGrade - 1] || '';
            promotionText = `Naik ke Kelas ${nextGrade} (${nextGradeRoman})`;
        }
        
        return React.createElement('div', { className: `${paddingClass}`, style: { fontSize: fontSizeClass, border: '1.5pt solid black' } },
            React.createElement('div', { className: 'font-bold text-center py-0.5', style: { borderBottom: '1.5pt solid black' } }, 
                `Berdasarkan hasil belajar yang dicapai, ${nickname} dinyatakan:`
			),
            React.createElement('div', { className: 'font-bold mt-0.5 text-center py-0.5' },
                React.createElement(EditableDescription, { value: promotionText, onSave: () => {}, placeholder: promotionText, className: "text-center justify-center font-bold" })
            )
        );
    };

    return (
        React.createElement('div', { className: marginClass },
            showCocurricular && React.createElement('div', { ref: cocurricularRef, className: `${paddingClass}`, style: { fontSize: fontSizeClass, border: '1.5pt solid black' } },
                React.createElement('div', { className: 'font-bold mb-1' }, 'Kokurikuler'),
                React.createElement('div', { className: 'min-h-[1.5rem]' }, 
                    React.createElement(EditableDescription, {
                        value: cocurricularDescription,
                        onSave: (val) => onUpdateCocurricularManual(student.id, val),
                        placeholder: "Deskripsi kokurikuler...",
                        multiline: true
                    })
                )
            ),
            (showExtra && extraActivities.length > 0) && React.createElement('div', { ref: extraRef, className: marginClass },
                React.createElement('table', { className: 'w-full border-collapse', style: { fontSize: extraFontSizeClass, tableLayout: 'fixed', border: '1.5pt solid black' } },
                    React.createElement('thead', null, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: `px-2 ${extraPyClass} w-[5%]`, style: { border: '1.5pt solid black' } }, 'No.'), React.createElement('td', { className: `px-2 ${extraPyClass} w-[32%]`, style: { border: '1.5pt solid black' } }, 'Ekstrakurikuler'), React.createElement('td', { className: `px-2 ${extraPyClass} w-[63%]`, style: { border: '1.5pt solid black' } }, 'Keterangan'))),
                    React.createElement('tbody', null, extraActivities.map((item: any, index: number) => (
                        React.createElement('tr', { key: index, className: 'align-top', id: `row-extra-${student.id}-${index}` }, 
                            React.createElement('td', { className: `px-2 ${extraPyClass} text-center`, style: { border: '1.5pt solid black' } }, index + 1), 
                            React.createElement('td', { className: `px-2 ${extraPyClass}`, style: { border: '1.5pt solid black' } }, item.name), 
                            React.createElement('td', { className: `px-2 ${extraPyClass}`, style: { border: '1.5pt solid black' } }, 
                                React.createElement(EditableDescription, {
                                    value: item.description,
                                    onSave: (val) => onUpdateExtraDescription(student.id, item.id, val),
                                    placeholder: "Keterangan...",
                                    multiline: true
                                })
                            )
                        )
                    )))
                )
            ),
            (showAttendance || showNotes) && React.createElement('div', { ref: attendanceAndNotesRef, className: `w-full flex ${attAndNotesGap} items-stretch` },
                showAttendance && React.createElement('div', { className: 'flex flex-col flex-shrink-0', style: { fontSize: fontSizeClass, width: attendanceW, border: '1.5pt solid black' } },
                    React.createElement('div', { className: `font-bold px-2 ${extraPyClass} text-center`, style: { borderBottom: '1.5pt solid black' } }, 'Ketidakhadiran'),
                     React.createElement('div', { className: 'flex-grow flex flex-col justify-around' },
                         ['Sakit', 'Izin', 'Tanpa Keterangan'].map((item, index, arr) => {
                             const typeKey = item === 'Sakit' ? 'sakit' : item === 'Izin' ? 'izin' : 'alpa';
                             const value = item === 'Sakit' ? sakitCount : item === 'Izin' ? izinCount : alpaCount;
                             
                             return React.createElement('div', {
                                 key: item,
                                 id: `row-attendance-${student.id}-${item.toLowerCase().replace(/\s+/g, '-')}`,
                                 className: `flex items-center px-2 ${attRowPadding} flex-1`,
                                 style: index < arr.length - 1 ? { borderBottom: '1.5pt solid black' } : undefined
                             },
                                 React.createElement('span', { className: 'whitespace-nowrap', style: { width: attendanceLabelW } }, item),
                                 React.createElement('span', { className: 'px-1' }, ':'),
                                 React.createElement('div', { className: 'flex-1 text-left flex gap-1 items-center' },
                                     React.createElement(EditableDescription, {
                                         value: value,
                                         onSave: (val) => onUpdateAttendance(student.id, typeKey, val),
                                         placeholder: "0",
                                         className: "w-8 text-center"
                                     }),
                                     React.createElement('span', null, 'hari')
                                  )
                             )
                         })
                      )
                ),
                showNotes && React.createElement('div', { className: `${paddingClass} flex-grow flex-1`, style: { fontSize: fontSizeClass, border: '1.5pt solid black' } },
                    React.createElement('div', { className: 'font-bold mb-1' }, 'Catatan Wali Kelas'),
                    React.createElement('div', { style: { minHeight: notesMinHeight } }, studentNoteContent)
                )
            ),
            showDecision && React.createElement('div', { ref: decisionRef, className: marginClass }, renderDecision()),
            showParentFeedback && React.createElement('div', { ref: parentFeedbackRef, className: marginClass },
                React.createElement('div', { className: `${paddingClass}`, style: { fontSize: fontSizeClass, border: '1.5pt solid black' } },
                    React.createElement('div', { className: 'font-bold py-0.5', style: { borderBottom: '1.5pt solid transparent' } }, 'Tanggapan Orang Tua/Wali Murid'),
                    React.createElement('div', { className: 'font-bold mt-0.5 py-0.5' }, 
                        React.createElement('br', null)
                    )
                )
            ),
            showParentTeacherSignature && React.createElement('div', { ref: signaturesRef, className: `${marginClass} flex justify-between`, style: { fontSize: sigFontSizeClass } },
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('div', null, 'Mengetahui:'), 
                    React.createElement('div', null, 'Orang Tua/Wali,'), 
                    React.createElement('div', { className: sigWrapperHeight }), 
                    React.createElement('div', null, '.........................')
                ),
                React.createElement('div', { className: 'text-center relative' }, 
                    React.createElement(EditableDescription, { 
                        value: tanggalRaporValue, 
                        onSave: (val) => onUpdateSettings(getTanggalRaporKey(settings), val), 
                        placeholder: "Tempat, Tanggal",
                        className: "text-center justify-center"
                    }), 
                    React.createElement('div', null, 'Wali Kelas,'),
                    React.createElement('div', { className: `${sigWrapperHeight} w-full flex items-center justify-center relative` },
                        settings.ttd_wali_kelas && printOptions?.showTeacherSignature && React.createElement('img', { 
                            src: settings.ttd_wali_kelas, 
                            alt: "TTD Wali Kelas", 
                            className: `${waliImgHeight} object-contain absolute z-10 p-2` 
                        })
                    ), 
                    React.createElement('div', { className: 'font-bold underline relative z-20' }, 
                        React.createElement(EditableDescription, { 
                            value: getContextualValue(settings, 'nama_wali_kelas') || '_________________', 
                            onSave: (val) => onUpdateSettings(getContextualKey(settings, 'nama_wali_kelas'), val), 
                            placeholder: "Nama Wali Kelas",
                            className: "text-center justify-center font-bold"
                        })
                    ), 
                    React.createElement('div', { className: 'flex justify-center gap-1' }, 
                        `${getContextualValue(settings, 'nip_label_wali_kelas') || 'NIP'}.`, 
                        React.createElement(EditableDescription, { 
                            value: getContextualValue(settings, 'nip_wali_kelas') || '-', 
                            onSave: (val) => onUpdateSettings(getContextualKey(settings, 'nip_wali_kelas'), val), 
                            placeholder: "-" 
                        })
                    )
                )
            ),
            showHeadmasterSignature && React.createElement('div', { ref: headmasterRef, className: `${marginClass} flex justify-center text-center`, style: { fontSize: sigFontSizeClass } }, 
                React.createElement('div', { className: 'relative' }, 
                    React.createElement('div', null, 'Mengetahui,'), 
                    React.createElement('div', null, 'Kepala Sekolah,'), 
                    React.createElement('div', { className: `${sigWrapperHeight} w-full flex items-center justify-center relative` },
                        settings.ttd_kepala_sekolah && printOptions?.showPrincipalSignature && React.createElement('img', { 
                            src: settings.ttd_kepala_sekolah, 
                            alt: "TTD Kepala Sekolah", 
                            className: `${kepsekImgHeight} object-contain absolute z-10 p-2` 
                        })
                    ), 
                    React.createElement('div', { className: 'font-bold underline relative z-20' }, 
                        React.createElement(EditableDescription, { 
                            value: getContextualValue(settings, 'nama_kepala_sekolah') || '_________________', 
                            onSave: (val) => onUpdateSettings(getContextualKey(settings, 'nama_kepala_sekolah'), val), 
                            placeholder: "Nama Kepala Sekolah",
                            className: "text-center justify-center font-bold"
                        })
                    ), 
                    React.createElement('div', { className: 'flex justify-center gap-1' }, 
                        `${getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP'}.`, 
                        React.createElement(EditableDescription, { 
                            value: getContextualValue(settings, 'nip_kepala_sekolah') || '-', 
                            onSave: (val) => onUpdateSettings(getContextualKey(settings, 'nip_kepala_sekolah'), val), 
                            placeholder: "-" 
                        })
                    )
                )
            )
        )
    );
});

ReportFooterContent.displayName = 'ReportFooterContent';
