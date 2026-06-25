import React, { useState, useEffect, useCallback } from 'react';
import { removeImageBackground } from '../TransliterationUtil';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useClassChangeCascade } from '../../hooks/useClassChangeCascade';

interface UseSettingsPageLogicProps {
    onSettingsChange?: (e: any) => void;
    onSave?: () => void;
    onUpdateKopLayout?: (elements: any[]) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const useSettingsPageLogic = ({
    onSettingsChange: propOnSettingsChange,
    onSave,
    onUpdateKopLayout: propOnUpdateKopLayout,
    showToast,
}: UseSettingsPageLogicProps) => {
    const settings = useSettingsStore((state) => state.settings);
    const setSettings = useSettingsStore((state) => state.setSettings);
    const subjects = useSettingsStore((state) => state.subjects);
    const setSubjects = useSettingsStore((state) => state.setSubjects);
    const extracurriculars = useSettingsStore((state) => state.extracurriculars);
    const setExtracurriculars = useSettingsStore((state) => state.setExtracurriculars);

    const { executeClassChangeCascade } = useClassChangeCascade();

    const onUpdateKopLayout = propOnUpdateKopLayout || ((l) => {
        setSettings((s) => {
            const currentSemester = s.semester || "Ganjil";
            const layoutField = currentSemester === "Genap" ? "kop_layout_Genap" : "kop_layout";
            return { ...s, [layoutField]: l };
        });
    });

    const onSettingsChange = propOnSettingsChange || ((e) => {
        const { name, value, type, checked } = e.target;
        const targetValue = type === "checkbox" ? checked : value;
        if (name === "semester" && targetValue !== settings.semester) {
            useSettingsStore.getState().setPendingSemester(targetValue);
            useSettingsStore.getState().setShowSemesterModal(true);
        } else {
            setSettings((prev) => ({ ...prev, [name]: targetValue }));
        }
    });

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profil');
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        children: React.ReactNode;
        onConfirm: () => void;
        onClose: () => void;
    }>({ 
        isOpen: false, 
        title: '', 
        children: null, 
        onConfirm: () => {}, 
        onClose: () => {} 
    });
    const [localClassName, setLocalClassName] = useState(settings.nama_kelas || '');
    
    const getGradeNumber = (str: string) => {
        if (!str) return null;
        const trimmedStr = String(str).trim();
        
        const arabicMatch = trimmedStr.match(/\d+/);
        if (arabicMatch) {
            return parseInt(arabicMatch[0], 10);
        }
    
        const upperStr = trimmedStr.toUpperCase();
        if (upperStr.startsWith('VI')) return 6;
        if (upperStr.startsWith('V')) return 5;
        if (upperStr.startsWith('IV')) return 4;
        if (upperStr.startsWith('III')) return 3;
        if (upperStr.startsWith('II')) return 2;
        if (upperStr.startsWith('I')) return 1;
    
        return null;
    };

    const getStatus = (value: any) => value && String(value).trim() !== '' ? 'good' : 'bad';

    useEffect(() => {
        setLocalClassName(settings.nama_kelas || '');
    }, [settings.nama_kelas]);

    const handleLocalClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalClassName(e.target.value);
    };

    const commitClassNameChange = () => {
        const oldGradeNumber = getGradeNumber(settings.nama_kelas);
        const newGradeNumber = getGradeNumber(localClassName);

        if (localClassName !== settings.nama_kelas) {
            if (oldGradeNumber !== null && newGradeNumber !== null && oldGradeNumber !== newGradeNumber) {
                const handleConfirm = () => {
                    executeClassChangeCascade(localClassName, settings.nama_kelas, showToast);
                    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                };

                const handleClose = () => {
                    setLocalClassName(settings.nama_kelas); // revert change
                    showToast('Perubahan nama kelas dibatalkan.', 'info');
                    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                };

                setConfirmationModal({
                    isOpen: true,
                    title: `Konfirmasi Perubahan Tingkat Kelas`,
                    children: React.createElement('div', { className: 'space-y-3' }, 
                        React.createElement('p', null, `Anda akan mengubah kelas dari `, React.createElement('strong', null, `Kelas ${oldGradeNumber}`), ` ke `, React.createElement('strong', null, `Kelas ${newGradeNumber}`), `.`),
                        React.createElement('div', { className: 'p-3 bg-red-50 border-l-4 border-red-400 text-red-800' }, 
                            React.createElement('strong', { className: 'font-bold' }, `PERHATIAN:`), ` Tindakan ini akan:`),
                        React.createElement('ul', { className: 'list-disc list-inside pl-4 text-slate-500 text-sm' }, 
                            React.createElement('li', null, `Memuat set Lingkup Materi & Tujuan Pembelajaran (SLM & TP) baru untuk Kelas ${newGradeNumber}.`),
                            React.createElement('li', null, React.createElement('strong', null, `MENGHAPUS SEMUA DATA NILAI`), ` yang sudah ada untuk disesuaikan.`)
                        ),
                        React.createElement('p', { className: 'font-semibold' }, `Apakah Anda yakin ingin melanjutkan?`)
                    ),
                    onConfirm: handleConfirm,
                    onClose: handleClose
                });
            } else {
                executeClassChangeCascade(localClassName, settings.nama_kelas, showToast);
                if (onSave) onSave();
            }
        }
    };

    const handleClassNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
            showToast('Perubahan disimpan.', 'success');
        }
    };

    const handleMakeTransparent = useCallback(async (logoKey: string) => {
        const base64String = settings[logoKey];
        if (!base64String) {
            showToast('Tidak ada gambar untuk diproses.', 'error');
            return;
        }

        showToast('Memproses gambar...', 'info');
        try {
            const transparentBase64 = await removeImageBackground(base64String);
            const syntheticEvent = {
                target: {
                    name: logoKey,
                    value: transparentBase64,
                    type: 'file_processed',
                    files: null
                }
            };
            onSettingsChange(syntheticEvent);
            showToast('Latar belakang logo berhasil dihapus.', 'success');
        } catch (error: any) {
            console.error('Gagal membuat latar belakang transparan:', error);
            showToast(`Gagal memproses gambar: ${error.message}`, 'error');
        }
    }, [settings, onSettingsChange, showToast]);

    const handleGradeMethodChange = (subjectId: string, newMethod: string) => {
        const currentCalc = settings.gradeCalculation || {};
        const subjectConfig = currentCalc[subjectId] || {};
        
        const updatedCalc = {
            ...currentCalc,
            [subjectId]: {
                ...subjectConfig,
                method: newMethod,
                weights: subjectConfig.weights || {} 
            }
        };

        onSettingsChange({
            target: {
                name: 'gradeCalculation',
                value: updatedCalc
            }
        });
    };

    const tabs = [
        { id: 'profil', label: 'Profil & Kop Surat' },
        { id: 'akademik', label: 'Akademik & Kelas' },
        { id: 'mapel', label: 'Mata Pelajaran & Ekstra' },
        { id: 'penilaian', label: 'Lanjutan & Sistem' }
    ];

    return {
        settings,
        setSettings,
        subjects,
        setSubjects,
        extracurriculars,
        setExtracurriculars,
        onUpdateKopLayout,
        onSettingsChange,
        isEditorOpen,
        setIsEditorOpen,
        activeTab,
        setActiveTab,
        confirmationModal,
        setConfirmationModal,
        localClassName,
        setLocalClassName,
        getStatus,
        handleLocalClassNameChange,
        commitClassNameChange,
        handleClassNameKeyDown,
        handleKeyDown,
        handleMakeTransparent,
        handleGradeMethodChange,
        tabs,
        onSave,
    };
};
