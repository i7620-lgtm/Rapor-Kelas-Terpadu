import React from 'react';
import { TransliterationModal } from './TransliterationModal';
import { useKopSuratEditorLogic } from './useKopSuratEditorLogic';

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
    const {
        elements,
        selectedElementId,
        selectedElement,
        transliterationModalOpen,
        setTransliterationModalOpen,
        svgRef,
        GRID_SIZE,
        handleSelectElement,
        handleDeselect,
        updateElement,
        handlePointerDown,
        addElement,
        deleteElement,
        handleSave
    } = useKopSuratEditorLogic(settings, isOpen, onSaveLayout, onClose);
    
    if (!isOpen) return null;

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4", onClick: handleDeselect },
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
            React.createElement('div', { className: "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-7xl h-[95vh] h-[95dvh] flex flex-col overflow-hidden", onClick: e => e.stopPropagation() },
                React.createElement('div', { className: "flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl shrink-0" },
                    React.createElement('h2', { className: "text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100" }, "Editor Visual Kop Surat"),
                    React.createElement('div', { className: "flex items-center gap-2" },
                        React.createElement('button', { onClick: onClose, className: "px-3 py-1.5 min-h-[44px] lg:min-h-0 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" }, "Batal"),
                        React.createElement('button', { onClick: handleSave, className: "px-4 py-2 min-h-[44px] lg:min-h-0 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" }, "Simpan Desain")
                    )
                ),
                React.createElement('div', { className: "flex flex-col md:flex-row flex-1 overflow-hidden" },
                    React.createElement('div', { className: "w-full md:w-48 bg-white dark:bg-slate-900 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto flex-shrink-0 items-center md:items-stretch font-medium text-slate-700 dark:text-slate-200 text-sm" },
                        React.createElement('h3', { className: "font-semibold hidden md:block text-slate-900 dark:text-slate-100" }, "Alat"),
                        React.createElement('button', { onClick: () => addElement('text'), className: "whitespace-nowrap text-center md:text-left px-3 py-2 min-h-[44px] lg:min-h-0 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 shrink-0" }, "Tambah Teks"),
                        React.createElement('button', { onClick: () => addElement('line'), className: "whitespace-nowrap text-center md:text-left px-3 py-2 min-h-[44px] lg:min-h-0 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 shrink-0" }, "Tambah Garis")
                    ),
                    React.createElement('main', { className: "flex-1 p-4 overflow-auto bg-slate-200 dark:bg-slate-950 flex justify-start md:justify-center items-center min-h-[250px]" },
                        React.createElement('div', { className: "w-full min-w-[600px] max-w-[800px] shadow-lg relative", onClick: handleDeselect, style: {
                            backgroundColor: '#ffffff',
                            color: '#000000',
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
                                        onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, el),
                                        style: { cursor: 'move', touchAction: 'none' }
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
                                                y: el.y + (el.fontSize ?? 14),
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
                                                    y: el.y,
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
                    React.createElement('div', { className: "w-full md:w-72 bg-white dark:bg-slate-900 p-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[38vh] md:max-h-none flex-shrink-0 text-left text-sm" },
                         React.createElement('h3', { className: "font-semibold mb-4 text-slate-800 dark:text-slate-100" }, "Properti"),
                         selectedElement ? (
                             React.createElement('div', { className: "space-y-4 text-slate-700 dark:text-slate-300" },
                                React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'text-xs font-semibold' }, 'Posisi X'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.x,
                                            onChange: e => updateElement(selectedElementId!, { x: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums'
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'text-xs font-semibold' }, 'Posisi Y'),
                                        React.createElement('input', {
                                            type: 'number',
                                            step: GRID_SIZE,
                                            value: selectedElement.y,
                                            onChange: e => updateElement(selectedElementId!, { y: parseInt(e.target.value) || 0 }),
                                            className: 'w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums'
                                        })
                                    )
                                ),
                                selectedElement.type === 'text' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "text-xs font-semibold" }, "Teks"),
                                            React.createElement('textarea', { value: selectedElement.content, onChange: e => updateElement(selectedElementId!, { content: e.target.value }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600", rows: 3 }),
                                            React.createElement('button', { onClick: () => setTransliterationModalOpen(true), className: "mt-2 text-xs w-full min-h-[44px] lg:min-h-0 text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 p-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 font-medium" },
                                               'Alat Tulis Aksara Bali...'
                                            )
                                        ),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Ukuran Font"), React.createElement('input', { type: "number", value: selectedElement.fontSize, onChange: e => updateElement(selectedElementId!, { fontSize: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (Width)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Jenis Font"), React.createElement('select', { value: selectedElement.fontFamily, onChange: e => updateElement(selectedElementId!, { fontFamily: e.target.value }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" }, React.createElement('option', { value: "system-ui" }, "System UI (Latin)"), React.createElement('option', { value: "Noto Sans Balinese" }, "Noto Sans (Aksara Bali)"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Ketebalan"), React.createElement('select', { value: selectedElement.fontWeight, onChange: e => updateElement(selectedElementId!, { fontWeight: e.target.value }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" }, React.createElement('option', { value: "normal" }, "Normal"), React.createElement('option', { value: "bold" }, "Tebal"))),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Perataan"), React.createElement('select', { value: selectedElement.textAlign, onChange: e => updateElement(selectedElementId!, { textAlign: e.target.value }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" }, React.createElement('option', { value: "left" }, "Kiri"), React.createElement('option', { value: "center" }, "Tengah"), React.createElement('option', { value: "right" }, "Kanan")))
                                     )
                                ),
                                selectedElement.type === 'image' && (
                                     React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Tinggi (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId!, { height: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" }))
                                     )
                                ),
                                selectedElement.type === 'line' && (
                                    React.createElement(React.Fragment, null,
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Lebar (px)"), React.createElement('input', { type: "number", value: selectedElement.width, onChange: e => updateElement(selectedElementId!, { width: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" })),
                                        React.createElement('div', null, React.createElement('label', { className: "text-xs font-semibold" }, "Tebal (px)"), React.createElement('input', { type: "number", value: selectedElement.height, onChange: e => updateElement(selectedElementId!, { height: parseInt(e.target.value) }), className: "w-full p-1.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 tabular-nums" }))
                                    )
                                ),
                                 React.createElement('button', { onClick: deleteElement, className: "w-full text-left p-2 min-h-[44px] lg:min-h-0 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-medium" }, "Hapus Elemen")
                             )
                          ) : React.createElement('p', { className: "text-sm text-slate-500 dark:text-slate-400" }, "Pilih sebuah elemen untuk melihat propertinya.")
                    )
                )
            )
        )
    );
};
