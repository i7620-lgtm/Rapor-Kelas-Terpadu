import React from 'react';

/**
 * Catatan: Mesin transliterasi Latin ke Aksara Bali yang ditulis ulang sepenuhnya.
 * Logika baru ini dirancang untuk mem-parsing suku kata dengan benar, menangani
 * gugus konsonan (gantungan), vokal berurutan, dan aturan fonetik kompleks
 * untuk mencapai transliterasi "per kata" yang akurat.
 */

// Kamus frasa resmi untuk akurasi 100% pada teks kop surat.
const officialPhrases = {
  // Kata-kata individual untuk akurasi yang lebih tinggi
  'dinas': 'ᬤᬶᬦᬲ᭄',
  'pendidikan': 'ᬧᭂᬦ᭄ᬤᬶᬤᬶᬓᬦ᭄',
  'kepemudaan': 'ᬓᭂᬧᭂᬫᬸᬤᬵᬦ᭄',
  'dan': 'ᬤᬦ᭄',
  'olahraga': 'ᬳᭀᬮᬄᬭᬕ',
  'kota': 'ᬓᭀᬢ',
  'denpasar': 'ᬤᬾᬦ᭄ᬧᬲᬃ',
  'bali': 'ᬩᬮᬶ',
  'simbar': 'ᬲᬶᬫ᭄ᬩᬃ',
};


// Kamus untuk koreksi 'e' pepet (ditandai dengan ĕ) vs 'e' taleng (dibiarkan sebagai e).
// Diperluas secara signifikan untuk mencakup kosakata umum dalam konteks pendidikan.
const pepetCorrections = {
    // Kata-kata dari permintaan pengguna dan konteks aplikasi
    'sebagai': 'sĕbagai', 'semua': 'sĕmua', 'sekolah': 'sĕkolah', 'selamat': 'sĕlamat', 
    'semester': 'sĕmĕster', 'sembilan': 'sĕmbilan', 'sepuluh': 'sĕpuluh', 'sehingga': 'sĕhingga',
    'seperti': 'sĕpĕrti', 'sederhana': 'sĕdĕrhana', 'selalu': 'sĕlalu', 'sekar': 'sĕkar', 'setia': 'sĕtia',
    'benar': 'bĕnar', 'besar': 'bĕsar', 'bekerja': 'bĕkĕrja', 'belajar': 'bĕlajar', 'besi': 'bĕsi',
    'ke': 'kĕ', // Preposisi umum
    'kelas': 'kĕlas', 'kepala': 'kĕpala', 'kertas': 'kĕrtas', 'kesehatan': 'kĕsĕhatan',
    'kebo': 'kĕbo', 'kembali': 'kĕmbali', 'kemampuan': 'kĕmampuan', 'kepemudaan': 'kĕpĕmudaan',
    'perlu': 'pĕrlu', 'perkembangan': 'pĕrkĕmbangan', 'pengetahuan': 'pĕngĕtahuan',
    'penilaian': 'pĕnilaian', 'perhatian': 'pĕrhatian', 'peserta': 'pĕsĕrta', 'pemerintah': 'pĕmĕrintah',
    'pendidikan': 'pĕndidikan',
    'memberi': 'mĕmbĕri', 'membuat': 'mĕmbuat', 'membaca': 'mĕmbaca', 'menulis': 'mĕnulis',
    'memiliki': 'mĕmiliki', 'mereka': 'mĕreka', 'memerlukan': 'mĕmĕrlukan', 'memperbaiki': 'mĕmpĕrbaiki',
    'menjelaskan': 'mĕnjelaskan', 'menyebutkan': 'mĕnyĕbutkan', 'menunjukkan': 'mĕnunjukkan',
    'mengikuti': 'mĕngikuti', 'mengembangkan': 'mĕngĕmbangkan', 'meningkatkan': 'mĕningkatkan',
    'negeri': 'nĕgĕri',
    'tersebut': 'tĕrsĕbut', 'terpadu': 'tĕrpadu', 'teman': 'tĕman', 'tempat': 'tĕmpat',
    'telah': 'tĕlah',
    'delapan': 'dĕlapan', 'dengan': 'dĕngan', 'depan': 'dĕpan',
    'gelas': 'gĕlas',
    // Kata dengan 'e' taling (tidak diubah, ditambahkan untuk prioritas)
    'meja': 'meja', 'merah': 'merah', 'lebar': 'lebar', 'karet': 'karet', 'bebek': 'bebek',
    'ekstrakurikuler': 'ekstrakurikuler', 'presiden': 'presiden', 'prestasi': 'prestasi',
    'evaluasi': 'evaluasi', 'revisi': 'revisi', 'mental': 'mental', 'leger': 'leger',
};

