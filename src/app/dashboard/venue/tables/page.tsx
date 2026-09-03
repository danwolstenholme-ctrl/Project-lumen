import { createAdminClient } from "@/utils/supabase/admin";
import TableManager from "./TableManager";
import { requirePageRole } from "@/utils/auth";

export default async function VenueTablesPage() {
  const { userId } = await requirePageRole("venue");

  const supabase = createAdminClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: tables } = venue
    ? await supabase
        .from("tables")
        .select("id, label, ip_address, status, created_at")
        .eq("venue_id", venue.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <TableManager
      venueName={venue?.name ?? ""}
      hasVenue={!!venue}
      initialTables={(tables ?? []).map((t) => ({
        id: t.id,
        label: t.label,
        ip_address: t.ip_address,
        status: (t.status as "online_playing" | "online_idle" | "offline") ?? "offline",
      }))}
    />
  );
}
