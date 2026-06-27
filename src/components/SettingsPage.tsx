import React from 'react';


import { useSettingsPageLogic } from './Settings/useSettingsPageLogic';

// Modular Sub-components
import { ConfirmationModal } from './Settings/ConfirmationModal';
import { KopSuratEditorModal } from './Settings/KopSuratEditorModal';

import { SettingsProfilTab } from './Settings/SettingsProfilTab';
import { SettingsAkademikTab } from './Settings/SettingsAkademikTab';
import { SettingsMapelTab } from './Settings/SettingsMapelTab';
import { SettingsPenilaianTab } from './Settings/SettingsPenilaianTab';

interface SettingsPageProps {
    settings?: any;
    onSettingsChange?: (e: any) => void;
    onSave?: () => void;
    onUpdateKopLayout?: (elements: any[]) => void;
    subjects?: any[];
    onUpdateSubjects?: (subjects: any[]) => void;
    extracurriculars?: any[];
    onUpdateExtracurriculars?: (extracurriculars: any[]) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    onSettingsChange: propOnSettingsChange, 
    onSave, 
    onUpdateKopLayout: propOnUpdateKopLayout,
    showToast 
}) => {
    const {
        settings,
        subjects,
        extracurriculars,
        setSubjects,
        setExtracurriculars,
        onUpdateKopLayout,
        onSettingsChange,
        isEditorOpen,
        setIsEditorOpen,
        activeTab,
        setActiveTab,
        confirmationModal,
        localClassName,
        getStatus,
        handleLocalClassNameChange,
        commitClassNameChange,
        handleClassNameKeyDown,
        handleKeyDown,
        handleMakeTransparent,
        handleGradeMethodChange,
        tabs,
        onSave: resolvedOnSave,
    } = useSettingsPageLogic({
        onSettingsChange: propOnSettingsChange,
        onSave,
        onUpdateKopLayout: propOnUpdateKopLayout,
        showToast,
    });

    const displayMode = settings.nilaiDisplayMode || 'kuantitatif saja';

    return (
        <>
            <KopSuratEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                settings={settings}
                onSaveLayout={onUpdateKopLayout}
            />
            <ConfirmationModal 
                isOpen={confirmationModal.isOpen}
                onClose={confirmationModal.onClose}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
            >
                {confirmationModal.children}
            </ConfirmationModal>

            <div className="space-y-6 pt-4 sm:pt-8" id="settings-page-root">
                <div className="text-left" id="settings-header">
                    <h2 className="text-3xl font-bold text-slate-800" id="settings-title">Pengaturan</h2>
                    <p className="mt-2 text-slate-600" id="settings-desc">
                        Kelola informasi sekolah, periode akademik, dan data penting lainnya. Perubahan disimpan secara otomatis.
                    </p>
                </div>

                <div className="border-b border-slate-200" id="settings-tab-nav">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id 
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm md:shadow-md border border-slate-200 text-left" id="settings-content-card">
                    <div className="space-y-12">
                        {activeTab === 'profil' && (
                            <SettingsProfilTab
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                resolvedOnSave={resolvedOnSave}
                                handleKeyDown={handleKeyDown}
                                getStatus={getStatus}
                                setIsEditorOpen={setIsEditorOpen}
                            />
                        )}
                        {activeTab === 'akademik' && (
                            <SettingsAkademikTab
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                resolvedOnSave={resolvedOnSave}
                                handleKeyDown={handleKeyDown}
                                getStatus={getStatus}
                                handleMakeTransparent={handleMakeTransparent}
                            />
                        )}
                        {activeTab === 'mapel' && (
                            <SettingsMapelTab
                                settings={settings}
                                subjects={subjects}
                                setSubjects={setSubjects}
                                extracurriculars={extracurriculars}
                                setExtracurriculars={setExtracurriculars}
                            />
                        )}
                        {activeTab === 'penilaian' && (
                            <SettingsPenilaianTab
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                handleGradeMethodChange={handleGradeMethodChange}
                                displayMode={displayMode}
                                localClassName={localClassName}
                                handleLocalClassNameChange={handleLocalClassNameChange}
                                commitClassNameChange={commitClassNameChange}
                                handleClassNameKeyDown={handleClassNameKeyDown}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;
