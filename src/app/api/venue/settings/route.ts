import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ("name" in body) update.name = String(body.name).slice(0, 120);
  if ("default_show_id" in body) update.default_show_id = body.default_show_id || null;
  if ("default_volume" in body) update.default_volume = Math.max(0, Math.min(100, Number(body.default_volume)));
  if ("default_brightness" in body) update.default_brightness = Math.max(0, Math.min(100, Number(body.default_brightness)));

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Ensure venue row exists (auto-create on first save)
  const { data: existing } = await supabase
    .from("venues")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("venues").insert({ user_id: userId, name: (update.name as string) ?? "My Venue", ...update });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("venues").update(update).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
