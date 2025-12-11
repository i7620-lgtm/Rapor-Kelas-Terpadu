
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { QUALITATIVE_DESCRIPTORS } from '../constants.js';

export const getGradeNumber = (str) => {
    if (!str) return null;
    const trimmedStr = str.trim();
    
    // Priority 1: Check for any Arabic numeral within the string.
    const arabicMatch = trimmedStr.match(/\d+/);
    if (arabicMatch) {
        return parseInt(arabicMatch[0], 10);
    }

    // Priority 2: Check for Roman numerals at the beginning of the string.
    // The order of checks is important.
    const upperStr = trimmedStr.toUpperCase();
    if (upperStr.startsWith('VI')) return 6;
    if (upperStr.startsWith('V')) return 5;
    if (upperStr.startsWith('IV')) return 4;
    if (upperStr.startsWith('III')) return 3;
    if (upperStr.startsWith('II')) return 2;
    if (upperStr.startsWith('I')) return 1;

    return null;
};

const getNumericValue = (score, qualitativeGradingMap) => {
    if (typeof score === 'number') return score;
    if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
        return qualitativeGradingMap[score];
    }
    return null;
};

const getQualitativeCode = (score, predikats) => {
    if (typeof score !== 'number') return score || ''; // It's already a code or null/undefined
    const valA = parseInt(predikats.a, 10);
    const valB = parseInt(predikats.b, 10);
    const valC = parseInt(predikats.c, 10);
    
    if (isNaN(valA) || isNaN(valB) || isNaN(valC)) return ''; // Not configured

    if (score >= valA) return 'SB';
    if (score >= valB) return 'BSH';
    if (score >= valC) return 'MB';
    if (score < valC) return 'BB';
    return '';
};


const QualitativeGradingTable = ({ settings }) => {
    const { predikats, qualitativeGradingMap } = settings;
    if (!predikats || !qualitativeGradingMap || Object.keys(qualitativeGradingMap).length === 0) return null;

    const valA = parseInt(predikats.a, 10);
    const valB = parseInt(predikats.b, 10);
    const valC = parseInt(predikats.c, 10);
    const valD = parseInt(predikats.d, 10);

    const data = [
        { code: 'SB', descriptor: QUALITATIVE_DESCRIPTORS.SB, range: `${valA} - 100`, value: qualitativeGradingMap.SB },
        { code: 'BSH', descriptor: QUALITATIVE_DESCRIPTORS.BSH, range: `${valB} - ${valA - 1}`, value: qualitativeGradingMap.BSH },
        { code: 'MB', descriptor: QUALITATIVE_DESCRIPTORS.MB, range: `${valC} - ${valB - 1}`, value: qualitativeGradingMap.MB },
        { code: 'BB', descriptor: QUALITATIVE_DESCRIPTORS.BB, range: `${valD} - ${valC - 1}`, value: qualitativeGradingMap.BB },
    ];

    return (
         React.createElement('div', { className: "mt-4" },
            React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-2" }, "Penilaian Kualitatif Otomatis (Hanya Baca)"),
            React.createElement('p', { className: "text-xs text-slate-500 mb-3" }, "Nilai representatif ini dihitung otomatis dari nilai KKM dan rentang di atas."),
            React.createElement('table', { className: "w-full text-sm border-collapse" },
                React.createElement('thead', null,
                    React.createElement('tr', { className: "bg-slate-100" },
                        React.createElement('th', { className: "border p-2 text-left whitespace-nowrap" }, "Deskriptor"),
                        React.createElement('th', { className: "border p-2 text-center whitespace-nowrap" }, "Rentang Nilai"),
                        React.createElement('th', { className: "border p-2 text-center whitespace-nowrap" }, "Nilai Representatif")
                    )
                ),
                React.createElement('tbody', null,
                    data.map(item => (
                        React.createElement('tr', { key: item.code },
                            React.createElement('td', { className: "border p-2 whitespace-nowrap" }, `${item.code} (${item.descriptor})`),
                            React.createElement('td', { className: "border p-2 text-center whitespace-nowrap" }, item.range),
                            React.createElement('td', { className: "border p-2 text-center font-bold text-indigo-700 whitespace-nowrap" }, item.value)
                        )
                    ))
                )
            )
        )
    );
};


const GradeSettingsModal = ({ isOpen, onClose, subject, settings, onUpdatePredikats, onUpdateGradeCalculation, onUpdateDisplayMode }) => {
    if (!isOpen) return null;

    const [localPredikats, setLocalPredikats] = useState(settings.predikats);
    const calculationConfig = useMemo(() => settings.gradeCalculation?.[subject.id] || { method: 'rata-rata' }, [settings.gradeCalculation, subject.id]);
    const [localMethod, setLocalMethod] = useState(calculationConfig.method);
    const [localDisplayMode, setLocalDisplayMode] = useState(settings.nilaiDisplayMode || 'kuantitatif & kualitatif');

    const handleSave = () => {
        onUpdatePredikats(localPredikats);
        onUpdateGradeCalculation(subject.id, { ...calculationConfig, method: localMethod });
        if (onUpdateDisplayMode) onUpdateDisplayMode(localDisplayMode);
        onClose();
    };
    
    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" },
                React.createElement('div', { className: "p-5 border-b flex-shrink-0" },
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Pengaturan Nilai & Perhitungan Rapor"),
                    React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, `Pengaturan untuk mata pelajaran: ${subject.fullName}`)
                ),
                React.createElement('div', { className: "p-4 space-y-4 overflow-y-auto" },
                     // Added Display Mode Selection
                     React.createElement('section', null,
                        React.createElement('h4', { className: "text-sm font-bold text-slate-700 mb-2 border-b pb-1" }, "Tampilan Input Nilai"),
                        React.createElement('div', { className: "space-y-2" },
                            ['kuantitatif & kualitatif', 'kuantitatif saja', 'kualitatif saja'].map(mode => {
                                const labels = {
                                    'kuantitatif & kualitatif': 'Tampilan Kartu (Bawaan)',
                                    'kuantitatif saja': 'Tampilan Tabel (Nilai Angka)',
                                    'kualitatif saja': 'Tampilan Tabel (Nilai Kualitatif)',
                                };
                                return React.createElement('label', { key: mode, className: "flex items-center p-2 border rounded-md cursor-pointer hover:bg-slate-50" },
                                    React.createElement('input', { type: "radio", name: "display-mode", value: mode, checked: localDisplayMode === mode, onChange: () => setLocalDisplayMode(mode), className: "h-4 w-4 text-indigo-600" }),
                                    React.createElement('span', { className: "ml-3 text-sm font-medium text-slate-700" }, labels[mode])
                                );
                            })
                        )
                    ),
                     React.createElement('div', { className: "flex flex-col items-center w-full" },
                        React.createElement('h4', { className: "text-sm font-bold text-slate-700 mb-2 text-center w-full border-b pb-1" }, "Rentang Nilai (Predikat)"),
                        React.createElement('div', { className: "space-y-1.5 w-full max-w-[240px]" },
                            ['a', 'b', 'c', 'd'].map(p => (
                                React.createElement('div', { key: p, className: "flex items-center justify-between" },
                                    React.createElement('label', { className: "font-medium text-xs text-slate-600" }, `Predikat ${p.toUpperCase()} (mulai dari)`),
                                    React.createElement('input', { 
                                        type: "number", 
                                        value: localPredikats[p], 
                                        onChange: (e) => setLocalPredikats(prev => ({...prev, [p]: e.target.value})), 
                                        className: `w-16 p-1 border rounded text-center text-xs ${p === 'd' ? 'bg-slate-100' : ''}`,
                                        readOnly: p === 'd'
                                    })
                                )
                            )),
                             React.createElement('p', { className: "text-[10px] text-slate-400 text-center pt-1" }, "Berlaku untuk semua mapel.")
                        )
                    ),
                    React.createElement(QualitativeGradingTable, { settings: settings }),
                    React.createElement('section', null,
                        React.createElement('h4', { className: "text-sm font-bold text-slate-700 mb-2 border-b pb-1" }, "Cara Pengolahan Nilai Akhir Mapel"),
                        React.createElement('div', { className: "space-y-2" },
                            ['rata-rata', 'pembobotan', 'persentase'].map(method => (
                                React.createElement('label', { key: method, className: "flex items-center p-2 border rounded-md cursor-pointer hover:bg-slate-50" },
                                    React.createElement('input', { type: "radio", name: "calc-method", value: method, checked: localMethod === method, onChange: () => setLocalMethod(method), className: "h-4 w-4 text-indigo-600" }),
                                    React.createElement('span', { className: "ml-3 text-sm font-medium text-slate-700" }, 
                                        method === 'rata-rata' ? 'Opsi Rata-Rata' : method === 'pembobotan' ? 'Opsi Pembobotan' : 'Opsi Persentase Ketuntasan'
                                    )
                                )
                            ))
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-end p-4 bg-slate-50 rounded-b-lg border-t flex-shrink-0" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50" }, "Batal"),
                    React.createElement('button', { onClick: handleSave, className: "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700" }, "Simpan Pengaturan")
                )
            )
        )
    );
};

