// src/app/layout.js (NO 'use client' here)
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Agentica",
  description: "Agentic AI Chat powered by LLMs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body
        className={`${geistMono.variable} antialiased flex flex-col min-h-screen
          bg-gradient-to-br from-blue-50 via-white to-blue-50
          text-gray-900 transition-colors duration-300`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
