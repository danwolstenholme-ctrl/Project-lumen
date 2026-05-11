"use client";

import { useState } from "react";
import { Check, X, Film, Loader2, ExternalLink, ChevronDown, ChevronUp, Play } from "lucide-react";
import { toast } from "@/utils/toast";

interface Show {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  video_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  artist: { clerk_id: string; name: string | null; slug: string | null; avatar_url: string | null } | null;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminShows({ initialShows }: { initialShows: Show[] }) {
  const [shows, setShows] = useState(initialShows);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  async function approve(show: Show) {
    setBusy(show.id);
    try {
      const res = await fetch(`/api/admin/shows/${show.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (!res.ok) throw new Error();
      setShows((prev) => prev.filter((s) => s.id !== show.id));
      toast.success(`${show.title} approved`);
    } catch {
      toast.error("Couldn't approve show");
    } finally {
      setBusy(null);
    }
  }

  async function reject(show: Show) {
    if (!rejectionReason.trim()) {
      toast.error("Provide a rejection reason so the artist knows what to fix");
      return;
    }
    setBusy(show.id);
    try {
      const res = await fetch(`/api/admin/shows/${show.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejection_reason: rejectionReason.trim() }),
      });
      if (!res.ok) throw new Error();
      setShows((prev) => prev.filter((s) => s.id !== show.id));
      toast.success(`${show.title} rejected`);
      setShowRejectFor(null);
      setRejectionReason("");
    } catch {
      toast.error("Couldn't reject show");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Review Queue</h1>
        <p className="font-manrope text-sm text-zinc-500 mt-1">
          {shows.length} {shows.length === 1 ? "show" : "shows"} awaiting review · approve to publish to all venues, reject with a reason for the artist.
        </p>
      </div>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold text-lg">Queue clear</p>
            <p className="font-manrope text-sm text-zinc-500 mt-1">No shows are waiting for review.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shows.map((show) => {
            const expanded = expandedId === show.id;
            const rejecting = showRejectFor === show.id;
            return (
              <div
                id={show.id}
                key={show.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden"
              >
                <div className="flex items-start gap-4 p-5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : show.id)}
                    className="w-32 h-20 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative group"
                  >
                    {show.thumbnail_url ? (
                      <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-zinc-400 dark:text-zinc-600" /></div>
                    )}
                    {show.preview_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-raleway font-semibold text-zinc-900 dark:text-white">{show.title}</h3>
                      {show.category && (
                        <span className="font-manrope text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5">
                          {show.category}
                        </span>
                      )}
                    </div>
                    <p className="font-manrope text-xs text-zinc-500 mt-1">
                      by{" "}
                      {show.artist?.slug ? (
                        <a href={`/artists/${show.artist.slug}`} target="_blank" rel="noopener" className="text-fuchsia-500 hover:text-fuchsia-400 transition-colors inline-flex items-center gap-1">
                          {show.artist.name} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        show.artist?.name ?? "Unknown"
                      )}
                      <span className="text-zinc-400 dark:text-zinc-600"> · submitted {fmtDate(show.created_at)}</span>
                    </p>
                    {show.description && (
                      <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{show.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => approve(show)}
                      disabled={busy === show.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-sm font-manrope font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {busy === show.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowRejectFor(show.id); setRejectionReason(""); }}
                      disabled={busy === show.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-sm font-manrope font-medium hover:border-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : show.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-xs font-manrope"
                    >
                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {expanded ? "Less" : "Preview"}
                    </button>
                  </div>
                </div>

                {/* Inline reject reason */}
                {rejecting && (
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 bg-red-500/[0.04]">
                    <label className="font-manrope text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                      Rejection reason (sent to artist)
                    </label>
                    <div className="flex items-start gap-2 mt-2">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        placeholder="e.g. Video resolution is 1920×1080. We require exactly 3840×2160."
                        aria-label="Rejection reason"
                        title="Rejection reason"
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 resize-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => reject(show)}
                        disabled={busy === show.id || !rejectionReason.trim()}
                        className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm font-manrope font-semibold hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                      >
                        {busy === show.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm reject"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowRejectFor(null); setRejectionReason(""); }}
                        className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-manrope transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded preview */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {show.preview_url ? (
                        <div className="rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                          <video src={show.preview_url} controls className="w-full h-full" />
                        </div>
                      ) : show.thumbnail_url ? (
                        <img src={show.thumbnail_url} alt={show.title} className="rounded-lg w-full aspect-video object-cover" />
                      ) : (
                        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 aspect-video flex items-center justify-center">
                          <Film className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        {show.description && (
                          <div>
                            <p className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Description</p>
                            <p className="font-manrope text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{show.description}</p>
                          </div>
                        )}
                        {show.video_url && (
                          <div>
                            <p className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Source video</p>
                            <a
                              href={show.video_url}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex items-center gap-1.5 font-mono text-xs text-fuchsia-500 hover:text-fuchsia-400 break-all"
                            >
                              {show.video_url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
