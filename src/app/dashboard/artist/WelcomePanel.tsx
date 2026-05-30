"use client";

import Link from "next/link";
import { Check, ArrowRight, Users, Store, Film } from "lucide-react";

interface PlatformStats {
  artists: number;
  venues: number;
  publishedPieces: number;
}

interface Props {
  artistName: string;
  hasSlug: boolean;
  platformStats: PlatformStats;
}

export default function WelcomePanel({ artistName, hasSlug, platformStats }: Props) {
  const firstName = artistName.split(" ")[0] || "there";

  const steps = [
    { done: true,    label: "Account created" },
    { done: hasSlug, label: "Complete your public profile", href: "/dashboard/artist/settings", ctaLabel: "Set up profile" },
    { done: false,   label: "Upload your first piece",      href: "/dashboard/artist/upload",   ctaLabel: "Upload now" },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="relative mb-8 p-8 rounded-2xl overflow-hidden border border-fuchsia-200/40 dark:border-fuchsia-500/20 bg-white dark:bg-zinc-900/40">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50/80 via-purple-50/40 to-transparent dark:from-fuchsia-950/30 dark:via-purple-950/15 dark:to-transparent pointer-events-none" />
      {/* Blob */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-500/15 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Headline */}
        <div className="mb-6">
          <h2 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Welcome, {firstName}. Your studio is live.
          </h2>
          <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md leading-relaxed">
            Lumen connects motion artists with luxury venues. Your work, projected onto every table.
          </p>
        </div>

        {/* Platform stats */}
        <div className="flex items-center flex-wrap gap-x-6 gap-y-3 mb-6 pb-6 border-b border-zinc-200/60 dark:border-zinc-700/40">
          <PlatformStat icon={Users} label={platformStats.artists === 1 ? "artist" : "artists"} value={platformStats.artists} />
          <PlatformStat icon={Store} label={platformStats.venues === 1 ? "venue" : "venues"} value={platformStats.venues} />
          <PlatformStat icon={Film}  label={platformStats.publishedPieces === 1 ? "published piece" : "published pieces"} value={platformStats.publishedPieces} />
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          <p className="font-manrope text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-1">
            {remaining === 0
              ? "You're all set"
              : `Get on a table — ${remaining} step${remaining > 1 ? "s" : ""} left`}
          </p>
          {steps.map((step, i) => (
            <StepRow key={i} {...step} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformStat({
  icon: Icon, label, value,
}: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400 shrink-0" />
      <span className="font-raleway text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{value}</span>
      <span className="font-manrope text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function StepRow({
  done, label, href, ctaLabel,
}: { done: boolean; label: string; href?: string; ctaLabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          done
            ? "bg-emerald-500/20 border border-emerald-500/40"
            : "border-2 border-zinc-300 dark:border-zinc-600"
        }`}
      >
        {done && <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" strokeWidth={3} />}
      </div>
      <span
        className={`font-manrope text-sm flex-1 ${
          done
            ? "text-zinc-500 dark:text-zinc-500 line-through decoration-zinc-400/50"
            : "text-zinc-900 dark:text-white"
        }`}
      >
        {label}
      </span>
      {!done && href && ctaLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-manrope font-semibold text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-300 transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
