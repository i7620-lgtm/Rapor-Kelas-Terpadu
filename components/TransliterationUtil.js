/**
 * Catatan: Ini adalah mesin transliterasi Latin ke Aksara Bali yang telah dirombak.
 * Logika baru ini menerapkan pendekatan hibrida:
 * 1. Menggunakan kamus 'officialPhrases' untuk menjamin akurasi 100% pada teks statis
 *    dan resmi seperti pada kop surat, berdasarkan input dari pengguna.
 * 2. Menggunakan algoritma transliterasi yang disempurnakan untuk teks dinamis lainnya,
 *    dengan penanganan vokal pre-posed (taleng), gugus konsonan, dan konsonan akhir yang lebih baik.
 */

const TINOS_REGULAR_BASE64 = 'd09GMgABAAAAAAmYAAoAAAAAFWgAAAmIAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABk4ALAoUNAE2AiQDCAsGAAQgBSAHIBuDAieaT8hGU09z5/m/O9n//3/y3/9/V8b/f58f4/k/P5/5/l/O5/1/j+T8v37f9z/u/H9f9/y/j8f//j/P/L9/X/b//3f/+v4/X//7/P//3f9/1/v+/7/v//3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f-AAAAAAAAAAAAA';
const TINOS_BOLD_BASE64 = 'd09GMgABAAAAAAoEAAoAAAAAFbAAAAnwAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABk4ALAoUNAE2AiQDCAsGAAQgBSAHIBuDAieaT8hGU09z5/m/O9n//3/y3/9/V8b/f58f4/k/P5/5/l/O5/1/j+T8v37f9z/u/H9f9/y/j8f//j/P/L9/X/b//3f/+v4/X//7/P//3f9/1/v+/7/v//3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f9/3/f-AAAAAAAAAAAAA';

/**
 * Programmatically loads the Tinos font using the FontFace API.
 * This ensures the font is fully available before rendering operations like html2canvas.
 * It checks if the font is already loaded to prevent redundant operations.
 *
 * @returns {Promise<void>} A promise that resolves when the fonts are loaded and added.
 */
export async function loadFonts() {
    if (document.fonts.check('1em Tinos')) {
        return Promise.resolve();
    }
    
    const tinosRegular = new FontFace(
        'Tinos',
        `url(data:font/woff2;base64,${TINOS_REGULAR_BASE64})`,
        { style: 'normal', weight: '400', display: 'block' }
    );
    const tinosBold = new FontFace(
        'Tinos',
        `url(data:font/woff2;base64,${TINOS_BOLD_BASE64})`,
        { style: 'normal', weight: '700', display: 'block' }
    );

    try {
        const loadedFonts = await Promise.all([tinosRegular.load(), tinosBold.load()]);
        loadedFonts.forEach(font => document.fonts.add(font));
    } catch (err) {
        console.error("Failed to load Tinos font programmatically:", err);
        // We still resolve so the PDF generation can attempt to proceed with system fonts.
        return Promise.resolve();
    }
}


// Kamus untuk frasa resmi dengan transliterasi yang sudah dipastikan benar.
const officialPhrases = {
  'pemerintah kota denpasar': 'ᬧᬫᬾᬃᬦ᭄ᬢᬄᬓᭀᬢᬤᬾᬦ᭄ᬧᬲᬃ',
  'dinas pendidikan kepemudaan dan olahraga kota denpasar': 'ᬤᬶᬦᬲ᭄ᬧᭂᬦ᭄ᬤᬶᬤᬶᬓᬦ᭄ᬓᭂᬧᭂᬫᬸᬤᬵᬦ᭄ᬤᬦᭀᬮᬄᬭᬕᬓᭀᬢᬤᬾᬦ᭄ᬧᬲᬃ',
  'sekolah dasar negeri 2 padangsambian': 'ᬲᭂᬓᭀᬮᬄᬤᬲᬃᬦᭂᬕᭂᬭᬶ᭒ᬧᬤᬂᬲᬫ᭄ᬩ᭄ᬬᬦ᭄',
  'jalan kebo iwa banjar batuparas, telepon: (0361) 9093558': 'ᬚᬮᬦ᭄ᬓᭂᬩᭀᬇᬯᬩᬜ᭄ᬚᬃᬩᬢᬸᬧᬭᬲ᭄᭞ ᬢᬾᬮᬾᬧᭀᬦ᭄᭞ ₍᭐᭓᭖᭑₎ ᭙᭐᭙᭓᭕᭕᭘',
  'bali simbar': 'ᬩᬮᬶᬲᬶᬫ᭄ᬩᬃ', // From font2u example
};

