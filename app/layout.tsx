import type { Metadata } from "next";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import { Syne, DM_Mono, Inter } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "QNTM — Know where conviction is strongest",
  description:
    "A multi-factor quantitative model scoring 1,402 stocks daily, blended with a live macro regime overlay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmMono.variable} ${inter.variable} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}