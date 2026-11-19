const FONT_STACK_MAP: Record<string, string> = {
  Tinos: "'Tinos', 'Times New Roman', Times, serif",
  'Times New Roman': "'Tinos', 'Times New Roman', Times, serif",
  'Pinyon Script': "'Pinyon Script', 'Great Vibes', cursive",
  'Great Vibes': "'Great Vibes', 'Pinyon Script', cursive",
  'Alex Brush': "'Alex Brush', 'Pinyon Script', cursive",
  'Dancing Script': "'Dancing Script', 'Pinyon Script', cursive",
  'Noto Sans Balinese': "'Noto Sans Balinese', sans-serif",
  'system-ui': "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
};

export const DEFAULT_PIAGAM_SERIF_STACK = FONT_STACK_MAP.Tinos;
export const DEFAULT_PIAGAM_SCRIPT_STACK = FONT_STACK_MAP['Pinyon Script'];

/**
 * Resolves a canonical font name stored in piagam/kop layouts into a resilient
 * CSS font-family stack so SVG <text> and canvas measurement never silently fall
 * back to Android/system sans-serif.
 */
export function resolvePiagamFontFamily(fontFamily?: string, elementId?: string): string {
  const id = (elementId || '').toLowerCase();
  if (fontFamily === 'Noto Sans Balinese' || id.includes('aksara_')) {
    return FONT_STACK_MAP['Noto Sans Balinese'];
  }

  if (fontFamily && FONT_STACK_MAP[fontFamily]) {
    return FONT_STACK_MAP[fontFamily];
  }

  if (fontFamily && fontFamily.trim().length > 0) {
    const trimmed = fontFamily.trim();
    if (trimmed.includes(',')) {
      return trimmed;
    }
    return `'${trimmed}', ${DEFAULT_PIAGAM_SERIF_STACK}`;
  }

  if (id === 'student_name') {
    return DEFAULT_PIAGAM_SCRIPT_STACK;
  }

  return DEFAULT_PIAGAM_SERIF_STACK;
}