// Aksara Swara (Vokal Mandiri)
const INDEPENDENT_VOWELS = { 'a': 'ᬅ', 'i': 'ᬇ', 'u': 'ᬉ', 'e': 'ᬏ', 'o': 'ᬑ', 'ĕ': 'ᬅᭂ' };

// Aksara Wianjana (Konsonan)
const CONSONANTS = {
    'h': 'ᬳ', 'n': 'ᬦ', 'c': 'ᬘ', 'r': 'ᬭ', 'k': 'ᬓ', 'd': 'ᬤ', 't': 'ᬢ', 's': 'ᬲ', 'w': 'ᬯ', 'l': 'ᬮ',
    'm': 'ᬫ', 'g': 'ᬕ', 'b': 'ᬩ', 'p': 'ᬧ', 'j': 'ᬚ', 'y': 'ᬬ', 'ny': 'ᬜ', 'ng': 'ᬗ',
    'kh': 'ᬔ', 'gh': 'ᬖ', 'ṭ': 'ᬝ', 'ḍ': 'ᬟ', 'dh': 'ᬥ', 'th': 'ᬣ', 'bh': 'ᬪ', 'ph': 'ᬨ',
    'z': 'ᬚ', 'f': 'ᬧ', 'v': 'ᬯ',
};

// Pangangge Swara (Diakritik Vokal)
const VOWEL_DIACRITICS = { 
    'i': 'ᬶ', 'u': 'ᬸ', 'ĕ': 'ᭂ', // Pepet
    'e': 'ᬾ', // Taling
    'tedung': 'ᬵ' 
};

// Pangangge Tengenan (Tanda Konsonan Akhir)
const FINALS = { 'r': 'ᬃ', 'ng': 'ᬂ', 'h': 'ᬄ' };

// Angka dan Tanda Baca Bali
const BALINESE_NUMBERS_PUNCTUATION = {
  '0': '᭐', '1': '᭑', '2': '᭒', '3': '᭓', '4': '᭔', '5': '᭕', '6': '᭖', '7': '᭗', '8': '᭘', '9': '᭙',
  '(': '₍', ')': '₎', ',': '᭞', '.': '᭟', ':': ':',
};

const ADEG_ADEG = '᭄';
const CARIK_SIKI = '᭞';
const VOWELS = 'aiueoĕ';

// Peta Bunyi Huruf untuk Singkatan (Ringkesan)
// Menggunakan Aksara Swara (ᬏ = É, ᬅ = A, dll) untuk bunyi vokal di awal nama huruf
const LETTER_SOUNDS = {
    'A': 'ᬅ',           // A (Akara)
    'B': 'ᬩᬾ',          // Bé (Ba + Taling)
    'C': 'ᬘᬾ',          // Cé (Ca + Taling)
    'D': 'ᬤᬾ',          // Dé (Da + Taling)
    'E': 'ᬏ',           // É (Ekara)
    'F': 'ᬏᬧ᭄',         // Éf (Ekara + Pa + Adeg-adeg)
    'G': 'ᬕᬾ',          // Gé (Ga + Taling)
    'H': 'ᬳ',           // Ha
    'I': 'ᬇ',           // I (Ikara)
    'J': 'ᬚᬾ',          // Jé (Ja + Taling)
    'K': 'ᬓ',           // Ka
    'L': 'ᬏᬮ᭄',         // Él (Ekara + La + Adeg-adeg)
    'M': 'ᬏᬫ᭄',         // Ém (Ekara + Ma + Adeg-adeg)
    'N': 'ᬏᬦ᭄',         // Én (Ekara + Na + Adeg-adeg)
    'O': 'ᬑ',           // O (Okara)
    'P': 'ᬧᬾ',          // Pé (Pa + Taling)
    'Q': 'ᬓᬶ',          // Ki (Ka + Ulu)
    'R': 'ᬏᬭ᭄',         // Ér (Ekara + Ra + Adeg-adeg)
    'S': 'ᬏᬲ᭄',         // És (Ekara + Sa + Adeg-adeg)
    'T': 'ᬢᬾ',          // Té (Ta + Taling)
    'U': 'ᬉ',           // U (Ukara)
    'V': 'ᬯᬾ',          // Vé (Wa + Taling)
    'W': 'ᬯᬾ',          // Wé (Wa + Taling)
    'X': 'ᬏᬓ᭄ᬲ᭄',       // Éks (Ekara + Ka + Adeg + Sa + Adeg)
    'Y': 'ᬬᬾ',          // Yé (Ya + Taling)
    'Z': 'ᬚᬾᬢ᭄',        // Zét (Ja + Taling + Ta + Adeg)
};

