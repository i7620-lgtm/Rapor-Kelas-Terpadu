import React, { useState, useEffect, useRef, useCallback } from 'react';
import { transliterate, generatePemdaText, expandAndCapitalizeSchoolName, generateInitialLayout, removeImageBackground } from './TransliterationUtil.js';

const placeholderSvg = "data:image/svg+xml,%3Csvg%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e2e8f0%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ELogo%3C/text%3E%3C/svg%3E";

const TransliterationModal = ({ isOpen, onClose, onApply, initialText }) => {
    const [latinText, setLatinText] = useState('');
    const [balineseText, setBalineseText] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Attempt to keep only latin characters from initial text for a better editing experience.
            // This is a simple heuristic.
            const latinOnly = initialText?.replace(/[^\u0000-\u007F]/g, "") || '';
            setLatinText(latinOnly);
        }
    }, [isOpen, initialText]);
    
    useEffect(() => {
        setBalineseText(transliterate(latinText));
    }, [latinText]);

    if (!isOpen) return null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col" },
                React.createElement('div', { className: "flex justify-between items-center p-4 border-b" },
                    React.createElement('h3', { className: "text-lg font-bold text-slate-800" }, "Alat Tulis Aksara Bali"),
                    React.createElement('button', { onClick: onClose, className: "text-slate-500 hover:text-slate-800 text-2xl" }, "\u00d7")
                ),
                React.createElement('div', { className: "p-6 space-y-4" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "latin-input", className: "block text-sm font-medium text-slate-700 mb-1" },
                            "Ketik teks Latin di sini:"
                        ),
                        React.createElement('input', {
                            id: "latin-input",
                            type: "text",
                            value: latinText,
                            onChange: (e) => setLatinText(e.target.value),
                            className: "w-full p-2 border border-slate-300 rounded-md",
                            placeholder: "Contoh: om swastyastu"
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" },
                            "Hasil Aksara Bali (Pratinjau):"
                        ),
                        React.createElement('div', { className: "w-full p-2 border border-slate-200 rounded-md bg-slate-50 min-h-[4rem] font-aksara-bali text-2xl" },
                            balineseText
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-end items-center p-4 border-t bg-slate-50 rounded-b-lg" },
                    React.createElement('button', { onClick: onClose, className: "bg-white py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50" },
                        "Batal"
                    ),
                    React.createElement('button', { onClick: () => onApply(balineseText), className: "ml-3 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700" },
                        "Gunakan Teks Ini"
                    )
                )
            )
        )
    );
};


