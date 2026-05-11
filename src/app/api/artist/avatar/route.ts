import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    return NextResponse.json({ error: "JPG or PNG only" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 2MB" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `avatars/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("users")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("users").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  await supabase.from("users").update({ avatar_url: url }).eq("clerk_id", userId);

  return NextResponse.json({ url });
}