const ALL_CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

function isVowel(char) { return VOWELS.includes(char.toLowerCase()); }

function applyCorrections(text) {
    let correctedText = text;
    Object.entries(pepetCorrections).forEach(([latin, corrected]) => {
        const regex = new RegExp(`\\b${latin}\\b`, 'gi');
        correctedText = correctedText.replace(regex, (match) => {
            const firstChar = match.charAt(0);
            return (firstChar === firstChar.toUpperCase() && corrected.length > 0)
                ? corrected.charAt(0).toUpperCase() + corrected.slice(1)
                : corrected;
        });
    });
    return correctedText;
}

/**
 * Menerjemahkan singkatan (akronim) sesuai aturan Ringkesan Modern.
 * Aturan: Diapit carik siki, ditulis sesuai bunyi pengucapan, dan dipisah spasi.
 * @param {string} abbreviation Teks singkatan (misal: SMA, KTP).
 * @returns {string} Aksara Bali untuk singkatan tersebut.
 */
function _transliterateAbbreviation(abbreviation) {
    const chars = abbreviation.split('');
    const balineseSounds = chars.map(char => LETTER_SOUNDS[char.toUpperCase()] || char);
    // Menggunakan spasi di antara bunyi huruf dan diapit carik siki
    return `${CARIK_SIKI}${balineseSounds.join(' ')}${CARIK_SIKI}`;
}

/**
 * Menerjemahkan satu kata Latin ke dalam aksara Bali.
 * Mesin baru ini mem-parsing dari kiri ke kanan, mengidentifikasi suku kata
 * dan gugus konsonan secara akurat, termasuk surang, cakra, dan nania.
 * @param {string} latin Kata Latin untuk ditransliterasi.
 * @returns {string} Skrip Bali yang ditransliterasi.
 */