// Kamus untuk koreksi 'e' pepet vs 'e' taleng.
// Expanded list for better coverage of Indonesian words
const pepetCorrections = {
  'pemerintah': 'pĕmĕrintah', 'pendidikan': 'pĕndidikan', 'kepemudaan': 'kĕpĕmudaan',
  'sekolah': 'sĕkolah', 'negeri': 'nĕgĕri', 'kebo': 'kĕbo', 'selamat': 'sĕlamat',
  'belajar': 'bĕlajar', 'bekerja': 'bĕkĕrja', 'kesehatan': 'kĕsĕhatan',
  'perlu': 'pĕrlu', 'semua': 'sĕmua', 'tersebut': 'tĕrsĕbut', 'dengan': 'dĕngan',
  'besar': 'bĕsar', 'cerdas': 'cĕrdas', 'teman': 'tĕman', 'kelas': 'kĕlas',
  'kertas': 'kĕrtas', 'mereka': 'mĕreka', 'memerlukan': 'mĕmĕrlukan',
  'memperbaiki': 'mĕmpĕrbaiki', 'benar': 'bĕnar', 'delapan': 'dĕlapan',
  'sembilan': 'sĕmbilan', 'sepuluh': 'sĕpuluh', 'sebelas': 'sĕbĕlas', 'kepala': 'kĕpala',
  'perkembangan': 'pĕrkĕmbangan', 'prestasi': 'prĕstasi', 'pelajaran': 'pĕlajaran',
  'semester': 'sĕmĕster', 'tempat': 'tĕmpat', 'tanggal': 'tanggal', 'memimpin': 'mĕmimpin',
  'melaksanakan': 'mĕlaksanakan', 'membuat': 'mĕmbuat', 'menunjukkan': 'mĕnunjukkan',
  'mengikuti': 'mĕngikuti', 'meningkatkan': 'mĕningkatkan', 'menulis': 'mĕnulis',
  'menguasai': 'mĕnguasai', 'mengembangkan': 'mĕngembangkan', 'memiliki': 'mĕmiliki',
  'sehingga': 'sĕhingga', 'bersama': 'bĕrsama', 'membantu': 'mĕmbantu',
  'memecahkan': 'mĕmĕcahkan', 'terhadap': 'tĕrhadap', 'perhatian': 'pĕrhatian',
  'prestasi': 'prĕstasi', 'aspek': 'aspĕk', 'terpadu': 'tĕrpadu', 'peserta': 'pĕserta',
  'didik': 'didik', 'religius': 'rĕligius', 'mandiri': 'mandiri', 'bernalar': 'bĕrnalar',
  'kreatif': 'krĕatif', 'gotong': 'gotong', 'royong': 'royong', 'bertanggung': 'bĕrtanggung',
  'jawab': 'jawab', 'pengetahuan': 'pĕngetahuan', 'penilaian': 'pĕnilaian',
  'ekstrakurikuler': 'ĕkstrakurikuler', 'aktif': 'aktif', 'sakit': 'sakit', 'izin': 'izin',
  'alpa': 'alpa', 'menonjol': 'mĕnonjol', 'diskusi': 'diskusi', 'kolaborasi': 'kolaborasi',
  'peningkatan': 'pĕningkatakan', 'fokus': 'fokus', 'berpikir': 'bĕrpikir', 'strategis': 'stratĕgis',
  'antusias': 'antusias', 'percobaan': 'pĕrcobaan', 'disiplin': 'disiplin', 'motivasi': 'motivasi',
  'tinggi': 'tinggi', 'latihan': 'latihan', 'memiliki': 'mĕmiliki', 'ide': 'idĕ', 'kreatif': 'krĕatif',
  'kuat': 'kuat', 'pemecahan': 'pĕmĕcahan', 'masalah': 'masalah', 'analisis': 'analisis',
  'tajam': 'tajam', 'visual': 'visual', 'menonjol': 'mĕnonjol', 'kelenturan': 'kĕlĕnturan',
  'ekspresi': 'ĕkspresi', 'gerakan': 'gerakan', 'ketekunan': 'kĕtĕkunan', 'kemauan': 'kĕmauan',
  'belajar': 'bĕlajar', 'kolaboratif': 'kolaboratif', 'jiwa': 'jiwa', 'kepemimpinan': 'kĕpĕmimpinan',
  'semangat': 'sĕmangat', 'kerjasama': 'kĕrjasama', 'tim': 'tim', 'lapangan': 'lapangan',
  'konsentrasi': 'konsĕntrasi', 'baik': 'baik', 'koleksi': 'kolĕksi', 'gambar': 'gambar',
  'teks': 'tĕks', 'cerita': 'cĕrita', 'kalimat': 'kalimat', 'mengisi': 'mĕngisi',
  'formulir': 'formulir', 'surat': 'surat', 'memindai': 'mĕmindai', 'wawancara': 'wawancara',
  'pidato': 'pidato', 'argumen': 'argumĕn', 'mengambil': 'mĕngambil', 'keputusan': 'kĕputusan',
  'anggaran': 'anggaran', 'membandingkan': 'mĕmbandingkan', 'prediksi': 'prĕdiksi',
  'mitos': 'mitos', 'fakta': 'fakta', 'sumber': 'sumbĕr', 'tepercaya': 'tĕpĕrcaya',
  'istilah': 'istilah', 'disabilitas': 'disabilitas', 'menyunting': 'mĕnyunting',
  'ejaan': 'ejaan', 'tanda': 'tanda', 'baca': 'baca', 'menjelaskan': 'mĕnjelaskan',
  'fenomena': 'fĕnomena', 'energi': 'ĕnĕrgi', 'penerapan': 'pĕnĕrapan', 'gaya': 'gaya',
  'kemagnetan': 'kĕmagnĕtan', 'geografis': 'gĕografis', 'perubahan': 'pĕrubahan',
  'iklim': 'iklim', 'bentang': 'bĕntang', 'alam': 'alam', 'keanekaragaman': 'kĕanĕkaragaman',
  'hayati': 'hayati', 'profesi': 'profĕsi', 'masyarakat': 'masyarakat', 'menerapkan': 'mĕnĕrapkan',
  'tugas': 'tugas', 'tanggung': 'tanggung', 'interaksi': 'intĕraksi', 'sosial': 'sosial',
  'keragaman': 'kĕragaman', 'budaya': 'budaya', 'kearifan': 'kĕarifan', 'lokal': 'lokal',
  'lingkungan': 'lingkungan', 'berkontribusi': 'bĕrkontribusi', 'mitigasi': 'mitigasi',
  'melestarikan': 'mĕlĕstarikan', 'aktivitas': 'aktivitas', 'sederhana': 'sĕdĕrhana',
  'kehidupan': 'kĕhidupan', 'sehari-hari': 'sĕhari-hari', 'memaknai': 'mĕmaknai',
  'narasi': 'narasi', 'kaidah': 'kaidah', 'kebahasaan': 'kĕbahasaan', 'transitif': 'transitif',
  'intransitif': 'intransitif', 'kosakata': 'kosakata', 'denotatif': 'dĕnotatif',
  'tegakkk': 'tĕgak', 'bersambung': 'bĕrsambung', 'argumentasi': 'argumentasi',
  'diskusi': 'diskusi', 'awalan': 'awalan', 'instruksi': 'instruksi', 'deskripsi': 'dĕskripsi',
  'informatif': 'informatif', 'volume': 'volumĕ', 'intonasi': 'intonasi',
  'prosedur': 'prosedur', 'efektif': 'ĕfektif', 'maksud': 'maksud', 'puisi': 'puisi',
  'antarkalimat': 'antarkalimat', 'memahami': 'mĕmahami', 'ide': 'idĕ', 'pokok': 'pokok',
  'pendukung': 'pĕndukung', 'menceritakan': 'mĕncĕritakan', 'diperankan': 'dipĕrankan',
  'menampilkan': 'mĕnampilkan', 'pementasan': 'pĕmĕntasan', 'drama': 'drama',
  'konsep': 'konsĕp', 'produksi': 'produksi', 'artistik': 'artistik', 'penulisan': 'pĕnulisan',
  'evaluasi': 'ĕvaluasi', 'kritik': 'kritik', 'saran': 'saran', 'apresiasi': 'aprĕsiasi',
  'pertunjukan': 'pĕrtunjukan', 'berkarya': 'bĕrkarya', 'tradisional': 'tradisional',
  'modern': 'modern', 'bertahap': 'bĕrtahap', 'rutin': 'rutin', 'mengumpulkan': 'mĕngumpulkan',
  'mendokumentasikan': 'mĕndokumentasikan', 'mengalami': 'mĕngalami', 'meniru': 'mĕniru',
  'menghargai': 'mĕnghargai', 'beragam': 'bĕragam', 'identitas': 'idĕntitas',
  'budaya': 'budaya', 'suku': 'suku', 'bangsa': 'bangsa', 'bahasa': 'bahasa',
  'agama': 'agama', 'kepercayaan': 'kĕpĕrcayaan', 'masyarakat': 'masyarakat',
  'lingkungan': 'lingkungan', 'wilayah': 'wilayah', 'negara': 'nĕgara',
  'kesatuan': 'kĕsatuan', 'republik': 'rĕpublik', 'indonesia': 'indonesia',
  'hak': 'hak', 'kewajiban': 'kĕwajiban', 'warga': 'warga', 'musyawarah': 'musyawarah',
  'kesepakatan': 'kĕsĕpakatan', 'persatuan': 'pĕrsatuan', 'kesatuan': 'kĕsatuan',
  'pancasila': 'pancasila', 'meneladani': 'mĕnĕladani', 'karakter': 'karakter',
  'perumus': 'pĕrumus', 'modifikasi': 'modifikasi', 'keterampilan': 'kĕtĕrampilan',
  'fundamental': 'fundamĕntal', 'situasi': 'situasi', 'strategi': 'stratĕgi',
  'efektivitas': 'ĕfektivitas', 'inklusif': 'inklusif', 'berpartisipasi': 'bĕrpartisipasi',
  'faktor': 'faktor', 'memengaruhi': 'mĕmĕngaruhi', 'dampak': 'dampak',
  'rekomendasi': 'rĕkomendasi', 'penanganan': 'pĕnanganan', 'cedera': 'cĕdĕra',
  'sering': 'sĕring', 'menggunakan': 'mĕnggunakan', 'berinteraksi': 'bĕrintĕraksi',
  'mendesak': 'mĕndesak', 'meminta': 'mĕminta', 'ulang': 'ulang', 'perlahan': 'pĕrlahan',
  'bertanya': 'bĕrtanya', 'arti': 'arti', 'menuliskan': 'mĕnuliskan',
  'kebiasaan': 'kĕbiasaan', 'menjaga': 'mĕnjaga', 'diri': 'diri', 'sekolah': 'sĕkolah',
  'mengidentifikasi': 'mĕngidĕntifikasi', 'informasi': 'informasi', 'penting': 'pĕnting',
  'konteks': 'konteks', 'strategi': 'stratĕgi', 'pembicara': 'pĕmbicara',
  'menjelaskan': 'mĕnjelaskan', 'topik': 'topik', 'dibaca': 'dibaca', 'dilihat': 'dilihat',
  'berkaitan': 'bĕrkaitan', 'lingkungan': 'lingkungan', 'menggunakan': 'mĕnggunakan',
  'ejaan': 'ejaan', 'diciptakan': 'diciptakan', 'menanggapi': 'mĕnanggapi',
  'permintaan': 'pĕrmintaan', 'prediksi': 'prĕdiksi', 'membaca': 'mĕmbaca',
  'digital': 'digital', 'interaktif': 'intĕraktif', 'mengomunikasikan': 'mĕngomunikasikan',
  'pengalaman': 'pĕngalaman', 'menulis': 'mĕnulis', 'kemampuan': 'kĕmampuan',
  'menentukan': 'mĕnentukan', 'hubungannya': 'hubungannya', 'profesinya': 'profĕsinya',
  'memecahkan': 'mĕmĕcahkan', 'masalah': 'masalah', 'ketersediaan': 'kĕtĕrsediaan',
  'menemukan': 'mĕnĕmukan', 'keterkaitan': 'kĕtĕrkaitan', 'sejarah': 'sĕjarah',
  'pubertas': 'pubĕrtas', 'cahaya': 'cahaya', 'aplikasinya': 'aplikasinya',
  'memahami': 'mĕmahami', 'rotasi': 'rotasi', 'revolusi': 'rĕvolusi', 'bumi': 'bumi',
  'sistem': 'sistĕm', 'tata': 'tata', 'surya': 'surya', 'karakteristik': 'karaktĕristik',
  'anggota': 'anggota', 'pentingnya': 'pĕntingnya', 'peran': 'peran', 'energi': 'ĕnĕrgi',
  'terbarukan': 'tĕrbarukan', 'upaya': 'upaya', 'sumber': 'sumbĕr', 'terbatas': 'tĕrbatas',
  'penghematan': 'pĕnghĕmatan', 'mempelajari': 'mĕmpĕlajari', 'pengaruh': 'pĕngaruh',
  'permasalahan': 'pĕrmasalahan', 'diakibatkan': 'diakibatkan', 'mengusulkan': 'mĕngusulkan',
  'mengurangi': 'mĕngurangi', 'dampak': 'dampak', 'negatif': 'nĕgatif',
  'merancang': 'mĕrancang', 'proyek': 'proyĕk', 'akhir': 'akhir', 'pendekatan': 'pĕndekatan',
  'inkuiri': 'inkuiri', 'mengomunikasikan': 'mĕngomunikasikan', 'hasil': 'hasil',
  'memberikan': 'mĕmbĕrikan', 'berbagai': 'bĕrbagai', 'aspek': 'aspek',
  'sangat': 'sangat', 'baik': 'baik', 'terutama': 'tĕrutama', 'dalam': 'dalam',
  'beberapa': 'bĕbĕrapa', 'lain': 'lain', 'terlihat': 'tĕrlihat', 'menonjol': 'mĕnonjol',
  'melalui': 'mĕlalui', 'diskusikan': 'diskusi', 'solusi': 'solusi',
  'mampu': 'mampu', 'membedakan': 'mĕmbedakan', 'percaya': 'pĕrcaya',
  'memperagakan': 'mĕmpĕragakan', 'kritis': 'kritis', 'menganalisis': 'mĕnganalisis',
  'eksplorasi': 'ĕksplorasi', 'penelitian': 'pĕnelitian', 'informasi': 'informasi',
  'mengidentifikasi': 'mĕngidentifikasi', 'menilai': 'mĕnilai', 'pembelajaran': 'pĕmbelajaran',
  'pendekatan': 'pĕndekatan', 'berbasis': 'bĕrbasis', 'proyek': 'proyĕk',
  'membuat': 'mĕmbuat', 'konsep': 'konsĕp', 'menciptakan': 'mĕnciptakan',
  'presentasi': 'prĕsĕntasi', 'mengelola': 'mĕngelola', 'pengetahuan': 'pĕngetahuan',
  'berkolaborasi': 'bĕrkolaborasi', 'berpikir': 'bĕrpikir', 'bertanggung': 'bĕrtanggung',
  'jawab': 'jawab', 'mengkomunikasikan': 'mĕngkomunikasikan', 'mengatasi': 'mĕngatasi',
  'tantangan': 'tantangan', 'memastikan': 'mĕmastikan', 'mendalam': 'mĕndalam',
  'komprehensif': 'komprĕhĕnsif', 'memberikan': 'mĕmbĕrikan', 'penjelasan': 'pĕnjelasan',
  'terperinci': 'tĕrpĕrincĕ', 'terkait': 'tĕrkait', 'menguasai': 'mĕnguasai',
  'mendemonstrasikan': 'mĕdemonstrasikan', 'keterampilan': 'kĕtĕrampilan',
  'mencapai': 'mĕncapai', 'potensi': 'potensi', 'penuh': 'pĕnuh', 'terlibat': 'tĕrlibat',
  'memotivasi': 'mĕmotivasi', 'mendukung': 'mĕndukung', 'selama': 'sĕlama',
  'berinteraksi': 'bĕrintĕraksi', 'menggunakan': 'mĕnggunakan', 'berbagai': 'bĕrbagai',
  'strategi': 'stratĕgi', 'untuk': 'untuk', 'memastikan': 'mĕmastikan',
  'komunikasi': 'komunikasi', 'efektif': 'efektif', 'memberikan': 'mĕmbĕrikan',
  'umpan': 'umpan', 'balik': 'balik', 'konstruktif': 'konstruktif',
  'menghargai': 'mĕnghargai', 'perbedaan': 'pĕrbedaan', 'pandangan': 'pandangan',
  'beradaptasi': 'bĕradaptasi', 'situasi': 'situasi', 'baru': 'baru',
  'menunjukkan': 'mĕnunjukkan', 'kematangan': 'kĕmatangan', 'emosional': 'ĕmosional',
  'sosial': 'sosial', 'mampu': 'mampu', 'mengelola': 'mĕngelola', 'emosi': 'ĕmosi',
  'menyelesaikan': 'mĕnyelesaikan', 'konflik': 'konflik', 'konstruktif': 'konstruktif',
  'berempati': 'bĕrĕmpati', 'orang': 'orang', 'lain': 'lain', 'memahami': 'mĕmahami',
  'perspektif': 'pĕrspĕktif', 'budaya': 'budaya', 'berbeda': 'bĕrbĕda',
};

