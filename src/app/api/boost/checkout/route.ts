import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

const PRICES: Record<string, number> = {
  featured_show: 7500,      // €75 in cents
  homepage_feature: 15000,  // €150 in cents
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { placement, showId, months } = await req.json();
  if (!PRICES[placement] || !showId || !months) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const unitAmount = PRICES[placement];
  const discountMap: Record<number, number> = { 1: 0, 3: 10, 6: 20 };
  const discountPct = discountMap[months] ?? 0;
  const totalAmount = Math.round(unitAmount * months * (1 - discountPct / 100));

  const origin = req.headers.get("origin") ?? "https://projectlumen.io";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: totalAmount,
        product_data: {
          name: `Lumen Boost — ${placement === "featured_show" ? "Featured Show" : "Homepage Feature"} (${months} month${months > 1 ? "s" : ""})`,
        },
      },
      quantity: 1,
    }],
    metadata: { userId, showId, placement, months: String(months) },
    success_url: `${origin}/dashboard/artist/boost?success=1`,
    cancel_url: `${origin}/dashboard/artist/boost`,
  });

  return NextResponse.json({ url: session.url });
}
