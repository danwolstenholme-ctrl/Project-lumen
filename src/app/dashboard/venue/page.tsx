import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import ShowLibrary from "./ShowLibrary";

export default async function VenueDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "venue") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  const { data: rawShows } = await supabase
    .from("shows")
    .select(`
      id,
      title,
      description,
      category,
      thumbnail_url,
      preview_url,
      artist_id,
      users!shows_artist_id_fkey (name)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  type RawShow = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    thumbnail_url: string | null;
    preview_url: string | null;
    artist_id: string;
    users: { name: string | null }[] | { name: string | null } | null;
  };

  // Normalize: Supabase returns joined rows as array; we only need the first entry
  const shows = (rawShows as RawShow[] ?? []).map((s) => ({
    ...s,
    users: Array.isArray(s.users)
      ? (s.users[0] as { name: string | null } | undefined) ?? null
      : (s.users as { name: string | null } | null),
  }));

  const { data: existingLicenses } = await supabase
    .from("licenses")
    .select("show_id")
    .eq("venue_id", userId);

  const licensedShowIds = new Set((existingLicenses ?? []).map((l: { show_id: string }) => l.show_id));

  return (
    <ShowLibrary
      shows={shows}
      licensedShowIds={Array.from(licensedShowIds)}
      venueUserId={userId}
    />
  );
}
