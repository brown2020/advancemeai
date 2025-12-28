"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { STORAGE_KEYS, THEMES } from "@/constants/appConstants";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type ThemePreference =
  | typeof THEMES.SYSTEM
  | typeof THEMES.LIGHT
  | typeof THEMES.DARK;

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  const html = document.documentElement;

  if (theme === THEMES.SYSTEM) {
    html.removeAttribute("data-theme");
    return;
  }

  html.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemePreference>(
    STORAGE_KEYS.THEME,
    THEMES.SYSTEM
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}


