import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, contactEmail, slug, notifyOnLicense } = await req.json();

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check slug uniqueness if provided
  if (slug) {
    const { data: existing } = await supabase
      .from("users")
      .select("clerk_id")
      .eq("slug", slug)
      .neq("clerk_id", userId)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug taken" }, { status: 409 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      name: name?.slice(0, 80),
      bio: bio?.slice(0, 300),
      contact_email: contactEmail,
      slug: slug || null,
      notify_on_license: notifyOnLicense,
    })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