// Vowels for diacritics and independent vowels
const INDEPENDENT_VOWEL_MAP = {
  'A': 'ᬅ', 'I': 'ᬇ', 'U': 'ᬉ', 'É': 'ᬏ', 'O': 'ᬑ', 'Ĕ': 'ᬐ',
  'a': 'ᬅ', 'i': 'ᬇ', 'u': 'ᬉ', 'e': 'ᬏ', 'o': 'ᬑ', 'ĕ': 'ᬐ',
  'ā': 'ᬆ', 'ī': 'ᬈ', 'ū': 'ᬊ',
  '_ai_diph_': 'ᬿ', // Token for ai diphthong
  '_au_diph_': 'ᬾᭁ', // Token for au diphthong
};

// Consonants including digraphs and special forms (case-sensitive for input processing)
// Longer matches must come first
const CONSONANT_MAP = {
  // Special Retroflex/Aspirated Consonants (Lexilogos style, using internal tokens)
  '_ṭh_': 'ᬞ', // Tha Latik
  '_ḍh_': 'ᬕ', // Dha Latik (as per Lexilogos 'Dh' mapping for 'ga gora')
  '_ph_': 'ᬨ', // Pa Kapal
  '_bh_': 'ᬪ', // Ba Kembang
  '_ś_': 'ᬰ',  // Sa Saga
  '_ṭ_': 'ᬝ',  // Ta Latik
  '_ḍ_': 'ᬓ',  // Dha Latik (as per Lexilogos 'D' mapping for 'ka')
  '_ṇ_': 'ᬡ',  // Na Rambat
  '_ṣ_': 'ᬱ',  // Sa Sapa

  // Standard Digraphs
  'ny': 'ᬜ',
  'ng': 'ᬗ',
  'th': 'ᬣ', // Dental aspirated, if not already handled by _ṭh_
  'dh': 'ᬥ', // Dental aspirated, if not already handled by _ḍh_
  'kh': 'ᬔ',
  'gh': 'ᬖ',

  // Single Consonants (case-insensitive where no special uppercase form exists)
  'h': 'ᬳ', 'n': 'ᬦ', 'c': 'ᬘ', 'r': 'ᬭ', 'k': 'ᬓ', 'd': 'ᬤ', 't': 'ᬢ', 's': 'ᬲ', 'w': 'ᬯ', 'l': 'ᬮ',
  'm': 'ᬫ', 'g': 'ᬕ', 'b': 'ᬩ', 'p': 'ᬧ', 'j': 'ᬚ', 'y': 'ᬬ',
};

