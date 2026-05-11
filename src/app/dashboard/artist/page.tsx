import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import ArtistStudio from "./ArtistStudio";

export default async function ArtistDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "artist") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  const [{ data: shows }, { data: userRow }, { data: earningRows }] =
    await Promise.all([
      supabase
        .from("shows")
        .select("id, title, category, thumbnail_url, status, rejection_reason, featured, created_at")
        .eq("artist_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("slug, bio, verified")
        .eq("clerk_id", userId)
        .maybeSingle(),
      supabase
        .from("earnings")
        .select("show_id, artist_share, status, created_at")
        .eq("artist_id", userId),
    ]);

  // Re-fetch licenses with actual show ids
  const showIds = (shows ?? []).map((s: { id: string }) => s.id);
  const { data: licenses } = showIds.length
    ? await supabase.from("licenses").select("show_id, venue_id").in("show_id", showIds)
    : { data: [] };

  const licenseCounts: Record<string, number> = {};
  const venueSet = new Set<string>();
  for (const row of licenses ?? []) {
    licenseCounts[row.show_id] = (licenseCounts[row.show_id] ?? 0) + 1;
    venueSet.add(row.venue_id);
  }

  const earningsPerShow: Record<string, number> = {};
  let totalEarnings = 0;
  const now = new Date();
  let monthEarnings = 0;
  for (const row of earningRows ?? []) {
    earningsPerShow[row.show_id] = (earningsPerShow[row.show_id] ?? 0) + (row.artist_share ?? 0);
    totalEarnings += row.artist_share ?? 0;
    const d = new Date(row.created_at);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      monthEarnings += row.artist_share ?? 0;
    }
  }

  return (
    <ArtistStudio
      shows={shows ?? []}
      licenseCounts={licenseCounts}
      earningsPerShow={earningsPerShow}
      totalEarnings={totalEarnings}
      monthEarnings={monthEarnings}
      activeVenues={venueSet.size}
      userName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Artist"}
      userImage={user?.imageUrl ?? null}
      slug={userRow?.slug ?? null}
      bio={userRow?.bio ?? null}
      verified={userRow?.verified ?? false}
    />
  );
}
