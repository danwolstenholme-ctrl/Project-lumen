import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { payoutMethod, payoutEmail, payoutIban } = await req.json();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ payout_method: payoutMethod, payout_email: payoutEmail, payout_iban: payoutIban })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