const TPSelectionModal = ({ isOpen, onClose, onApply, subject, gradeNumber }) => {
    const [availableTPs, setAvailableTPs] = useState([]);
    const [selectedTPs, setSelectedTPs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && gradeNumber) {
            setIsLoading(true);
            const fetchTPs = async () => {
                try {
                    const response = await fetch(`/tp${gradeNumber}.json`);
                    if (!response.ok) throw new Error('File not found');
                    const data = await response.json();
                    // Data is now an array of { slm: "...", tp: [...] }
                    setAvailableTPs(data[subject.fullName] || []);
                } catch (error) {
                    console.error("Error fetching TP data:", error);
                    setAvailableTPs([]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTPs();
        } else {
            setAvailableTPs([]);
        }
        setSelectedTPs([]); // Reset selection when modal opens/closes
    }, [isOpen, subject, gradeNumber]);

    const handleCheckboxChange = (tpText) => {
        setSelectedTPs(prev =>
            prev.includes(tpText) ? prev.filter(t => t !== tpText) : [...prev, tpText]
        );
    };

    const handleApply = () => {
        onApply(selectedTPs);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" },
                React.createElement('h3', { className: "text-lg font-bold text-slate-800 p-4 border-b" }, `Pilih Tujuan Pembelajaran untuk ${subject.label}`),
                React.createElement('div', { className: "p-6 overflow-y-auto" },
                    isLoading ? React.createElement('p', null, "Memuat data TP...") :
                    availableTPs.length > 0 ? (
                        React.createElement('div', { className: "space-y-4" },
                            availableTPs.map((slmGroup, index) => (
                                React.createElement('div', { key: index, className: "border rounded-lg" },
                                    React.createElement('h4', { className: "text-md font-semibold text-slate-800 p-3 bg-slate-50 rounded-t-lg border-b" }, slmGroup.slm),
                                    React.createElement('div', { className: "p-3 space-y-3" },
                                        slmGroup.tp.map((tp, tpIndex) => (
                                            React.createElement('label', { key: tpIndex, className: "flex items-start p-2 rounded-md cursor-pointer hover:bg-slate-100" },
                                                React.createElement('input', { type: "checkbox", checked: selectedTPs.includes(tp), onChange: () => handleCheckboxChange(tp), className: "mt-1 h-4 w-4 text-indigo-600" }),
                                                React.createElement('span', { className: "ml-3 text-sm text-slate-700" }, tp)
                                            )
                                        ))
                                    )
                                )
                            ))
                        )
                    ) : React.createElement('p', { className: "text-slate-500" }, `Tidak ada data TP yang ditemukan untuk mata pelajaran ini di Kelas ${gradeNumber}.`)
                ),
                React.createElement('div', { className: "flex justify-end p-4 border-t bg-slate-50" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium bg-white border rounded-md" }, "Batal"),
                    React.createElement('button', { onClick: handleApply, disabled: selectedTPs.length === 0, className: "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md disabled:bg-indigo-300" }, `Tambah ${selectedTPs.length} Pilihan`)
                )
            )
        )
    );
};


