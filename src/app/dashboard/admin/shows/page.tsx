import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminShows from "./AdminShows";

export default async function AdminShowsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "admin") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from("shows")
    .select("id, title, description, category, thumbnail_url, preview_url, video_url, status, rejection_reason, created_at, artist_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const artistIds = Array.from(new Set((pending ?? []).map((s) => s.artist_id)));
  const { data: artists } = artistIds.length
    ? await supabase.from("users").select("clerk_id, name, slug, avatar_url").in("clerk_id", artistIds)
    : { data: [] };
  const artistMap = new Map((artists ?? []).map((a) => [a.clerk_id, a]));

  const shows = (pending ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    thumbnail_url: s.thumbnail_url,
    preview_url: s.preview_url,
    video_url: s.video_url,
    status: s.status,
    rejection_reason: s.rejection_reason,
    created_at: s.created_at,
    artist: artistMap.get(s.artist_id) ?? null,
  }));

  return <AdminShows initialShows={shows} />;
}