const KopSuratEditorModal = ({ isOpen, onClose, settings, onSaveLayout }) => {
    const [elements, setElements] = useState([]);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [transliterationModalOpen, setTransliterationModalOpen] = useState(false);
    
    const svgRef = useRef(null);
    const dragInfo = useRef(null);
    const GRID_SIZE = 10;

    useEffect(() => {
        if (isOpen) {
            const layoutToLoad = settings.kop_layout && settings.kop_layout.length > 0 
                ? JSON.parse(JSON.stringify(settings.kop_layout))
                : generateInitialLayout(settings);
    
            // Define dynamic texts based on current settings
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

            // Create a map for easy content lookup
            const syncMap = {
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

            // Sync the layout with current settings data
            const syncedLayout = layoutToLoad.map(el => {
                if (el.type === 'text' && syncMap.hasOwnProperty(el.id)) {
                    // Only update if the ID is one of the default, dynamic ones
                    return { ...el, content: syncMap[el.id] };
                }
                return el;
            });
    
            setElements(syncedLayout);
            setSelectedElementId(null);
        }
    }, [isOpen, settings]);
    
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragInfo.current || !svgRef.current) return;
            e.preventDefault();

            const svg = svgRef.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;

            const transformedPt = pt.matrixTransform(dragInfo.current.ctm);
            let newX = transformedPt.x - dragInfo.current.offset.x;
            let newY = transformedPt.y - dragInfo.current.offset.y;
            
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

            updateElement(dragInfo.current.elementId, { x: newX, y: newY });
        };

        const handleMouseUp = (e) => {
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
    }, []);


    if (!isOpen) return null;

    const handleSelectElement = (id, e) => {
        e.stopPropagation();
        setSelectedElementId(id);
    };

    const handleDeselect = () => {
        setSelectedElementId(null);
    };
    
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
            ctm: ctm
        };
    };

    const addElement = (type) => {
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
                  updateElement(selectedElementId, { content: text, fontFamily: 'Noto Sans Balinese' });
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
                React.createElement('div', { className: "flex flex-1 overflow-hidden" },
                    React.createElement('div', { className: "w-48 bg-white p-4 border-r space-y-4" },
                        React.createElement('h3', { className: "font-semibold" }, "Alat"),
                        React.createElement('button', { onClick: () => addElement('text'), className: "w-full text-left p-2 rounded hover:bg-slate-100" }, "Tambah Teks"),
                        React.createElement('button', { onClick: () => addElement('line'), className: "w-full text-left p-2 rounded hover:bg-slate-100" }, "Tambah Garis")
                    ),
                    React.createElement('main', { className: "flex-1 p-4 overflow-auto bg-slate-200 flex justify-center items-center" },
                        React.createElement('div', { className: "w-full max-w-[800px] bg-white shadow-lg relative", onClick: handleDeselect, style: {
                            backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                            aspectRatio: '800 / 200'
                        }},
                           React.createElement('svg', { ref: svgRef, width: "100%", height: "100%", viewBox: "0 0 800 200", preserveAspectRatio: "xMidYMin meet", className: "cursor-default" },
                                elements.map(el => {
                                    const isSelected = el.id === selectedElementId;
                                    const commonProps = {
                                        key: el.id,
                                        onClick: (e) => handleSelectElement(el.id, e),
                                        onMouseDown: (e) => handleMouseDown(e, el),
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
                                                style: { userSelect: 'none', ...commonProps.style }
                                            }, el.content)
                                        );
                                    } else if (el.type === 'image') {
                                        const imageUrl = String(settings[el.content] || placeholderSvg);
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
                    React.createElement('div', { className: "w-72 bg-white p-4 border-l overflow-y-auto" },
                         React.createElement('h3', { className: "font-semibold mb-4" }, "Properti"),
                         selectedElement ? (
                             React.createElement('div', { className: "space-y-4" },
                                selectedElement.type === 'text' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "text-sm" }, "Teks"),
                                            React.createElement('textarea', { value: selectedElement.content, onChange: e => updateElement(selectedElementId, { content: e.target.value }), className: "w-full p-1 border rounded", rows: 3 }),
                                            React.createElement('button', { onClick: () => setTransliterationModalOpen(true), className: "mt-2 text-xs w-full text-indigo-700 bg-indigo-100 p-1.5 rounded hover:bg-indigo-200" },
                                               'Alat Tulis Aksara Bali...'
                                            )
                                        ),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ukuran Font"), React.createElement('input', { type: "number", value: selectedElement.fontSize, onChange: e => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Lebar (Width)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Jenis Font"), React.createElement('select', { value: selectedElement.fontFamily, onChange: e => updateElement(selectedElementId, { fontFamily: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "system-ui" }, "System UI (Latin)"), React.createElement('option', { value: "Noto Sans Balinese" }, "Noto Sans (Aksara Bali)"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Ketebalan"), React.createElement('select', { value: selectedElement.fontWeight, onChange: e => updateElement(selectedElementId, { fontWeight: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "normal" }, "Normal"), React.createElement('option', { value: "bold" }, "Tebal"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Perataan"), React.createElement('select', { value: selectedElement.textAlign, onChange: e => updateElement(selectedElementId, { textAlign: e.target.value }), className: "w-full p-1 border rounded" }, React.createElement('option', { value: "left" }, "Kiri"), React.createElement('option', { value: "center" }, "Tengah"), React.createElement('option', { value: "right" }, "Kanan")))
                                     )
                                ),
                                selectedElement.type === 'image' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Tinggi (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId, { height: parseInt(e.target.value) }), className: "w-full p-1 border rounded" }))
                                    )
                                ),
                                selectedElement.type === 'line' && (
                                    React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId, { width: parseInt(e.target.value) }), className: "w-full p-1 border rounded" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-sm" }, "Tebal (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId, { height: parseInt(e.target.value) }), className: "w-full p-1 border rounded" }))
                                    )
                                ),
                                 React.createElement('button', { onClick: deleteElement, className: "w-full text-left p-2 rounded text-red-600 hover:bg-red-100" }, "Hapus Elemen")
                             )
                         ) : React.createElement('p', { className: "text-sm text-slate-500" }, "Pilih sebuah elemen untuk melihat propertinya.")
                    )
                )
            )
        )
    );
};

