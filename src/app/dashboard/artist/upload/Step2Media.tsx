"use client";

import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import FileDropZone from "./FileDropZone";
import type { UploadState, UploadStatus } from "./FileDropZone";
import type { FileKey } from "./uploadHelpers";

export type Uploads = Record<FileKey, UploadState>;

interface Step2MediaProps {
  uploads: Uploads;
  onFileSelect: (key: FileKey, file: File) => void;
  onClear: (key: FileKey) => void;
  onNext: () => void;
  onBack: () => void;
}

const terminalStatuses: UploadStatus[] = ["done", "error", "idle"];

export default function Step2Media({ uploads, onFileSelect, onClear, onNext, onBack }: Step2MediaProps) {
  const allRequired: FileKey[] = ["thumbnail", "video"];
  const allDone = allRequired.every((k) => uploads[k].status === "done");
  const anyUploading = (Object.keys(uploads) as FileKey[]).some(
    (k) => !terminalStatuses.includes(uploads[k].status)
  );

  return (
    <div className="flex flex-col gap-7">
      {/* 60fps notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="font-manrope text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300 font-medium">Frame rate cannot be verified automatically.</span> Please confirm your export is set to exactly 60fps before uploading. Shows encoded at lower frame rates will be rejected during review.
        </p>
      </div>

      {/* Thumbnail */}
      <FileDropZone
        fileKey="thumbnail"
        label="Thumbnail Image *"
        accept="image/jpeg,image/png"
        hint="JPG or PNG · min 1920×1080px"
        state={uploads.thumbnail}
        onFileSelect={onFileSelect}
        onClear={onClear}
        showPreview
        previewType="image"
      />

      {/* Preview clip */}
      <FileDropZone
        fileKey="preview"
        label="Preview Clip"
        accept="video/mp4,.mp4"
        hint=".mp4 · max 30 seconds · optional"
        state={uploads.preview}
        onFileSelect={onFileSelect}
        onClear={onClear}
        showPreview
        previewType="video"
      />

      {/* Full show video */}
      <div className="flex flex-col gap-1">
        <FileDropZone
          fileKey="video"
          label="Full Show Video *"
          accept="video/mp4,.mp4"
          hint=".mp4 (H.264 or H.265) · 3840×2160 · 60fps · max 4GB"
          state={uploads.video}
          onFileSelect={onFileSelect}
          onClear={onClear}
        />
        <p className="font-manrope text-[11px] text-zinc-600 px-1">
          Resolution is validated automatically. Your video must be exactly 3840×2160px.
        </p>
      </div>

      {/* Audio */}
      <FileDropZone
        fileKey="audio"
        label="Audio File"
        accept=".wav,.aac,.m4a,audio/wav,audio/aac,audio/mp4"
        hint="WAV or AAC · Stereo · 48kHz · optional"
        state={uploads.audio}
        onFileSelect={onFileSelect}
        onClear={onClear}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-manrope font-medium text-sm hover:border-zinc-700 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!allDone || anyUploading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-manrope font-semibold text-sm shadow-lg shadow-fuchsia-950/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {anyUploading ? "Uploading…" : "Review & Submit"}
          {!anyUploading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
