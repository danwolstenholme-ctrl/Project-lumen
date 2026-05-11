import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const supabase = createAdminClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("name, bio, contact_email, avatar_url, slug, payout_method, payout_email, payout_iban, notify_on_license")
    .eq("clerk_id", userId)
    .maybeSingle();

  return (
    <SettingsForm
      userId={userId}
      initialName={userRow?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
      initialBio={userRow?.bio ?? ""}
      initialContactEmail={userRow?.contact_email ?? user?.emailAddresses?.[0]?.emailAddress ?? ""}
      initialSlug={userRow?.slug ?? ""}
      initialAvatarUrl={userRow?.avatar_url ?? user?.imageUrl ?? null}
      initialNotifyOnLicense={userRow?.notify_on_license ?? true}
    />
  );
}
