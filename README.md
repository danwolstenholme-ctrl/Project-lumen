# Project Lumen

An immersive-dining platform. Digital artists upload 4K video "pieces"; restaurants
license them and project them onto their dining tables. Staff run the room from an
iPad: one tap starts the same piece on every table at once, time-synced.

The repository contains two applications:

| Path            | What it is                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| `src/`          | The web platform — Next.js 16 app serving the marketing site and three dashboards (artist, venue, admin) |
| `lumen-player/` | The on-table software — Python service that runs on each table's mini-PC and plays the video full-screen via mpv |

---

## Contents

- [How it works](#how-it-works)
- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Setup](#setup)
- [Running it](#running-it)
- [Things that will surprise you](#things-that-will-surprise-you)
- [Domain reference](#domain-reference)
- [Deployment](#deployment)
- [Known gaps](#known-gaps)

---

## How it works

### The three user roles

**Artists** upload pieces through a three-step wizard. Every upload is validated
automatically against a hard technical spec (3840×2160, 60fps, ≥60s, stereo audio).
Pieces that pass go into an admin review queue; pieces that fail are rejected
immediately with specific, human-readable reasons. Artists track status on their
dashboard, see earnings, and can pay to have a piece featured.

**Venues** browse published pieces, license them (€30 each, permanent — not a
subscription), register their tables, and drive playback. The primary venue screen is
**Quick Play** — an iPad-first page whose whole job is one large "Start the Show"
button.

**Admins** review the pending queue (approve, or reject with a reason) and see
platform-wide stats.

### Playback architecture

Control is fully cloud-based — there is no LAN dependency between the iPad and the
tables, and no inbound ports or static IPs at the venue.

```
   iPad (Quick Play)                         Each table's mini-PC
          │                                   (Lumen Player, Python)
          │ publish                                    ▲
          │ broadcast "command"                        │ subscribe
          ▼                                            │ (outbound WSS)
   ┌──────────────────────────────────────────────────────────┐
   │      Supabase Realtime — channel  table:<tables.id>      │
   └──────────────────────────────────────────────────────────┘

   The player then streams the video straight from Mux's HLS CDN:
       https://stream.mux.com/<mux_playback_id>.m3u8
   Video never passes through the Next.js server.

   The player writes its own state back to the `tables` row, and
   Postgres change events push that back to every venue dashboard,
   which is how the live "3/4 tables online" badge stays accurate.
```

**How tables stay in sync.** When staff tap "Start the Show", the dashboard captures
one wall-clock timestamp and sends `{ action: "play", show_id, timestamp }` to every
online table. Each player independently computes
`offset = (now - timestamp) % video_duration` and seeks there before starting. Because
they all derive their position from the same shared timestamp rather than from when the
message happened to arrive, they converge on the same frame regardless of delivery
latency.

### Upload pipeline

```
Artist fills wizard
   │
   ├─ thumbnail ──► Supabase Storage (signed upload URL)
   └─ video ──────► Mux Direct Upload (browser uploads straight to Mux)
   │
   ▼
POST /api/shows                       row created, status = 'preparing'
   │                                  (also probes Mux inline — see below)
   ▼
Mux processes and probes the file
   │
   ├─ video.upload.asset_created ──►  links mux_asset_id to the row
   ├─ video.asset.ready ───────────►  runs the spec rules:
   │                                    pass → status = 'pending'  (admin queue)
   │                                    fail → status = 'rejected' + reasons
   └─ video.asset.errored ─────────►  status = 'rejected'
   │
   ▼
Admin approves ──► status = 'published'  → visible to venues, licensable
Admin rejects  ──► status = 'rejected'   → artist sees reason + re-upload button
```

Two details worth knowing before you touch this code:

- **The submit/webhook race is handled deliberately.** Mux can finish processing
  before the artist hits Submit, meaning `video.asset.ready` fires before the database
  row exists. `POST /api/shows` therefore calls `mux.video.uploads.retrieve()` inline
  and applies the result immediately, so a piece can't get stuck in `preparing`
  forever.
- **Webhook handling is idempotent.** Every state-applying update is guarded by
  `.eq("mux_status", "waiting")`, so Mux retries are harmless and a state an admin has
  already modified never gets overwritten.

Events are correlated across the whole flow by Mux's `passthrough` field, which is set
to the show's UUID when the upload URL is created. That makes the pipeline resilient to
webhook events arriving out of order.

---

## Stack

| Layer            | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Framework        | Next.js 16.2.6, App Router (React 19, server components by default) |
| Auth             | Clerk 7 — role held in `publicMetadata.role`                        |
| Database         | Supabase Postgres                                                   |
| File storage     | Supabase Storage (`shows` thumbnails, `users` avatars)              |
| Video            | Mux — Direct Upload, asset probing, HLS playback                    |
| Realtime         | Supabase Realtime — broadcast channels for commands, Postgres change events for status |
| Payments         | Stripe Checkout + webhooks                                          |
| Email            | Resend                                                              |
| Charts           | Recharts                                                            |
| Styling          | Tailwind v4, class-based dark mode                                  |
| Fonts            | Raleway (headings), Manrope (body) via `next/font/google`           |
| Icons            | lucide-react                                                        |
| On-table player  | Python 3.11+, mpv, `websockets`, `httpx`                            |

---

## Repository layout

```
src/
├── proxy.ts                    Clerk auth middleware — note the filename
├── app/
│   ├── layout.tsx              ClerkProvider, ThemeProvider, fonts, anti-FOUC script
│   ├── globals.css             Tailwind v4 + dark variant + .skeleton
│   ├── page.tsx                Landing entry (redirects to /dashboard if signed in)
│   ├── MarketingLanding.tsx    Public homepage, driven by live data
│   ├── onboarding/             Role picker for new users
│   ├── sign-in/, sign-up/      Clerk widgets in a branded shell
│   ├── artists/[slug]/         Public artist profile
│   ├── shows/[show_id]/        Public piece detail
│   ├── api/                    All server routes — see Domain reference
│   └── dashboard/
│       ├── layout.tsx          Auth gate + role fetch
│       ├── page.tsx            Redirects by role
│       ├── artist/             Studio, upload wizard, earnings, boost, settings
│       ├── venue/              Quick Play, show library, control panel, tables
│       └── admin/               Stats overview, review queue
├── components/                 Shared shell, nav, theme, toasts
└── utils/
    ├── mux.ts                  Lazy-initialised Mux client
    ├── muxValidation.ts        The piece spec + validation + apply-to-row logic
    └── supabase/               admin (service role), client (browser), server (SSR)

lumen-player/                   On-table Python service — has its own README
scripts/seed.mjs                Demo-data seeder
LUMEN_SCHEMA.sql                Database bootstrap (idempotent)
LUMEN_SCHEMA_002_mux.sql        Migration 002 — Mux columns
```

Every dashboard route has a `loading.tsx` skeleton beside its `page.tsx`.

---

## Setup

### Prerequisites

- **Node.js 20.9+** (Next.js 16's minimum)
- **npm** (the repo has a `package-lock.json`)
- Accounts on **Supabase**, **Clerk**, **Mux**, **Stripe**, and **Resend** — all five
  have free tiers sufficient to run this locally
- For the on-table player only: **Python 3.11+** and **mpv**

### 1. Install

```bash
npm install
```

### 2. Create the database

In your Supabase project, open the **SQL Editor** and run, in order:

1. `LUMEN_SCHEMA.sql` — creates all six tables, their indexes, and enables Realtime on
   `tables`
2. `LUMEN_SCHEMA_002_mux.sql` — adds the Mux columns and the `preparing` status

Both scripts are idempotent, so re-running them is safe. Each ends with a sanity-check
`SELECT` so you can confirm it worked.

### 3. Create the storage buckets

Still in Supabase, under **Storage**, create two buckets — both **public**:

| Bucket  | Holds             | Path convention                                     |
| ------- | ----------------- | --------------------------------------------------- |
| `shows` | Piece thumbnails  | `<artist_clerk_id>/<show_id>/thumbnail.<ext>`        |
| `users` | Avatars           | `avatars/<clerk_id>.<ext>`                          |

Public read is required (the marketing site and dashboards load these directly).
Writes only ever happen server-side, via signed upload URLs or the service-role key.

### 4. Configure environment variables

Create `.env.local` in the repository root:

```bash
# ── Clerk ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ── Supabase ───────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=      # anon / publishable key
SUPABASE_SERVICE_ROLE_KEY=                 # server-only, never expose

# ── Mux ────────────────────────────────────────────────────────────────
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=                        # per-endpoint signing secret

# ── Stripe ─────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ── Resend ─────────────────────────────────────────────────────────────
RESEND_API_KEY=
```

### 5. Configure the webhooks

**Mux** → Settings → Webhooks. Point a new endpoint at
`https://<your-domain>/api/mux/webhook` and copy its signing secret into
`MUX_WEBHOOK_SECRET`. The app handles `video.upload.asset_created`,
`video.asset.ready`, and `video.asset.errored`; any other event is logged and
acknowledged.

**Stripe** → Developers → Webhooks. Point an endpoint at
`https://<your-domain>/api/stripe/webhook` listening for
`checkout.session.completed`, and copy the signing secret into
`STRIPE_WEBHOOK_SECRET`.

Both webhook routes are deliberately public — they're excluded from auth in
`src/proxy.ts`. Do not "fix" that.

> **Webhooks and localhost.** Mux and Stripe cannot reach `localhost`, so the
> validation flow will not complete on a local machine — uploads sit at `preparing`
> indefinitely. Tunnel a public URL to your dev server (`ngrok`, `cloudflared`) and
> point the webhook at the tunnel. For Stripe specifically, `stripe listen --forward-to
> localhost:3000/api/stripe/webhook` is simpler.

### 6. Create your first users

Roles are not self-service beyond the initial artist/venue choice:

- **Artist and venue** — sign up through the app; `/onboarding` prompts for the role.
- **Admin** — must be set by hand. In the Clerk dashboard, open the user, and set
  **Public metadata** to `{ "role": "admin" }`.

The role is stored in two places: `publicMetadata.role` in Clerk (authoritative, used
for routing and server-side gating) and `users.role` in Postgres (denormalised, so SQL
queries can filter by role). `POST /api/user/role` writes both.

### 7. Optional — seed demo data

Both accounts must already exist in Clerk and have completed onboarding first.

```bash
npm run seed -- --artist=you+artist@example.com --venue=you+venue@example.com
```

This creates published pieces with playable video, a venue with tables, the licenses
linking them, and earnings rows — enough to make every dashboard look real. It's
idempotent: re-running clears the rows it owns and recreates them.

---

## Running it

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build — must pass clean before deploying
npm start        # serve the production build
npm run lint     # eslint
npm run seed     # demo data (see above)
```

The on-table player has its own setup, both for a Raspberry Pi and for local
development on macOS. See **[lumen-player/README.md](lumen-player/README.md)**.

---

## Things that will surprise you

**This is Next.js 16, and some of it is genuinely different.** If your instinct
disagrees with the framework docs in `node_modules/next/dist/docs/`, the docs are
right. The specifics that have already caught people out:

1. **Middleware lives in `src/proxy.ts`, not `src/middleware.ts`,** and the export is
   named `proxy`, not `middleware`. This is not a typo and renaming it will break auth
   across the entire app.
2. **`params` and `searchParams` are Promises.** Always `await params` before reading
   from it.
3. **Tailwind v4 dark mode is opt-in.** The classic `dark:` variant only works because
   of the explicit `@custom-variant dark (&:where(.dark, .dark *));` line in
   `globals.css`. Remove it and every `dark:` class in the codebase silently stops
   working.
4. **`globals.css` is imported only in the root `layout.tsx`** — never in a page.

**Third-party SDKs must be initialised inside handlers, never at module level.**
`new Stripe(...)` or `new Resend(...)` at the top of a route file crashes the
production build, because Next evaluates modules during page-data collection when env
vars may still be placeholders. `src/utils/mux.ts` shows the lazy-init pattern the
codebase uses; follow it.

**`venue_id` is not what you'd expect.** In the `licenses` and `earnings` tables,
`venue_id` holds the venue owner's **Clerk ID** — not `venues.id`. This is
intentional denormalisation. Be careful when writing joins.

**"Show" in the code means "Piece" in the UI.** The database table, route paths, and
types all say `show`; artist-facing copy says "Piece". The rename was applied to the UI
only, to avoid a large mechanical refactor. They mean the same thing.

**Two screens are dark-only by design.** `/dashboard/venue/quickplay` and
`/dashboard/venue/control` have no `dark:` variants — they run on an iPad in a
low-lit dining room and should never render light. The marketing landing page is
likewise dark-only. Everywhere else supports both themes.

**There is no row-level security.** Access control lives in `src/proxy.ts` plus
server-side checks in every route. The service-role Supabase client is server-only.
If you start querying sensitive data directly from the browser, this needs revisiting.

---

## Domain reference

### Business rules encoded in the code

| Rule                    | Value                                              |
| ----------------------- | -------------------------------------------------- |
| Piece licence fee       | €30, one-time and permanent                        |
| Artist share            | 70% (€21) — the remaining 30% is platform revenue  |
| Featured piece boost    | €75/month                                          |
| Homepage feature boost  | €150/month                                         |
| Payout threshold        | €50 minimum, monthly, via PayPal or IBAN           |
| Piece spec              | 3840×2160, 60fps ±1%, ≥60s, stereo audio           |

The spec lives in one place — `PIECE_SPEC` in
[src/utils/muxValidation.ts](src/utils/muxValidation.ts). Change it there and both the
webhook and the submit-time path pick it up.

### Database tables

| Table      | Purpose                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `users`    | Mirrors Clerk identities. Keyed by `clerk_id` (text, not a UUID). Holds role, profile, payout details. |
| `shows`    | Pieces. Mux columns, `video_metadata` JSONB, and the status lifecycle. |
| `venues`   | One row per venue user. Holds the Quick Play defaults (show, volume, brightness). |
| `tables`   | Projector tables. `status` is written by the player and read live by the dashboard. |
| `licenses` | Venue → piece. Unique on `(venue_id, show_id)`.                        |
| `earnings` | Royalty ledger. One row per licence, `pending` until paid.             |

`shows.status` moves through: `draft` → `preparing` → `pending` → `published`, with
`rejected` reachable from `preparing` (automatic, spec failure) or `pending` (an
admin's decision).

`tables.status` is one of `online_playing`, `online_idle`, `offline`.

Full definitions are in [LUMEN_SCHEMA.sql](LUMEN_SCHEMA.sql) — that file is the source
of truth, not this table.

### API routes

All under `src/app/api/`. All require authentication except the two webhooks.

| Route                          | Method            | Purpose                                     |
| ------------------------------ | ----------------- | ------------------------------------------- |
| `/api/shows`                   | POST              | Submit a piece; starts at `preparing`       |
| `/api/shows/upload-url`        | POST              | Returns a Mux upload URL for video, or a Supabase signed URL for a thumbnail |
| `/api/artist/avatar`           | POST              | Avatar upload (2MB, JPG/PNG)                |
| `/api/artist/bio`              | PATCH             | Short bio (160 chars)                       |
| `/api/artist/payout`           | PATCH             | Payout method and details                   |
| `/api/artist/settings`         | PATCH             | Name, bio, contact email, slug, notifications |
| `/api/venue/tables`            | POST/PATCH/DELETE | Table CRUD                                  |
| `/api/venue/settings`          | PATCH             | Venue name and Quick Play defaults (creates the venue row on first call) |
| `/api/licenses`                | POST              | License a piece — writes both a `licenses` and an `earnings` row |
| `/api/admin/shows/[id]`        | PATCH             | Approve, or reject with a reason            |
| `/api/boost/checkout`          | POST              | Create a Stripe Checkout session            |
| `/api/user/role`               | POST              | Set role in Clerk and Postgres              |
| `/api/stripe/webhook`          | POST              | **Public.** Handles `checkout.session.completed` |
| `/api/mux/webhook`             | POST              | **Public.** Signature-verified; runs upload validation |

### Player command protocol

Published to the Supabase Realtime channel `table:<tables.id>` as a `command`
broadcast event:

| Command      | Payload                                                    |
| ------------ | ---------------------------------------------------------- |
| `play`       | `{action:"play", show_id, timestamp, volume?, brightness?}` |
| `pause`      | `{action:"pause"}`                                         |
| `resume`     | `{action:"resume"}`                                        |
| `stop`       | `{action:"stop"}`                                          |
| `volume`     | `{action:"volume", value: 0..1}`                           |
| `brightness` | `{action:"brightness", value: 0..1}` — software dim        |
| `ping`       | `{action:"ping"}`                                          |

The player also runs a LAN WebSocket server on port 8765 speaking the same protocol,
kept as a bench-testing fallback. See
[lumen-player/README.md](lumen-player/README.md) for the full details.

### Conventions

- **Server components fetch, client components react.** Data loading belongs in
  `page.tsx`; interactive state belongs in a `"use client"` component that receives it
  as props.
- **44px minimum touch targets.** The venue screens are used on an iPad, often quickly
  and in low light.
- **Brand gradient is `from-fuchsia-500 to-purple-500`.** Palette: `#D946EF`
  fuchsia, `#A855F7` purple, `#F59E0B` amber, on `#09090B`.
- **Toasts** dispatch a `lumen-toast` CustomEvent — `import { toast } from "@/utils/toast"`.
- **Skeletons** use the `.skeleton` class from `globals.css` and should mirror the real
  layout so pages don't jump.
- **`type="button"` on every non-submit button**, and `title="..."` on icon-only ones.

---

## Deployment

Hosted on Vercel; the `main` branch deploys to production automatically.

- Mirror every variable from `.env.local` into the Vercel project's environment
  settings.
- Re-point the Mux and Stripe webhooks at the deployed domain, and update the two
  signing secrets — they're per-endpoint.
- `npm run build` must complete with zero errors before you deploy. Two build failures
  are easy to reintroduce: module-level SDK initialisation (see above), and Recharts'
  `Tooltip` formatter, whose value parameter is typed `ValueType | undefined` — wrap it
  as `Number(v ?? 0)`.

---

## Known gaps

Deliberately not built. Worth knowing before you go looking for them:

1. **No payout cron.** Earnings accumulate as `pending` and the admin and artist views
   display them, but nothing actually pays anyone. The intended design is a monthly job
   that groups pending earnings by artist, pays any artist over the €50 threshold with
   a payout method set, and marks those rows `paid`.
2. **No featured-piece expiry.** Stripe sets `featured = true` and `featured_until`,
   but nothing clears it — a boost currently runs indefinitely until someone unsets the
   flag by hand.
3. **No scheduling.** Playback is manual only; there's no "start at 19:00" and no
   automatic cycling between pieces.
4. **No analytics page.** `ArtistStudio.tsx` links to `/dashboard/artist/analytics`,
   which does not exist. Dead link.
5. **No admin user management.** Users are edited in the Clerk and Supabase dashboards.
6. **No licence cancellation.** Venues can license a piece but can't release it from
   the UI.
7. **No iOS PWA manifest.** Venues bookmark Quick Play in Safari; it doesn't launch
   full-screen.
8. **Single Supabase project.** Development and production share one database.
9. **The player uses a full service-role key.** Each table's mini-PC holds a
   high-privilege Supabase credential. A per-table JWT is the obvious replacement.
10. **The player has not been tested on real Pi hardware.** It was written ahead of
    hardware delivery. Treat the first end-to-end run as design validation.
