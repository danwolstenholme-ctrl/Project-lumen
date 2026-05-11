import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const BUCKET = "shows";

const fileNames: Record<string, string> = {
  thumbnail: "thumbnail",
  preview: "preview",
  video: "show",
  audio: "audio",
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showId, fileKey, extension } = await req.json();
  if (!showId || !fileKey || !extension) {
    return NextResponse.json({ error: "showId, fileKey, and extension are required" }, { status: 400 });
  }

  const baseName = fileNames[fileKey as string];
  if (!baseName) return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });

  const filePath = `${userId}/${showId}/${baseName}.${extension}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath, { upsert: true });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
  }

  return NextResponse.json({
    token: data.token,
    storagePath: `${BUCKET}/${filePath}`,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`,
  });
}
