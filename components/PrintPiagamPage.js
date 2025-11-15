import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { transliterate, generateInitialLayout } from './TransliterationUtil.js';

const PAPER_SIZES = {
    A4: { width: '29.7cm', height: '21cm' },
    F4: { width: '33cm', height: '21.5cm' },
    Letter: { width: '27.94cm', height: '21.59cm' },
};

const PIAGAM_VIEWBOX = "0 0 1123 794"; // A4 Landscape at 96 DPI

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

const generateInitialPiagamLayout = (settings) => {
    const kopLayout = settings.kop_layout && settings.kop_layout.length > 0 ? settings.kop_layout : generateInitialLayout(settings);
    
    const yOffset = 50;
    const xOffset = (1123 - 800) / 2;
    const adaptedKopElements = kopLayout.map(el => {
        let newElement = { ...el, id: `kop_${el.id}` };
        
        if (el.type === 'line') {
            const newWidth = 1000;
            newElement.x = (1123 - newWidth) / 2;
            newElement.width = newWidth;
        } else if (el.textAlign === 'center') {
            newElement.x = (1123 - el.width) / 2;
        } else {
            newElement.x = (el.id === 'logo_sekolah_img') ? (1123 - xOffset - el.width) : (el.x + xOffset);
        }
        
        newElement.y = el.y + yOffset;
        
        return newElement;
    });
    
    // REQUEST: move horizontal line closer to header text
    const lineEl = adaptedKopElements.find(el => el.id.includes('line_1'));
    if (lineEl) {
        lineEl.y -= 25; // Move up 25px
    }

    const kopBottomY = Math.max(...adaptedKopElements.map(el => (el.y + (el.height || el.fontSize || 0))), 150) + 5; // Reduced buffer from 10 to 5

    // REQUEST: Adjust vertical spacing for main content to be more balanced and avoid overlapping background
    const contentStartY = kopBottomY + 40; // Start content lower, reduced from 60
    const rankBoxWidth = 300;
    const rankBoxHeight = 50;
    const rankBoxX = (1123 - rankBoxWidth) / 2;
    const rankBoxY = contentStartY + 160;

    const paragraphY = rankBoxY + rankBoxHeight + 30; // Reduced gap from 40
    const signatureY = paragraphY + 90; // Reduced gap from 100

    return [
        ...adaptedKopElements,
        { id: 'piagam_title', type: 'text', content: 'PIAGAM PENGHARGAAN', x: 61.5, y: contentStartY, width: 1000, fontSize: 40, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'diberikan_kepada', type: 'text', content: 'dengan bangga diberikan kepada:', x: 61.5, y: contentStartY + 50, width: 1000, fontSize: 18, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'student_name', type: 'text', content: '[NAMA SISWA]', x: 61.5, y: contentStartY + 100, width: 1000, fontSize: 36, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'sebagai_text', type: 'text', content: 'sebagai', x: 61.5, y: contentStartY + 140, width: 1000, fontSize: 18, textAlign: 'center', fontFamily: 'Tinos' },
        
        { id: 'rank_box', type: 'rect', fill: '#e0f2fe', stroke: '#0c4a6e', strokeWidth: 2, x: rankBoxX, y: rankBoxY, width: rankBoxWidth, height: rankBoxHeight, rx: 8 },
        { id: 'rank_text', type: 'text', content: 'PERINGKAT [RANK]', x: 61.5, y: rankBoxY + 35, width: 1000, fontSize: 28, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', fill: '#0c4a6e' },

        { id: 'detail_text_1', type: 'text', content: 'pada Kelas [nama kelas] Semester [semester] Tahun Pelajaran [tahun pelajaran] dengan rata-rata nilai [nilai rata-rata].', x: 61.5, y: paragraphY, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'motivation_text_1', type: 'text', content: 'Penghargaan ini diberikan sebagai bentuk apresiasi dan motivasi untuk terus berusaha, berkembang,', x: 61.5, y: paragraphY + 25, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'motivation_text_2', type: 'text', content: 'serta menginspirasi teman-teman lainnya.', x: 61.5, y: paragraphY + 50, width: 1000, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        
        { id: 'headmaster_label', type: 'text', content: 'Kepala Sekolah', x: 150, y: signatureY, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'headmaster_name', type: 'text', content: '[nama kepala sekolah]', x: 150, y: signatureY + 70, width: 300, fontSize: 16, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', textDecoration: 'underline' },
        { id: 'headmaster_nip', type: 'text', content: 'NIP. [nip kepala sekolah]', x: 150, y: signatureY + 90, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },

        { id: 'teacher_date_place', type: 'text', content: 'Tempat, Tanggal Rapor', x: 673, y: signatureY - 20, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'teacher_label', type: 'text', content: 'Wali Kelas', x: 673, y: signatureY, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
        { id: 'teacher_name', type: 'text', content: '[nama wali kelas]', x: 673, y: signatureY + 70, width: 300, fontSize: 16, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Tinos', textDecoration: 'underline' },
        { id: 'teacher_nip', type: 'text', content: 'NIP. [nip wali kelas]', x: 673, y: signatureY + 90, width: 300, fontSize: 16, textAlign: 'center', fontFamily: 'Tinos' },
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
                        React.createElement('div', { className: "bg-white shadow-lg relative", style: { width: '29.7cm', height: '21cm', backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` } },
                           React.createElement('svg', { ref: svgRef, width: "100%", height: "100%", viewBox: PIAGAM_VIEWBOX, preserveAspectRatio: "xMidYMin meet", className: "cursor-default" },
                                elements.map(el => {
                                    const isSelected = el.id === selectedElementId;
                                    const commonProps = { key: el.id, onClick: (e) => handleSelectElement(el.id, e), onMouseDown: (e) => handleMouseDown(e, el), style: { cursor: 'move' } };
                                    
                                    let elementRender;
                                    if (el.type === 'text') {
                                        let textAnchor = "start", xPos = el.x;
                                        if (el.textAlign === 'center') { textAnchor = "middle"; xPos = el.x + (el.width ?? 0) / 2; }
                                        else if (el.textAlign === 'right') { textAnchor = "end"; xPos = el.x + (el.width ?? 0); }
                                        elementRender = React.createElement('text', { x: xPos, y: el.y, fontSize: el.fontSize, fontWeight: el.fontWeight, textAnchor: textAnchor, fontFamily: el.fontFamily, style: { userSelect: 'none', textDecoration: el.textDecoration || 'none' } }, el.content);
                                    } else if (el.type === 'image') {
                                        const imageUrl = String(settings[el.content] || '');
                                        elementRender = imageUrl ? React.createElement('image', { href: imageUrl, x: el.x, y: el.y, width: el.width, height: el.height }) : null;
                                    } else if (el.type === 'rect' || el.type === 'line') { // Support for rect type
                                        elementRender = React.createElement('rect', { x: el.x, y: el.y, width: el.width, height: el.height, fill: el.fill || "black", rx: el.rx || 0, ry: el.ry || 0, stroke: el.stroke, strokeWidth: el.strokeWidth });
                                    } else {
                                        return null;
                                    }
                                    
                                    const selectionBoxHeight = (el.type === 'text') ? (el.fontSize || 14) * 1.2 : (el.height || 0);
                                    const selectionBoxY = (el.type === 'text') ? el.y - (el.fontSize || 14) : el.y;

                                    return React.createElement('g', commonProps,
                                        elementRender,
                                        isSelected && React.createElement('rect', { x: el.x, y: selectionBoxY, width: el.width, height: selectionBoxHeight, fill: "none", stroke: "#4f46e5", strokeWidth: "2", strokeDasharray: "4 4", style: { pointerEvents: 'none' } })
                                    );
                                })
                           )
                        )
                    ),
                    React.createElement('div', { className: "w-72 bg-white p-4 border-l overflow-y-auto" },
                        React.createElement('h3', { className: "font-semibold mb-2" }, "Alat"),
                        React.createElement('button', { onClick: addElement, className: "w-full text-left p-2 rounded hover:bg-slate-100 mb-4" }, "Tambah Teks"),
                         selectedElement && selectedElement.type === 'text' ? (
                             React.createElement('div', { className: "space-y-4 pt-4 border-t" },
                                React.createElement('h3', { className: "font-semibold" }, "Properti Teks"),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Teks"), React.createElement('textarea', { value: selectedElement.content, onChange: e => updateElement(selectedElementId, { content: e.target.value }), className: "w-full p-1 border rounded", rows: 3 })),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ukuran Font"), React.createElement('input', { type: "number", value: selectedElement.fontSize, onChange: e => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Lebar (Width)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Jenis Font"), React.createElement('select', { value: selectedElement.fontFamily, onChange: e => updateElement(selectedElementId, { fontFamily: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "Tinos" }, "Tinos (Formal)"), React.createElement('option', { value: "system-ui" }, "System UI (Modern)"))),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ketebalan"), React.createElement('select', { value: selectedElement.fontWeight, onChange: e => updateElement(selectedElementId, { fontWeight: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "normal" }, "Normal"), React.createElement('option', { value: "bold" }, "Tebal"))),
                                React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Perataan"), React.createElement('select', { value: selectedElement.textAlign, onChange: e => updateElement(selectedElementId, { textAlign: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "left" }, "Kiri"), React.createElement('option', { value: "center" }, "Tengah"), React.createElement('option', { value: "right" }, "Kanan"))),
                                React.createElement('div', null,
                                    React.createElement('label', { className: "text-sm" }, "Garis Bawah"),
                                    React.createElement('select', { value: selectedElement.textDecoration || 'none', onChange: e => updateElement(selectedElementId, { textDecoration: e.target.value }), className: "w-full p-1 border rounded" },
                                        React.createElement('option', { value: "none" }, "Tidak"),
                                        React.createElement('option', { value: "underline" }, "Ya")
                                    )
                                ),
                                React.createElement('button', { onClick: deleteElement, className: "w-full text-left p-2 rounded text-red-600 hover:bg-red-100 mt-4" }, "Hapus Elemen")
                             )
                         ) : React.createElement('p', { className: "text-sm text-slate-500 pt-4 border-t" }, "Pilih sebuah elemen teks untuk melihat propertinya.")
                    )
                )
            )
        )
    );
};

const DefaultPiagamBackground = () => {
    const s = 24; // block size
    const margin = 0;
    const blue = "#00B2FF"; // A bright, sky blue
    const yellow = "#FFD700"; // A golden yellow
    const darkBlue = "#005F88"; // A darker, coordinating blue
    const width = 1123;
    const height = 794;
    const cornerSize = s * 3;

    // A reusable component for the new corner design, inspired by the user's image
    const CornerPattern = ({ transform }) => (
        React.createElement('g', { transform: transform },
            // This pattern creates the stepped corner from the user's image idea
            React.createElement('rect', { x: 0, y: 0, width: s, height: s, fill: darkBlue }),
            React.createElement('rect', { x: s, y: 0, width: s * 2, height: s, fill: blue }),
            React.createElement('rect', { x: 0, y: s, width: s, height: s * 2, fill: blue }),
            React.createElement('rect', { x: s, y: s, width: s, height: s, fill: yellow }),
            React.createElement('rect', { x: s, y: s * 2, width: s, height: s, fill: yellow }),
            React.createElement('rect', { x: s * 2, y: s, width: s, height: s, fill: yellow })
        )
    );

    return (
        React.createElement('g', { 'data-name': "default-background" },
            // Long connecting bars
            // Top bars (blue is outer, yellow is inner)
            React.createElement('rect', { x: margin + cornerSize, y: margin, width: width - 2 * margin - 2 * cornerSize, height: s, fill: blue }),
            React.createElement('rect', { x: margin + cornerSize, y: margin + s, width: width - 2 * margin - 2 * cornerSize, height: s, fill: yellow }),
            
            // Bottom bars (blue is outer, yellow is inner)
            React.createElement('rect', { x: margin + cornerSize, y: height - margin - s, width: width - 2 * margin - 2 * cornerSize, height: s, fill: blue }),
            React.createElement('rect', { x: margin + cornerSize, y: height - margin - s*2, width: width - 2 * margin - 2 * cornerSize, height: s, fill: yellow }),

            // Left bars (blue is outer, yellow is inner)
            React.createElement('rect', { x: margin, y: margin + cornerSize, width: s, height: height - 2 * margin - 2 * cornerSize, fill: blue }),
            React.createElement('rect', { x: margin + s, y: margin + cornerSize, width: s, height: height - 2 * margin - 2 * cornerSize, fill: yellow }),

            // Right bars (blue is outer, yellow is inner)
            React.createElement('rect', { x: width - margin - s, y: margin + cornerSize, width: s, height: height - 2 * margin - 2 * cornerSize, fill: blue }),
            React.createElement('rect', { x: width - margin - s*2, y: margin + cornerSize, width: s, height: height - 2 * margin - 2 * cornerSize, fill: yellow }),
            
            // Corner patterns placed at the four corners, transformed appropriately
            React.createElement(CornerPattern, { transform: `translate(${margin}, ${margin})` }), // Top-Left
            React.createElement(CornerPattern, { transform: `translate(${width - margin}, ${margin}) scale(-1, 1)` }), // Top-Right
            React.createElement(CornerPattern, { transform: `translate(${margin}, ${height - margin}) scale(1, -1)` }), // Bottom-Left
            React.createElement(CornerPattern, { transform: `translate(${width - margin}, ${height - margin}) scale(-1, -1)` }) // Bottom-Right
        )
    );
};


const PiagamPage = ({ student, settings, pageStyle, rank, average }) => {
    const layout = settings.piagam_layout && settings.piagam_layout.length > 0
        ? settings.piagam_layout
        : generateInitialPiagamLayout(settings);

    const replacePlaceholders = (text) => {
        if (!text) return '';
        const rankString = rank ? `${toRoman(rank)}` : '';
        const classRoman = toRoman(parseInt(settings.nama_kelas, 10)) || settings.nama_kelas;
        
        return text
            .replace(/\[NAMA SISWA\]/gi, (student.namaLengkap || '').toUpperCase())
            .replace(/\[RANK\]/gi, rankString)
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
            settings.piagam_background && React.createElement('img', { src: settings.piagam_background, alt: "Piagam Background", className: 'absolute top-0 left-0 w-full h-full object-cover' }),
            React.createElement('div', { className: "absolute w-full h-full" },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: PIAGAM_VIEWBOX, preserveAspectRatio: "xMidYMin meet" },
                    !settings.piagam_background && React.createElement(DefaultPiagamBackground, null),
                    layout.map(el => {
                        let elementRender;
                        if (el.type === 'text') {
                            let textAnchor = "start", xPos = el.x;
                            if (el.textAlign === 'center') { textAnchor = "middle"; xPos = el.x + (el.width ?? 0) / 2; }
                            else if (el.textAlign === 'right') { textAnchor = "end"; xPos = el.x + (el.width ?? 0); }
                            elementRender = React.createElement('text', { x: xPos, y: el.y, fontSize: el.fontSize, fontWeight: el.fontWeight, textAnchor: textAnchor, fontFamily: el.fontFamily, fill: el.fill || 'black', style: { textDecoration: el.textDecoration || 'none' } }, replacePlaceholders(el.content));
                        } else if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || '');
                            elementRender = imageUrl ? React.createElement('image', { href: imageUrl, x: el.x, y: el.y, width: el.width, height: el.height }) : null;
                        } else if (el.type === 'rect' || el.type === 'line') {
                            elementRender = React.createElement('rect', { x: el.x, y: el.y, width: el.width, height: el.height, fill: el.fill || "black", rx: el.rx || 0, ry: el.ry || 0, stroke: el.stroke, strokeWidth: el.strokeWidth });
                        } else {
                            return null;
                        }
                        return React.createElement('g', { key: el.id }, elementRender);
                    })
                )
            )
        )
    );
};

const PrintPiagamPage = ({ students, settings, grades, subjects, onUpdatePiagamLayout, showToast }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

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

    const handlePrint = () => {
        setIsPrinting(true);
        showToast('Mempersiapkan pratinjau cetak...', 'success');

        const style = document.createElement('style');
        style.id = 'print-piagam-style';
        style.innerHTML = `@page { size: ${paperSize === 'F4' ? '33cm 21.5cm' : paperSize.toLowerCase()} landscape; margin: 0; }`;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
            document.getElementById('print-piagam-style')?.remove();
            setIsPrinting(false);
        }, 500);
    };

    const studentsToRender = useMemo(() => {
        const rankedStudents = students.filter(s => studentRankings.has(s.id) && studentRankings.get(s.id).rank !== null)
                                     .sort((a, b) => studentRankings.get(a.id).rank - studentRankings.get(b.id).rank);
        if (selectedStudentId === 'all') return rankedStudents;
        return rankedStudents.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId, studentRankings]);
    
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
                            React.createElement('label', { htmlFor: 'studentSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Pilih Murid'),
                            React.createElement('select', { id: "studentSelector", value: selectedStudentId, onChange: (e) => setSelectedStudentId(e.target.value), className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Peringkat"),
                                students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                            React.createElement('select', { id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value), className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm" },
                                Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { onClick: () => setIsEditorOpen(true), className: "px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200" }, "Desain Tata Letak Piagam"),
                        React.createElement('button', { onClick: handlePrint, disabled: isPrinting, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" }, isPrinting ? 'Mempersiapkan...' : 'Cetak Piagam')
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
                        pageStyle: { width: PAPER_SIZES[paperSize].width, height: PAPER_SIZES[paperSize].height },
                        rank: studentData?.rank,
                        average: studentData?.average
                    });
                }) : React.createElement('p', {className: "text-center text-slate-500 py-10"}, "Tidak ada siswa yang memiliki peringkat untuk dicetak.")
            )
        )
    );
};

export default PrintPiagamPage;
