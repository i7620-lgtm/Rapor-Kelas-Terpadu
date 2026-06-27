import React, { useState, useEffect, useRef } from 'react';
import { generateInitialPiagamLayout, PIAGAM_VIEWBOX } from './utils';

export const PiagamEditorModal = ({ isOpen, onClose, settings, onSaveLayout }: any) => {
    const [elements, setElements] = useState<any[]>([]);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const dragInfo = useRef<any>(null);
    const GRID_SIZE = 10;

    useEffect(() => {
        if (isOpen) {
            const currentSemester = settings?.semester || 'Ganjil';
            const layoutField = currentSemester === 'Genap' ? 'piagam_layout_Genap' : 'piagam_layout';
            const layoutToLoad = settings[layoutField] && settings[layoutField].length > 0
                ? JSON.parse(JSON.stringify(settings[layoutField]))
                : generateInitialPiagamLayout(settings);
            setElements(layoutToLoad);
            setSelectedElementId(null);
        }
    }, [isOpen, settings]);

    const handleSelectElement = (id: any, e: any) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleDeselect = () => setSelectedElementId(null);
    
    const updateElement = (id: any, updates: any) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleMouseDown = (e: any, el: any) => {
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

        const handleMouseMove = (moveEvent: any) => {
            if (!dragInfo.current) return;
            const pt = svg.createSVGPoint();
            pt.x = moveEvent.clientX;
            pt.y = moveEvent.clientY;
            const newTransformedPt = pt.matrixTransform(dragInfo.current.ctm);
            let newX = newTransformedPt.x - dragInfo.current.offset.x;
            let newY = newTransformedPt.y - dragInfo.current.offset.y;
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
    
    const addElement = () => {
        const newId = `text_${Date.now()}`;
        setElements(prev => [...prev, { id: newId, type: 'text', content: 'Teks Baru', x: 50, y: 100, width: 200, fontSize: 14, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Tinos' }]);
        setSelectedElementId(newId as any);
    };
    
    const deleteElement = () => {
        if (selectedElementId) {
            setElements(prev => prev.filter(el => el.id !== selectedElementId));
            setSelectedElementId(null);
        }
    };
    
    if (!isOpen) return null;

    const selectedElement = elements.find(el => el.id === selectedElementId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleDeselect}>
            <div className="bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-800">Editor Visual Tata Letak Piagam</h2>
                    <div>
                        <button onClick={onClose} className="text-slate-600 hover:text-slate-900 mr-4">Batal</button>
                        <button onClick={() => { onSaveLayout(elements); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Simpan Desain</button>
                    </div>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 p-4 overflow-auto bg-slate-200 flex justify-center items-start">
                        <div className="bg-white shadow-lg relative" style={{ width: '29.7cm', height: '21cm' }}>
                            <div
                                className="absolute w-full h-full"
                                onClick={handleDeselect}
                                style={{
                                    backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                                }}
                            >
                               <svg ref={svgRef} width="100%" height="100%" viewBox={PIAGAM_VIEWBOX} preserveAspectRatio="none" className="cursor-default">
                                    {elements.map(el => {
                                        const isSelected = el.id === selectedElementId;
                                        const commonProps = { key: el.id, onClick: (e: any) => handleSelectElement(el.id, e), onMouseDown: (e: any) => handleMouseDown(el.id, e), style: { cursor: 'move' } };
                                        
                                        let elementRender;
                                        if (el.type === 'text') {
                                            let textAnchor = "start", xPos = el.x;
                                            if (el.textAlign === 'center') { textAnchor = "middle"; xPos = el.x + (el.width ?? 0) / 2; }
                                            else if (el.textAlign === 'right') { textAnchor = "end"; xPos = el.x + (el.width ?? 0); }
                                            
                                            if (el.id === 'piagam_title') {
                                                elementRender = (
                                                    <g>
                                                        <text x={xPos + 3} y={el.y + 3} fontSize={el.fontSize} fontWeight={el.fontWeight} textAnchor={textAnchor} fontFamily={el.fontFamily} fill="#F59E0B" dominantBaseline={el.dominantBaseline || 'auto'} style={{ userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) }}>{el.content}</text>
                                                        <text x={xPos} y={el.y} fontSize={el.fontSize} fontWeight={el.fontWeight} textAnchor={textAnchor} fontFamily={el.fontFamily} fill={el.fill || 'black'} dominantBaseline={el.dominantBaseline || 'auto'} style={{ userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) }}>{el.content}</text>
                                                    </g>
                                                );
                                            } else {
                                                elementRender = <text x={xPos} y={el.y} fontSize={el.fontSize} fontWeight={el.fontWeight} textAnchor={textAnchor} fontFamily={el.fontFamily} fill={el.fill || 'black'} dominantBaseline={el.dominantBaseline || 'auto'} style={{ userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) }}>{el.content}</text>;
                                            }
                                        } else if (el.type === 'image') {
                                            const imageUrl = String(settings[el.content] || '');
                                            elementRender = imageUrl ? <image href={imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} /> : null;
                                        } else if (el.type === 'rect' || el.type === 'line') {
                                            elementRender = <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill || "black"} rx={el.rx || 0} ry={el.ry || 0} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                                        } else {
                                            return null;
                                        }
                                        
                                        const selectionBoxHeight = (el.type === 'text') ? (el.fontSize || 14) * 1.2 : (el.height || 0);
                                        const selectionBoxY = (el.type === 'text') ? (el.dominantBaseline === 'middle' ? el.y - (selectionBoxHeight / 2) : el.y - (el.fontSize || 14)) : el.y;

                                        return (
                                            <g {...commonProps}>
                                                {elementRender}
                                                {isSelected && <rect x={el.x} y={selectionBoxY} width={el.width} height={selectionBoxHeight} fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" style={{ pointerEvents: 'none' }} />}
                                            </g>
                                        );
                                    })}
                               </svg>
                            </div>
                        </div>
                    </main>
                    <div className="w-72 bg-white p-4 border-l overflow-y-auto">
                        <h3 className="font-semibold mb-2">Alat</h3>
                        <button onClick={addElement} className="w-full text-left p-2 rounded hover:bg-slate-100 mb-4">Tambah Teks</button>
                         {selectedElement ? (
                             <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold">Properti Elemen</h3>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <label className="text-sm">Posisi X</label>
                                        <input type='number' step={GRID_SIZE} value={selectedElement.x} onChange={e => updateElement(selectedElementId, { x: parseInt(e.target.value) || 0 })} className='w-full p-1 border rounded' />
                                    </div>
                                    <div>
                                        <label className="text-sm">Posisi Y</label>
                                        <input type='number' step={GRID_SIZE} value={selectedElement.y} onChange={e => updateElement(selectedElementId, { y: parseInt(e.target.value) || 0 })} className='w-full p-1 border rounded' />
                                    </div>
                                </div>
                                 {(selectedElement.type === 'text' || selectedElement.type === 'image' || selectedElement.type === 'rect' || selectedElement.type === 'line') && (
                                     <>
                                        <div><label className="text-sm">Lebar (Width)</label><input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElementId, { width: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        {selectedElement.hasOwnProperty('height') && <div><label className="text-sm">Tinggi (Height)</label><input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElementId, { height: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>}
                                    </>
                                )}
                                {selectedElement.type === 'text' && (
                                     <>
                                        <div><label className="text-sm">Teks</label><textarea value={selectedElement.content} onChange={e => updateElement(selectedElementId, { content: e.target.value })} className="w-full p-1 border rounded" rows={3} /></div>
                                        <div><label className="text-sm">Ukuran Font</label><input type="number" value={selectedElement.fontSize} onChange={e => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })} className="w-full p-1 border rounded" /></div>
                                        <div><label className="text-sm">Jenis Font</label><select value={selectedElement.fontFamily} onChange={e => updateElement(selectedElementId, { fontFamily: e.target.value })} className="w-full p-1 border rounded">
                                            <option value="Tinos">Tinos (Formal)</option>
                                            <option value="Pinyon Script">Pinyon Script (Elegan)</option>
                                            <option value="Alex Brush">Alex Brush (Klasik)</option>
                                            <option value="Great Vibes">Great Vibes (Artistik)</option>
                                            <option value="Dancing Script">Dancing Script (Santai)</option>
                                            <option value="system-ui">System UI (Modern)</option>
                                        </select></div>
                                        <div><label className="text-sm">Ketebalan</label><select value={selectedElement.fontWeight} onChange={e => updateElement(selectedElementId, { fontWeight: e.target.value })} className="w-full p-1 border rounded"><option value="normal">Normal</option><option value="bold">Tebal</option></select></div>
                                        <div><label className="text-sm">Perataan</label><select value={selectedElement.textAlign} onChange={e => updateElement(selectedElementId, { textAlign: e.target.value })} className="w-full p-1 border rounded"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></div>
                                        <div>
                                            <label className="text-sm">Garis Bawah</label>
                                            <select value={selectedElement.textDecoration || 'none'} onChange={e => updateElement(selectedElementId, { textDecoration: e.target.value })} className="w-full p-1 border rounded">
                                                <option value="none">Tidak</option>
                                                <option value="underline">Ya</option>
                                            </select>
                                        </div>
                                     </>
                                )}
                                <button onClick={deleteElement} className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100 mt-4">Hapus Elemen</button>
                             </div>
                         ) : <p className="text-sm text-slate-500 pt-4 border-t">Pilih sebuah elemen untuk melihat propertinya.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
