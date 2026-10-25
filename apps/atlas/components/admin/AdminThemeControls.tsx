"use client";

import { useTheme } from "../ThemeProvider";

function SunIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
}

function MoonIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.9 13.05A9 9 0 0 1 10.95 3.1 9 9 0 1 0 20.9 13.05Z" /></svg>;
}

export function AdminThemeControls() {
  const { theme, setTheme } = useTheme();

  return (
    <div aria-label="Appearance" className="admin-theme-controls" role="group">
      <button aria-label="Light theme" aria-pressed={theme === "light"} onClick={() => setTheme("light")} type="button"><SunIcon /></button>
      <button aria-label="Dark theme" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} type="button"><MoonIcon /></button>
    </div>
  );
}
