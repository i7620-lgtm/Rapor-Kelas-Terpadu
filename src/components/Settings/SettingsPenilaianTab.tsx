import React from 'react';
import { QualitativeGradingTable } from './QualitativeGradingTable';
import { FormField } from './FormField';

interface SettingsPenilaianTabProps {
    settings: any;
    onSettingsChange: (e: any) => void;
    handleGradeMethodChange: (e: any) => void;
    displayMode: string;
    localClassName?: string;
    handleLocalClassNameChange?: (e: any) => void;
    commitClassNameChange?: () => void;
    handleClassNameKeyDown?: (e: any) => void;
    resolvedOnSave: () => void;
    handleKeyDown: (e: any) => void;
    subjects: any[];
}

export const SettingsPenilaianTab: React.FC<SettingsPenilaianTabProps> = ({
    settings,
    onSettingsChange,
    handleGradeMethodChange,
    displayMode,
    localClassName: _localClassName,
    handleLocalClassNameChange: _handleLocalClassNameChange,
    commitClassNameChange: _commitClassNameChange,
    handleClassNameKeyDown: _handleClassNameKeyDown,
    resolvedOnSave,
    handleKeyDown,
    subjects
}) => {
    return (
        <section className="animate-fade-in space-y-8" id="section-penilaian">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                                        Tampilan Input Nilai, Rentang Nilai, Penilaian Kualitatif, dan Cara Pengolahan Nilai Akhir Mapel
                                    </h3>
                                
                                    <div className="mb-6">
                                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Tampilan Input Nilai</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Pilih bagaimana Anda ingin melihat dan memasukkan data nilai per mata pelajaran.</p>
                                        <div className="space-y-2">
                                            {['kuantitatif saja', 'kualitatif saja', 'kuantitatif & kualitatif'].map(mode => {
                                                const labels: Record<string, string> = {
                                                    'kuantitatif saja': '1. Tampilan Tabel Kuantitatif (Default)',
                                                    'kualitatif saja': '2. Tampilan Tabel Kualitatif',
                                                    'kuantitatif & kualitatif': '3. Tampilan Kartu (Nilai Kuantitatif dan Kualitatif)',
                                                };
                                                const descriptions: Record<string, string> = {
                                                    'kuantitatif saja': 'Tampilan seperti spreadsheet dengan input nilai angka (0-100).',
                                                    'kualitatif saja': 'Tampilan seperti spreadsheet dengan input nilai kualitatif (BB, MB, BSH, SB).',
                                                    'kuantitatif & kualitatif': 'Tampilan ringkas per lingkup materi, membuka jendela terpisah untuk input nilai.',
                                                };
                                                return (
                                                    <label key={mode} className="flex items-start p-3 min-h-[44px] lg:min-h-0 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                                                        <input 
                                                            type="radio" 
                                                            name="nilaiDisplayMode" 
                                                            value={mode} 
                                                            checked={displayMode === mode} 
                                                            onChange={onSettingsChange} 
                                                            className="h-4 w-4 text-indigo-600 mt-1 shrink-0" 
                                                        />
                                                        <div className="ml-3 text-left">
                                                            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{labels[mode]}</span>
                                                            <span className="block text-sm text-slate-500 dark:text-slate-400">{descriptions[mode]}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-4">Rentang Nilai (Predikat)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <FormField 
                                                label={<>Predikat A<br/><span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.a" 
                                                value={settings.predikats.a} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat B<br/><span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.b" 
                                                value={settings.predikats.b} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat C<br/><span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(KKM, Mulai dari)</span></>} 
                                                id="predikats.c" 
                                                value={settings.predikats.c} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat D<br/><span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.d" 
                                                value={settings.predikats.d} 
                                                readOnly={true} 
                                                className="bg-slate-100 dark:bg-slate-800/80 font-bold tabular-nums" 
                                            />
                                        </div>
                                        <QualitativeGradingTable settings={settings} />
                                    </div>

                                    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Cara Pengolahan Nilai Akhir Mapel</h4>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold">Catatan:</span> Jika memilih "Pembobotan", silakan atur persentase bobot di menu <strong>Data Nilai</strong> pada masing-masing mata pelajaran.
                                        </p>
                                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                                            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                                <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800">
                                                    <tr>
                                                        <th className="px-4 py-3 sm:px-6 sm:py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">Mata Pelajaran</th>
                                                        <th className="px-4 py-3 sm:px-6 sm:py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">Metode Pengolahan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subjects.filter((s: any) => s.active).map((sub: any) => (
                                                        <tr key={sub.id} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                                            <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-900 dark:text-slate-100 min-w-[150px]">{sub.fullName}</td>
                                                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                                <select
                                                                    value={settings.gradeCalculation?.[sub.id]?.method || 'rata-rata'}
                                                                    onChange={(e) => handleGradeMethodChange(sub.id, e.target.value)}
                                                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 min-h-[44px] lg:min-h-0 min-w-[200px] outline-none"
                                                                >
                                                                    <option value="rata-rata">Rata-rata (Standar)</option>
                                                                    <option value="pembobotan">Pembobotan (Bobot TP, STS, SAS)</option>
                                                                    <option value="persentase">Persentase Ketuntasan</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="animate-fade-in mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 mb-2">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 pb-2">Preferensi Sistem</h3>
                                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Olah Nilai Otomatis</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                                                    Aktifkan pengolahan nilai otomatis dengan rumus persentase di halaman Data Nilai.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px] lg:min-h-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.enableAutoRegression === true || settings.enableAutoRegression === 'true' || settings.enableAutoRegression === "true"}
                                                    onChange={(e) => onSettingsChange({ target: { name: 'enableAutoRegression', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:relative after:inline-block after:mt-0.5 after:ml-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Pengingat Keluar Aplikasi</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                                                    Tampilkan peringatan saat mencoba menutup tab/browser untuk mengingatkan Anda mengunduh (backup) data.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px] lg:min-h-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.enableExitWarning === true || settings.enableExitWarning === 'true'}
                                                    onChange={(e) => onSettingsChange({ target: { name: 'enableExitWarning', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:relative after:inline-block after:mt-0.5 after:ml-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>
    );
};
