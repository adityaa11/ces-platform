"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";
type ThemeContextValue = { theme: ThemePreference; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextValue>({ theme: "system", setTheme: () => {} });

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<ThemePreference>(initialTheme ?? "system");

  useEffect(() => {
    const stored = window.localStorage.getItem("atlas-theme");
    if (stored !== "light" && stored !== "dark") return;
    const update = window.setTimeout(() => setTheme(stored), 0);
    return () => window.clearTimeout(update);
  }, []);

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("atlas-theme", theme);
    document.cookie = `atlas-theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
