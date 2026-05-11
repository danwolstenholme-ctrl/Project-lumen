"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Ambient glow layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(217,70,239,0.12) 0%, transparent 60%), " +
            "radial-gradient(ellipse 70% 50% at 90% 100%, rgba(168,85,247,0.10) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,158,11,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top edge glow line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 max-w-xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(217,70,239,0.6), rgba(168,85,247,0.6), transparent)",
        }}
      />

      {/* Logo + tagline */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-3">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          {/* Diamond icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden
          >
            <path
              d="M14 2L26 14L14 26L2 14L14 2Z"
              stroke="url(#lumen-grad)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M14 6L22 14L14 22L6 14L14 6Z"
              fill="url(#lumen-grad)"
              opacity="0.25"
            />
            <defs>
              <linearGradient
                id="lumen-grad"
                x1="2"
                y1="2"
                x2="26"
                y2="26"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#D946EF" />
                <stop offset="1" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>

          <span
            className="text-4xl tracking-[0.25em] uppercase text-white"
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
          >
            LUMEN
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-sm tracking-[0.18em] uppercase"
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 400,
            background: "linear-gradient(90deg, #D946EF, #A855F7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Where dining becomes theatre.
        </p>
      </div>

      {/* Clerk sign-up */}
      <div className="relative z-10 w-full max-w-md px-4">
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#D946EF",
              colorBackground: "rgba(13,13,18,0.0)",
              colorInputBackground: "rgba(255,255,255,0.05)",
              colorInputText: "#F4F4F5",
              colorText: "#F4F4F5",
              colorTextSecondary: "#A1A1AA",
              colorNeutral: "#52525B",
              borderRadius: "0.5rem",
              fontFamily: "var(--font-manrope), system-ui, sans-serif",
              fontFamilyButtons: "var(--font-raleway), system-ui, sans-serif",
              fontSize: "0.9375rem",
            },
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-transparent border-0 p-0",
              cardBox:
                "bg-[rgba(13,13,18,0.75)] border border-white/[0.08] rounded-xl backdrop-blur-2xl shadow-[0_0_80px_rgba(217,70,239,0.08),0_0_40px_rgba(168,85,247,0.05)]",
              headerTitle: "font-[family-name:var(--font-raleway)] tracking-wide",
              headerSubtitle: "text-[#A1A1AA]",
              socialButtonsBlockButton:
                "border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-[#F4F4F5] transition-colors",
              socialButtonsBlockButtonText: "font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-[#52525B] text-xs tracking-widest uppercase",
              formFieldLabel: "text-[#A1A1AA] text-sm tracking-wide",
              formFieldInput:
                "bg-white/[0.04] border border-white/10 text-[#F4F4F5] focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-colors placeholder:text-[#52525B]",
              formButtonPrimary:
                "bg-gradient-to-r from-[#D946EF] to-[#A855F7] hover:opacity-90 text-white font-semibold tracking-wide transition-opacity shadow-[0_0_24px_rgba(217,70,239,0.35)]",
              footerActionLink:
                "text-[#D946EF] hover:text-[#A855F7] transition-colors",
              identityPreviewText: "text-[#F4F4F5]",
              identityPreviewEditButton: "text-[#D946EF]",
              alertText: "text-sm",
              formResendCodeLink: "text-[#D946EF]",
            },
          }}
        />
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 inset-x-0 h-40"
        style={{
          background:
            "linear-gradient(to top, rgba(9,9,11,0.8), transparent)",
        }}
      />
    </div>
  );
}