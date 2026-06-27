import React from 'react';
import { PengaturanMapel } from './PengaturanMapel';
import { PengaturanEkstra } from './PengaturanEkstra';

interface SettingsMapelTabProps {
    settings: any;
    subjects: any[];
    setSubjects: (subjects: any[]) => void;
    extracurriculars: any[];
    setExtracurriculars: (extracurriculars: any[]) => void;
}

export const SettingsMapelTab: React.FC<SettingsMapelTabProps> = ({
    _settings,
    subjects,
    setSubjects,
    extracurriculars,
    setExtracurriculars
}) => {
    return (
        <section className="animate-fade-in space-y-12" id="section-mapel">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Mata Pelajaran</h3>
                                    <PengaturanMapel subjects={subjects} onUpdateSubjects={setSubjects} showToast={showToast} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Ekstrakurikuler</h3>
                                    <PengaturanEkstra extracurriculars={extracurriculars} onUpdateExtracurriculars={setExtracurriculars} showToast={showToast} />
                                </div>
                            </section>
                        );
};
