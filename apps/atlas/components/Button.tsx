import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { tone?: "primary" | "secondary" | "quiet" };
export function Button({ children, className = "", tone = "primary", ...props }: ButtonProps) { return <button className={`button button-${tone} ${className}`.trim()} {...props}>{children}</button>; }
