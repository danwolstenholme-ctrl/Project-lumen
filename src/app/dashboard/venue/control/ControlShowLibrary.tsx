"use client";

import { useRef } from "react";
import { Search, Film, Sparkles, Trophy } from "lucide-react";
import type { Show } from "./types";
import ShowExpandModal from "./ShowExpandModal";

const CATEGORIES = ["All", "Ocean", "Fire", "Abstract", "Forest", "Space", "Seasonal"];

const categoryAccent: Record<string, string> = {
  Ocean: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Fire: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Abstract: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Forest: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Space: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Seasonal: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Custom: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

function chipClass(cat: string | null) {
  return cat ? (categoryAccent[cat] ?? categoryAccent.Custom) : categoryAccent.Custom;
}

interface ControlShowLibraryProps {
  shows: Show[];
  searchQuery: string;
  activeCategory: string;
  expandedShowId: string | null;
  selectedCount: number;
  onSearchChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
  onExpandShow: (id: string | null) => void;
  onPlayOnSelected: (showId: string) => void;
}

export default function ControlShowLibrary({
  shows, searchQuery, activeCategory, expandedShowId, selectedCount,
  onSearchChange, onCategoryChange, onExpandShow, onPlayOnSelected,
}: ControlShowLibraryProps) {
  const expandedShow = expandedShowId ? shows.find((s) => s.id === expandedShowId) ?? null : null;

  const filtered = shows
    .filter((s) => {
      const matchCat = activeCategory === "all" || activeCategory === "All" || (s.category ?? "").toLowerCase() === activeCategory.toLowerCase();
      const matchQ = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.artist_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    })
    .sort((a, b) => {
      // Featured shows first, then artist-of-month
      const aScore = (a.featured ? 2 : 0) + (a.artist_of_month ? 1 : 0);
      const bScore = (b.featured ? 2 : 0) + (b.artist_of_month ? 1 : 0);
      return bScore - aScore;
    });

  return (
    <div className="flex flex-col h-full relative">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <p className="font-raleway font-semibold text-white text-base shrink-0" style={{ fontFamily: "var(--font-raleway)" }}>
          Show Library
        </p>
        {/* Search */}
        <div className="relative max-w-[220px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-manrope text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto scrollbar-none shrink-0">
        {CATEGORIES.map((cat) => {
          const active = cat === "All" ? activeCategory === "all" || activeCategory === "All" : activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat === "All" ? "all" : cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-manrope font-medium border transition-colors ${
                active
                  ? "bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 active:bg-zinc-800"
              }`}
              style={{ minHeight: 32 }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Film className="w-8 h-8 text-zinc-700" />
            <p className="font-raleway font-semibold text-zinc-500 text-base" style={{ fontFamily: "var(--font-raleway)" }}>
              {searchQuery ? "No results" : "No licensed shows"}
            </p>
            <p className="font-manrope text-xs text-zinc-600 max-w-[200px]">
              {searchQuery ? "Try a different search term" : "Visit the Show Library to license shows for your venue"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 pt-1">
            {filtered.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onTap={() => onExpandShow(show.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded modal */}
      {expandedShow && (
        <ShowExpandModal
          show={expandedShow}
          selectedCount={selectedCount}
          onClose={() => onExpandShow(null)}
          onPlay={() => onPlayOnSelected(expandedShow.id)}
        />
      )}
    </div>
  );
}

function ShowCard({ show, onTap }: { show: Show; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="group relative rounded-xl overflow-hidden border border-zinc-800 active:scale-[0.97] transition-transform text-left"
      style={{ minHeight: 44 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900">
        {show.thumbnail_url ? (
          <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-6 h-6 text-zinc-700" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Badges top row */}
        <div className="absolute top-2 left-2 right-2 flex items-center gap-1 flex-wrap">
          {show.featured && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-manrope font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border text-fuchsia-400 bg-fuchsia-400/15 border-fuchsia-400/30">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {show.artist_of_month && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-manrope font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border text-amber-400 bg-amber-400/15 border-amber-400/30">
              <Trophy className="w-2.5 h-2.5" />
            </span>
          )}
          {show.category && !show.featured && !show.artist_of_month && (
            <span className={`text-[9px] font-manrope font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${chipClass(show.category)}`}>
              {show.category}
            </span>
          )}
        </div>

        {/* Title / artist bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-4">
          <p
            className="font-raleway font-semibold text-white text-xs leading-tight line-clamp-1"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {show.title}
          </p>
          {show.artist_name && (
            <p className="font-manrope text-[10px] text-zinc-400 mt-0.5 truncate">{show.artist_name}</p>
          )}
        </div>
      </div>
    </button>
  );
}
