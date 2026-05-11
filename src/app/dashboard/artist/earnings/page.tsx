import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import EarningsDashboard from "./EarningsDashboard";

export default async function EarningsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();

  const { data: earnings } = await supabase
    .from("earnings")
    .select("id, artist_share, license_fee, status, created_at, paid_at, venue_id, show_id")
    .eq("artist_id", userId)
    .order("created_at", { ascending: false });

  const showIds = [...new Set((earnings ?? []).map((e: { show_id: string }) => e.show_id))];
  const venueIds = [...new Set((earnings ?? []).map((e: { venue_id: string }) => e.venue_id))];

  const [{ data: shows }, { data: venues }, { data: userRow }] = await Promise.all([
    showIds.length
      ? supabase.from("shows").select("id, title").in("id", showIds)
      : Promise.resolve({ data: [] }),
    venueIds.length
      ? supabase.from("users").select("clerk_id, name").in("clerk_id", venueIds)
      : Promise.resolve({ data: [] }),
    supabase.from("users").select("payout_method, payout_email, payout_iban").eq("clerk_id", userId).maybeSingle(),
  ]);

  const showMap: Record<string, string> = {};
  for (const s of shows ?? []) showMap[s.id] = s.title;
  const venueMap: Record<string, string> = {};
  for (const v of venues ?? []) venueMap[v.clerk_id] = v.name ?? "Unknown Venue";

  const rows = (earnings ?? []).map((e: {
    id: string; artist_share: number; license_fee: number;
    status: string; created_at: string; paid_at: string | null;
    venue_id: string; show_id: string;
  }) => ({
    id: e.id,
    date: e.created_at,
    venueName: venueMap[e.venue_id] ?? "Unknown",
    showTitle: showMap[e.show_id] ?? "Unknown Show",
    licenseFee: e.license_fee ?? 0,
    artistShare: e.artist_share ?? 0,
    status: e.status as "pending" | "paid",
    paidAt: e.paid_at,
  }));

  const totalEarned = rows.reduce((s, r) => s + r.artistShare, 0);
  const pendingPayout = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.artistShare, 0);
  const lastPaid = rows.filter((r) => r.status === "paid").sort((a, b) =>
    new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime()
  )[0] ?? null;

  // Monthly chart data — last 12 months
  const now = new Date();
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const total = rows
      .filter((r) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      })
      .reduce((s, r) => s + r.artistShare, 0);
    return { label, total };
  });

  return (
    <EarningsDashboard
      rows={rows}
      totalEarned={totalEarned}
      pendingPayout={pendingPayout}
      lastPaidAmount={lastPaid?.artistShare ?? null}
      lastPaidDate={lastPaid?.paidAt ?? null}
      monthlyData={monthlyData}
      payoutMethod={userRow?.payout_method ?? null}
      payoutEmail={userRow?.payout_email ?? null}
      payoutIban={userRow?.payout_iban ?? null}
    />
  );
}
