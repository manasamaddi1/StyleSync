import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "StyleSync",
  description: "AI wardrobe + outfit generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950">
        <Navbar />
        <div className="px-10 py-10">{children}</div>
      </body>
    </html>
  );
}