const KopSuratPreview = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "bg-slate-50 p-4 rounded-lg border" },
            React.createElement('div', { className: "bg-white shadow-inner relative w-full max-w-[800px] mx-auto overflow-hidden", style: { aspectRatio: '800 / 200' } },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 200", preserveAspectRatio: "xMidYMin meet", className: "absolute top-0 left-0" },
                    layout.map(el => {
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
                            return (
                                React.createElement('text', {
                                    key: el.id,
                                    x: xPos,
                                    y: el.y,
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    textAnchor: textAnchor,
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'
                                }, el.content)
                            );
                        }
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || placeholderSvg);
                            return (
                                React.createElement('image', {
                                    key: el.id,
                                    href: imageUrl,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height
                                })
                            );
                        }
                        if (el.type === 'line') {
                            return (
                                React.createElement('rect', {
                                    key: el.id,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height,
                                    fill: "black"
                                })
                            );
                        }
                        return null;
                    })
                )
            )
        )
    );
};

const FormField = ({ label, id, type = 'text', placeholder = '', value, onChange, onBlur, onKeyDown }) => (
    React.createElement('div', { className: "col-span-1" },
        React.createElement('label', { htmlFor: String(id), className: "block text-sm font-medium text-slate-700 mb-1" },
            label
        ),
        React.createElement('input', {
            type: type,
            id: String(id),
            name: String(id),
            value: value || '',
            onChange: onChange,
            onBlur: onBlur,
            onKeyDown: onKeyDown,
            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 placeholder:text-slate-400",
            placeholder: placeholder
        })
    )
);

