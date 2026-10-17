import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediScan | Clinical Prescription Deciphering & Intelligence",
  description:
    "Prescription OCR and pharmacological analysis with automated medical abbreviation deciphering (OD, BD, TDS), active chemical composition lookup, clinical guidelines, and diagnostic laboratory tests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 bg-white">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
