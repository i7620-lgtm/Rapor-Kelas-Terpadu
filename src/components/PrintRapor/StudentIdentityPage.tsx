import React from 'react';
import { EditableDescription } from './EditableDescription';
import { 
    getTanggalRaporValue, 
    getTanggalRaporKey, 
    getContextualValue 
} from '../../constants';

interface StudentIdentityPageProps {
    student: any;
    settings: any;
    onUpdateStudent: (id: string, field: string, val: string) => void;
    onUpdateSettings: (key: string, val: any) => void;
}

export const StudentIdentityPage: React.FC<StudentIdentityPageProps> = ({ 
    student, 
    settings, 
    onUpdateStudent, 
    onUpdateSettings 
}) => {
    const tanggalRaporValue = getTanggalRaporValue(settings) || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`;

    const identitasSiswa = [
        { key: 'namaLengkap', no: '1.', label: 'Nama Murid', value: (student.namaLengkap || '').toUpperCase() },
        { key: 'nisn', no: '2.', label: 'NISN', value: student.nisn || '-' },
        { key: 'nis', label: 'NIS', value: student.nis || '-', sameLine: true },
        { key: 'ttl', no: '3.', label: 'Tempat, Tanggal Lahir', value: student.ttl || '-' },
        { key: 'jenisKelamin', no: '4.', label: 'Jenis Kelamin', value: student.jenisKelamin },
        { key: 'agama', no: '5.', label: 'Agama', value: student.agama },
        { key: 'asalTk', no: '6.', label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { key: 'alamatSiswa', no: '7.', label: 'Alamat Murid', value: student.alamatSiswa },
        { no: '8.', label: 'Nama Orang Tua' },
        { key: 'namaAyah', sub: true, label: 'a. Ayah', value: student.namaAyah },
        { key: 'namaIbu', sub: true, label: 'b. Ibu', value: student.namaIbu },
        { no: '9.', label: 'Pekerjaan Orang Tua' },
        { key: 'pekerjaanAyah', sub: true, label: 'a. Ayah', value: student.pekerjaanAyah },
        { key: 'pekerjaanIbu', sub: true, label: 'b. Ibu', value: student.pekerjaanIbu },
        { key: 'alamatOrangTua', no: '10.', label: 'Alamat Orang Tua', value: student.alamatOrangTua },
        { key: 'teleponOrangTua', no: '11.', label: 'Telepon Orang Tua', value: student.teleponOrangTua },
        { no: '12.', label: 'Wali Murid' },
        { key: 'namaWali', sub: true, label: 'a. Nama', value: student.namaWali },
        { key: 'pekerjaanWali', sub: true, label: 'b. Pekerjaan', value: student.pekerjaanWali },
        { key: 'alamatWali', sub: true, label: 'c. Alamat', value: student.alamatWali },
    ];

    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS MURID'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSiswa.map((item: any, index: number) => {
                        if (item.sameLine) return null; // Skip direct render, handled in parent
                        
                        let valueRender;
                        if (item.label === 'NISN') {
                             // Custom merge for NISN/NIS
                             const nextItem = identitasSiswa[index + 1];
                             valueRender = (
                                React.createElement('div', { className: 'flex gap-1' },
                                    React.createElement(EditableDescription, { value: item.value, onSave: (val) => onUpdateStudent(student.id, item.key, val), placeholder: "-" }),
                                    React.createElement('span', null, '/'),
                                    React.createElement(EditableDescription, { value: nextItem.value, onSave: (val) => onUpdateStudent(student.id, nextItem.key, val), placeholder: "-" })
                                )
                             );
                        } else if (item.key) {
                            valueRender = (
                                React.createElement(EditableDescription, {
                                    value: item.value || '-',
                                    onSave: (val) => onUpdateStudent(student.id, item.key, val),
                                    placeholder: "-",
                                    multiline: item.key.includes('alamat')
                                })
                            );
                        } else {
                            valueRender = item.value || (item.sub ? '-' : '');
                        }

                        return (
                            React.createElement('tr', { key: index, className: 'align-top' },
                                React.createElement('td', { className: 'w-[5%] py-[1.5px]' }, item.no || ''),
                                React.createElement('td', { className: `w-[35%] py-[1.5px] ${item.sub ? 'pl-4' : ''}` }, item.label),
                                React.createElement('td', { className: 'w-[3%] py-[1.5px] text-center' }, item.label ? ':' : ''),
                                React.createElement('td', { className: 'w-[57%] py-[1.5px]' }, valueRender)
                            )
                        );
                    })
                )
            ),
            React.createElement('div', { className: 'flex justify-between items-end pt-10' },
                React.createElement('div', { 
                    className: 'border-2 border-black flex items-center justify-center text-slate-400 relative overflow-hidden text-center text-sm',
                    style: { width: '3cm', height: '4cm', minWidth: '3cm', minHeight: '4cm' }
                },
                    student.foto ? React.createElement('img', { src: student.foto, alt: "Foto Siswa", className: "w-full h-full object-cover" }) : 'Pas Foto 3x4'
                ),
                React.createElement('div', { className: 'text-center relative' },
                    React.createElement(EditableDescription, { value: tanggalRaporValue, onSave: (val) => onUpdateSettings(getTanggalRaporKey(settings), val), placeholder: "Tempat, Tanggal" }),
                    React.createElement('div', { className: 'mt-1' }, 'Kepala Sekolah,'),
                    React.createElement('div', { className: 'h-20 w-full relative flex items-center justify-center' },
                        settings.ttd_kepala_sekolah && React.createElement('img', { 
                            src: settings.ttd_kepala_sekolah, 
                            alt: "TTD Kepala Sekolah", 
                            className: 'h-20 object-contain absolute z-10' 
                        })
                    ),
                    React.createElement('div', { className: 'font-bold underline relative z-20' }, getContextualValue(settings, 'nama_kepala_sekolah') || '_________________'),
                    React.createElement('div', null, `${getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP'}. ${getContextualValue(settings, 'nip_kepala_sekolah') || '-'}`)
                )
            )
        )
    );
};
