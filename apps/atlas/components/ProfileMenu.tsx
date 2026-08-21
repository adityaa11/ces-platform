"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };

export function ProfileMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return <div className="profile-wrap" ref={ref}><button aria-expanded={open} className="profile-control" onClick={() => setOpen((value) => !value)} type="button"><Avatar name={user.name} size="small" /><span><strong>{user.name}</strong><small>{user.email}</small></span></button>{open && <div className="profile-menu"><p><strong>{user.role}</strong> access</p><div className="theme-selector"><span>Theme</span><button onClick={() => setTheme("light")} type="button">Light</button><button onClick={() => setTheme("dark")} type="button">Dark</button></div><Link href="/demo">Account settings</Link><Link href="/sign-in">Logout</Link></div>}</div>;
}
