import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";
import { LICENSE_FEE_EUR, artistShare } from "@/utils/pricing";

export async function POST(req: Request) {
  // Venues license pieces. An artist must not be able to license their own
  // work, which would mint earnings rows payable to themselves.
  const guard = await requireRole("venue");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

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

  // Idempotent: the unique index on (venue_id, show_id) is the real guard, so
  // a duplicate insert is treated as success rather than an error.
  const { error: licenseError } = await supabase
    .from("licenses")
    .insert({ venue_id: userId, show_id: showId, licensed_at: new Date().toISOString() });

  if (licenseError) {
    const alreadyLicensed = licenseError.code === "23505";
    if (alreadyLicensed) return NextResponse.json({ ok: true, alreadyLicensed: true });
    return NextResponse.json({ error: licenseError.message }, { status: 500 });
  }

  const { error: earningsError } = await supabase.from("earnings").insert({
    artist_id: show.artist_id,
    venue_id: userId,
    show_id: showId,
    license_fee: LICENSE_FEE_EUR,
    artist_share: artistShare(),
    status: "pending",
    created_at: new Date().toISOString(),
  });

  // The licence and the artist's earnings row have to land together. Without a
  // transaction the best we can do is undo the licence so the venue can retry,
  // rather than leave an artist silently unpaid for a licensed piece.
  if (earningsError) {
    await supabase.from("licenses").delete().eq("venue_id", userId).eq("show_id", showId);
    console.error("[licenses] earnings insert failed, licence rolled back:", earningsError);
    return NextResponse.json(
      { error: "Could not record the licence. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
