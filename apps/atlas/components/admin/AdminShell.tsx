"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../Avatar";
import { AdminThemeControls } from "./AdminThemeControls";

type AdminShellProps = {
  name: string;
  children: ReactNode;
};

function DashboardIcon() {
  return <svg aria-hidden="true" className="admin-nav-icon" viewBox="0 0 24 24"><rect height="7" rx="1.5" width="7" x="3" y="3" /><rect height="7" rx="1.5" width="7" x="14" y="3" /><rect height="7" rx="1.5" width="7" x="3" y="14" /><rect height="7" rx="1.5" width="7" x="14" y="14" /></svg>;
}

function ProfilesIcon() {
  return <svg aria-hidden="true" className="admin-nav-icon" viewBox="0 0 24 24"><rect height="7" rx="2" width="18" x="3" y="4" /><rect height="7" rx="2" width="18" x="3" y="14" /><circle cx="7" cy="7.5" fill="currentColor" r=".7" /><circle cx="7" cy="17.5" fill="currentColor" r=".7" /></svg>;
}

export function AdminShell({ name, children }: AdminShellProps) {
  const [compact, setCompact] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const dashboardLinkRef = useRef<HTMLAnchorElement>(null);

  const closeDrawer = useCallback((restoreFocus = true) => {
    setDrawerOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 820px)");
    const update = () => {
      setCompact(query.matches);
      if (!query.matches) setDrawerOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!compact || !drawerOpen) return;
    document.body.classList.add("admin-navigation-locked");
    const focusDrawer = window.requestAnimationFrame(() => dashboardLinkRef.current?.focus());
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !navigationRef.current) return;
      const focusable = Array.from(navigationRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const dismissOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      window.cancelAnimationFrame(focusDrawer);
      document.removeEventListener("keydown", trapFocus);
      document.removeEventListener("keydown", dismissOnEscape);
      document.body.classList.remove("admin-navigation-locked");
    };
  }, [closeDrawer, compact, drawerOpen]);

  return (
    <div className={`admin-shell${drawerOpen ? " admin-shell-drawer-open" : ""}`}>
      <header className="admin-topbar">
        <button aria-controls="admin-sidebar" aria-expanded={compact && drawerOpen} aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"} className="admin-menu-toggle" onClick={() => drawerOpen ? closeDrawer(false) : setDrawerOpen(true)} ref={menuRef} type="button"><svg aria-hidden="true" className="admin-nav-icon" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        <Link aria-label="Atlas Admin Console dashboard" className="admin-brand" href="/admin/dashboard"><span aria-hidden="true" className="admin-brand-mark">A</span><span>Atlas</span></Link>
        <p className="admin-breadcrumb"><span>Administration</span><span aria-hidden="true">/</span><strong>Dashboard</strong></p>
        <div className="admin-topbar-actions"><AdminThemeControls /><Avatar name={name} size="small" /></div>
      </header>

      {compact && drawerOpen ? <button aria-label="Close navigation menu" className="admin-drawer-backdrop" onClick={() => closeDrawer()} tabIndex={-1} type="button" /> : null}
      <aside aria-hidden={compact && !drawerOpen ? true : undefined} aria-label="Admin Console navigation" className={`admin-sidebar${drawerOpen ? " admin-sidebar-open" : ""}`} id="admin-sidebar" inert={compact && !drawerOpen ? true : undefined} ref={navigationRef}>
        <p className="admin-sidebar-label">Administration</p>
        <nav aria-label="Administration">
          <Link aria-current="page" className="admin-nav-item admin-nav-item-active" href="/admin/dashboard" onClick={() => { if (compact) closeDrawer(); }} ref={dashboardLinkRef}><DashboardIcon /><span>Dashboard</span></Link>
          <span aria-disabled="true" className="admin-nav-item admin-nav-item-unavailable" title="Provider Profiles will be implemented separately"><ProfilesIcon /><span>Provider Profiles</span><small>Coming soon</small></span>
        </nav>
        <div aria-hidden="true" className="admin-sidebar-divider" />
        <p className="admin-sidebar-label">Workspace</p>
        <nav aria-label="Workspace">
          <button className="admin-nav-item admin-nav-item-unavailable" disabled type="button">Projects</button>
          <button className="admin-nav-item admin-nav-item-unavailable" disabled type="button">Settings</button>
        </nav>
        <div className="admin-sidebar-spacer" />
        <footer className="admin-sidebar-identity"><Avatar name={name} size="small" /><div><strong title={name}>{name}</strong><span>Platform Administrator</span></div></footer>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
