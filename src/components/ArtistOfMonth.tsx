import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { Trophy, BadgeCheck } from "lucide-react";

export default async function ArtistOfMonth() {
  const supabase = createAdminClient();

  const { data: artist } = await supabase
    .from("users")
    .select("name, bio, avatar_url, slug, verified")
    .eq("role", "artist")
    .eq("artist_of_month", true)
    .maybeSingle();

  if (!artist?.slug) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("clerk_id")
    .eq("slug", artist.slug!)
    .maybeSingle();
  const { data: shows } = userRow
    ? await supabase
        .from("shows")
        .select("id, title, thumbnail_url")
        .eq("artist_id", userRow.clerk_id)
        .eq("status", "published")
        .order("featured", { ascending: false })
        .limit(3)
    : { data: [] };

  return (
    <section className="w-full bg-gradient-to-r from-amber-600/10 to-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden">
      <div className="px-8 py-6 flex items-center gap-3 border-b border-amber-500/10">
        <Trophy className="w-5 h-5 text-amber-400" />
        <span className="font-raleway text-sm font-semibold text-amber-300 uppercase tracking-widest">
          Artist of the Month
        </span>
      </div>
      <div className="px-8 py-6 flex flex-col md:flex-row items-start gap-6">
        <div className="flex items-center gap-4 shrink-0">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="font-raleway text-2xl font-bold text-zinc-300">
                {(artist.name ?? "A").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-raleway font-bold text-white text-lg">{artist.name}</p>
              {artist.verified && <BadgeCheck className="w-4 h-4 text-fuchsia-400" />}
            </div>
            {artist.bio && <p className="font-manrope text-sm text-zinc-400 mt-0.5 max-w-xs">{artist.bio}</p>}
            <Link
              href={`/artists/${artist.slug}`}
              className="mt-2 inline-flex items-center text-sm font-manrope text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
            >
              View profile →
            </Link>
          </div>
        </div>

        {(shows ?? []).length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {(shows ?? []).map((show: { id: string; title: string; thumbnail_url: string | null }) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="group rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors w-32"
              >
                <div className="aspect-video bg-zinc-800">
                  {show.thumbnail_url
                    ? <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-manrope">No image</div>
                  }
                </div>
                <p className="px-2 py-1.5 font-manrope text-[11px] text-zinc-300 truncate">{show.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