const SummativeModal = ({ isOpen, onClose, modalData, students, grades, subject, objectives, onUpdateObjectives, onBulkUpdateGrades, gradeNumber, settings, onUpdateGradeCalculation, showToast }) => {
    if (!isOpen) return null;

    const { type, item } = modalData;
    const isSLM = type === 'slm';
    const calculationConfig = useMemo(() => settings.gradeCalculation?.[subject.id] || { method: 'rata-rata' }, [settings.gradeCalculation, subject.id]);
    const isWeighting = calculationConfig.method === 'pembobotan';
    const weights = useMemo(() => calculationConfig.weights || {}, [calculationConfig]);
    const { qualitativeGradingMap } = settings;

    const [slmName, setSlmName] = useState(isSLM ? item?.name || '' : '');
    const [localObjectives, setLocalObjectives] = useState([]);
    const [isTpSelectionModalOpen, setIsTpSelectionModalOpen] = useState(false);
    
    const [localGrades, setLocalGrades] = useState({});
    const [activeInput, setActiveInput] = useState({});

    const relevantStudents = useMemo(() => {
        if (subject.fullName.startsWith('Pendidikan Agama')) {
            const religion = subject.fullName.match(/\(([^)]+)\)/)?.[1].toLowerCase();
            if (religion) return students.filter(s => s.agama?.toLowerCase() === religion);
        }
        return students;
    }, [students, subject]);

    useEffect(() => {
        if (isOpen) {
            const initialLocalGrades = {};
            students.forEach(student => {
                const studentGrade = grades.find(g => g.studentId === student.id);
                initialLocalGrades[student.id] = JSON.parse(JSON.stringify(studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null }));
            });
            setLocalGrades(initialLocalGrades);
            setActiveInput({});

            if (isSLM && item) {
                const gradeKey = `Kelas ${gradeNumber}`;
                const objectivesForSubject = objectives[gradeKey]?.[subject.fullName] || [];
                const initialTps = objectivesForSubject
                    .filter(obj => obj.slmId === item.id)
                    .map((obj, index) => ({ id: `tp_${index}_${item.id}`, text: obj.text }));
                setLocalObjectives(initialTps);
            }
        }
    }, [isOpen, item, objectives, subject.fullName, gradeNumber, isSLM, students, grades, subject.id]);

    const handleSave = () => {
        if (isSLM) {
            const gradeKey = `Kelas ${gradeNumber}`;
            const existingObjectives = objectives[gradeKey]?.[subject.fullName] || [];
            const otherSlmObjectives = existingObjectives.filter(obj => obj.slmId !== item.id);
            const newSlmObjectives = localObjectives.map(tp => ({ slmId: item.id, text: tp.text }));
            const newObjectivesForSubject = [...otherSlmObjectives, ...newSlmObjectives];
            const newObjectivesObject = {
                ...objectives,
                [gradeKey]: { ...(objectives[gradeKey] || {}), [subject.fullName]: newObjectivesForSubject }
            };
            onUpdateObjectives(newObjectivesObject);
        }

        const updates = Object.entries(localGrades).map(([studentId, newDetailedGrade]) => ({
            studentId,
            subjectId: subject.id,
            newDetailedGrade,
        }));
        onBulkUpdateGrades(updates);

        onClose();
    };

    const handleLocalGradeChange = useCallback((studentId, value, inputType, tpIndex = null) => {
        const key = `${studentId}_${isSLM ? `slm_${item.id}_tp_${tpIndex}` : type}`;
        
        setLocalGrades(prevGrades => {
            const newGrades = { ...prevGrades };
            const studentGrade = JSON.parse(JSON.stringify(newGrades[studentId]));
    
            let finalValue = value;
            
            if (inputType === 'qnt') {
                finalValue = value === '' ? null : parseInt(value, 10);
                if (value !== '' && (isNaN(finalValue) || finalValue < 0 || finalValue > 100)) {
                    return prevGrades;
                }
            } else if (inputType === 'ql') {
                 finalValue = value === '' ? null : value;
            }
    
            if (isSLM) {
                let slm = studentGrade.slm.find(s => s.id === item.id);
                if (!slm) {
                    slm = { id: item.id, name: slmName, scores: Array(localObjectives.length).fill(null) };
                    studentGrade.slm.push(slm);
                }
                while (slm.scores.length < localObjectives.length) {
                    slm.scores.push(null);
                }
                slm.scores[tpIndex] = finalValue;
            } else {
                studentGrade[type] = finalValue;
            }
    
            newGrades[studentId] = studentGrade;
            return newGrades;
        });
        
        if (value !== '' && value !== null) {
             setActiveInput(prev => ({ ...prev, [key]: inputType }));
        } else {
             setActiveInput(prev => {
                 const newState = { ...prev };
                 delete newState[key];
                 return newState;
             });
        }

    }, [isSLM, item, slmName, localObjectives.length]);
    
    const handlePaste = useCallback((e, startStudentId, tpIndex = null) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        // Split rows by newline, preserving empty rows to maintain index alignment
        let pastedRows = pasteData.split(/\r\n|\n|\r/);
        // Remove the last element if it's empty (trailing newline from Excel copy)
        if (pastedRows.length > 0 && pastedRows[pastedRows.length - 1] === '') {
            pastedRows.pop();
        }

        if (pastedRows.length === 0) return;

        const studentIds = relevantStudents.map(s => s.id);
        const startStudentIndex = studentIds.indexOf(startStudentId);

        if (startStudentIndex === -1) return;

        setLocalGrades(prevLocalGrades => {
            const newLocalGrades = JSON.parse(JSON.stringify(prevLocalGrades));
            let updatedCount = 0;

            pastedRows.forEach((pastedValue, rowIndex) => {
                const currentStudentIndex = startStudentIndex + rowIndex;
                if (currentStudentIndex >= studentIds.length) return;

                const studentIdToUpdate = studentIds[currentStudentIndex];
                const studentGradeToUpdate = newLocalGrades[studentIdToUpdate];
                if (!studentGradeToUpdate) return;

                const valuesInRow = pastedValue.split('\t');
                const gradeValueStr = valuesInRow[valuesInRow.length - 1].trim();
                
                // If cell is empty, clear the grade (set to null)
                if (gradeValueStr === '') {
                     updatedCount++; // Count this as an update (clearing)
                     if (isSLM) {
                        let slm = studentGradeToUpdate.slm.find(s => s.id === item.id);
                        if (!slm) {
                            slm = { id: item.id, name: slmName, scores: Array(localObjectives.length).fill(null) };
                            studentGradeToUpdate.slm.push(slm);
                        }
                        while (slm.scores.length < localObjectives.length) {
                           slm.scores.push(null);
                        }
                        if (tpIndex !== null && tpIndex < slm.scores.length) {
                            slm.scores[tpIndex] = null;
                        }
                     } else {
                        studentGradeToUpdate[type] = null;
                     }
                     return; // Done for this row
                }

                let finalValue = null;
                const qualitativeCode = gradeValueStr.toUpperCase();
                if (QUALITATIVE_DESCRIPTORS.hasOwnProperty(qualitativeCode)) {
                    finalValue = qualitativeCode;
                } else {
                    const numericValue = parseInt(gradeValueStr, 10);
                    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
                        finalValue = numericValue;
                    }
                }

                if (finalValue !== null) {
                    updatedCount++;
                    if (isSLM) {
                        let slm = studentGradeToUpdate.slm.find(s => s.id === item.id);
                        if (!slm) {
                            slm = { id: item.id, name: slmName, scores: Array(localObjectives.length).fill(null) };
                            studentGradeToUpdate.slm.push(slm);
                        }
                        while (slm.scores.length < localObjectives.length) {
                           slm.scores.push(null);
                        }
                        if (tpIndex !== null && tpIndex < slm.scores.length) {
                            slm.scores[tpIndex] = finalValue;
                        }
                    } else {
                        studentGradeToUpdate[type] = finalValue;
                    }
                }
            });

            if (updatedCount > 0) {
                showToast(`${updatedCount} nilai berhasil ditempel.`, 'success');
            } else {
                showToast('Tidak ada nilai valid yang ditemukan untuk ditempel.', 'error');
            }

            return newLocalGrades;
        });
    }, [relevantStudents, setLocalGrades, isSLM, item, slmName, localObjectives, type, showToast]);


    const handleWeightChange = (weightType, value, slmId = null, tpIndex = null) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;

        const newWeights = JSON.parse(JSON.stringify(weights)); // Deep copy
        
        if (weightType === 'TP' && slmId !== null && tpIndex !== null) {
            if (!newWeights.TP) newWeights.TP = {};
            if (!newWeights.TP[slmId]) newWeights.TP[slmId] = [];
            newWeights.TP[slmId][tpIndex] = numValue;
        } else if (weightType === 'STS' || weightType === 'SAS') {
            newWeights[weightType] = numValue;
        }

        onUpdateGradeCalculation(subject.id, { ...calculationConfig, weights: newWeights });
    };

    const handleAddManualTp = () => {
        setLocalObjectives(prev => [...prev, { id: `manual_${Date.now()}`, text: '' }]);
    };
    
    const handleUpdateTpText = (id, text) => {
        setLocalObjectives(prev => prev.map(tp => tp.id === id ? { ...tp, text } : tp));
    };

    const handleDeleteTp = (id, index) => {
        setLocalObjectives(prev => prev.filter(tp => tp.id !== id));
        setLocalGrades(prev => {
            const newGrades = JSON.parse(JSON.stringify(prev)); // Deep copy
            for(const studentId in newGrades){
                const slm = newGrades[studentId].slm?.find(s => s.id === item.id);
                if(slm && slm.scores?.length > index) {
                    slm.scores.splice(index, 1);
                }
            }
            return newGrades;
        });

        if (isWeighting) {
            const newWeights = JSON.parse(JSON.stringify(weights));
            if (newWeights.TP && newWeights.TP[item.id]) {
                newWeights.TP[item.id].splice(index, 1);
                onUpdateGradeCalculation(subject.id, { ...calculationConfig, weights: newWeights });
            }
        }
    };
    
    const handleApplyTpSelection = (selectedTexts) => {
        const newTps = selectedTexts.map(text => ({ id: `selected_${Date.now()}_${Math.random()}`, text }));
        setLocalObjectives(prev => [...prev, ...newTps]);
    };
    
    const AutoSizingTextarea = ({ value, onChange, ...props }) => {
        const textareaRef = useRef(null);

        useEffect(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }, [value]);

        return React.createElement('textarea', {
            ref: textareaRef,
            value: value,
            onChange: onChange,
            ...props
        });
    };
    
    const headerRowSpan = isSLM ? (isWeighting ? 3 : 2) : (isWeighting ? 2 : 1);

    return (
        React.createElement(React.Fragment, null,
            React.createElement(TPSelectionModal, { isOpen: isTpSelectionModalOpen, onClose: () => setIsTpSelectionModalOpen(false), onApply: handleApplyTpSelection, subject: subject, gradeNumber: gradeNumber }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" },
                    React.createElement('div', { className: "p-5 border-b flex-shrink-0 flex justify-between items-center" },
                        isSLM ? 
                            React.createElement('input', { type: 'text', value: slmName, onChange: e => setSlmName(e.target.value), placeholder: "Nama Lingkup Materi", className: "text-xl font-bold text-slate-800 border-b-2 border-transparent focus:border-indigo-500 outline-none flex-grow bg-transparent" }) :
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, `Input Nilai ${type.toUpperCase()}`),
                        React.createElement('div', { className: "flex items-center gap-2" },
                            React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50" }, "Batal"),
                            isSLM && React.createElement('button', { onClick: handleAddManualTp, className: "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Ketik TP Manual"),
                            isSLM && React.createElement('button', { onClick: () => setIsTpSelectionModalOpen(true), className: "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Pilih TP dari Data"),
                            React.createElement('button', { onClick: handleSave, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Simpan & Tutup")
                        )
                    ),
                    
                    React.createElement('div', { className: "flex-1 overflow-auto" },
                        isSLM && (
                            React.createElement('div', { className: 'p-4 border-b space-y-2' },
                                localObjectives.map((tp, index) => (
                                    React.createElement('div', { key: tp.id, className: 'flex items-start gap-2' },
                                        React.createElement('span', { className: 'font-bold text-sm text-slate-500 pt-2' }, `TP ${index + 1}:`),
                                        React.createElement(AutoSizingTextarea, {
                                            value: tp.text,
                                            onChange: e => handleUpdateTpText(tp.id, e.target.value),
                                            placeholder: 'Deskripsi Tujuan Pembelajaran',
                                            className: 'flex-grow p-2 border rounded-md text-sm resize-none overflow-hidden',
                                            rows: "1"
                                        }),
                                        React.createElement('button', { onClick: () => handleDeleteTp(tp.id, index), className: 'text-red-500 hover:text-red-700 p-1 text-2xl leading-none flex-shrink-0 mt-1' }, '×')
                                    )
                                ))
                            )
                        ),
                        
                        React.createElement('div', { className: 'overflow-x-auto' },
                            React.createElement('table', { className: "w-full text-sm text-left" },
                                React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-[30]" },
                                    React.createElement('tr', null,
                                        React.createElement('th', { rowSpan: headerRowSpan, className: "px-6 py-3 sticky left-0 z-20 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle border-b" }, "No"),
                                        React.createElement('th', { rowSpan: headerRowSpan, className: "px-6 py-3 align-middle border-b" }, "Nama Siswa"),
                                        isSLM ?
                                            localObjectives.map((_, i) => (
                                                React.createElement('th', { key: `tp-header-${i}`, colSpan: 2, className: "px-2 py-3 text-center border-b border-l" }, `TP ${i + 1}`)
                                            )) :
                                            React.createElement('th', { rowSpan: headerRowSpan, className: "px-2 py-3 text-center align-middle border-b" }, `Nilai ${type.toUpperCase()}`),
                                        isSLM && React.createElement('th', { rowSpan: headerRowSpan, className: "px-4 py-3 text-center bg-slate-200 align-middle border-b border-l" }, "Rata-rata")
                                    ),
                                    isSLM && isWeighting && React.createElement('tr', null,
                                        localObjectives.map((_, i) => (
                                            React.createElement('th', { key: `weight-header-${i}`, colSpan: 2, className: "px-2 py-1 bg-indigo-50 align-middle text-center border-b border-l" },
                                                React.createElement('div', { className: 'flex items-center justify-center gap-1' },
                                                    React.createElement('span', { className: 'text-indigo-900 text-[10px] font-bold' }, 'BOBOT'),
                                                    React.createElement('input', { type: "number", min: 0, max: 100, value: weights.TP?.[item.id]?.[i] ?? '', onChange: (e) => handleWeightChange('TP', e.target.value, item.id, i), className: "w-16 p-1 text-center border-slate-300 rounded-md shadow-sm" })
                                                )
                                            )
                                        ))
                                    ),
                                    isSLM && React.createElement('tr', null,
                                        localObjectives.map((_, i) => (
                                            React.createElement(React.Fragment, { key: `sub-header-${i}` },
                                                React.createElement('th', { className: "px-2 py-2 text-center font-normal border-b border-l" }, "Kuantitatif"),
                                                React.createElement('th', { className: "px-2 py-2 text-center font-normal border-b" }, "Kualitatif")
                                            )
                                        ))
                                    ),
                                    !isSLM && isWeighting && React.createElement('tr', null,
                                        React.createElement('th', { className: "px-2 py-1 bg-indigo-50 align-middle text-center border-b" },
                                            React.createElement('div', { className: 'flex items-center justify-center gap-1' },
                                                React.createElement('span', { className: 'text-indigo-900 text-[10px] font-bold' }, 'BOBOT'),
                                                React.createElement('input', { type: "number", min: 0, max: 100, value: weights[type.toUpperCase()] ?? '', onChange: (e) => handleWeightChange(type.toUpperCase(), e.target.value), className: "w-20 p-2 text-center border-slate-300 rounded-md shadow-sm" })
                                            )
                                        )
                                    )
                                ),
                                React.createElement('tbody', null,
                                    relevantStudents.map((student, index) => {
                                        const studentGrade = localGrades[student.id] || {};
                                        
                                        let average = null;
                                        if (isSLM) {
                                            const slmData = studentGrade.slm?.find(s => s.id === item.id);
                                            const scores = slmData?.scores || [];
                                            const numericScores = scores.map(s => getNumericValue(s, qualitativeGradingMap)).filter(s => s !== null);
                                            if (numericScores.length > 0) {
                                                average = (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(1);
                                            }
                                        }

                                        return React.createElement('tr', { key: student.id, className: "border-b hover:bg-slate-50" },
                                            React.createElement('td', { className: "px-6 py-2 sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                                            React.createElement('td', { className: "px-6 py-2 font-medium" }, student.namaLengkap),
                                            isSLM ? 
                                                localObjectives.map((_, i) => {
                                                    const key = `${student.id}_slm_${item.id}_tp_${i}`;
                                                    const slmData = studentGrade.slm?.find(s => s.id === item.id);
                                                    const value = slmData?.scores?.[i] ?? null;
                                                    
                                                    const active = activeInput[key] || (typeof value === 'string' && QUALITATIVE_DESCRIPTORS[value] ? 'ql' : 'qnt');

                                                    const numericValue = getNumericValue(value, qualitativeGradingMap) ?? '';
                                                    const qualitativeValue = getQualitativeCode(value, settings.predikats);

                                                    return React.createElement(React.Fragment, { key: i },
                                                        React.createElement('td', { className: "px-2 py-1 text-center border-l" },
                                                            React.createElement('input', { type: "number", min:0, max:100, value: numericValue, onChange: (e) => handleLocalGradeChange(student.id, e.target.value, 'qnt', i), onPaste: (e) => handlePaste(e, student.id, i), readOnly: active === 'ql', className: `w-full p-2 text-center border rounded-md ${active === 'qnt' ? 'border-green-500 ring-1 ring-green-500' : (active === 'ql' ? 'border-red-500 bg-red-50' : 'border-slate-300')}` })
                                                        ),
                                                        React.createElement('td', { className: "px-2 py-1 text-center" },
                                                            React.createElement('select', { value: qualitativeValue, onChange: (e) => handleLocalGradeChange(student.id, e.target.value, 'ql', i), className: `w-full p-2 text-xs border rounded-md ${active === 'ql' ? 'border-green-500 ring-1 ring-green-500' : (active === 'qnt' ? 'border-red-500 bg-red-50' : 'border-slate-300')}`},
                                                                React.createElement('option', {value: ''}, '...'),
                                                                Object.keys(QUALITATIVE_DESCRIPTORS).map(code => React.createElement('option', {key: code, value: code}, code))
                                                            )
                                                        )
                                                    );
                                                }) :
                                                React.createElement('td', { className: "px-2 py-1 text-center" }, 
                                                    React.createElement('input', { type: "number", min:0, max:100, value: getNumericValue(studentGrade[type], qualitativeGradingMap) ?? '', onChange: (e) => handleLocalGradeChange(student.id, e.target.value, 'qnt'), onPaste: (e) => handlePaste(e, student.id), className: "w-20 p-2 text-center border rounded-md" })
                                                ),
                                             isSLM && React.createElement('td', { className: "px-4 py-2 text-center font-bold bg-slate-100 border-l" }, average ?? '-')
                                        )
                                    })
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};


const SummativeCard = ({ title, subtitle, onClick, isFilled }) => (
    React.createElement('button', {
        onClick: onClick,
        className: `w-full p-6 border rounded-xl shadow-md text-left hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
            isFilled ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'
        }`
    },
        React.createElement('h4', { className: "text-lg font-bold text-slate-800" }, title),
        React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, subtitle)
    )
);

const NilaiCardView = (props) => {
    // ... (existing code)
    const { subject, students, grades, settings, onUpdateGradeCalculation, onBulkUpdateGrades, onBulkAddSlm, onUpdateLearningObjectives, onUpdatePredikats, onUpdateDisplayMode } = props;
    
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSummativeModalOpen, setIsSummativeModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const gradeNumber = getGradeNumber(settings.nama_kelas);
    const [predefinedSlms, setPredefinedSlms] = useState([]);

    const isSlmFilled = useCallback((slmId) => {
        return grades.some(g => {
            const slm = g.detailedGrades?.[subject.id]?.slm?.find(s => s.id === slmId);
            return slm?.scores?.some(score => score !== null && score !== '');
        });
    }, [grades, subject.id]);

    const isStsFilled = useMemo(() => {
        return grades.some(g => g.detailedGrades?.[subject.id]?.sts !== null && g.detailedGrades?.[subject.id]?.sts !== '');
    }, [grades, subject.id]);

    const isSasFilled = useMemo(() => {
        return grades.some(g => g.detailedGrades?.[subject.id]?.sas !== null && g.detailedGrades?.[subject.id]?.sas !== '');
    }, [grades, subject.id]);

    useEffect(() => {
        if (gradeNumber) {
            const fetchPredefinedSLMs = async () => {
                try {
                    const response = await fetch(`/tp${gradeNumber}.json`);
                    if (!response.ok) throw new Error(`tp${gradeNumber}.json not found`);
                    const data = await response.json();
                    setPredefinedSlms(data[subject.fullName] || []);
                } catch (error) {
                    console.warn(`Could not fetch predefined SLMs for ${subject.fullName}:`, error);
                    setPredefinedSlms([]);
                }
            };
            fetchPredefinedSLMs();
        }
    }, [gradeNumber, subject.fullName]);

    // Use the first student's data as a representative structure for existing SLMs.
    const existingSlms = useMemo(() => {
        if (!students || students.length === 0 || !grades || grades.length === 0) return [];
        const representativeGrade = grades[0];
        return representativeGrade?.detailedGrades?.[subject.id]?.slm || [];
    }, [grades, students, subject.id]);

    const handleOpenModal = (type, item = null) => {
        setModalData({ type, item });
        setIsSummativeModalOpen(true);
    };
    
    const handleOpenPredefinedSlm = (predefinedSlm, index) => {
        const slmId = `slm_predefined_${subject.id}_${index}`;
        const existingSlm = existingSlms.find(s => s.id === slmId);
        
        const slmTemplate = {
            id: slmId,
            name: existingSlm?.name || predefinedSlm.slm, // Use existing name if available
            scores: Array(predefinedSlm.tp.length).fill(null),
        };

        if (!existingSlm) {
            onBulkAddSlm(subject.id, slmTemplate);

            const gradeKey = `Kelas ${gradeNumber}`;
            const existingObjectives = props.learningObjectives[gradeKey]?.[subject.fullName] || [];
            const newSlmObjectives = predefinedSlm.tp.map(tpText => ({ slmId: slmTemplate.id, text: tpText }));
            const otherObjectives = existingObjectives.filter(o => o.slmId !== slmTemplate.id);
            const newObjectivesForSubject = [...otherObjectives, ...newSlmObjectives];
            const newObjectivesObject = {
                ...props.learningObjectives,
                [gradeKey]: {
                    ...(props.learningObjectives[gradeKey] || {}),
                    [subject.fullName]: newObjectivesForSubject
                }
            };
            onUpdateLearningObjectives(newObjectivesObject);
        }
        
        handleOpenModal('slm', slmTemplate);
    };

    const handleAddCustomSlm = () => {
        const newSlmId = `slm_custom_${Date.now()}`;
        const newSlmTemplate = { id: newSlmId, name: `Lingkup Materi Baru`, scores: [] };

        onBulkAddSlm(subject.id, newSlmTemplate);
        handleOpenModal('slm', newSlmTemplate);
    };

    const customSlms = (existingSlms || []).filter(s => !s.id.startsWith(`slm_predefined_${subject.id}_`));

    return (
        React.createElement(React.Fragment, null,
            React.createElement(GradeSettingsModal, { isOpen: isSettingsModalOpen, onClose: () => setIsSettingsModalOpen(false), subject: subject, settings: settings, onUpdatePredikats: onUpdatePredikats, onUpdateGradeCalculation: onUpdateGradeCalculation, onUpdateDisplayMode: onUpdateDisplayMode }),
            React.createElement(SummativeModal, { isOpen: isSummativeModalOpen, onClose: () => setIsSummativeModalOpen(false), modalData: modalData, subject: subject, students: students, grades: grades, onBulkUpdateGrades: onBulkUpdateGrades, objectives: props.learningObjectives, onUpdateObjectives: onUpdateLearningObjectives, gradeNumber: gradeNumber, settings: settings, onUpdateGradeCalculation: onUpdateGradeCalculation, showToast: props.showToast }),
            
            React.createElement('div', { className: "space-y-6" },
                React.createElement('div', { className: "flex justify-end" },
                    React.createElement('button', { onClick: () => setIsSettingsModalOpen(true), className: "px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800" }, "Rentang Nilai & Cara Pengolahan Nilai Rapor")
                ),

                React.createElement('div', { className: "space-y-4" },
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800 border-b pb-2" }, "Sumatif Lingkup Materi (SLM)"),
                    
                    predefinedSlms.map((pSlm, index) => {
                        const slmId = `slm_predefined_${subject.id}_${index}`;
                        const existingSlm = existingSlms.find(s => s.id === slmId);
                        const slmName = existingSlm ? existingSlm.name : pSlm.slm;
                        const isFilled = isSlmFilled(slmId);
                        return React.createElement(SummativeCard, { 
                            key: slmId, 
                            title: slmName, 
                            subtitle: "Klik untuk mengisi nilai TP (Kurikulum)", 
                            onClick: () => handleOpenPredefinedSlm(pSlm, index),
                            isFilled: isFilled
                        });
                    }),
                    
                    customSlms.map(slm => 
                        React.createElement(SummativeCard, { 
                            key: slm.id, 
                            title: slm.name, 
                            subtitle: "Klik untuk mengisi nilai TP (Kustom)", 
                            onClick: () => handleOpenModal('slm', slm),
                            isFilled: isSlmFilled(slm.id)
                        })
                    ),
                    
                    React.createElement('button', { onClick: handleAddCustomSlm, className: "w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400" }, "+ Tambah Lingkup Materi (Di Luar Kurikulum)")
                ),
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    React.createElement(SummativeCard, { title: "Sumatif Tengah Semester (STS)", subtitle: "Klik untuk mengisi nilai STS", onClick: () => handleOpenModal('sts'), isFilled: isStsFilled }),
                    React.createElement(SummativeCard, { title: "Sumatif Akhir Semester (SAS)", subtitle: "Klik untuk mengisi nilai SAS", onClick: () => handleOpenModal('sas'), isFilled: isSasFilled })
                )
            )
        )
    );
};

const ManageSlmModal = ({ isOpen, onClose, onSave, subject, students, grades, learningObjectives, onUpdateLearningObjectives, onBulkUpdateGrades, allSlms, initialActiveIds, showToast, gradeNumber }) => {
    // ... (existing code)
    const [localSlms, setLocalSlms] = useState([]);
    const [localActiveIds, setLocalActiveIds] = useState(new Set());
    const [isTpSelectionModalOpen, setIsTpSelectionModalOpen] = useState(false);
    const [slmForTpSelection, setSlmForTpSelection] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalSlms(JSON.parse(JSON.stringify(allSlms))); // Deep copy
            setLocalActiveIds(new Set(initialActiveIds));
        }
    }, [isOpen, allSlms, initialActiveIds]);

    if (!isOpen) return null;

    const handleToggle = (slmId) => {
        setLocalActiveIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(slmId)) {
                newSet.delete(slmId);
            } else {
                newSet.add(slmId);
            }
            return newSet;
        });
    };

    const handleSlmNameChange = (slmId, newName) => {
        setLocalSlms(prev => prev.map(slm => slm.id === slmId ? { ...slm, name: newName } : slm));
    };

    const handleTpTextChange = (slmId, tpIndex, newText) => {
        setLocalSlms(prev => prev.map(slm => {
            if (slm.id === slmId) {
                const newTps = [...slm.tps];
                newTps[tpIndex] = { ...newTps[tpIndex], text: newText };
                return { ...slm, tps: newTps };
            }
            return slm;
        }));
    };
    
    const handleAddCustomSlm = () => {
        const newSlm = { id: `slm_custom_${Date.now()}`, name: 'Lingkup Materi Baru', tps: [] };
        setLocalSlms(prev => [...prev, newSlm]);
        setLocalActiveIds(prev => new Set(prev).add(newSlm.id));
    };
    
    const handleDeleteSlm = (slmId) => {
        if (window.confirm("Menghapus Lingkup Materi ini juga akan menghapus semua TP dan nilai terkait. Lanjutkan?")) {
            setLocalSlms(prev => prev.filter(slm => slm.id !== slmId));
        }
    };
    
    const handleAddManualTp = (slmId) => {
        setLocalSlms(prev => prev.map(slm => 
            slm.id === slmId ? { ...slm, tps: [...slm.tps, { text: '' }] } : slm
        ));
    };

    const handleDeleteTp = (slmId, tpIndex) => {
        setLocalSlms(prev => prev.map(slm => {
            if (slm.id === slmId) {
                const newTps = [...slm.tps];
                newTps.splice(tpIndex, 1);
                return { ...slm, tps: newTps };
            }
            return slm;
        }));
    };

    const handleOpenTpSelection = (slmId) => {
        setSlmForTpSelection(slmId);
        setIsTpSelectionModalOpen(true);
    };

    const handleApplyTpSelection = (selectedTexts) => {
        if (!slmForTpSelection) return;
        setLocalSlms(prev => prev.map(slm => {
            if (slm.id === slmForTpSelection) {
                const newTps = selectedTexts.map(text => ({ text }));
                return { ...slm, tps: [...slm.tps, ...newTps] };
            }
            return slm;
        }));
    };

    const handleSaveChanges = () => {
        const gradeKey = `Kelas ${gradeNumber}`;

        const allTpsForSubject = localSlms.flatMap(slm => slm.tps.map(tp => ({ slmId: slm.id, text: tp.text })));
        const newLearningObjectives = {
            ...learningObjectives,
            [gradeKey]: { ...(learningObjectives[gradeKey] || {}), [subject.fullName]: allTpsForSubject }
        };
        onUpdateLearningObjectives(newLearningObjectives);

        const updates = [];
        const localSlmIds = new Set(localSlms.map(s => s.id));

        students.forEach(student => {
            const studentGrade = grades.find(g => g.studentId === student.id);
            const detailedGrade = JSON.parse(JSON.stringify(studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null }));
            let hasChanged = false;
            
            localSlms.forEach(localSlm => {
                let gradeSlm = detailedGrade.slm.find(s => s.id === localSlm.id);
                if (gradeSlm) {
                    if (gradeSlm.name !== localSlm.name) {
                        gradeSlm.name = localSlm.name;
                        hasChanged = true;
                    }
                    if (gradeSlm.scores.length !== localSlm.tps.length) {
                        const newScores = Array(localSlm.tps.length).fill(null);
                        for (let i = 0; i < Math.min(gradeSlm.scores.length, newScores.length); i++) {
                            newScores[i] = gradeSlm.scores[i];
                        }
                        gradeSlm.scores = newScores;
                        hasChanged = true;
                    }
                } else {
                    detailedGrade.slm.push({ id: localSlm.id, name: localSlm.name, scores: Array(localSlm.tps.length).fill(null) });
                    hasChanged = true;
                }
            });

            const initialSlmCount = detailedGrade.slm.length;
            detailedGrade.slm = detailedGrade.slm.filter(s => localSlmIds.has(s.id));
            if (detailedGrade.slm.length !== initialSlmCount) {
                hasChanged = true;
            }

            if (hasChanged) {
                updates.push({ studentId: student.id, subjectId: subject.id, newDetailedGrade: detailedGrade });
            }
        });

        if (updates.length > 0) {
            onBulkUpdateGrades(updates);
        }

        onSave.onSaveSlmSettings(Array.from(localActiveIds));
        showToast('Perubahan pada SLM & TP berhasil disimpan.', 'success');
        onClose();
    };

    return (
        React.createElement(React.Fragment, null,
            React.createElement(TPSelectionModal, { 
                isOpen: isTpSelectionModalOpen, 
                onClose: () => setIsTpSelectionModalOpen(false), 
                onApply: handleApplyTpSelection,
                subject: subject,
                gradeNumber: gradeNumber
            }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" },
                    React.createElement('div', { className: "p-4 border-b flex-shrink-0" },
                        React.createElement('h3', { className: "text-lg font-bold text-slate-800" }, `Atur Lingkup Materi & TP untuk ${subject.label}`)
                    ),
                    React.createElement('div', { className: "p-6 space-y-4 overflow-y-auto" },
                        localSlms.length > 0 ? localSlms.map(slm => (
                            React.createElement('div', { key: slm.id, className: "border rounded-lg" },
                                React.createElement('div', { className: "flex items-center p-3 bg-slate-50 rounded-t-lg border-b gap-4" },
                                    React.createElement('label', { className: "relative inline-flex items-center cursor-pointer", title: "Tampilkan/Sembunyikan di tabel" },
                                        React.createElement('input', { type: "checkbox", checked: localActiveIds.has(slm.id), onChange: () => handleToggle(slm.id), className: "sr-only peer" }),
                                        React.createElement('div', { className: "w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" })
                                    ),
                                    React.createElement('input', {
                                        type: "text",
                                        value: slm.name,
                                        onChange: e => handleSlmNameChange(slm.id, e.target.value),
                                        className: "flex-grow text-md font-semibold text-slate-800 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none"
                                    }),
                                    React.createElement('button', { onClick: () => handleDeleteSlm(slm.id), className: 'text-red-500 hover:text-red-700 p-1 text-2xl leading-none flex-shrink-0' }, '×')
                                ),
                                React.createElement('div', { className: "p-4 space-y-2" },
                                    slm.tps.map((tp, index) => (
                                        React.createElement('div', { key: index, className: 'flex items-start gap-2' },
                                            React.createElement('span', { className: 'font-semibold text-xs text-slate-400 pt-2' }, `TP ${index + 1}:`),
                                            React.createElement('textarea', {
                                                value: tp.text,
                                                onChange: e => handleTpTextChange(slm.id, index, e.target.value),
                                                className: 'flex-grow p-1.5 border rounded-md text-sm resize-none',
                                                rows: 2
                                            }),
                                            React.createElement('button', { onClick: () => handleDeleteTp(slm.id, index), className: 'text-red-500 hover:text-red-700 p-1 text-xl leading-none flex-shrink-0 mt-1' }, '×')
                                        )
                                    )),
                                    slm.tps.length === 0 && React.createElement('p', { className: 'text-xs text-slate-400 text-center py-2' }, 'Belum ada Tujuan Pembelajaran.'),
                                    React.createElement('div', { className: "pt-3 border-t flex gap-2 justify-end" },
                                        React.createElement('button', { onClick: () => handleAddManualTp(slm.id), className: "px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200" }, "+ Tambah TP Manual"),
                                        React.createElement('button', { onClick: () => handleOpenTpSelection(slm.id), className: "px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Pilih TP dari Data")
                                    )
                                )
                            )
                        )) : React.createElement('p', { className: 'text-slate-500 text-center py-8' }, "Belum ada Lingkup Materi untuk mata pelajaran ini."),
                        React.createElement('button', { 
                            onClick: handleAddCustomSlm, 
                            className: "w-full mt-4 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400" 
                        }, "+ Tambah Lingkup Materi Baru")
                    ),
                    React.createElement('div', { className: "flex justify-end p-4 border-t bg-slate-50" },
                        React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium bg-white border rounded-md" }, "Batal"),
                        React.createElement('button', { onClick: handleSaveChanges, className: "ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md" }, `Simpan & Terapkan`)
                    )
                )
            )
        )
    );
};

const NilaiTableView = (props) => {
    const { subject, students, grades, settings, learningObjectives, onBulkUpdateGrades, onUpdateLearningObjectives, onUpdateGradeCalculation, mode, showToast, onUpdateSlmVisibility, onUpdateDisplayMode } = props;
    
    const [isManageSlmModalOpen, setIsManageSlmModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for settings modal
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
    const tableContainerRef = useRef(null);

    // NEW: State for predefined SLMs to fix naming issue
    const [predefinedSlms, setPredefinedSlms] = useState([]);

    const gradeNumber = useMemo(() => getGradeNumber(settings.nama_kelas), [settings.nama_kelas]);
    
    // NEW: Effect to fetch predefined SLMs
    useEffect(() => {
        if (gradeNumber) {
            const fetchPredefinedSLMs = async () => {
                try {
                    const response = await fetch(`/tp${gradeNumber}.json`);
                    if (!response.ok) throw new Error(`tp${gradeNumber}.json not found`);
                    const data = await response.json();
                    setPredefinedSlms(data[subject.fullName] || []);
                } catch (error) {
                    console.warn(`Could not fetch predefined SLMs for ${subject.fullName}:`, error);
                    setPredefinedSlms([]);
                }
            };
            fetchPredefinedSLMs();
        }
    }, [gradeNumber, subject.fullName]);

    // Check if weighting is enabled for this subject
    const calculationConfig = useMemo(() => settings.gradeCalculation?.[subject.id] || { method: 'rata-rata' }, [settings.gradeCalculation, subject.id]);
    const isWeighting = calculationConfig.method === 'pembobotan';
    const weights = useMemo(() => calculationConfig.weights || {}, [calculationConfig]);

    const objectivesForSubject = useMemo(() => {
        const gradeKey = `Kelas ${gradeNumber}`;
        return (learningObjectives && learningObjectives[gradeKey] && learningObjectives[gradeKey][subject.fullName]) || [];
    }, [learningObjectives, gradeNumber, subject.fullName]);

    const allSlms = useMemo(() => {
        const slmMap = new Map();
        
        // 1. Get from learning objectives (source of truth for TPs)
        objectivesForSubject.forEach((tp) => {
            if (!slmMap.has(tp.slmId)) {
                // Try to find name in grades[0]
                let slmName = grades.length > 0 ? (grades[0].detailedGrades?.[subject.id]?.slm || []).find(s => s.id === tp.slmId)?.name : null;
                
                // NEW: Fallback to predefinedSlms if name is missing in grades
                if (!slmName && tp.slmId.startsWith(`slm_predefined_${subject.id}_`)) {
                    try {
                        const parts = tp.slmId.split('_');
                        const indexStr = parts[parts.length - 1];
                        const index = parseInt(indexStr, 10);
                        if (!isNaN(index) && predefinedSlms[index]) {
                            slmName = predefinedSlms[index].slm;
                        }
                    } catch(e) {}
                }

                slmMap.set(tp.slmId, { 
                    id: tp.slmId, 
                    name: slmName || `Lingkup Materi (ID: ...${tp.slmId.slice(-4)})`, 
                    tps: [] 
                });
            }
            slmMap.get(tp.slmId).tps.push({ text: tp.text });
        });

        // 2. Get from grades structure (for SLMs without TPs yet, or if learningObjectives is empty)
        const slmsFromGrades = new Map();
        grades.forEach(g => {
            (g.detailedGrades?.[subject.id]?.slm || []).forEach(slm => {
                if(slm && slm.id && !slmsFromGrades.has(slm.id)) {
                    slmsFromGrades.set(slm.id, slm);
                }
            });
        });
        slmsFromGrades.forEach(slm => {
            if (!slmMap.has(slm.id)) {
                slmMap.set(slm.id, { id: slm.id, name: slm.name, tps: [] });
            }
        });

        return Array.from(slmMap.values());
    }, [objectivesForSubject, grades, subject.id, predefinedSlms]); // Added predefinedSlms to dep array
    
    // Initialize activeSlmIds with saved settings or default to all
    const [activeSlmIds, setActiveSlmIds] = useState(() => {
        const savedVisibility = settings.slmVisibility?.[subject.id];
        if (savedVisibility && Array.isArray(savedVisibility)) {
            return savedVisibility;
        }
        return allSlms.map(s => s.id);
    });

    // Ref to track previous allSlms IDs to detect truly new additions
    const prevAllSlmsIdsRef = useRef(allSlms.map(s => s.id));

    useEffect(() => {
        const currentIds = allSlms.map(s => s.id);
        const prevIds = prevAllSlmsIdsRef.current;
        
        // Find IDs that are in current but not in prev (New additions)
        const newIds = currentIds.filter(id => !prevIds.includes(id));
        
        if (newIds.length > 0) {
            setActiveSlmIds(prev => {
                const next = [...prev, ...newIds];
                // Immediately save the updated visibility to settings so it persists
                if (onUpdateSlmVisibility) {
                     onUpdateSlmVisibility(subject.id, next);
                }
                return next;
            });
        }
        
        prevAllSlmsIdsRef.current = currentIds;
    }, [allSlms, subject.id, onUpdateSlmVisibility]);

    const relevantStudents = useMemo(() => {
        if (subject.fullName.startsWith('Pendidikan Agama')) {
            const religion = subject.fullName.match(/\(([^)]+)\)/)?.[1].toLowerCase();
            if (religion) return students.filter(s => s.agama?.toLowerCase() === religion);
        }
        return students;
    }, [students, subject.fullName]);
    
    const { slmHeaders, tpHeaders, columnKeys } = useMemo(() => {
        const slmHeaders = [];
        const tpHeaders = [];
        const columnKeys = [];
        let tpCounter = 0;
        allSlms.forEach(slm => {
            if (activeSlmIds.includes(slm.id)) {
                slmHeaders.push({ id: slm.id, name: slm.name, colSpan: slm.tps.length });
                slm.tps.forEach((tp, index) => {
                    tpCounter++;
                    const header = { slmId: slm.id, tpIndex: index, text: tp.text, displayIndex: tpCounter };
                    tpHeaders.push(header);
                    columnKeys.push(`tp|${slm.id}|${index}`);
                });
            }
        });
        columnKeys.push('sts', 'sas');
        return { slmHeaders, tpHeaders, columnKeys };
    }, [allSlms, activeSlmIds]);

    const handleSaveSlmSettings = (newActiveIds) => {
        setActiveSlmIds(newActiveIds);
        if (onUpdateSlmVisibility) {
            onUpdateSlmVisibility(subject.id, newActiveIds);
        }
    };

    const handleSingleGradeChange = (studentId, value, type, slmId = null, tpIndex = null) => {
        const studentGrade = grades.find(g => g.studentId === studentId);
        const detailedGrade = JSON.parse(JSON.stringify(studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null }));
        
        let finalValue = value === '' ? null : value;

        // Fix: Parse integer if quantitative mode
        if (mode === 'kuantitatif' && finalValue !== null && finalValue !== '') {
            const parsed = parseInt(finalValue, 10);
            finalValue = isNaN(parsed) ? null : parsed;
        }

        if (type === 'tp') {
            let slmToUpdate = detailedGrade.slm.find(s => s.id === slmId);
            if (!slmToUpdate) {
                slmToUpdate = { id: slmId, name: allSlms.find(s=>s.id===slmId)?.name, scores: [] };
                detailedGrade.slm.push(slmToUpdate);
            }
            while(slmToUpdate.scores.length <= tpIndex) {
                slmToUpdate.scores.push(null);
            }
            slmToUpdate.scores[tpIndex] = finalValue;
        } else if (type === 'sts' || type === 'sas') {
            // Already handled by mode check above, but ensure it is stored.
            detailedGrade[type] = finalValue;
        }
        
        onBulkUpdateGrades([{ studentId, subjectId: subject.id, newDetailedGrade: detailedGrade }]);
    };
    
    // New handler for weight changes within the table header
    const handleWeightChange = (weightType, value, slmId = null, tpIndex = null) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;

        const newWeights = JSON.parse(JSON.stringify(weights)); // Deep copy
        
        if (weightType === 'TP' && slmId !== null && tpIndex !== null) {
            if (!newWeights.TP) newWeights.TP = {};
            if (!newWeights.TP[slmId]) newWeights.TP[slmId] = [];
            newWeights.TP[slmId][tpIndex] = numValue;
        } else if (weightType === 'STS' || weightType === 'SAS') {
            newWeights[weightType] = numValue;
        }

        onUpdateGradeCalculation(subject.id, { ...calculationConfig, weights: newWeights });
    };

    const handlePaste = (e, startStudentId, startKey) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        let rows = pasteData.split(/\r\n|\n|\r/);
        if (rows.length > 0 && rows[rows.length - 1] === '') { rows.pop(); }
        if (rows.length === 0) return;

        const startStudentIndex = relevantStudents.findIndex(s => s.id === startStudentId);
        const startColumnIndex = columnKeys.indexOf(startKey);
        if (startStudentIndex === -1 || startColumnIndex === -1) return;

        const updates = [];
        rows.forEach((row, rIndex) => {
            const currentStudentIndex = startStudentIndex + rIndex;
            if (currentStudentIndex >= relevantStudents.length) return;

            const student = relevantStudents[currentStudentIndex];
            const studentGrade = grades.find(g => g.studentId === student.id);
            const detailedGrade = JSON.parse(JSON.stringify(studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null }));
            let hasChanged = false;

            const columns = row.split('\t');
            columns.forEach((val, cIndex) => {
                const currentColumnIndex = startColumnIndex + cIndex;
                if (currentColumnIndex >= columnKeys.length) return;

                const key = columnKeys[currentColumnIndex];
                const cleanVal = val.trim();
                let finalVal = null;

                if(cleanVal !== ''){
                    const upperVal = cleanVal.toUpperCase();
                    if(QUALITATIVE_DESCRIPTORS[upperVal]){
                        finalVal = upperVal;
                    } else {
                        const numVal = parseInt(cleanVal, 10);
                        if(!isNaN(numVal) && numVal >= 0 && numVal <= 100){
                            finalVal = numVal;
                        }
                    }
                }

                if (key.startsWith('tp|')) {
                    const [, slmId, tpIndexStr] = key.split('|');
                    const tpIndex = parseInt(tpIndexStr, 10);
                    let slm = detailedGrade.slm.find(s => s.id === slmId);
                    if (!slm) {
                        slm = { id: slmId, name: allSlms.find(s => s.id === slmId)?.name, scores: [] };
                        detailedGrade.slm.push(slm);
                    }
                    while (slm.scores.length <= tpIndex) { slm.scores.push(null); }
                    slm.scores[tpIndex] = finalVal;
                    hasChanged = true;
                } else if ((key === 'sts' || key === 'sas') && (typeof finalVal === 'number' || finalVal === null)) {
                    detailedGrade[key] = finalVal;
                    hasChanged = true;
                }
            });

            if (hasChanged) {
                updates.push({ studentId: student.id, subjectId: subject.id, newDetailedGrade: detailedGrade });
            }
        });

        if (updates.length > 0) {
            onBulkUpdateGrades(updates);
            showToast(`${updates.length} baris berhasil ditempel.`, 'success');
        }
    };
    
    const showTooltip = (e, text) => {
        if (!tableContainerRef.current) return;
        const targetRect = e.target.getBoundingClientRect();
        const containerRect = tableContainerRef.current.getBoundingClientRect();
        setTooltip({
            visible: true,
            content: text,
            x: targetRect.left - containerRect.left + (targetRect.width / 2),
            y: targetRect.bottom - containerRect.top + 8,
        });
    };

    const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }));
    
    const renderCell = (student, { slmId, tpIndex }, key) => {
        const studentGrade = grades.find(g => g.studentId === student.id);
        const value = studentGrade?.detailedGrades?.[subject.id]?.slm?.find(s => s.id === slmId)?.scores?.[tpIndex] ?? null;

        if (mode === 'kualitatif') {
            const qualitativeCode = getQualitativeCode(value, settings.predikats);
            return React.createElement('select', { 
                value: qualitativeCode, 
                onChange: e => handleSingleGradeChange(student.id, e.target.value, 'tp', slmId, tpIndex),
                onPaste: e => handlePaste(e, student.id, key),
                className: "w-full p-2 text-sm border rounded-md"
            },
                React.createElement('option', { value: "" }, "-"),
                Object.keys(QUALITATIVE_DESCRIPTORS).map(code => React.createElement('option', { key: code, value: code }, code))
            );
        }
        
        const numericValue = getNumericValue(value, settings.qualitativeGradingMap);
        return React.createElement('input', { 
            type: "number", 
            min: 0, 
            max: 100, 
            value: numericValue ?? '', 
            onChange: e => handleSingleGradeChange(student.id, e.target.value, 'tp', slmId, tpIndex),
            onPaste: e => handlePaste(e, student.id, key),
            className: "w-full p-2 text-center border rounded-md"
        });
    };
    
    const renderSummativeCell = (student, type) => {
        const studentGrade = grades.find(g => g.studentId === student.id);
        const value = studentGrade?.detailedGrades?.[subject.id]?.[type] ?? null;
        const numericValue = getNumericValue(value, settings.qualitativeGradingMap);

        if (mode === 'kualitatif') {
             // For qualitative mode on summative exams, we assume input is numeric but display as qualitative or disable?
             // Usually STS/SAS are numeric. If 'kualitatif' mode implies inputs are qualitative, we need conversion back to number for storage if the system expects numbers.
             // Given the complexity and standard practice, let's keep STS/SAS numeric even in qualitative mode view to allow calculation, or disable if not applicable.
             // Re-reading requirement: "kualitatif saja: Tampilan seperti spreadsheet dengan input nilai kualitatif".
             // If STS/SAS must be qualitative, we need a select.
             
            const qualitativeCode = getQualitativeCode(value, settings.predikats);
             return React.createElement('select', { 
                value: qualitativeCode, 
                onChange: e => handleSingleGradeChange(student.id, e.target.value, type), // This will need logic in handleSingleGradeChange to map back if needed, or store as code
                onPaste: e => handlePaste(e, student.id, type),
                className: "w-full p-2 text-sm border rounded-md"
            },
                React.createElement('option', { value: "" }, "-"),
                Object.keys(QUALITATIVE_DESCRIPTORS).map(code => React.createElement('option', { key: code, value: code }, code))
            );
        }

        return React.createElement('input', { 
            type: "number", 
            min: 0, 
            max: 100, 
            value: numericValue ?? '', 
            onChange: e => handleSingleGradeChange(student.id, e.target.value, type),
            onPaste: e => handlePaste(e, student.id, type),
            className: "w-full p-2 text-center border rounded-md"
        });
    }

    return React.createElement('div', { ref: tableContainerRef, className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full flex relative" },
        isManageSlmModalOpen && React.createElement(ManageSlmModal, { 
            isOpen: isManageSlmModalOpen, 
            onClose: () => setIsManageSlmModalOpen(false), 
            onSave: { onSaveSlmSettings: handleSaveSlmSettings, settings },
            subject, students, grades, learningObjectives, onUpdateLearningObjectives, onBulkUpdateGrades,
            allSlms,
            initialActiveIds: activeSlmIds,
            showToast,
            gradeNumber
        }),
        React.createElement(GradeSettingsModal, {
            isOpen: isSettingsModalOpen,
            onClose: () => setIsSettingsModalOpen(false),
            subject: subject,
            settings: settings,
            onUpdatePredikats: props.onUpdatePredikats, // Needs to be passed from parent
            onUpdateGradeCalculation: onUpdateGradeCalculation,
            onUpdateDisplayMode: onUpdateDisplayMode
        }),
        tooltip.visible && React.createElement('div', { className: "tp-tooltip absolute -translate-x-1/2", style: { top: `${tooltip.y}px`, left: `${tooltip.x}px` } }, tooltip.content),
        React.createElement('div', { className: "p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" },
            React.createElement('div', { className: "flex items-center gap-2" },
                React.createElement('button', {
                    onClick: () => setIsSettingsModalOpen(true),
                    className: "px-3 py-1.5 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
                }, "Rentang Nilai & Pengolahan"),
                React.createElement('button', {
                    onClick: () => setIsManageSlmModalOpen(true),
                    className: "px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                }, "Atur Lingkup Materi & TP")
            ),
            React.createElement('p', { className: "text-sm text-slate-500" }, "Tips: Salin data dari Excel dan tempel (paste) ke dalam tabel. Perubahan disimpan otomatis.")
        ),
        React.createElement('div', { className: "flex-1 overflow-auto" },
             React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                // Re-doing header logic to support weight row cleanly
                React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                    React.createElement('tr', null,
                        React.createElement('th', { rowSpan: isWeighting ? 3 : 2, className: "p-2 text-center border-b border-r border-slate-200 w-10 sticky left-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, "No"),
                        React.createElement('th', { rowSpan: isWeighting ? 3 : 2, className: "p-2 border-b border-r border-slate-200 min-w-[200px]" }, "Nama Siswa"),
                        slmHeaders.map(h => React.createElement('th', { key: h.id, colSpan: h.colSpan, className: "p-2 text-center border-b border-l border-slate-200" }, h.name)),
                        React.createElement('th', { rowSpan: isWeighting ? 2 : 2, className: "p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem]" }, 
                            "STS",
                        ),
                        React.createElement('th', { rowSpan: isWeighting ? 2 : 2, className: "p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem]" }, 
                            "SAS",
                        ),
                        React.createElement('th', { rowSpan: isWeighting ? 3 : 2, className: "p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem]" }, "Nilai Akhir")
                    ),
                    React.createElement('tr', null,
                        tpHeaders.map(h => React.createElement('th', { key: `${h.slmId}-${h.tpIndex}`, className: "p-2 text-center border-b border-l border-slate-200 w-20 min-w-[5rem]" },
                            React.createElement('button', { 
                                className: 'tp-header-button',
                                onMouseEnter: (e) => showTooltip(e, h.text),
                                onMouseLeave: hideTooltip
                            }, `TP ${h.displayIndex}`)
                        ))
                    ),
                    isWeighting && React.createElement('tr', null,
                        tpHeaders.map(h => React.createElement('th', { key: `w-${h.slmId}-${h.tpIndex}`, className: "p-1 text-center border-b border-l border-slate-200 bg-indigo-50" },
                            React.createElement('input', { 
                                type: "number", 
                                min: 0, 
                                max: 100, 
                                placeholder: "%",
                                value: weights.TP?.[h.slmId]?.[h.tpIndex] ?? '', 
                                onChange: (e) => handleWeightChange('TP', e.target.value, h.slmId, h.tpIndex), 
                                className: "w-full p-0.5 text-center text-[10px] border-slate-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            })
                        )),
                        React.createElement('th', { className: "p-1 text-center border-b border-l border-slate-200 bg-indigo-50" },
                             React.createElement('input', { 
                                type: "number", 
                                min: 0, 
                                max: 100, 
                                placeholder: "%",
                                value: weights.STS ?? '', 
                                onChange: (e) => handleWeightChange('STS', e.target.value), 
                                className: "w-full p-0.5 text-center text-[10px] border-slate-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            })
                        ),
                        React.createElement('th', { className: "p-1 text-center border-b border-l border-slate-200 bg-indigo-50" },
                             React.createElement('input', { 
                                type: "number", 
                                min: 0, 
                                max: 100, 
                                placeholder: "%",
                                value: weights.SAS ?? '', 
                                onChange: (e) => handleWeightChange('SAS', e.target.value), 
                                className: "w-full p-0.5 text-center text-[10px] border-slate-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            })
                        )
                    )
                ),
                React.createElement('tbody', null,
                    relevantStudents.map((student, index) => {
                        const studentGrade = grades.find(g => g.studentId === student.id);
                        const detailedGrade = studentGrade?.detailedGrades?.[subject.id];

                        // Use the shared calculation function for accurate 'Total' (Final Grade)
                        // Note: 'total' here usually refers to the final grade calculation result.
                        // We need the config to calculate it properly based on weights if enabled.
                        let total = null;
                        if (detailedGrade) {
                             // Temporarily reusing the calculation function from main scope might be hard without prop drilling or duplicating.
                             // Duplicating basic logic for display purposes in table row:
                             // We should probably rely on stored finalGrades or re-calculate on fly.
                             // Re-calculating on fly ensures immediate feedback on weight change.
                             
                             // Simple helper for row calculation
                             const calcRowGrade = () => {
                                 // Logic similar to calculateFinalGrade in App.js but accessible here
                                 // Since we don't have the function, let's just display the stored finalGrade?
                                 // But stored finalGrade updates on save/update. 
                                 // Weights update triggers onUpdateGradeCalculation which updates Settings, not Grades directly.
                                 // However, handleWeightChange calls onUpdateGradeCalculation. App.js handles this by re-calculating grades.
                                 // So studentGrade.finalGrades[subject.id] should be up to date if App.js effect runs.
                                 
                                 return studentGrade.finalGrades?.[subject.id];
                             }
                             total = calcRowGrade();
                        }
                        
                        return React.createElement('tr', { key: student.id, className: "hover:bg-slate-50" },
                            React.createElement('td', { className: "p-2 text-center border-b border-r border-slate-200 sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" }, index + 1),
                            React.createElement('td', { className: "p-2 border-b border-r border-slate-200" }, student.namaLengkap),
                            tpHeaders.map(h => React.createElement('td', { key: `${student.id}-${h.slmId}-${h.tpIndex}`, className: "p-1 border-b border-l border-slate-200 w-20 min-w-[5rem]" },
                                renderCell(student, h, `tp|${h.slmId}|${h.tpIndex}`)
                            )),
                            React.createElement('td', { className: "p-1 border-b border-l border-slate-200 w-20 min-w-[5rem]" }, renderSummativeCell(student, 'sts')),
                            React.createElement('td', { className: "p-1 border-b border-l border-slate-200 w-20 min-w-[5rem]" }, renderSummativeCell(student, 'sas')),
                            React.createElement('td', { className: "p-1 border-b border-l border-slate-200 w-20 min-w-[5rem] text-center font-bold" }, total !== null && total !== undefined ? total : '-')
                        );
                    })
                )
            )
        )
    );
};


const NilaiKeseluruhanView = ({ students, grades, subjects, predikats }) => {
    // ... (existing code)
    const [sortBy, setSortBy] = useState('no');
    const activeSubjects = useMemo(() => subjects.filter((s) => s.active), [subjects]);

    const displaySubjects = useMemo(() => {
        const finalDisplaySubjects = [];
        const addedGroupPrefixes = new Set();
        const groups = [
            { prefix: 'Pendidikan Agama dan Budi Pekerti', base: { id: 'PABP', label: 'PABP', fullName: 'Pendidikan Agama dan Budi Pekerti', active: true } },
            { prefix: 'Seni Budaya', base: { id: 'SB', label: 'SB', fullName: 'Seni Budaya', active: true } },
            { prefix: 'Muatan Lokal', base: { id: 'Mulok', label: 'Mulok', fullName: 'Muatan Lokal', active: true } }
        ];
        for (const subject of activeSubjects) {
            const group = groups.find(g => subject.fullName.startsWith(g.prefix));
            if (group) {
                if (!addedGroupPrefixes.has(group.prefix)) {
                    finalDisplaySubjects.push(group.base);
                    addedGroupPrefixes.add(group.prefix);
                }
            } else finalDisplaySubjects.push(subject);
        }
        const sortOrder = { 'PABP': 1, 'PP': 2, 'BIndo': 3, 'MTK': 4, 'IPAS': 5, 'SB': 6, 'PJOK': 7, 'BIng': 8, 'Mulok': 9 };
        finalDisplaySubjects.sort((a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));
        return finalDisplaySubjects;
    }, [activeSubjects]);

    const processedData = useMemo(() => {
        const predicateCValue = parseInt(predikats?.c, 10);

        const dataWithCalculations = students.map((student, index) => {
            const studentGrades = grades.find((g) => g.studentId === student.id) || { studentId: student.id, detailedGrades: {}, finalGrades: {} };
            
            let hasFailingGrade = false;
            if (!isNaN(predicateCValue)) {
                const studentReligion = student.agama?.trim().toLowerCase();
                const relevantSubjectsForCheck = activeSubjects.filter(subject => {
                    if (subject.fullName.startsWith('Pendidikan Agama dan Budi Pekerti')) {
                        if (!studentReligion) return false;
                        const subjectReligionMatch = subject.fullName.match(/\(([^)]+)\)/);
                        return subjectReligionMatch && subjectReligionMatch[1].trim().toLowerCase() === studentReligion;
                    }
                    return true;
                });

                for (const subject of relevantSubjectsForCheck) {
                    const grade = studentGrades.finalGrades?.[subject.id];
                    if (grade === undefined || grade === null || grade === '' || (typeof grade === 'number' && grade < predicateCValue)) {
                        hasFailingGrade = true;
                        break;
                    }
                }
            }

            let total = 0, subjectCount = 0;
            const displayGrades = displaySubjects.reduce((acc, displaySubject) => {
                let grade;
                if (displaySubject.id === 'PABP') {
                    const studentReligion = student.agama?.trim().toLowerCase();
                    if (studentReligion) {
                        const religionSubject = activeSubjects.find(s => 
                            s.fullName.startsWith('Pendidikan Agama dan Budi Pekerti') && 
                            s.fullName.toLowerCase().includes(`(${studentReligion})`)
                        );
                        if (religionSubject) {
                            grade = studentGrades.finalGrades?.[religionSubject.id];
                        }
                    }
                } else if (['SB', 'Mulok'].includes(displaySubject.id)) {
                    const memberSubjects = activeSubjects.filter((s) => s.fullName.startsWith(displaySubject.fullName));
                    for (const member of memberSubjects) {
                        const memberGrade = studentGrades.finalGrades?.[member.id];
                        if (memberGrade !== undefined && memberGrade !== null) {
                            grade = memberGrade;
                            break;
                        }
                    }
                } else {
                     grade = studentGrades.finalGrades?.[displaySubject.id];
                }

                if (typeof grade === 'number') { total += grade; subjectCount++; }
                acc[displaySubject.id] = grade;
                return acc;
            }, {});

            return { 
                ...student, 
                no: index + 1, 
                grades: displayGrades, 
                total, 
                average: subjectCount > 0 ? (total / subjectCount).toFixed(2) : "0.00",
                hasFailingGrade
            };
        });
        
        const rankedData = [...dataWithCalculations].sort((a, b) => b.total - a.total).reduce((acc, student, index) => {
            const rank = (index > 0 && student.total === acc[index - 1].total) ? acc[index - 1].rank : index + 1;
            acc.push({ ...student, rank: student.total > 0 ? rank : '-' });
            return acc;
        }, []);
        
        const dataWithRanks = dataWithCalculations.map(d => {
            const studentWithRank = rankedData.find(s => s.id === d.id);
            return { ...d, rank: studentWithRank?.rank || '-' };
        });

        if (sortBy === 'rank') {
            return dataWithRanks.sort((a, b) => (a.rank === '-' ? 1 : b.rank === '-' ? -1 : a.rank - b.rank || a.no - b.no));
        }
        return dataWithRanks.sort((a, b) => a.no - b.no);
    }, [students, grades, sortBy, activeSubjects, displaySubjects, predikats]);

    return (
        React.createElement('div', { className: "bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full flex" },
            React.createElement('div', { className: "p-4 border-b border-slate-200 flex justify-end items-center flex-shrink-0" },
                React.createElement('span', { className: "text-sm font-medium text-slate-700 mr-4" }, "Urutkan:"),
                React.createElement('div', { className: "flex items-center gap-4" },
                    React.createElement('label', { className: "flex items-center cursor-pointer" },
                        React.createElement('input', { type: "radio", name: "sort", value: "no", checked: sortBy === 'no', onChange: () => setSortBy('no'), className: "h-4 w-4 text-indigo-600 border-slate-300" }),
                        React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "No. Absen")
                    ),
                    React.createElement('label', { className: "flex items-center cursor-pointer" },
                        React.createElement('input', { type: "radio", name: "sort", value: "rank", checked: sortBy === 'rank', onChange: () => setSortBy('rank'), className: "h-4 w-4 text-indigo-600 border-slate-300" }),
                        React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "Peringkat")
                    )
                )
            ),
            React.createElement('div', { className: "flex-1 overflow-auto" },
                React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-separate border-spacing-0" },
                    React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-30" },
                        React.createElement('tr', null,
                            React.createElement('th', { className: "px-3 py-3 w-10 text-center sticky left-0 z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, sortBy === 'rank' ? 'Peringkat' : 'No'),
                            React.createElement('th', { className: "px-6 py-3 min-w-[200px] border-b border-slate-200" }, "Nama Siswa"),
                            ...displaySubjects.map(s => React.createElement('th', { key: s.id, className: "px-2 py-3 w-20 text-center border-b border-slate-200", title: s.fullName }, s.label)),
                            React.createElement('th', { className: "px-2 py-3 w-20 text-center border-b border-slate-200" }, "Jumlah"),
                            React.createElement('th', { className: "px-2 py-3 w-20 text-center border-b border-slate-200" }, "Rata-rata")
                        )
                    ),
                    React.createElement('tbody', null,
                        processedData.map(data => {
                            const predicateCValue = parseInt(predikats?.c, 10);
                            return (
                                React.createElement('tr', { key: data.id, className: "bg-white hover:bg-slate-50" },
                                    React.createElement('td', { className: "px-3 py-2 text-center font-medium sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-slate-200" }, sortBy === 'rank' ? data.rank : data.no),
                                    React.createElement('th', { className: `px-6 py-2 font-medium whitespace-nowrap border-b border-slate-200 ${data.hasFailingGrade ? 'text-red-600' : 'text-slate-900'}` }, data.namaLengkap),
                                    ...displaySubjects.map(subject => {
                                        const grade = data.grades[subject.id];
                                        const isBelowC = !isNaN(predicateCValue) && typeof grade === 'number' && grade < predicateCValue;
                                        return React.createElement('td', { key: subject.id, className: "px-2 py-1 border-b border-slate-200" },
                                            React.createElement('input', { type: "text", value: grade ?? '', readOnly: true, className: `w-16 p-2 text-center bg-slate-100 border-slate-200 rounded-md cursor-not-allowed ${isBelowC ? 'text-red-600 font-bold' : ''}` })
                                        );
                                    }),
                                    React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800 border-b border-slate-200" }, data.total),
                                    React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800 border-b border-slate-200" }, data.average)
                                )
                            );
                        })
                    )
                )
            )
        )
    );
};


const DataNilaiPage = ({ initialTab, ...props }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'keseluruhan');
    const { subjects, students, settings } = props;
    const activeSubjects = useMemo(() => subjects.filter((s) => s.active), [subjects]);
    const selectedSubject = useMemo(() => activeSubjects.find((s) => s.id === activeTab), [activeTab, activeSubjects]);

    useEffect(() => {
        if (initialTab && initialTab !== 'keseluruhan') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
    const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-sm";

    const renderSubjectView = () => {
        if (!selectedSubject) return null;

        const displayMode = settings.nilaiDisplayMode || 'kuantitatif & kualitatif';
        
        switch (displayMode) {
            case 'kuantitatif saja':
                return React.createElement(NilaiTableView, { ...props, subject: selectedSubject, key: selectedSubject.id, mode: 'kuantitatif' });
            case 'kualitatif saja':
                return React.createElement(NilaiTableView, { ...props, subject: selectedSubject, key: selectedSubject.id, mode: 'kualitatif' });
            default:
                return React.createElement(NilaiCardView, { ...props, subject: selectedSubject, key: selectedSubject.id });
        }
    };

    return (
        React.createElement('div', { className: "flex flex-col h-full gap-4" },
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Nilai"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, 
                    "Kelola nilai sumatif siswa per mata pelajaran untuk perhitungan nilai rapor.",
                    React.createElement('br', null),
                    React.createElement('span', { className: "text-sm text-indigo-600" }, "💡 Tips: Anda dapat menyalin satu kolom nilai dari Excel/Word dan menempelkannya (paste) ke kolom nilai di bawah.")
                )
            ),
            
            students.length === 0 ? (
                React.createElement('div', { className: "bg-white p-10 rounded-xl shadow-md border border-slate-200 text-center" },
                    React.createElement('p', { className: "text-slate-500" }, "Belum ada data siswa. Silakan tambahkan siswa di halaman 'Data Siswa'.")
                )
            ) : (
                React.createElement('div', { className: "flex flex-col flex-1 min-h-0" },
                    React.createElement('div', { className: "flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 flex-shrink-0" },
                        React.createElement('button', { onClick: () => setActiveTab('keseluruhan'), className: activeTab === 'keseluruhan' ? activeButtonClass : inactiveButtonClass }, "Nilai Keseluruhan"),
                        activeSubjects.map((subject) => (
                            React.createElement('button', { key: subject.id, onClick: () => setActiveTab(subject.id), className: activeTab === subject.id ? activeButtonClass : inactiveButtonClass }, subject.label)
                        ))
                    ),
                    React.createElement('div', { className: "flex-1 overflow-y-auto pt-4" },
                        activeTab === 'keseluruhan' ? React.createElement(NilaiKeseluruhanView, props) : renderSubjectView()
                    )
                )
            )
        )
    );
};

export default DataNilaiPage;
