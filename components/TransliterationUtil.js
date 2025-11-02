/**
 * Catatan: Ini adalah mesin transliterasi Latin ke Aksara Bali yang telah dirombak total.
 * Logika baru ini fokus pada pembuatan urutan karakter Unicode yang benar,
 * terutama dalam menangani vokal pre-posed (taleng), gugus konsonan, dan konsonan akhir,
 * untuk menghilangkan semua eror rendering (lingkaran putus-putus dan kotak/tofu).
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
  i: 'ᬶ', u: 'ᬸ', e: 'ᬾ', o: 'ᭀ', ĕ: 'ᭂ'
};

const FINALS = { r: 'ᬃ', ng: 'ᬂ', h: 'ᬄ' };
const ADEG_ADEG = '᭄';
const BALINESE_NUMBERS = {
  '0': '᭐', '1': '᭑', '2': '᭒', '3': '᭓', '4': '᭔',
  '5': '᭕', '6': '᭖', '7': '᭗', '8': '᭘', '9': '᭙',
};

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

  // Pre-processing for easier parsing
  latin = latin.toLowerCase()
    .replace(/ē/g, 'e').replace(/ō/g, 'o').replace(/eu/g, 'ĕ')
    .replace(/rĕ/g, 'ṛ').replace(/lĕ/g, 'ḷ');

  let result = "";
  let i = 0;

  while (i < latin.length) {
    // 1. Handle non-alphabetic characters (numbers, punctuation, spaces)
    if (BALINESE_NUMBERS[latin[i]]) {
      result += BALINESE_NUMBERS[latin[i]];
      i++;
      continue;
    }
    if (!isAlpha(latin[i])) {
      result += latin[i];
      i++;
      continue;
    }

    // 2. Handle Independent Vowels (at the start of a word/after a space)
    const prevChar = i > 0 ? latin[i - 1] : ' ';
    if (isVowel(latin[i]) && !isAlpha(prevChar)) {
      result += INDEPENDENT_VOWELS[latin[i]];
      i++;
      continue;
    }

    // 3. Main Syllable Parsing (Consonant-based)
    let consonantCluster = [];
    let vowel = null;
    let finalConsonant = null;
    
    // Parse the consonant cluster (e.g., 'pr', 'str', 'ny')
    while (i < latin.length && !isVowel(latin[i]) && isAlpha(latin[i])) {
      const c = getConsonant(latin.substring(i));
      if (c) {
        consonantCluster.push(c.char);
        i += c.len;
      } else { // Failsafe for unknown consonants
        i++;
      }
    }
    
    // Parse the vowel
    if (i < latin.length && isVowel(latin[i])) {
      vowel = latin[i];
      i++;
    }
    
    // Parse a potential final consonant (r, h, ng)
    const afterVowelPos = i;
    let finalCand = null, finalLen = 0;
    
    if (latin.substring(afterVowelPos, afterVowelPos + 2) === 'ng') {
        finalCand = 'ng'; finalLen = 2;
    } else if (FINALS[latin[afterVowelPos]]) {
        finalCand = latin[afterVowelPos]; finalLen = 1;
    }

    if (finalCand) {
      const afterFinal = latin[afterVowelPos + finalLen];
      if (afterFinal === undefined || !isAlpha(afterFinal) || isVowel(afterFinal)) {
        finalConsonant = finalCand;
        i += finalLen;
      }
    }

    // 4. Render the parsed syllable
    if (consonantCluster.length > 0) {
      let syllableString = '';
      for (let j = 0; j < consonantCluster.length; j++) {
        const isLastConsonantOfCluster = (j === consonantCluster.length - 1);
        syllableString += CONSONANTS_MAP[consonantCluster[j]];

        if (isLastConsonantOfCluster) {
          // The last consonant gets the vowel diacritic
          if (vowel && vowel !== 'a') {
            syllableString += DIACRITICS[vowel];
          }
        } else {
          // Consonants in a cluster get an adeg-adeg
          syllableString += ADEG_ADEG;
        }
      }
      
      // Add the final consonant character if it exists
      if (finalConsonant) {
        syllableString += FINALS[finalConsonant];
      }
      // If there's no vowel and no final, it's a word-final consonant that needs adeg-adeg
      else if (!vowel) {
        syllableString += ADEG_ADEG;
      }

      result += syllableString;
    }
  }

  // Final cleanup: remove any trailing adeg-adeg or adeg-adeg before a space.
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

    // If user already specified the type, just add "PEMERINTAH" if missing.
    if (text.includes('kota ') || text.includes('kabupaten ')) {
        if (text.startsWith('pemerintah')) {
            return text.toUpperCase();
        }
        return `PEMERINTAH ${text}`.toUpperCase();
    }
    
    // Apply Bali-specific logic only if province is Bali or not specified
    if (provinsi === 'bali' || provinsi === '') {
        if (BALI_CITIES_REGECIES.KOTA.includes(text)) {
            return `PEMERINTAH KOTA ${kotaKabupatenInput}`.toUpperCase();
        }
    
        if (BALI_CITIES_REGECIES.KABUPATEN.includes(text)) {
            return `PEMERINTAH KABUPATEN ${kotaKabupatenInput}`.toUpperCase();
        }
    }

    // Fallback for other provinces or non-matching names
    return `PEMERINTAH ${kotaKabupatenInput}`.toUpperCase();
}
