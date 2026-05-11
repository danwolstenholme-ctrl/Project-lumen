"use client";

import { useState, useTransition } from "react";
import { Search, Film, CheckCircle2, Loader2, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { toast } from "./toast";

interface Show {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  artist_id: string;
  users?: { name: string | null } | null;
}

interface ShowLibraryProps {
  shows: Show[];
  licensedShowIds: string[];
  venueUserId: string;
}

const categoryColors: Record<string, string> = {
  ambient:    "text-purple-400 bg-purple-400/10 border-purple-400/20",
  immersive:  "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20",
  nature:     "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  abstract:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  cinematic:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

function categoryClass(cat: string | null) {
  return cat ? (categoryColors[cat.toLowerCase()] ?? "text-zinc-500 bg-zinc-400/10 border-zinc-400/20") : "text-zinc-500 bg-zinc-400/10 border-zinc-400/20";
}

export default function ShowLibrary({ shows, licensedShowIds, venueUserId }: ShowLibraryProps) {
  const [query, setQuery] = useState("");
  const [licensed, setLicensed] = useState(new Set(licensedShowIds));
  const [licensing, setLicensing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = shows.filter((s) =>
    !query ||
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    (s.category ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (s.users?.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  async function licenseShow(showId: string) {
    setLicensing(showId);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => {
        setLicensed((prev) => new Set([...prev, showId]));
      });
      toast.success("Show licensed successfully");
    } catch {
      toast.error("Failed to license show. Please try again.");
    } finally {
      setLicensing(null);
    }
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Show Library
          </h1>
          <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Browse and license immersive shows for your venue
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-manrope text-zinc-500">
            {shows.length} {shows.length === 1 ? "show" : "shows"} available
          </span>
          <Link
            href="/dashboard/venue/control"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-manrope font-medium text-zinc-600 dark:text-zinc-300 hover:border-fuchsia-500/40 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <MonitorPlay className="w-4 h-4 text-fuchsia-400" />
            Open Control Panel
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Search shows, artists, categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Film className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
          </div>
          <div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold text-lg">
              {query ? "No shows match your search" : "No shows yet"}
            </p>
            <p className="font-manrope text-sm text-zinc-500 mt-1 max-w-xs">
              {query
                ? "Try a different search term."
                : "Artists are uploading new shows. Check back soon."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((show) => {
            const isLicensed = licensed.has(show.id);
            const isLoading = licensing === show.id;
            return (
              <div
                key={show.id}
                className="group relative flex flex-col rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {show.thumbnail_url ? (
                    <img
                      src={show.thumbnail_url}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                      <Film className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    </div>
                  )}
                  {show.category && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-block text-[10px] font-manrope font-medium uppercase tracking-widest px-2 py-0.5 rounded border ${categoryClass(show.category)}`}>
                        {show.category}
                      </span>
                    </div>
                  )}
                  {isLicensed && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-3 p-4 flex-1">
                  <div>
                    <h3 className="font-raleway font-semibold text-zinc-900 dark:text-white text-sm leading-snug line-clamp-1">
                      {show.title}
                    </h3>
                    {show.users?.name && (
                      <p className="font-manrope text-xs text-zinc-500 mt-0.5">
                        {show.users.name}
                      </p>
                    )}
                  </div>
                  {show.description && (
                    <p className="font-manrope text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 flex-1">
                      {show.description}
                    </p>
                  )}

                  <button
                    onClick={() => !isLicensed && licenseShow(show.id)}
                    disabled={isLicensed || isLoading}
                    className={`mt-auto w-full py-2 rounded-lg text-xs font-manrope font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isLicensed
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 cursor-default"
                        : "bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-lg shadow-fuchsia-950/40 disabled:opacity-50"
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Licensing…</>
                    ) : isLicensed ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Licensed</>
                    ) : (
                      "License Show"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
