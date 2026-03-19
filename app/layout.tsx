import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Pioneer Extraction Arena",
  description: "Compare base vs fine-tuned extraction with Pioneer AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.variable} ${inter.variable} ${spaceMono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
