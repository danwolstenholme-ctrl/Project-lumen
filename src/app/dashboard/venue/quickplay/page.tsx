import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import QuickPlay from "./QuickPlay";

export default async function QuickPlayPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "venue") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  const { data: venueRow } = await supabase
    .from("venues")
    .select("id, name, default_show_id, default_volume, default_brightness")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: tableRows } = venueRow
    ? await supabase
        .from("tables")
        .select("id, label, ip_address, status")
        .eq("venue_id", venueRow.id)
        .order("label")
    : { data: [] };

  const { data: licenseRows } = await supabase
    .from("licenses")
    .select("show_id")
    .eq("venue_id", userId);

  const licensedIds = (licenseRows ?? []).map((l: { show_id: string }) => l.show_id);

  const { data: showRows } = licensedIds.length > 0
    ? await supabase
        .from("shows")
        .select("id, title, description, category, thumbnail_url, preview_url, artist_id, featured")
        .in("id", licensedIds)
        .eq("status", "published")
        .order("featured", { ascending: false })
    : { data: [] };

  const artistIds = Array.from(new Set((showRows ?? []).map((s) => s.artist_id)));
  const { data: artistRows } = artistIds.length
    ? await supabase.from("users").select("clerk_id, name").in("clerk_id", artistIds)
    : { data: [] };
  const artistMap = new Map((artistRows ?? []).map((a) => [a.clerk_id, a.name]));

  const shows = (showRows ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    thumbnail_url: s.thumbnail_url,
    preview_url: s.preview_url,
    featured: s.featured ?? false,
    artist_name: artistMap.get(s.artist_id) ?? null,
  }));

  const tables = (tableRows ?? []).map((t: { id: string; label: string; ip_address: string | null; status: string | null }) => ({
    id: t.id,
    label: t.label,
    ip_address: t.ip_address,
    status: (t.status as "online_playing" | "online_idle" | "offline") ?? "offline",
  }));

  const defaultShow = venueRow?.default_show_id
    ? shows.find((s) => s.id === venueRow.default_show_id) ?? null
    : (shows[0] ?? null);

  return (
    <QuickPlay
      venueName={venueRow?.name ?? "Your venue"}
      venueDbId={venueRow?.id ?? ""}
      tables={tables}
      shows={shows}
      defaultShow={defaultShow}
      initialVolume={venueRow?.default_volume ?? 80}
      initialBrightness={venueRow?.default_brightness ?? 90}
    />
  );
}
