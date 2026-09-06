import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUEX Beauty Platform",
  description: "Betriebsplattform für Beauty- und Terminbetriebe.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
