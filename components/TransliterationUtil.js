/**
 * Catatan: Ini adalah mesin transliterasi Latin ke Aksara Bali yang telah dirombak.
 * Logika baru ini menerapkan pendekatan hibrida:
 * 1. Menggunakan kamus 'officialPhrases' untuk menjamin akurasi 100% pada teks statis
 *    dan resmi seperti pada kop surat, berdasarkan input dari pengguna.
 * 2. Menggunakan algoritma transliterasi yang disempurnakan untuk teks dinamis lainnya,
 *    dengan penanganan vokal pre-posed (taleng), gugus konsonan, dan konsonan akhir yang lebih baik.
 */

// Kamus untuk frasa resmi dengan transliterasi yang sudah dipastikan benar.
const officialPhrases = {
  'pemerintah kota denpasar': 'ᬧᬫᬾᬃᬦ᭄ᬢᬄᬓᭀᬢᬤᬾᬦ᭄ᬧᬲᬃ',
  'dinas pendidikan kepemudaan dan olahraga kota denpasar': 'ᬤᬶᬦᬲ᭄ᬧᭂᬦ᭄ᬤᬶᬤᬶᬓᬦ᭄ᬓᭂᬧᭂᬫᬸᬤᬵᬦ᭄ᬤᬦᭀᬮᬄᬭᬕᬓᭀᬢᬤᬾᬦ᭄ᬧᬲᬃ',
  'sekolah dasar negeri 2 padangsambian': 'ᬲᭂᬓᭀᬮᬄᬤᬲᬃᬦᭂᬕᭂᬭᬶ᭒ᬧᬤᬂᬲᬫ᭄ᬩ᭄ᬬᬦ᭄',
  'jalan kebo iwa banjar batuparas, telepon: (0361) 9093558': 'ᬚᬮᬦ᭄ᬓᭂᬩᭀᬇᬯᬩᬜ᭄ᬚᬃᬩᬢᬸᬧᬭᬲ᭄᭞ ᬢᬾᬮᬾᬧᭀᬦ᭄᭞ ₍᭐᭓᭖᭑₎ ᭙᭐᭙᭓᭕᭕᭘'
};

const VOWELS = "aiueoĕ";
const CONSONANTS_MAP = {
  h: 'ᬳ', n: 'ᬦ', c: 'ᬘ', r: 'ᬭ', k: 'ᬓ', d: 'ᬤ', t: 'ᬢ', s: 'ᬲ', w: 'ᬯ', l: 'ᬮ',
  m: 'ᬫ', g: 'ᬕ', b: 'ᬩ', p: 'ᬧ', j: 'ᬚ', y: 'ᬬ', ny: 'ᬜ', ng: 'ᬗ',
  // Konsonan tambahan dari Aksara Swalalita & Wreastra
  kh: 'ᬔ', gh: 'ᬖ', th: 'ᬣ', dh: 'ᬥ', sy: 'ᬰ'
};

const INDEPENDENT_VOWELS = { a: 'ᬅ', i: 'ᬇ', u: 'ᬉ', e: 'ᬏ', o: 'ᬑ', ĕ: 'ᬐ' };
const DIACRITICS = {
  i: 'ᬶ', u: 'ᬸ', e: 'ᬾ', o: 'ᭀ', ĕ: 'ᭂ' // pepet
};

const FINALS = { r: 'ᬃ', ng: 'ᬂ', h: 'ᬄ' };
const ADEG_ADEG = '᭄';

const KERET = 'ᬺ'; // untuk -rĕ-
const GANTUNGAN_LA_LENGA = 'ᬼ'; // untuk -lĕ-

const BALINESE_NUMBERS = {
  '0': '᭐', '1': '᭑', '2': '᭒', '3': '᭓', '4': '᭔',
  '5': '᭕', '6': '᭖', '7': '᭗', '8': '᭘', '9': '᭙',
};

// Kamus untuk koreksi 'e' pepet vs 'e' taleng.
const pepetCorrections = {
  'pemerintah': 'pĕmĕrintah', 'pendidikan': 'pĕndidikan', 'kepemudaan': 'kĕpĕmudaan',
  'sekolah': 'sĕkolah', 'negeri': 'nĕgĕri', 'kebo': 'kĕbo', 'selamat': 'sĕlamat',
  'belajar': 'bĕlajar', 'bekerja': 'bĕkĕrja', 'kesehatan': 'kĕsĕhatan',
  'perlu': 'pĕrlu', 'semua': 'sĕmua', 'tersebut': 'tĕrsĕbut', 'dengan': 'dĕngan',
  'besar': 'bĕsar', 'cerdas': 'cĕrdas', 'teman': 'tĕman', 'kelas': 'kĕlas',
  'kertas': 'kĕrtas', 'mereka': 'mĕreka', 'memerlukan': 'mĕmĕrlukan',
  'memperbaiki': 'mĕmpĕrbaiki', 'benar': 'bĕnar', 'delapan': 'dĕlapan',
  'sembilan': 'sĕmbilan', 'sepuluh': 'sĕpuluh', 'sebelas': 'sĕbĕlas', 'kepala': 'kĕpala'
};

