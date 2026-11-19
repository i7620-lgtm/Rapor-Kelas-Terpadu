import React, { useState, useEffect, useCallback } from 'react';
import { removeImageBackground } from '../../utils/TransliterationUtil';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useClassChangeCascade } from '../../hooks/useClassChangeCascade';
import {
    IMAGE_KEYS,
    dataURLToBlob,
    deleteImageFromDB,
    getImageDimensions,
    processAndCompressImage,
    saveImageToDB,
} from '../../utils/imageDB';

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
        setSettings((s) => ({ ...s, kop_layout: l }));
    });

    const handleImageSettingChange = useCallback(async (key: string, value: string | null) => {
        const prevUrl = useSettingsStore.getState().settings?.[key];

        if (value === null || value === '') {
            if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
                URL.revokeObjectURL(prevUrl);
            }
            setSettings((prev) => ({ ...prev, [key]: null }));
            try {
                await deleteImageFromDB(key);
            } catch (err) {
                console.error(`Failed to delete image ${key} from DB`, err);
            }
            return;
        }

        if (typeof value === 'string' && value.startsWith('data:image')) {
            try {
                const rawBlob = dataURLToBlob(value);
                const dims = getImageDimensions(key);
                const compressedBlob = await processAndCompressImage(rawBlob, dims.width, dims.height);
                await saveImageToDB(key, compressedBlob);
                const objectUrl = URL.createObjectURL(compressedBlob);

                if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(prevUrl);
                }
                setSettings((prev) => ({ ...prev, [key]: objectUrl }));
            } catch (err) {
                console.error(`Failed to compress & persist image ${key}`, err);
                // Fallback so UI preview still works even if compression failed
                setSettings((prev) => ({ ...prev, [key]: value }));
            }
            return;
        }

        setSettings((prev) => ({ ...prev, [key]: value }));
    }, [setSettings]);

    const onSettingsChange = propOnSettingsChange || ((e) => {
        const { name, value, type, checked } = e.target;
        const targetValue = type === "checkbox" ? checked : value;

        if (typeof name === "string" && IMAGE_KEYS.includes(name)) {
            void handleImageSettingChange(name, targetValue);
        } else if (typeof name === "string" && name.includes(".")) {
            const parts = name.split(".");
            setSettings((prev) => {
                const next = { ...prev };
                let pointer: any = next;
                for (let i = 0; i < parts.length - 1; i++) {
                    pointer[parts[i]] = { ...(pointer[parts[i]] || {}) };
                    pointer = pointer[parts[i]];
                }
                pointer[parts[parts.length - 1]] = targetValue;
                return next;
            });
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
        const currentImage = settings[logoKey];
        if (!currentImage) {
            showToast('Tidak ada gambar untuk diproses.', 'error');
            return;
        }

        showToast('Memproses gambar...', 'info');
        try {
            const transparentBase64 = await removeImageBackground(currentImage);
            await handleImageSettingChange(logoKey, transparentBase64);
            showToast('Latar belakang logo berhasil dihapus.', 'success');
        } catch (error: any) {
            console.error('Gagal membuat latar belakang transparan:', error);
            showToast(`Gagal memproses gambar: ${error.message}`, 'error');
        }
    }, [settings, handleImageSettingChange, showToast]);

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
