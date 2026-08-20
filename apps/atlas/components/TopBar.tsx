import type { ReactNode } from "react";

export function TopBar({ children, className = "", variant = "marketing" }: { children: ReactNode; className?: string; variant?: "marketing" | "workspace" }) {
  return <header className={`topbar topbar-${variant} ${className}`.trim()}>{children}</header>;
}
