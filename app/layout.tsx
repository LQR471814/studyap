import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import { cn } from "@/lib/utils";
import "./globals.css";

import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "StudyAP",
  description: "Redefining AP Practice with AI Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="light">
        <body
          className={cn(
            "grainy flex min-h-screen flex-col font-sans antialiased",
            GeistSans.className,
          )}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
