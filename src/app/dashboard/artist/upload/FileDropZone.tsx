"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2, X, FileVideo, FileAudio, ImageIcon } from "lucide-react";
import type { FileKey } from "./uploadHelpers";
import { formatBytes } from "./uploadHelpers";

export type UploadStatus = "idle" | "validating" | "uploading" | "done" | "error";

export interface UploadState {
  file: File | null;
  status: UploadStatus;
  progress: number;
  url: string | null;
  error: string | null;
  localPreview: string | null;
}

export const defaultUploadState: UploadState = {
  file: null, status: "idle", progress: 0, url: null, error: null, localPreview: null,
};

interface FileDropZoneProps {
  fileKey: FileKey;
  label: string;
  accept: string;
  hint: string;
  state: UploadState;
  onFileSelect: (key: FileKey, file: File) => void;
  onClear: (key: FileKey) => void;
  showPreview?: boolean;
  previewType?: "image" | "video";
}

export default function FileDropZone({
  fileKey, label, accept, hint, state, onFileSelect, onClear, showPreview, previewType,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(fileKey, file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(fileKey, file);
    e.target.value = "";
  }

  const isActive = state.status !== "idle";
  const hasError = state.status === "error";
  const isDone = state.status === "done";
  const isUploading = state.status === "uploading" || state.status === "validating";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-manrope text-sm font-medium text-zinc-300">{label}</label>
        {isDone && (
          <button
            type="button"
            onClick={() => onClear(fileKey)}
            className="flex items-center gap-1 text-xs font-manrope text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-3 h-3" /> Replace
          </button>
        )}
      </div>

      <div
        className={`relative rounded-xl border transition-all ${
          dragging
            ? "border-fuchsia-500/60 bg-fuchsia-500/5"
            : isDone
            ? "border-emerald-500/30 bg-emerald-500/5"
            : hasError
            ? "border-red-500/40 bg-red-500/5"
            : isActive
            ? "border-zinc-700 bg-zinc-900/80"
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
        } ${!isActive && !isDone ? "cursor-pointer" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => { if (!isActive && !isDone) inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />

        {/* Empty state */}
        {!isActive && !isDone && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              {fileKey === "thumbnail" ? <ImageIcon className="w-5 h-5 text-zinc-400" /> :
               fileKey === "audio" ? <FileAudio className="w-5 h-5 text-zinc-400" /> :
               <FileVideo className="w-5 h-5 text-zinc-400" />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="font-manrope text-sm text-zinc-300">
                <span className="text-fuchsia-400 font-medium">Click to browse</span> or drag and drop
              </p>
              <p className="font-manrope text-xs text-zinc-500">{hint}</p>
            </div>
            <Upload className="w-4 h-4 text-zinc-600 ml-auto shrink-0" />
          </div>
        )}

        {/* Validating state */}
        {state.status === "validating" && (
          <div className="flex items-center gap-3 px-5 py-4">
            <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin shrink-0" />
            <div>
              <p className="font-manrope text-sm text-zinc-300">Validating…</p>
              <p className="font-manrope text-xs text-zinc-500 truncate max-w-xs">{state.file?.name}</p>
            </div>
          </div>
        )}

        {/* Uploading state */}
        {state.status === "uploading" && (
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin shrink-0" />
                <div>
                  <p className="font-manrope text-sm text-zinc-300 truncate max-w-[220px]">{state.file?.name}</p>
                  <p className="font-manrope text-xs text-zinc-500">{formatBytes(state.file?.size ?? 0)}</p>
                </div>
              </div>
              <span className="font-manrope text-sm font-semibold text-fuchsia-400 tabular-nums">{state.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="flex items-center gap-4 px-5 py-3">
            {/* Preview */}
            {showPreview && state.localPreview && (
              <div className="w-16 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                {previewType === "image" ? (
                  <img src={state.localPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={state.localPreview} className="w-full h-full object-cover" muted />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-manrope text-sm text-zinc-200 truncate">{state.file?.name}</p>
              <p className="font-manrope text-xs text-zinc-500">{formatBytes(state.file?.size ?? 0)}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-start gap-3 px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-manrope text-sm font-medium text-red-300">Validation failed</p>
              <p className="font-manrope text-xs text-red-400/80 mt-0.5 leading-relaxed">{state.error}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="mt-2 font-manrope text-xs text-fuchsia-400 hover:text-fuchsia-300 underline transition-colors"
              >
                Try a different file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
