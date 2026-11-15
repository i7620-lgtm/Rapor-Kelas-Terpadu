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
            let rawLayout = settings?.piagam_layout ?? settings?.piagam_layout_Genap;
            if (typeof rawLayout === 'string') {
                try {
                    rawLayout = JSON.parse(rawLayout);
                } catch {
                    rawLayout = null;
                }
            }
            const layoutToLoad = Array.isArray(rawLayout) && rawLayout.length > 0
                ? JSON.parse(JSON.stringify(rawLayout))
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

    const handlePointerDown = (e: any, el: any) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (!svgRef.current) return;
        e.stopPropagation();
        setSelectedElementId(el.id);

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

        const handlePointerMove = (moveEvent: any) => {
            if (!dragInfo.current) return;
            moveEvent.preventDefault();
            const ptMove = svg.createSVGPoint();
            ptMove.x = moveEvent.clientX;
            ptMove.y = moveEvent.clientY;
            const newTransformedPt = ptMove.matrixTransform(dragInfo.current.ctm);
            let newX = newTransformedPt.x - dragInfo.current.offset.x;
            let newY = newTransformedPt.y - dragInfo.current.offset.y;
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            updateElement(dragInfo.current.elementId, { x: newX, y: newY });
        };
        const handlePointerUp = () => {
            dragInfo.current = null;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4" onClick={handleDeselect}>
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-7xl h-[95vh] h-[95dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Editor Visual Tata Letak Piagam</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-3 py-1.5 min-h-[44px] lg:min-h-0 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button>
                        <button onClick={() => { onSaveLayout(elements); onClose(); }} className="px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Simpan Desain</button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    <main className="flex-1 p-4 overflow-auto bg-slate-200 dark:bg-slate-950 flex justify-start lg:justify-center items-start">
                        <div className="shadow-lg relative shrink-0" style={{ width: '29.7cm', height: '21cm', backgroundColor: '#ffffff', color: '#000000' }}>
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
                                        const commonProps = { key: el.id, onClick: (e: any) => handleSelectElement(el.id, e), onPointerDown: (e: any) => handlePointerDown(e, el), style: { cursor: 'move', touchAction: 'none' } };
                                        
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
                    <div className="w-full md:w-72 bg-white dark:bg-slate-900 p-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[38vh] md:max-h-none flex-shrink-0 shadow-sm text-left text-slate-800 dark:text-slate-100">
                        <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">Alat</h3>
                        <button onClick={addElement} className="w-full text-left px-3 py-2 min-h-[44px] lg:min-h-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium mb-4">Tambah Teks</button>
                         {selectedElement ? (
                             <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Properti Elemen</h3>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <label className="text-xs font-semibold">Posisi X</label>
                                        <input type='number' step={GRID_SIZE} value={selectedElement.x} onChange={e => updateElement(selectedElementId, { x: parseInt(e.target.value) || 0 })} className='w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums' />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Posisi Y</label>
                                        <input type='number' step={GRID_SIZE} value={selectedElement.y} onChange={e => updateElement(selectedElementId, { y: parseInt(e.target.value) || 0 })} className='w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums' />
                                    </div>
                                </div>
                                 {(selectedElement.type === 'text' || selectedElement.type === 'image' || selectedElement.type === 'rect' || selectedElement.type === 'line') && (
                                     <>
                                        <div><label className="text-xs font-semibold">Lebar (Width)</label><input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElementId, { width: parseInt(e.target.value) })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums" /></div>
                                        {selectedElement.hasOwnProperty('height') && <div><label className="text-xs font-semibold">Tinggi (Height)</label><input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElementId, { height: parseInt(e.target.value) })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums" /></div>}
                                    </>
                                )}
                                {selectedElement.type === 'text' && (
                                     <>
                                        <div><label className="text-xs font-semibold">Teks</label><textarea value={selectedElement.content} onChange={e => updateElement(selectedElementId, { content: e.target.value })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" rows={3} /></div>
                                        <div><label className="text-xs font-semibold">Ukuran Font</label><input type="number" value={selectedElement.fontSize} onChange={e => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums" /></div>
                                        <div><label className="text-xs font-semibold">Jenis Font</label><select value={selectedElement.fontFamily} onChange={e => updateElement(selectedElementId, { fontFamily: e.target.value })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                            <option value="Tinos">Tinos (Formal)</option>
                                            <option value="Pinyon Script">Pinyon Script (Elegan)</option>
                                            <option value="Alex Brush">Alex Brush (Klasik)</option>
                                            <option value="Great Vibes">Great Vibes (Artistik)</option>
                                            <option value="Dancing Script">Dancing Script (Santai)</option>
                                            <option value="system-ui">System UI (Modern)</option>
                                        </select></div>
                                        <div><label className="text-xs font-semibold">Ketebalan</label><select value={selectedElement.fontWeight} onChange={e => updateElement(selectedElementId, { fontWeight: e.target.value })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"><option value="normal">Normal</option><option value="bold">Tebal</option></select></div>
                                        <div><label className="text-xs font-semibold">Perataan</label><select value={selectedElement.textAlign} onChange={e => updateElement(selectedElementId, { textAlign: e.target.value })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></div>
                                        <div>
                                            <label className="text-xs font-semibold">Garis Bawah</label>
                                            <select value={selectedElement.textDecoration || 'none'} onChange={e => updateElement(selectedElementId, { textDecoration: e.target.value })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                                <option value="none">Tidak</option>
                                                <option value="underline">Ya</option>
                                            </select>
                                        </div>
                                     </>
                                )}
                                <button onClick={deleteElement} className="w-full text-left p-2 min-h-[44px] lg:min-h-0 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-medium mt-4">Hapus Elemen</button>
                             </div>
                         ) : <p className="text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">Pilih sebuah elemen untuk melihat propertinya.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
