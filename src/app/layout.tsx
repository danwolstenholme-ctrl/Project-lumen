import type { Metadata } from "next";
import { Raleway, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Toaster from "@/components/Toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Lumen",
  description: "Where dining becomes theatre.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${raleway.variable} ${manrope.variable} h-full antialiased dark`}
        suppressHydrationWarning
      >
        {/* Inline script prevents flash-of-wrong-theme before React hydrates */}
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('lumen-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-zinc-100 dark:bg-lumen-bg text-zinc-900 dark:text-[#F4F4F5]">
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
