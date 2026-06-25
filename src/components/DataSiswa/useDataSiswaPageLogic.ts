import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { studentFieldDefinitions } from '../../constants';
import { processAndCropImage3x4 } from '../../utils/imageDB';
import { getClipboardText } from '../../utils/clipboard';
import { useGridSelection } from '../../hooks/useGridSelection';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useAttendanceStore } from '../../stores/useAttendanceStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useExtracurricularStore } from '../../stores/useExtracurricularStore';
import { useCocurricularStore } from '../../stores/useCocurricularStore';
import { useFormativeStore } from '../../stores/useFormativeStore';

const emptyStudent = studentFieldDefinitions.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
}, {});

export const useDataSiswaPageLogic = (props) => {
    const {
        students: propStudents,
        namaKelas: propNamaKelas,
        onBulkSaveStudents: propOnBulkSaveStudents,
        onDeleteStudent: propOnDeleteStudent,
        showToast
    } = props;

    const { storeStudents, setStoreStudents } = useStudentsStore(
        useShallow((state) => ({
            storeStudents: state.students,
            setStoreStudents: state.setStudents,
        }))
    );
    const storeSettings = useSettingsStore(useShallow((state) => state.settings));

    const students = propStudents || storeStudents;
    const settings = storeSettings;
    const namaKelas = propNamaKelas || settings?.nama_kelas || '';
    const onBulkSaveStudents = propOnBulkSaveStudents || setStoreStudents;

    const onDeleteStudent = propOnDeleteStudent || ((studentId) => {
        useStudentsStore.getState().deleteStudent(studentId);
        useNilaiStore.getState().setGrades((prev) => prev.filter((g) => g.studentId !== studentId));
        useAttendanceStore.getState().setAttendance((prev) => prev.filter((a) => a.studentId !== studentId));
        useNotesStore.getState().setNotes((prev) => {
            const newNotes = { ...prev };
            delete newNotes[studentId];
            delete newNotes[`${studentId}_Genap`];
            return newNotes;
        });
        useExtracurricularStore.getState().setStudentExtracurriculars((prev) =>
            prev.filter((e) => e.studentId !== studentId)
        );
        useCocurricularStore.getState().setCocurricularData((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
        useFormativeStore.getState().setFormativeJournal((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localStudents, setLocalStudents] = useState(students || []);

    useEffect(() => {
        setLocalStudents(students || []);
    }, [students]);

    const nameField = studentFieldDefinitions.find(f => f.key === 'namaLengkap');
    const otherFields = studentFieldDefinitions.filter(f => f.key !== 'namaLengkap');
    
    const allEditableFields = useMemo(() => [nameField, ...otherFields], [nameField, otherFields]);

    const {
        isSelecting,
        setIsSelecting,
        getSelectionBounds,
        getSelectionStyle,
        handleMouseDownCell,
        handleMouseEnterCell,
        handleFocusCell
    } = useGridSelection({
        rowsCount: localStudents.length,
        colsCount: allEditableFields.length,
        minColIndex: -1,
        containerClass: 'siswa-table-container',
        onDeleteSelection: (bounds) => {
            let updatedCount = 0;
            const newStudents = [...localStudents];
            for (let r = bounds.minR; r <= bounds.maxR; r++) {
                for (let c = bounds.minC; c <= bounds.maxC; c++) {
                    if (r >= 0 && c >= 0) {
                        const fieldDef = allEditableFields[c];
                        if (fieldDef && fieldDef.type !== 'photo') {
                            const student = newStudents[r];
                            if (student && student[fieldDef.key] !== "") {
                                student[fieldDef.key] = "";
                                updatedCount++;
                            }
                        }
                    }
                }
            }
            if (updatedCount > 0) {
                setLocalStudents(newStudents);
                onBulkSaveStudents(newStudents);
                if (showToast) showToast(`${updatedCount} data berhasil dihapus.`, "success");
            }
        }
    });

    useEffect(() => {
        const handleCopyGlobal = (e) => {
            const bounds = getSelectionBounds();
            if (!bounds) return;

            if (bounds.minR === bounds.maxR && bounds.minC === bounds.maxC) {
                if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT")) {
                    return;
                }
            }

            let tsv = "";
            for (let r = bounds.minR; r <= bounds.maxR; r++) {
                let rowData = [];
                for (let c = bounds.minC; c <= bounds.maxC; c++) {
                    if (r === -1) {
                        if (c === -1) rowData.push("No");
                        else {
                            const field = allEditableFields[c];
                            rowData.push(field ? field.label : "");
                        }
                    } else {
                        const student = localStudents[r];
                        if (student) {
                            if (c === -1) {
                                rowData.push(r + 1);
                            } else {
                                const field = allEditableFields[c];
                                if (field && field.type !== 'photo') {
                                    rowData.push(student[field.key] || "");
                                } else {
                                    rowData.push(""); 
                                }
                            }
                        }
                    }
                }
                tsv += rowData.join("\t") + "\n";
            }

            if (tsv) {
                e.preventDefault();
                e.clipboardData.setData("text/plain", tsv.trimEnd());
                if (showToast) {
                    showToast("Berhasil disalin ke clipboard", "success");
                }
            }
        };

        document.addEventListener("copy", handleCopyGlobal);
        return () => document.removeEventListener("copy", handleCopyGlobal);
    }, [getSelectionBounds, localStudents, allEditableFields, showToast]);

    const handleBulkPhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        showToast(`Memproses ${files.length} foto...`, "info");
        
        let newStudents = [...localStudents];
        let processedCount = 0;
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            const match = file.name.match(/\d+/);
            if (match) {
                const number = parseInt(match[0], 10);
                if (number > 0 && number <= newStudents.length) {
                    try {
                        const base64Data = await processAndCropImage3x4(file as File, 354, 472, 0.9);
                        newStudents[number - 1] = { ...newStudents[number - 1], foto: base64Data };
                        processedCount++;
                    } catch (error) {
                        console.error(`Failed to process photo ${file.name}`, error);
                    }
                }
            }
        }
        
        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
        
        if (processedCount > 0) {
            showToast(`Berhasil memproses ${processedCount} foto siswa.`, "success");
        } else {
            showToast("Tidak ada foto yang terpeta ke nomor absen. Pastikan nama file mengandung nomor absen.", "error");
        }
        
        e.target.value = '';
    };

    const handleAddNew = () => {
        setIsModalOpen(true);
    };
    
    const handleBulkAdd = (count) => {
        const newStudents = [];
        const timestamp = Date.now();
        for (let i = 0; i < count; i++) {
            newStudents.push({
                ...emptyStudent,
                id: `student_${timestamp}_${i}`
            });
        }
        
        const updatedStudents = [...localStudents, ...newStudents];
        setLocalStudents(updatedStudents);
        onBulkSaveStudents(updatedStudents);
        showToast(`${count} baris siswa baru berhasil ditambahkan.`, 'success');
    };

    const handleMoveStudent = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === localStudents.length - 1)) return;
        
        const newStudents = [...localStudents];
        const temp = newStudents[index];
        newStudents[index] = newStudents[index + direction];
        newStudents[index + direction] = temp;
        
        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
    };

    const handleDelete = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa ${student?.namaLengkap || 'ini'}? Tindakan ini tidak dapat diurungkan.`)) {
            onDeleteStudent(studentId);
            if (showToast) showToast('Siswa berhasil dihapus.', 'success');
        }
    };

    const handleInputChange = (studentId, fieldKey, value) => {
        setLocalStudents(prev => 
            prev.map(s => s.id === studentId ? { ...s, [fieldKey]: value } : s)
        );
    };

    const handleInputBlur = () => {
        onBulkSaveStudents(localStudents);
    };

    const handlePaste = async (e, startStudentId, startFieldKey) => {
        e.preventDefault();
        const pasteData = await getClipboardText(e);
        
        if (!pasteData) return;
        
        let rows = pasteData.split(/\r\n|\n|\r/);
        if (rows.length > 0 && rows[rows.length - 1] === '') {
            rows.pop();
        }

        if (rows.length === 0) return;

        const startStudentIndex = localStudents.findIndex(s => s.id === startStudentId);
        const startFieldIndex = allEditableFields.findIndex(f => f.key === startFieldKey);

        if (startStudentIndex === -1 || startFieldIndex === -1) return;

        const newStudents = [...localStudents];
        let updatedCount = 0;

        rows.forEach((row, rIndex) => {
            const currentStudentIndex = startStudentIndex + rIndex;
            if (currentStudentIndex >= newStudents.length) return;

            const columns = row.split('\t');

            columns.forEach((value, cIndex) => {
                const currentFieldIndex = startFieldIndex + cIndex;
                if (currentFieldIndex >= allEditableFields.length) return;

                const targetField = allEditableFields[currentFieldIndex];
                const rawValue = value.trim();

                newStudents[currentStudentIndex] = {
                    ...newStudents[currentStudentIndex],
                    [targetField.key]: rawValue
                };
                updatedCount++;
            });
        });

        setLocalStudents(newStudents);
        onBulkSaveStudents(newStudents);
        showToast(`${updatedCount} data berhasil ditempel (paste).`, 'success');
    };

    return {
        students: localStudents,
        namaKelas,
        isModalOpen,
        setIsModalOpen,
        handleAddNew,
        handleBulkAdd,
        handleMoveStudent,
        handleDelete,
        handleInputChange,
        handleInputBlur,
        handlePaste,
        handleBulkPhotoUpload,
        isSelecting,
        setIsSelecting,
        getSelectionStyle,
        handleMouseDownCell,
        handleMouseEnterCell,
        handleFocusCell,
        nameField,
        otherFields,
        setLocalStudents,
        onBulkSaveStudents
    };
};
