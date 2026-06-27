import React from 'react';
import { QualitativeGradingTable } from './QualitativeGradingTable';

interface SettingsPenilaianTabProps {
    settings: any;
    onSettingsChange: (e: any) => void;
    handleGradeMethodChange: (e: any) => void;
    displayMode: string;
    _localClassName: string;
    _handleLocalClassNameChange: (e: any) => void;
    _commitClassNameChange: () => void;
    _handleClassNameKeyDown: (e: any) => void;
}

export const SettingsPenilaianTab: React.FC<SettingsPenilaianTabProps> = ({
    _settings,
    onSettingsChange,
    handleGradeMethodChange,
    displayMode,
    _localClassName,
    _handleLocalClassNameChange,
    _commitClassNameChange,
    _handleClassNameKeyDown
}) => {
    return (
        <section className="animate-fade-in space-y-12" id="section-penilaian">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">
                                        Tampilan Input Nilai, Rentang Nilai, Penilaian Kualitatif, dan Cara Pengolahan Nilai Akhir Mapel
                                    </h3>
                                
                                    <div className="mb-6">
                                        <h4 className="text-md font-semibold text-slate-700 mb-2">Tampilan Input Nilai</h4>
                                        <p className="text-sm text-slate-600 mb-3">Pilih bagaimana Anda ingin melihat dan memasukkan data nilai per mata pelajaran.</p>
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
                                                    <label key={mode} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                                        <input 
                                                            type="radio" 
                                                            name="nilaiDisplayMode" 
                                                            value={mode} 
                                                            checked={displayMode === mode} 
                                                            onChange={onSettingsChange} 
                                                            className="h-4 w-4 text-indigo-600 mt-1" 
                                                        />
                                                        <div className="ml-3 text-left">
                                                            <span className="block text-sm font-medium text-slate-800">{labels[mode]}</span>
                                                            <span className="block text-sm text-slate-500">{descriptions[mode]}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-6">
                                        <h4 className="text-md font-semibold text-slate-700 mb-4">Rentang Nilai (Predikat)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <FormField 
                                                label={<>Predikat A<br/><span className="text-xs text-slate-500 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.a" 
                                                value={settings.predikats.a} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat B<br/><span className="text-xs text-slate-500 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.b" 
                                                value={settings.predikats.b} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat C<br/><span className="text-xs text-slate-500 font-normal">(KKM, Mulai dari)</span></>} 
                                                id="predikats.c" 
                                                value={settings.predikats.c} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label={<>Predikat D<br/><span className="text-xs text-slate-500 font-normal">(Mulai dari)</span></>} 
                                                id="predikats.d" 
                                                value={settings.predikats.d} 
                                                readOnly={true} 
                                                className="bg-slate-100 font-bold" 
                                            />
                                        </div>
                                        <QualitativeGradingTable settings={settings} />
                                    </div>

                                    <div className="mt-8 border-t pt-6">
                                        <h4 className="text-md font-semibold text-slate-700 mb-2">Cara Pengolahan Nilai Akhir Mapel</h4>
                                        <p className="mb-4 text-xs text-slate-500">
                                            <span className="text-amber-600 font-bold">Catatan:</span> Jika memilih "Pembobotan", silakan atur persentase bobot di menu <strong>Data Nilai</strong> pada masing-masing mata pelajaran.
                                        </p>
                                        <div className="overflow-x-auto border rounded-lg bg-white">
                                            <table className="w-full text-sm text-left text-slate-500">
                                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 sm:px-6 sm:py-3 border-b whitespace-nowrap">Mata Pelajaran</th>
                                                        <th className="px-4 py-3 sm:px-6 sm:py-3 border-b whitespace-nowrap">Metode Pengolahan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subjects.filter((s: any) => s.active).map((sub: any) => (
                                                        <tr key={sub.id} className="bg-white border-b hover:bg-slate-50">
                                                            <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-900 min-w-[150px]">{sub.fullName}</td>
                                                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                                <select
                                                                    value={settings.gradeCalculation?.[sub.id]?.method || 'rata-rata'}
                                                                    onChange={(_e) => handleGradeMethodChange(sub.id, e.target.value)}
                                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 min-w-[200px] outline-none"
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

                                    <div className="animate-fade-in mt-12 pt-8 border-t border-slate-200 mb-2">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2">Preferensi Sistem</h3>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900">Olah Nilai Otomatis</h4>
                                                <p className="text-xs text-slate-500 mt-1 max-w-md">
                                                    Aktifkan pengolahan nilai otomatis dengan rumus persentase di halaman Data Nilai.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.enableAutoRegression || false}
                                                    onChange={(_e) => onSettingsChange({ target: { name: 'enableAutoRegression', value: e.target.checked, type: 'checkbox' } })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900">Pengingat Keluar Aplikasi</h4>
                                                <p className="text-xs text-slate-500 mt-1 max-w-md">
                                                    Tampilkan peringatan saat mencoba menutup tab/browser untuk mengingatkan Anda mengunduh (backup) data.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.enableExitWarning || false}
                                                    onChange={(_e) => onSettingsChange({ target: { name: 'enableExitWarning', value: e.target.checked, type: 'checkbox' } })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>
    );
};
