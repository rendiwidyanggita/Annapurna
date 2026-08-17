import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ANNAPURNA Adventure — Penyewaan Alat Outdoor",
  description: "Sistem Informasi Penyewaan Alat Outdoor Berbasis Website",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id" className={`${manrope.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
