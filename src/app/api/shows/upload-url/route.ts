import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMux } from "@/utils/mux";

const BUCKET = "shows";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showId, fileKey, extension } = await req.json();
  if (!showId || !fileKey) {
    return NextResponse.json({ error: "showId and fileKey are required" }, { status: 400 });
  }

  if (fileKey === "video") {
    // Mux Direct Upload for the show video (audio is folded into this asset).
    // The Mux webhook correlates events back to this show via `passthrough`.
    const origin = req.headers.get("origin") ?? "*";
    const upload = await getMux().video.uploads.create({
      cors_origin: origin,
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "plus",
        passthrough: showId,
      },
    });

    return NextResponse.json({
      kind: "mux",
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  }

  if (fileKey === "thumbnail") {
    if (!extension) return NextResponse.json({ error: "extension is required" }, { status: 400 });

    const filePath = `${userId}/${showId}/thumbnail.${extension}`;
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(filePath, { upsert: true });

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      kind: "supabase",
      signedUrl: data.signedUrl,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`,
    });
  }

  return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });
}
