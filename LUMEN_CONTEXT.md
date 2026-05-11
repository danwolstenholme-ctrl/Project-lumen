# Project Lumen — Comprehensive Context

> Read this **first** before doing any work on Lumen. It is the single source of truth for what the platform is, how it's built, and where the load-bearing pieces live.

---

## 1. What Project Lumen Is

**One-line:** A two-sided licensing marketplace where digital artists upload immersive 4K loops, restaurants license them, and an iPad behind the bar projects them onto every dining table.

**Tagline:** _Where dining becomes theatre._

**The business:**
- Digital artists upload 3840×2160 · 60fps · seamless-loop video shows.
- Restaurants (venues) browse the curated library and pay **€30 per license** — permanent, not subscription.
- The artist takes **70%** of every license fee. Lumen keeps 30%.
- Artists can additionally pay for **Featured Show boost** (€75/mo) or **Homepage Feature** (€150/mo) via Stripe.
- One artist per month is named **Artist of the Month** by admins and gets a homepage spotlight.
- Royalty payouts: monthly on the 1st, €50 minimum threshold, via PayPal or IBAN.

**The physical product:**
- Each restaurant has multiple **tables** — each table is a projector pointed straight down at a 160×90cm physical surface, viewed from above by seated diners.
- Each projector runs the "Lumen player" (a separate desktop/embedded app that listens on `ws://<table-ip>:8765`).
- The web dashboard sends WebSocket commands to each table's IP to play/pause/stop/set-volume/set-brightness.
- The killer move: the iPad UI lets staff tap **one button** and every table comes alive at the same instant.

**Why it's expensive to be expensive:** This is not "another art marketplace." Lumen is high-touch hospitality tech. The dashboard's aesthetic, motion, and tactility *is* the product pitch — when a venue manager sees the iPad, they need to feel like they're holding the controls to a Michelin-star room.

---

## 2. Stack

| Layer            | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Framework        | **Next.js 16.2.6 App Router** (React 19, server components default) |
| Auth             | **Clerk 7** (`@clerk/nextjs`, `publicMetadata.role` for role gating) |
| Database         | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`)             |
| File storage     | Supabase Storage buckets (`shows`, `users`)                         |
| Payments         | **Stripe** Checkout + webhooks                                      |
| Transactional email | **Resend**                                                       |
| Charts           | **Recharts** (artist earnings)                                      |
| Styling          | **Tailwind v4** (class-based dark mode via `@custom-variant`)       |
| Fonts            | **Raleway** (headings), **Manrope** (body) via `next/font/google`   |
| Icons            | **lucide-react**                                                    |
| Realtime         | Supabase Realtime (postgres_changes) + raw browser WebSocket to tables |

**Brand colors:** `#D946EF` (fuchsia), `#A855F7` (purple), `#F59E0B` (amber) on `#09090B` (zinc-950) dark / `#F4F4F5` light.

---

## 3. ⚠️ Critical: This is NOT the Next.js you know

The repo has a `AGENTS.md` that mandates:

> Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Specifics already encountered and confirmed:
- **`params` and `searchParams` are Promises.** Always `await params` before using.
- **Middleware file is `src/proxy.ts`**, not `src/middleware.ts`. Export is `proxy`, not `middleware`. See `next.config.ts`.
- The classic `dark:` Tailwind variant requires the explicit `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (class-based, not media).
- **No `globals.css` import in pages** — only in root `layout.tsx`.

If the docs in `node_modules/next/dist/docs/` describe something differently than your prior knowledge, **trust the docs**.

---

## 4. Routes & UX flow

### Public (no auth required, see `src/proxy.ts`)
| Route             | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| `/`               | **Marketing landing** — public homepage with live data    |
| `/sign-in`        | Clerk sign-in (white card on dark/light branded layout)   |
| `/sign-up`        | Clerk sign-up                                             |
| `/artists/[slug]` | Public artist portfolio (shareable URL)                   |
| `/shows/[show_id]` | Public show detail page                                  |
| `/api/stripe/webhook` | Stripe webhook receiver (must be public!)              |

### Authenticated — common
| Route          | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `/dashboard`   | Role router — redirects based on `publicMetadata.role`      |
| `/onboarding`  | New users pick artist/venue role (admin assigned manually)  |

### Artist dashboard
| Route                              | Purpose                                                          |
| ---------------------------------- | ---------------------------------------------------------------- |
| `/dashboard/artist`                | Studio — header card, 4 stat tiles, all shows with status        |
| `/dashboard/artist/upload`         | 3-step upload wizard (Details → Media → Confirm)                 |
| `/dashboard/artist/earnings`       | Bar chart, sortable transaction table, CSV export, payout form   |
| `/dashboard/artist/boost`          | Stripe boost checkout (Featured/Homepage × 1/3/6 months)         |
| `/dashboard/artist/settings`       | Avatar, bio, slug, contact email, notifications                  |

### Venue dashboard
| Route                              | Purpose                                                          |
| ---------------------------------- | ---------------------------------------------------------------- |
| `/dashboard/venue/quickplay` ⭐     | **iPad-first one-button start.** Default landing for venues.     |
| `/dashboard/venue`                 | Full show library — browse, search, license shows                |
| `/dashboard/venue/control`         | Advanced 3-pane control panel (tables × library × now-playing)   |
| `/dashboard/venue/tables`          | Add/edit/delete tables (label + IP address), ping test           |

### Admin dashboard
| Route                              | Purpose                                                          |
| ---------------------------------- | ---------------------------------------------------------------- |
| `/dashboard/admin`                 | Stats overview + review queue preview                            |
| `/dashboard/admin/shows`           | Approve/reject pending show submissions with reason              |

---

## 5. The ⭐ Quick Play page (THE PRODUCT)

**File:** `src/app/dashboard/venue/quickplay/QuickPlay.tsx`

This is the single most important screen in the whole app. It's what a venue manager opens on the iPad behind the bar. **The entire business runs through this button.**

### Layout
- **Top bar:** Venue name, live clock (updates every 30s), tables-online badge ("3/4 tables online")
- **Centre hero:** A massive 2:1 card showing the venue's default show ("Tonight's Show"). On top of it, **one giant button**: "Start the Show" (gradient fuchsia → purple, ~240×72px minimum) — when playing, the same button morphs into "Stop All Tables" (white).
- **Quick-switch row:** 4 thumbnail cards under the hero. Each is one tap to play that show on every online table.
- **Right sidebar:** Live table status (online_playing/online_idle/offline with colored dots), volume slider, brightness slider.
- **Default-show picker modal:** Grid of all licensed shows. Tap one → it becomes the default for "Start the Show".

### Behavior
- When the user taps "Start the Show":
  1. The current `Date.now()` timestamp is captured.
  2. A WebSocket is opened to every online table at `ws://<ip>:8765`.
  3. Each WS receives `{ action: "play", show_id, timestamp }` — the shared timestamp means all projectors start their video at the same wall-clock moment.
  4. Local state flips: tables marked `online_playing`, hero button morphs to "Stop All".
- 2-second timeout — if a table doesn't ack, it's marked offline and the user sees a toast.
- The "Other shows" row plays any other licensed show instantly across all online tables.

### Auto-fallbacks
- If no tables configured → big CTA: "Add your first table" → goes to `/dashboard/venue/tables`.
- If no shows licensed → big CTA: "Open the Show Library" → goes to `/dashboard/venue`.

### Key state shape
```ts
tables: Table[]           // updated via Supabase Realtime + WS errors
defaultShow: Show | null  // persisted to `venues.default_show_id`
playingShowId: string | null
volume: number            // 0-100, persisted to `venues.default_volume`
brightness: number        // 0-100, persisted to `venues.default_brightness`
```

---

## 6. Database schema (Supabase)

> **You need to run the SQL below in Supabase before everything works.** The web app assumes these tables exist with these columns.

