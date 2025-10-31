import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, KopLayout, KopElement, Subject, Extracurricular } from '../types.js';
import { GoogleGenAI } from '@google/genai';

// Helper function moved outside to be accessible by both modal and preview
const generateInitialLayout = (appSettings: AppSettings): KopLayout => {
    return [
        // Images
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 20, width: 80, height: 80 },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 690, y: 20, width: 80, height: 80 },
        // Lines
        { id: 'line_1', type: 'line', content: '', x: 10, y: 130, width: 780, height: 2 },
        // Text fields
        { id: 'nama_dinas_pendidikan_text', type: 'text', content: appSettings.nama_dinas_pendidikan || "PEMERINTAH KOTA CONTOH", x: 120, y: 20, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 14 },
        { id: 'nama_sekolah_text', type: 'text', content: appSettings.nama_sekolah || "SEKOLAH DASAR NEGERI CONTOH", x: 120, y: 50, width: 550, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
        { id: 'alamat_sekolah_text', type: 'text', content: appSettings.alamat_sekolah || "Jalan Contoh No. 123", x: 120, y: 80, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
        { id: 'kontak_sekolah_text', type: 'text', content: `Telepon: ${appSettings.telepon_sekolah || ''} | Email: ${appSettings.email_sekolah || ''}`, x: 120, y: 100, width: 550, textAlign: 'center', fontWeight: 'normal', fontSize: 12 },
    ];
};


// --- Start of KopSuratEditorModal ---
interface KopSuratEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSaveLayout: (layout: KopLayout) => void;
}

