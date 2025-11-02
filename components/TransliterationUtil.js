/**
 * Catatan: Ini adalah mesin transliterasi Latin ke Aksara Bali yang disederhanakan.
 * Mesin ini menangani kasus-kasus umum tetapi mungkin tidak sempurna untuk semua
 * aturan ejaan Bali yang kompleks. Ini adalah solusi offline yang cepat sebagai
 * alternatif dari layanan online.
 */

const VOWELS = "aiueoĕ";
const CONSONANTS = {
  h: 'ᬳ', n: 'ᬦ', c: 'ᬘ', r: 'ᬭ', k: 'ᬓ', d: 'ᬤ', t: 'ᬢ', s: 'ᬲ', w: 'ᬯ', l: 'ᬮ',
  m: 'ᬫ', g: 'ᬕ', b: 'ᬩ', p: 'ᬧ', j: 'ᬚ', y: 'ᬬ', ny: 'ᬜ', ng: 'ᬗ',
};

const INDEPENDENT_VOWELS = { a: 'ᬅ', i: 'ᬇ', u: 'ᬉ', e: 'ᬏ', o: 'ᬑ' };
const DIACRITICS = { i: 'ᬶ', u: 'ᬸ', e: 'ᬾ', o: 'ᭀ', 'ĕ': 'ᭂ' };
const FINALS = { r: 'ᬃ', ng: 'ᬂ', h: 'ᬄ' };
const ADEG_ADEG = '᭄';

function isVowel(char) {
  if (!char) return false;
  return VOWELS.includes(char);
}

export function transliterate(latin) {
  let result = '';
  latin = latin.toLowerCase().replace(/ē/g, 'e').replace(/ō/g, 'o').replace(/eu/g, 'ĕ');

  let i = 0;
  while (i < latin.length) {
    let char = latin[i];

    // Handle independent vowels at the start of a word
    if (isVowel(char) && (i === 0 || latin[i - 1] === ' ')) {
      result += INDEPENDENT_VOWELS[char] || char;
      i++;
      continue;
    }

    // Handle consonant digraphs 'ny' and 'ng', and single consonants
    let consonant = null;
    let consonantLength = 0;
    if (i + 1 < latin.length && CONSONANTS[latin.substring(i, i + 2)]) {
      consonant = latin.substring(i, i + 2);
      consonantLength = 2;
    } else if (CONSONANTS[char]) {
      consonant = char;
      consonantLength = 1;
    }

    if (consonant) {
      let baseConsonant = CONSONANTS[consonant];
      let vowelPos = i + consonantLength;

      if (vowelPos < latin.length && isVowel(latin[vowelPos])) {
        // Consonant followed by a vowel
        let vowel = latin[vowelPos];
        if (vowel === 'a') {
          result += baseConsonant;
        } else if (vowel === 'e') {
          // Taleng goes before the consonant
          result += DIACRITICS.e + baseConsonant;
        } else {
          result += baseConsonant + DIACRITICS[vowel];
        }
        i = vowelPos + 1;
      } else {
        // Consonant not followed by a vowel (part of a cluster or at the end)
        result += baseConsonant + ADEG_ADEG;
        i += consonantLength;
      }
    } else {
      // Not a vowel or consonant, pass through (e.g., space, punctuation)
      result += char;
      i++;
    }
  }

  // Post-processing to handle final consonants and gantungan (subjoined forms)
  // 1. Convert adeg-adeg + consonant into gantungan
  for (const c in CONSONANTS) {
      if (c.length > 0) {
        const gantungan = ADEG_ADEG + CONSONANTS[c];
        const adegPlusConsonant = ADEG_ADEG + CONSONANTS[c] + ADEG_ADEG;
        // This is a simplified approach to gantungan
        result = result.replace(new RegExp(adegPlusConsonant, 'g'), gantungan);
      }
  }

  // 2. Handle final -r, -ng, -h
  result = result.replace(new RegExp(`${CONSONANTS.r}${ADEG_ADEG}(?=\\s|$)`, 'g'), FINALS.r);
  result = result.replace(new RegExp(`${CONSONANTS.ng}${ADEG_ADEG}(?=\\s|$)`, 'g'), FINALS.ng);
  result = result.replace(new RegExp(`${CONSONANTS.h}${ADEG_ADEG}(?=\\s|$)`, 'g'), FINALS.h);

  return result;
}
