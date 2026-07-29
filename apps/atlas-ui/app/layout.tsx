import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CES Atlas · Workflow Review",
  description: "Review proposed Atlas workflows, evidence, and topology.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
