
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export const getGradeNumber = (str) => {
    if (!str) return null;
    const trimmedStr = str.trim();
    
    // Priority 1: Check for an Arabic numeral at the beginning. Handles "6", "6A", "1 B".
    const arabicMatch = trimmedStr.match(/^\d+/);
    if (arabicMatch) {
        return parseInt(arabicMatch[0], 10);
    }

    // Priority 2: Check for Roman numerals at the beginning.
    // Order is crucial: check for longer strings first (VI before V, IV before I).
    const upperStr = trimmedStr.toUpperCase();
    if (upperStr.startsWith('VI')) return 6;
    if (upperStr.startsWith('V')) return 5;
    if (upperStr.startsWith('IV')) return 4;
    if (upperStr.startsWith('III')) return 3;
    if (upperStr.startsWith('II')) return 2;
    if (upperStr.startsWith('I')) return 1;

    return null;
};

const GradeSettingsModal = ({ isOpen, onClose, subject, settings, onUpdatePredikats, onUpdateGradeCalculation }) => {
    if (!isOpen) return null;

    const [localPredikats, setLocalPredikats] = useState(settings.predikats);
    const calculationConfig = useMemo(() => settings.gradeCalculation?.[subject.id] || { method: 'rata-rata' }, [settings.gradeCalculation, subject.id]);
    const [localMethod, setLocalMethod] = useState(calculationConfig.method);
    const [localWeights, setLocalWeights] = useState(calculationConfig.weights || { slm: 50, sts: 25, sas: 25 });

    const handleSave = () => {
        onUpdatePredikats(localPredikats);
        onUpdateGradeCalculation(subject.id, { method: localMethod, weights: localWeights });
        onClose();
    };

    const handleWeightChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setLocalWeights(prev => ({ ...prev, [name]: numValue }));
        }
    };
    
    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-2xl" },
                React.createElement('div', { className: "p-5 border-b" },
                    React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Pengaturan Nilai & Perhitungan Rapor"),
                    React.createElement('p', { className: "text-sm text-slate-500" }, `Pengaturan untuk mata pelajaran: ${subject.fullName}`)
                ),
                React.createElement('div', { className: "p-6 space-y-8" },
                    React.createElement('section', null,
                        React.createElement('h4', { className: "text-lg font-semibold text-slate-700 mb-4 border-b pb-2" }, "Rentang Nilai (Predikat)"),
                        React.createElement('div', { className: "space-y-4" },
                            ['a', 'b', 'c'].map(p => (
                                React.createElement('div', { key: p, className: "flex items-center justify-between" },
                                    React.createElement('label', { className: "font-medium" }, `Predikat ${p.toUpperCase()} (mulai dari)`),
                                    React.createElement('input', { type: "number", value: localPredikats[p], onChange: (e) => setLocalPredikats(prev => ({...prev, [p]: e.target.value})), className: "w-24 p-2 border rounded-md text-center" })
                                )
                            )),
                             React.createElement('p', { className: "text-xs text-slate-500" }, "Rentang nilai ini berlaku untuk semua mata pelajaran.")
                        )
                    ),
                    React.createElement('section', null,
                        React.createElement('h4', { className: "text-lg font-semibold text-slate-700 mb-4 border-b pb-2" }, "Cara Pengolahan Nilai Akhir Mapel"),
                        React.createElement('div', { className: "space-y-3" },
                            ['rata-rata', 'pembobotan', 'persentase'].map(method => (
                                React.createElement('label', { key: method, className: "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50" },
                                    React.createElement('input', { type: "radio", name: "calc-method", value: method, checked: localMethod === method, onChange: () => setLocalMethod(method), className: "h-5 w-5 text-indigo-600" }),
                                    React.createElement('span', { className: "ml-3 font-medium text-slate-800" }, 
                                        method === 'rata-rata' ? 'Opsi Rata-Rata' : method === 'pembobotan' ? 'Opsi Pembobotan' : 'Opsi Persentase Ketuntasan'
                                    )
                                )
                            ))
                        ),
                        localMethod === 'pembobotan' && (
                            React.createElement('div', { className: "mt-4 p-4 border rounded-lg bg-slate-50 space-y-3" },
                                React.createElement('h5', { className: "font-semibold" }, "Atur Bobot (%)"),
                                React.createElement('div', { className: "flex items-center justify-between" }, React.createElement('label', null, "Rata-rata semua SLM"), React.createElement('input', { name: "slm", type: "number", value: localWeights.slm, onChange: handleWeightChange, className: "w-20 p-1 border rounded text-center" })),
                                React.createElement('div', { className: "flex items-center justify-between" }, React.createElement('label', null, "Nilai STS"), React.createElement('input', { name: "sts", type: "number", value: localWeights.sts, onChange: handleWeightChange, className: "w-20 p-1 border rounded text-center" })),
                                React.createElement('div', { className: "flex items-center justify-between" }, React.createElement('label', null, "Nilai SAS"), React.createElement('input', { name: "sas", type: "number", value: localWeights.sas, onChange: handleWeightChange, className: "w-20 p-1 border rounded text-center" }))
                            )
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-end p-4 bg-slate-50 rounded-b-lg border-t" },
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


const SummativeModal = ({ isOpen, onClose, modalData, students, grades, subject, objectives, onUpdate, onUpdateObjectives, gradeNumber }) => {
    if (!isOpen) return null;

    const { type, item } = modalData;
    const isSLM = type === 'slm';

    const [slmName, setSlmName] = useState(isSLM ? item?.name || '' : '');
    const [localObjectives, setLocalObjectives] = useState([]);
    const [isTpSelectionModalOpen, setIsTpSelectionModalOpen] = useState(false);
    
    useEffect(() => {
        if (isSLM && item) {
            const gradeKey = `Kelas ${gradeNumber}`;
            const objectivesForSubject = objectives[gradeKey]?.[subject.fullName] || [];
            // This logic is now more complex because objectives are grouped.
            // We need to find the TPs that belong to this SLM ID.
            const initialTps = objectivesForSubject
                .filter(obj => obj.slmId === item.id)
                .map((obj, index) => ({ id: `tp_${index}_${item.id}`, text: obj.text }));
            setLocalObjectives(initialTps);
        }
    }, [isOpen, item, objectives, subject.fullName, gradeNumber, isSLM]);

    const handleSave = () => {
        if (isSLM) {
            const gradeKey = `Kelas ${gradeNumber}`;
            // The objectives structure is now [{slm: "...", tp: [...]}]
            // The logic for updating objectives needs to change
            // The current `objectives` state is a flat array of {slmId, text}
            const existingObjectives = objectives[gradeKey]?.[subject.fullName] || [];
            
            // Remove old TPs for this SLM
            const otherSlmObjectives = existingObjectives.filter(obj => obj.slmId !== item.id);
            
            // Create new TPs for this SLM
            const newSlmObjectives = localObjectives.map(tp => ({ slmId: item.id, text: tp.text }));

            const newObjectivesForSubject = [...otherSlmObjectives, ...newSlmObjectives];
            const newObjectivesObject = {
                ...objectives,
                [gradeKey]: {
                    ...(objectives[gradeKey] || {}),
                    [subject.fullName]: newObjectivesForSubject
                }
            };
            onUpdateObjectives(newObjectivesObject);
            
            // Update the name of the SLM across all students
            students.forEach(student => {
                const studentGrade = grades.find(g => g.studentId === student.id);
                const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
                if (detailedGrade) {
                    const updatedSlms = detailedGrade.slm.map(s => s.id === item.id ? { ...s, name: slmName } : s);
                    onUpdate(student.id, subject.id, { type: 'slm', value: updatedSlms });
                }
            });
        }
        onClose();
    };

    const handleGradeChange = (studentId, value, tpIndex) => {
        const numericValue = value === '' ? null : parseInt(value, 10);
        if (value !== '' && (isNaN(numericValue) || numericValue < 0 || numericValue > 100)) return;

        const studentGrade = grades.find(g => g.studentId === studentId) || { detailedGrades: {} };
        const detailedGrade = studentGrade.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null };

        let updateValue;
        if (isSLM) {
            const slmToUpdate = detailedGrade.slm.find(s => s.id === item.id) || { ...item, scores: Array(localObjectives.length).fill(null) };
            const newScores = [...(slmToUpdate.scores || Array(localObjectives.length).fill(null))];
            
            // Ensure scores array is long enough
            while(newScores.length < localObjectives.length) { newScores.push(null); }

            newScores[tpIndex] = numericValue;
            const updatedSlm = { ...slmToUpdate, scores: newScores };
            
            updateValue = detailedGrade.slm.map(s => s.id === item.id ? updatedSlm : s);
            if (!detailedGrade.slm.some(s => s.id === item.id)) {
                updateValue.push(updatedSlm);
            }
        } else { // STS or SAS
            updateValue = numericValue;
        }

        onUpdate(studentId, subject.id, { type, value: updateValue });
    };

    const handleAddManualTp = () => {
        setLocalObjectives(prev => [...prev, { id: `manual_${Date.now()}`, text: '' }]);
    };
    
    const handleUpdateTpText = (id, text) => {
        setLocalObjectives(prev => prev.map(tp => tp.id === id ? { ...tp, text } : tp));
    };

    const handleDeleteTp = (id, index) => {
        setLocalObjectives(prev => prev.filter(tp => tp.id !== id));
        // Also remove the corresponding grade for all students
        students.forEach(student => {
             const studentGrade = grades.find(g => g.studentId === student.id);
             const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
             if(detailedGrade) {
                const slmToUpdate = detailedGrade.slm.find(s => s.id === item.id);
                if (slmToUpdate && slmToUpdate.scores) {
                    const newScores = [...slmToUpdate.scores];
                    newScores.splice(index, 1);
                    const updatedSlm = { ...slmToUpdate, scores: newScores };
                    const updateValue = detailedGrade.slm.map(s => s.id === item.id ? updatedSlm : s);
                    onUpdate(student.id, subject.id, { type: 'slm', value: updateValue });
                }
             }
        });
    };
    
    const handleApplyTpSelection = (selectedTexts) => {
        const newTps = selectedTexts.map(text => ({ id: `selected_${Date.now()}_${Math.random()}`, text }));
        setLocalObjectives(prev => [...prev, ...newTps]);
    };

    const relevantStudents = useMemo(() => {
        if (subject.fullName.startsWith('Pendidikan Agama')) {
            const religion = subject.fullName.match(/\(([^)]+)\)/)?.[1].toLowerCase();
            if (religion) return students.filter(s => s.agama?.toLowerCase() === religion);
        }
        return students;
    }, [students, subject]);

    return (
        React.createElement(React.Fragment, null,
            React.createElement(TPSelectionModal, { isOpen: isTpSelectionModalOpen, onClose: () => setIsTpSelectionModalOpen(false), onApply: handleApplyTpSelection, subject: subject, gradeNumber: gradeNumber }),
            React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" },
                React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" },
                    React.createElement('div', { className: "p-5 border-b flex justify-between items-center" },
                        isSLM ? 
                            React.createElement('input', { type: 'text', value: slmName, onChange: e => setSlmName(e.target.value), placeholder: "Nama Lingkup Materi", className: "text-xl font-bold text-slate-800 border-b-2 border-transparent focus:border-indigo-500 outline-none flex-grow" }) :
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, `Input Nilai ${type.toUpperCase()}`),
                        React.createElement('div', { className: "flex items-center gap-2" },
                            isSLM && React.createElement('button', { onClick: handleAddManualTp, className: "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Ketik TP Manual"),
                            isSLM && React.createElement('button', { onClick: () => setIsTpSelectionModalOpen(true), className: "px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Pilih TP dari Data"),
                            React.createElement('button', { onClick: handleSave, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Simpan & Tutup")
                        )
                    ),
                    isSLM && (
                        React.createElement('div', { className: 'p-4 border-b space-y-2 max-h-48 overflow-y-auto' },
                            localObjectives.map((tp, index) => (
                                React.createElement('div', { key: tp.id, className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'font-bold text-sm text-slate-500' }, `TP ${index + 1}:`),
                                    React.createElement('input', { type: 'text', value: tp.text, onChange: e => handleUpdateTpText(tp.id, e.target.value), placeholder: 'Deskripsi Tujuan Pembelajaran', className: 'flex-grow p-1 border rounded-md text-sm' }),
                                    React.createElement('button', { onClick: () => handleDeleteTp(tp.id, index), className: 'text-red-500 hover:text-red-700' }, '×')
                                )
                            ))
                        )
                    ),
                    React.createElement('div', { className: "overflow-y-auto" },
                        React.createElement('table', { className: "w-full text-sm text-left" },
                            React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100 sticky top-0" },
                                React.createElement('tr', null,
                                    React.createElement('th', { className: "px-6 py-3" }, "No"),
                                    React.createElement('th', { className: "px-6 py-3" }, "Nama Siswa"),
                                    isSLM ? 
                                        localObjectives.map((_, i) => React.createElement('th', { key: i, className: "px-2 py-3 text-center" }, `TP ${i + 1}`)) :
                                        React.createElement('th', { className: "px-2 py-3 text-center" }, `Nilai ${type.toUpperCase()}`),
                                    isSLM && React.createElement('th', { className: "px-4 py-3 text-center bg-slate-200" }, "Rata-rata")
                                )
                            ),
                            React.createElement('tbody', null,
                                relevantStudents.map((student, index) => {
                                    const studentGrade = grades.find(g => g.studentId === student.id);
                                    const detailedGrade = studentGrade?.detailedGrades?.[subject.id];
                                    let slmData, slmAvg;
                                    if (isSLM) {
                                        slmData = detailedGrade?.slm.find(s => s.id === item.id);
                                        const validScores = slmData?.scores?.filter(s => typeof s === 'number') || [];
                                        slmAvg = validScores.length > 0 ? (validScores.reduce((a,b)=>a+b,0)/validScores.length).toFixed(1) : '-';
                                    }
                                    
                                    return React.createElement('tr', { key: student.id, className: "border-b hover:bg-slate-50" },
                                        React.createElement('td', { className: "px-6 py-2" }, index + 1),
                                        React.createElement('td', { className: "px-6 py-2 font-medium" }, student.namaLengkap),
                                        isSLM ? 
                                            localObjectives.map((_, i) => React.createElement('td', { key: i, className: "px-2 py-1 text-center" }, React.createElement('input', { type: "number", min:0, max:100, value: slmData?.scores?.[i] ?? '', onChange: (e) => handleGradeChange(student.id, e.target.value, i), className: "w-20 p-2 text-center border rounded-md" }))) :
                                            React.createElement('td', { className: "px-2 py-1 text-center" }, React.createElement('input', { type: "number", min:0, max:100, value: detailedGrade?.[type] ?? '', onChange: (e) => handleGradeChange(student.id, e.target.value), className: "w-20 p-2 text-center border rounded-md" })),
                                        isSLM && React.createElement('td', { className: "px-4 py-2 text-center font-bold bg-slate-100" }, slmAvg)
                                    )
                                })
                            )
                        )
                    )
                )
            )
        )
    );
};


