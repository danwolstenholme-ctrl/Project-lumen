import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMux } from "@/utils/mux";
import { applyAssetReady, applyAssetErrored, type MuxAsset } from "@/utils/muxValidation";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { showId, title, description, category, tags, thumbnailUrl, muxUploadId } = body;

  if (!showId || !title || !muxUploadId) {
    return NextResponse.json({ error: "showId, title, and muxUploadId are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("shows").insert({
    id: showId,
    artist_id: userId,
    title,
    description: description ?? null,
    category: category ?? null,
    tags: tags ?? [],
    thumbnail_url: thumbnailUrl ?? null,
    mux_upload_id: muxUploadId,
    mux_status: "waiting",
    status: "preparing",
    created_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Race-condition fix: if Mux already finished processing before the artist
  // hit submit (e.g. small file + slow artist), the asset.ready webhook fired
  // before this row existed. Pull current Mux state and apply inline so we
  // don't sit at status='preparing' forever.
  try {
    const mux = getMux();
    const upload = await mux.video.uploads.retrieve(muxUploadId);
    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      if (asset.status === "ready") {
        await applyAssetReady(supabase, asset as unknown as MuxAsset);
      } else if (asset.status === "errored") {
        await applyAssetErrored(supabase, {
          id: asset.id,
          passthrough: showId,
          errors: asset.errors as { messages?: string[] } | undefined,
        });
      }
      // status === "preparing" → webhook will handle it when ready
    }
  } catch (e) {
    // Don't fail the submit if Mux is unreachable — webhook will catch up.
    console.warn("[shows POST] Mux state check failed:", e);
  }

  return NextResponse.json({ ok: true, showId });
}
