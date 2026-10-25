import Link from "next/link";
import type { ReactNode } from "react";
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
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link aria-label="Atlas Admin Console dashboard" className="admin-brand" href="/admin/dashboard"><span aria-hidden="true" className="admin-brand-mark">A</span><span>Atlas</span></Link>
        <p className="admin-breadcrumb"><span>Administration</span><span aria-hidden="true">/</span><strong>Dashboard</strong></p>
        <div className="admin-topbar-actions"><AdminThemeControls /><Avatar name={name} size="small" /></div>
      </header>

      <aside aria-label="Admin Console navigation" className="admin-sidebar">
        <p className="admin-sidebar-label">Administration</p>
        <nav aria-label="Administration">
          <Link aria-current="page" className="admin-nav-item admin-nav-item-active" href="/admin/dashboard"><DashboardIcon /><span>Dashboard</span></Link>
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
