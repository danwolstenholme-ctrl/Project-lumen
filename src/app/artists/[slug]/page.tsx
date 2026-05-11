import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { BadgeCheck, Film, Store, CalendarDays, Mail, Trophy, Sparkles, ArrowLeft } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

const categoryColors: Record<string, string> = {
  ambient:    "text-purple-400 bg-purple-400/10 border-purple-400/20",
  immersive:  "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20",
  nature:     "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  abstract:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  cinematic:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
};
function catClass(c: string | null) {
  return c ? (categoryColors[c.toLowerCase()] ?? "text-zinc-500 bg-zinc-400/10 border-zinc-400/20") : "text-zinc-500 bg-zinc-400/10 border-zinc-400/20";
}

export default async function ArtistProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: artist } = await supabase
    .from("users")
    .select("clerk_id, name, bio, avatar_url, verified, featured, artist_of_month, contact_email, created_at")
    .eq("slug", slug)
    .eq("role", "artist")
    .maybeSingle();

  if (!artist) notFound();

  const { data: shows } = await supabase
    .from("shows")
    .select("id, title, description, category, thumbnail_url, featured")
    .eq("artist_id", artist.clerk_id)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: licenseRows } = await supabase
    .from("licenses")
    .select("venue_id")
    .in("show_id", (shows ?? []).map((s: { id: string }) => s.id));

  const activeVenues = new Set((licenseRows ?? []).map((l: { venue_id: string }) => l.venue_id)).size;
  const memberSince = new Date(artist.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white">
      {/* Top utility bar */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-manrope text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Lumen
          </Link>
          <Link href="/sign-up" className="text-sm font-manrope font-medium text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-400 dark:hover:text-fuchsia-300 transition-colors">
            License a show →
          </Link>
        </div>
      </div>

      {/* Artist of the Month banner */}
      {artist.artist_of_month && (
        <div className="w-full bg-gradient-to-r from-amber-500/15 to-amber-400/5 border-b border-amber-500/20 px-6 py-3 flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="font-manrope text-sm text-amber-700 dark:text-amber-300 font-semibold">
            Project Lumen — Artist of the Month
          </span>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(217,70,239,0.10) 0%, transparent 60%), " +
              "radial-gradient(ellipse 60% 50% at 90% 100%, rgba(168,85,247,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="shrink-0">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.name} className="w-24 h-24 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-200 dark:ring-white/10 flex items-center justify-center">
                <span className="font-raleway text-3xl font-bold text-zinc-500 dark:text-zinc-300">
                  {(artist.name ?? "A").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <h1 className="font-raleway text-4xl font-bold text-zinc-900 dark:text-white">{artist.name}</h1>
              {artist.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-manrope font-semibold uppercase tracking-widest text-fuchsia-500 dark:text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/20 px-2 py-0.5 rounded">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            {artist.bio && (
              <p className="font-manrope text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl">{artist.bio}</p>
            )}
            {artist.contact_email && (
              <a
                href={`mailto:${artist.contact_email}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-manrope text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-400 dark:hover:text-fuchsia-300 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8 flex-wrap">
          {[
            { icon: Film, label: `${(shows ?? []).length} ${(shows ?? []).length === 1 ? "Show" : "Shows"}` },
            { icon: Store, label: `${activeVenues} ${activeVenues === 1 ? "Venue" : "Venues"}` },
            { icon: CalendarDays, label: `Member since ${memberSince}` },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-manrope text-zinc-600 dark:text-zinc-400">
              <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Show grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {(shows ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
              <Film className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold text-lg">No published shows yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(shows ?? []).map((show: {
              id: string; title: string; description: string | null;
              category: string | null; thumbnail_url: string | null; featured: boolean | null;
            }) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="group relative flex flex-col rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {show.thumbnail_url ? (
                    <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                      <Film className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    </div>
                  )}
                  {show.category && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-block text-[10px] font-manrope font-medium uppercase tracking-widest px-2 py-0.5 rounded border ${catClass(show.category)}`}>
                        {show.category}
                      </span>
                    </div>
                  )}
                  {show.featured && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-manrope font-semibold uppercase tracking-widest px-2 py-0.5 rounded border text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30 backdrop-blur-sm">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-raleway font-semibold text-zinc-900 dark:text-white text-sm leading-snug">{show.title}</h3>
                  {show.description && (
                    <p className="font-manrope text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2">{show.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