const KopSuratEditorModal: React.FC<KopSuratEditorModalProps> = ({ isOpen, onClose, settings, onSaveLayout }) => {
    const [elements, setElements] = useState<KopLayout>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    
    const svgRef = useRef<SVGSVGElement>(null);
    const dragInfo = useRef<{ elementId: string; offset: { x: number; y: number }; ctm: DOMMatrix | null } | null>(null);
    const GRID_SIZE = 10;

    useEffect(() => {
        if (isOpen) {
            const layoutToLoad = settings.kop_layout && settings.kop_layout.length > 0 ? settings.kop_layout : generateInitialLayout(settings);
            // Sync with latest settings from the form
            const syncedLayout = layoutToLoad.map(el => {
                if (el.type === 'text') {
                    if (el.id === 'nama_dinas_pendidikan_text') return { ...el, content: settings.nama_dinas_pendidikan };
                    if (el.id === 'nama_sekolah_text') return { ...el, content: settings.nama_sekolah };
                    if (el.id === 'alamat_sekolah_text') return { ...el, content: settings.alamat_sekolah };
                    if (el.id === 'kontak_sekolah_text') return { ...el, content: `Telepon: ${settings.telepon_sekolah || ''} | Email: ${settings.email_sekolah || ''}` };
                }
                return el;
            });
            setElements(syncedLayout);
            setSelectedElementId(null);
        }
    }, [isOpen, settings]);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragInfo.current || !svgRef.current) return;
            e.preventDefault();

            const svg = svgRef.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;

            const transformedPt = pt.matrixTransform(dragInfo.current.ctm!);
            let newX = transformedPt.x - dragInfo.current.offset.x;
            let newY = transformedPt.y - dragInfo.current.offset.y;
            
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

            updateElement(dragInfo.current.elementId, { x: newX, y: newY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            dragInfo.current = null;
        };
        
        if (dragInfo.current) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo.current]);


    if (!isOpen) return null;

    const handleSelectElement = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleDeselect = () => {
        setSelectedElementId(null);
    };
    
    const updateElement = (id: string, updates: Partial<KopElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };
    
    const handleMouseDown = (e: React.MouseEvent, el: KopElement) => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const ctm = svg.getScreenCTM()?.inverse();
        if (!ctm) return;
        
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const transformedPt = pt.matrixTransform(ctm);
        
        dragInfo.current = {
            elementId: el.id,
            offset: { x: transformedPt.x - el.x, y: transformedPt.y - el.y },
            ctm: ctm
        };
    };

    const addElement = (type: 'text' | 'line') => {
        const newId = `${type}_${Date.now()}`;
        const newElement: KopElement = {
            id: newId,
            type: type,
            content: type === 'text' ? 'Teks Baru' : '',
            x: 150,
            y: 70,
            ...(type === 'text' && { width: 200, fontSize: 14, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Poppins' }),
            ...(type === 'line' && { width: 300, height: 2 }),
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementId(newId);
    };

    const deleteElement = () => {
        if (selectedElementId) {
            setElements(prev => prev.filter(el => el.id !== selectedElementId));
            setSelectedElementId(null);
        }
    };
    
    const handleTranslateToBalinese = async () => {
        const selectedEl = elements.find(el => el.id === selectedElementId);
        if (!selectedEl || selectedEl.type !== 'text' || !selectedEl.content) return;
        
        setIsTranslating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Transliterasikan teks Latin berikut ke Aksara Bali: "${selectedEl.content}"`,
            });
            const balineseText = response.text;
            updateElement(selectedElementId!, { content: balineseText.trim() });
        } catch (error) {
            console.error("Gagal melakukan transliterasi:", error);
            alert("Terjadi kesalahan saat mencoba mengubah teks ke Aksara Bali.");
        } finally {
            setIsTranslating(false);
        }
    };
    
    const handleSave = () => {
        onSaveLayout(elements);
        onClose();
    };

    const selectedElement = elements.find(el => el.id === selectedElementId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleDeselect}>
            <div className="bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-800">Editor Visual Kop Surat</h2>
                    <div>
                        <button onClick={onClose} className="text-slate-600 hover:text-slate-900 mr-4">Batal</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Simpan Desain</button>
                    </div>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-48 bg-white p-4 border-r space-y-4">
                        <h3 className="font-semibold">Alat</h3>
                        <button onClick={() => addElement('text')} className="w-full text-left p-2 rounded hover:bg-slate-100">Tambah Teks</button>
                        <button onClick={() => addElement('line')} className="w-full text-left p-2 rounded hover:bg-slate-100">Tambah Garis</button>
                    </div>
                    <main className="flex-1 p-4 overflow-auto bg-slate-200 flex justify-center items-center">
                        <div className="w-full max-w-[800px] bg-white shadow-lg relative" onClick={handleDeselect} style={{
                            backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                        }}>
                           <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 135" preserveAspectRatio="xMidYMin meet" className="cursor-default">
                                {elements.map(el => {
                                    const isSelected = el.id === selectedElementId;
                                    const commonProps = {
                                        key: el.id,
                                        onClick: (e: React.MouseEvent) => handleSelectElement(el.id, e),
                                        onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, el),
                                        style: { cursor: 'move' }
                                    };

                                    let elementRender;
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
                                        elementRender = (
                                            <text
                                                x={xPos}
                                                y={el.y + (el.fontSize ?? 14)}
                                                fontSize={el.fontSize}
                                                fontWeight={el.fontWeight}
                                                textAnchor={textAnchor}
                                                fontFamily={el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'Poppins'}
                                                style={{ userSelect: 'none', ...commonProps.style }}
                                            >
                                                {el.content}
                                            </text>
                                        );
                                    } else if (el.type === 'image') {
                                        const imageUrl = String(settings[el.content as keyof AppSettings] || 'https://via.placeholder.com/100');
                                        elementRender = (
                                            <image
                                                href={imageUrl}
                                                x={el.x}
                                                y={el.y}
                                                width={el.width}
                                                height={el.height}
                                            />
                                        );
                                    } else if (el.type === 'line') {
                                        elementRender = (
                                            <rect
                                                x={el.x}
                                                y={el.y}
                                                width={el.width}
                                                height={el.height}
                                                fill="black"
                                            />
                                        );
                                    }
                                    
                                    return (
                                        <g key={el.id} {...commonProps}>
                                            {elementRender}
                                            {isSelected && (
                                                <rect
                                                    x={el.x}
                                                    y={el.y}
                                                    width={el.width}
                                                    height={el.type === 'text' ? (el.fontSize ?? 14) * 1.2 : el.height}
                                                    fill="none"
                                                    stroke="#4f46e5"
                                                    strokeWidth="2"
                                                    strokeDasharray="4 4"
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                           </svg>
                        </div>
                    </main>
                    <div className="w-72 bg-white p-4 border-l overflow-y-auto">
                         <h3 className="font-semibold mb-4">Properti</h3>
                         {selectedElement ? (
                             <div className="space-y-4">
                                {selectedElement.type === 'text' && (
                                     <>
                                        <div>
                                            <label className="text-sm">Teks</label>
                                            <textarea value={selectedElement.content} onChange={e => updateElement(selectedElementId!, { content: e.target.value })} className="w-full p-1 border rounded" rows={3}></textarea>
                                            <button onClick={handleTranslateToBalinese} disabled={isTranslating} className="mt-2 text-xs w-full text-indigo-700 bg-indigo-100 p-1.5 rounded hover:bg-indigo-200 disabled:bg-slate-200 disabled:text-slate-500">
                                               {isTranslating ? 'Memproses...' : 'Ubah ke Aksara Bali ✨'}
                                            </button>
                                        </div>
                                        <div><label className="text-sm">Ukuran Font</label><input type="number" value={selectedElement.fontSize} onChange={e => updateElement(selectedElementId!, { fontSize: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        <div><label className="text-sm">Lebar (Width)</label><input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElementId!, { width: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        <div><label className="text-sm">Jenis Font</label><select value={selectedElement.fontFamily} onChange={e => updateElement(selectedElementId!, { fontFamily: e.target.value as any })} className="w-full p-1 border rounded"><option value="Poppins">Poppins (Latin)</option><option value="Noto Sans Balinese">Noto Sans (Aksara Bali)</option></select></div>
                                        <div><label className="text-sm">Ketebalan</label><select value={selectedElement.fontWeight} onChange={e => updateElement(selectedElementId!, { fontWeight: e.target.value as any })} className="w-full p-1 border rounded"><option value="normal">Normal</option><option value="bold">Tebal</option></select></div>
                                        <div><label className="text-sm">Perataan</label><select value={selectedElement.textAlign} onChange={e => updateElement(selectedElementId!, { textAlign: e.target.value as any })} className="w-full p-1 border rounded"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></div>
                                     </>
                                )}
                                {selectedElement.type === 'image' && (
                                     <>
                                        <div><label className="text-sm">Lebar (px)</label><input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElementId!, { width: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        <div><label className="text-sm">Tinggi (px)</label><input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElementId!, { height: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                    </>
                                )}
                                {selectedElement.type === 'line' && (
                                    <>
                                        <div><label className="text-sm">Lebar (px)</label><input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElementId!, { width: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        <div><label className="text-sm">Tebal (px)</label><input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElementId!, { height: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                    </>
                                )}
                                 <button onClick={deleteElement} className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100">Hapus Elemen</button>
                             </div>
                         ) : <p className="text-sm text-slate-500">Pilih sebuah elemen untuk melihat propertinya.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- End of KopSuratEditorModal ---

// --- Start of KopSuratPreview ---
const KopSuratPreview: React.FC<{ settings: AppSettings }> = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="bg-white shadow-inner relative w-full max-w-[800px] mx-auto overflow-hidden" style={{ aspectRatio: '800 / 135' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 135" preserveAspectRatio="xMidYMin meet" className="absolute top-0 left-0">
                    {layout.map(el => {
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
                                    y={el.y + (el.fontSize ?? 14)} // Adjust y for text baseline
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
                            const imageUrl = String(settings[el.content as keyof AppSettings] || 'https://via.placeholder.com/100');
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
        </div>
    );
};
// --- End of KopSuratPreview ---

interface FormFieldProps {
    label: string;
    id: keyof AppSettings;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    type?: string;
    placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, id, type = 'text', placeholder, value, onChange, onBlur }) => (
    <div className="col-span-1">
        <label htmlFor={String(id)} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={String(id)}
            name={String(id)}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 placeholder:text-slate-400"
            placeholder={placeholder}
        />
    </div>
);

const FileInputField: React.FC<{ label: string; id: keyof AppSettings; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSave: () => void; imagePreview?: string | null }> = ({ label, id, onChange, onSave, imagePreview }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        onSave();
    };
    
    return (
     <div className="col-span-1">
        <label htmlFor={String(id)} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <div className="mt-1 flex items-center gap-4 p-2 border-2 border-slate-300 border-dashed rounded-md">
            {imagePreview ? (
                <img src={imagePreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-md bg-slate-100" />
            ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs text-center">Pratinjau</div>
            )}
            <div className="text-center flex-1">
                <div className="flex text-sm text-slate-600 justify-center">
                    <label htmlFor={String(id)} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Unggah file</span>
                        <input id={String(id)} name={String(id)} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                </div>
                 <p className="text-xs text-slate-500">PNG atau JPG</p>
            </div>
        </div>
    </div>
    );
};

// --- Start of PengaturanMapel ---
interface PengaturanMapelProps {
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
}

const PengaturanMapel: React.FC<PengaturanMapelProps> = ({ subjects, onUpdateSubjects }) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectLabel, setNewSubjectLabel] = useState('');

    const activeSubjects = subjects.filter(s => s.active);
    const inactiveSubjects = subjects.filter(s => !s.active);

    const handleToggle = (subjectId: string) => {
        onUpdateSubjects(subjects.map(s => s.id === subjectId ? { ...s, active: !s.active } : s));
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim() || !newSubjectLabel.trim()) {
            alert("Nama mata pelajaran dan singkatan tidak boleh kosong.");
            return;
        }
        const newId = newSubjectLabel.trim().toUpperCase().replace(/\s+/g, '');
        if (subjects.some(s => s.id === newId)) {
            alert("Singkatan mata pelajaran sudah ada. Harap gunakan singkatan yang unik.");
            return;
        }

        const newSubject: Subject = {
            id: newId,
            fullName: newSubjectName.trim(),
            label: newSubjectLabel.trim(),
            active: true
        };

        onUpdateSubjects([...subjects, newSubject]);
        setNewSubjectName('');
        setNewSubjectLabel('');
    };

    const SubjectItem: React.FC<{subject: Subject, isActive: boolean}> = ({ subject, isActive }) => (
        <div 
            onClick={() => handleToggle(subject.id)}
            className={`p-3 border rounded-md shadow-sm cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 ${isActive ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'}`}
            title={`Klik untuk memindahkan`}
        >
            <p className={`font-medium ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{subject.fullName}</p>
            <p className="text-sm text-slate-500">Singkatan: {subject.label}</p>
        </div>
    );
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Aktif</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-slate-50 p-2 rounded-md border">
                        {activeSubjects.length > 0 ? activeSubjects.map(s => <SubjectItem key={s.id} subject={s} isActive={true} />) : <p className="text-slate-500 text-sm p-2">Tidak ada.</p>}
                    </div>
                </div>
                <div>
                     <h4 className="text-md font-semibold text-slate-700 mb-2">Tidak Aktif</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-slate-50 p-2 rounded-md border">
                        {inactiveSubjects.length > 0 ? inactiveSubjects.map(s => <SubjectItem key={s.id} subject={s} isActive={false} />) : <p className="text-slate-500 text-sm p-2">Tidak ada.</p>}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <h4 className="text-md font-semibold text-slate-700 mb-2">Tambah Mata Pelajaran Baru</h4>
                <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="flex-1 w-full">
                        <label htmlFor="new-subject-name" className="block text-xs font-medium text-slate-700 mb-1">Nama Mata Pelajaran</label>
                        <input
                            type="text"
                            id="new-subject-name"
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                            placeholder="Contoh: Bahasa Sunda"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label htmlFor="new-subject-label" className="block text-xs font-medium text-slate-700 mb-1">Singkatan (ID Unik)</label>
                        <input
                            type="text"
                            id="new-subject-label"
                            value={newSubjectLabel}
                            onChange={e => setNewSubjectLabel(e.target.value)}
                            placeholder="Contoh: BSunda"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        />
                    </div>
                    <button
                        onClick={handleAddSubject}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    );
}
// --- End of PengaturanMapel ---

// --- Start of PengaturanEkstra ---
interface PengaturanEkstraProps {
    extracurriculars: Extracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
}

const PengaturanEkstra: React.FC<PengaturanEkstraProps> = ({ extracurriculars, onUpdateExtracurriculars }) => {
    const [newExtraName, setNewExtraName] = useState('');

    const handleToggle = (id: string) => {
        const updated = extracurriculars.map(ex => ex.id === id ? { ...ex, active: !ex.active } : ex);
        onUpdateExtracurriculars(updated);
    };

    const handleAdd = () => {
        if (!newExtraName.trim()) return;
        const newId = newExtraName.trim().toUpperCase().replace(/\s+/g, '_');
        if (extracurriculars.some(ex => ex.id === newId)) {
            alert("Ekstrakurikuler dengan ID ini sudah ada.");
            return;
        }
        const newExtra: Extracurricular = { id: newId, name: newExtraName.trim(), active: true };
        onUpdateExtracurriculars([...extracurriculars, newExtra]);
        setNewExtraName('');
    };

    const activeList = extracurriculars.filter(e => e.active);
    const inactiveList = extracurriculars.filter(e => !e.active);
    
    const EkstraItem: React.FC<{extra: Extracurricular, isActive: boolean}> = ({ extra, isActive }) => (
        <div 
            key={extra.id} 
            onClick={() => handleToggle(extra.id)} 
            className={`p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors ${isActive ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'}`}
        >
            <p className={`font-medium ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{extra.name}</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Aktif</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-slate-50 p-2 rounded-md border">
                        {activeList.map(ex => <EkstraItem key={ex.id} extra={ex} isActive={true} />)}
                    </div>
                </div>
                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Tidak Aktif</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-slate-50 p-2 rounded-md border">
                         {inactiveList.map(ex => <EkstraItem key={ex.id} extra={ex} isActive={false} />)}
                    </div>
                </div>
            </div>

             <div className="pt-4 border-t">
                <h4 className="text-md font-semibold text-slate-700 mb-2">Tambah Ekstrakurikuler Baru</h4>
                <div className="flex items-end gap-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="flex-grow">
                        <label htmlFor="new-extra-name" className="block text-xs font-medium text-slate-700 mb-1">Nama Ekstrakurikuler</label>
                        <input
                            type="text"
                            id="new-extra-name"
                            value={newExtraName}
                            onChange={e => setNewExtraName(e.target.value)}
                            placeholder="Contoh: Seni Lukis"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- End of PengaturanEkstra ---


interface SettingsPageProps {
    settings: AppSettings;
    onSettingsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onUpdateKopLayout: (layout: KopLayout) => void;
    subjects: Subject[];
    onUpdateSubjects: (subjects: Subject[]) => void;
    extracurriculars: Extracurricular[];
    onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange, onSave, onUpdateKopLayout, subjects, onUpdateSubjects, extracurriculars, onUpdateExtracurriculars }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    return (
        <>
            <KopSuratEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                settings={settings}
                onSaveLayout={onUpdateKopLayout}
            />
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Pengaturan</h2>
                    <p className="mt-2 text-slate-600">Kelola informasi sekolah, periode akademik, dan data penting lainnya. Perubahan disimpan secara otomatis.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <div className="space-y-12">
                        {/* Profil Sekolah */}
                        <section>
                            <div className="flex justify-between items-center border-b pb-3 mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Profil Sekolah</h3>
                                 <button
                                    onClick={() => setIsEditorOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                                >
                                    Desain Kop Surat
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-4">
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="md:col-span-2"><FormField label="Nama Dinas Pendidikan" id="nama_dinas_pendidikan" value={settings.nama_dinas_pendidikan} onChange={onSettingsChange} onBlur={onSave} /></div>
                                    <FormField label="Nama Sekolah" id="nama_sekolah" value={settings.nama_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="NPSN" id="npsn" value={settings.npsn} onChange={onSettingsChange} onBlur={onSave} />
                                    <div className="md:col-span-2"><FormField label="Alamat Sekolah" id="alamat_sekolah" value={settings.alamat_sekolah} onChange={onSettingsChange} onBlur={onSave} /></div>
                                    <FormField label="Desa / Kelurahan" id="desa_kelurahan" value={settings.desa_kelurahan} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Kecamatan" id="kecamatan" value={settings.kecamatan} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Kota/Kabupaten" id="kota_kabupaten" value={settings.kota_kabupaten} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Provinsi" id="provinsi" value={settings.provinsi} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Kode Pos" id="kode_pos" value={settings.kode_pos} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Email Sekolah" id="email_sekolah" type="email" value={settings.email_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Telepon Sekolah" id="telepon_sekolah" value={settings.telepon_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Website Sekolah" id="website_sekolah" value={settings.website_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <div className="md:col-span-2"><FormField label="Faksimile" id="faksimile" value={settings.faksimile} onChange={onSettingsChange} onBlur={onSave} /></div>
                                </div>
                                <div className="lg:col-span-1 space-y-4">
                                    <FileInputField label="Logo Sekolah" id="logo_sekolah" onChange={onSettingsChange} onSave={onSave} imagePreview={typeof settings.logo_sekolah === 'string' ? settings.logo_sekolah : null} />
                                    <FileInputField label="Logo Dinas Pendidikan" id="logo_dinas" onChange={onSettingsChange} onSave={onSave} imagePreview={typeof settings.logo_dinas === 'string' ? settings.logo_dinas : null} />
                                    <div className="pt-4">
                                        <h4 className="text-lg font-semibold text-slate-700">Pratinjau Kop Surat</h4>
                                        <p className="text-sm text-slate-500 mb-4">Ini adalah tampilan yang akan digunakan saat mencetak rapor. Klik 'Desain Kop Surat' untuk mengubah.</p>
                                        <KopSuratPreview settings={settings} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
                             <section>
                                <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Periode Akademik</h3>
                                 <div className="space-y-4">
                                    <FormField label="Nama Kelas" id="nama_kelas" value={settings.nama_kelas} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Tahun Ajaran" id="tahun_ajaran" placeholder="e.g. 2023/2024" value={settings.tahun_ajaran} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Semester" id="semester" placeholder="e.g. Ganjil atau Genap" value={settings.semester} onChange={onSettingsChange} onBlur={onSave}/>
                                    <FormField label="Tempat, Tanggal Rapor" id="tanggal_rapor" placeholder="e.g. Jakarta, 20 Desember 2023" value={settings.tanggal_rapor} onChange={onSettingsChange} onBlur={onSave}/>
                                </div>
                            </section>
                            <section>
                                <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Kepala Sekolah dan Guru</h3>
                                 <div className="space-y-4">
                                    <FormField label="Nama Kepala Sekolah" id="nama_kepala_sekolah" value={settings.nama_kepala_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="NIP Kepala Sekolah" id="nip_kepala_sekolah" value={settings.nip_kepala_sekolah} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="Nama Wali Kelas" id="nama_wali_kelas" value={settings.nama_wali_kelas} onChange={onSettingsChange} onBlur={onSave} />
                                    <FormField label="NIP Wali Kelas" id="nip_wali_kelas" value={settings.nip_wali_kelas} onChange={onSettingsChange} onBlur={onSave} />
                                </div>
                            </section>
                        </div>
                        
                        <section className="pt-6 border-t">
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Mata Pelajaran</h3>
                            <PengaturanMapel subjects={subjects} onUpdateSubjects={onUpdateSubjects} />
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">Ekstrakurikuler</h3>
                            <PengaturanEkstra extracurriculars={extracurriculars} onUpdateExtracurriculars={onUpdateExtracurriculars} />
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;
