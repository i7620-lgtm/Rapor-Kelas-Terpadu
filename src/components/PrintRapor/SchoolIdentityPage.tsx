import React from 'react';
import { EditableDescription } from './EditableDescription';

interface SchoolIdentityPageProps {
    settings: any;
    onUpdateSettings: (key: string, val: any) => void;
}

export const SchoolIdentityPage: React.FC<SchoolIdentityPageProps> = ({ settings, onUpdateSettings }) => {
    const identitasSekolah = [
        { key: 'nama_sekolah', label: "Nama Sekolah", value: settings.nama_sekolah },
        { key: 'npsn', label: "NPSN", value: settings.npsn },
        { key: 'alamat_sekolah', label: "Alamat Sekolah", value: settings.alamat_sekolah },
        { key: 'desa_kelurahan', label: 'Kelurahan/Desa', value: settings.desa_kelurahan },
        { key: 'kecamatan', label: 'Kecamatan', value: settings.kecamatan },
        { key: 'kota_kabupaten', label: 'Kabupaten/Kota', value: settings.kota_kabupaten },
        { key: 'provinsi', label: 'Provinsi', value: settings.provinsi },
        { key: 'website_sekolah', label: 'Website', value: settings.website_sekolah },
        { key: 'email_sekolah', label: 'E-mail', value: settings.email_sekolah },
        { key: 'kode_pos', label: 'Kode Pos', value: settings.kode_pos },
        { key: 'telepon_sekolah', label: 'Telepon', value: settings.telepon_sekolah },
    ];

    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS SEKOLAH'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, `${index + 1}.`),
                            React.createElement('td', { className: 'w-[30%] py-[2px]' }, item.label),
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, ':'),
                            React.createElement('td', { className: 'w-[60%] py-[2px]' }, 
                                item.key ? (
                                    React.createElement(EditableDescription, {
                                        value: item.value || '-',
                                        onSave: (val) => onUpdateSettings(item.key, val),
                                        placeholder: "-"
                                    })
                                ) : (
                                    item.value || '-'
                                )
                            )
                        )
                    ))
                )
            )
        )
    );
};
