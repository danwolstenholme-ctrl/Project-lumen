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

      <style>{`
        @keyframes blobDrift1 {
          0%   { transform: translate(0px, 0px) scale(1);      opacity: 0.55; }
          25%  { transform: translate(40px, -30px) scale(1.08); opacity: 0.70; }
          50%  { transform: translate(20px, 40px) scale(0.96);  opacity: 0.50; }
          75%  { transform: translate(-30px, 20px) scale(1.05); opacity: 0.65; }
          100% { transform: translate(0px, 0px) scale(1);      opacity: 0.55; }
        }
        @keyframes blobDrift2 {
          0%   { transform: translate(0px, 0px) scale(1);       opacity: 0.45; }
          25%  { transform: translate(-50px, 30px) scale(1.06); opacity: 0.60; }
          50%  { transform: translate(-20px, -40px) scale(0.94); opacity: 0.40; }
          75%  { transform: translate(35px, -20px) scale(1.03); opacity: 0.55; }
          100% { transform: translate(0px, 0px) scale(1);       opacity: 0.45; }
        }
      `}</style>

      {/* ── Left panel — branding ── */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 px-16 py-12 border-r border-zinc-900 overflow-hidden">

        {/* Blob 1 — fuchsia */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div style={{
            width: "640px", height: "480px",
            background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(217,70,239,0.18) 0%, rgba(217,70,239,0.06) 55%, transparent 75%)",
            filter: "blur(48px)",
            animation: "blobDrift1 25s ease-in-out infinite",
            willChange: "transform, opacity",
          }} />
        </div>

        {/* Blob 2 — purple */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div style={{
            width: "560px", height: "420px", marginTop: "80px",
            background: "radial-gradient(ellipse 65% 50% at 50% 60%, rgba(168,85,247,0.16) 0%, rgba(168,85,247,0.05) 55%, transparent 75%)",
            filter: "blur(56px)",
            animation: "blobDrift2 30s ease-in-out infinite",
            willChange: "transform, opacity",
          }} />
        </div>

        {/* Logo */}
        <Link href="https://projectlumen.io" className="relative z-10 inline-flex items-center gap-2.5 w-fit">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d946ef, #a855f7)" }}
          >
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span
            className="text-white font-semibold text-base tracking-wide"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Project Lumen
          </span>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10 flex flex-col gap-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 border border-zinc-800 rounded-sm px-2.5 py-1 bg-zinc-900/40 backdrop-blur-sm w-fit">
            <Zap className="w-3 h-3 text-fuchsia-400 shrink-0" />
            <span
              className="text-[10px] tracking-widest text-zinc-400 font-medium uppercase"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              Now in beta · Art licensing marketplace
            </span>
          </div>

          <h1
            className="text-white font-semibold leading-none"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-raleway)",
            }}
          >
            {headline}
          </h1>

          <p
            className="text-zinc-400 text-sm leading-relaxed max-w-sm"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            {sub}
          </p>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10 flex items-center gap-3">
          <Gem className="w-3.5 h-3.5 text-zinc-600" />
          <span
            className="text-xs text-zinc-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Artists &amp; venues. One licensing platform.
          </span>
          <Gem className="w-3.5 h-3.5 text-zinc-600" />
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">

        {/* Mobile-only logo */}
        <Link href="https://projectlumen.io" className="lg:hidden inline-flex items-center gap-2.5 mb-10">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d946ef, #a855f7)" }}
          >
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span
            className="text-white font-semibold text-base tracking-wide"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Project Lumen
          </span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
