"use client";

import { useEffect, useRef, type ReactNode } from "react";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => returnFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) { event.preventDefault(); panelRef.current?.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-modal="true" aria-labelledby="dialog-title" className="dialog-panel" ref={panelRef} role="dialog" tabIndex={-1}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">×</button></div>{children}</section></div>;
}
