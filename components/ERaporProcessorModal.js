
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getGradeNumber } from './DataNilaiPage.js';

const getNumericValue = (score, qualitativeGradingMap) => {
    if (typeof score === 'number') return score;
    if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
        return qualitativeGradingMap[score];
    }
    return null;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, confirmationData, allSubjects }) => {
    const { analysis, matchedSubject } = confirmationData;
    const [selectedSubject, setSelectedSubject] = useState(matchedSubject);

    useEffect(() => {
        setSelectedSubject(matchedSubject);
    }, [matchedSubject]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedSubject) {
            onConfirm(selectedSubject);
        }
    };
    
    const renderContent = () => {
        if (matchedSubject) {
            return React.createElement(React.Fragment, null,
                React.createElement('p', null, `File terdeteksi sebagai format untuk mata pelajaran:`),
                React.createElement('p', { className: 'font-bold text-indigo-700' }, matchedSubject.fullName),
                React.createElement('p', { className: "mt-4" }, `Aplikasi akan mengisi data untuk `, React.createElement('strong', null, `${analysis.studentMap.size} siswa`), ` yang cocok:`),
                React.createElement('ul', { className: 'list-disc list-inside pl-4 text-slate-500 text-sm' },
                    React.createElement('li', null, "Nilai Rapor (Nilai Akhir)"),
                    React.createElement('li', null, "Penanda Ketercapaian (T/R) untuk deskripsi")
                )
            );
        } else {
            return React.createElement(React.Fragment, null,
                React.createElement('p', { className: 'font-semibold text-amber-800' }, 'Deteksi Otomatis Gagal'),
                React.createElement('p', { className: 'mt-2 text-slate-600' }, 'Aplikasi tidak dapat menentukan mata pelajaran secara otomatis. Silakan pilih mata pelajaran yang benar dari daftar di bawah ini.'),
                React.createElement('select', {
                    value: selectedSubject?.id || '',
                    onChange: (e) => {
                        const subjectId = e.target.value;
                        const subjectObj = allSubjects.find(s => s.id === subjectId);
                        setSelectedSubject(subjectObj);
                    },
                    className: 'mt-4 w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500'
                },
                    React.createElement('option', { value: '' }, '-- Pilih Mata Pelajaran --'),
                    allSubjects.map(s => React.createElement('option', { key: s.id, value: s.id }, s.fullName))
                )
            );
        }
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg" },
                React.createElement('div', { className: "p-6" },
                    React.createElement('div', { className: "flex items-start" },
                        React.createElement('div', { className: "flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10" },
                             React.createElement('svg', { className: "h-6 w-6 text-blue-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
                            )
                        ),
                        React.createElement('div', { className: "ml-4 text-left" },
                            React.createElement('h3', { className: "text-lg leading-6 font-bold text-slate-900" }, "Konfirmasi Pengisian Data"),
                            React.createElement('div', { className: "mt-2" },
                                React.createElement('div', { className: "text-sm text-slate-600 space-y-2" }, renderContent())
                            )
                        )
                    )
                ),
                React.createElement('div', { className: "bg-slate-50 px-6 py-3 flex flex-row-reverse rounded-b-lg" },
                    React.createElement('button', {
                        type: "button",
                        onClick: handleConfirm,
                        disabled: !selectedSubject,
                        className: "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    }, "Lanjutkan & Isi File"),
                    React.createElement('button', {
                        type: "button",
                        onClick: onClose,
                        className: "mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:w-auto sm:text-sm"
                    }, "Batal")
                )
            )
        )
    );
};


