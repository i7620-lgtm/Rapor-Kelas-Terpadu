import React from 'react';
import { 
    getTanggalRaporKey, 
    getTanggalRaporValue, 
    getContextualKey, 
    getContextualValue 
} from '../constants';
import { useSettingsPageLogic } from './Settings/useSettingsPageLogic';

// Modular Sub-components
import { FormField } from './Settings/FormField';
import { FileInputField } from './Settings/FileInputField';
import { ConfirmationModal } from './Settings/ConfirmationModal';
import { KopSuratEditorModal } from './Settings/KopSuratEditorModal';
import { KopSuratPreview } from './Settings/KopSuratPreview';
import { PengaturanMapel } from './Settings/PengaturanMapel';
import { PengaturanEkstra } from './Settings/PengaturanEkstra';
import { QualitativeGradingTable } from './Settings/QualitativeGradingTable';

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
                        )}

                        {activeTab === 'akademik' && (
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
                        )}
                        
                        {activeTab === 'mapel' && (
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
                        )}
                        
                        {activeTab === 'penilaian' && (
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
                                                                    onChange={(e) => handleGradeMethodChange(sub.id, e.target.value)}
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
                                                    onChange={(e) => onSettingsChange({ target: { name: 'enableAutoRegression', value: e.target.checked, type: 'checkbox' } })}
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
                                                    onChange={(e) => onSettingsChange({ target: { name: 'enableExitWarning', value: e.target.checked, type: 'checkbox' } })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;
