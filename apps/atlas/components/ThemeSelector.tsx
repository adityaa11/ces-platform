"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function storedTheme(): Theme {
  return typeof window !== "undefined" && window.localStorage.getItem("atlas-theme") === "light" ? "light" : "dark";
}

export function ThemeSelector({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  return <div aria-label="Theme" className={`theme-selector ${className}`.trim()} role="group">
    <span>Theme</span>
    <button aria-pressed={theme === "light"} className={theme === "light" ? "theme-active" : undefined} onClick={() => setTheme("light")} type="button">Light</button>
    <button aria-pressed={theme === "dark"} className={theme === "dark" ? "theme-active" : undefined} onClick={() => setTheme("dark")} type="button">Dark</button>
  </div>;
}
