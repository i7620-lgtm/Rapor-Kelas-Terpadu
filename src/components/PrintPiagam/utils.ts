import { generateInitialLayout } from '../TransliterationUtil';

export const PAPER_SIZES = {
    A4: { width: '29.7cm', height: '21cm' },
    F4: { width: '33cm', height: '21.5cm' },
    Letter: { width: '27.94cm', height: '21.59cm' },
    Legal: { width: '35.56cm', height: '21.59cm' },
};

export const PIAGAM_WIDTH = 1115;
export const PIAGAM_HEIGHT = 749; 
export const PIAGAM_VIEWBOX = `0 0 ${PIAGAM_WIDTH} ${PIAGAM_HEIGHT}`;

export const toRoman = (num: number) => {
    if (isNaN(num)) return num;
    const roman: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

// Helper to measure text width
export const getTextWidth = (text: string, font: string) => {
    if (typeof document === 'undefined') return 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
        context.font = font;
        return context.measureText(text).width;
    }
    return 0;
};

export const generateInitialPiagamLayout = (settings: any) => {
    // Generate the base layout first, which now has dynamically correct Y positions.
    const currentSemester = settings?.semester || 'Ganjil';
    const kopLayoutField = currentSemester === 'Genap' ? 'kop_layout_Genap' : 'kop_layout';
    
    let rawLayout = settings[kopLayoutField];
    if (typeof rawLayout === 'string') {
        try {
            rawLayout = JSON.parse(rawLayout);
        } catch (_e) {
            rawLayout = null;
        }
    }
    const kopLayout = Array.isArray(rawLayout) && rawLayout.length > 0 
        ? JSON.parse(JSON.stringify(rawLayout)) 
        : generateInitialLayout(settings);
    
    const yOffset = 50;
    const xOffset = (PIAGAM_WIDTH - 800) / 2;

    const adaptedKopElements = kopLayout.map((el: any) => {
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
    const adaptedLineEl = adaptedKopElements.find((el: any) => el.id.includes('line_1'));
    const kopBottomY = adaptedLineEl ? adaptedLineEl.y + (adaptedLineEl.height || 0) : 100;
    
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
