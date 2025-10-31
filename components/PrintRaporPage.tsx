import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Student, StudentGrade, StudentAttendance, StudentNotes, Subject, StudentDescriptions, Extracurricular, StudentExtracurricular, P5Project, P5ProjectAssessment, KopLayout, KopElement } from '../types.ts';

declare const html2canvas: any;
declare const jspdf: any;

// Helper to format date strings
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
        // Handle cases like "Jakarta, 20 Desember 2023"
        const parts = dateString.split(',');
        const datePart = parts.length > 1 ? parts[1].trim() : dateString;
        const date = new Date(datePart);
        if (isNaN(date.getTime())) {
             // Try parsing YYYY-MM-DD
            const isoDate = new Date(dateString);
            if(isNaN(isoDate.getTime())) return dateString; // Return original if still invalid
            return isoDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        };
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const paperDimensionsCss = {
    A4: { width: '21cm', height: '29.7cm', label: 'A4 (21 x 29.7 cm)' },
    F4: { width: '21.5cm', height: '33cm', label: 'F4 (21.5 × 33 cm)' },
    Letter: { width: '21.6cm', height: '27.9cm', label: 'Letter (21.6 × 27.9 cm)' },
    Legal: { width: '21.6cm', height: '35.6cm', label: 'Legal (21.6 × 35.6 cm)' },
};
type PaperSize = keyof typeof paperDimensionsCss;


