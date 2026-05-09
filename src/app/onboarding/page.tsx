"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "artist" | "venue";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function selectRole(role: Role) {
    if (!user) return;
    setLoading(true);
    await user.update({ unsafeMetadata: { role } });
    await fetch("/api/user/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.replace(`/dashboard/${role}`);
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090B]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(217,70,239,0.10) 0%, transparent 60%), " +
            "radial-gradient(ellipse 70% 50% at 90% 100%, rgba(168,85,247,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-lg">
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-3xl tracking-[0.25em] uppercase text-white"
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
          >
            LUMEN
          </span>
          <p className="text-[#A1A1AA] text-sm tracking-widest uppercase">
            How will you use Lumen?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full sm:grid-cols-2">
          <button
            onClick={() => selectRole("artist")}
            disabled={loading}
            className="group flex flex-col gap-3 p-8 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-[#D946EF]/40 hover:bg-white/[0.06] transition-all text-left disabled:opacity-50"
          >
            <span className="text-2xl">🎨</span>
            <div>
              <p
                className="text-white font-semibold tracking-wide"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Artist
              </p>
              <p className="text-[#A1A1AA] text-sm mt-1">
                Upload and license your immersive show content.
              </p>
            </div>
          </button>

          <button
            onClick={() => selectRole("venue")}
            disabled={loading}
            className="group flex flex-col gap-3 p-8 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-[#A855F7]/40 hover:bg-white/[0.06] transition-all text-left disabled:opacity-50"
          >
            <span className="text-2xl">🏛️</span>
            <div>
              <p
                className="text-white font-semibold tracking-wide"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Venue
              </p>
              <p className="text-[#A1A1AA] text-sm mt-1">
                Discover and license shows for your dining experience.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
