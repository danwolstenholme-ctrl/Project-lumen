import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole, forbidden, SELF_ASSIGNABLE_ROLES, type Role } from "@/utils/auth";

export async function POST(request: Request) {
  const guard = await requireRole();
  if (guard instanceof NextResponse) return guard;
  const { userId, role: currentRole } = guard;

  const { role } = await request.json();

  // Onboarding only offers artist and venue. Admin is granted by hand in the
  // Clerk dashboard, so it must never be self-assignable here.
  if (!SELF_ASSIGNABLE_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // A role is chosen once, during onboarding. Changing it later would orphan
  // the user's existing pieces or venue, so it needs an admin.
  if (currentRole && currentRole !== role) return forbidden();

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, { publicMetadata: { role } });

  const clerkUser = await clerk.users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? "";

  const supabase = createAdminClient();
  const { error } = await supabase.from("users").upsert(
    {
      clerk_id: userId,
      role,
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
      email,
    },
    { onConflict: "clerk_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