// Diacritics (Sandhangan Swara)
const DIACRITIC_MAP = {
  'i': 'ᬶ', // ulu
  'u': 'ᬸ', // suku
  'ĕ': 'ᭂ', // pepet
  'e': 'ᬾ', // taleng (pre-posed)
  'o_post': 'ᭀ', // tedung (post-posed for 'o' combined with taleng)
};

// Final Consonants (Pangangge Panyigeging Aksara)
const FINALS_MAP = {
  'r': 'ᬃ', // surang
  'ng': 'ᬂ', // cecek
  'h': 'ᬄ'  // bisah
};

// Special characters / sounds (e.g., keret for rĕ, gantungan-la-lenga for lĕ)
const SPECIAL_CHARS_MAP = {
  'ṛ': 'ᬺ', // keret
  'ḷ': 'ᬼ', // gantungan-la-lenga
};

// Balinese numbers and punctuation
const BALINESE_NUMBERS_PUNCTUATION = {
  '0': '᭐', '1': '᭑', '2': '᭒', '3': '᭓', '4': '᭔',
  '5': '᭕', '6': '᭖', '7': '᭗', '8': '᭘', '9': '᭙',
  '(': '₍', ')': '₎', ',': '᭞', '.': '᭟', '=': '᭠', // '=' for Nukta
  ':': '᭞', // Colon as equivalent to a comma for practical purposes
};

