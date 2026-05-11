import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { Film, ArrowLeft, Sparkles, Calendar } from "lucide-react";

interface PageProps { params: Promise<{ show_id: string }> }

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

export default async function ShowDetailPage({ params }: PageProps) {
  const { show_id } = await params;
  const supabase = createAdminClient();

  const { data: show } = await supabase
    .from("shows")
    .select("id, title, description, category, tags, thumbnail_url, preview_url, artist_id, featured, created_at")
    .eq("id", show_id)
    .eq("status", "published")
    .maybeSingle();

  if (!show) notFound();

  const { data: artist } = await supabase
    .from("users")
    .select("name, slug, avatar_url, verified")
    .eq("clerk_id", show.artist_id)
    .maybeSingle();

  const createdMonth = new Date(show.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href={artist?.slug ? `/artists/${artist.slug}` : "/"}
          className="inline-flex items-center gap-2 text-sm font-manrope text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {artist?.name ? `Back to ${artist.name}` : "Back to Lumen"}
        </Link>

        <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          {/* Hero */}
          <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
            {show.preview_url ? (
              <video src={show.preview_url} controls poster={show.thumbnail_url ?? undefined} className="w-full h-full object-cover" />
            ) : show.thumbnail_url ? (
              <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
              </div>
            )}
            {show.featured && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-manrope font-bold uppercase tracking-widest px-2.5 py-1 rounded border text-fuchsia-400 bg-fuchsia-400/15 border-fuchsia-400/30 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-8 sm:p-10">
            <div className="flex items-start justify-between gap-6 flex-wrap mb-5">
              <div>
                <h1 className="font-raleway text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{show.title}</h1>
                {artist && (
                  <p className="font-manrope text-zinc-500 mt-2">
                    by{" "}
                    {artist.slug ? (
                      <Link href={`/artists/${artist.slug}`} className="text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-400 dark:hover:text-fuchsia-300 transition-colors font-medium">
                        {artist.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-700 dark:text-zinc-300">{artist.name}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {show.category && (
                  <span className={`inline-block font-manrope text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border ${catClass(show.category)}`}>
                    {show.category}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-manrope text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                  <Calendar className="w-3 h-3" /> {createdMonth}
                </span>
              </div>
            </div>

            {show.description && (
              <p className="font-manrope text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">{show.description}</p>
            )}

            {(show.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {(show.tags as string[]).map((tag) => (
                  <span key={tag} className="font-manrope text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
              <p className="font-manrope text-sm text-zinc-500">
                Want this on your tables? <span className="text-zinc-700 dark:text-zinc-300">€30</span>, one-time, permanent license.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white font-manrope font-semibold transition-all"
              >
                License this show
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
