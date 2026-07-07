import { useState, useEffect, useRef } from 'react';
import { 
    transliterate, 
    generatePemdaText, 
    expandAndCapitalizeSchoolName, 
    generateInitialLayout 
} from '../../utils/TransliterationUtil';

export function useKopSuratEditorLogic(settings: any, isOpen: boolean, onSaveLayout: (elements: any[]) => void, onClose: () => void) {
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
                } catch {
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

    return {
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
        handleMouseDown,
        addElement,
        deleteElement,
        handleSave
    };
}
