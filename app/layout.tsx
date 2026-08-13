import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZSign Embed quickstart",
  description: "Mint + iframe integration sample",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
