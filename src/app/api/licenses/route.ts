import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const LICENSE_FEE = 30; // €30 per license
const ARTIST_SHARE_PCT = 0.70;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showId } = await req.json();
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: show } = await supabase
    .from("shows")
    .select("id, artist_id")
    .eq("id", showId)
    .eq("status", "published")
    .single();

  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  // Check if already licensed (idempotent)
  const { data: existing } = await supabase
    .from("licenses")
    .select("id")
    .eq("venue_id", userId)
    .eq("show_id", showId)
    .maybeSingle();

  if (!existing) {
    const { error: licenseError } = await supabase
      .from("licenses")
      .insert({ venue_id: userId, show_id: showId, licensed_at: new Date().toISOString() });

    if (licenseError) return NextResponse.json({ error: licenseError.message }, { status: 500 });

    // Insert earnings row for the artist
    await supabase.from("earnings").insert({
      artist_id: show.artist_id,
      venue_id: userId,
      show_id: showId,
      license_fee: LICENSE_FEE,
      artist_share: LICENSE_FEE * ARTIST_SHARE_PCT,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
