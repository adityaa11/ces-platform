import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas - project understanding",
  description: "A fixture-driven Atlas prototype.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("atlas-theme")?.value;
  const initialTheme = theme === "light" || theme === "dark" ? theme : undefined;

  return (
    <html data-theme={initialTheme} lang="en">
      <body><ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider></body>
    </html>
  );
}