function applyPepetCorrections(text) {
  if (!text) return '';
  const regex = new RegExp(`\\b(${Object.keys(pepetCorrections).join('|')})\\b`, 'gi');
  return text.replace(regex, (match) => pepetCorrections[match.toLowerCase()]);
}

function isVowel(char) { return VOWELS.includes(char); }
function isAlpha(char) { return (char >= 'a' && char <= 'z'); }

function getConsonant(str) {
  if (str.startsWith('ny')) return { char: 'ny', len: 2 };
  if (str.startsWith('ng')) return { char: 'ng', len: 2 };
  if (str.startsWith('kh')) return { char: 'kh', len: 2 };
  if (str.startsWith('gh')) return { char: 'gh', len: 2 };
  if (str.startsWith('th')) return { char: 'th', len: 2 };
  if (str.startsWith('dh')) return { char: 'dh', len: 2 };
  if (str.startsWith('sy')) return { char: 'sy', len: 2 };
  const c = str[0];
  if (CONSONANTS_MAP[c]) return { char: c, len: 1 };
  return null;
}

export function transliterate(latin) {
  if (!latin) return '';
  const lowerLatin = latin.trim().toLowerCase();

  // Langkah 1: Periksa kamus frasa resmi terlebih dahulu untuk akurasi 100%.
  if (officialPhrases[lowerLatin]) {
    return officialPhrases[lowerLatin];
  }

  let processedLatin = applyPepetCorrections(lowerLatin);
  processedLatin = processedLatin.replace(/rĕ/g, 'ṛ').replace(/lĕ/g, 'ḷ');

  let result = "";
  let i = 0;

  while (i < processedLatin.length) {
    // Tangani karakter non-abjad
    if (BALINESE_NUMBERS[processedLatin[i]]) { result += BALINESE_NUMBERS[processedLatin[i]]; i++; continue; }
    if (processedLatin[i] === '(') { result += '₍'; i++; continue; }
    if (processedLatin[i] === ')') { result += '₎'; i++; continue; }
    if (processedLatin[i] === ',') { result += '᭞'; i++; continue; }
    if (processedLatin[i] === '.') { result += '᭟'; i++; continue; }
    if (!isAlpha(processedLatin[i])) { result += processedLatin[i]; i++; continue; }

    const prevChar = i > 0 ? processedLatin[i - 1] : ' ';
    if (isVowel(processedLatin[i]) && !isAlpha(prevChar)) {
      result += INDEPENDENT_VOWELS[processedLatin[i]];
      i++;
      continue;
    }

    let consonantCluster = [];
    while (i < processedLatin.length && !isVowel(processedLatin[i]) && isAlpha(processedLatin[i])) {
      const c = getConsonant(processedLatin.substring(i));
      if (c) { consonantCluster.push(c.char); i += c.len; } else { i++; }
    }

    let vowel = null;
    if (i < processedLatin.length && isVowel(processedLatin[i])) { vowel = processedLatin[i]; i++; }

    let finalConsonant = null;
    const afterVowelPos = i;
    if (processedLatin.substring(afterVowelPos, afterVowelPos + 2) === 'ng') finalConsonant = 'ng';
    else if (FINALS[processedLatin[afterVowelPos]]) finalConsonant = processedLatin[afterVowelPos];

    if (finalConsonant) {
      const afterFinal = processedLatin[afterVowelPos + finalConsonant.length];
      if (afterFinal === undefined || !isAlpha(afterFinal) || isVowel(afterFinal)) { i += finalConsonant.length; } 
      else { finalConsonant = null; }
    }

    if (consonantCluster.length > 0) {
      let preVowelDiacritic = '';
      let mainClusterString = '';
      let postVowelDiacritic = '';
      
      if (vowel === 'e' || vowel === 'o') preVowelDiacritic = DIACRITICS['e'];
      if (vowel === 'i') postVowelDiacritic = DIACRITICS['i'];
      if (vowel === 'u') postVowelDiacritic = DIACRITICS['u'];
      if (vowel === 'ĕ') postVowelDiacritic = DIACRITICS['ĕ'];
      if (vowel === 'o') postVowelDiacritic += DIACRITICS['o'];

      for (let j = 0; j < consonantCluster.length; j++) {
        mainClusterString += CONSONANTS_MAP[consonantCluster[j]];
        if (j < consonantCluster.length - 1) mainClusterString += ADEG_ADEG;
      }

      result += preVowelDiacritic + mainClusterString + postVowelDiacritic;

      if (finalConsonant) result += FINALS[finalConsonant];
      else if (!vowel) result += ADEG_ADEG;
    }
  }
  return result.replace(new RegExp(`${ADEG_ADEG}(?=\\s|$)`, 'g'), '');
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
    
    const alamatText = appSettings.alamat_sekolah || "Kebo Iwa Banjar Batuparas";

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
