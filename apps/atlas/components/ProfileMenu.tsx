"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import type { AuthenticatedUser, ProjectRole } from "./authenticated-user";
import { Dialog } from "./Dialog";
import { ThemeSelector } from "./ThemeSelector";

export function ProfileMenu({ user, projectRole, showSignOut = true }: { user: AuthenticatedUser; projectRole?: ProjectRole; showSignOut?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const query = window.matchMedia("(max-width: 960px)"); const update = () => setMobile(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const actions = <>{projectRole && <p><strong>{projectRole}</strong> access</p>}<ThemeSelector /><span aria-disabled="true" className="profile-unavailable">Account settings <small>Unavailable in prototype</small></span>{showSignOut && <Link href="/sign-in" onClick={() => setOpen(false)}>Logout</Link>}</>;
  return <div className="profile-wrap" ref={ref}>
    <button aria-expanded={open} aria-label={projectRole ? `${user.name}, ${projectRole}, ${user.email}` : `${user.name}, ${user.email}`} className="profile-control" onClick={() => setOpen((value) => !value)} type="button">
      <Avatar name={user.name} size="small" />
      <span className="profile-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
      <svg aria-hidden="true" className="profile-chevron" fill="none" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
    </button>
    {open && (mobile ? <Dialog onClose={() => setOpen(false)} title="Account menu"><div className="profile-sheet">{actions}</div></Dialog> : <div className="profile-menu">{actions}</div>)}
  </div>;
}
