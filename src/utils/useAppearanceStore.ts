import { create } from "zustand";

export type ThemeMode = "light" | "dark";
export type FontSizeScale = "small" | "normal" | "large";

interface AppearanceState {
  theme: ThemeMode;
  fontSize: FontSizeScale;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (fontSize: FontSizeScale) => void;
}

const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem("rkt_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore
  }
  return "light";
};

const getInitialFontSize = (): FontSizeScale => {
  try {
    const saved = localStorage.getItem("rkt_font_size");
    if (saved === "small" || saved === "normal" || saved === "large") return saved;
  } catch {
    // ignore
  }
  return "normal";
};

export const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
  try {
    localStorage.setItem("rkt_theme", theme);
  } catch {
    // ignore
  }
};

export const applyFontSizeToDOM = (fontSize: FontSizeScale) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-font-size", fontSize);
  if (fontSize === "small") {
    root.style.fontSize = "14px";
  } else if (fontSize === "large") {
    root.style.fontSize = "18px";
  } else {
    root.style.fontSize = "16px";
  }
  try {
    localStorage.setItem("rkt_font_size", fontSize);
  } catch {
    // ignore
  }
};

// Apply on initial script evaluation
const initialTheme = getInitialTheme();
const initialFontSize = getInitialFontSize();
if (typeof document !== "undefined") {
  applyThemeToDOM(initialTheme);
  applyFontSizeToDOM(initialFontSize);
}

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  theme: initialTheme,
  fontSize: initialFontSize,

  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },

  setTheme: (theme) => {
    applyThemeToDOM(theme);
    set({ theme });
  },

  setFontSize: (fontSize) => {
    applyFontSizeToDOM(fontSize);
    set({ fontSize });
  },
}));
