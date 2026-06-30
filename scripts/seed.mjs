// Seed demo data for Project Lumen.
//
// Looks up an artist + a venue account in Clerk *by email*, assigns their
// roles, then populates a full graph of demo content so both dashboards look
// real: published shows (public thumbnails + playable preview clips + a Mux
// demo playback id), a venue with tables, the licenses linking venue → shows,
// and artist earnings.
//
// Both accounts must already exist in Clerk (sign up + finish onboarding once).
//
// Run:
//   node --env-file=.env.local scripts/seed.mjs --artist=you+artist@x.com --venue=you+venue@x.com
//   (or: npm run seed -- --artist=... --venue=...)
//
// Idempotent: re-running clears the rows this script owns (seed shows for the
// artist, all licenses/tables for the venue) and re-creates them.

import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";

// ---- args + env -----------------------------------------------------------
const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const artistEmail = arg("artist") || process.env.SEED_ARTIST_EMAIL;
const venueEmail = arg("venue") || process.env.SEED_VENUE_EMAIL;

if (!artistEmail || !venueEmail) {
  console.error("Usage: node --env-file=.env.local scripts/seed.mjs --artist=<email> --venue=<email>");
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLERK_SECRET_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
  console.error("Missing env. Run with `node --env-file=.env.local ...` so it loads .env.local.");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

const SEED_MARKER = "seed:"; // mux_upload_id prefix that flags a row as ours
const MUX_DEMO_PLAYBACK_ID = "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"; // public Mux demo asset

// Public, reliable sample mp4s — rendered in the venue/show <video> previews.
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

const SHOWS = [
  { title: "Bioluminescent Drift", category: "Nature", tags: ["ocean", "calm", "blue"], description: "Glowing plankton ripple across the table in slow, breathing waves." },
  { title: "Aurora Cathedral", category: "Cosmic", tags: ["aurora", "ambient", "green"], description: "Northern lights fold into vaulted arches of shifting colour." },
  { title: "Kintsugi Bloom", category: "Botanical", tags: ["flowers", "gold", "elegant"], description: "Cracked porcelain heals in veins of gold as petals unfurl." },
  { title: "Tessellate", category: "Geometric", tags: ["abstract", "rhythm", "mono"], description: "Interlocking tiles cascade and re-form in hypnotic rhythm." },
  { title: "Deep Field", category: "Cosmic", tags: ["space", "stars", "vast"], description: "A slow drift through nebulae and distant galaxies." },
  { title: "Monsoon Glass", category: "Nature", tags: ["rain", "moody", "reflection"], description: "Rain runs down glass over a neon city, reflections blooming." },
  { title: "Solar Loom", category: "Abstract", tags: ["warm", "energy", "gold"], description: "Threads of molten light weave a restless, sunlit tapestry." },
  { title: "Tidal Lanterns", category: "Oceanic", tags: ["lanterns", "warm", "serene"], description: "Paper lanterns set adrift bob gently on a dark tide." },
];

// ---- helpers --------------------------------------------------------------
const now = () => new Date().toISOString();
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString(); };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artist";

async function findUserByEmail(email) {
  const { data } = await clerk.users.getUserList({ emailAddress: [email] });
  const u = data?.[0];
  if (!u) throw new Error(`No Clerk user for "${email}". Sign up + finish onboarding first.`);
  return u;
}
const primaryEmail = (u) =>
  u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
  u.emailAddresses[0]?.emailAddress ?? "";
