import { Monitor, Lightbulb } from "lucide-react";

const specs = [
  { label: "Canvas", value: "3840 × 2160px (4K UHD)" },
  { label: "Aspect ratio", value: "16:9" },
  { label: "Frame rate", value: "60fps" },
  { label: "Format", value: "H.264 or H.265 (.mp4)" },
  { label: "Duration", value: "60 seconds minimum, seamless loop" },
  { label: "Audio", value: "Stereo AAC or WAV, 48kHz" },
  { label: "Safe zone", value: "80px from all edges" },
  { label: "Colour space", value: "sRGB" },
  { label: "Max file size", value: "4GB" },
];

const physical = [
  { label: "Physical table", value: "160 × 90cm" },
  { label: "Pixel ratio", value: "1cm = 24px" },
  { label: "Projector height", value: "80cm above surface" },
];

export default function SpecPanel() {
  return (
    <div className="px-7 py-8 flex flex-col gap-7">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
          <Monitor className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <h2 className="font-raleway text-sm font-semibold text-white tracking-wide">
          Technical Specification
        </h2>
      </div>

      {/* Video specs */}
      <div className="flex flex-col gap-1">
        <p className="font-manrope text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">
          Video &amp; Audio
        </p>
        {specs.map(({ label, value }) => (
          <div key={label} className="flex flex-col py-2 border-b border-zinc-900 last:border-0">
            <span className="font-manrope text-[11px] text-zinc-500">{label}</span>
            <span className="font-manrope text-xs text-zinc-200 font-medium mt-0.5">{value}</span>
          </div>
        ))}
      </div>

      {/* Physical specs */}
      <div className="flex flex-col gap-1">
        <p className="font-manrope text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">
          Physical Table
        </p>
        {physical.map(({ label, value }) => (
          <div key={label} className="flex flex-col py-2 border-b border-zinc-900 last:border-0">
            <span className="font-manrope text-[11px] text-zinc-500">{label}</span>
            <span className="font-manrope text-xs text-zinc-200 font-medium mt-0.5">{value}</span>
          </div>
        ))}
      </div>

      {/* Design tip callout */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-manrope text-[11px] font-semibold text-amber-400 uppercase tracking-widest">
            Design Tip
          </span>
        </div>
        <p className="font-manrope text-xs text-amber-200/70 leading-relaxed">
          Content is viewed from above by seated diners. Compositions that read from a top-down perspective — ocean floor, forest canopy, particle fields, abstract textures — perform significantly better than landscape or cinematic formats.
        </p>
      </div>

      {/* Version note */}
      <p className="font-manrope text-[10px] text-zinc-600 leading-relaxed">
        Spec v1.2 · Last updated May 2026. Ensure your export settings match before uploading.
      </p>
    </div>
  );
}
