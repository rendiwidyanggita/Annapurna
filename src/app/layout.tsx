import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANNAPURNA Adventure — Penyewaan Alat Outdoor",
  description: "Sistem Informasi Penyewaan Alat Outdoor Berbasis Website",
  icons: {
    icon: [
      { url: "/images/favicon.svg", type: "image/svg+xml" },
      { url: "/images/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/favicon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} h-full antialiased font-sans light`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ReactQueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}