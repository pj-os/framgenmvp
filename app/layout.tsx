import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

import { Toaster } from "@/components/ui/toaster";
import { GlobalHeader } from "@/components/GlobalHeader";

export const metadata: Metadata = {
  title: "Framgen | Content Monitor & Creator",
  description: "Monitor trends, apply frameworks, create viral content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased bg-background text-foreground`}
      >
        <GlobalHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
