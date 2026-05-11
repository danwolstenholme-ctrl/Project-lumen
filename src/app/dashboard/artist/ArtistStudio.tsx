"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Film, Upload, CheckCircle2, Clock, AlertCircle, TrendingUp,
  BadgeCheck, ExternalLink, DollarSign, Store, Pencil, X, Check,
  Sparkles, BarChart2, XCircle,
} from "lucide-react";
import { toast } from "@/utils/toast";

interface Show {
  id: string;
  title: string;
  category: string | null;
  thumbnail_url: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  rejection_reason: string | null;
  featured: boolean | null;
  created_at: string;
}

interface ArtistStudioProps {
  shows: Show[];
  licenseCounts: Record<string, number>;
  earningsPerShow: Record<string, number>;
  totalEarnings: number;
  monthEarnings: number;
  activeVenues: number;
  userName: string;
  userImage: string | null;
  slug: string | null;
  bio: string | null;
  verified: boolean;
}

const statusConfig = {
  published: { label: "Published", icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  pending:   { label: "In Review", icon: Clock,         cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  draft:     { label: "Draft",     icon: AlertCircle,   cls: "text-zinc-500 bg-zinc-400/10 border-zinc-400/20" },
  rejected:  { label: "Rejected",  icon: XCircle,       cls: "text-red-400 bg-red-400/10 border-red-400/20" },
};

function fmt(n: number) {
  return `€${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function ArtistStudio({
  shows, licenseCounts, earningsPerShow,
  totalEarnings, monthEarnings, activeVenues,
  userName, userImage, slug, bio: initialBio, verified,
}: ArtistStudioProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(initialBio ?? "");
  const [savingBio, setSavingBio] = useState(false);

  const totalLicenses = Object.values(licenseCounts).reduce((a, b) => a + b, 0);

  async function saveBio() {
    setSavingBio(true);
    try {
      const res = await fetch("/api/artist/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput }),
      });
      if (!res.ok) throw new Error();
      setBio(bioInput);
      setEditingBio(false);
      toast.success("Bio updated");
    } catch {
      toast.error("Failed to save bio");
    } finally {
      setSavingBio(false);
    }
  }

  const stats = [
    { label: "Total Shows",    value: shows.length,       icon: Film,       color: "text-fuchsia-400" },
    { label: "Total Licenses", value: totalLicenses,      icon: TrendingUp, color: "text-purple-400" },
    { label: "Active Venues",  value: activeVenues,       icon: Store,      color: "text-blue-400" },
    { label: "This Month",     value: fmt(monthEarnings), icon: DollarSign, color: "text-emerald-400" },
  ];

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">

      {/* Artist Header */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <div className="shrink-0">
          {userImage ? (
            <img src={userImage} alt={userName} className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center">
              <span className="font-raleway text-xl font-bold text-zinc-500 dark:text-zinc-300">{userName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-raleway text-xl font-semibold text-zinc-900 dark:text-white">{userName}</h1>
            {verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-manrope font-semibold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/20 px-2 py-0.5 rounded">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-start gap-2">
            {editingBio ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  maxLength={160}
                  placeholder="One-line bio…"
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
                <button type="button" title="Save bio" onClick={saveBio} disabled={savingBio} className="p-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-colors disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" title="Cancel" onClick={() => { setEditingBio(false); setBioInput(bio); }} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 flex-1">{bio || "Add a one-line bio…"}</p>
                <button type="button" title="Edit bio" onClick={() => setEditingBio(true)} className="shrink-0 p-1 text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {slug && (
              <Link
                href={`/artists/${slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-manrope text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-400 dark:hover:text-fuchsia-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View your public profile
              </Link>
            )}
            <Link
              href="/dashboard/artist/earnings"
              className="inline-flex items-center gap-1.5 text-xs font-manrope text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="font-semibold text-zinc-900 dark:text-white">{fmt(totalEarnings)}</span> earned total
            </Link>
          </div>
        </div>

        <Link
          href="/dashboard/artist/upload"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-manrope font-semibold shadow-lg shadow-fuchsia-950/40 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Show
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-raleway text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
              <p className="font-manrope text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shows list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-raleway text-base font-semibold text-zinc-900 dark:text-white">Your Shows</h2>
      </div>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Film className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
          </div>
          <div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold text-lg">No shows yet</p>
            <p className="font-manrope text-sm text-zinc-500 mt-1 max-w-xs">
              Upload your first immersive show and start licensing to venues worldwide.
            </p>
          </div>
          <Link
            href="/dashboard/artist/upload"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-sm font-manrope font-semibold shadow-lg shadow-fuchsia-950/40 hover:from-fuchsia-500 hover:to-purple-500 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload your first show
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shows.map((show) => {
            const cfg = statusConfig[show.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const licenses = licenseCounts[show.id] ?? 0;
            const earned = earningsPerShow[show.id] ?? 0;
            return (
              <div key={show.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="w-20 h-[52px] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  {show.thumbnail_url ? (
                    <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-raleway font-semibold text-zinc-900 dark:text-white text-sm truncate">{show.title}</h3>
                    {show.featured && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-manrope font-semibold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/20 px-1.5 py-0.5 rounded shrink-0">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                  </div>
                  {show.category && (
                    <span className="font-manrope text-[10px] text-zinc-500 uppercase tracking-widest">{show.category}</span>
                  )}
                  {show.status === "rejected" && show.rejection_reason && (
                    <p className="font-manrope text-xs text-red-400 mt-0.5 line-clamp-1">
                      Rejected: {show.rejection_reason}
                    </p>
                  )}
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-manrope font-medium shrink-0 ${cfg.cls}`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </div>

                <div className="flex flex-col items-end gap-0.5 shrink-0 w-28">
                  <span className="font-manrope text-xs text-zinc-500 dark:text-zinc-400">
                    {licenses} {licenses === 1 ? "venue" : "venues"}
                  </span>
                  <span className="font-manrope text-xs text-emerald-500 dark:text-emerald-400 font-semibold">{fmt(earned)}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {show.status === "published" && (
                    <Link
                      href={`/dashboard/artist/boost?show=${show.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-[11px] font-manrope font-semibold hover:bg-amber-500/20 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Boost
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/artist/analytics?show=${show.id}`}
                    className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="View Analytics"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                  {show.status === "draft" && (
                    <Link
                      href={`/dashboard/artist/upload?edit=${show.id}`}
                      className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
