import type { ReactNode } from "react";

export function TopBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <header className={`topbar ${className}`.trim()}>{children}</header>;
}
