import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bio } = await req.json();
  if (typeof bio !== "string") return NextResponse.json({ error: "bio required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ bio: bio.slice(0, 160) })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
