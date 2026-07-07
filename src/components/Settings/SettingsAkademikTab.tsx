import React from 'react';
import { FormField } from './FormField';
import { FileInputField } from './FileInputField';
import { getTanggalRaporKey, getTanggalRaporValue, getContextualKey, getContextualValue } from '../../constants';

interface SettingsAkademikTabProps {
    settings: any;
    onSettingsChange: (e: any) => void;
    resolvedOnSave: () => void;
    handleKeyDown: (e: any) => void;
    getStatus: (value: any) => any;
    handleMakeTransparent: (id: string) => void;
    localClassName: string;
    handleLocalClassNameChange: (e: any) => void;
    commitClassNameChange: () => void;
    handleClassNameKeyDown: (e: any) => void;
}

export const SettingsAkademikTab: React.FC<SettingsAkademikTabProps> = ({
    settings,
    onSettingsChange,
    resolvedOnSave,
    handleKeyDown,
    getStatus,
    handleMakeTransparent,
    localClassName,
    handleLocalClassNameChange,
    commitClassNameChange,
    handleClassNameKeyDown
}) => {
    return (
        <section className="animate-fade-in space-y-8" id="section-akademik">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                    {/* Kolom 1: Periode Akademik */}
                                    <div className="flex flex-col gap-4 h-full">
                                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-2">Periode Akademik</h3>
                                        <FormField 
                                            label="Nama Kelas" 
                                            id="nama_kelas" 
                                            placeholder="e.g. 6a atau 6A atau VIA" 
                                            value={localClassName}
                                            status={getStatus(localClassName)}
                                            onChange={handleLocalClassNameChange}
                                            onBlur={commitClassNameChange}
                                            onKeyDown={handleClassNameKeyDown} 
                                        />
                                        <FormField 
                                            label="Tahun Ajaran" 
                                            id="tahun_ajaran" 
                                            placeholder="e.g. 2023/2024" 
                                            value={settings.tahun_ajaran} 
                                            status={getStatus(settings.tahun_ajaran)} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <div>
                                            <label htmlFor="semester" className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                                            <select 
                                                id="semester" 
                                                name="semester" 
                                                value={settings.semester || ''} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                className={`w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:ring-1 sm:text-sm text-slate-900 focus:outline-none ${
                                                    getStatus(settings.semester) === 'bad' 
                                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500' 
                                                        : 'border-green-500 focus:ring-green-500 focus:border-green-500 ring-1 ring-green-500'
                                                }`}
                                            >
                                                <option value="">Pilih Semester...</option>
                                                <option value="Ganjil">Ganjil</option>
                                                <option value="Genap">Genap</option>
                                            </select>
                                        </div>
                                        
                                        <FormField 
                                            label="Tempat, Tanggal Rapor" 
                                            id={getTanggalRaporKey(settings)} 
                                            placeholder="e.g. Jakarta, 22 Juni 2024" 
                                            value={getTanggalRaporValue(settings) || ""}  
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                    {/* Kolom 2: Kepala Sekolah dan Guru */}
                                    <div className="flex flex-col gap-4 h-full">
                                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-2">Kepala Sekolah dan Guru</h3>
                                        <FormField 
                                            label="Nama Kepala Sekolah" 
                                            id={getContextualKey(settings, 'nama_kepala_sekolah')} 
                                            value={getContextualValue(settings, 'nama_kepala_sekolah')} 
                                            status={getStatus(settings.nama_kepala_sekolah)} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <div className="w-full text-left">
                                            <label htmlFor="nip_kepala_sekolah" className="block text-sm font-medium text-slate-700 mb-1">Tipe dan Nomor Pengenal Kepsek</label>
                                            <div className="flex gap-2 w-full">
                                                <div className="w-24 flex-shrink-0">
                                                    <select 
                                                        id={getContextualKey(settings, 'nip_label_kepala_sekolah')} 
                                                        name={getContextualKey(settings, 'nip_label_kepala_sekolah')} 
                                                        value={getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP'} 
                                                        onChange={onSettingsChange} 
                                                        onBlur={resolvedOnSave} 
                                                        className={`w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:ring-1 sm:text-sm text-slate-900 focus:outline-none ${
                                                            getStatus(settings.nip_kepala_sekolah) === 'bad' 
                                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500" 
                                                            : getStatus(settings.nip_kepala_sekolah) === 'good' 
                                                            ? "border-green-500 focus:ring-green-500 focus:border-green-500 ring-1 ring-green-500" 
                                                            : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                                        }`}
                                                    >
                                                        <option value="NIP">NIP</option>
                                                        <option value="NIPPPK">NIPPPK</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <div 
                                                        className={`flex items-center w-full border rounded-md shadow-sm focus-within:ring-1 overflow-hidden bg-white ${
                                                            getStatus(settings.nip_kepala_sekolah) === 'bad' 
                                                            ? "border-red-500 focus-within:ring-red-500 focus-within:border-red-500 ring-1 ring-red-500" 
                                                            : getStatus(settings.nip_kepala_sekolah) === 'good' 
                                                            ? "border-green-500 focus-within:ring-green-500 focus-within:border-green-500 ring-1 ring-green-500" 
                                                            : "border-slate-300 focus-within:ring-indigo-500 focus-within:border-indigo-500"
                                                        }`} 
                                                    >
                                                        <input 
                                                            type="text"
                                                            id={getContextualKey(settings, 'nip_kepala_sekolah')}
                                                            name={getContextualKey(settings, 'nip_kepala_sekolah')}
                                                            value={getContextualValue(settings, 'nip_kepala_sekolah') ?? ''}
                                                            onChange={onSettingsChange}
                                                            onBlur={resolvedOnSave}
                                                            onKeyDown={handleKeyDown}
                                                            className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none sm:text-sm text-slate-900 placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <FormField 
                                            label="Nama Wali Kelas" 
                                            id={getContextualKey(settings, 'nama_wali_kelas')} 
                                            value={getContextualValue(settings, 'nama_wali_kelas')} 
                                            status={getStatus(settings.nama_wali_kelas)} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <div className="w-full text-left">
                                            <label htmlFor="nip_wali_kelas" className="block text-sm font-medium text-slate-700 mb-1">Tipe dan Nomor Pengenal Wali Kelas</label>
                                            <div className="flex gap-2 w-full">
                                                <div className="w-24 flex-shrink-0">
                                                    <select 
                                                        id={getContextualKey(settings, 'nip_label_wali_kelas')} 
                                                        name={getContextualKey(settings, 'nip_label_wali_kelas')} 
                                                        value={getContextualValue(settings, 'nip_label_wali_kelas') || 'NIP'} 
                                                        onChange={onSettingsChange} 
                                                        onBlur={resolvedOnSave} 
                                                        className={`w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:ring-1 sm:text-sm text-slate-900 focus:outline-none ${
                                                            getStatus(settings.nip_wali_kelas) === 'bad' 
                                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500" 
                                                            : getStatus(settings.nip_wali_kelas) === 'good' 
                                                            ? "border-green-500 focus:ring-green-500 focus:border-green-500 ring-1 ring-green-500" 
                                                            : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                                        }`}
                                                    >
                                                        <option value="NIP">NIP</option>
                                                        <option value="NIPPPK">NIPPPK</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <div 
                                                        className={`flex items-center w-full border rounded-md shadow-sm focus-within:ring-1 overflow-hidden bg-white ${
                                                            getStatus(settings.nip_wali_kelas) === 'bad' 
                                                            ? "border-red-500 focus-within:ring-red-500 focus-within:border-red-500 ring-1 ring-red-500" 
                                                            : getStatus(settings.nip_wali_kelas) === 'good' 
                                                            ? "border-green-500 focus-within:ring-green-500 focus-within:border-green-500 ring-1 ring-green-500" 
                                                            : "border-slate-300 focus-within:ring-indigo-500 focus-within:border-indigo-500"
                                                        }`} 
                                                    >
                                                        <input 
                                                            type="text"
                                                            id={getContextualKey(settings, 'nip_wali_kelas')}
                                                            name={getContextualKey(settings, 'nip_wali_kelas')}
                                                            value={getContextualValue(settings, 'nip_wali_kelas') ?? ''}
                                                            onChange={onSettingsChange}
                                                            onBlur={resolvedOnSave}
                                                            onKeyDown={handleKeyDown}
                                                            className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none sm:text-sm text-slate-900 placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                    {/* Kolom 3: Tanda Tangan */}
                                    <div className="flex flex-col gap-4 h-full">
                                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-2">Tanda Tangan</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                                            <FileInputField 
                                                label="Tanda Tangan Kepala Sekolah" 
                                                id="ttd_kepala_sekolah" 
                                                onChange={onSettingsChange} 
                                                onSave={resolvedOnSave} 
                                                imagePreview={typeof settings.ttd_kepala_sekolah === 'string' ? settings.ttd_kepala_sekolah : null} 
                                                onMakeTransparent={handleMakeTransparent}
                                            />
                                            <FileInputField 
                                                label="Tanda Tangan Wali Kelas" 
                                                id="ttd_wali_kelas" 
                                                onChange={onSettingsChange} 
                                                onSave={resolvedOnSave} 
                                                imagePreview={typeof settings.ttd_wali_kelas === 'string' ? settings.ttd_wali_kelas : null} 
                                                onMakeTransparent={handleMakeTransparent}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
};
