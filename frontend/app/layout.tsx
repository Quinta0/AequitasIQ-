import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/navbar'
import { Providers } from './providers'
import { ThemeProvider } from "@/components/theme-provider"

import { DataVisibilityProvider } from '@/contexts/data-visibility-context'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aequitas IQ",
  description: "The intelligent way of accounting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      className={cn(
        geistSans.variable,
        geistMono.variable,
      )}
      suppressHydrationWarning
    >
      <body 
        className="antialiased min-h-screen bg-background"
        suppressHydrationWarning
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <DataVisibilityProvider>
              <div className="relative flex min-h-screen flex-col px-8">
                <Navbar />
                <main className="flex-1">{children}</main>
              </div>
            </DataVisibilityProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}