"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import type { AuthenticatedUser, ProjectRole } from "./authenticated-user";
import { Dialog } from "./Dialog";
import { createSignOutSubmission, mapSignOutFailure, requestSignOut, type SignOutSubmission } from "./sign-out-submission";
import { ThemeSelector } from "./ThemeSelector";

export type SignOutMode = "fixture-link" | "hidden" | "session";

export function ProfileMenu({ user, projectRole, signOutMode = "fixture-link" }: { user: AuthenticatedUser; projectRole?: ProjectRole; signOutMode?: SignOutMode }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const submissionRef = useRef<SignOutSubmission | null>(null);
  const router = useRouter();
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
  async function signOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    submissionRef.current ??= createSignOutSubmission(requestSignOut, () => router.replace("/sign-in"));
    const response = await submissionRef.current.submit();
    if (!response?.ok) setSignOutError(mapSignOutFailure());
    setIsSigningOut(false);
  }
  const actions = <>{projectRole && <p><strong>{projectRole}</strong> access</p>}<ThemeSelector /><span aria-disabled="true" className="profile-unavailable">Account settings <small>Unavailable in prototype</small></span>{signOutMode === "fixture-link" && <Link href="/sign-in" onClick={() => setOpen(false)}>Logout</Link>}{signOutMode === "session" && <div className="profile-session-action"><button aria-describedby={signOutError ? "sign-out-error" : undefined} disabled={isSigningOut} onClick={signOut} type="button">{isSigningOut ? "Signing out..." : "Sign out"}</button>{signOutError && <p id="sign-out-error" role="alert">{signOutError}</p>}</div>}</>;
  return <div className="profile-wrap" ref={ref}>
    <button aria-expanded={open} aria-label={projectRole ? `${user.name}, ${projectRole}, ${user.email}` : `${user.name}, ${user.email}`} className="profile-control" onClick={() => setOpen((value) => !value)} type="button">
      <Avatar name={user.name} size="small" />
      <span className="profile-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
      <svg aria-hidden="true" className="profile-chevron" fill="none" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
    </button>
    {open && (mobile ? <Dialog onClose={() => setOpen(false)} title="Account menu"><div className="profile-sheet">{actions}</div></Dialog> : <div className="profile-menu">{actions}</div>)}
  </div>;
}
