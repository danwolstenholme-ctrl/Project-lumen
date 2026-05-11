import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import ControlPanel from "./ControlPanel";
import type { Table, Show, Venue } from "./types";

export default async function ControlPanelPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "venue") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  // Get venue record
  const { data: venueRow } = await supabase
    .from("venues")
    .select("id, name")
    .eq("user_id", userId)
    .single();

  // Get tables for this venue
  const { data: tableRows } = venueRow
    ? await supabase
        .from("tables")
        .select("id, label, ip_address, status")
        .eq("venue_id", venueRow.id)
        .order("label")
    : { data: [] };

  // Get licensed show IDs
  const { data: licenseRows } = await supabase
    .from("licenses")
    .select("show_id")
    .eq("venue_id", userId);

  const licensedIds = (licenseRows ?? []).map((l: { show_id: string }) => l.show_id);

  // Get licensed shows with artist names
  const { data: showRows } = licensedIds.length > 0
    ? await supabase
        .from("shows")
        .select("id, title, description, category, thumbnail_url, preview_url, artist_id, featured, users!shows_artist_id_fkey(name, artist_of_month)")
        .in("id", licensedIds)
        .eq("status", "published")
        .order("featured", { ascending: false })
    : { data: [] };

  type RawUserRow = { name: string | null; artist_of_month?: boolean | null };
  type RawShow = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    thumbnail_url: string | null;
    preview_url: string | null;
    artist_id: string;
    featured: boolean | null;
    users: RawUserRow[] | RawUserRow | null;
  };

  const shows: Show[] = (showRows as RawShow[] ?? []).map((s) => {
    const userRow = Array.isArray(s.users) ? s.users[0] ?? null : (s.users as RawUserRow | null);
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      thumbnail_url: s.thumbnail_url,
      preview_url: s.preview_url,
      featured: s.featured ?? null,
      artist_name: userRow?.name ?? null,
      artist_of_month: userRow?.artist_of_month ?? null,
    };
  });

  const tables: Table[] = (tableRows ?? []).map((t: { id: string; label: string; ip_address: string | null; status: string | null }) => ({
    id: t.id,
    label: t.label,
    ip_address: t.ip_address,
    status: (t.status as Table["status"]) ?? "offline",
  }));

  const venue: Venue = venueRow
    ? { id: venueRow.id, name: venueRow.name }
    : { id: "", name: "My Venue" };

  return (
    <ControlPanel
      initialTables={tables}
      initialShows={shows}
      venue={venue}
      venueDbId={venue.id}
    />
  );
}