const fullName = (u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();

async function setupAccount(email, role, fallbackName) {
  const u = await findUserByEmail(email);
  await clerk.users.updateUserMetadata(u.id, { publicMetadata: { role } });
  const name = fullName(u) || fallbackName;
  const row = { clerk_id: u.id, role, name, email: primaryEmail(u) };
  if (role === "artist") row.slug = slugify(name);
  const { error } = await supabase.from("users").upsert(row, { onConflict: "clerk_id" });
  if (error) throw new Error(`users upsert (${role}): ${error.message}`);
  console.log(`  role set → ${role.padEnd(6)} ${email}  (${u.id})`);
  return { clerkId: u.id, name };
}

function die(label, error) {
  if (error) { console.error(`✗ ${label}: ${error.message}`); process.exit(1); }
}

// ---- run ------------------------------------------------------------------
console.log("Project Lumen — seeding demo data\n");

console.log("Accounts:");
const artist = await setupAccount(artistEmail, "artist", "Demo Artist");
const venue = await setupAccount(venueEmail, "venue", "Demo Venue");

// Clean up anything a previous run created, in FK-safe order.
const { data: oldShows } = await supabase
  .from("shows").select("id").eq("artist_id", artist.clerkId).like("mux_upload_id", `${SEED_MARKER}%`);
const oldShowIds = (oldShows ?? []).map((s) => s.id);

await supabase.from("earnings").delete().eq("venue_id", venue.clerkId).eq("artist_id", artist.clerkId);
await supabase.from("licenses").delete().eq("venue_id", venue.clerkId);
if (oldShowIds.length) await supabase.from("shows").delete().in("id", oldShowIds);
console.log(`\nCleared ${oldShowIds.length} prior seed show(s).`);

// Shows — published + Mux-ready so they surface to venues and on the marketplace.
const showRows = SHOWS.map((s, i) => ({
  id: crypto.randomUUID(),
  artist_id: artist.clerkId,
  title: s.title,
  description: s.description,
  category: s.category,
  tags: s.tags,
  thumbnail_url: `https://picsum.photos/seed/lumen-${i + 1}/1920/1080`,
  preview_url: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
  mux_upload_id: `${SEED_MARKER}${i + 1}`,
  mux_asset_id: `${SEED_MARKER}asset-${i + 1}`,
  mux_playback_id: MUX_DEMO_PLAYBACK_ID,
  mux_status: "ready",
  status: "published",
  featured: i < 2,                 // first two boosted to the top of the library
  artist_of_month: i === 0,
  video_metadata: { width: 3840, height: 2160, frame_rate: 60, duration: 120 + i * 15, audio: { channels: 2 } },
  created_at: monthsAgo(i % 4),
}));
{
  const { error } = await supabase.from("shows").insert(showRows);
  die("insert shows", error);
  console.log(`Inserted ${showRows.length} published shows.`);
}

// Venue + tables.
const { data: venueRow, error: venueErr } = await supabase
  .from("venues")
  .upsert({ user_id: venue.clerkId, name: `${venue.name}'s Bistro`, default_volume: 80, default_brightness: 90 },
          { onConflict: "user_id" })
  .select("id").single();
die("upsert venue", venueErr);

await supabase.from("tables").delete().eq("venue_id", venueRow.id);
const tableRows = [
  { venue_id: venueRow.id, label: "Window Table", ip_address: "192.168.1.50", status: "online_idle" },
  { venue_id: venueRow.id, label: "Booth 2", ip_address: "192.168.1.51", status: "online_playing" },
  { venue_id: venueRow.id, label: "Centre Table", ip_address: "192.168.1.52", status: "online_idle" },
  { venue_id: venueRow.id, label: "Private Room", ip_address: null, status: "offline" },
];
die("insert tables", (await supabase.from("tables").insert(tableRows)).error);
console.log(`Created venue + ${tableRows.length} tables.`);

// Licenses (venue_id = venue's Clerk id, matching how the app queries them) +
// matching artist earnings.
const licenseRows = showRows.map((s) => ({ venue_id: venue.clerkId, show_id: s.id, licensed_at: monthsAgo(1) }));
die("insert licenses", (await supabase.from("licenses").insert(licenseRows)).error);

const LICENSE_FEE = 30, ARTIST_SHARE = 0.7;
const earningRows = showRows.map((s, i) => ({
  artist_id: artist.clerkId,
  venue_id: venue.clerkId,
  show_id: s.id,
  license_fee: LICENSE_FEE,
  artist_share: LICENSE_FEE * ARTIST_SHARE,
  status: i % 3 === 0 ? "paid" : "pending",
  created_at: monthsAgo(i % 3),
}));
die("insert earnings", (await supabase.from("earnings").insert(earningRows)).error);
console.log(`Licensed all ${licenseRows.length} shows to the venue + created earnings.`);

// Point the venue's default show at the first one.
await supabase.from("venues").update({ default_show_id: showRows[0].id }).eq("id", venueRow.id);

console.log(`\n✓ Done.
  Artist  ${artistEmail}  → /dashboard/artist
  Venue   ${venueEmail}   → /dashboard/venue/quickplay
Log in as each to see the populated dashboards. Re-run anytime to reset.`);