### `users` (mirrors Clerk identities)
```sql
CREATE TABLE users (
  clerk_id           TEXT PRIMARY KEY,
  email              TEXT,
  name               TEXT,
  role               TEXT CHECK (role IN ('artist','venue','admin')),
  slug               TEXT UNIQUE,
  bio                TEXT,
  avatar_url         TEXT,
  contact_email      TEXT,
  verified           BOOLEAN DEFAULT false,
  featured           BOOLEAN DEFAULT false,
  artist_of_month    BOOLEAN DEFAULT false,
  notify_on_license  BOOLEAN DEFAULT true,
  payout_method      TEXT,   -- 'paypal' | 'bank'
  payout_email       TEXT,
  payout_iban        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### `shows` (uploaded by artists)
```sql
CREATE TABLE shows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         TEXT REFERENCES users(clerk_id),
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,    -- 'Ocean'|'Fire'|'Abstract'|'Forest'|'Space'|'Seasonal'|'Custom'
  tags              TEXT[],
  thumbnail_url     TEXT,
  preview_url       TEXT,    -- short 10-30s clip
  video_url         TEXT,    -- full 4K @ 60fps loop
  audio_url         TEXT,
  status            TEXT CHECK (status IN ('draft','pending','published','rejected')),
  rejection_reason  TEXT,
  featured          BOOLEAN DEFAULT false,
  featured_until    TIMESTAMPTZ,
  homepage_featured BOOLEAN DEFAULT false,
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON shows (artist_id);
CREATE INDEX ON shows (status);
CREATE INDEX ON shows (featured);
```

### `venues` (one per venue user)
```sql
CREATE TABLE venues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT UNIQUE REFERENCES users(clerk_id),  -- clerk_id of venue owner
  name                TEXT NOT NULL,
  default_show_id     UUID REFERENCES shows(id),
  default_volume      INTEGER DEFAULT 80,
  default_brightness  INTEGER DEFAULT 90,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

> ⚠️ The columns `default_show_id`, `default_volume`, `default_brightness` were added in the May 11 2026 commit. If your DB is older, run:
> ```sql
> ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_show_id UUID REFERENCES shows(id);
> ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_volume INTEGER DEFAULT 80;
> ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_brightness INTEGER DEFAULT 90;
> ```

### `tables` (projectors)
```sql
CREATE TABLE tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  ip_address  TEXT,        -- local IPv4 of the projector, e.g. 192.168.1.50
  status      TEXT CHECK (status IN ('online_playing','online_idle','offline')) DEFAULT 'offline',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON tables (venue_id);

-- Supabase Realtime — needed for live status pulse in QuickPlay/ControlPanel
ALTER TABLE tables REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
```

### `licenses` (venue → show)
```sql
CREATE TABLE licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     TEXT REFERENCES users(clerk_id),  -- clerk_id of venue owner, NOT venues.id
  show_id      UUID REFERENCES shows(id),
  licensed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, show_id)
);
CREATE INDEX ON licenses (venue_id);
CREATE INDEX ON licenses (show_id);
```

### `earnings` (royalty ledger)
```sql
CREATE TABLE earnings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     TEXT REFERENCES users(clerk_id),
  venue_id      TEXT REFERENCES users(clerk_id),
  show_id       UUID REFERENCES shows(id),
  license_fee   NUMERIC(10,2),    -- €30
  artist_share  NUMERIC(10,2),    -- €21 (70%)
  status        TEXT CHECK (status IN ('pending','paid')) DEFAULT 'pending',
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON earnings (artist_id);
CREATE INDEX ON earnings (status);
```

### Storage buckets
- `shows` — artist uploads. Path: `<artist_clerk_id>/<show_id>/{thumbnail|preview|show|audio}.<ext>`
- `users` — avatars. Path: `avatars/<clerk_id>.{jpg|png}`

Both public-read; writes via service role key.

---

## 7. The Lumen Player (projector-side, separate codebase)

The web dashboard sends commands to each projector via WebSocket. There is a **separate Python/Electron/native app** running on each projector mini-PC that:

