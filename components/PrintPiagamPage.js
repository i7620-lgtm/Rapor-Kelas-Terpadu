
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { transliterate, generateInitialLayout } from './TransliterationUtil.js';

const PAPER_SIZES = {
    A4: { width: '29.7cm', height: '21cm' },
    F4: { width: '33cm', height: '21.5cm' },
    Letter: { width: '27.94cm', height: '21.59cm' },
};

const PIAGAM_WIDTH = 1115;
const PIAGAM_HEIGHT = 749; 
const PIAGAM_VIEWBOX = `0 0 ${PIAGAM_WIDTH} ${PIAGAM_HEIGHT}`;

const toRoman = (num) => {
    if (isNaN(num)) return num;
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

// Helper to measure text width
const getTextWidth = (text, font) => {
    if (typeof document === 'undefined') return 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
};

const generateInitialPiagamLayout = (settings) => {
    // Generate the base layout first, which now has dynamically correct Y positions.
    const kopLayout = settings.kop_layout && settings.kop_layout.length > 0 
        ? JSON.parse(JSON.stringify(settings.kop_layout)) 
        : generateInitialLayout(settings);
    
    const yOffset = 50;
    const xOffset = (PIAGAM_WIDTH - 800) / 2;

    const adaptedKopElements = kopLayout.map(el => {
        let newElement = { ...el, id: `kop_${el.id}` };
        
        // Adapt X position for the wider piagam format
        if (el.textAlign === 'center') {
            newElement.x = (PIAGAM_WIDTH - el.width) / 2;
        } else if (el.id === 'logo_sekolah_img') { // Check original ID
             newElement.x = (PIAGAM_WIDTH - xOffset - el.width);
        } else if (el.id === 'line_1') { // Check original ID
             newElement.x = (PIAGAM_WIDTH - 1000) / 2;
             newElement.width = 1000;
        } else {
             // Default for left-aligned things like logo_dinas_img
             newElement.x = el.x + xOffset;
        }
        
        // Adapt Y position uniformly
        newElement.y = el.y + yOffset;
        
        return newElement;
    });
    
    // The line position is already correct relative to the other elements.
    // We just need to find its Y position to place the rest of the piagam content.
    const adaptedLineEl = adaptedKopElements.find(el => el.id.includes('line_1'));
    const kopBottomY = adaptedLineEl.y + (adaptedLineEl.height || 0);
    
    const contentStartY = kopBottomY + 35; 
    const rankBoxWidth = 300;
    const rankBoxHeight = 38; 
    const rankBoxX = (PIAGAM_WIDTH - rankBoxWidth) / 2;
    const rankBoxY = contentStartY + 130 + 7; 

    const paragraphY = rankBoxY + rankBoxHeight + 20; 
    const signatureY = paragraphY + 105;

    return [
        ...adaptedKopElements,
        { 
            id: 'piagam_title', 
            type: 'text', 
            content: 'PIAGAM PENGHARGAAN', 
            x: 61.5, 
            y: contentStartY, 
            width: 1000, 
            fontSize: 42, 
            fontWeight: 'bold', 
            textAlign: 'center', 
            fontFamily: 'Tinos', 
            fill: '#800000', // Merah Marun (Solid & Elegan)
            dominantBaseline: 'middle',
            style: {
                // Hapus textShadow CSS karena sering tidak ter-print. 
                // Kita akan gunakan teknik layering (duplikat teks) di fungsi render.
                letterSpacing: '0.15em'
            }
        },
        { id: 'diberikan_kepada', type: 'text', content: 'dengan bangga diberikan kepada:', x: 61.5, y: contentStartY + 45, width: 1000, fontSize: 18, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        
        // Nama Siswa Hitam Pekat
        { id: 'student_name', type: 'text', content: '[NAMA SISWA]', x: 61.5, y: contentStartY + 85, width: 1000, fontSize: 45, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Pinyon Script', fill: '#000000', dominantBaseline: 'middle' },
        
        { id: 'sebagai_text', type: 'text', content: 'sebagai', x: 61.5, y: contentStartY + 130, width: 1000, fontSize: 18, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        
        // Rank Box Biru dengan Garis Tebal
        { id: 'rank_box', type: 'rect', fill: '#EFF6FF', stroke: '#1E3A8A', strokeWidth: 4, x: rankBoxX, y: rankBoxY, width: rankBoxWidth, height: rankBoxHeight, rx: 8 },
        // Rank Text Biru Tua
        { id: 'rank_text', type: 'text', content: '[RANK TEXT]', x: 61.5, y: rankBoxY + (rankBoxHeight / 2), width: 1000, fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', fill: '#1E3A8A', dominantBaseline: 'middle' },

        { id: 'detail_text_1', type: 'text', content: 'pada Kelas [nama kelas] Semester [semester] Tahun Pelajaran [tahun pelajaran] dengan rata-rata nilai [nilai rata-rata].', x: 61.5, y: paragraphY, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        { id: 'motivation_text_1', type: 'text', content: 'Penghargaan ini diberikan sebagai bentuk apresiasi dan motivasi untuk terus berusaha, berkembang,', x: 61.5, y: paragraphY + 25, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        { id: 'motivation_text_2', type: 'text', content: 'serta menginspirasi teman-teman lainnya.', x: 61.5, y: paragraphY + 50, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        
        { id: 'headmaster_label', type: 'text', content: 'Kepala Sekolah', x: 150, y: signatureY, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        { id: 'headmaster_name', type: 'text', content: '[nama kepala sekolah]', x: 150, y: signatureY + 80, width: 300, fontSize: 16, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', textDecoration: 'underline', fill: '#1F2937' },
        { id: 'headmaster_nip', type: 'text', content: 'NIP. [nip kepala sekolah]', x: 150, y: signatureY + 100, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },

        { id: 'teacher_date_place', type: 'text', content: 'Tempat, Tanggal Rapor', x: 673, y: signatureY - 20, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        { id: 'teacher_label', type: 'text', content: 'Wali Kelas', x: 673, y: signatureY, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
        { id: 'teacher_name', type: 'text', content: '[nama wali kelas]', x: 673, y: signatureY + 80, width: 300, fontSize: 16, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', textDecoration: 'underline', fill: '#1F2937' },
        { id: 'teacher_nip', type: 'text', content: 'NIP. [nip wali kelas]', x: 673, y: signatureY + 100, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos', fill: '#1F2937' },
    ];
};

const PiagamEditorModal = ({ isOpen, onClose, settings, onSaveLayout }) => {
    const [elements, setElements] = useState([]);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const svgRef = useRef(null);
    const dragInfo = useRef(null);
    const GRID_SIZE = 10;

    useEffect(() => {
        if (isOpen) {
            const layoutToLoad = settings.piagam_layout && settings.piagam_layout.length > 0
                ? JSON.parse(JSON.stringify(settings.piagam_layout))
                : generateInitialPiagamLayout(settings);
            setElements(layoutToLoad);
            setSelectedElementId(null);
        }
    }, [isOpen, settings]);

    const handleSelectElement = (id, e) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleDeselect = () => setSelectedElementId(null);
    
    const updateElement = (id, updates) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleMouseDown = (e, el) => {
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

        const handleMouseMove = (moveEvent) => {
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
        setSelectedElementId(newId);
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
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", onClick: handleDeselect },
            React.createElement('div', { className: "bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col", onClick: e => e.stopPropagation() },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b bg-white rounded-t-lg" },
                    React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Editor Visual Tata Letak Piagam"),
                    React.createElement('div', null,
                        React.createElement('button', { onClick: onClose, className: "text-slate-600 hover:text-slate-900 mr-4" }, "Batal"),
                        React.createElement('button', { onClick: () => { onSaveLayout(elements); onClose(); }, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Simpan Desain")
                    )
                ),
                React.createElement('div', { className: "flex flex-1 overflow-hidden" },
                    React.createElement('main', { className: "flex-1 p-4 overflow-auto bg-slate-200 flex justify-center items-start" },
                        React.createElement('div', { className: "bg-white shadow-lg relative", style: { width: '29.7cm', height: '21cm' } },
                            React.createElement('div', {
                                className: "absolute w-full h-full",
                                onClick: handleDeselect,
                                style: {
                                    backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                                }
                            },
                               React.createElement('svg', { ref: svgRef, width: "100%", height: "100%", viewBox: PIAGAM_VIEWBOX, preserveAspectRatio: "none", className: "cursor-default" },
                                    elements.map(el => {
                                        const isSelected = el.id === selectedElementId;
                                        const commonProps = { key: el.id, onClick: (e) => handleSelectElement(el.id, e), onMouseDown: (e) => handleMouseDown(e, el), style: { cursor: 'move' } };
                                        
                                        let elementRender;
                                        if (el.type === 'text') {
                                            let textAnchor = "start", xPos = el.x;
                                            if (el.textAlign === 'center') { textAnchor = "middle"; xPos = el.x + (el.width ?? 0) / 2; }
                                            else if (el.textAlign === 'right') { textAnchor = "end"; xPos = el.x + (el.width ?? 0); }
                                            
                                            if (el.id === 'piagam_title') {
                                                // MANUAL LAYERING FOR SHADOW (Guarantees Print Output)
                                                elementRender = React.createElement('g', null,
                                                    // Shadow Layer
                                                    React.createElement('text', {
                                                        x: xPos + 3,
                                                        y: el.y + 3,
                                                        fontSize: el.fontSize,
                                                        fontWeight: el.fontWeight,
                                                        textAnchor: textAnchor,
                                                        fontFamily: el.fontFamily,
                                                        fill: '#F59E0B', // Emas
                                                        dominantBaseline: el.dominantBaseline || 'auto',
                                                        style: { userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) }
                                                    }, el.content),
                                                    // Main Text Layer
                                                    React.createElement('text', {
                                                        x: xPos,
                                                        y: el.y,
                                                        fontSize: el.fontSize,
                                                        fontWeight: el.fontWeight,
                                                        textAnchor: textAnchor,
                                                        fontFamily: el.fontFamily,
                                                        fill: el.fill || 'black',
                                                        dominantBaseline: el.dominantBaseline || 'auto',
                                                        style: { userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) }
                                                    }, el.content)
                                                );
                                            } else {
                                                elementRender = React.createElement('text', { x: xPos, y: el.y, fontSize: el.fontSize, fontWeight: el.fontWeight, textAnchor: textAnchor, fontFamily: el.fontFamily, fill: el.fill || 'black', dominantBaseline: el.dominantBaseline || 'auto', style: { userSelect: 'none', textDecoration: el.textDecoration || 'none', ...(el.style || {}) } }, el.content);
                                            }
                                        } else if (el.type === 'image') {
                                            const imageUrl = String(settings[el.content] || '');
                                            elementRender = imageUrl ? React.createElement('image', { href: imageUrl, x: el.x, y: el.y, width: el.width, height: el.height }) : null;
                                        } else if (el.type === 'rect' || el.type === 'line') { // Support for rect type
                                            elementRender = React.createElement('rect', { x: el.x, y: el.y, width: el.width, height: el.height, fill: el.fill || "black", rx: el.rx || 0, ry: el.ry || 0, stroke: el.stroke, strokeWidth: el.strokeWidth });
                                        } else {
                                            return null;
                                        }
                                        
                                        const selectionBoxHeight = (el.type === 'text') ? (el.fontSize || 14) * 1.2 : (el.height || 0);
                                        const selectionBoxY = (el.type === 'text') ? (el.dominantBaseline === 'middle' ? el.y - (selectionBoxHeight / 2) : el.y - (el.fontSize || 14)) : el.y;

                                        return React.createElement('g', commonProps,
                                            elementRender,
                                            isSelected && React.createElement('rect', { x: el.x, y: selectionBoxY, width: el.width, height: selectionBoxHeight, fill: "none", stroke: "#4f46e5", strokeWidth: "2", strokeDasharray: "4 4", style: { pointerEvents: 'none' } })
                                        );
                                    })
                               )
                            )
                        )
                    ),
                    React.createElement('div', { className: "w-72 bg-white p-4 border-l overflow-y-auto" },
                        React.createElement('h3', { className: "font-semibold mb-2" }, "Alat"),
                        React.createElement('button', { onClick: addElement, className: "w-full text-left p-2 rounded hover:bg-slate-100 mb-4" }, "Tambah Teks"),
                         selectedElement ? (
                             React.createElement('div', { className: "space-y-4 pt-4 border-t" },
                                React.createElement('h3', { className: "font-semibold" }, "Properti Elemen"),
                                React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "text-sm" }, 'Posisi X'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.x,
                                            onChange: e => updateElement(selectedElementId, { x: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1 border rounded'
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "text-sm" }, 'Posisi Y'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.y,
                                            onChange: e => updateElement(selectedElementId, { y: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1 border rounded'
                                        })
                                    )
                                ),
                                 (selectedElement.type === 'text' || selectedElement.type === 'image' || selectedElement.type === 'rect' || selectedElement.type === 'line') && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Lebar (Width)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        selectedElement.hasOwnProperty('height') && React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Tinggi (Height)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId, { height: parseInt(e.target.value) }), className: "w-full p-1 border rounded" }))
                                    )
                                ),
                                selectedElement.type === 'text' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Teks"), React.createElement('textarea', { value: selectedElement.content, onChange: e => updateElement(selectedElementId, { content: e.target.value }), className: "w-full p-1 border rounded", rows: 3 })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ukuran Font"), React.createElement('input', { type: "number", value: selectedElement.fontSize, onChange: e => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Jenis Font"), React.createElement('select', { value: selectedElement.fontFamily, onChange: e => updateElement(selectedElementId, { fontFamily: e.target.value }), className: "w-full p-1 border rounded" }, 
                                            React.createElement('option', { value: "Tinos" }, "Tinos (Formal)"), 
                                            React.createElement('option', { value: "Pinyon Script" }, "Pinyon Script (Elegan)"),
                                            React.createElement('option', { value: "Alex Brush" }, "Alex Brush (Klasik)"),
                                            React.createElement('option', { value: "Great Vibes" }, "Great Vibes (Artistik)"),
                                            React.createElement('option', { value: "Dancing Script" }, "Dancing Script (Santai)"),
                                            React.createElement('option', { value: "system-ui" }, "System UI (Modern)")
                                        )),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ketebalan"), React.createElement('select', { value: selectedElement.fontWeight, onChange: e => updateElement(selectedElementId, { fontWeight: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "normal" }, "Normal"), React.createElement('option', { value: "bold" }, "Tebal"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Perataan"), React.createElement('select', { value: selectedElement.textAlign, onChange: e => updateElement(selectedElementId, { textAlign: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "left" }, "Kiri"), React.createElement('option', { value: "center" }, "Tengah"), React.createElement('option', { value: "right" }, "Kanan"))),
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "text-sm" }, "Garis Bawah"),
                                            React.createElement('select', { value: selectedElement.textDecoration || 'none', onChange: e => updateElement(selectedElementId, { textDecoration: e.target.value }), className: "w-full p-1 border rounded" },
                                                React.createElement('option', { value: "none" }, "Tidak"),
                                                React.createElement('option', { value: "underline" }, "Ya")
                                            )
                                        )
                                     )
                                ),
                                React.createElement('button', { onClick: deleteElement, className: "w-full text-left p-2 rounded text-red-600 hover:bg-red-100 mt-4" }, "Hapus Elemen")
                             )
                         ) : React.createElement('p', { className: "text-sm text-slate-500 pt-4 border-t" }, "Pilih sebuah elemen untuk melihat propertinya.")
                    )
                )
            )
        )
    );
};

