import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// RELATIVE FIX: Bypassing the root-aliased '@/' paths to reach the parent folders safely
import { RoleProvider } from "../context/RoleContext";
import AppWrapperEngine from "../components/AppWrapperEngine";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Root Media Directory Workspace",
  description: "Isolate storage targets dynamically using custom managed folder infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#060713] text-[#f3f4f6]">
        <RoleProvider>
          <AppWrapperEngine>
            {children}
          </AppWrapperEngine>
        </RoleProvider>
      </body>
    </html>
  );
}