// Letterhead Header Component
const KopSuratHeader: React.FC<{ settings: AppSettings }> = ({ settings }) => {
    const generateInitialLayout = (appSettings: AppSettings): KopLayout => {
        return [
            { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 20, width: 80, height: 80 },
            { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 690, y: 20, width: 80, height: 80 },
            { id: 'line_1', type: 'line', content: '', x: 10, y: 130, width: 780, height: 2 },
            { id: 'nama_dinas_pendidikan_text', type: 'text', content: appSettings.nama_dinas_pendidikan || "PEMERINTAH KOTA CONTOH", x: 120, y: 20, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 14 },
            { id: 'nama_sekolah_text', type: 'text', content: appSettings.nama_sekolah || "SEKOLAH DASAR NEGERI CONTOH", x: 120, y: 50, width: 550, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
            { id: 'alamat_sekolah_text', type: 'text', content: appSettings.alamat_sekolah || "Jalan Contoh No. 123", x: 120, y: 80, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
            { id: 'kontak_sekolah_text', type: 'text', content: `Telepon: ${appSettings.telepon_sekolah || ''} | Email: ${appSettings.email_sekolah || ''}`, x: 120, y: 100, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
        ];
    };

    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);
    
    // Sync content from settings
    const syncedLayout = layout.map(el => {
        if (el.type === 'text') {
            if (el.id === 'nama_dinas_pendidikan_text') return { ...el, content: settings.nama_dinas_pendidikan };
            if (el.id === 'nama_sekolah_text') return { ...el, content: settings.nama_sekolah };
            if (el.id === 'alamat_sekolah_text') return { ...el, content: settings.alamat_sekolah };
            if (el.id === 'kontak_sekolah_text') return { ...el, content: `Telepon: ${settings.telepon_sekolah || ''} | Email: ${settings.email_sekolah || ''}` };
        }
        return el;
    });

    return (
        <div className="w-full mb-4" style={{ height: '3.5cm', flexShrink: 0 }}>
            <svg width="100%" height="100%" viewBox="0 0 800 135" preserveAspectRatio="xMidYMin meet">
                {syncedLayout.map(el => {
                    if (el.type === 'text') {
                        let textAnchor: "start" | "middle" | "end" = "start";
                        let xPos = el.x;
                        if (el.textAlign === 'center') {
                            textAnchor = "middle";
                            xPos = el.x + (el.width ?? 0) / 2;
                        } else if (el.textAlign === 'right') {
                            textAnchor = "end";
                            xPos = el.x + (el.width ?? 0);
                        }
                        return (
                            <text
                                key={el.id}
                                x={xPos}
                                y={el.y + (el.fontSize ?? 14)}
                                fontSize={el.fontSize}
                                fontWeight={el.fontWeight}
                                textAnchor={textAnchor}
                                fontFamily={el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'Poppins'}
                            >
                                {el.content}
                            </text>
                        );
                    }
                    if (el.type === 'image') {
                        const imageUrl = String(settings[el.content as keyof AppSettings] || '');
                        if (!imageUrl) return null; // Don't render placeholder
                        return (
                            <image
                                key={el.id}
                                href={imageUrl}
                                x={el.x}
                                y={el.y}
                                width={el.width}
                                height={el.height}
                            />
                        );
                    }
                    if (el.type === 'line') {
                        return (
                            <rect
                                key={el.id}
                                x={el.x}
                                y={el.y}
                                width={el.width}
                                height={el.height}
                                fill="black"
                            />
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
};


// A4 page container
const ReportPage: React.FC<{ children: React.ReactNode, showHeader?: boolean, settings?: AppSettings, paperSize: PaperSize }> = ({ children, showHeader = false, settings, paperSize }) => (
    <div className="report-page bg-white shadow-lg mx-auto my-4 border border-gray-300 text-black" style={{ width: paperDimensionsCss[paperSize].width, height: paperDimensionsCss[paperSize].height, boxSizing: 'border-box' }}>
         <div className="p-8 h-full w-full flex flex-col">
            {showHeader && settings && <KopSuratHeader settings={settings} />}
            <div className="flex-grow overflow-hidden">
                {children}
            </div>
        </div>
    </div>
);


// Cover Page Component
const CoverPage: React.FC<{ student: Student; settings: AppSettings, paperSize: PaperSize }> = ({ student, settings, paperSize }) => (
    <ReportPage paperSize={paperSize}>
        <div className="flex flex-col justify-between items-center h-full text-center p-4">
            <div className="pt-8">
                <h2 className="text-xl font-semibold uppercase">{settings.nama_dinas_pendidikan || 'DINAS PENDIDIKAN'}</h2>
            </div>
            <div>
                <div className="h-32 w-32 bg-gray-200 flex items-center justify-center mx-auto mb-8">
                    {settings.logo_dinas && typeof settings.logo_dinas === 'string'
                        ? <img src={settings.logo_dinas} alt="Logo Dinas Pendidikan" className="object-contain h-full w-full" />
                        : <span className="text-gray-500">Logo</span>
                    }
                </div>
                <h1 className="text-2xl font-bold tracking-wider border-b-2 border-t-2 border-black py-2">LAPORAN HASIL BELAJAR</h1>
                <div className="mt-20 space-y-2 text-lg">
                    <p>Nama Peserta Didik:</p>
                    <p className="font-bold text-2xl uppercase">{student.namaLengkap}</p>
                    <p className="mt-4">NIS / NISN:</p>
                    <p className="font-bold text-2xl">{student.nis} / {student.nisn}</p>
                </div>
            </div>
            <div className="font-semibold pb-8">
                <p className="text-lg uppercase">{settings.nama_sekolah || 'NAMA SEKOLAH'}</p>
                <p className="text-sm">{settings.alamat_sekolah || 'Alamat Sekolah'}</p>
            </div>
        </div>
    </ReportPage>
);

// Identity Page Component
const IdentityPage: React.FC<{ student: Student; settings: AppSettings, paperSize: PaperSize }> = ({ student, settings, paperSize }) => {
    const identityData = [
        { label: "Nama Lengkap Peserta Didik", value: student.namaLengkap },
        { label: "Nomor Induk Siswa (NIS)", value: student.nis },
        { label: "Nomor Induk Siswa Nasional (NISN)", value: student.nisn },
        { label: "Tempat, Tanggal Lahir", value: `${student.tempatLahir || '-'}, ${formatDate(student.tanggalLahir)}` },
        { label: "Jenis Kelamin", value: student.jenisKelamin },
        { label: "Agama", value: student.agama },
        { label: "Status dalam Keluarga", value: student.statusDalamKeluarga },
        { label: "Anak ke", value: student.anakKe },
        { label: "Alamat Peserta Didik", value: student.alamatSiswa },
        { label: "Diterima di sekolah ini", value: "" },
        { label: "a. Di kelas", value: student.diterimaDiKelas, isSub: true },
        { label: "b. Pada tanggal", value: formatDate(student.diterimaTanggal), isSub: true },
        { label: "Orang Tua", value: "" },
        { label: "a. Ayah", value: student.namaAyah, isSub: true },
        { label: "b. Ibu", value: student.namaIbu, isSub: true },
        { label: "Alamat Orang Tua", value: student.alamatOrangTua },
        { label: "Pekerjaan Orang Tua", value: "" },
        { label: "a. Ayah", value: student.pekerjaanAyah, isSub: true },
        { label: "b. Ibu", value: student.pekerjaanIbu, isSub: true },
        { label: "Wali Peserta Didik", value: "" },
        { label: "a. Nama", value: student.namaWali || '-', isSub: true },
        { label: "b. Pekerjaan", value: student.pekerjaanWali || '-', isSub: true },
    ];

    const rapportDateString = settings.tanggal_rapor || '';
    const rapportDateParts = rapportDateString.split(',');
    const place = rapportDateParts[0] || '';
    const date = rapportDateParts.length > 1 ? rapportDateParts.slice(1).join(',').trim() : '';

    return (
        <ReportPage showHeader={true} settings={settings} paperSize={paperSize}>
            <h2 className="text-center font-bold text-lg mb-8">KETERANGAN DIRI PESERTA DIDIK</h2>
            <div className="space-y-1 text-sm">
                {identityData.map((item, index) => (
                    <div key={index} className="flex">
                        <div className={`flex w-1/2 ${item.isSub ? 'pl-6' : 'pl-2'}`}>
                            <span className="w-6">{!item.isSub ? `${index + 1}.` : ''}</span>
                            <span className="flex-1">{item.label}</span>
                            <span>:</span>
                        </div>
                        <div className="w-1/2 font-semibold pl-2">{item.value || '-'}</div>
                    </div>
                ))}
            </div>
             <div className="flex justify-between mt-12 text-sm">
                <div>
                     <div className="w-24 h-32 border-2 border-black flex items-center justify-center text-gray-400">
                        Pas Foto 3x4
                    </div>
                </div>
                <div className="text-left">
                    <p>{place}{date ? `, ${date}` : ''}</p>
                    <p>Kepala Sekolah,</p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">{settings.nama_kepala_sekolah || '................................'}</p>
                    <p>NIP. {settings.nip_kepala_sekolah || '...........................'}</p>
                </div>
            </div>
        </ReportPage>
    );
};

// Main Report Page Component
const MainReportPage: React.FC<{ student: Student, settings: AppSettings, gradeData: StudentGrade, attendanceData: StudentAttendance, noteData: string, activeSubjects: Subject[], studentDescriptions: StudentDescriptions, paperSize: PaperSize }> = ({ student, settings, gradeData, attendanceData, noteData, activeSubjects, studentDescriptions, paperSize }) => {

    const rapportDateString = settings.tanggal_rapor || '';
    const rapportDateParts = rapportDateString.split(',');
    const place = rapportDateParts[0] || '';
    const date = rapportDateParts.length > 1 ? rapportDateParts.slice(1).join(',').trim() : '';

    return (
        <>
            <ReportPage showHeader={true} settings={settings} paperSize={paperSize}>
                <h2 className="text-center font-bold text-lg border-b-2 border-black pb-1">LAPORAN HASIL BELAJAR</h2>
                <div className="flex justify-between text-xs mt-4">
                    <div className="w-1/2">
                        <div className="flex"><span className="w-32">Nama Peserta Didik</span>: {student.namaLengkap}</div>
                        <div className="flex"><span className="w-32">NIS / NISN</span>: {student.nis} / {student.nisn}</div>
                    </div>
                    <div className="w-1/2">
                        <div className="flex"><span className="w-28">Kelas</span>: {settings.nama_kelas}</div>
                        <div className="flex"><span className="w-28">Semester</span>: {settings.semester}</div>
                        <div className="flex"><span className="w-28">Tahun Ajaran</span>: {settings.tahun_ajaran}</div>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="font-bold bg-gray-200 px-2 py-1 text-sm">A. Penilaian Akademik (Intrakurikuler)</p>
                    <table className="w-full border-collapse border border-black text-xs mt-2">
                        <thead>
                            <tr className="font-bold text-center bg-gray-100">
                                <td className="border border-black p-1 w-8">No</td>
                                <td className="border border-black p-1">Mata Pelajaran</td>
                                <td className="border border-black p-1 w-20">Nilai Akhir</td>
                                <td className="border border-black p-1">Capaian Kompetensi</td>
                            </tr>
                        </thead>
                        <tbody>
                            {activeSubjects.map((subject, index) => (
                                <tr key={subject.id}>
                                    <td className="border border-black p-1 text-center">{index + 1}</td>
                                    <td className="border border-black p-1">{subject.fullName}</td>
                                    <td className="border border-black p-1 text-center font-semibold">{gradeData?.finalGrades[subject.id] ?? 0}</td>
                                    <td className="border border-black p-1">{studentDescriptions[student.id]?.[subject.id] || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* B & C sections could be added here */}
            </ReportPage>
            
            <ReportPage showHeader={true} settings={settings} paperSize={paperSize}>
                 <h2 className="text-center font-bold text-lg border-b-2 border-black pb-1">LAPORAN HASIL BELAJAR</h2>
                <div className="flex justify-between text-xs mt-4">
                    <div className="w-1/2">
                        <div className="flex"><span className="w-32">Nama Peserta Didik</span>: {student.namaLengkap}</div>
                        <div className="flex"><span className="w-32">NIS / NISN</span>: {student.nis} / {student.nisn}</div>
                    </div>
                    <div className="w-1/2">
                        <div className="flex"><span className="w-28">Kelas</span>: {settings.nama_kelas}</div>
                        <div className="flex"><span className="w-28">Semester</span>: {settings.semester}</div>
                        <div className="flex"><span className="w-28">Tahun Ajaran</span>: {settings.tahun_ajaran}</div>
                    </div>
                </div>

                 <div className="flex gap-4 mt-4 text-xs">
                    <div className="w-1/2">
                        <p className="font-bold bg-gray-200 px-2 py-1">D. Ketidakhadiran</p>
                        <table className="w-full border border-black mt-2">
                            <tbody>
                                <tr><td className="border border-black p-1 w-1/2">Sakit</td><td className="border border-black p-1 font-semibold">{attendanceData?.sakit || 0} hari</td></tr>
                                <tr><td className="border border-black p-1">Izin</td><td className="border border-black p-1 font-semibold">{attendanceData?.izin || 0} hari</td></tr>
                                <tr><td className="border border-black p-1">Tanpa Keterangan</td><td className="border border-black p-1 font-semibold">{attendanceData?.alpa || 0} hari</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-1/2">
                        <p className="font-bold bg-gray-200 px-2 py-1">E. Catatan Wali Kelas</p>
                        <div className="border border-black h-24 p-1 mt-2 overflow-hidden">{noteData || ''}</div>
                    </div>
                </div>
                
                <div className="mt-4 bg-blue-100 border border-blue-300 p-2 text-xs flex justify-between items-center">
                    <span>Keputusan:</span>
                    <span className="font-semibold">Naik ke kelas berikutnya</span>
                </div>

                <div className="mt-16 flex justify-between text-center text-sm">
                    <div>
                        <p>Orang Tua/Wali,</p>
                        <div className="h-20"></div>
                        <p>(..............................)</p>
                    </div>
                    <div>
                        <p>Diberikan di: {place || '.....................'}</p>
                        <p>Tanggal: {date || '..........................'}</p>
                        <p>Wali Kelas,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{settings.nama_wali_kelas || '................................'}</p>
                        <p>NIP. {settings.nip_wali_kelas || '...........................'}</p>
                    </div>
                     <div>
                        <p>Kepala Sekolah,</p>
                         <div className="h-20"></div>
                        <p className="font-bold underline">{settings.nama_kepala_sekolah || '................................'}</p>
                        <p>NIP. {settings.nip_kepala_sekolah || '...........................'}</p>
                    </div>
                </div>
            </ReportPage>
        </>
    );
};


interface PrintRaporPageProps {
    students: Student[];
    settings: AppSettings;
    grades: StudentGrade[];
    attendance: StudentAttendance[];
    notes: StudentNotes;
    subjects: Subject[];
    studentDescriptions: StudentDescriptions;
    studentExtracurriculars: StudentExtracurricular[];
    extracurriculars: Extracurricular[];
    p5Projects: P5Project[];
    p5Assessments: P5ProjectAssessment[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

const PrintRaporPage: React.FC<PrintRaporPageProps> = (props) => {
    const { students, showToast } = props;
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    const [paperSize, setPaperSize] = useState<PaperSize>('A4');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pagesToInclude, setPagesToInclude] = useState({
        sampul: true,
        identitas: true,
        laporanUtama: true,
    });
    
    useEffect(() => {
        const styleId = 'dynamic-print-style';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        const dimensions = paperDimensionsCss[paperSize];
        styleElement.innerHTML = `
            @page {
                size: ${dimensions.width} ${dimensions.height};
                margin: 0;
            }
        `;
        return () => {
             const styleToRemove = document.getElementById(styleId);
             if (styleToRemove) {
                styleToRemove.remove();
             }
        }
    }, [paperSize]);

    useEffect(() => {
        if (students.length === 1) {
            setSelectedStudentId(String(students[0].id));
        }
    }, [students]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setPagesToInclude(prev => ({ ...prev, [name]: checked }));
    };

    const handleGeneratePdf = async () => {
        const printArea = document.getElementById('print-area');
        if (!printArea || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            showToast('Pustaka PDF tidak termuat. Coba muat ulang halaman.', 'error');
            return;
        }

        setIsGenerating(true);
        showToast('Memulai pembuatan PDF, mohon tunggu...', 'success');

        try {
            const { jsPDF } = jspdf;
            const reportPages = printArea.querySelectorAll<HTMLElement>('.report-page');
            if (reportPages.length === 0) {
                showToast('Tidak ada halaman untuk dicetak.', 'error');
                setIsGenerating(false);
                return;
            }
            
            const paperDimensionsMm = {
                A4: { width: 210, height: 297 },
                F4: { width: 215, height: 330 },
                Letter: { width: 216, height: 279 },
                Legal: { width: 216, height: 356 },
            };

            const dimensions = paperDimensionsMm[paperSize];
            const orientation = dimensions.width > dimensions.height ? 'l' : 'p';
            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format: [dimensions.width, dimensions.height]
            });
            
            for (let i = 0; i < reportPages.length; i++) {
                const page = reportPages[i];
                const canvas = await html2canvas(page, {
                    scale: 2, // Keep scale for quality
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff', // JPEGs don't support transparency
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                if (i > 0) {
                    doc.addPage([dimensions.width, dimensions.height], orientation);
                }
                
                doc.addImage(imgData, 'JPEG', 0, 0, dimensions.width, dimensions.height);
            }
            
            const studentName = studentsToPrint.length === 1 ? studentsToPrint[0]?.namaLengkap : 'Semua_Siswa';
            doc.save(`Rapor_${studentName}.pdf`);

        } catch (error) {
            console.error("PDF Generation Error: ", error);
            showToast('Terjadi kesalahan saat membuat PDF.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));
    }, [students]);

    const studentsToPrint = useMemo(() => {
        if (selectedStudentId === 'all') return sortedStudents;
        return students.filter(s => s.id === parseInt(selectedStudentId, 10));
    }, [selectedStudentId, students, sortedStudents]);
    
    const activeSubjects = useMemo(() => props.subjects.filter(s => s.active), [props.subjects]);

    return (
        <div className="flex h-full -m-6 lg:-m-8">
            {/* Control Panel */}
            <div className="w-80 bg-white p-6 shadow-lg flex flex-col space-y-6 print-hidden">
                <h2 className="text-xl font-bold text-slate-800">Manajemen Cetak Rapor</h2>
                <p className="text-sm text-slate-600">Periode aktif: T.A. {props.settings.tahun_ajaran || '...'} - Semester {props.settings.semester || '...'}</p>

                <div className="bg-slate-100 p-4 rounded-lg space-y-4 flex-grow flex flex-col">
                    <h3 className="font-semibold">Kontrol Cetak</h3>
                    <div>
                        <label htmlFor="pilih-siswa" className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa ({studentsToPrint.length})</label>
                        <select id="pilih-siswa" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md">
                            <option value="all">Semua Siswa ({students.length})</option>
                            {sortedStudents.map((s, index) => <option key={s.id} value={s.id}>{index + 1}. {s.namaLengkap}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ukuran-kertas" className="block text-sm font-medium text-slate-700 mb-1">Ukuran Kertas</label>
                        <select 
                            id="ukuran-kertas"
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        >
                           {Object.entries(paperDimensionsCss).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="block text-sm font-medium text-slate-700 mb-2">Halaman yang Disertakan</p>
                        <div className="space-y-2">
                            <label className="flex items-center"><input type="checkbox" name="sampul" checked={pagesToInclude.sampul} onChange={handleCheckboxChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" /> <span className="ml-2 text-sm">Halaman Sampul</span></label>
                            <label className="flex items-center"><input type="checkbox" name="identitas" checked={pagesToInclude.identitas} onChange={handleCheckboxChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" /> <span className="ml-2 text-sm">Identitas Siswa</span></label>
                            <label className="flex items-center"><input type="checkbox" name="laporanUtama" checked={pagesToInclude.laporanUtama} onChange={handleCheckboxChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" /> <span className="ml-2 text-sm">Laporan Utama</span></label>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <button onClick={handleGeneratePdf} disabled={isGenerating} className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-2a1 1 0 011-1h8a1 1 0 011 1v2h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                           {isGenerating ? 'Membuat PDF...' : 'Buat & Unduh PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-200 p-4 lg:p-8 overflow-auto">
                <div id="print-area">
                    {studentsToPrint.map(student => (
                        <React.Fragment key={student.id}>
                            {pagesToInclude.sampul && <CoverPage student={student} settings={props.settings} paperSize={paperSize} />}
                            {pagesToInclude.identitas && <IdentityPage student={student} settings={props.settings} paperSize={paperSize} />}
                            {pagesToInclude.laporanUtama && 
                                <MainReportPage 
                                    student={student} 
                                    settings={props.settings}
                                    gradeData={props.grades.find(g => g.studentId === student.id) || { studentId: student.id, detailedGrades: {}, finalGrades: {} }}
                                    attendanceData={props.attendance.find(a => a.studentId === student.id) || { studentId: student.id, sakit: 0, izin: 0, alpa: 0 }}
                                    noteData={props.notes[student.id] || ''}
                                    activeSubjects={activeSubjects}
                                    studentDescriptions={props.studentDescriptions}
                                    paperSize={paperSize}
                                />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrintRaporPage;