function _transliterateWord(latin) {
    if (!latin) return '';
    let text = applyCorrections(latin);

    // Menangani diftong "ia" yang diucapkan sebagai "ya" setelah konsonan.
    // Contoh: sedia -> sedya, biasa -> byasa, padangsambian -> padangsambyan
    text = text.replace(/([bcdfghjklmnpqrstvwxyz])ia/gi, '$1ya');

    // Menangani rangkapan wianjana (gugus konsonan)
    // nc -> nyc (contoh: panca -> panyca)
    text = text.replace(/nc/gi, 'nyc');
    // nj -> nyj (contoh: banjir -> banyjir)
    text = text.replace(/nj/gi, 'nyj');
    // dny -> jny (contoh: yadnya -> yajnya)
    text = text.replace(/dny/gi, 'jny');

    let result = '';
    let i = 0;

    const findConsonant = (pos) => ALL_CONSONANT_KEYS.find(key => text.substring(pos, pos + key.length).toLowerCase() === key);

    while (i < text.length) {
        // Kasus 1: Vokal di awal kata
        if (isVowel(text[i])) {
            result += INDEPENDENT_VOWELS[text[i].toLowerCase()];
            i++;
            continue;
        }

        // Kasus 2: Harus konsonan
        let c1 = findConsonant(i);
        if (!c1) {
            result += text[i]; // Karakter tidak dikenali
            i++;
            continue;
        }

        let c1_len = c1.length;
        let c1_base = CONSONANTS[c1];
        let next_pos = i + c1_len;

        // Jika c1 adalah karakter terakhir
        if (next_pos >= text.length) {
            result += (FINALS[c1] || c1_base + ADEG_ADEG);
            break;
        }

        // Lihat ke depan untuk gugus konsonan medial (-r- atau -y-)
        let c2 = findConsonant(next_pos);
        if (c2 && (c2 === 'r' || c2 === 'y')) {
            let after_c2_pos = next_pos + c2.length;
            if (after_c2_pos < text.length && isVowel(text[after_c2_pos])) {
                // Pola C-r-V (cakra) atau C-y-V (nania)
                let vowel = text[after_c2_pos].toLowerCase();
                let pangangge = c2 === 'r' ? '᭄ᬭ' : '᭄ᬬ';
                
                let syllable = c1_base + pangangge;
                if (vowel !== 'a') {
                    if (vowel === 'o') {
                        syllable += VOWEL_DIACRITICS.e + VOWEL_DIACRITICS.tedung;
                    } else { // For i, u, e, ĕ
                        syllable += VOWEL_DIACRITICS[vowel];
                    }
                }
                result += syllable;
                i = after_c2_pos + 1;
                continue;
            }
        }

        // Lihat ke depan untuk vokal (suku kata CV)
        if (isVowel(text[next_pos])) {
            let vowel = text[next_pos].toLowerCase();
            let syllable = c1_base;
            if (vowel !== 'a') {
                if (vowel === 'o') {
                    syllable += VOWEL_DIACRITICS.e + VOWEL_DIACRITICS.tedung;
                } else { // For i, u, e, ĕ
                    syllable += VOWEL_DIACRITICS[vowel];
                }
            }
            result += syllable;
            i = next_pos + 1;
            continue;
        }

        // Lihat ke depan untuk konsonan lain (gugus konsonan)
        if (c2) {
            // Kasus 'r' di tengah kata (surang)
            if (c1 === 'r') {
                result += FINALS.r; // Tambahkan surang, akan ditempatkan di atas aksara berikutnya
                i = next_pos; // Lanjutkan dari c2
                continue;
            }
            
            // Gugus konsonan biasa, matikan c1 dengan adeg-adeg
            result += c1_base + ADEG_ADEG;
            i = next_pos; // Lanjutkan dari c2 (yang akan menjadi gantungan)
            continue;
        }

        // Jika sampai di sini, c1 diikuti oleh karakter tidak dikenal, anggap sebagai konsonan akhir
        result += (FINALS[c1] || c1_base + ADEG_ADEG);
        i = next_pos;
    }
    
    // Pasca-pemrosesan untuk kasus khusus
    let finalResult = result;
    finalResult = finalResult.replace(/ᬭᭂ/g, 'ᬋ'); // ra repa
    finalResult = finalResult.replace(/ᬮᭂ/g, 'ᬍ'); // la lenga
    
    return finalResult;
}


/**
 * Fungsi transliterasi publik. Memisahkan teks menjadi kata dan tanda baca,
 * lalu menerjemahkan setiap bagian.
 * @param {string} latin Teks Latin untuk ditransliterasi.
 * @returns {string} Skrip Bali yang ditransliterasi.
 */
export function transliterate(latin) {
    if (!latin) return '';
    const textToProcess = latin.trim();

    // Hapus pemeriksaan frasa penuh, langsung ke pemrosesan per bagian
    const parts = textToProcess.split(/(\s|[.,:()?!])/g).filter(Boolean);

    return parts.map(part => {
        const lowerPart = part.toLowerCase();
        // Periksa kamus kata tunggal
        if (officialPhrases[lowerPart]) return officialPhrases[lowerPart];
        
        // Periksa apakah ini singkatan (Huruf Kapital Semua, panjang >= 2, bukan angka)
        // Contoh: SMA, KTP, DPR. Pengecualian untuk angka romawi jika diperlukan bisa ditambahkan nanti.
        if (part.match(/^[A-Z]{2,}$/)) {
            return _transliterateAbbreviation(part);
        }
        
        // Tangani spasi dan tanda baca
        if (part.match(/^(\s|[.,:()?!])$/)) return BALINESE_NUMBERS_PUNCTUATION[part] || part;
        
        // Tangani angka
        if (part.match(/^[0-9]+$/)) {
            return part.split('').map(digit => BALINESE_NUMBERS_PUNCTUATION[digit] || digit).join('');
        }
        
        // Transliterasi kata biasa
        return _transliterateWord(part);
    }).join('');
}

