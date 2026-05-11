import type { Metadata } from "next";
import { Raleway, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Toaster from "@/components/Toaster";
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${raleway.variable} ${manrope.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-lumen-bg text-[#F4F4F5]">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
