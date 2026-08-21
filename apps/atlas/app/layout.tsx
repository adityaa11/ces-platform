import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas - project understanding",
  description: "A fixture-driven Atlas prototype.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { document.documentElement.dataset.theme = localStorage.getItem('atlas-theme') === 'light' ? 'light' : 'dark'; } catch {}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
