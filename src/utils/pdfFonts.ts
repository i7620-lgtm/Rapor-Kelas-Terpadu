const FONT_CSS_URLS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Balinese&display=swap',
  'https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pinyon+Script&family=Alex+Brush&family=Dancing+Script:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
];

let cachedFontEmbedCSS: string | null = null;
let inFlightFontPromise: Promise<string> | null = null;

async function fetchSingleFontDataUrl(fontUrl: string): Promise<[string, string] | null> {
  try {
    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    const fontBlob = await fontRes.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(fontBlob);
    });
    return base64 ? [fontUrl, base64] : null;
  } catch {
    return null;
  }
}

async function fetchAndInlineFontStylesheet(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    let text = await res.text();
    const urlRegex = /url\(([^)]+)\)/g;
    const fontMatches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(text)) !== null) {
      fontMatches.push(match[1].replace(/['"]/g, ''));
    }
    const uniqueFontUrls = [...new Set(fontMatches)];
    const replacements = await Promise.all(uniqueFontUrls.map(fetchSingleFontDataUrl));

    for (const pair of replacements) {
      if (pair) {
        text = text.split(pair[0]).join(pair[1]);
      }
    }
    return text;
  } catch {
    return '';
  }
}

export async function getFontEmbedCSS(): Promise<string> {
  if (cachedFontEmbedCSS !== null) {
    return cachedFontEmbedCSS;
  }

  if (inFlightFontPromise) {
    return inFlightFontPromise;
  }

  inFlightFontPromise = (async () => {
    try {
      const chunks = await Promise.all(FONT_CSS_URLS.map(fetchAndInlineFontStylesheet));
      const combined = chunks.filter(Boolean).join('\n');
      if (combined) {
        cachedFontEmbedCSS = combined;
      }
      return combined;
    } finally {
      inFlightFontPromise = null;
    }
  })();

  return inFlightFontPromise;
}
