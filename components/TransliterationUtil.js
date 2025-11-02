/**
 * Catatan: Ini adalah mesin transliterasi Latin ke Aksara Bali yang telah dirombak total.
 * Logika baru ini fokus pada pembuatan urutan karakter Unicode yang benar,
 * terutama dalam menangani vokal pre-posed (taleng), gugus konsonan, dan konsonan akhir,
 * untuk menghilangkan semua eror rendering (lingkaran putus-putus dan kotak/tofu).
 * 
 * Versi 3: Menambahkan kamus kata untuk membedakan antara 'e' pepet dan 'e' taleng
 * untuk meningkatkan akurasi secara signifikan pada kata-kata umum dalam Bahasa Indonesia.
 */

const VOWELS = "aiueoĕ";
const CONSONANTS_MAP = {
  h: 'ᬳ', n: 'ᬦ', c: 'ᬘ', r: 'ᬭ', k: 'ᬓ', d: 'ᬤ', t: 'ᬢ', s: 'ᬲ', w: 'ᬯ', l: 'ᬮ',
  m: 'ᬫ', g: 'ᬕ', b: 'ᬩ', p: 'ᬧ', j: 'ᬚ', y: 'ᬬ', ny: 'ᬜ', ng: 'ᬗ',
  // Vocalic consonants
  ṛ: 'ᬋ', // Ra repa
  ḷ: 'ᬍ', // La lenga
};

const INDEPENDENT_VOWELS = { a: 'ᬅ', i: 'ᬇ', u: 'ᬉ', e: 'ᬏ', o: 'ᬑ', ĕ: 'ᬐ' };
const DIACRITICS = {
  i: 'ᬶ', u: 'ᬸ', e: 'ᬾ', o: 'ᭀ', ĕ: 'ᭂ' // pepet
};

const FINALS = { r: 'ᬃ', ng: 'ᬂ', h: 'ᬄ' };
const ADEG_ADEG = '᭄';

// Special gantungan (subjoined forms) that handle pepet
const KERET = 'ᬺ'; // for -rĕ- cluster, e.g., krĕ
const GANTUNGAN_LA_LENGA = 'ᬼ'; // for -lĕ- cluster, e.g., klĕ

const BALINESE_NUMBERS = {
  '0': '᭐', '1': '᭑', '2': '᭒', '3': '᭓', '4': '᭔',
  '5': '᭕', '6': '᭖', '7': '᭗', '8': '᭘', '9': '᭙',
};

// Kamus untuk koreksi 'e' pepet vs 'e' taleng.
const pepetCorrections = {
  // Dari permintaan pengguna
  'pemerintah': 'pĕmĕrintah',
  'pendidikan': 'pĕndidikan',
  'kepemudaan': 'kĕpĕmudaan',
  'sekolah': 'sĕkolah',
  'negeri': 'nĕgĕri',
  'kebo': 'kĕbo',
  // Kata umum untuk akurasi yang lebih baik
  'selamat': 'sĕlamat',
  'belajar': 'bĕlajar',
  'bekerja': 'bĕkĕrja',
  'kesehatan': 'kĕsĕhatan',
  'perlu': 'pĕrlu',
  'semua': 'sĕmua',
  'tersebut': 'tĕrsĕbut',
  'dengan': 'dĕngan',
  'besar': 'bĕsar',
  'cerdas': 'cĕrdas',
  'teman': 'tĕman',
  'kelas': 'kĕlas',
  'kertas': 'kĕrtas',
  'mereka': 'mĕreka', 
  'memerlukan': 'mĕmĕrlukan',
  'memperbaiki': 'mĕmpĕrbaiki',
  'benar': 'bĕnar',
  'delapan': 'dĕlapan',
  'sembilan': 'sĕmbilan',
  'sepuluh': 'sĕpuluh',
  'sebelas': 'sĕbĕlas',
  'kepala': 'kĕpala'
};

function applyPepetCorrections(text) {
  if (!text) return '';
  // Regex untuk mencocokkan kata-kata utuh dari kamus koreksi
  const regex = new RegExp(`\\b(${Object.keys(pepetCorrections).join('|')})\\b`, 'g');
  return text.replace(regex, (match) => pepetCorrections[match]);
}


