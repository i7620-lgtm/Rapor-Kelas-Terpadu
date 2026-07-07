import React from 'react';
import { 
    HEADER_HEIGHT_CM, 
    PAGE_LEFT_RIGHT_MARGIN_CM, 
    PAGE_TOP_MARGIN_CM, 
    PAGE_BOTTOM_MARGIN_CM, 
    REPORT_CONTENT_BOTTOM_OFFSET_CM
} from './raporUtils';
import { CoverPage } from './CoverPage';
import { SchoolIdentityPage } from './SchoolIdentityPage';
import { StudentIdentityPage } from './StudentIdentityPage';
import { ReportHeader } from './ReportHeader';
import { ReportStudentInfo } from './ReportStudentInfo';
import { AcademicTable } from './AcademicTable';
import { ReportFooterContent } from './ReportFooterContent';
import { PageFooter } from './PageFooter';
import { useReportChunks } from './useReportChunks';
import { useReportPagesForStudentLogic } from './useReportPagesForStudentLogic';

interface ReportPagesForStudentProps {
    student: any;
    settings: any;
    pageStyle: React.CSSProperties;
    selectedPages: {
        cover: boolean;
        schoolIdentity: boolean;
        studentIdentity: boolean;
        academic: boolean;
    };
    paperSize: string;
    rank: number | null;
    rankingOption: string;
    hideGradesForFaseA: boolean;
    printOptions: any;
    [key: string]: any;
}

