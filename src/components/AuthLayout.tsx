"use client";

import { Zap, Gem } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  headline: ReactNode;
  sub: string;
}

export default function AuthLayout({ children, headline, sub }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex overflow-hidden">

      {/* ── Left panel — branding ── */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 px-16 py-12 border-r border-zinc-900 overflow-hidden">

        {/* Blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="blob-fuchsia" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="blob-purple" />
        </div>

        {/* Logo */}
        <Link href="https://projectlumen.io" className="relative z-10 inline-flex items-center gap-2.5 w-fit">
          <div className="logo-icon w-8 h-8 rounded-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-raleway text-white font-semibold text-base tracking-wide">
            Project Lumen
          </span>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 border border-zinc-800 rounded-sm px-2.5 py-1 bg-zinc-900/40 backdrop-blur-sm w-fit">
            <Zap className="w-3 h-3 text-fuchsia-400 shrink-0" />
            <span className="font-manrope text-[10px] tracking-widest text-zinc-400 font-medium uppercase">
              Now in beta · Art licensing marketplace
            </span>
          </div>

          <h1
            className="font-raleway text-white font-semibold leading-none"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.01em" }}
          >
            {headline}
          </h1>

          <p className="font-manrope text-zinc-400 text-sm leading-relaxed max-w-sm">
            {sub}
          </p>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10 flex items-center gap-3">
          <Gem className="w-3.5 h-3.5 text-zinc-600" />
          <span className="font-manrope text-xs text-zinc-600 tracking-widest uppercase">
            Artists &amp; venues. One licensing platform.
          </span>
          <Gem className="w-3.5 h-3.5 text-zinc-600" />
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto bg-zinc-950">

        {/* Mobile-only logo */}
        <Link href="https://projectlumen.io" className="lg:hidden inline-flex items-center gap-2.5 mb-10">
          <div className="logo-icon w-8 h-8 rounded-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-raleway text-white font-semibold text-base tracking-wide">
            Project Lumen
          </span>
        </Link>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
