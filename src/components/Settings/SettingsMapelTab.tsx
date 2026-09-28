import React from 'react';
import { PengaturanMapel } from './PengaturanMapel';
import { PengaturanEkstra } from './PengaturanEkstra';

interface SettingsMapelTabProps {
    settings: any;
    subjects: any[];
    setSubjects: (subjects: any[]) => void;
    extracurriculars: any[];
    setExtracurriculars: (extracurriculars: any[]) => void;
    showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsMapelTab: React.FC<SettingsMapelTabProps> = ({
    settings: _settings,
    subjects,
    setSubjects,
    extracurriculars,
    setExtracurriculars,
    showToast = () => {}
}) => {
    return (
        <section className="animate-fade-in space-y-8" id="section-mapel">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">Mata Pelajaran</h3>
                                    <PengaturanMapel subjects={subjects} onUpdateSubjects={setSubjects} showToast={showToast} />
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">Ekstrakurikuler</h3>
                                    <PengaturanEkstra extracurriculars={extracurriculars} onUpdateExtracurriculars={setExtracurriculars} showToast={showToast} />
                                </div>
                            </section>
                        );
};
