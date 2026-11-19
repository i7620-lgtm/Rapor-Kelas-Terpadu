const TARGET_FONT_FAMILIES = new Set([
  'tinos',
  'pinyon script',
  'great vibes',
  'alex brush',
  'dancing script',
  'noto sans balinese',
  'inter',
]);

let cachedFontEmbedCSS: string | null = null;
let inFlightFontPromise: Promise<string> | null = null;
const fetchedFontDataUrlCache = new Map<string, string>();

export async function waitForDocumentFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return;
  }
  try {
    await document.fonts.ready;
  } catch {
    // Ignore font readiness errors on constrained environments
  }
}

function normalizeFontFamilyName(raw: string): string {
  return raw.replace(/['"]/g, '').trim().toLowerCase();
}

function detectFontFormat(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  if (cleanUrl.endsWith('.woff2') || url.startsWith('data:font/woff2')) return 'woff2';
  if (cleanUrl.endsWith('.woff') || url.startsWith('data:font/woff')) return 'woff';
  if (cleanUrl.endsWith('.ttf') || url.startsWith('data:font/ttf')) return 'truetype';
  if (cleanUrl.endsWith('.otf') || url.startsWith('data:font/otf')) return 'opentype';
  return 'woff2';
}

async function fetchFontAsDataUrl(resolvedUrl: string): Promise<string | null> {
  if (resolvedUrl.startsWith('data:')) {
    return resolvedUrl;
  }

  const cached = fetchedFontDataUrlCache.get(resolvedUrl);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    if (dataUrl) {
      fetchedFontDataUrlCache.set(resolvedUrl, dataUrl);
      return dataUrl;
    }
    return null;
  } catch {
    return null;
  }
}

function extractUrlCandidates(srcValue: string): string[] {
  const candidates: string[] = [];
  const urlRegex = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(srcValue)) !== null) {
    if (match[2]) {
      candidates.push(match[2].trim());
    }
  }
  return candidates;
}

function pickPreferredFontUrl(candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  const woff2 = candidates.find((u) => /\.woff2(?:$|[?#])/i.test(u) || u.startsWith('data:font/woff2'));
  if (woff2) return woff2;
  const woff = candidates.find((u) => /\.woff(?:$|[?#])/i.test(u) || u.startsWith('data:font/woff'));
  if (woff) return woff;
  return candidates[0];
}

async function inlineSingleFontFaceRule(ruleCssText: string, baseHref: string): Promise<string | null> {
  const familyMatch = /font-family\s*:\s*([^;]+);/i.exec(ruleCssText);
  if (familyMatch) {
    const family = normalizeFontFamilyName(familyMatch[1]);
    if (!TARGET_FONT_FAMILIES.has(family)) {
      return null;
    }
  }

  const srcMatch = /src\s*:\s*([^;]+);/i.exec(ruleCssText);
  if (!srcMatch) {
    return null;
  }

  const candidates = extractUrlCandidates(srcMatch[1]);
  const chosenUrl = pickPreferredFontUrl(candidates);
  if (!chosenUrl) {
    return null;
  }

  let absoluteUrl = chosenUrl;
  try {
    absoluteUrl = new URL(chosenUrl, baseHref).href;
  } catch {
    return null;
  }

  const dataUrl = await fetchFontAsDataUrl(absoluteUrl);
  if (!dataUrl) {
    return null;
  }

  const format = detectFontFormat(chosenUrl);
  const replacementSrc = `src: url("${dataUrl}") format("${format}");`;
  return ruleCssText.replace(srcMatch[0], replacementSrc);
}

interface ExtractedRuleCandidate {
  cssText: string;
  baseHref: string;
}

async function collectFontFaceRulesFromDocument(): Promise<ExtractedRuleCandidate[]> {
  if (typeof document === 'undefined') return [];

  const collected: ExtractedRuleCandidate[] = [];
  const fallbackStylesheetUrls: string[] = [];
  const docHref = typeof window !== 'undefined' ? window.location.href : '';

  for (const sheet of Array.from(document.styleSheets)) {
    const baseHref = sheet.href || docHref;
    try {
      const rules = sheet.cssRules;
      for (const rule of Array.from(rules)) {
        if (rule.type === CSSRule.FONT_FACE_RULE || /^@font-face\b/i.test(rule.cssText)) {
          collected.push({ cssText: rule.cssText, baseHref });
        }
      }
    } catch {
      if (sheet.href && (!docHref || sheet.href.startsWith(window.location.origin))) {
        fallbackStylesheetUrls.push(sheet.href);
      }
    }
  }

  if (fallbackStylesheetUrls.length > 0) {
    const fetchedSheets = await Promise.all(
      fallbackStylesheetUrls.map(async (href) => {
        try {
          const res = await fetch(href);
          if (!res.ok) return [];
          const text = await res.text();
          const matches = text.match(/@font-face\s*\{[^}]+\}/gi) || [];
          return matches.map((cssText) => ({ cssText, baseHref: href }));
        } catch {
          return [];
        }
      })
    );
    fetchedSheets.forEach((items) => collected.push(...items));
  }

  return collected;
}

export async function getFontEmbedCSS(): Promise<string> {
  await waitForDocumentFontsReady();

  if (cachedFontEmbedCSS !== null) {
    return cachedFontEmbedCSS;
  }

  if (inFlightFontPromise) {
    return inFlightFontPromise;
  }

  inFlightFontPromise = (async () => {
    try {
      const candidates = await collectFontFaceRulesFromDocument();
      const inlinedRules = await Promise.all(
        candidates.map((item) => inlineSingleFontFaceRule(item.cssText, item.baseHref))
      );
      const uniqueRules = [...new Set(inlinedRules.filter((rule): rule is string => Boolean(rule)))];
      const combined = uniqueRules.join('\n');
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
