"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import { TopBar } from "./TopBar";

type ShellUser = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type Destination = "projects" | "workflow" | "facts" | "ces" | "changes";
type AppShellProps = { user: ShellUser; children: ReactNode; active?: Destination; projectNavigation?: boolean; sidebarAction?: ReactNode };
const projectDestinations: [Destination, string][] = [["workflow", "Main Workflow"], ["facts", "Project Facts"], ["ces", "CES Result"], ["changes", "Changes Done"]];

export function AppShell({ user, children, active = "projects", projectNavigation = false, sidebarAction }: AppShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("atlas-theme") === "light" ? "light" : "dark";
  });
  const destinations: [Destination, string][] = [["projects", "Projects"], ...(projectNavigation ? projectDestinations : [])];
  const toggleCollapsed = () => setCollapsed((isCollapsed) => !isCollapsed);
  const sidebarLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (!profileOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);
  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}><TopBar className="app-header" variant="workspace"><Link className="brand" href="/demo"><span>A</span>Atlas</Link><button aria-controls="app-navigation" aria-expanded={navOpen} className="mobile-menu" onClick={() => setNavOpen(!navOpen)} type="button">Menu</button></TopBar><aside className={`navigation ${navOpen ? "navigation-open" : ""}`} id="app-navigation"><button aria-controls="app-navigation" aria-expanded={!collapsed} aria-label={sidebarLabel} className="sidebar-toggle" onClick={toggleCollapsed} title={sidebarLabel} type="button">‹</button><button aria-controls="app-navigation" aria-label={sidebarLabel} className="sidebar-edge-toggle" onClick={toggleCollapsed} title={sidebarLabel} type="button" /><div className="profile-wrap" ref={profileRef}><button aria-controls="profile-menu" aria-expanded={profileOpen} className="profile-control" onClick={() => setProfileOpen(!profileOpen)} type="button"><Avatar name={user.name} size="small" /><span><strong>{user.name}</strong><small>{user.email}</small></span></button>{profileOpen && <div className="profile-menu" id="profile-menu"><p><strong>{user.role}</strong> access</p><div className="theme-selector" role="group" aria-label="Theme"><span>Theme</span><button aria-pressed={theme === "light"} className={theme === "light" ? "theme-active" : ""} onClick={() => setTheme("light")} type="button">Light</button><button aria-pressed={theme === "dark"} className={theme === "dark" ? "theme-active" : ""} onClick={() => setTheme("dark")} type="button">Dark</button></div><Link href="/demo">Account settings</Link><Link href="/sign-in">Logout</Link></div>}</div><div className="sidebar-action">{sidebarAction}</div><nav aria-label={projectNavigation ? "Project navigation" : "Workspace navigation"}>{destinations.map(([id, label]) => <Link aria-current={active === id ? "page" : undefined} className={active === id ? "nav-active" : ""} href="/demo" key={id} onClick={() => setNavOpen(false)}><span className="nav-label">{label}</span></Link>)}</nav></aside><main className="app-content">{children}</main></div>;
}
