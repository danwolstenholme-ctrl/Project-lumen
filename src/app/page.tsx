import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import MarketingLanding from "./MarketingLanding";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const supabase = createAdminClient();

  // Live featured shows
  const { data: featuredRows } = await supabase
    .from("shows")
    .select("id, title, description, category, thumbnail_url, preview_url, artist_id, featured")
    .eq("status", "published")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  // Artist of the month
  const { data: aom } = await supabase
    .from("users")
    .select("name, slug, avatar_url, bio")
    .eq("role", "artist")
    .eq("artist_of_month", true)
    .maybeSingle();

  // Platform stats
  const [{ count: artistCount }, { count: venueCount }, { count: showCount }] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "artist"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "venue"),
    supabase.from("shows").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  // Resolve artist names for featured shows
  const artistIds = Array.from(new Set((featuredRows ?? []).map((s) => s.artist_id)));
  const { data: artists } = artistIds.length
    ? await supabase.from("users").select("clerk_id, name, slug").in("clerk_id", artistIds)
    : { data: [] };
  const artistMap = new Map((artists ?? []).map((a) => [a.clerk_id, a]));

  const featured = (featuredRows ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    thumbnail_url: s.thumbnail_url,
    preview_url: s.preview_url,
    artist_name: artistMap.get(s.artist_id)?.name ?? null,
    artist_slug: artistMap.get(s.artist_id)?.slug ?? null,
  }));

  return (
    <MarketingLanding
      featured={featured}
      artistOfMonth={aom ?? null}
      stats={{
        artists: artistCount ?? 0,
        venues: venueCount ?? 0,
        shows: showCount ?? 0,
      }}
    />
  );
}
