import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await requireRole("admin");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  const { id } = await ctx.params;
  const { status, rejection_reason } = await req.json();

  if (!["pending", "published", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shows")
    .update({
      status,
      rejection_reason: status === "rejected" ? (rejection_reason ?? "") : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
