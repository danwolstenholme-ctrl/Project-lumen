import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { showId, title, description, category, tags, thumbnailUrl, previewUrl, videoUrl, audioUrl } = body;

  if (!showId || !title || !videoUrl) {
    return NextResponse.json({ error: "showId, title, and videoUrl are required" }, { status: 400 });
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
    preview_url: previewUrl ?? null,
    video_url: videoUrl,
    audio_url: audioUrl ?? null,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, showId });
}