const FileInputField = ({ label, id, onChange, onSave, imagePreview, onMakeTransparent }) => {
    const handleFileChange = (e) => {
        onChange(e);
        onSave();
    };
    
    return (
     React.createElement('div', { className: "col-span-1" },
        React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" },
            label
        ),
        React.createElement('div', { className: "mt-1 flex flex-col gap-2 p-2 border-2 border-slate-300 border-dashed rounded-md" },
            React.createElement('div', { className: "flex items-center gap-4" },
                imagePreview ? (
                    React.createElement('img', { src: imagePreview, alt: "Logo preview", className: "w-16 h-16 object-contain rounded-md bg-slate-100" })
                ) : (
                    React.createElement('div', { className: "w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs text-center" }, "Pratinjau")
                ),
                React.createElement('div', { className: "text-center flex-1" },
                    React.createElement('div', { className: "flex text-sm text-slate-600 justify-center" },
                        React.createElement('label', { htmlFor: String(id), className: "relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none" },
                            React.createElement('span', null, "Unggah file"),
                            React.createElement('input', { id: String(id), name: String(id), type: "file", className: "sr-only", onChange: handleFileChange, accept: "image/*" })
                        )
                    ),
                     React.createElement('p', { className: "text-xs text-slate-500" }, "PNG atau JPG")
                )
            ),
            imagePreview && (
                React.createElement('button', {
                    onClick: () => onMakeTransparent(id),
                    className: "w-full text-center py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                }, "Buat Transparan")
            )
        )
    )
    );
};

const PengaturanMapel = ({ subjects, onUpdateSubjects }) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectLabel, setNewSubjectLabel] = useState('');

    const handleToggle = (subjectId) => {
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

        const newSubject = {
            id: newId,
            fullName: newSubjectName.trim(),
            label: newSubjectLabel.trim(),
            active: true
        };

        onUpdateSubjects([...subjects, newSubject]);
        setNewSubjectName('');
        setNewSubjectLabel('');
    };

    const handleKeyDownForAdd = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubject();
        }
    };
    
    return (
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', { className: "p-4 border rounded-lg bg-slate-50" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-3" }, "Pilih Mata Pelajaran Aktif"),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    subjects.map(subject => (
                        React.createElement('button', {
                            key: subject.id,
                            onClick: () => handleToggle(subject.id),
                            title: subject.fullName,
                            className: `px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                subject.active
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`
                        }, subject.label)
                    ))
                )
            ),
            React.createElement('div', { className: "pt-4 border-t" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-2" }, "Tambah Mata Pelajaran Baru"),
                React.createElement('div', { className: "flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-lg border" },
                    React.createElement('div', { className: "flex-1 w-full" },
                        React.createElement('label', { htmlFor: "new-subject-name", className: "block text-xs font-medium text-slate-700 mb-1" }, "Nama Mata Pelajaran"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-subject-name",
                            value: newSubjectName,
                            onChange: e => setNewSubjectName(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: Bahasa Sunda",
                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        })
                    ),
                    React.createElement('div', { className: "flex-1 w-full" },
                        React.createElement('label', { htmlFor: "new-subject-label", className: "block text-xs font-medium text-slate-700 mb-1" }, "Singkatan (ID Unik)"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-subject-label",
                            value: newSubjectLabel,
                            onChange: e => setNewSubjectLabel(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: BSunda",
                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                        })
                    ),
                    React.createElement('button', {
                        onClick: handleAddSubject,
                        className: "w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    }, "+ Tambah")
                )
            )
        )
    );
}