const BALI_CITIES_REGECIES = {
  KOTA: ["denpasar"],
  KABUPATEN: ["badung", "bangli", "buleleng", "gianyar", "jembrana", "karangasem", "klungkung", "tabanan"]
};

export function generatePemdaText(kotaKabupatenInput, provinsiInput) {
    const defaultText = "PEMERINTAH KOTA DENPASAR";
    if (!kotaKabupatenInput || !kotaKabupatenInput.trim()) {
        return defaultText;
    }

    let text = kotaKabupatenInput.trim().toLowerCase();
    let provinsi = (provinsiInput || '').trim().toLowerCase();

    if (text.includes('kota ') || text.includes('kabupaten ')) {
        return text.startsWith('pemerintah') ? text.toUpperCase() : `PEMERINTAH ${text}`.toUpperCase();
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
    const dinasDetailText = (appSettings.nama_dinas_pendidikan || "DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA").toUpperCase();
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

    const contentElements = [];
    let currentY = 13; // Start Y position for the first text line's baseline

    // Add elements sequentially, updating currentY after each one
    contentElements.push({ id: 'aksara_dinas_text', type: 'text', content: transliterate(pemdaText), x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' });
    currentY += 22; // Space for next line

    contentElements.push({ id: 'latin_dinas_text', type: 'text', content: pemdaText, x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 });
    currentY += 22;

    contentElements.push({ id: 'aksara_dinas_detail_text', type: 'text', content: transliterate(dinasDetailText), x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' });
    currentY += 22;

    contentElements.push({ id: 'latin_dinas_detail_text', type: 'text', content: dinasDetailText, x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 });
    currentY += 22;

    contentElements.push({ id: 'aksara_sekolah_text', type: 'text', content: transliterate(sekolahText), x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 17, fontFamily: 'Noto Sans Balinese' });
    currentY += 27; // Larger font requires more space

    contentElements.push({ id: 'latin_sekolah_text', type: 'text', content: sekolahText, x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 18 });
    currentY += 22;

    contentElements.push({ id: 'aksara_alamat_telp_text', type: 'text', content: transliterate(alamatTelpText), x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10, fontFamily: 'Noto Sans Balinese' });
    currentY += 18; // Increased from 13 to provide space for Balinese script hangers

    contentElements.push({ id: 'latin_alamat_telp_text', type: 'text', content: alamatTelpText, x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 });
    currentY += 13;

    if (contactLine2) {
        contentElements.push({ id: 'latin_kontak_lainnya_text', type: 'text', content: contactLine2, x: 120, y: currentY, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 });
        currentY += 13; // Add space even after the last element for line calculation
    }
    
    // Add logos with fixed Y, but use their bottom for line calculation
    const logoY = 50;
    const logoHeight = 85;
    contentElements.push(
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: logoY, width: 85, height: logoHeight },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 695, y: logoY, width: 85, height: logoHeight }
    );

    // The line should be below the lowest of the text block or logos
    const textBlockBottom = currentY; // currentY is now the baseline for the *next* element
    const logoBlockBottom = logoY + logoHeight;
    const contentBottomY = Math.max(textBlockBottom, logoBlockBottom);

    const lineBuffer = 5;
    const lineElement = { id: 'line_1', type: 'line', content: '', x: 10, y: contentBottomY + lineBuffer, width: 780, height: 3 };

    return [...contentElements, lineElement];
};

/**
 * Removes the background from a base64 encoded image.
 * Assumes the background color is the color of the top-left pixel.
 * @param {string} base64String The base64 string of the image.
 * @param {number} tolerance A value from 0-255 to determine how close a color must be to the background color to be removed.
 * @returns {Promise<string>} A promise that resolves with the base64 string of the new transparent PNG image.
 */
export function removeImageBackground(base64String, tolerance = 20) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Get the color of the top-left pixel as the background color
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Calculate the "distance" between the current pixel's color and the background color
                const distance = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));

                if (distance <= tolerance) {
                    // Make the pixel transparent
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = (error) => {
            reject(new Error("Gagal memuat gambar untuk diproses. Pastikan file gambar valid."));
        };

        img.src = base64String;
    });
}
