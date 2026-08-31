"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSelector({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return <div aria-label="Theme" className={`theme-selector ${className}`.trim()} role="group">
    <span>Theme</span>
    <button aria-pressed={theme === "light"} className={theme === "light" ? "theme-active" : undefined} onClick={() => setTheme("light")} type="button">Light</button>
    <button aria-pressed={theme === "dark"} className={theme === "dark" ? "theme-active" : undefined} onClick={() => setTheme("dark")} type="button">Dark</button>
  </div>;
}