const PengaturanEkstra = ({ extracurriculars, onUpdateExtracurriculars }) => {
    const [newExtraName, setNewExtraName] = useState('');

    const handleToggle = (id) => {
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
        const newExtra = { id: newId, name: newExtraName.trim(), active: true };
        onUpdateExtracurriculars([...extracurriculars, newExtra]);
        setNewExtraName('');
    };

    const handleKeyDownForAdd = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        React.createElement('div', { className: "space-y-4" },
             React.createElement('div', { className: "p-4 border rounded-lg bg-slate-50" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-3" }, "Pilih Ekstrakurikuler Aktif"),
                 React.createElement('div', { className: "flex flex-wrap gap-2" },
                    extracurriculars.map(extra => (
                        React.createElement('button', {
                            key: extra.id,
                            onClick: () => handleToggle(extra.id),
                            className: `px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                extra.active
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`
                        }, extra.name)
                    ))
                )
            ),
             React.createElement('div', { className: "pt-4 border-t" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-2" }, "Tambah Ekstrakurikuler Baru"),
                React.createElement('div', { className: "flex items-end gap-4 p-4 bg-slate-50 rounded-lg border" },
                    React.createElement('div', { className: "flex-grow" },
                        React.createElement('label', { htmlFor: "new-extra-name", className: "block text-xs font-medium text-slate-700 mb-1" }, "Nama Ekstrakurikuler"),
                        React.createElement('input', {
                            type: "text",
                            id: "new-extra-name",
                            value: newExtraName,
                            onChange: e => setNewExtraName(e.target.value),
                            onKeyDown: handleKeyDownForAdd,
                            placeholder: "Contoh: Seni Lukis",
                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        })
                    ),
                    React.createElement('button', {
                        onClick: handleAdd,
                        className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    }, "+ Tambah")
                )
            )
        )
    );
};

const SettingsPage = ({ settings, onSettingsChange, onSave, onUpdateKopLayout, subjects, onUpdateSubjects, extracurriculars, onUpdateExtracurriculars, showToast }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSave();
        }
    };

    const handleMakeTransparent = useCallback(async (logoKey) => {
        const base64String = settings[logoKey];
        if (!base64String) {
            showToast('Tidak ada gambar untuk diproses.', 'error');
            return;
        }

        showToast('Memproses gambar...', 'info');
        try {
            const transparentBase64 = await removeImageBackground(base64String);
            // Simulate the event object expected by onSettingsChange
            const syntheticEvent = {
                target: {
                    name: logoKey,
                    value: transparentBase64,
                    type: 'file_processed', // Custom type to indicate it's not a real file input
                    files: null
                }
            };
            onSettingsChange(syntheticEvent);
            showToast('Latar belakang logo berhasil dihapus.', 'success');
        } catch (error) {
            console.error('Gagal membuat latar belakang transparan:', error);
            showToast(`Gagal memproses gambar: ${error.message}`, 'error');
        }
    }, [settings, onSettingsChange, showToast]);

    return (
        React.createElement(React.Fragment, null,
            React.createElement(KopSuratEditorModal, { 
                isOpen: isEditorOpen,
                onClose: () => setIsEditorOpen(false),
                settings: settings,
                onSaveLayout: onUpdateKopLayout
            }),
            React.createElement('div', { className: "space-y-8" },
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Pengaturan"),
                    React.createElement('p', { className: "mt-2 text-slate-600" }, "Kelola informasi sekolah, periode akademik, dan data penting lainnya. Perubahan disimpan secara otomatis.")
                ),

                React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                    React.createElement('div', { className: "space-y-12" },
                        React.createElement('section', null,
                            React.createElement('div', { className: "flex justify-between items-center border-b pb-3 mb-6" },
                                React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Profil Sekolah"),
                                 React.createElement('button', {
                                    onClick: () => setIsEditorOpen(true),
                                    className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                                }, "Desain Kop Surat")
                            ),

                            React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-4" },
                                React.createElement('div', { className: "lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" },
                                    React.createElement('div', { className: "md:col-span-2" }, React.createElement(FormField, { label: "Nama Dinas Pendidikan", id: "nama_dinas_pendidikan", value: settings.nama_dinas_pendidikan, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown })),
                                    React.createElement(FormField, { label: "Nama Sekolah", id: "nama_sekolah", value: settings.nama_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "NPSN", id: "npsn", value: settings.npsn, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement('div', { className: "md:col-span-2" }, React.createElement(FormField, { label: "Alamat Sekolah", id: "alamat_sekolah", value: settings.alamat_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown })),
                                    React.createElement(FormField, { label: "Desa / Kelurahan", id: "desa_kelurahan", value: settings.desa_kelurahan, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Kecamatan", id: "kecamatan", value: settings.kecamatan, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Kota/Kabupaten", id: "kota_kabupaten", value: settings.kota_kabupaten, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Provinsi", id: "provinsi", value: settings.provinsi, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Kode Pos", id: "kode_pos", value: settings.kode_pos, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Email Sekolah", id: "email_sekolah", type: "email", value: settings.email_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Telepon Sekolah", id: "telepon_sekolah", value: settings.telepon_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Website Sekolah", id: "website_sekolah", value: settings.website_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement('div', { className: "md:col-span-2" }, React.createElement(FormField, { label: "Faksimile", id: "faksimile", value: settings.faksimile, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }))
                                ),
                                React.createElement('div', { className: "lg:col-span-1 space-y-4" },
                                    React.createElement(FileInputField, { label: "Logo Sekolah", id: "logo_sekolah", onChange: onSettingsChange, onSave: onSave, imagePreview: typeof settings.logo_sekolah === 'string' ? settings.logo_sekolah : null, onMakeTransparent: handleMakeTransparent }),
                                    React.createElement(FileInputField, { label: "Logo Dinas Pendidikan", id: "logo_dinas", onChange: onSettingsChange, onSave: onSave, imagePreview: typeof settings.logo_dinas === 'string' ? settings.logo_dinas : null, onMakeTransparent: handleMakeTransparent }),
                                    React.createElement(FileInputField, { label: "Logo Cover Rapor", id: "logo_cover", onChange: onSettingsChange, onSave: onSave, imagePreview: typeof settings.logo_cover === 'string' ? settings.logo_cover : null, onMakeTransparent: handleMakeTransparent }),
                                    React.createElement(FileInputField, { label: "Background Piagam", id: "piagam_background", onChange: onSettingsChange, onSave: onSave, imagePreview: typeof settings.piagam_background === 'string' ? settings.piagam_background : null, onMakeTransparent: handleMakeTransparent }),
                                    React.createElement('div', null,
                                        React.createElement('h4', { className: "text-lg font-semibold text-slate-700" }, "Pratinjau Kop Surat"),
                                        React.createElement('p', { className: "text-sm text-slate-500 mb-4" }, "Ini adalah tampilan yang akan digunakan saat mencetak rapor. Klik 'Desain Kop Surat' untuk mengubah."),
                                        React.createElement(KopSuratPreview, { settings: settings })
                                    )
                                )
                            )
                        ),

                        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12" },
                             React.createElement('section', null,
                                React.createElement('h3', { className: "text-xl font-bold text-slate-800 border-b pb-3 mb-6" }, "Periode Akademik"),
                                 React.createElement('div', { className: "space-y-4" },
                                    React.createElement(FormField, { label: "Nama Kelas", id: "nama_kelas", placeholder: "e.g. 6a atau 6A atau VIA", value: settings.nama_kelas, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Tahun Ajaran", id: "tahun_ajaran", placeholder: "e.g. 2023/2024", value: settings.tahun_ajaran, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement('div', null,
                                        React.createElement('label', { htmlFor: 'semester', className: "block text-sm font-medium text-slate-700 mb-1" }, 'Semester'),
                                        React.createElement('select', { 
                                            id: 'semester', 
                                            name: 'semester', 
                                            value: settings.semester || '', 
                                            onChange: onSettingsChange, 
                                            onBlur: onSave, 
                                            onKeyDown: handleKeyDown,
                                            className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                                        },
                                            React.createElement('option', { value: '' }, 'Pilih Semester...'),
                                            React.createElement('option', { value: 'Ganjil' }, 'Ganjil'),
                                            React.createElement('option', { value: 'Genap' }, 'Genap')
                                        )
                                    ),
                                    React.createElement(FormField, { label: "Tempat, Tanggal Rapor", id: "tanggal_rapor", placeholder: "e.g. Jakarta, 20 Desember 2023", value: settings.tanggal_rapor, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown})
                                )
                            ),
                            React.createElement('section', null,
                                React.createElement('h3', { className: "text-xl font-bold text-slate-800 border-b pb-3 mb-6" }, "Kepala Sekolah dan Guru"),
                                 React.createElement('div', { className: "space-y-4" },
                                    React.createElement(FormField, { label: "Nama Kepala Sekolah", id: "nama_kepala_sekolah", value: settings.nama_kepala_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "NIP Kepala Sekolah", id: "nip_kepala_sekolah", value: settings.nip_kepala_sekolah, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "Nama Wali Kelas", id: "nama_wali_kelas", value: settings.nama_wali_kelas, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown }),
                                    React.createElement(FormField, { label: "NIP Wali Kelas", id: "nip_wali_kelas", value: settings.nip_wali_kelas, onChange: onSettingsChange, onBlur: onSave, onKeyDown: handleKeyDown })
                                )
                            )
                        ),
                        
                        React.createElement('section', { className: "pt-6 border-t" },
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800 border-b pb-3 mb-6" }, "Mata Pelajaran"),
                            React.createElement(PengaturanMapel, { subjects: subjects, onUpdateSubjects: onUpdateSubjects })
                        ),

                        React.createElement('section', null,
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800 border-b pb-3 mb-6" }, "Ekstrakurikuler"),
                            React.createElement(PengaturanEkstra, { extracurriculars: extracurriculars, onUpdateExtracurriculars: onUpdateExtracurriculars })
                        )
                    )
                )
            )
        )
    );
};

export default SettingsPage;
