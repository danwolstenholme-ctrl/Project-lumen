"use client";

import { useEffect, useRef } from "react";

interface SyncedVideoProps {
  src: string | null;
  poster: string | null;
  /**
   * Wall-clock ms the show started — the SAME value broadcast to the tables
   * (TableCommand.timestamp). Playback is locked to (now - startedAt) mod
   * duration, so the operator's monitor shows the same frame the projectors do.
   */
  startedAt: number;
  muted: boolean;
  className?: string;
  alt: string;
}

const DRIFT_TOLERANCE = 0.4; // seconds before we re-seek to correct drift

export default function SyncedVideo({
  src,
  poster,
  startedAt,
  muted,
  className = "",
  alt,
}: SyncedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  // Keep the <video> position locked to the shared loop clock.
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;

    const expected = () => {
      const d = v.duration;
      if (!d || !isFinite(d)) return 0;
      const pos = (Date.now() - startedAt) / 1000;
      return ((pos % d) + d) % d; // handle clock skew / negative
    };
    const resync = () => {
      if (!v.duration || !isFinite(v.duration) || v.seeking) return;
      if (Math.abs(v.currentTime - expected()) > DRIFT_TOLERANCE) {
        v.currentTime = expected();
      }
    };
    const start = () => {
      resync();
      v.play().catch(() => {}); // muted autoplay is always allowed
    };

    v.addEventListener("loadedmetadata", start);
    if (v.readyState >= 1) start(); // metadata already available
    // Correct drift, and re-sync after the tab was backgrounded (which pauses).
    const interval = setInterval(resync, 2000);
    const onVisible = () => { if (!document.hidden) start(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      v.removeEventListener("loadedmetadata", start);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [src, startedAt]);

  // React can miss `muted` on updates — set it on the element directly.
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  if (!src) {
    return poster ? (
      <img src={poster} alt={alt} className={className} />
    ) : (
      <div className={`bg-zinc-900 ${className}`} />
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      className={className}
      muted={muted}
      loop
      playsInline
      preload="auto"
      aria-label={alt}
    />
  );
}
