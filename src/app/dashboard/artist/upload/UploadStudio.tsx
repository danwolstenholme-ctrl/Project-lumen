"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "@/app/dashboard/venue/toast";
import type { Details } from "./Step1Details";
import type { Uploads } from "./Step2Media";
import type { FileKey } from "./uploadHelpers";
import { validate, uploadWithProgress } from "./uploadHelpers";
import { defaultUploadState } from "./FileDropZone";
import Step1Details from "./Step1Details";
import Step2Media from "./Step2Media";
import Step3Confirm from "./Step3Confirm";
import SpecPanel from "./SpecPanel";

const STEPS = [
  { n: 1, label: "Show Details" },
  { n: 2, label: "Media Upload" },
  { n: 3, label: "Confirm & Submit" },
];

interface UploadStudioProps {
  userId: string;
}

export default function UploadStudio({ userId }: UploadStudioProps) {
  const router = useRouter();
  const [showId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [details, setDetails] = useState<Details>({
    title: "", description: "", category: "", tags: [],
  });

  const [uploads, setUploads] = useState<Uploads>({
    thumbnail: { ...defaultUploadState },
    preview: { ...defaultUploadState },
    video: { ...defaultUploadState },
    audio: { ...defaultUploadState },
  });

  function setUpload(key: FileKey, patch: Partial<Uploads[FileKey]>) {
    setUploads((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleFileSelect(key: FileKey, file: File) {
    // Revoke previous preview if any
    const prev = uploads[key].localPreview;
    if (prev) URL.revokeObjectURL(prev);

    setUpload(key, { file, status: "validating", error: null, progress: 0, url: null, localPreview: null });

    // Validate
    try {
      await validate(key, file);
    } catch (err: unknown) {
      setUpload(key, { status: "error", error: (err as Error).message });
      return;
    }

    // Build local preview URL for image/video
    const localPreview = (key === "thumbnail" || key === "preview")
      ? URL.createObjectURL(file)
      : null;

    setUpload(key, { status: "uploading", progress: 0, localPreview });

    // Get signed upload URL
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const res = await fetch("/api/shows/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, fileKey: key, extension: ext }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to get upload URL");
      }
      const { token, storagePath, publicUrl } = await res.json();

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await uploadWithProgress(supabaseUrl, storagePath, token, file, (pct) => {
        setUpload(key, { progress: pct });
      });

      setUpload(key, { status: "done", url: publicUrl, progress: 100 });
    } catch (err: unknown) {
      setUpload(key, { status: "error", error: (err as Error).message });
    }
  }

  function handleClear(key: FileKey) {
    const prev = uploads[key].localPreview;
    if (prev) URL.revokeObjectURL(prev);
    setUpload(key, { ...defaultUploadState });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          title: details.title,
          description: details.description || null,
          category: details.category || null,
          tags: details.tags,
          thumbnailUrl: uploads.thumbnail.url,
          previewUrl: uploads.preview.url,
          videoUrl: uploads.video.url,
          audioUrl: uploads.audio.url,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed");
      }
      toast.success("Your show has been submitted for review");
      router.replace("/dashboard/artist");
    } catch (err: unknown) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: form ── */}
      <div className="flex-1 py-10 px-10 xl:px-14 overflow-y-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-raleway text-2xl font-semibold text-white tracking-tight">
            Upload a Show
          </h1>
          <p className="font-manrope text-sm text-zinc-400 mt-1">
            Submit your immersive projection content for venue licensing.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map(({ n, label }, i) => {
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-manrope font-semibold transition-all ${
                      done
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                        : active
                        ? "bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-600"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span
                    className={`font-manrope text-xs font-medium transition-colors ${
                      active ? "text-white" : done ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 h-px mx-3 transition-colors ${step > n ? "bg-emerald-800" : "bg-zinc-800"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="max-w-xl">
          {step === 1 && (
            <Step1Details
              details={details}
              onChange={(u) => setDetails((d) => ({ ...d, ...u }))}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2Media
              uploads={uploads}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Confirm
              details={details}
              uploads={uploads}
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              submitting={submitting}
            />
          )}
        </div>
      </div>

      {/* ── Right: sticky spec panel ── */}
      <div className="hidden xl:block w-[320px] shrink-0 sticky top-0 self-start h-screen overflow-y-auto border-l border-zinc-900 bg-zinc-950/80">
        <SpecPanel />
      </div>
    </div>
  );
}