const SummativeCard = ({ title, subtitle, onClick }) => (
    React.createElement('button', {
        onClick: onClick,
        className: "w-full p-6 bg-white border border-slate-200 rounded-xl shadow-md text-left hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
    },
        React.createElement('h4', { className: "text-lg font-bold text-slate-800" }, title),
        React.createElement('p', { className: "text-sm text-slate-500 mt-1" }, subtitle)
    )
);

const SubjectDetailView = (props) => {
    const { subject, students, grades, settings, onUpdateGradeCalculation, onUpdateDetailedGrade, onUpdateLearningObjectives, onUpdatePredikats } = props;
    
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSummativeModalOpen, setIsSummativeModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const gradeNumber = getGradeNumber(settings.nama_kelas);
    const [predefinedSlms, setPredefinedSlms] = useState([]);

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
        if (!students || students.length === 0) return [];
        return grades.find(g => g.studentId === students[0].id)?.detailedGrades?.[subject.id]?.slm || [];
    }, [grades, students, subject.id]);

    const handleOpenModal = (type, item = null) => {
        setModalData({ type, item });
        setIsSummativeModalOpen(true);
    };
    
    const handleOpenPredefinedSlm = (predefinedSlm, index) => {
        const slmId = `slm_predefined_${subject.id}_${index}`;
        const slmExists = existingSlms.some(s => s.id === slmId);
        
        let slmToOpen;

        if (!slmExists) {
            slmToOpen = {
                id: slmId,
                name: predefinedSlm.slm,
                scores: Array(predefinedSlm.tp.length).fill(null),
            };

            students.forEach(student => {
                const studentGrade = grades.find(g => g.studentId === student.id);
                const detailedGrade = studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null };
                if (!detailedGrade.slm.some(s => s.id === slmId)) {
                    const newSlmForStudent = { ...slmToOpen, scores: [...slmToOpen.scores] };
                    const updatedSlms = [...detailedGrade.slm, newSlmForStudent];
                    onUpdateDetailedGrade(student.id, subject.id, { type: 'slm', value: updatedSlms });
                }
            });

            const gradeKey = `Kelas ${gradeNumber}`;
            const existingObjectives = props.learningObjectives[gradeKey]?.[subject.fullName] || [];
            const newSlmObjectives = predefinedSlm.tp.map(tpText => ({ slmId: slmToOpen.id, text: tpText }));
            const otherObjectives = existingObjectives.filter(o => o.slmId !== slmToOpen.id);
            const newObjectivesForSubject = [...otherObjectives, ...newSlmObjectives];
            const newObjectivesObject = {
                ...props.learningObjectives,
                [gradeKey]: {
                    ...(props.learningObjectives[gradeKey] || {}),
                    [subject.fullName]: newObjectivesForSubject
                }
            };
            onUpdateLearningObjectives(newObjectivesObject);
        } else {
            slmToOpen = existingSlms.find(s => s.id === slmId);
        }
        
        handleOpenModal('slm', slmToOpen);
    };

    const handleAddCustomSlm = () => {
        const newSlmId = `slm_custom_${Date.now()}`;
        const newSlmForModal = { id: newSlmId, name: `Lingkup Materi Baru`, scores: [] };

        students.forEach(student => {
            const studentGrade = grades.find(g => g.studentId === student.id);
            const detailedGrade = studentGrade?.detailedGrades?.[subject.id] || { slm: [], sts: null, sas: null };
            
            const newSlmForStudent = { ...newSlmForModal, scores: [] };
            const updatedSlms = [...detailedGrade.slm, newSlmForStudent];
            onUpdateDetailedGrade(student.id, subject.id, { type: 'slm', value: updatedSlms });
        });
        handleOpenModal('slm', newSlmForModal);
    };

    const customSlms = (existingSlms || []).filter(s => !s.id.startsWith(`slm_predefined_${subject.id}_`));

    return (
        React.createElement(React.Fragment, null,
            React.createElement(GradeSettingsModal, { isOpen: isSettingsModalOpen, onClose: () => setIsSettingsModalOpen(false), subject: subject, settings: settings, onUpdatePredikats: onUpdatePredikats, onUpdateGradeCalculation: onUpdateGradeCalculation }),
            React.createElement(SummativeModal, { isOpen: isSummativeModalOpen, onClose: () => setIsSummativeModalOpen(false), modalData: modalData, subject: subject, students: students, grades: grades, onUpdate: onUpdateDetailedGrade, objectives: props.learningObjectives, onUpdateObjectives: onUpdateLearningObjectives, gradeNumber: gradeNumber }),
            
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
                        return React.createElement(SummativeCard, { 
                            key: slmId, 
                            title: slmName, 
                            subtitle: "Klik untuk mengisi nilai TP (Kurikulum)", 
                            onClick: () => handleOpenPredefinedSlm(pSlm, index)
                        });
                    }),
                    
                    customSlms.map(slm => 
                        React.createElement(SummativeCard, { 
                            key: slm.id, 
                            title: slm.name, 
                            subtitle: "Klik untuk mengisi nilai TP (Kustom)", 
                            onClick: () => handleOpenModal('slm', slm) 
                        })
                    ),
                    
                    React.createElement('button', { onClick: handleAddCustomSlm, className: "w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400" }, "+ Tambah Lingkup Materi (Di Luar Kurikulum)")
                ),
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    React.createElement(SummativeCard, { title: "Sumatif Tengah Semester (STS)", subtitle: "Klik untuk mengisi nilai STS", onClick: () => handleOpenModal('sts') }),
                    React.createElement(SummativeCard, { title: "Sumatif Akhir Semester (SAS)", subtitle: "Klik untuk mengisi nilai SAS", onClick: () => handleOpenModal('sas') })
                )
            )
        )
    );
};

