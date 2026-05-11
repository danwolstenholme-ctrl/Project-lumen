import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";

interface PageProps { params: Promise<{ show_id: string }> }

export default async function ShowDetailPage({ params }: PageProps) {
  const { show_id } = await params;
  const supabase = createAdminClient();

  const { data: show } = await supabase
    .from("shows")
    .select("id, title, description, category, thumbnail_url, preview_url, artist_id, created_at")
    .eq("id", show_id)
    .eq("status", "published")
    .maybeSingle();

  if (!show) notFound();

  const { data: artist } = await supabase
    .from("users")
    .select("name, slug")
    .eq("clerk_id", show.artist_id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {artist?.slug && (
          <Link
            href={`/artists/${artist.slug}`}
            className="inline-flex items-center gap-2 text-sm font-manrope text-zinc-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {artist.name}
          </Link>
        )}

        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60">
          <div className="relative aspect-video bg-zinc-800">
            {show.thumbnail_url ? (
              <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-12 h-12 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="p-8">
            <h1 className="font-raleway text-3xl font-bold text-white">{show.title}</h1>
            {artist && (
              <p className="font-manrope text-zinc-400 mt-1">
                by{" "}
                {artist.slug ? (
                  <Link href={`/artists/${artist.slug}`} className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                    {artist.name}
                  </Link>
                ) : artist.name}
              </p>
            )}
            {show.description && (
              <p className="font-manrope text-zinc-300 mt-4 leading-relaxed">{show.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
