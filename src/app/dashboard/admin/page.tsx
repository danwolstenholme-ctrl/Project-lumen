import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Film, Users, Store, DollarSign, Clock, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "admin") redirect(`/dashboard/${role}`);

  const supabase = createAdminClient();

  const [
    { count: artistCount },
    { count: venueCount },
    { count: publishedCount },
    { count: pendingCount },
    { data: earnings },
    { data: pendingShows },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "artist"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "venue"),
    supabase.from("shows").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("shows").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("earnings").select("license_fee, status"),
    supabase
      .from("shows")
      .select("id, title, thumbnail_url, category, created_at, artist_id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(8),
  ]);

  const totalRevenue = (earnings ?? []).reduce((sum, r) => sum + (r.license_fee ?? 0), 0);
  const pendingPayouts = (earnings ?? [])
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + (r.license_fee ?? 0) * 0.7, 0);

  const pendingArtistIds = Array.from(new Set((pendingShows ?? []).map((s) => s.artist_id)));
  const { data: pendingArtists } = pendingArtistIds.length
    ? await supabase.from("users").select("clerk_id, name").in("clerk_id", pendingArtistIds)
    : { data: [] };
  const pendingArtistMap = new Map((pendingArtists ?? []).map((a) => [a.clerk_id, a.name]));

  const stats = [
    { label: "Total Artists",     value: artistCount ?? 0,                              icon: Users,      color: "text-fuchsia-400" },
    { label: "Total Venues",      value: venueCount ?? 0,                               icon: Store,      color: "text-purple-400" },
    { label: "Published Shows",   value: publishedCount ?? 0,                           icon: Film,       color: "text-blue-400" },
    { label: "Platform Revenue",  value: `€${totalRevenue.toFixed(0)}`,                 icon: DollarSign, color: "text-emerald-400" },
  ];

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Admin Overview</h1>
        <p className="font-manrope text-sm text-zinc-500 mt-1">Platform health, review queue, payouts.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-raleway text-xl font-semibold text-zinc-900 dark:text-white tabular-nums">{value}</p>
              <p className="font-manrope text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Pending payouts */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Pending Payouts</span>
          </div>
          <p className="font-raleway text-3xl font-semibold text-zinc-900 dark:text-white">€{pendingPayouts.toFixed(2)}</p>
          <p className="font-manrope text-xs text-zinc-500 mt-1">Royalties owed to artists, paid monthly.</p>
        </div>

        {/* Review queue size */}
        <Link href="/dashboard/admin/shows" className="group p-5 rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 hover:border-fuchsia-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-fuchsia-400" />
            <span className="font-manrope text-[11px] uppercase tracking-widest text-fuchsia-500 dark:text-fuchsia-300 font-semibold">Review Queue</span>
          </div>
          <p className="font-raleway text-3xl font-semibold text-zinc-900 dark:text-white">{pendingCount ?? 0}</p>
          <p className="font-manrope text-xs text-zinc-500 mt-1 flex items-center gap-1">
            Shows awaiting review <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Total earnings */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Lifetime GMV</span>
          </div>
          <p className="font-raleway text-3xl font-semibold text-zinc-900 dark:text-white">€{totalRevenue.toFixed(0)}</p>
          <p className="font-manrope text-xs text-zinc-500 mt-1">Total license fees collected.</p>
        </div>
      </div>

      {/* Review queue preview */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-raleway text-base font-semibold text-zinc-900 dark:text-white">Newest in the review queue</h2>
          <Link href="/dashboard/admin/shows" className="text-xs font-manrope text-fuchsia-500 hover:text-fuchsia-400 transition-colors">
            See all →
          </Link>
        </div>

        {(pendingShows ?? []).length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold">All caught up</p>
            <p className="font-manrope text-sm text-zinc-500 mt-1">No shows waiting for review.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {(pendingShows ?? []).map((show) => (
              <Link
                key={show.id}
                href={`/dashboard/admin/shows#${show.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-14 h-9 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  {show.thumbnail_url
                    ? <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-zinc-400 dark:text-zinc-600" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-raleway font-semibold text-zinc-900 dark:text-white text-sm truncate">{show.title}</p>
                  <p className="font-manrope text-xs text-zinc-500 mt-0.5">
                    by {pendingArtistMap.get(show.artist_id) ?? "Unknown"} · submitted {fmtDate(show.created_at)}
                  </p>
                </div>
                {show.category && (
                  <span className="hidden sm:inline-block font-manrope text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5">
                    {show.category}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
