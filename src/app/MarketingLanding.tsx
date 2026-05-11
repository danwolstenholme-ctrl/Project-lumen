"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Zap, Palette, Building2, ArrowRight, Sparkles, Film, Wand2,
  MonitorPlay, Trophy, ChevronRight, Play, Mail, Gem,
} from "lucide-react";

interface FeaturedShow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  artist_name: string | null;
  artist_slug: string | null;
}

interface ArtistOfMonth {
  name: string | null;
  slug: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Props {
  featured: FeaturedShow[];
  artistOfMonth: ArtistOfMonth | null;
  stats: { artists: number; venues: number; shows: number };
}

export default function MarketingLanding({ featured, artistOfMonth, stats }: Props) {
  // Mouse-tracking parallax for the hero
  const heroRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMouse({
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const tx = (mouse.x - 0.5) * 40;
  const ty = (mouse.y - 0.5) * 30;

  return (
    <div className="bg-zinc-950 text-white min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-zinc-950/70 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="logo-icon w-8 h-8 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-raleway font-semibold text-base tracking-wide">Project Lumen</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-manrope text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white text-sm font-manrope font-semibold transition-all"
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header ref={heroRef} className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="blob-fuchsia"
            style={{ transform: `translate(${tx}px, ${ty}px)` }}
          />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="blob-purple"
            style={{ transform: `translate(${-tx * 0.6}px, ${-ty * 0.6}px)` }}
          />
        </div>

        {/* Grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-8">
          <span className="inline-flex items-center gap-2 border border-white/[0.08] bg-white/[0.03] rounded-full px-3 py-1 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            <span className="font-manrope text-[11px] tracking-widest text-zinc-300 uppercase font-medium">
              Now in beta · Licensing immersive art to venues worldwide
            </span>
          </span>

          <h1
            className="font-raleway font-semibold tracking-tight leading-[0.95] max-w-4xl"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", letterSpacing: "-0.02em" }}
          >
            Where dining
            <br />
            becomes <span className="text-gradient">theatre</span>.
          </h1>

          <p className="font-manrope text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Project Lumen lights up restaurant tables with breathing, immersive shows from the world&apos;s most talented digital artists. One tap on an iPad. Every table, transformed.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white font-manrope font-semibold shadow-lg shadow-fuchsia-950/40 transition-all"
            >
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-200 font-manrope font-semibold transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              How it works
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-8 grid grid-cols-3 gap-8 sm:gap-12 max-w-2xl">
            {[
              { value: stats.artists, label: "Artists" },
              { value: stats.shows, label: "Shows" },
              { value: stats.venues, label: "Venues" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="font-raleway text-3xl sm:text-4xl font-semibold tabular-nums">{value}</span>
                <span className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Featured experiences ── */}
      {featured.length > 0 && (
        <section className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div>
              <span className="font-manrope text-[11px] uppercase tracking-widest text-fuchsia-400 font-semibold">
                Featured Experiences
              </span>
              <h2 className="font-raleway text-3xl sm:text-4xl font-semibold mt-2 tracking-tight">
                Tonight&apos;s marquee.
              </h2>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 text-sm font-manrope text-zinc-400 hover:text-white transition-colors"
            >
              Browse the full library <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((show) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-all"
              >
                <div className="relative aspect-[16/10] bg-zinc-900 overflow-hidden">
                  {show.thumbnail_url ? (
                    <img
                      src={show.thumbnail_url}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fuchsia-950/40 to-purple-950/40">
                      <Film className="w-10 h-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-manrope font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300 backdrop-blur-sm">
                      <Sparkles className="w-2.5 h-2.5" /> Featured
                    </span>
                    {show.category && (
                      <span className="text-[10px] font-manrope font-medium uppercase tracking-widest text-zinc-300 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                        {show.category}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h3 className="font-raleway text-xl font-semibold leading-tight">{show.title}</h3>
                    {show.artist_name && (
                      <p className="font-manrope text-sm text-zinc-300 mt-1">{show.artist_name}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section id="how" className="relative py-24 border-y border-white/[0.06] bg-gradient-to-b from-transparent via-fuchsia-950/[0.04] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="font-manrope text-[11px] uppercase tracking-widest text-purple-400 font-semibold">
              How it works
            </span>
            <h2 className="font-raleway text-3xl sm:text-5xl font-semibold mt-2 tracking-tight">
              Curated. Licensed. <span className="text-gradient">Projected.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Wand2,
                step: "01",
                title: "Artists upload",
                body: "Digital artists submit 4K · 60fps immersive loops designed for top-down dining tables. Our review team curates every piece.",
                color: "fuchsia",
              },
              {
                icon: MonitorPlay,
                step: "02",
                title: "Venues license",
                body: "Restaurants browse a library of curated shows and license what fits their atmosphere. €30 per show. Permanent.",
                color: "purple",
              },
              {
                icon: Zap,
                step: "03",
                title: "One tap. Every table.",
                body: "From an iPad behind the bar, hit Play. Every projector across the dining room comes alive in perfect sync.",
                color: "amber",
              },
            ].map(({ icon: Icon, step, title, body, color }) => (
              <div
                key={step}
                className={`relative p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      color === "fuchsia" ? "icon-fuchsia" : color === "purple" ? "icon-purple" : "bg-amber-500/15 border border-amber-500/30"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      color === "fuchsia" ? "text-fuchsia-400" : color === "purple" ? "text-purple-400" : "text-amber-400"
                    }`} />
                  </div>
                  <span className="font-raleway text-3xl font-bold text-white/10">{step}</span>
                </div>
                <h3 className="font-raleway text-xl font-semibold mb-2">{title}</h3>
                <p className="font-manrope text-sm text-zinc-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For artists / for venues split ── */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artists card */}
          <Link
            href="/sign-up"
            className="group relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-fuchsia-950/30 via-zinc-950 to-zinc-950 overflow-hidden p-10 transition-all hover:border-fuchsia-500/30"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-fuchsia w-10 h-10 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-fuchsia-400" />
                </div>
                <span className="font-manrope text-xs uppercase tracking-widest text-fuchsia-400 font-semibold">
                  For Artists
                </span>
              </div>
              <h3 className="font-raleway text-3xl font-semibold mb-3 tracking-tight">
                Your art, on every table in the world.
              </h3>
              <p className="font-manrope text-zinc-400 leading-relaxed mb-8">
                Upload once. Earn forever. 70% royalty on every license, paid monthly. Plus boost placement and earn the &ldquo;Artist of the Month&rdquo; spotlight.
              </p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {[
                  "70% royalty per license",
                  "Public portfolio at projectlumen.io/artists/you",
                  "Monthly payouts via PayPal or bank transfer",
                  "Featured placement boosts via Stripe",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-manrope text-zinc-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-1.5 text-sm font-manrope font-semibold text-fuchsia-400 group-hover:gap-3 transition-all">
                Start as an artist <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Venues card */}
          <Link
            href="/sign-up"
            className="group relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-purple-950/30 via-zinc-950 to-zinc-950 overflow-hidden p-10 transition-all hover:border-purple-500/30"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-purple w-10 h-10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-manrope text-xs uppercase tracking-widest text-purple-400 font-semibold">
                  For Venues
                </span>
              </div>
              <h3 className="font-raleway text-3xl font-semibold mb-3 tracking-tight">
                The atmosphere of a Michelin-star restaurant, on demand.
              </h3>
              <p className="font-manrope text-zinc-400 leading-relaxed mb-8">
                One license per show. Permanent access. Real-time iPad control across every table. Switch the entire vibe of your dining room in a single tap.
              </p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {[
                  "iPad-first Quick Play control panel",
                  "Browse and license shows on demand",
                  "Sync every table in perfect time",
                  "Pause, resume, schedule — full control",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-manrope text-zinc-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-1.5 text-sm font-manrope font-semibold text-purple-400 group-hover:gap-3 transition-all">
                Bring Lumen to your venue <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Artist of the month ── */}
      {artistOfMonth && artistOfMonth.slug && (
        <section className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-600/[0.08] via-amber-500/[0.03] to-transparent p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              {artistOfMonth.avatar_url ? (
                <img src={artistOfMonth.avatar_url} alt={artistOfMonth.name ?? ""} className="w-24 h-24 rounded-full object-cover ring-2 ring-amber-500/30" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-800 ring-2 ring-amber-500/30 flex items-center justify-center font-raleway text-3xl font-bold text-zinc-300">
                  {(artistOfMonth.name ?? "A").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 font-manrope text-[11px] uppercase tracking-widest text-amber-400 font-semibold">
                <Trophy className="w-3.5 h-3.5" /> Artist of the Month
              </span>
              <h3 className="font-raleway text-3xl font-semibold mt-2 tracking-tight">{artistOfMonth.name}</h3>
              {artistOfMonth.bio && (
                <p className="font-manrope text-zinc-400 mt-2 max-w-xl">{artistOfMonth.bio}</p>
              )}
            </div>
            <Link
              href={`/artists/${artistOfMonth.slug}`}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-manrope font-semibold hover:bg-amber-500/25 transition-colors"
            >
              View portfolio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Pricing ── */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <span className="font-manrope text-[11px] uppercase tracking-widest text-fuchsia-400 font-semibold">
            Simple pricing
          </span>
          <h2 className="font-raleway text-3xl sm:text-5xl font-semibold mt-2 tracking-tight">
            Pay once. <span className="text-gradient">License forever.</span>
          </h2>
          <p className="font-manrope text-zinc-400 mt-4 max-w-xl mx-auto">
            No subscriptions. No ongoing fees. Every license is permanent — the show stays in your library for as long as your venue runs Lumen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            {
              tag: "License a show",
              price: "€30",
              unit: "per show, one time",
              who: "For venues",
              perks: ["Permanent access", "All resolutions included", "Pause / resume anytime"],
              accent: "purple",
              cta: "Sign up & license",
            },
            {
              tag: "Boost · Featured",
              price: "€75",
              unit: "per month",
              who: "For artists",
              perks: ["Top of every library", "10–20% multi-month discount", "Higher discovery"],
              accent: "fuchsia",
              cta: "Boost your show",
              highlight: true,
            },
            {
              tag: "Boost · Homepage",
              price: "€150",
              unit: "per month",
              who: "For artists",
              perks: ["Appear on this page", "Maximum reach", "Artist of the Month eligibility"],
              accent: "amber",
              cta: "Apply for spotlight",
            },
          ].map(({ tag, price, unit, who, perks, accent, cta, highlight }) => (
            <div
              key={tag}
              className={`relative rounded-2xl border p-7 transition-all ${
                highlight
                  ? "border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-950/30 to-zinc-950 shadow-[0_0_60px_-15px_rgba(217,70,239,0.3)]"
                  : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white text-[10px] font-manrope font-bold uppercase tracking-widest">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-medium">{who}</span>
              </div>
              <h3 className="font-raleway text-xl font-semibold mb-2">{tag}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-raleway text-5xl font-bold tracking-tight">{price}</span>
              </div>
              <p className="font-manrope text-xs text-zinc-500 mb-6">{unit}</p>

              <ul className="flex flex-col gap-2 mb-7">
                {perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm font-manrope text-zinc-300">
                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${
                      accent === "fuchsia" ? "bg-fuchsia-400" : accent === "purple" ? "bg-purple-400" : "bg-amber-400"
                    }`} />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className={`block w-full py-2.5 rounded-lg text-center text-sm font-manrope font-semibold transition-all ${
                  highlight
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white shadow-lg shadow-fuchsia-950/40"
                    : "bg-white/[0.05] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08]"
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center font-manrope text-xs text-zinc-600 mt-8">
          Artists earn 70% of every license fee. Royalties paid monthly when balance exceeds €50.
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative max-w-5xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl border border-white/[0.08] overflow-hidden p-12 sm:p-16 text-center">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/40 via-purple-950/30 to-zinc-950" />
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.04] rounded-full px-3 py-1 backdrop-blur-sm mb-6">
              <Zap className="w-3 h-3 text-fuchsia-400" />
              <span className="font-manrope text-[11px] tracking-widest text-zinc-300 uppercase font-medium">
                Beta access · No setup fees
              </span>
            </span>
            <h2
              className="font-raleway font-semibold tracking-tight leading-[0.95] mx-auto max-w-3xl"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", letterSpacing: "-0.02em" }}
            >
              Tonight&apos;s service starts in <span className="text-gradient">a single tap</span>.
            </h2>
            <p className="font-manrope text-zinc-400 mt-5 max-w-xl mx-auto">
              Join the artists and venues redefining what dining feels like. Set up takes ten minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white font-manrope font-semibold shadow-lg shadow-fuchsia-950/50 transition-all"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:hello@projectlumen.io"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-200 font-manrope font-semibold transition-all"
              >
                <Mail className="w-4 h-4" /> Talk to us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="logo-icon w-7 h-7 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-raleway font-semibold text-sm tracking-wide">Project Lumen</span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-manrope text-zinc-500">
            <Gem className="w-3 h-3 text-zinc-600" />
            <span className="tracking-widest uppercase">Artists &amp; venues. One licensing platform.</span>
            <Gem className="w-3 h-3 text-zinc-600" />
          </div>

          <div className="flex items-center gap-5 text-sm font-manrope text-zinc-500">
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-white transition-colors">Sign up</Link>
            <a href="mailto:hello@projectlumen.io" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <p className="text-center font-manrope text-[11px] text-zinc-600 pb-8">
          © {new Date().getFullYear()} Project Lumen. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
