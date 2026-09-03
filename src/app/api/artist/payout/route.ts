import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";

const PAYOUT_METHODS = ["paypal", "bank"] as const;

export async function PATCH(req: Request) {
  const guard = await requireRole("artist");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  const { payoutMethod, payoutEmail, payoutIban } = await req.json();

  if (!PAYOUT_METHODS.includes(payoutMethod)) {
    return NextResponse.json({ error: "Choose PayPal or bank transfer" }, { status: 400 });
  }

  // These details are what real money gets sent to, so each method requires
  // its own field rather than accepting whatever the client happens to send.
  if (payoutMethod === "paypal") {
    if (typeof payoutEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail)) {
      return NextResponse.json({ error: "Enter a valid PayPal email" }, { status: 400 });
    }
  } else {
    const iban = typeof payoutIban === "string" ? payoutIban.replace(/\s/g, "").toUpperCase() : "";
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) {
      return NextResponse.json({ error: "Enter a valid IBAN" }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({
      payout_method: payoutMethod,
      payout_email: payoutMethod === "paypal" ? payoutEmail.trim() : null,
      payout_iban:
        payoutMethod === "bank" ? payoutIban.replace(/\s/g, "").toUpperCase() : null,
    })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
