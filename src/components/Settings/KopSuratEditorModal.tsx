import React, { useState, useEffect, useRef } from 'react';
import { 
    transliterate, 
    generatePemdaText, 
    expandAndCapitalizeSchoolName, 
    generateInitialLayout 
} from '../TransliterationUtil';
import { TransliterationModal } from './TransliterationModal';

interface KopSuratEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: any;
    onSaveLayout: (elements: any[]) => void;
}

export const KopSuratEditorModal: React.FC<KopSuratEditorModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSaveLayout 
}) => {
    const [elements, setElements] = useState<any[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [transliterationModalOpen, setTransliterationModalOpen] = useState(false);
    
    const svgRef = useRef<SVGSVGElement | null>(null);
    const dragInfo = useRef<{
        elementId: string;
        offset: { x: number; y: number };
        ctm: DOMMatrix;
    } | null>(null);
    const GRID_SIZE = 10;

    useEffect(() => {
        if (isOpen) {
            const currentSemester = settings?.semester || 'Ganjil';
            const layoutField = currentSemester === 'Genap' ? 'kop_layout_Genap' : 'kop_layout';

            let rawLayout = settings[layoutField];
            if (typeof rawLayout === 'string') {
                try {
                    rawLayout = JSON.parse(rawLayout);
                } catch (_e) {
                    rawLayout = null;
                }
            }
            const layoutToLoad = Array.isArray(rawLayout) && rawLayout.length > 0 
                ? JSON.parse(JSON.stringify(rawLayout))
                : generateInitialLayout(settings);
    
            const pemdaText = generatePemdaText(settings.kota_kabupaten, settings.provinsi);
            const dinasDetailText = (settings.nama_dinas_pendidikan || "DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA KOTA DENPASAR").toUpperCase();
            const sekolahText = expandAndCapitalizeSchoolName(settings.nama_sekolah || "SEKOLAH DASAR NEGERI 2 PADANGSAMBIAN");
            const alamatText = settings.alamat_sekolah || "Kebo Iwa Banjar Batuparas";
            const telpText = settings.telepon_sekolah ? `Telepon: ${settings.telepon_sekolah}` : "Telepon: (0361) 9093558";
            const alamatTelpText = [alamatText, telpText].filter(Boolean).join(', ');
            const contactLine2 = [
                settings.kode_pos ? `Kode Pos: ${settings.kode_pos}` : null,
                settings.email_sekolah ? `Email: ${settings.email_sekolah}` : null,
                settings.website_sekolah ? `Website: ${settings.website_sekolah}` : null,
                settings.faksimile ? `Faksimile: ${settings.faksimile}` : null,
            ].filter(Boolean).join(' | ');

            const syncMap: Record<string, string> = {
                'aksara_dinas_text': transliterate(pemdaText),
                'latin_dinas_text': pemdaText,
                'aksara_dinas_detail_text': transliterate(dinasDetailText),
                'latin_dinas_detail_text': dinasDetailText,
                'aksara_sekolah_text': transliterate(sekolahText),
                'latin_sekolah_text': sekolahText,
                'aksara_alamat_telp_text': transliterate(alamatTelpText),
                'latin_alamat_telp_text': alamatTelpText,
                'latin_kontak_lainnya_text': contactLine2,
            };

            const syncedLayout = layoutToLoad.map((el: any) => {
                if (el.type === 'text' && syncMap.hasOwnProperty(el.id)) {
                    return { ...el, content: syncMap[el.id] };
                }
                return el;
            });
    
            setElements(syncedLayout);
            setSelectedElementId(null);
        }
    }, [isOpen, settings]);
    
    if (!isOpen) return null;

    const handleSelectElement = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleDeselect = () => {
        setSelectedElementId(null);
    };
    
    const updateElement = (id: string, updates: Partial<any>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };
    
    const handleMouseDown = (e: React.MouseEvent, el: any) => {
        if (e.button !== 0) return;
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
            ctm: ctm,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragInfo.current) return;
            moveEvent.preventDefault();

            const ptMove = svg.createSVGPoint();
            ptMove.x = moveEvent.clientX;
            ptMove.y = moveEvent.clientY;
            const transformedPtMove = ptMove.matrixTransform(dragInfo.current.ctm);

            let newX = transformedPtMove.x - dragInfo.current.offset.x;
            let newY = transformedPtMove.y - dragInfo.current.offset.y;

            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

            updateElement(dragInfo.current.elementId, { x: newX, y: newY });
        };

        const handleMouseUp = () => {
            dragInfo.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const addElement = (type: 'text' | 'line') => {
        const newId = `${type}_${Date.now()}`;
        const newElement = {
            id: newId,
            type: type,
            content: type === 'text' ? 'Teks Baru' : '',
            x: 150,
            y: 70,
            ...(type === 'text' && { width: 200, fontSize: 14, fontWeight: 'normal', textAlign: 'left', fontFamily: 'System UI' }),
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
    
    const handleSave = () => {
        onSaveLayout(elements);
        onClose();
    };

    const selectedElement = elements.find(el => el.id === selectedElementId);

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", onClick: handleDeselect },
            React.createElement(TransliterationModal, { 
                isOpen: transliterationModalOpen, 
                onClose: () => setTransliterationModalOpen(false),
                onApply: (text) => {
                    if (selectedElementId) {
                        updateElement(selectedElementId, { content: text, fontFamily: 'Noto Sans Balinese' });
                    }
                    setTransliterationModalOpen(false);
                },
                initialText: selectedElement?.content
            }),
            React.createElement('div', { className: "bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col", onClick: e => e.stopPropagation() },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b bg-white rounded-t-lg" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Editor Visual Kop Surat"),
                    React.createElement('div', null,
                        React.createElement('button', { onClick: onClose, className: "text-slate-600 hover:text-slate-900 mr-4" }, "Batal"),
                        React.createElement('button', { onClick: handleSave, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Simpan Desain")
                    )
                ),
                React.createElement('div', { className: "flex flex-col md:flex-row flex-1 overflow-hidden" },
                    React.createElement('div', { className: "w-full md:w-48 bg-white p-4 border-b md:border-b-0 md:border-r flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto flex-shrink-0 items-center md:items-stretch font-medium text-slate-700 text-sm" },
                        React.createElement('h3', { className: "font-semibold hidden md:block text-slate-900" }, "Alat"),
                        React.createElement('button', { onClick: () => addElement('text'), className: "whitespace-nowrap text-center md:text-left p-2 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200" }, "Tambah Teks"),
                        React.createElement('button', { onClick: () => addElement('line'), className: "whitespace-nowrap text-center md:text-left p-2 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200" }, "Tambah Garis")
                    ),
                    React.createElement('main', { className: "flex-1 p-4 overflow-auto bg-slate-200 flex justify-start md:justify-center items-center min-h-[250px]" },
                        React.createElement('div', { className: "w-full min-w-[600px] max-w-[800px] bg-white shadow-lg relative", onClick: handleDeselect, style: {
                            backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                            aspectRatio: '800 / 200'
                        }},
                           React.createElement('svg', { ref: svgRef, width: "100%", height: "100%", viewBox: "0 0 800 200", preserveAspectRatio: "xMidYMin meet", className: "cursor-default" },
                                elements.map(el => {
                                    const isSelected = el.id === selectedElementId;
                                    const commonProps = {
                                        key: el.id,
                                        onClick: (e: React.MouseEvent) => handleSelectElement(el.id, e),
                                        onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, el),
                                        style: { cursor: 'move' }
                                    };

                                    let elementRender;
                                    if (el.type === 'text') {
                                        let textAnchor = "start";
                                        let xPos = el.x;
                                        if (el.textAlign === 'center') {
                                            textAnchor = "middle";
                                            xPos = el.x + (el.width ?? 0) / 2;
                                        } else if (el.textAlign === 'right') {
                                            textAnchor = "end";
                                            xPos = el.x + (el.width ?? 0);
                                        }
                                        elementRender = (
                                            React.createElement('text', {
                                                x: xPos,
                                                y: el.y,
                                                fontSize: el.fontSize,
                                                fontWeight: el.fontWeight,
                                                textAnchor: textAnchor,
                                                fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui',
                                                fill: "black",
                                                style: { userSelect: 'none', ...commonProps.style }
                                            }, el.content)
                                        );
                                    } else if (el.type === 'image') {
                                        const imageUrl = String(settings[el.content] || "data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e2e8f0%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ELogo%3C/text%3E%3C/svg%3E");
                                        elementRender = (
                                            React.createElement('image', {
                                                href: imageUrl,
                                                x: el.x,
                                                y: el.y,
                                                width: el.width,
                                                height: el.height
                                            })
                                        );
                                    } else if (el.type === 'line') {
                                        elementRender = (
                                            React.createElement('rect', {
                                                x: el.x,
                                                y: el.y,
                                                width: el.width,
                                                height: el.height,
                                                fill: "black"
                                            })
                                        );
                                    }
                                    
                                    return (
                                        React.createElement('g', { key: el.id, ...commonProps },
                                            elementRender,
                                            isSelected && (
                                                React.createElement('rect', {
                                                    x: el.x,
                                                    y: el.y - (el.fontSize ?? 14),
                                                    width: el.width,
                                                    height: el.type === 'text' ? (el.fontSize ?? 14) * 1.2 : el.height,
                                                    fill: "none",
                                                    stroke: "#4f46e5",
                                                    strokeWidth: "2",
                                                    strokeDasharray: "4 4",
                                                    style: { pointerEvents: 'none' }
                                                })
                                            )
                                        )
                                    );
                                })
                           )
                        )
                    ),
                    React.createElement('div', { className: "w-full md:w-72 bg-white p-4 border-t md:border-t-0 md:border-l overflow-y-auto flex-shrink-0 text-left text-sm" },
                         React.createElement('h3', { className: "font-semibold mb-4 text-slate-800" }, "Properti"),
                         selectedElement ? (
                             React.createElement('div', { className: "space-y-4 text-slate-700" },
                                React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'text-xs font-semibold' }, 'Posisi X'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.x,
                                            onChange: e => updateElement(selectedElementId!, { x: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1 border rounded bg-white text-slate-900 border-slate-300'
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'text-xs font-semibold' }, 'Posisi Y'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.y,
                                            onChange: e => updateElement(selectedElementId!, { y: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1 border rounded bg-white text-slate-900 border-slate-300'
                                        })
                                    )
                                ),
                                selectedElement.type === 'text' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "text-xs font-semibold" }, "Teks"),
                                            React.createElement('textarea', { value: selectedElement.content, onChange: e => updateElement(selectedElementId!, { content: e.target.value }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300", rows: 3 }),
                                            React.createElement('button', { onClick: () => setTransliterationModalOpen(true), className: "mt-2 text-xs w-full text-indigo-700 bg-indigo-100 p-1.5 rounded hover:bg-indigo-200" },
                                               'Alat Tulis Aksara Bali...'
                                            )
                                        ),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Ukuran Font"), React.createElement('input', { type: "number", value: selectedElement.fontSize, onChange: e => updateElement(selectedElementId!, { fontSize: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (Width)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Jenis Font"), React.createElement('select', { value: selectedElement.fontFamily, onChange: e => updateElement(selectedElementId!, { fontFamily: e.target.value }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" }, React.createElement('option', { value: "system-ui" }, "System UI (Latin)"), React.createElement('option', { value: "Noto Sans Balinese" }, "Noto Sans (Aksara Bali)"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Ketebalan"), React.createElement('select', { value: selectedElement.fontWeight, onChange: e => updateElement(selectedElementId!, { fontWeight: e.target.value }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" }, React.createElement('option', { value: "normal" }, "Normal"), React.createElement('option', { value: "bold" }, "Tebal"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Perataan"), React.createElement('select', { value: selectedElement.textAlign, onChange: e => updateElement(selectedElementId!, { textAlign: e.target.value }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" }, React.createElement('option', { value: "left" }, "Kiri"), React.createElement('option', { value: "center" }, "Tengah"), React.createElement('option', { value: "right" }, "Kanan")))
                                     )
                                ),
                                selectedElement.type === 'image' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Tinggi (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId!, { height: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" }))
                                     )
                                ),
                                selectedElement.type === 'line' && (
                                    React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Tebal (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId!, { height: parseInt(e.target.value) }), className: "w-full p-1 border rounded bg-white text-slate-900 border-slate-300" }))
                                    )
                                ),
                                 React.createElement('button', { onClick: deleteElement, className: "w-full text-left p-2 rounded text-red-600 hover:bg-red-100 font-medium" }, "Hapus Elemen")
                             )
                          ) : React.createElement('p', { className: "text-sm text-slate-500" }, "Pilih sebuah elemen untuk melihat propertinya.")
                    )
                )
            )
        )
    );
};
