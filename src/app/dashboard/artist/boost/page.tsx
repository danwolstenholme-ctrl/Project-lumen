import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import BoostFlow from "./BoostFlow";

interface PageProps { searchParams: Promise<{ show?: string; success?: string }> }

export default async function BoostPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { show: preselectedShowId, success } = await searchParams;
  const supabase = createAdminClient();

  const { data: shows } = await supabase
    .from("shows")
    .select("id, title, thumbnail_url, featured, featured_until")
    .eq("artist_id", userId)
    .eq("status", "published");

  return (
    <BoostFlow
      shows={shows ?? []}
      preselectedShowId={preselectedShowId ?? null}
      success={success === "1"}
    />
  );
}
