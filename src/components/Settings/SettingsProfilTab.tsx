import React from 'react';
import { FormField } from './FormField';
import { FileInputField } from './FileInputField';
import { KopSuratPreview } from './KopSuratPreview';

interface SettingsProfilTabProps {
    settings: any;
    onSettingsChange: (e: any) => void;
    resolvedOnSave: () => void;
    handleKeyDown: (e: any) => void;
    getStatus: (value: any) => any;
    setIsEditorOpen: (val: boolean) => void;
    handleMakeTransparent: (id: string) => void;
}

export const SettingsProfilTab: React.FC<SettingsProfilTabProps> = ({
    settings,
    onSettingsChange,
    resolvedOnSave,
    handleKeyDown,
    getStatus,
    setIsEditorOpen,
    handleMakeTransparent
}) => {
    return (
        <section className="animate-fade-in space-y-6" id="section-profil">
                                <div className="flex justify-between items-center border-b pb-3 mb-6">
                                    <h3 className="text-xl font-bold text-slate-800">Profil Sekolah</h3>
                                    <button
                                        id="btn-design-kop"
                                        onClick={() => setIsEditorOpen(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 transition"
                                    >
                                        Desain Kop Surat
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="md:col-span-2">
                                            <FormField 
                                                label="Nama Dinas Pendidikan" 
                                                id="nama_dinas_pendidikan" 
                                                value={settings.nama_dinas_pendidikan} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                            />
                                        </div>
                                        <FormField 
                                            label="Nama Sekolah" 
                                            id="nama_sekolah" 
                                            value={settings.nama_sekolah} 
                                            status={getStatus(settings.nama_sekolah)} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="NPSN" 
                                            id="npsn" 
                                            value={settings.npsn} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <div className="md:col-span-2">
                                            <FormField 
                                                label="Alamat Sekolah" 
                                                id="alamat_sekolah" 
                                                value={settings.alamat_sekolah} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                            />
                                        </div>
                                        <FormField 
                                            label="Desa / Kelurahan" 
                                            id="desa_kelurahan" 
                                            value={settings.desa_kelurahan} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Kecamatan" 
                                            id="kecamatan" 
                                            value={settings.kecamatan} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Kota/Kabupaten" 
                                            id="kota_kabupaten" 
                                            value={settings.kota_kabupaten} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Provinsi" 
                                            id="provinsi" 
                                            value={settings.provinsi} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Kode Pos" 
                                            id="kode_pos" 
                                            value={settings.kode_pos} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Email Sekolah" 
                                            id="email_sekolah" 
                                            type="email" 
                                            value={settings.email_sekolah} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Telepon Sekolah" 
                                            id="telepon_sekolah" 
                                            value={settings.telepon_sekolah} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <FormField 
                                            label="Website Sekolah" 
                                            id="website_sekolah" 
                                            value={settings.website_sekolah} 
                                            onChange={onSettingsChange} 
                                            onBlur={resolvedOnSave} 
                                            onKeyDown={handleKeyDown} 
                                        />
                                        <div className="md:col-span-2">
                                            <FormField 
                                                label="Faksimile" 
                                                id="faksimile" 
                                                value={settings.faksimile} 
                                                onChange={onSettingsChange} 
                                                onBlur={resolvedOnSave} 
                                                onKeyDown={handleKeyDown} 
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 space-y-6">
                                        <FileInputField 
                                            label="Logo Sekolah" 
                                            id="logo_sekolah" 
                                            onChange={onSettingsChange} 
                                            onSave={resolvedOnSave} 
                                            imagePreview={typeof settings.logo_sekolah === 'string' ? settings.logo_sekolah : null} 
                                            onMakeTransparent={handleMakeTransparent} 
                                        />
                                        <FileInputField 
                                            label="Logo Dinas Pendidikan" 
                                            id="logo_dinas" 
                                            onChange={onSettingsChange} 
                                            onSave={resolvedOnSave} 
                                            imagePreview={typeof settings.logo_dinas === 'string' ? settings.logo_dinas : null} 
                                            onMakeTransparent={handleMakeTransparent} 
                                        />
                                        <FileInputField 
                                            label="Logo Cover Rapor" 
                                            id="logo_cover" 
                                            onChange={onSettingsChange} 
                                            onSave={resolvedOnSave} 
                                            imagePreview={typeof settings.logo_cover === 'string' ? settings.logo_cover : null} 
                                            onMakeTransparent={handleMakeTransparent} 
                                        />
                                        <FileInputField 
                                            label="Background Piagam" 
                                            id="piagam_background" 
                                            onChange={onSettingsChange} 
                                            onSave={resolvedOnSave} 
                                            imagePreview={typeof settings.piagam_background === 'string' ? settings.piagam_background : null} 
                                            onMakeTransparent={handleMakeTransparent} 
                                        />
                                        <div className="border-t pt-4">
                                            <h4 className="text-lg font-semibold text-slate-700">Pratinjau Kop Surat</h4>
                                            <p className="text-sm text-slate-500 mb-4">
                                                Ini adalah tampilan yang akan digunakan saat mencetak rapor. Klik 'Desain Kop Surat' untuk mengubah.
                                            </p>
                                            <KopSuratPreview settings={settings} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
};
