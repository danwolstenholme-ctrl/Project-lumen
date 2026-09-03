import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";
import { FIELD_LIMITS } from "@/utils/limits";

export async function PATCH(req: Request) {
  const guard = await requireRole("artist");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  const { bio } = await req.json();
  if (typeof bio !== "string") return NextResponse.json({ error: "bio required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ bio: bio.slice(0, FIELD_LIMITS.bio) })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