function isVowel(char) {
  return VOWELS.includes(char);
}

function isAlpha(char) {
  return char >= 'a' && char <= 'z';
}

function getConsonant(str) {
  if (str.startsWith('ny')) return { char: 'ny', len: 2 };
  if (str.startsWith('ng')) return { char: 'ng', len: 2 };
  const c = str[0];
  if (CONSONANTS_MAP[c]) return { char: c, len: 1 };
  return null;
}

export function transliterate(latin) {
  if (!latin) return '';

  // Pra-pemrosesan untuk parsing yang lebih mudah
  let processedLatin = latin.toLowerCase();
  
  // Terapkan koreksi pepet berbasis kamus terlebih dahulu
  processedLatin = applyPepetCorrections(processedLatin);
  
  processedLatin = processedLatin
    .replace(/ē/g, 'e').replace(/ō/g, 'o')
    .replace(/eu/g, 'ĕ').replace(/ê/g, 'ĕ') // Izinkan 'eu' dan 'ê' untuk pepet
    .replace(/rĕ/g, 'ṛ').replace(/lĕ/g, 'ḷ');

  let result = "";
  let i = 0;

  while (i < processedLatin.length) {
    // 1. Tangani karakter non-abjad (angka, tanda baca, spasi)
    if (BALINESE_NUMBERS[processedLatin[i]]) {
      result += BALINESE_NUMBERS[processedLatin[i]];
      i++;
      continue;
    }
    if (!isAlpha(processedLatin[i])) {
      result += processedLatin[i];
      i++;
      continue;
    }

    // 2. Tangani Vokal Mandiri (di awal kata/setelah spasi)
    const prevChar = i > 0 ? processedLatin[i - 1] : ' ';
    if (isVowel(processedLatin[i]) && !isAlpha(prevChar)) {
      result += INDEPENDENT_VOWELS[processedLatin[i]];
      i++;
      continue;
    }

    // 3. Parsing Suku Kata Utama (berbasis Konsonan)
    let consonantCluster = [];
    let vowel = null;
    let finalConsonant = null;
    
    // Parse gugus konsonan (misalnya, 'pr', 'str', 'ny')
    while (i < processedLatin.length && !isVowel(processedLatin[i]) && isAlpha(processedLatin[i])) {
      const c = getConsonant(processedLatin.substring(i));
      if (c) {
        consonantCluster.push(c.char);
        i += c.len;
      } else { // Penanganan untuk konsonan yang tidak dikenal
        i++;
      }
    }
    
    // Parse vokal
    if (i < processedLatin.length && isVowel(processedLatin[i])) {
      vowel = processedLatin[i];
      i++;
    }
    
    // Parse konsonan akhir potensial (r, h, ng)
    const afterVowelPos = i;
    let finalCand = null, finalLen = 0;
    
    if (processedLatin.substring(afterVowelPos, afterVowelPos + 2) === 'ng') {
        finalCand = 'ng'; finalLen = 2;
    } else if (FINALS[processedLatin[afterVowelPos]]) {
        finalCand = processedLatin[afterVowelPos]; finalLen = 1;
    }

    if (finalCand) {
      const afterFinal = processedLatin[afterVowelPos + finalLen];
      if (afterFinal === undefined || !isAlpha(afterFinal) || isVowel(afterFinal)) {
        finalConsonant = finalCand;
        i += finalLen;
      }
    }

    // 4. Render suku kata yang telah di-parse
    if (consonantCluster.length > 0) {
      let syllableString = '';
      
      // KASUS KHUSUS: Tangani pepet (ĕ) dengan gugus konsonan -r- dan -l-
      // Ini menghindari kombinasi terlarang cakra/gantungan + pepet.
      if (vowel === 'ĕ' && consonantCluster.length > 1) {
          const lastConsonant = consonantCluster[consonantCluster.length - 1];

          if (lastConsonant === 'r') {
              // Bangun suku kata dengan keret untuk gugus -rĕ
              for (let j = 0; j < consonantCluster.length - 1; j++) {
                  syllableString += CONSONANTS_MAP[consonantCluster[j]];
                  if (j < consonantCluster.length - 2) {
                      syllableString += ADEG_ADEG;
                  }
              }
              syllableString += KERET; // Lampirkan keret (gantungan ra repa)

              if (finalConsonant) {
                  syllableString += FINALS[finalConsonant];
              }
              result += syllableString;
              continue; // Suku kata selesai, lanjut ke berikutnya
          }
          
          if (lastConsonant === 'l') {
              // Bangun suku kata dengan gantungan la lenga untuk gugus -lĕ
              for (let j = 0; j < consonantCluster.length - 1; j++) {
                  syllableString += CONSONANTS_MAP[consonantCluster[j]];
                  if (j < consonantCluster.length - 2) {
                      syllableString += ADEG_ADEG;
                  }
              }
              syllableString += GANTUNGAN_LA_LENGA;

              if (finalConsonant) {
                  syllableString += FINALS[finalConsonant];
              }
              result += syllableString;
              continue; // Suku kata selesai, lanjut ke berikutnya
          }
      }

      // LOGIKA RENDER REGULER
      for (let j = 0; j < consonantCluster.length; j++) {
        const isLastConsonantOfCluster = (j === consonantCluster.length - 1);
        syllableString += CONSONANTS_MAP[consonantCluster[j]];

        if (isLastConsonantOfCluster) {
          // Konsonan terakhir mendapat diakritik vokal
          if (vowel && vowel !== 'a') {
            syllableString += DIACRITICS[vowel];
          }
        } else {
          // Konsonan dalam gugus mendapat adeg-adeg
          syllableString += ADEG_ADEG;
        }
      }
      
      // Tambahkan karakter konsonan akhir jika ada
      if (finalConsonant) {
        syllableString += FINALS[finalConsonant];
      }
      // Jika tidak ada vokal dan tidak ada konsonan akhir, itu adalah konsonan akhir kata yang membutuhkan adeg-adeg
      else if (!vowel) {
        syllableString += ADEG_ADEG;
      }

      result += syllableString;
    }
  }

  // Pembersihan akhir: hapus adeg-adeg di akhir atau sebelum spasi.
  result = result.replace(new RegExp(`${ADEG_ADEG}(?=\\s|$)`, 'g'), '');
  
  return result;
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

    // Jika pengguna sudah menentukan tipe, tambahkan "PEMERINTAH" jika belum ada.
    if (text.includes('kota ') || text.includes('kabupaten ')) {
        if (text.startsWith('pemerintah')) {
            return text.toUpperCase();
        }
        return `PEMERINTAH ${text}`.toUpperCase();
    }
    
    // Terapkan logika khusus Bali hanya jika provinsi adalah Bali atau tidak ditentukan
    if (provinsi === 'bali' || provinsi === '') {
        if (BALI_CITIES_REGECIES.KOTA.includes(text)) {
            return `PEMERINTAH KOTA ${kotaKabupatenInput}`.toUpperCase();
        }
    
        if (BALI_CITIES_REGECIES.KABUPATEN.includes(text)) {
            return `PEMERINTAH KABUPATEN ${kotaKabupatenInput}`.toUpperCase();
        }
    }

    // Penanganan untuk provinsi lain atau nama yang tidak cocok
    return `PEMERINTAH KABUPATEN ${kotaKabupatenInput}`.toUpperCase();
}

export function expandAndCapitalizeSchoolName(name) {
    if (!name || !name.trim()) return '';
    let processedName = name.trim().toLowerCase();
    
    // Ganti "sdn" atau "sd n" dengan "sekolah dasar negeri" terlebih dahulu
    processedName = processedName.replace(/\b(sdn|sd n)\b/g, 'sekolah dasar negeri');
    
    // Kemudian ganti "sd" yang berdiri sendiri dengan "sekolah dasar"
    processedName = processedName.replace(/\bsd\b/g, 'sekolah dasar');

    return processedName.toUpperCase();
}