- Listens on `ws://0.0.0.0:8765`.
- Accepts JSON messages:
  - `{ action: "play", show_id, timestamp }` — fetch the show's `video_url` from Supabase, seek to `(Date.now() - timestamp) % video_duration` for instant sync, loop forever.
  - `{ action: "pause" }`
  - `{ action: "resume" }`
  - `{ action: "stop" }`
  - `{ action: "volume", value: 0..1 }`
  - `{ action: "brightness", value: 0..1 }`  *(software dim — projectors usually don't expose hardware brightness)*
- Updates its own row in the `tables` table when status changes — Supabase Realtime broadcasts that change back to all venue dashboards.

**Important:** the dashboard code uses `wss:` when on HTTPS and `ws:` when on HTTP. In production with HTTPS dashboards, the player needs a valid TLS cert — usually solved with a local reverse proxy or HTTP-only over a private VLAN.

The Lumen Player codebase is **not in this repo**. It's referenced but lives separately.

---

## 8. Auth model

- **Clerk** is the identity provider. JWT lives in cookies, server reads via `auth()`/`currentUser()` from `@clerk/nextjs/server`.
- Every user has a **role** stored in *two* places:
  1. **`clerkUser.publicMetadata.role`** — primary; used by middleware/redirects, server-render-safe.
  2. **`users.role` in Supabase** — denormalized for SQL-side queries (e.g. "show me all artists").
- Roles: `'artist'`, `'venue'`, `'admin'`. New users have no role → `/onboarding` forces them to pick.
- **Admin role must be set manually via Clerk Dashboard** (no self-service). To bootstrap: edit a user in Clerk → Public metadata → `{ "role": "admin" }`.
- Middleware (`src/proxy.ts`) redirects any unauthenticated request that isn't a public route to `/sign-in`.

---

## 9. Theme system

- **Class-based dark mode** via `@custom-variant dark (&:where(.dark, .dark *));` in `src/app/globals.css`.
- **Default is dark** (matches the brand). Inline `<script>` in `src/app/layout.tsx` `<head>` runs *before* React hydrates to read `localStorage.getItem('lumen-theme')` and toggle the `.dark` class on `<html>` — this prevents flash-of-wrong-theme.
- Sun/Moon toggle lives in `src/components/DashboardNav.tsx`, persists to `localStorage` via `src/components/ThemeProvider.tsx`.
- **Two pages stay always-dark by design** (no `dark:` variants):
  - `/dashboard/venue/control` — projector-control UI, always dark for the iPad in a low-lit dining room.
  - `/dashboard/venue/quickplay` — same reason.
- The marketing landing (`/`) is also dark-only — it's the brand showroom.
- Everywhere else uses paired `dark:` Tailwind variants. The color mapping convention:

| Dark class           | Light pair                              |
| -------------------- | --------------------------------------- |
| `bg-zinc-950`        | `bg-zinc-50 dark:bg-zinc-950`           |
| `bg-zinc-900/60`     | `bg-white dark:bg-zinc-900/60`          |
| `bg-zinc-800`        | `bg-zinc-100 dark:bg-zinc-800`          |
| `border-zinc-800`    | `border-zinc-200 dark:border-zinc-800`  |
| `text-white`         | `text-zinc-900 dark:text-white`         |
| `text-zinc-400`      | `text-zinc-600 dark:text-zinc-400`      |
| `text-zinc-500`      | stays `text-zinc-500`                   |
| `text-zinc-600`      | `text-zinc-400 dark:text-zinc-600`      |

---

## 10. Loading states / skeletons

- Every dashboard route has a `loading.tsx` skeleton at the same level as `page.tsx`.
- Skeleton elements use the `.skeleton` class (defined in `globals.css`) — shimmer animation, light/dark variants automatic.
- Skeletons must mirror the **exact final layout** so the page doesn't jump on transition.

---

## 11. APIs (server routes)

All under `src/app/api/`. All auth-gated (except `/api/stripe/webhook`).

### Artist
- `POST   /api/shows` — submit a show (status defaults to `pending`)
- `POST   /api/shows/upload-url` — get signed upload URL for `shows` bucket
- `POST   /api/artist/avatar` — multipart upload, 2MB JPG/PNG
- `PATCH  /api/artist/bio` — one-line bio (max 160 chars)
- `PATCH  /api/artist/payout` — payout method/email/iban
- `PATCH  /api/artist/settings` — name, bio, contact_email, slug, notify_on_license

### Venue
- `POST/PATCH/DELETE /api/venue/tables` — CRUD for projector tables
- `PATCH  /api/venue/settings` — venue name, default_show_id, default_volume, default_brightness (auto-creates venue row on first call)
- `POST   /api/licenses` — license a show, inserts both `licenses` row and `earnings` row (€30 fee, €21 artist share)

### Admin
- `PATCH  /api/admin/shows/[id]` — set status to `published` or `rejected` (with reason)

### Payments
- `POST   /api/boost/checkout` — creates Stripe checkout session for boost
- `POST   /api/stripe/webhook` — Stripe webhook receiver
  - On `checkout.session.completed` → marks show as `featured=true`, sets `featured_until`, sends Resend email confirmation
  - **PUBLIC route** (excluded from middleware auth)

### User
- `POST   /api/user/role` — sets role in both Clerk metadata and Supabase

### Critical implementation notes
- **Stripe and Resend SDKs are instantiated INSIDE the handler functions, not at module level.** Module-level `new Stripe(...)` crashes the Vercel build when env vars are placeholder strings during the page-data-collection phase. Always lazy-init.
- **`venue_id` in `licenses` and `earnings` is the venue owner's `clerk_id`**, not `venues.id`. This is denormalized; be careful when joining.

---

## 12. Money flow

```
Venue clicks "License Show"
  ↓
POST /api/licenses
  ↓
Insert licenses(venue_id=clerk_id, show_id)
Insert earnings(artist_id, license_fee=30, artist_share=21, status=pending)
  ↓
[Monthly cron — NOT BUILT YET]
  Aggregate pending earnings per artist
  If artist.balance >= €50, payout via PayPal/IBAN
  Mark earnings rows status=paid, set paid_at
```

The pending-payout view exists in `/dashboard/admin` and `/dashboard/artist/earnings` but **the actual payout cron has not been implemented**. The intent is a Vercel cron at the 1st of each month that:
1. Groups pending earnings by `artist_id`
2. For each artist with sum(artist_share) >= 50 AND payout_method set, fires PayPal/Stripe transfer
3. Updates earnings rows to `paid` and sets `paid_at`

---

## 13. Show submission lifecycle

1. Artist hits `/dashboard/artist/upload`, fills 3 steps, hits Submit → `POST /api/shows` with status `pending`.
2. Files are uploaded via signed URLs to Supabase Storage (thumbnail validated client-side to ≥1920×1080, video to exactly 3840×2160, preview ≤30s).
3. Admin sees it in `/dashboard/admin/shows`. Approves → status flips to `published`; rejects with reason → status `rejected`, reason shown in artist's studio.
4. Once `published`, the show appears in the public library and venues can license it.
5. If artist pays for a Boost via Stripe, the webhook flips `featured=true` and `featured_until=now()+months`. **There is no cron to auto-expire featured flags** — venues will see featured indefinitely until manually unflagged. Build this next.

---

## 14. File / component map

```
src/
├── proxy.ts                              # Clerk middleware (NB: file is "proxy" not "middleware")
├── app/
│   ├── layout.tsx                        # Root layout: ClerkProvider, ThemeProvider, fonts, FOUC script
│   ├── globals.css                       # Tailwind v4 + custom CSS (dark variant, skeleton, blobs)
│   ├── page.tsx                          # Marketing landing entry (auth-redirects to /dashboard if logged in)
│   ├── MarketingLanding.tsx              # Stunning public homepage
│   ├── not-found.tsx                     # Branded 404
│   ├── onboarding/page.tsx               # Role picker (artist | venue)
│   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk SignIn wrapped in AuthLayout
│   ├── sign-up/[[...sign-up]]/page.tsx   # Clerk SignUp wrapped in AuthLayout
│   ├── artists/[slug]/page.tsx           # Public artist profile
│   ├── shows/[show_id]/page.tsx          # Public show detail
│   ├── api/...                           # All server routes (see § 11)
│   └── dashboard/
│       ├── layout.tsx                    # Auth gate + role fetch → DashboardLayoutClient
│       ├── loading.tsx                   # Generic spinner skeleton
│       ├── page.tsx                      # Role-based redirect
│       ├── admin/
│       │   ├── page.tsx                  # Admin overview with stats
│       │   ├── loading.tsx
│       │   └── shows/                    # Pending show review queue
│       │       ├── page.tsx, AdminShows.tsx, loading.tsx
│       ├── artist/
│       │   ├── page.tsx + ArtistStudio.tsx     # Studio dashboard
│       │   ├── upload/                          # 3-step wizard
│       │   │   ├── page.tsx, UploadStudio.tsx
│       │   │   ├── Step1Details.tsx, Step2Media.tsx, Step3Confirm.tsx
│       │   │   ├── FileDropZone.tsx, SpecPanel.tsx, uploadHelpers.ts
│       │   ├── earnings/  (page.tsx + EarningsDashboard.tsx + loading.tsx)
│       │   ├── boost/     (page.tsx + BoostFlow.tsx + loading.tsx)
│       │   ├── settings/  (page.tsx + SettingsForm.tsx + loading.tsx)
│       │   └── loading.tsx
│       └── venue/
│           ├── page.tsx + ShowLibrary.tsx       # Browse + license shows
│           ├── quickplay/  ⭐ THE PRODUCT
│           │   ├── page.tsx, QuickPlay.tsx, loading.tsx
│           ├── control/                          # Advanced 3-pane control (iPad)
│           │   ├── page.tsx, ControlPanel.tsx, ControlShowLibrary.tsx
│           │   ├── TableList.tsx, NowPlaying.tsx, ShowExpandModal.tsx, types.ts
│           ├── tables/  (page.tsx + TableManager.tsx + loading.tsx)
│           ├── loading.tsx
│           └── toast.ts                          # Local copy of toast util
├── components/
│   ├── AuthLayout.tsx                    # Two-panel auth shell (left brand, right Clerk widget)
│   ├── ArtistOfMonth.tsx                 # Reusable AOM banner card (server component)
│   ├── DashboardLayoutClient.tsx         # Sidebar + mobile drawer + main outlet
│   ├── DashboardNav.tsx                  # Sidebar nav (role-based items, theme toggle, sign out)
│   ├── ThemeProvider.tsx                 # Context + localStorage persistence for theme
│   ├── Toaster.tsx                       # Lumen-toast event listener, bottom-right toasts
│   ├── clerkAppearance.ts                # Clerk widget styling
├── utils/
│   ├── toast.ts                          # Toast event-emitter wrapper
│   └── supabase/
│       ├── admin.ts                      # Service-role admin client (server-only)
│       ├── client.ts                     # Browser anon client
│       └── server.ts                     # SSR client with cookies
```

---

## 15. Environment variables

`.env.local`:
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=     # anon/publishable key
SUPABASE_SERVICE_ROLE_KEY=                # service role, server-only

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (transactional email)
RESEND_API_KEY=
```

`STRIPE_WEBHOOK_SECRET` is fetched via Stripe CLI or dashboard webhook config. Set the webhook endpoint to `https://<your-domain>/api/stripe/webhook` listening for `checkout.session.completed`.

---

## 16. Build & deploy

- **Local dev:** `npm run dev` (Next 16 turbopack by default).
- **Production build:** `npm run build` — runs `next build`. Must complete with zero errors before push.
- **Hosting:** Vercel. `main` branch deploys automatically.
- **Vercel env vars:** mirror `.env.local` in the Vercel project settings.

**Build gotchas (already fixed but watch out):**
- Stripe API version: must be `"2026-04-22.dahlia"` for the installed Stripe SDK. Wrong version = build error.
- Recharts `Tooltip` formatter param type is `ValueType | undefined`, not `number`. Use `Number(v ?? 0)`.
- Module-level SDK init crashes build (see § 11). Always lazy-init inside handlers.

---

## 17. Conventions & taste rules

1. **Two fonts only.** Raleway for headings, Manrope for body. Apply via `font-raleway` / `font-manrope` utility classes.
2. **Brand gradient is `from-fuchsia-500 to-purple-500`** (or `-600` for buttons). Never invent new gradients.
3. **44px minimum touch target everywhere** — the control panel and quickplay are iPad-first. Sliders use `style={{ minHeight: 24 }}`, buttons `style={{ minHeight: 44 }}`+.
4. **No emojis in code or UI** unless the user explicitly asks.
5. **Toasts are global:** `import { toast } from "@/utils/toast"` (or the venue local copy at `@/app/dashboard/venue/toast`). Events dispatch a `CustomEvent("lumen-toast")` that `Toaster.tsx` listens to.
6. **Skeleton class is `.skeleton`** — defined once in `globals.css`, adapts to light/dark automatically.
7. **`type="button"`** on every non-submit button to prevent accidental form submits. Add `title="..."` to icon-only buttons for accessibility.
8. **Server components fetch, client components react.** All data fetching happens in `page.tsx` (server). Interactive state lives in `Foo.tsx` (client, `"use client"`).
9. **Avoid `as any`.** Use proper Supabase row types or local interfaces.
10. **Never push to `main` without explicit user permission.** The user must say "push" before `git push`.

---

## 18. Known limitations & TODOs

These are intentionally not built yet — flag them when relevant:

1. **No automatic payout cron.** See § 12.
2. **No automatic featured-show expiry.** See § 13.
3. **No "schedule a show" feature** — there's no auto-play at 19:00 type behavior. Manual play only.
4. **No analytics page** despite `ArtistStudio` linking to `/dashboard/artist/analytics?show=X`. Dead link.
5. **No admin /users page** — admins must edit users via Supabase dashboard. (Nav item was removed.)
6. **No venue settings page** — settings folded into Quick Play modal + Tables page.
7. **No license-cancel flow** — venues can license but can't unlicense from the UI.
8. **No iOS PWA manifest** — venues bookmark Quick Play in Safari, but it doesn't go full-screen by default.
9. **No multi-region projector mesh** — assumes all tables on the same LAN as the iPad.
10. **No "atmosphere mode" autopilot** — no automatic cycling through shows. Single-shot play only.

---

## 19. How to extend

### Adding a new venue page
1. Create `src/app/dashboard/venue/<name>/page.tsx` (server, fetches data).
2. Create `src/app/dashboard/venue/<name>/<Name>.tsx` (`"use client"`, takes initial data as props).
3. Add `loading.tsx` skeleton at same level.
4. Add nav item in `src/components/DashboardNav.tsx` → `venueNav` array.

### Adding a new column to an existing table
1. Run the migration in Supabase SQL editor.
2. Update the relevant interfaces in `src/app/dashboard/venue/control/types.ts` or local file.
3. Update the `.select()` calls in the relevant `page.tsx`.
4. Update API routes to accept the new field.
5. **Document the migration here in this file.** Bare migrations rot.

### Adding a new lifecycle email
1. Use the Resend pattern already in `src/app/api/stripe/webhook/route.ts`.
2. **Lazy-init Resend inside the handler.**
3. Use the inline HTML template style — keeps emails self-contained.

---

## 20. Quick mental model for the next AI

If a user asks you to do something on Lumen, ask yourself:

1. **Who is the user in this story?** Artist, venue manager, or admin?
2. **Is it a tap on an iPad or a click on a laptop?** Touch targets and density differ a lot.
3. **Does it need to feel premium?** This is hospitality tech for high-end restaurants. The aesthetic isn't decoration — it's the product pitch.
4. **Is there a Quick Play or Control Panel implication?** Anything that affects "what's on the tables right now" is load-bearing.
5. **Does it need new SQL?** Add it to § 6 of this file.

**The single rule:** _Every interaction must feel like the venue manager is in control of a magical, expensive, perfectly choreographed dining experience._ If the UI breaks that illusion, it's wrong — even if it's functionally correct.

---

_Last fully refreshed: 2026-05-11. Built across several sessions; see `git log` for commit-level chronology._
