import Link from "next/link";

export function PublicHeader() {
  return <header className="topbar"><Link className="brand" href="/" aria-label="Atlas home"><span aria-hidden="true">A</span>Atlas</Link><nav className="landing-nav" aria-label="Account actions"><Link href="/sign-in">Sign in</Link><Link className="button-link" href="/sign-up">Sign up</Link></nav></header>;
}
