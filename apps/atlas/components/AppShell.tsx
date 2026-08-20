"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar } from "./Avatar";
type ShellUser = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type AppShellProps = { user: ShellUser; children: ReactNode; active?: "projects" | "workflow" | "facts" | "ces" | "changes" };
const destinations = [["projects", "Projects"], ["workflow", "Main Workflow"], ["facts", "Project Facts"], ["ces", "CES Result"], ["changes", "Changes Done"]] as const;
export function AppShell({ user, children, active = "projects" }: AppShellProps) {
  const [profileOpen, setProfileOpen] = useState(false); const [navOpen, setNavOpen] = useState(false);
  return <div className="app-shell"><header className="app-header"><Link className="brand" href="/demo"><span>A</span>Atlas</Link><button aria-controls="app-navigation" aria-expanded={navOpen} className="mobile-menu" onClick={() => setNavOpen(!navOpen)} type="button">Menu</button><div className="profile-wrap"><button aria-controls="profile-menu" aria-expanded={profileOpen} className="profile-control" onClick={() => setProfileOpen(!profileOpen)} type="button"><Avatar name={user.name} size="small" /><span><strong>{user.name}</strong><small>{user.email}</small></span></button>{profileOpen && <div className="profile-menu" id="profile-menu"><p><strong>{user.role}</strong> access</p><Link href="/demo">Account settings</Link><Link href="/sign-in">Logout</Link></div>}</div></header><aside className={`navigation ${navOpen ? "navigation-open" : ""}`} id="app-navigation"><nav aria-label="Project navigation">{destinations.map(([id, label]) => <Link aria-current={active === id ? "page" : undefined} className={active === id ? "nav-active" : ""} href="/demo" key={id} onClick={() => setNavOpen(false)}>{label}</Link>)}</nav><p className="role-note">Signed in as <strong>{user.role}</strong></p></aside><main className="app-content">{children}</main></div>;
}
