import type { SupabaseClient } from "@supabase/supabase-js";

// Spec rules for a Lumen "piece" (video form). Image / static pieces will get
// their own spec when that asset type lands.
export const PIECE_SPEC = {
  width: 3840,
  height: 2160,
  frameRate: 60,
  frameRateTolerance: 0.01,  // ±1% — accepts 59.94 (NTSC) and rejects 30/24/etc.
  minDuration: 60,           // seconds — venue plays on loop, sub-minute looks like a stutter
  audioChannels: 2,          // stereo into the venue PA
};

export interface MuxAssetTrack {
  type?: "video" | "audio" | "text";
  max_width?: number;
  max_height?: number;
  max_frame_rate?: number;
  max_channels?: number;
}

export interface MuxAsset {
  id: string;
  status?: string;
  passthrough?: string;
  duration?: number;
  tracks?: MuxAssetTrack[];
  playback_ids?: Array<{ id: string; policy?: string }>;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export function validateAsset(asset: MuxAsset): ValidationResult {
  const reasons: string[] = [];
  const video = asset.tracks?.find((t) => t.type === "video");
  const audio = asset.tracks?.find((t) => t.type === "audio");

  if (!video) {
    reasons.push("No video track detected in your upload.");
  } else {
    if (
      video.max_width !== PIECE_SPEC.width ||
      video.max_height !== PIECE_SPEC.height
    ) {
      reasons.push(
        `Resolution must be 3840×2160 (you uploaded ${video.max_width ?? "?"}×${video.max_height ?? "?"}).`
      );
    }
    if (video.max_frame_rate !== undefined) {
      const delta = Math.abs(video.max_frame_rate - PIECE_SPEC.frameRate) / PIECE_SPEC.frameRate;
      if (delta > PIECE_SPEC.frameRateTolerance) {
        reasons.push(
          `Frame rate must be 60fps (you uploaded ${video.max_frame_rate.toFixed(2)}fps).`
        );
      }
    }
  }

  if (typeof asset.duration === "number" && asset.duration < PIECE_SPEC.minDuration) {
    reasons.push(
      `Duration must be at least 60 seconds for a seamless loop (you uploaded ${Math.round(asset.duration)}s).`
    );
  }

  if (!audio) {
    reasons.push("No audio track detected — encode stereo AAC audio into your .mp4 file.");
  } else if (audio.max_channels !== PIECE_SPEC.audioChannels) {
    reasons.push(
      `Audio must be stereo (2 channels). You uploaded ${audio.max_channels ?? "?"} channel(s).`
    );
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

export function extractMetadata(asset: MuxAsset) {
  const video = asset.tracks?.find((t) => t.type === "video");
  const audio = asset.tracks?.find((t) => t.type === "audio");
  return {
    width: video?.max_width ?? null,
    height: video?.max_height ?? null,
    frame_rate: video?.max_frame_rate ?? null,
    duration: asset.duration ?? null,
    audio: audio ? { channels: audio.max_channels ?? null } : null,
  };
}

// Apply a Mux asset's "ready" state to the show row. Used by both the webhook
// (video.asset.ready) and the submit-time race-condition fix in /api/shows
// (when Mux finished processing before the artist hit submit).
//
// Guarded by mux_status='waiting' so it's idempotent (Mux retries) and won't
// overwrite an admin-modified state.
export async function applyAssetReady(
  supabase: SupabaseClient,
  asset: MuxAsset
): Promise<void> {
  const showId = asset.passthrough;
  if (!showId) {
    console.warn("[mux] asset.ready missing passthrough showId; skipping");
    return;
  }

  const validation = validateAsset(asset);
  const playbackId = asset.playback_ids?.[0]?.id ?? null;

  const update: Record<string, unknown> = {
    mux_asset_id: asset.id,
    mux_status: "ready",
    mux_playback_id: playbackId,
    video_metadata: extractMetadata(asset),
  };

  if (validation.ok) {
    update.status = "pending";
    update.rejection_reason = null;
  } else {
    update.status = "rejected";
    update.rejection_reason = validation.reasons.join(" ");
  }

  await supabase
    .from("shows")
    .update(update)
    .eq("id", showId)
    .eq("mux_status", "waiting");
}

// Apply a Mux asset's "errored" state (Mux couldn't process the upload).
export async function applyAssetErrored(
  supabase: SupabaseClient,
  asset: { id: string; passthrough?: string; errors?: { messages?: string[] } }
): Promise<void> {
  const showId = asset.passthrough;
  if (!showId) return;
  const errorMessage = asset.errors?.messages?.join("; ") ?? "Mux could not process this file";
  await supabase
    .from("shows")
    .update({
      mux_asset_id: asset.id,
      mux_status: "errored",
      status: "rejected",
      rejection_reason: `Upload processing failed: ${errorMessage}`,
    })
    .eq("id", showId)
    .eq("mux_status", "waiting");
}
