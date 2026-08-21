import Link from "next/link";
import { TopBar } from "./TopBar";
import { ThemeSelector } from "./ThemeSelector";

export function PublicHeader({ showAccountActions = true }: { showAccountActions?: boolean }) {
  return <TopBar><Link className="brand" href="/" aria-label="Atlas home"><span aria-hidden="true">A</span>Atlas</Link>{showAccountActions && <nav className="landing-nav" aria-label="Account actions"><ThemeSelector className="landing-theme-selector" /><Link href="/sign-in">Sign in</Link><Link className="button-link" href="/sign-up">Sign up</Link></nav>}</TopBar>;
}