const NilaiKeseluruhanView = ({ students, grades, subjects, predikats }) => {
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
            return dataWithRanks.sort((a, b) => (a.rank === '-' ? 1 : b.rank === '-' ? -1 : a.rank - b.no || a.no - b.no));
        }
        return dataWithRanks.sort((a, b) => a.no - b.no);
    }, [students, grades, sortBy, activeSubjects, displaySubjects, predikats]);

    return (
        React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
            React.createElement('div', { className: "flex justify-end items-center mb-4" }, React.createElement('span', { className: "text-sm font-medium text-slate-700 mr-4" }, "Urutkan:"), React.createElement('div', { className: "flex items-center gap-4" }, React.createElement('label', { className: "flex items-center cursor-pointer" }, React.createElement('input', { type: "radio", name: "sort", value: "no", checked: sortBy === 'no', onChange: () => setSortBy('no'), className: "h-4 w-4 text-indigo-600 border-slate-300" }), React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "No. Absen")), React.createElement('label', { className: "flex items-center cursor-pointer" }, React.createElement('input', { type: "radio", name: "sort", value: "rank", checked: sortBy === 'rank', onChange: () => setSortBy('rank'), className: "h-4 w-4 text-indigo-600 border-slate-300" }), React.createElement('span', { className: "ml-2 text-sm text-slate-600" }, "Peringkat")))),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "w-full text-sm text-left text-slate-500" }, React.createElement('thead', { className: "text-xs text-slate-700 uppercase bg-slate-100" }, React.createElement('tr', null, React.createElement('th', { className: "px-3 py-3 w-10 text-center" }, sortBy === 'rank' ? 'Peringkat' : 'No'), React.createElement('th', { className: "px-6 py-3 min-w-[200px]" }, "Nama Siswa"), ...displaySubjects.map(s => React.createElement('th', { key: s.id, className: "px-2 py-3 w-20 text-center", title: s.fullName }, s.label)), React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "Jumlah"), React.createElement('th', { className: "px-2 py-3 w-20 text-center" }, "Rata-rata"))),
                React.createElement('tbody', null,
                    processedData.map(data => {
                        const predicateCValue = parseInt(predikats?.c, 10);
                        return (
                        React.createElement('tr', { key: data.id, className: "bg-white border-b hover:bg-slate-50" },
                            React.createElement('td', { className: "px-3 py-2 text-center font-medium" }, sortBy === 'rank' ? data.rank : data.no), React.createElement('th', { className: `px-6 py-2 font-medium whitespace-nowrap ${data.hasFailingGrade ? 'text-red-600' : 'text-slate-900'}` }, data.namaLengkap),
                            ...displaySubjects.map(subject => {
                                const grade = data.grades[subject.id];
                                const isBelowC = !isNaN(predicateCValue) && typeof grade === 'number' && grade < predicateCValue;
                                return React.createElement('td', { key: subject.id, className: "px-2 py-1" }, React.createElement('input', { type: "text", value: grade ?? '', readOnly: true, className: `w-16 p-2 text-center bg-slate-100 border-slate-200 rounded-md cursor-not-allowed ${isBelowC ? 'text-red-600 font-bold' : ''}` }));
                            }),
                            React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800" }, data.total), React.createElement('td', { className: "px-2 py-2 text-center font-semibold text-slate-800" }, data.average))
                    )}))
                )
            )
        )
    );
};


