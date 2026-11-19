import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio",
  description: "Experimental design studio.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-screen bg-black font-[family-name:var(--font-display)] text-neutral-200 antialiased">
        {children}
      </body>
    </html>
  );
}