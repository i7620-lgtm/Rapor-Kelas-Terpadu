

import React from 'react';
import { AppSettings } from '../types.ts';

interface FormFieldProps {
    label: string;
    id: keyof AppSettings;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, id, type = 'text', placeholder, value, onChange }) => (
    <div className="col-span-1">
        {/* FIX: Cast `id` to string for `htmlFor` attribute to satisfy TypeScript. */}
        <label htmlFor={String(id)} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            // FIX: Cast `id` to string for `id` and `name` attributes.
            id={String(id)}
            name={String(id)}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 placeholder:text-slate-400"
            placeholder={placeholder}
        />
    </div>
);

const FileInputField: React.FC<{ label: string; id: keyof AppSettings; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; fileName?: string }> = ({ label, id, onChange, fileName }) => (
     <div className="col-span-1">
        {/* FIX: Cast `id` to string for `htmlFor` attribute. */}
        <label htmlFor={String(id)} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <div className="mx-auto h-12 w-12 text-slate-400 flex items-center justify-center text-4xl font-semibold" aria-hidden="true">
                    ↑
                </div>
                <div className="flex text-sm text-slate-600">
                     {/* FIX: Cast `id` to string for `htmlFor` attribute. */}
                    <label htmlFor={String(id)} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Unggah file</span>
                         {/* FIX: Cast `id` to string for `id` and `name` attributes. */}
                        <input id={String(id)} name={String(id)} type="file" className="sr-only" onChange={onChange} accept="image/*" />
                    </label>
                    <p className="pl-1">atau seret dan lepas</p>
                </div>
                {fileName ? (
                    <p className="text-xs text-green-600">{fileName}</p>
                ) : (
                    <p className="text-xs text-slate-500">PNG, JPG, GIF hingga 10MB</p>
                )}
            </div>
        </div>
    </div>
);


interface SettingsPageProps {
    settings: AppSettings;
    onSettingsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange, onSave }) => {

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Pengaturan</h2>
                <p className="mt-2 text-slate-600">Kelola informasi sekolah, periode akademik, dan data penting lainnya.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="space-y-12">
                    {/* Profil Sekolah */}
                    <section>
                        <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Profil Sekolah</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Nama Sekolah" id="nama_sekolah" value={settings.nama_sekolah} onChange={onSettingsChange} />
                            <FormField label="NPSN" id="npsn" value={settings.npsn} onChange={onSettingsChange} />
                            <FormField label="Alamat Sekolah" id="alamat_sekolah" value={settings.alamat_sekolah} onChange={onSettingsChange} />
                            <FormField label="Desa / Kelurahan" id="desa_kelurahan" value={settings.desa_kelurahan} onChange={onSettingsChange} />
                            <FormField label="Kecamatan" id="kecamatan" value={settings.kecamatan} onChange={onSettingsChange} />
                            <FormField label="Provinsi" id="provinsi" value={settings.provinsi} onChange={onSettingsChange} />
                            <FormField label="Kode Pos" id="kode_pos" value={settings.kode_pos} onChange={onSettingsChange} />
                            <FormField label="Email Sekolah" id="email_sekolah" type="email" value={settings.email_sekolah} onChange={onSettingsChange} />
                            <FormField label="Telepon Sekolah" id="telepon_sekolah" value={settings.telepon_sekolah} onChange={onSettingsChange} />
                            <FormField label="Website Sekolah" id="website_sekolah" value={settings.website_sekolah} onChange={onSettingsChange} />
                            <FormField label="Faksimile" id="faksimile" value={settings.faksimile} onChange={onSettingsChange} />
                            <FileInputField label="Logo Sekolah" id="logo_sekolah" onChange={onSettingsChange} fileName={typeof settings.logo_sekolah === 'object' && settings.logo_sekolah ? settings.logo_sekolah.name : undefined} />
                        </div>
                    </section>

                    {/* Periode Akademik & Kepala Sekolah */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
                         <section>
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Periode Akademik</h3>
                             <div className="space-y-4">
                                <FormField label="Nama Kelas" id="nama_kelas" value={settings.nama_kelas} onChange={onSettingsChange} />
                                <FormField label="Tahun Ajaran" id="tahun_ajaran" placeholder="e.g. 2023/2024" value={settings.tahun_ajaran} onChange={onSettingsChange} />
                                <FormField label="Semester" id="semester" placeholder="e.g. Ganjil atau Genap" value={settings.semester} onChange={onSettingsChange}/>
                                <FormField label="Tempat, Tanggal Rapor" id="tanggal_rapor" placeholder="e.g. Jakarta, 20 Desember 2023" value={settings.tanggal_rapor} onChange={onSettingsChange}/>
                            </div>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Kepala Sekolah dan Guru</h3>
                             <div className="space-y-4">
                                <FormField label="Nama Kepala Sekolah" id="nama_kepala_sekolah" value={settings.nama_kepala_sekolah} onChange={onSettingsChange} />
                                <FormField label="NIP Kepala Sekolah" id="nip_kepala_sekolah" value={settings.nip_kepala_sekolah} onChange={onSettingsChange} />
                                <FormField label="Nama Wali Kelas" id="nama_wali_kelas" value={settings.nama_wali_kelas} onChange={onSettingsChange} />
                                <FormField label="NIP Wali Kelas" id="nip_wali_kelas" value={settings.nip_wali_kelas} onChange={onSettingsChange} />
                            </div>
                        </section>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onSave}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