const DataNilaiPage = ({ initialTab, ...props }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'keseluruhan');
    const { subjects, students } = props;
    const activeSubjects = useMemo(() => subjects.filter((s) => s.active), [subjects]);
    const selectedSubject = useMemo(() => activeSubjects.find((s) => s.id === activeTab), [activeTab, activeSubjects]);

    useEffect(() => {
        if (initialTab && initialTab !== 'keseluruhan') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
    const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-sm";

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Nilai"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Kelola nilai sumatif siswa per mata pelajaran untuk perhitungan nilai rapor.")
            ),
            
            students.length === 0 ? (
                React.createElement('div', { className: "bg-white p-10 rounded-xl shadow-md border border-slate-200 text-center" },
                    React.createElement('p', { className: "text-slate-500" }, "Belum ada data siswa. Silakan tambahkan siswa di halaman 'Data Siswa'.")
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement('div', { className: "flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4" },
                        React.createElement('button', { onClick: () => setActiveTab('keseluruhan'), className: activeTab === 'keseluruhan' ? activeButtonClass : inactiveButtonClass }, "Nilai Keseluruhan"),
                        activeSubjects.map((subject) => (
                            React.createElement('button', { key: subject.id, onClick: () => setActiveTab(subject.id), className: activeTab === subject.id ? activeButtonClass : inactiveButtonClass }, subject.label)
                        ))
                    ),

                    React.createElement('div', null,
                        activeTab === 'keseluruhan' && React.createElement(NilaiKeseluruhanView, props),
                        selectedSubject && React.createElement(SubjectDetailView, { ...props, subject: selectedSubject, key: selectedSubject.id })
                    )
                )
            )
        )
    );
};

export default DataNilaiPage;
