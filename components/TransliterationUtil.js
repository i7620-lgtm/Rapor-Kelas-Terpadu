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
const VOWELS = 'aiueoĕ';

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
        
        // Tangani spasi dan tanda baca
        if (part.match(/^(\s|[.,:()?!])$/)) return BALINESE_NUMBERS_PUNCTUATION[part] || part;
        
        // Tangani angka
        if (part.match(/^[0-9]+$/)) {
            return part.split('').map(digit => BALINESE_NUMBERS_PUNCTUATION[digit] || digit).join('');
        }
        
        // Transliterasi kata
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

    let cumulativeShift = 0;
    const dyLatin = 3; // Shift for major latin lines
    const dySmall = 2; // Shift for smaller Latin lines (address/contact)

    return [
        // Logos
        { id: 'logo_dinas_img', type: 'image', content: 'logo_dinas', x: 20, y: 50, width: 85, height: 85 },
        { id: 'logo_sekolah_img', type: 'image', content: 'logo_sekolah', x: 695, y: 50, width: 85, height: 85 },
        
        // Block 1: Pemda
        { id: 'aksara_dinas_text', type: 'text', content: transliterate(pemdaText), x: 120, y: 20 + cumulativeShift, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_text', type: 'text', content: pemdaText, x: 120, y: 39 + cumulativeShift + dyLatin, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        // Cumulative shift increases after each 'latin' line that needs extra spacing
        (() => { cumulativeShift += dyLatin; return null; })(),

        // Block 2: Dinas Detail
        { id: 'aksara_dinas_detail_text', type: 'text', content: transliterate(dinasDetailText), x: 120, y: 59 + cumulativeShift, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 13, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_dinas_detail_text', type: 'text', content: dinasDetailText, x: 120, y: 78 + cumulativeShift + dyLatin, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
        
        (() => { cumulativeShift += dyLatin; return null; })(),
        
        // Block 3: School
        { id: 'aksara_sekolah_text', type: 'text', content: transliterate(sekolahText), x: 120, y: 98 + cumulativeShift, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 17, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_sekolah_text', type: 'text', content: sekolahText, x: 120, y: 121 + cumulativeShift + dyLatin, width: 560, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },

        (() => { cumulativeShift += dyLatin; return null; })(),

        // Block 4: Address & Contact
        { id: 'aksara_alamat_telp_text', type: 'text', content: transliterate(alamatTelpText), x: 120, y: 141 + cumulativeShift, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10, fontFamily: 'Noto Sans Balinese' },
        { id: 'latin_alamat_telp_text', type: 'text', content: alamatTelpText, x: 120, y: 154 + cumulativeShift + dySmall, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        
        (() => { cumulativeShift += dySmall; return null; })(),

        { id: 'latin_kontak_lainnya_text', type: 'text', content: contactLine2, x: 120, y: 167 + cumulativeShift + dySmall, width: 560, textAlign: 'center', fontWeight: 'normal', fontSize: 10 },
        
        (() => { cumulativeShift += dySmall; return null; })(),
        
        // Separator Line
        { id: 'line_1', type: 'line', content: '', x: 10, y: 185 + cumulativeShift, width: 780, height: 3 },
    ].filter(Boolean); // Filter out nulls from the IIFEs
};
