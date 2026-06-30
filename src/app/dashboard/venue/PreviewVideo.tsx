"use client";

import { useRef } from "react";
import { Film } from "lucide-react";

interface PreviewVideoProps {
  src: string | null;
  poster: string | null;
  alt: string;
  className?: string;
  /**
   * "auto"  — autoplay a muted loop on mount (use for a single hero element).
   * "hover" — play on pointer enter, reset to the poster frame on leave.
   *
   * Note: when this sits behind decorative overlays, give those overlays
   * `pointer-events-none` so hover/play events still reach the video.
   */
  mode?: "auto" | "hover";
}

export default function PreviewVideo({
  src,
  poster,
  alt,
  className = "",
  mode = "hover",
}: PreviewVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  // No preview clip available → fall back to the static thumbnail/placeholder.
  if (!src) {
    return poster ? (
      <img src={poster} alt={alt} className={className} />
    ) : (
      <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
        <Film className="w-6 h-6 text-zinc-700" />
      </div>
    );
  }

  function handleEnter() {
    if (mode === "hover") ref.current?.play().catch(() => {});
  }
  function handleLeave() {
    if (mode !== "hover") return;
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0; // snap back to the poster frame
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      className={className}
      muted
      loop
      playsInline
      preload={mode === "auto" ? "auto" : "none"}
      autoPlay={mode === "auto"}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-label={alt}
    />
  );
}
