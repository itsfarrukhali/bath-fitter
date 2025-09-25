import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientLayout from "@/components/ClientLayout";
import ThemeProviderClient from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home Care",
  description: "Home care - We Make Your Dreams Into Reality",
  icons: {
    icon: "/home-care-logo-black.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <ThemeProviderClient>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
            <Toaster position="top-right" richColors theme="system" />
          </AuthProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
