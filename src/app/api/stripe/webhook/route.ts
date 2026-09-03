import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";
import { escapeHtml } from "@/utils/email";
import { BOOST_LABELS, type BoostPlacement } from "@/utils/pricing";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, showId, placement, months } = session.metadata ?? {};
  if (!userId || !showId || !placement || !months) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const monthCount = Number(months);
  const featuredUntil = new Date();
  featuredUntil.setMonth(featuredUntil.getMonth() + monthCount);

  const { data: updated, error: updateError } = await supabase
    .from("shows")
    .update({
      featured: true,
      featured_until: featuredUntil.toISOString(),
      ...(placement === "homepage_feature" ? { homepage_featured: true } : {}),
    })
    .eq("id", showId)
    .eq("artist_id", userId)
    .select("id, title")
    .maybeSingle();

  // The payment already succeeded, so a failure here needs a retry from
  // Stripe rather than a silent 200.
  if (updateError) {
    console.error("[stripe/webhook] failed to apply boost:", updateError);
    return NextResponse.json({ error: "Could not apply boost" }, { status: 500 });
  }
  if (!updated) {
    // Nothing to retry — the piece is gone or was never this artist's.
    console.error(`[stripe/webhook] paid boost for unknown piece ${showId} (artist ${userId})`);
    return NextResponse.json({ received: true, applied: false });
  }

  // Best-effort confirmation email. A Resend outage must not fail the webhook,
  // or Stripe retries the whole event and the artist gets duplicate mail.
  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("email, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (userRow?.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const name = escapeHtml(userRow.name ?? "there");
      const label = BOOST_LABELS[placement as BoostPlacement] ?? "Boost";
      await resend.emails.send({
        from: "Project Lumen <noreply@projectlumen.io>",
        to: userRow.email,
        subject: "Your piece is now featured on Project Lumen",
        html: `
          <div style="background:#09090B;color:#F4F4F5;font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;border-radius:12px;">
            <h1 style="color:#D946EF;font-size:24px;margin-bottom:8px;">Your piece is live and featured.</h1>
            <p style="color:#A1A1AA;">Hi ${name},</p>
            <p style="color:#A1A1AA;">Your ${escapeHtml(label)} boost for &ldquo;${escapeHtml(updated.title ?? "your piece")}&rdquo; is active. Venues will see it at the top of their library for the next ${monthCount} month${monthCount > 1 ? "s" : ""}.</p>
            <a href="https://projectlumen.io/dashboard/artist" style="display:inline-block;margin-top:24px;padding:12px 24px;background:linear-gradient(90deg,#D946EF,#A855F7);color:white;border-radius:8px;text-decoration:none;font-weight:600;">View Studio</a>
          </div>
        `,
      });
    }
  } catch (e) {
    console.error("[stripe/webhook] boost confirmation email failed:", e);
  }

  return NextResponse.json({ received: true });
}
