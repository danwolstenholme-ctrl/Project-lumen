"use client";

import { useEffect, useRef } from "react";
import { X, Play, MonitorPlay } from "lucide-react";
import type { Show } from "./types";

interface ShowExpandModalProps {
  show: Show;
  selectedCount: number;
  onClose: () => void;
  onPlay: () => void;
}

export default function ShowExpandModal({ show, selectedCount, onClose, onPlay }: ShowExpandModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay preview on open
  useEffect(() => {
    if (videoRef.current && show.preview_url) {
      videoRef.current.play().catch(() => {});
    }
    // Trap focus / handle escape
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show.preview_url, onClose]);

  const canPlay = selectedCount > 0;

  return (
    /* Full overlay */
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg mx-6 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 active:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Preview / thumbnail */}
        <div className="relative aspect-video bg-zinc-900">
          {show.preview_url ? (
            <video
              ref={videoRef}
              src={show.preview_url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          ) : show.thumbnail_url ? (
            <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MonitorPlay className="w-12 h-12 text-zinc-700" />
            </div>
          )}
          {show.preview_url && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
              <Play className="w-3 h-3 text-fuchsia-400 fill-fuchsia-400" />
              <span className="font-manrope text-[10px] text-zinc-300">10s preview</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p
              className="font-raleway font-semibold text-white text-xl leading-tight"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              {show.title}
            </p>
            {show.artist_name && (
              <p className="font-manrope text-sm text-zinc-400 mt-1">{show.artist_name}</p>
            )}
            {show.category && (
              <span className="inline-block mt-2 font-manrope text-[11px] uppercase tracking-widest text-zinc-400 border border-zinc-700 rounded px-2.5 py-0.5">
                {show.category}
              </span>
            )}
          </div>

          {show.description && (
            <p className="font-manrope text-sm text-zinc-400 leading-relaxed line-clamp-3">
              {show.description}
            </p>
          )}

          {/* Play button */}
          <button
            type="button"
            onClick={canPlay ? onPlay : undefined}
            className={`w-full py-4 rounded-xl text-base font-manrope font-bold tracking-wide transition-all flex items-center justify-center gap-3 ${
              canPlay
                ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-950/60 active:scale-[0.98]"
                : "bg-zinc-800 text-zinc-500 cursor-default"
            }`}
            style={{ minHeight: 56 }}
          >
            <MonitorPlay className="w-5 h-5" />
            {canPlay
              ? `Play on ${selectedCount} ${selectedCount === 1 ? "Table" : "Tables"}`
              : "Select a table first"}
          </button>
        </div>
      </div>
    </div>
  );
}
