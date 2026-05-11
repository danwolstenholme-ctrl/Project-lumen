"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, FileVideo, FileAudio, ImageIcon, Film } from "lucide-react";
import type { Details } from "./Step1Details";
import type { Uploads } from "./Step2Media";
import type { FileKey } from "./uploadHelpers";
import { formatBytes } from "./uploadHelpers";

interface Step3ConfirmProps {
  details: Details;
  uploads: Uploads;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

const fileLabels: Record<FileKey, { label: string; icon: React.ElementType; required: boolean }> = {
  thumbnail: { label: "Thumbnail Image", icon: ImageIcon, required: true },
  preview: { label: "Preview Clip", icon: Film, required: false },
  video: { label: "Full Show Video", icon: FileVideo, required: true },
  audio: { label: "Audio File", icon: FileAudio, required: false },
};

export default function Step3Confirm({ details, uploads, onSubmit, onBack, submitting }: Step3ConfirmProps) {
  const [checkedOriginal, setCheckedOriginal] = useState(false);
  const [checkedSpec, setCheckedSpec] = useState(false);
  const canSubmit = checkedOriginal && checkedSpec && !submitting;

  return (
    <div className="flex flex-col gap-7">
      {/* Show details summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="font-manrope text-xs text-zinc-500 uppercase tracking-widest font-medium">Show Details</p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="font-raleway text-base font-semibold text-white">{details.title}</p>
            {details.category && (
              <span className="inline-block mt-1 font-manrope text-[11px] text-zinc-400 uppercase tracking-widest border border-zinc-700 rounded px-2 py-0.5">
                {details.category}
              </span>
            )}
          </div>
          {details.description && (
            <p className="font-manrope text-xs text-zinc-400 leading-relaxed">{details.description}</p>
          )}
          {details.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {details.tags.map((t) => (
                <span key={t} className="font-manrope text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Files summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="font-manrope text-xs text-zinc-500 uppercase tracking-widest font-medium">Uploaded Files</p>
        </div>
        <div className="divide-y divide-zinc-900">
          {(Object.entries(fileLabels) as [FileKey, typeof fileLabels[FileKey]][]).map(([key, { label, icon: Icon, required }]) => {
            const state = uploads[key];
            const uploaded = state.status === "done";
            return (
              <div key={key} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800 border border-zinc-700"}`}>
                  <Icon className={`w-4 h-4 ${uploaded ? "text-emerald-400" : "text-zinc-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-manrope text-sm font-medium ${uploaded ? "text-zinc-200" : "text-zinc-500"}`}>
                    {label}
                    {required && !uploaded && <span className="text-red-400 ml-1">*</span>}
                    {!required && !uploaded && <span className="text-zinc-600 ml-1 text-xs font-normal">optional</span>}
                  </p>
                  {uploaded && state.file && (
                    <p className="font-manrope text-[11px] text-zinc-500 truncate">
                      {state.file.name} · {formatBytes(state.file.size)}
                    </p>
                  )}
                </div>
                {uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="font-manrope text-xs text-zinc-600">Not uploaded</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-3">
        {[
          {
            id: "original",
            checked: checkedOriginal,
            set: setCheckedOriginal,
            label: "I confirm this content is original and I own all rights to the visuals, audio, and any included elements.",
          },
          {
            id: "spec",
            checked: checkedSpec,
            set: setCheckedSpec,
            label: "I confirm this content meets the Project Lumen technical specification (3840×2160, 60fps, seamless loop, sRGB).",
          },
        ].map(({ id, checked, set, label }) => (
          <label key={id} className="flex items-start gap-3 cursor-pointer group">
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => set(!checked)}
              className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                checked
                  ? "bg-fuchsia-600 border-fuchsia-600"
                  : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-500"
              }`}
            >
              {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
            </button>
            <span className="font-manrope text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-manrope font-medium text-sm hover:border-zinc-700 hover:text-white transition-all disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-manrope font-semibold text-sm shadow-lg shadow-fuchsia-950/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            "Submit for Review"
          )}
        </button>
      </div>
    </div>
  );
}