const ERaporProcessorModal = ({ isOpen, onClose, students, grades, subjects, learningObjectives, settings, showToast, predefinedCurriculum }) => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setConfirmationData(null);
        }
    };
    
    const handleAreaClick = () => {
        fileInputRef.current?.click();
    };

    const handleProcessFile = async () => {
        if (!file) {
            showToast('Silakan pilih file format e-Rapor terlebih dahulu.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const ws = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
            
            const analysis = { workbook, ws, studentMap: new Map(), tpMapping: new Map(), fileName };

            // --- ANALYSIS LOGIC ---
            // Regex to extract subject name, tolerant to prefixes, suffixes, and version numbers like (1).
            const subjectNameMatch = fileName.match(/Kelas\s*\d+\s*[_-]\s*(.+?)(?:\s*\(\d+\)|_fase)?\.xlsx/i);
            const subjectNameFromFileRaw = subjectNameMatch ? subjectNameMatch[1] : null;

            let bestMatch = null;
            if (subjectNameFromFileRaw) {
                const normalizeAndTokenize = (str) => {
                    if (!str) return [];
                    return str.toLowerCase()
                              .replace(/\(.*\)/g, '')   // remove content in parentheses like (1)
                              .replace(/[,.]/g, '')     // remove common punctuation
                              .replace(/[-_]/g, ' ')    // replace separators with space
                              .split(/\s+/)             // split into words
                              .filter(Boolean);        // remove empty strings
                };

                const fileNameTokens = normalizeAndTokenize(subjectNameFromFileRaw);
                let highestScore = 0;
                const MATCH_THRESHOLD = 0.75; // Require at least 75% of words to match.

                subjects.filter(s => s.active).forEach(subject => {
                    const appSubjectTokens = normalizeAndTokenize(subject.fullName);
                    if (appSubjectTokens.length === 0) return;

                    let matchingWords = 0;
                    const fileNameTokenSet = new Set(fileNameTokens);

                    for (const token of appSubjectTokens) {
                        if (fileNameTokenSet.has(token)) {
                            matchingWords++;
                        }
                    }
                    const score = matchingWords / appSubjectTokens.length;

                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = (score >= MATCH_THRESHOLD) ? subject : null;
                    }
                });
            }
            
            // Map Students
            let nisnColIndex = -1;
            const headerRow = jsonData.find(row => row.some(cell => typeof cell === 'string' && cell.toUpperCase() === 'NISN'));
            if(headerRow) nisnColIndex = headerRow.findIndex(cell => typeof cell === 'string' && cell.toUpperCase() === 'NISN');
            if (nisnColIndex === -1) throw new Error("Kolom 'NISN' tidak ditemukan di file Excel.");
            
            jsonData.forEach((row, index) => {
                const nisn = row[nisnColIndex];
                if (nisn) {
                    const student = students.find(s => String(s.nisn) === String(nisn));
                    if (student) analysis.studentMap.set(index, student.id);
                }
            });

            // Map TPs
            const tpSectionRow = jsonData.findIndex(row => row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes('KETERANGAN')));
            if (tpSectionRow === -1) throw new Error("Bagian 'KETERANGAN' untuk pemetaan TP tidak ditemukan.");
            
            let tpHeaderRowIndex = -1;
            jsonData.slice(tpSectionRow + 1).forEach(row => {
                const cell1 = String(row[0] || '').trim();
                const cell2 = String(row[1] || '').trim();
                if (!cell1.startsWith('TP') || !cell2) return;

                const tpCode = cell1.replace(':', '').trim();
                const tpText = cell2;

                if (tpHeaderRowIndex === -1) {
                    tpHeaderRowIndex = jsonData.findIndex(r => r.includes(tpCode));
                }
                if (tpHeaderRowIndex === -1) return;

                const colIndex = jsonData[tpHeaderRowIndex].indexOf(tpCode);
                if (colIndex === -1) return;
                
                analysis.tpMapping.set(tpCode, { text: tpText, columnIndex: colIndex });
            });
            
            setConfirmationData({ analysis, matchedSubject: bestMatch });

        } catch (error) {
            showToast(error.message, 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fillAndDownload = async (analysisResult) => {
        if (!analysisResult) return;
        setIsLoading(true);
        try {
            const { workbook, ws, subject, studentMap, tpMapping, fileName } = analysisResult;
            
            // Loop through students found in the map
            for (const [rowIndex, studentId] of studentMap.entries()) {
                const studentData = students.find(s => s.id === studentId);
                const gradeData = grades.find(g => g.studentId === studentId);
                if (!studentData || !gradeData) continue;

                // 1. Fill NILAI RAPOR
                const finalGrade = gradeData.finalGrades?.[subject.id];
                if (finalGrade !== null && finalGrade !== undefined) {
                    const cellRef = XLSX.utils.encode_cell({c: 4, r: rowIndex}); // Column E
                    XLSX.utils.sheet_add_aoa(ws, [[finalGrade]], { origin: cellRef });
                }

                // 2. Find Highest & Lowest TP scores
                const allTpsWithScores = [];
                const detailedGrade = gradeData.detailedGrades?.[subject.id];
                if(detailedGrade?.slm){
                    detailedGrade.slm.forEach(slm => {
                        const curriculumKey = subject.curriculumKey || subject.fullName;
                        const tpsForSlm = predefinedCurriculum[curriculumKey]?.find(item => item.slm === slm.name)?.tp || [];
                        slm.scores.forEach((score, tpIndex) => {
                            const numericScore = getNumericValue(score, settings.qualitativeGradingMap);
                            const tpText = tpsForSlm[tpIndex];
                            if(numericScore !== null && tpText) {
                                allTpsWithScores.push({ score: numericScore, text: tpText });
                            }
                        });
                    });
                }
                
                if(allTpsWithScores.length >= 2) {
                    allTpsWithScores.sort((a,b) => a.score - b.score);
                    const lowestTp = allTpsWithScores[0];
                    const highestTp = allTpsWithScores[allTpsWithScores.length - 1];

                    // Find columns for highest and lowest TPs
                    let highestColIndex = -1;
                    let lowestColIndex = -1;

                    for (const [code, { text, columnIndex }] of tpMapping.entries()) {
                        if (text.trim() === highestTp.text.trim()) highestColIndex = columnIndex;
                        if (text.trim() === lowestTp.text.trim()) lowestColIndex = columnIndex;
                    }

                    // 3. Fill 'T' and 'R'
                    if (highestColIndex !== -1) {
                        const cellRef = XLSX.utils.encode_cell({c: highestColIndex, r: rowIndex});
                        XLSX.utils.sheet_add_aoa(ws, [['T']], { origin: cellRef });
                    }
                    if (lowestColIndex !== -1) {
                         const cellRef = XLSX.utils.encode_cell({c: lowestColIndex, r: rowIndex});
                        XLSX.utils.sheet_add_aoa(ws, [['R']], { origin: cellRef });
                    }
                }
            }

            // 4. Download file
            const newFileName = `TERISI_${fileName}`;
            XLSX.writeFile(workbook, newFileName);
            showToast(`File "${newFileName}" berhasil diunduh.`, 'success');

        } catch (error) {
            showToast('Gagal memproses file: ' + error.message, 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
            onClose(); // Close the main modal after download/error
        }
    };
    
    const handleConfirmAndFill = (finalSubject) => {
        if (!confirmationData || !finalSubject) return;
        const fullAnalysisResult = { ...confirmationData.analysis, subject: finalSubject };
        setConfirmationData(null); // Close confirmation modal
        fillAndDownload(fullAnalysisResult); // Proceed to fill
    };
    
    const handleClose = () => {
        setFile(null);
        setFileName('');
        setConfirmationData(null);
        onClose();
    };

    return (
        React.createElement(React.Fragment, null,
            confirmationData && React.createElement(ConfirmationModal, {
                isOpen: !!confirmationData,
                onClose: () => setConfirmationData(null),
                onConfirm: handleConfirmAndFill,
                confirmationData: confirmationData,
                allSubjects: subjects.filter(s => s.active)
            }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4", onClick: handleClose },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg", onClick: e => e.stopPropagation() },
                    React.createElement('div', { className: "p-5 border-b" },
                        React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Isi Format E-Rapor"),
                        React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, "Unggah format Excel e-Rapor kosong untuk diisi secara otomatis.")
                    ),
                    React.createElement('div', { className: "p-6 space-y-4" },
                        React.createElement('div', { 
                            className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors",
                            onClick: handleAreaClick
                        },
                            React.createElement('div', { className: "space-y-1 text-center" },
                                React.createElement('svg', { className: "mx-auto h-12 w-12 text-slate-400", stroke: "currentColor", fill: "none", viewBox: "0 0 48 48", "aria-hidden": "true" },
                                    React.createElement('path', { d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                                ),
                                React.createElement('div', { className: "flex text-sm text-slate-600" },
                                    React.createElement('label', { htmlFor: "file-upload", className: "relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none" },
                                        React.createElement('span', null, "Unggah file"),
                                        React.createElement('input', { ref: fileInputRef, id: "file-upload", name: "file-upload", type: "file", className: "sr-only", accept: ".xlsx, .xls", onChange: handleFileChange })
                                    ),
                                    React.createElement('p', { className: "pl-1" }, "atau seret dan lepas file di sini")
                                ),
                                React.createElement('p', { className: "text-xs text-slate-500" }, "XLSX, XLS")
                            )
                        ),
                        fileName && React.createElement('p', { className: "text-sm font-medium text-slate-700 text-center" }, `File terpilih: ${fileName}`)
                    ),
                    React.createElement('div', { className: "flex justify-end p-4 bg-slate-50 rounded-b-lg" },
                        React.createElement('button', { onClick: handleClose, className: "bg-white py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50" }, "Batal"),
                        React.createElement('button', {
                            onClick: handleProcessFile,
                            disabled: !file || isLoading,
                            className: "ml-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                        },
                            isLoading ? React.createElement('div', { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" }) : "Analisis & Lanjutkan"
                        )
                    )
                )
            )
        )
    );
};

export default ERaporProcessorModal;