const DefaultPiagamBackground = () => {
    const width = PIAGAM_WIDTH;
    const height = PIAGAM_HEIGHT;
    const margin = 20; 

    const ornamentGradientId = "ornamentGradient";

    // Design sudut yang lebih tegas dan tebal
    const cornerPath = "M 0,120 L 0,30 Q 0,0 30,0 L 120,0 M 80,0 Q 100,0 100,20 L 100,60 M 0,80 Q 0,100 20,100 L 60,100";
    
    return React.createElement('g', { 'data-name': "default-background" },
        // Define gradients
        React.createElement('defs', null,
            React.createElement('linearGradient', { id: ornamentGradientId, x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#FCD34D', stopOpacity: 1 } }), // Amber 300 (Gold Light)
                React.createElement('stop', { offset: "50%", style: { stopColor: '#D97706', stopOpacity: 1 } }), // Amber 600 (Gold Medium)
                React.createElement('stop', { offset: "100%", style: { stopColor: '#B45309', stopOpacity: 1 } }) // Amber 700 (Gold Dark)
            )
        ),

        // Background fill - WHITE
        React.createElement('rect', {
            x: 0, y: 0, width: width, height: height,
            fill: "white"
        }),

        // Main outer border - Dark Blue & Thick
        React.createElement('rect', {
            x: margin, y: margin,
            width: width - margin * 2,
            height: height - margin * 2,
            fill: "none",
            stroke: '#1E3A8A', // Blue 900
            strokeWidth: "15" // Very Thick
        }),
        // Inner decorative border - Light Gold & Thick
        React.createElement('rect', {
            x: margin + 12, y: margin + 12, // Offset slightly more due to thick outer border
            width: width - (margin + 12) * 2,
            height: height - (margin + 12) * 2,
            fill: "none",
            stroke: '#FBBF24', // Amber 400 (Gold)
            strokeWidth: "8" // Thick
        }),

        // Corner Ornaments - Gold Gradient & Very Thick
        // Top-Left
        React.createElement('g', { transform: `translate(${margin}, ${margin})` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Top-Right
        React.createElement('g', { transform: `translate(${width - margin}, ${margin}) scale(-1, 1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Bottom-Left
        React.createElement('g', { transform: `translate(${margin}, ${height - margin}) scale(1, -1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Bottom-Right
        React.createElement('g', { transform: `translate(${width - margin}, ${height - margin}) scale(-1, -1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        )
    );
};


const PiagamPage = ({ student, settings, pageStyle, rank, average, printOptions }) => {
    const layout = settings.piagam_layout && settings.piagam_layout.length > 0
        ? settings.piagam_layout
        : generateInitialPiagamLayout(settings);

    // Calculate rank string and dynamic dimensions
    const rankString = useMemo(() => {
        if (!rank) return '';
        return `PERINGKAT ${toRoman(rank)}`;
    }, [rank]);

    const { dynamicBoxWidth, dynamicBoxX } = useMemo(() => {
        const rankTextDef = layout.find(el => el.id === 'rank_text');
        if (rankTextDef && rankString) {
            const fontSize = rankTextDef.fontSize || 24;
            const fontFamily = rankTextDef.fontFamily || 'Tinos';
            const fontWeight = rankTextDef.fontWeight || 'bold';
            const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;
            const textWidth = getTextWidth(rankString, fontSpec);
            
            // "lebar persegi panjang menjadi teks nama peringkat ditambah 4 spasi (kiri dan kanan)"
            const fourSpacesWidth = getTextWidth('    ', fontSpec); 
            const padding = fourSpacesWidth * 2; // Left + Right
            
            const width = textWidth + padding; 
            
            // Center box relative to the text element's visual center
            const textCenterX = (rankTextDef.x || 0) + ((rankTextDef.width || 0) / 2);
            const x = textCenterX - (width / 2);
            
            return { dynamicBoxWidth: width, dynamicBoxX: x };
        }
        return { dynamicBoxWidth: 300, dynamicBoxX: (PIAGAM_WIDTH - 300) / 2 };
    }, [layout, rankString]);

    const replacePlaceholders = (text) => {
        if (!text) return '';
        const classRoman = toRoman(parseInt(settings.nama_kelas, 10)) || settings.nama_kelas;
        
        return text
            .replace(/\[NAMA SISWA\]/gi, (student.namaLengkap || '')) // Removed .toUpperCase()
            .replace(/\[RANK\]/gi, rank ? toRoman(rank) : '') // Legacy support if user customized layout
            .replace(/\[RANK TEXT\]/gi, rankString) // New placeholder for full rank text
            .replace(/PERINGKAT \[RANK\]/gi, rankString) // Replace default combo if present
            .replace(/\[nama kelas\]/gi, classRoman)
            .replace(/\[semester\]/gi, settings.semester || '')
            .replace(/\[tahun pelajaran\]/gi, settings.tahun_ajaran || '')
            .replace(/\[nilai rata-rata\]/gi, average || '')
            .replace(/\[nama kepala sekolah\]/gi, settings.nama_kepala_sekolah || '')
            .replace(/\[nip kepala sekolah\]/gi, settings.nip_kepala_sekolah || '')
            .replace(/\[nama wali kelas\]/gi, settings.nama_wali_kelas || '')
            .replace(/\[nip wali kelas\]/gi, settings.nip_wali_kelas || '')
            .replace(/Tempat, Tanggal Rapor/gi, settings.tanggal_rapor || 'Tempat, Tanggal Rapor');
    };

    return (
        React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', style: pageStyle },
            settings.piagam_background && React.createElement('img', { 
                src: settings.piagam_background, 
                alt: "Piagam Background", 
                className: 'absolute top-0 left-0 w-full h-full object-cover' 
            }),
            React.createElement('div', {
                style: {
                    position: 'absolute',
                    top: '1.5cm',
                    left: '1.5cm',
                    right: '1.5cm',
                    bottom: '1.5cm',
                }
            },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: PIAGAM_VIEWBOX, preserveAspectRatio: "xMidYMid meet" },
                    !settings.piagam_background && React.createElement(DefaultPiagamBackground, null),
                    layout.map(el => {
                        let currentEl = { ...el };
                        
                        // Dynamic Rank Box
                        if (el.id === 'rank_box') {
                            currentEl.width = dynamicBoxWidth;
                            currentEl.x = dynamicBoxX;
                            // Sync Y position with text offset to ensure vertical centering
                            currentEl.y = el.y + 1;
                        }
                        
                        // Dynamic Rank Text Y Adjustment
                        if (el.id === 'rank_text') {
                            currentEl.y = el.y + 3;
                        }

                        let elementRender;
                        // Use array for multiple elements (signature images injection)
                        const elementsToRender = [];

                        if (currentEl.type === 'text') {
                            let textAnchor = "start", xPos = currentEl.x;
                            if (currentEl.textAlign === 'center') { textAnchor = "middle"; xPos = currentEl.x + (currentEl.width ?? 0) / 2; }
                            else if (currentEl.textAlign === 'right') { textAnchor = "end"; xPos = currentEl.x + (currentEl.width ?? 0); }
                            
                            if (currentEl.id === 'piagam_title') {
                                // MANUAL LAYERING FOR SHADOW (Guarantees Print Output)
                                // Layer 1: Shadow (Gold)
                                elementsToRender.push(
                                    React.createElement('text', {
                                        key: `shadow_${currentEl.id}`,
                                        x: xPos + 3,
                                        y: currentEl.y + 3,
                                        fontSize: currentEl.fontSize,
                                        fontWeight: currentEl.fontWeight,
                                        textAnchor: textAnchor,
                                        fontFamily: currentEl.fontFamily,
                                        fill: '#F59E0B', // Gold Shadow Color
                                        dominantBaseline: currentEl.dominantBaseline || 'auto',
                                        style: { 
                                            userSelect: 'none', 
                                            letterSpacing: '0.15em' 
                                        }
                                    }, replacePlaceholders(currentEl.content))
                                );
                                // Layer 2: Main Text (Maroon)
                                elementsToRender.push(
                                    React.createElement('text', {
                                        key: `main_${currentEl.id}`,
                                        x: xPos,
                                        y: currentEl.y,
                                        fontSize: currentEl.fontSize,
                                        fontWeight: currentEl.fontWeight,
                                        textAnchor: textAnchor,
                                        fontFamily: currentEl.fontFamily,
                                        fill: currentEl.fill || '#800000',
                                        dominantBaseline: currentEl.dominantBaseline || 'auto',
                                        style: { 
                                            userSelect: 'none', 
                                            letterSpacing: '0.15em' 
                                        }
                                    }, replacePlaceholders(currentEl.content))
                                );
                            } else {
                                // Normal text rendering
                                elementsToRender.push(
                                    React.createElement('text', { 
                                        key: `text_${currentEl.id}`,
                                        x: xPos, 
                                        y: currentEl.y, 
                                        fontSize: currentEl.fontSize, 
                                        fontWeight: currentEl.fontWeight, 
                                        textAnchor: textAnchor, 
                                        fontFamily: currentEl.fontFamily, 
                                        fill: currentEl.fill || 'black', 
                                        dominantBaseline: currentEl.dominantBaseline || 'auto', 
                                        style: { 
                                            textDecoration: currentEl.textDecoration || 'none',
                                            ...(currentEl.style || {}) 
                                        } 
                                    }, replacePlaceholders(currentEl.content))
                                );
                            }

                            // Inject Images based on specific Text IDs
                            if (currentEl.id === 'headmaster_name') {
                                if (printOptions.showPrincipalSignature && settings.ttd_kepala_sekolah) {
                                    // Signature placed slightly above the name
                                    const sigWidth = 100;
                                    const sigHeight = 70;
                                    // Assuming xPos is center of text box
                                    const sigX = xPos - (sigWidth / 2);
                                    const sigY = currentEl.y - 65; // Approx height above name
                                    elementsToRender.push(
                                        React.createElement('image', { key: 'sig_head', href: settings.ttd_kepala_sekolah, x: sigX, y: sigY, width: sigWidth, height: sigHeight, preserveAspectRatio: "xMidYMid meet" })
                                    );
                                }
                                if (printOptions.showStamp && settings.cap_sekolah) {
                                    // Stamp placed to the left of signature
                                    const stampWidth = 90;
                                    const stampHeight = 90;
                                    const stampX = xPos - 90; // Shift left
                                    const stampY = currentEl.y - 75;
                                    elementsToRender.push(
                                        React.createElement('image', { key: 'stamp_head', href: settings.cap_sekolah, x: stampX, y: stampY, width: stampWidth, height: stampHeight, opacity: 0.8, preserveAspectRatio: "xMidYMid meet" })
                                    );
                                }
                            } else if (currentEl.id === 'teacher_name') {
                                if (printOptions.showTeacherSignature && settings.ttd_wali_kelas) {
                                    const sigWidth = 100;
                                    const sigHeight = 60;
                                    const sigX = xPos - (sigWidth / 2);
                                    const sigY = currentEl.y - 55;
                                    elementsToRender.push(
                                        React.createElement('image', { key: 'sig_teacher', href: settings.ttd_wali_kelas, x: sigX, y: sigY, width: sigWidth, height: sigHeight, preserveAspectRatio: "xMidYMid meet" })
                                    );
                                }
                            }

                        } else if (currentEl.type === 'image') {
                            const imageUrl = String(settings[currentEl.content] || '');
                            if(imageUrl) elementsToRender.push(React.createElement('image', { key: `img_${currentEl.id}`, href: imageUrl, x: currentEl.x, y: currentEl.y, width: currentEl.width, height: currentEl.height }));
                        } else if (currentEl.type === 'rect' || currentEl.type === 'line') {
                            elementsToRender.push(React.createElement('rect', { key: `rect_${currentEl.id}`, x: currentEl.x, y: currentEl.y, width: currentEl.width, height: currentEl.height, fill: currentEl.fill || "black", rx: currentEl.rx || 0, ry: currentEl.ry || 0, stroke: currentEl.stroke, strokeWidth: currentEl.strokeWidth }));
                        }

                        return React.createElement('g', { key: currentEl.id }, elementsToRender);
                    })
                )
            )
        )
    );
};

const PrintPiagamPage = ({ students, settings, grades, subjects, onUpdatePiagamLayout, showToast }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'top3', 'top10'
    const [isPrinting, setIsPrinting] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [printOptions, setPrintOptions] = useState({
        showPrincipalSignature: true,
        showTeacherSignature: true,
        showStamp: true
    });

    const studentRankings = useMemo(() => {
        const allActiveSubjects = subjects.filter(s => s.active);
        const studentsWithScores = students.map(student => {
            const gradeData = grades.find(g => g.studentId === student.id);
            if (!gradeData || !gradeData.finalGrades) return { studentId: student.id, total: 0, count: 0 };

            const studentReligion = student.agama?.trim().toLowerCase();
            let total = 0, count = 0;
            
            Object.entries(gradeData.finalGrades).forEach(([subjectId, score]) => {
                const subjectInfo = allActiveSubjects.find(s => s.id === subjectId);
                if (subjectInfo && typeof score === 'number') {
                    if (subjectInfo.fullName.startsWith('Pendidikan Agama')) {
                        if (studentReligion && subjectInfo.fullName.toLowerCase().includes(`(${studentReligion})`)) {
                            total += score;
                            count++;
                        }
                    } else {
                        total += score;
                        count++;
                    }
                }
            });
            return { studentId: student.id, total, count, average: count > 0 ? (total / count).toFixed(2) : "0.00" };
        });

        const sortedStudents = [...studentsWithScores].sort((a, b) => b.total - a.total);
        const rankMap = new Map();
        if (sortedStudents.length > 0) {
            let currentRank = 1;
            rankMap.set(sortedStudents[0].studentId, { ...sortedStudents[0], rank: sortedStudents[0].total > 0 ? currentRank : null });
            for (let i = 1; i < sortedStudents.length; i++) {
                if (sortedStudents[i].total < sortedStudents[i - 1].total) currentRank = i + 1;
                rankMap.set(sortedStudents[i].studentId, { ...sortedStudents[i], rank: sortedStudents[i].total > 0 ? currentRank : null });
            }
        }
        return rankMap;
    }, [students, grades, subjects]);

    const handlePrintOptionChange = (key) => {
        setPrintOptions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');
        
        const styleId = 'print-piagam-style';
        document.getElementById(styleId)?.remove();
        
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @page {
                size: ${paperSize} landscape;
                margin: 0;
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            setIsPrinting(false);
            setTimeout(() => document.getElementById(styleId)?.remove(), 1000);
        }, 500);
    };

    const studentsToRender = useMemo(() => {
        const rankedStudents = students.filter(s => studentRankings.has(s.id) && studentRankings.get(s.id).rank !== null)
                                     .sort((a, b) => studentRankings.get(a.id).rank - studentRankings.get(b.id).rank);
        
        if (selectedFilter === 'top3') {
            return rankedStudents.filter(s => {
                const rank = studentRankings.get(s.id).rank;
                return rank >= 1 && rank <= 3;
            });
        } else if (selectedFilter === 'top10') {
             return rankedStudents.filter(s => {
                const rank = studentRankings.get(s.id).rank;
                return rank >= 1 && rank <= 10;
            });
        }
        
        return rankedStudents; // 'all'
    }, [students, selectedFilter, studentRankings]);
    
    const [isPrintingState, setIsPrintingState] = useState(false);
    useEffect(() => {
        const beforePrint = () => setIsPrintingState(true);
        const afterPrint = () => setIsPrintingState(false);
        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', afterPrint);
        return () => {
            window.removeEventListener('beforeprint', beforePrint);
            window.removeEventListener('afterprint', afterPrint);
        };
    }, []);

    const pageStyle = isPrintingState ? {} : {
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
    };

    return (
        React.createElement(React.Fragment, null,
            React.createElement(PiagamEditorModal, { isOpen: isEditorOpen, onClose: () => setIsEditorOpen(false), settings: settings, onSaveLayout: onUpdatePiagamLayout }),
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Piagam Penghargaan"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Buat dan cetak piagam untuk siswa berprestasi.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'filterSelector', className: "block text-sm font-medium text-slate-700 mb-1" }, 'Tampilkan Peringkat'),
                            React.createElement('select', { id: "filterSelector", value: selectedFilter, onChange: (e) => setSelectedFilter(e.target.value), className: "w-full sm:w-64 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Peringkat"),
                                React.createElement('option', { value: "top3" }, "Cetak Peringkat 1-3"),
                                React.createElement('option', { value: "top10" }, "Cetak Peringkat 1-10")
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: "block text-sm font-medium text-slate-700 mb-1" }, 'Ukuran Kertas'),
                            React.createElement('select', { id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { onClick: () => setIsEditorOpen(true), className: "px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Desain Tata Letak Piagam"),
                        React.createElement('button', { onClick: handlePrint, disabled: isPrinting, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" }, isPrinting ? 'Mempersiapkan...' : 'Cetak Piagam')
                    )
                ),
                React.createElement('div', { className: "border-t pt-4 mt-4" },
                    React.createElement('div', { className: "flex flex-wrap items-center gap-x-6 gap-y-2" },
                        React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-0" }, "Opsi Tanda Tangan:"),
                        React.createElement('label', { className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showPrincipalSignature, onChange: () => handlePrintOptionChange('showPrincipalSignature'), className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                            React.createElement('span', { className: "text-sm" }, "TTD Kepala Sekolah")
                        ),
                        React.createElement('label', { className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showTeacherSignature, onChange: () => handlePrintOptionChange('showTeacherSignature'), className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                            React.createElement('span', { className: "text-sm" }, "TTD Wali Kelas")
                        ),
                        React.createElement('label', { className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: printOptions.showStamp, onChange: () => handlePrintOptionChange('showStamp'), className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                            React.createElement('span', { className: "text-sm" }, "Cap Sekolah")
                        )
                    )
                )
            ),
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                studentsToRender.length > 0 ? studentsToRender.map(student => {
                    const studentData = studentRankings.get(student.id);
                    return React.createElement(PiagamPage, { 
                        key: student.id, 
                        student: student, 
                        settings: settings, 
                        pageStyle: pageStyle,
                        rank: studentData?.rank,
                        average: studentData?.average,
                        printOptions: printOptions
                    });
                }) : React.createElement('p', {className: "text-center text-slate-500 py-10"}, "Tidak ada siswa yang memiliki peringkat untuk dicetak sesuai filter yang dipilih.")
            )
        )
    );
};

export default PrintPiagamPage;

