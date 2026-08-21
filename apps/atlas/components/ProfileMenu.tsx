"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Dialog } from "./Dialog";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };

export function ProfileMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => typeof window !== "undefined" && window.localStorage.getItem("atlas-theme") === "light" ? "light" : "dark");
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("atlas-theme", theme); }, [theme]);
  useEffect(() => { const query = window.matchMedia("(max-width: 640px)"); const update = () => setMobile(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const actions = <><p><strong>{user.role}</strong> access</p><div className="theme-selector"><span>Theme</span><button onClick={() => setTheme("light")} type="button">Light</button><button onClick={() => setTheme("dark")} type="button">Dark</button></div><Link href="/demo" onClick={() => setOpen(false)}>Account settings</Link><Link href="/sign-in" onClick={() => setOpen(false)}>Logout</Link></>;
  return <div className="profile-wrap" ref={ref}><button aria-expanded={open} className="profile-control" onClick={() => setOpen((value) => !value)} type="button"><Avatar name={user.name} size="small" /><span><strong>{user.name}</strong><small>{user.email}</small></span></button>{open && (mobile ? <Dialog onClose={() => setOpen(false)} title="Account menu"><div className="profile-sheet">{actions}</div></Dialog> : <div className="profile-menu">{actions}</div>)}</div>;
}
