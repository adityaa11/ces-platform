import type { ReactNode } from "react";
import Link from "next/link";

export function TopBar({ children, className = "", variant = "marketing" }: { children: ReactNode; className?: string; variant?: "marketing" | "workspace" }) {
  return <header className={`topbar topbar-${variant} ${className}`.trim()}>{children}{variant === "workspace" && <Link aria-label="Project home" className="topbar-home" href="/demo"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg></Link>}</header>;
}
