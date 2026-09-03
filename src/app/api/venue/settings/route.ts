import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";
import { FIELD_LIMITS } from "@/utils/limits";

/** Clamps a slider value to 0-100, rejecting values that aren't numbers. */
function clampPercent(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function PATCH(req: Request) {
  const guard = await requireRole("venue");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if ("name" in body) {
    const name = String(body.name ?? "").trim().slice(0, FIELD_LIMITS.venueName);
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    update.name = name;
  }

  if ("default_volume" in body) {
    const volume = clampPercent(body.default_volume);
    if (volume === null) return NextResponse.json({ error: "Invalid volume" }, { status: 400 });
    update.default_volume = volume;
  }

  if ("default_brightness" in body) {
    const brightness = clampPercent(body.default_brightness);
    if (brightness === null) {
      return NextResponse.json({ error: "Invalid brightness" }, { status: 400 });
    }
    update.default_brightness = brightness;
  }

  const supabase = createAdminClient();

  // The default show is what the one-button Quick Play fires, so it has to be
  // a piece this venue actually licensed and that is still published.
  if ("default_show_id" in body) {
    const showId = body.default_show_id || null;
    if (showId) {
      const { data: licensed } = await supabase
        .from("licenses")
        .select("show_id, shows!inner(status)")
        .eq("venue_id", userId)
        .eq("show_id", showId)
        .eq("shows.status", "published")
        .maybeSingle();

      if (!licensed) {
        return NextResponse.json(
          { error: "That piece isn't licensed to this venue" },
          { status: 403 }
        );
      }
    }
    update.default_show_id = showId;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("venues")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("venues").update(update).eq("user_id", userId)
    : await supabase
        .from("venues")
        .insert({ user_id: userId, name: "My Venue", ...update });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
