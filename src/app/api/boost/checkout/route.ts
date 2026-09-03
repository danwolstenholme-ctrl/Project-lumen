import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth";
import {
  BOOST_PRICES_CENTS,
  BOOST_TERMS,
  BOOST_LABELS,
  boostTotalCents,
  type BoostPlacement,
} from "@/utils/pricing";

export async function POST(req: Request) {
  const guard = await requireRole("artist");
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  const { placement, showId, months } = await req.json();

  const monthCount = Number(months);
  if (
    !(placement in BOOST_PRICES_CENTS) ||
    !showId ||
    !BOOST_TERMS[monthCount]
  ) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // The Stripe webhook applies the boost with `.eq("artist_id", userId)`, so a
  // piece the caller doesn't own would take payment and then silently do
  // nothing. Verify ownership before charging anyone.
  const supabase = createAdminClient();
  const { data: show } = await supabase
    .from("shows")
    .select("id, title, status")
    .eq("id", showId)
    .eq("artist_id", userId)
    .maybeSingle();

  if (!show) return NextResponse.json({ error: "Piece not found" }, { status: 404 });
  if (show.status !== "published") {
    return NextResponse.json(
      { error: "Only published pieces can be boosted" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  const origin = req.headers.get("origin") ?? "https://projectlumen.io";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: boostTotalCents(placement as BoostPlacement, monthCount),
          product_data: {
            name: `Lumen Boost — ${BOOST_LABELS[placement as BoostPlacement]} (${monthCount} month${monthCount > 1 ? "s" : ""})`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { userId, showId, placement, months: String(monthCount) },
    success_url: `${origin}/dashboard/artist/boost?success=1`,
    cancel_url: `${origin}/dashboard/artist/boost`,
  });

  return NextResponse.json({ url: session.url });
}
