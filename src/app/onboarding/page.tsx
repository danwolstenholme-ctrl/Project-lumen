"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap, Palette, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

type Role = "artist" | "venue";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);

  async function selectRole(role: Role) {
    if (!user) return;
    setLoading(role);
    await user.update({ unsafeMetadata: { role } });
    await fetch("/api/user/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.replace(`/dashboard/${role}`);
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center overflow-hidden px-6">

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

      {/* Blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div style={{
          width: "720px", height: "480px",
          background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(217,70,239,0.15) 0%, rgba(217,70,239,0.05) 55%, transparent 75%)",
          filter: "blur(48px)",
          animation: "blobDrift1 25s ease-in-out infinite",
          willChange: "transform, opacity",
        }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div style={{
          width: "640px", height: "420px", marginTop: "80px",
          background: "radial-gradient(ellipse 65% 50% at 50% 60%, rgba(168,85,247,0.13) 0%, rgba(168,85,247,0.04) 55%, transparent 75%)",
          filter: "blur(56px)",
          animation: "blobDrift2 30s ease-in-out infinite",
          willChange: "transform, opacity",
        }} />
      </div>

      {/* Logo */}
      <Link href="https://projectlumen.io" className="relative z-10 inline-flex items-center gap-2.5 mb-16">
        <div
          className="w-8 h-8 rounded-sm flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #d946ef, #a855f7)" }}
        >
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span
          className="text-zinc-900 dark:text-white font-semibold text-base tracking-wide"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Project Lumen
        </span>
      </Link>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xl text-center">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-sm px-2.5 py-1 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm">
          <Zap className="w-3 h-3 text-fuchsia-500 dark:text-fuchsia-400 shrink-0" />
          <span
            className="text-[10px] tracking-widest text-zinc-600 dark:text-zinc-400 font-medium uppercase"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            One more step
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1
            className="text-zinc-900 dark:text-white font-semibold leading-none"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-raleway)",
            }}
          >
            How will you use{" "}
            <span className="text-gradient">Lumen?</span>
          </h1>
          <p
            className="text-zinc-600 dark:text-zinc-400 text-sm"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            This sets up your dashboard. You can&apos;t change this later.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <button
            onClick={() => selectRole("artist")}
            disabled={loading !== null}
            className="group relative flex flex-col gap-4 p-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-fuchsia-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-left disabled:opacity-50"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.2), rgba(217,70,239,0.05))", border: "1px solid rgba(217,70,239,0.2)" }}
            >
              <Palette className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p
                className="text-zinc-900 dark:text-white font-semibold tracking-wide text-base"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Artist
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: "var(--font-manrope)" }}>
                Upload immersive shows and license your work to venues worldwide.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-fuchsia-500 dark:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-manrope)" }}>
              {loading === "artist" ? "Setting up…" : <>Select Artist <ArrowRight className="w-3 h-3" /></>}
            </div>
          </button>

          <button
            onClick={() => selectRole("venue")}
            disabled={loading !== null}
            className="group relative flex flex-col gap-4 p-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-left disabled:opacity-50"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))", border: "1px solid rgba(168,85,247,0.2)" }}
            >
              <Building2 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p
                className="text-zinc-900 dark:text-white font-semibold tracking-wide text-base"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Venue
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: "var(--font-manrope)" }}>
                Browse and license shows to transform your dining experience.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-500 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-manrope)" }}>
              {loading === "venue" ? "Setting up…" : <>Select Venue <ArrowRight className="w-3 h-3" /></>}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
