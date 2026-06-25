import { useState, useEffect, useRef } from 'react';
import { PAPER_SIZES, HEADER_HEIGHT_CM, PAGE_TOP_MARGIN_CM, REPORT_CONTENT_BOTTOM_OFFSET_CM } from './raporUtils';

export function useReportChunks({ 
    reportSubjects, 
    paperSize, 
    selectedPagesAcademic, 
    studentId, 
    shouldDisplayRank, 
    printOptions, 
    studentExtracurriculars, 
    extracurriculars, 
    currentSemester,
    grades,
    attendance,
    notes,
    cocurricularData
}) {
    const [academicPageChunks, setAcademicPageChunks] = useState(null);
    const [compactLevel, setCompactLevel] = useState(0);
    const [cmToPx, setCmToPx] = useState(0);

    const studentInfoRef = useRef(null);
    const tableHeaderRef = useRef(null);
    const tableBodyRef = useRef(null);
    const cocurricularRef = useRef(null);
    const extraRef = useRef(null);
    const attendanceAndNotesRef = useRef(null);
    const decisionRef = useRef(null);
    const parentFeedbackRef = useRef(null);
    const signaturesRef = useRef(null);
    const headmasterRef = useRef(null);
    const cmRef = useRef(null);

    useEffect(() => {
        setCompactLevel(0);
        setAcademicPageChunks(null);
    }, [reportSubjects, paperSize, selectedPagesAcademic, studentId, shouldDisplayRank, printOptions, grades, attendance, notes, studentExtracurriculars, cocurricularData]);

    useEffect(() => {
        if (!selectedPagesAcademic) {
            setAcademicPageChunks([]);
            return;
        }
        if (cmToPx === 0) return;

        setAcademicPageChunks(null);

        const calculateChunks = () => {
            const mandatoryRefs = [studentInfoRef, tableHeaderRef, tableBodyRef];
            
            if (mandatoryRefs.some(ref => !ref.current)) {
                setTimeout(calculateChunks, 50);
                return;
            }

            const SAFETY_MARGIN_PX = 20; 
            const pageHeightPx = parseFloat(PAPER_SIZES[paperSize].height) * cmToPx;
            const firstPageAvailableHeight = pageHeightPx - (HEADER_HEIGHT_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx) - SAFETY_MARGIN_PX;
            const subsequentPageAvailableHeight = pageHeightPx - (PAGE_TOP_MARGIN_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx) - SAFETY_MARGIN_PX;

            const allItems = [];
            
            if (tableBodyRef.current) {
                const rowHeights = Array.from(tableBodyRef.current.children).map(row => row.offsetHeight);
                reportSubjects.forEach((subject, index) => {
                    allItems.push({ type: 'academic', content: subject, height: rowHeights[index] });
                });
            }

            const studentExtraData = studentExtracurriculars.find(se => se.studentId === studentId && (se.semester || 'Ganjil') === currentSemester);
            const hasExtras = (studentExtraData?.assignedActivities || []).some(id => id && extracurriculars.some(e => e.id === id));

            const footerItems = [
                { type: 'cocurricular', ref: cocurricularRef },
                hasExtras ? { type: 'extra', ref: extraRef } : null,
                { type: 'attendanceAndNotes', ref: attendanceAndNotesRef },
                { type: 'decision', ref: decisionRef },
                { type: 'parentFeedback', ref: parentFeedbackRef },
                { type: 'signatures', ref: signaturesRef },
                { type: 'headmaster', ref: headmasterRef }
            ].filter(Boolean);

            footerItems.forEach((item) => {
                const element = item.ref.current;
                if (element) {
                    const height = element.offsetHeight;
                    const style = window.getComputedStyle(element);
                    const marginTop = parseFloat(style.marginTop);
                    const marginBottom = parseFloat(style.marginBottom);
                    if (height > 0) {
                         allItems.push({ type: item.type, height: height + marginTop + marginBottom });
                    }
                }
            });

            const allChunks = [];
            if (allItems.length === 0) {
                setAcademicPageChunks([[]]);
                return;
            }

            let currentItemIndex = 0;
            let isFirstPage = true;
            const ITEM_SPACING_BUFFER = compactLevel === 2 ? 4 : compactLevel === 1 ? 6 : 10;

            while (currentItemIndex < allItems.length) {
                let currentChunk = [];
                const availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight;
                let heightUsed = (isFirstPage && studentInfoRef.current) ? studentInfoRef.current.offsetHeight : 0;
                
                const hasAcademicItemsRemaining = allItems.slice(currentItemIndex).some(item => item.type === 'academic');
                if (hasAcademicItemsRemaining && tableHeaderRef.current) {
                    heightUsed += tableHeaderRef.current.offsetHeight;
                    heightUsed += 5; 
                }

                for (let i = currentItemIndex; i < allItems.length; i++) {
                    const item = allItems[i];
                    let spacingBuffer = 0;
                    if (currentChunk.length > 0) {
                        const lastItem = currentChunk[currentChunk.length - 1];
                        if (lastItem.type === 'academic' && item.type !== 'academic') {
                            spacingBuffer = ITEM_SPACING_BUFFER;
                        }
                    }

                    if (heightUsed + item.height + spacingBuffer <= availableHeight) {
                        currentChunk.push(item);
                        heightUsed += (item.height + spacingBuffer);
                    } else {
                        break;
                    }
                }

                if (currentChunk.length === 0 && currentItemIndex < allItems.length) {
                    currentChunk.push(allItems[currentItemIndex]);
                }

                currentItemIndex += currentChunk.length;
                allChunks.push(currentChunk);
                isFirstPage = false;
            }

            if (allChunks.length > 2 && compactLevel < 2) {
                setCompactLevel(prev => prev + 1);
                setAcademicPageChunks(null);
            } else if (allChunks.length === 2 && compactLevel === 0) {
                const page1 = allChunks[0];
                let heightUsedPage1 = studentInfoRef.current ? studentInfoRef.current.offsetHeight : 0;
                const hasAcademics1 = page1.some(i => i.type === 'academic');
                if (hasAcademics1 && tableHeaderRef.current) heightUsedPage1 += tableHeaderRef.current.offsetHeight + 5;
                
                let spacing = 0;
                page1.forEach(item => {
                   heightUsedPage1 += item.height + spacing;
                   if (item.type === 'academic') spacing = ITEM_SPACING_BUFFER;
                   else spacing = 0;
                });
                
                if (firstPageAvailableHeight - heightUsedPage1 > 75) {
                    setCompactLevel(1);
                    setAcademicPageChunks(null);
                } else {
                    setAcademicPageChunks(allChunks);
                }
            } else {
                setAcademicPageChunks(allChunks);
            }
        };
        
        const timer = setTimeout(calculateChunks, 100);
        return () => clearTimeout(timer);

    }, [reportSubjects, paperSize, selectedPagesAcademic, studentId, cmToPx, shouldDisplayRank, printOptions, compactLevel, currentSemester, extracurriculars, studentExtracurriculars]);

    useEffect(() => {
        if (cmRef.current) {
            setCmToPx(cmRef.current.offsetHeight);
        }
    }, [selectedPagesAcademic]);

    return {
        academicPageChunks,
        compactLevel,
        cmToPx,
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
    };
}