export const ReportPagesForStudent: React.FC<ReportPagesForStudentProps> = ({ 
    student, 
    settings, 
    pageStyle, 
    selectedPages, 
    paperSize, 
    rank, 
    rankingOption, 
    hideGradesForFaseA, 
    printOptions, 
}) => {
    const {
        grades, attendance, studentExtracurriculars, extracurriculars,
        cocurricularData,
        onUpdateDescription, onUpdateStudent, onUpdateSettings, onUpdateNote,
        onUpdateAttendance, onUpdateExtraDescription, onUpdateCocurricularManual,
        currentSemester, notesForMeasurement, reportSubjects, shouldDisplayRank
    } = useReportPagesForStudentLogic(student, settings, rank, rankingOption);

    const {
        academicPageChunks,
        compactLevel,
        refs: {
            studentInfoRef,
            tableHeaderRef,
            tableBodyRef,
            cocurricularRef,
            extraRef,
            attendanceAndNotesRef,
            decisionRef,
            parentFeedbackRef,
            signaturesRef,
            headmasterRef,
            cmRef
        }
    } = useReportChunks({
        reportSubjects, 
        paperSize, 
        selectedPagesAcademic: selectedPages.academic, 
        studentId: student.id, 
        shouldDisplayRank, 
        printOptions, 
        studentExtracurriculars, 
        extracurriculars, 
        currentSemester,
        grades,
        attendance,
        notes: notesForMeasurement,
        cocurricularData
    });

    if (academicPageChunks === null && selectedPages.academic) {
        return React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
            React.createElement('div', { 
                className: 'report-page bg-white shadow-lg border box-border relative font-times', 
                style: { ...pageStyle, visibility: 'hidden', position: 'absolute', zIndex: -1 } 
            },
                 React.createElement('div', { className: 'absolute flex flex-col', style: {
                    top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `calc(${REPORT_CONTENT_BOTTOM_OFFSET_CM}cm + 20px)`, fontSize: '10.5pt'
                } },
                    React.createElement(ReportStudentInfo, { student, settings, onUpdateStudent, onUpdateSettings, ref: studentInfoRef, compactLevel }),
                    React.createElement(AcademicTable, { subjectsToRender: reportSubjects, ref: tableBodyRef, headerRef: tableHeaderRef, hideGradesForFaseA: hideGradesForFaseA, studentId: student.id, onUpdateDescription, compactLevel }),
                    React.createElement(ReportFooterContent, { 
                        student, settings, attendance, notes: notesForMeasurement, studentExtracurriculars, extracurriculars, cocurricularData,
                        rank: rank, rankingOption: rankingOption,
                        showCocurricular: true, showExtra: true, showNotes: true, showAttendance: true, showDecision: true,
                        showParentFeedback: true, showParentTeacherSignature: true, showHeadmasterSignature: true,
                        printOptions: printOptions,
                        onUpdateNote,
                        onUpdateAttendance,
                        onUpdateExtraDescription,
                        onUpdateCocurricularManual,
                        onUpdateSettings,
                        ref: { cocurricularRef, extraRef, attendanceAndNotesRef, decisionRef, parentFeedbackRef, signaturesRef, headmasterRef },
                        compactLevel
                    })
                )
            )
        );
    }
    
    let academicPageCounter = 0;

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'absolute', visibility: 'hidden', zIndex: -1 } }),
            selectedPages.cover && React.createElement('div', { className: 'report-page bg-white shadow-lg border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'cover', style: pageStyle },
                React.createElement(CoverPage, { student: student, settings: settings, onUpdateStudent })
            ),
            selectedPages.schoolIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: { position: 'absolute', top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${PAGE_BOTTOM_MARGIN_CM}cm` } },
                    React.createElement(SchoolIdentityPage, { settings: settings, onUpdateSettings })
                )
            ),
            selectedPages.studentIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: { position: 'absolute', top: `${HEADER_HEIGHT_CM}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `${PAGE_BOTTOM_MARGIN_CM}cm` } },
                    React.createElement(StudentIdentityPage, { student: student, settings: settings, onUpdateStudent, onUpdateSettings })
                )
            ),
            selectedPages.academic && academicPageChunks?.map((chunk, pageIndex) => {
                if (chunk.length === 0) return null;

                academicPageCounter++;
                const isFirstAcademicPage = pageIndex === 0;
                const contentTopCm = isFirstAcademicPage ? HEADER_HEIGHT_CM : PAGE_TOP_MARGIN_CM;
                
                const academicItemsInChunk = chunk.filter(item => item.type === 'academic').map(item => item.content);
                const hasAcademicItems = academicItemsInChunk.length > 0;
                
                let startingIndex = 1;
                for (let i = 0; i < pageIndex; i++) {
                    startingIndex += academicPageChunks[i].filter((item: any) => item.type === 'academic').length;
                }

                const chunkItemTypes = new Set(chunk.map(item => item.type));
                const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');

                return React.createElement('div', { key: `academic-${student.id}-${pageIndex}`, className: 'report-page bg-white shadow-lg border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: pageStyle },
                    isFirstAcademicPage && React.createElement(ReportHeader, { settings: settings }),
                    
                    React.createElement('div', { className: 'absolute flex flex-col', style: {
                        top: `${contentTopCm}cm`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`, bottom: `calc(${REPORT_CONTENT_BOTTOM_OFFSET_CM}cm + 20px)`, fontSize: '10.5pt',
                    }},
                        isFirstAcademicPage && React.createElement(ReportStudentInfo, { student, settings, onUpdateStudent, onUpdateSettings, compactLevel }),
                        hasAcademicItems && React.createElement(AcademicTable, { subjectsToRender: academicItemsInChunk, startingIndex: startingIndex, hideGradesForFaseA: hideGradesForFaseA, studentId: student.id, onUpdateDescription, compactLevel }),
                        React.createElement(ReportFooterContent, { 
                            student, settings, attendance, notes: notesForMeasurement, studentExtracurriculars, extracurriculars, cocurricularData,
                            rank: rank, rankingOption: rankingOption,
                            showCocurricular: chunkItemTypes.has('cocurricular'),
                            showExtra: chunkItemTypes.has('extra'),
                            showNotes: chunkItemTypes.has('attendanceAndNotes'),
                            showAttendance: chunkItemTypes.has('attendanceAndNotes'),
                            showDecision: chunkItemTypes.has('decision') && isSemesterGenap,
                            showParentFeedback: chunkItemTypes.has('parentFeedback'),
                            showParentTeacherSignature: chunkItemTypes.has('signatures'),
                            showHeadmasterSignature: chunkItemTypes.has('headmaster'),
                            printOptions: printOptions,
                            onUpdateNote,
                            onUpdateAttendance,
                            onUpdateExtraDescription,
                            onUpdateCocurricularManual,
                            onUpdateSettings,
                            compactLevel
                        })
                    ),
                    
                    React.createElement(PageFooter, { student: student, settings: settings, currentPage: academicPageCounter })
                );
            })
        )
    );
};