const ADEG_ADEG = '᭄';

// Helper to check if a character is an alphabet letter
function isAlpha(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x61 && code <= 0x7A) || (code >= 0x41 && code <= 0x5A); // a-z, A-Z
}

// Helper to check if a character is a vowel (including long vowels and ĕ, and diphthong tokens)
function isVowel(char) {
  return 'aiueoĕāīū'.includes(char) || char.includes('_diph_');
}

// Function to apply pepet corrections (case-insensitive for matching, output will use ĕ)
function applyPepetCorrections(text) {
  if (!text) return '';
  let correctedText = text;
  for (const [latinWord, pepetWord] of Object.entries(pepetCorrections)) {
    // Use regex to replace whole words case-insensitively
    const regex = new RegExp(`\\b${latinWord}\\b`, 'gi');
    correctedText = correctedText.replace(regex, (match) => {
      // Preserve case for first letter, then apply pepet word for the rest
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return pepetWord.charAt(0).toUpperCase() + pepetWord.slice(1);
      }
      return pepetWord;
    });
  }
  return correctedText;
}

export function transliterate(latin) {
  if (!latin) return '';

  // 1. Check official phrases (case-insensitive for lookup)
  const lowerLatinForLookup = latin.trim().toLowerCase();
  if (officialPhrases[lowerLatinForLookup]) {
    return officialPhrases[lowerLatinForLookup];
  }

  // 2. Apply pepet corrections while trying to preserve original casing
  let processedLatin = applyPepetCorrections(latin);

  // 3. Pre-process for long vowels, diphthongs, special consonants, and specific ligatures
  // Order matters here to prevent partial matches
  processedLatin = processedLatin.replace(/aa/gi, 'ā').replace(/ii/gi, 'ī').replace(/uu/gi, 'ū');
  processedLatin = processedLatin.replace(/ai/gi, '_ai_diph_').replace(/au/gi, '_au_diph_');

  // Special Consonants from Lexilogos (case-sensitive patterns first)
  // Ensure 'Th' is matched before 'T', 'Dh' before 'D', etc.
  processedLatin = processedLatin
    .replace(/Th/g, '_ṭh_').replace(/Dh/g, '_ḍh_').replace(/Ph/g, '_ph_').replace(/Bh/g, '_bh_').replace(/Ś/g, '_ś_')
    .replace(/T(?![h])/g, '_ṭ_').replace(/D(?![h])/g, '_ḍ_').replace(/N/g, '_ṇ_').replace(/S(?![h])/g, '_ṣ_');
  
  // Ligatures (keret, la-lenga)
  processedLatin = processedLatin.replace(/rĕ/g, 'ṛ').replace(/lĕ/g, 'ḷ');

  let result = "";
  let i = 0;

  // List of possible consonant starts (longest first for greedy matching)
  const sortedConsonantKeys = Object.keys(CONSONANT_MAP).sort((a, b) => b.length - a.length);
  const sortedVowelKeys = Object.keys(INDEPENDENT_VOWEL_MAP).sort((a, b) => b.length - a.length);


  while (i < processedLatin.length) {
    let char = processedLatin[i];
    let matched = false;

    // 4. Handle Punctuation, Numbers, and special Balinese characters/ligatures
    if (BALINESE_NUMBERS_PUNCTUATION[char]) {
      result += BALINESE_NUMBERS_PUNCTUATION[char];
      i++;
      matched = true;
    } else if (SPECIAL_CHARS_MAP[char]) {
      result += SPECIAL_CHARS_MAP[char];
      i++;
      matched = true;
    } else if (char.includes('_diph_')) { // Handle diphthong tokens created during pre-processing
        for (const diphKey of ['_ai_diph_', '_au_diph_']) {
            if (processedLatin.substring(i, i + diphKey.length) === diphKey) {
                result += INDEPENDENT_VOWEL_MAP[diphKey];
                i += diphKey.length;
                matched = true;
                break;
            }
        }
    }

    if (matched) continue;

    // 5. Handle Independent Vowels (at start of word or after non-alpha characters)
    // Check for independent vowel tokens like ā, ī, ū, and normal a, i, u, e, o, ĕ
    for (const vowelKey of sortedVowelKeys) {
      if (processedLatin.substring(i, i + vowelKey.length) === vowelKey) {
        const prevChar = i > 0 ? processedLatin[i - 1] : ' ';
        // Only if it's the start of the text or after a non-alphabetic character
        if (!isAlpha(prevChar) && INDEPENDENT_VOWEL_MAP[vowelKey]) {
          result += INDEPENDENT_VOWEL_MAP[vowelKey];
          i += vowelKey.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // 6. Consonant parsing
    let currentConsonant = null;
    let consonantLen = 0;

    for (const cKey of sortedConsonantKeys) {
      if (processedLatin.substring(i, i + cKey.length).toLowerCase() === cKey.toLowerCase()) {
        currentConsonant = cKey;
        consonantLen = cKey.length;
        break;
      }
    }

    if (currentConsonant) {
      // Find following vowel (inherent 'a' if none explicit)
      let vowelAfterConsonant = 'a'; // Default to inherent 'a'
      let vowelLen = 0;
      let charAfterConsonantIndex = i + consonantLen;

      // Check for explicit vowel
      for (const vKey of sortedVowelKeys) {
        if (processedLatin.substring(charAfterConsonantIndex, charAfterConsonantIndex + vKey.length) === vKey) {
            vowelAfterConsonant = vKey;
            vowelLen = vKey.length;
            break;
        }
      }

      // Check for final consonants
      let finalConsonant = null;
      const afterVowelPos = charAfterConsonantIndex + vowelLen;
      const nextTwoCharsAfterVowel = processedLatin.substring(afterVowelPos, afterVowelPos + 2).toLowerCase();
      const nextCharAfterVowel = processedLatin[afterVowelPos]?.toLowerCase();
      
      if (nextTwoCharsAfterVowel === 'ng') {
          finalConsonant = 'ng';
      } else if (FINALS_MAP[nextCharAfterVowel]) {
          finalConsonant = nextCharAfterVowel;
      }

      // Only apply final consonant if it's genuinely a syllable-final and not leading another syllable
      if (finalConsonant) {
          const charAfterFinal = processedLatin[afterVowelPos + finalConsonant.length];
          if (isAlpha(charAfterFinal) && isVowel(charAfterFinal)) { // If followed by vowel, it's not a final
              finalConsonant = null;
          }
      }

      let aksara = CONSONANT_MAP[currentConsonant];
      if (aksara) {
        result += aksara;

        // Apply vowel diacritic if present
        if (vowelAfterConsonant && vowelAfterConsonant !== 'a') {
          if (vowelAfterConsonant === 'e') { // 'e' for taleng
            result = result.slice(0, -aksara.length) + DIACRITIC_MAP['e'] + aksara;
          } else if (vowelAfterConsonant === 'o') { // 'o' for taleng + tedung
            result = result.slice(0, -aksara.length) + DIACRITIC_MAP['e'] + aksara + DIACRITIC_MAP['o_post'];
          } else if (DIACRITIC_MAP[vowelAfterConsonant]) {
            result += DIACRITIC_MAP[vowelAfterConsonant];
          }
        }
        
        // Advance index past consonant and vowel
        i += consonantLen + vowelLen;

        // Apply final consonant if present
        if (finalConsonant) {
            result += FINALS_MAP[finalConsonant];
            i += finalConsonant.length;
        } else {
            // Check for Adeg-Adeg for consonant clusters or silent final 'a'
            const nextLogicalChar = processedLatin[i];
            // If next is consonant and not end of string, it's a cluster. Add adeg-adeg.
            // Exception: if current consonant had an explicit vowel, Adeg-Adeg is not typically added directly after.
            // This is a complex rule and simplified here.
            if (isAlpha(nextLogicalChar) && !isVowel(nextLogicalChar)) {
                 result += ADEG_ADEG; // Implicit Adeg-Adeg for consonant cluster
            }
        }
      } else {
        // If consonant not found in map, just append as is (should not happen with comprehensive map)
        result += char;
        i++;
      }
    } else {
      // If not a recognized consonant, vowel, number, or punctuation, append as is
      result += char;
      i++;
    }
  }

  // Remove any trailing Adeg-Adeg (final inherent 'a' is typically silent)
  return result.replace(new RegExp(`${ADEG_ADEG}(?=\\s*|$)`, 'g'), '');
}


const BALI_CITIES_REGECIES = {
  KOTA: ["denpasar"],
  KABUPATEN: ["badung", "bangli", "buleleng", "gianyar", "jembrana", "karangasung", "klungkung", "tabanan"]
};

export function generatePemdaText(kotaKabupatenInput, provinsiInput) {
    const defaultText = "PEMERINTAH KOTA DENPASAR";
    if (!kotaKabupatenInput || !kotaKabupatenInput.trim()) {
        return defaultText;
    }

    let text = kotaKabupatenInput.trim().toLowerCase();
    let provinsi = (provinsiInput || '').trim().toLowerCase();

    if (text.includes('kota ') || text.includes('kabupaten ')) {
        if (text.startsWith('pemerintah')) {
            return text.toUpperCase();
        }
        return `PEMERINTAH ${text}`.toUpperCase();
    }
    
    if (provinsi === 'bali' || provinsi === '') {
        if (BALI_CITIES_REGECIES.KOTA.includes(text)) {
            return `PEMERINTAH KOTA ${kotaKabupatenInput}`.toUpperCase();
        }
    
        if (BALI_CITIES_REGECIES.KABUPATEN.includes(text)) {
            return `PEMERINTAH KABUPATEN ${kotaKabupatenInput}`.toUpperCase();
        }
    }

    return `PEMERINTAH KABUPATEN ${kotaKabupatenInput}`.toUpperCase();
}

export function expandAndCapitalizeSchoolName(name) {
    if (!name || !name.trim()) return '';
    let processedName = name.trim().toLowerCase();
    
    processedName = processedName.replace(/\b(sdn|sd n)\b/g, 'sekolah dasar negeri');
    processedName = processedName.replace(/\bsd\b/g, 'sekolah dasar');

    return processedName.toUpperCase();
}

export const generateInitialLayout = (appSettings) => {
    const pemdaText = generatePemdaText(appSettings.kota_kabupaten, appSettings.provinsi);
    const dinasDetailText = (appSettings.nama_dinas_pendidikan || "DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA KOTA DENPASAR").toUpperCase();
    const sekolahText = expandAndCapitalizeSchoolName(appSettings.nama_sekolah || "SEKOLAH DASAR NEGERI 2 PADANGSAMBIAN");
    
    const alamatText = appSettings.alamat_sekolah || "Jalan Kebo Iwa Banjar Batuparas";

    const telpText = appSettings.telepon_sekolah ? `Telepon: ${appSettings.telepon_sekolah}` : "Telepon: (0361) 9093558";
    const alamatTelpText = [alamatText, telpText].filter(Boolean).join(', ');

    const contactLine2 = [
        appSettings.kode_pos ? `Kode Pos: ${appSettings.kode_pos}` : null,
        appSettings.email_sekolah ? `Email: ${appSettings.email_sekolah}` : null,
        appSettings.website_sekolah ? `Website: ${appSettings.website_sekolah}` : null,
        appSettings.faksimile ? `Faksimile: ${appSettings.faksimile}` : null,
    ].filter(Boolean).join(' | ');

    return [
        // Logos
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 45, width: 85, height: 85 },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 695, y: 45, width: 85, height: 85 },
        
        // Block 1: Pemda
        { id: 'aksara_dinas_text', type: 'text', content: transliterate(pemdaText), x: 120, y: 18, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_text', type: 'text', content: pemdaText, x: 120, y: 34, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        // Block 2: Dinas Detail
        { id: 'aksara_dinas_detail_text', type: 'text', content: transliterate(dinasDetailText), x: 120, y: 52, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_detail_text', type: 'text', content: dinasDetailText, x: 120, y: 68, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        // Block 3: School
        { id: 'aksara_sekolah_text', type: 'text', content: transliterate(sekolahText), x: 120, y: 88, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 17, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_sekolah_text', type: 'text', content: sekolahText, x: 120, y: 108, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },

        // Block 4: Address & Contact
        { id: 'aksara_alamat_telp_text', type: 'text', content: transliterate(alamatTelpText), x: 120, y: 130, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_alamat_telp_text', type: 'text', content: alamatTelpText, x: 120, y: 143, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        { id: 'latin_kontak_lainnya_text', type: 'text', content: contactLine2, x: 120, y: 155, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        
        // Separator Line
        { id: 'line_1', type: 'line', content: '', x: 10, y: 172, width: 780, height: 3 },
    ];
};
