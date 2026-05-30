# Project Lumen — Strategy for Next Session

This is the punch list for the session after the Mux integration commit. It captures decisions made during build, what's still in flight, and the order I'd tackle them in.

## What just shipped

- **Mux video pipeline**: artists upload through Mux Direct Upload (`/api/shows/upload-url` returns a Mux URL for video, Supabase signed URL for thumbnails).
- **Server-side spec enforcement**: the `/api/mux/webhook` handler now probes asset metadata against the piece spec (3840×2160, 60fps ±1%, ≥60s, stereo audio) and flips `status` to `pending` (admin queue) on pass or `rejected` (with specific reasons) on fail.
- **Race-condition fix**: `/api/shows` POST checks Mux state at submit time — if the asset already finished processing, we apply validation inline instead of waiting forever for a webhook we missed.
- **Terminology shift**: "Show" → "Piece" in the artist dashboard (DB stays `shows` — internal-only).
- **Schema migration**: `shows` gained `mux_*` columns + `video_metadata` jsonb + `preparing` status. `audio_url` dropped (audio is folded into the video asset on Mux).

## What's blocking full end-to-end

1. **Verify the live deploy works** — upload a known-good 4K/60fps test on `app.projectlumen.io` and confirm the asset.ready webhook fires + flips status to `pending`. Then upload a known-bad file (1080p OR 30fps OR mono OR <60s) and confirm specific rejection reasons land in `rejection_reason`.
2. **Local webhook testing** — set up ngrok / cloudflared so Mux events reach `localhost:3000/api/mux/webhook` during dev. Otherwise local uploads sit at `status='preparing'` forever.
3. **The piece never leaves `status='preparing'` if the artist abandons** — no cleanup job for orphaned drafts. Pragmatic backstop: a cron that wipes `preparing` rows older than 24h.

## Recommended next-session order

### 1. Plank 5 — Admin review UI (highest value, smallest scope)
- Replace blind preview in [AdminShows.tsx](src/app/dashboard/admin/shows/AdminShows.tsx) with the Mux player (`@mux/mux-player-react` is already installed).
- Add a **spec checklist** above approve/reject: green tick + actual value for each rule (resolution, fps, duration, audio), pulled from `shows.video_metadata`.
- Disable "Approve" until the show's auto-validation passed (i.e. `status='pending'`). Auto-rejected pieces shouldn't be approvable from the admin UI; they need a fresh upload from the artist.

### 2. Resend lifecycle emails
Lifecycle ordering from artist perspective:
- Upload received: "We're checking your piece…"
- Auto-validated (passed Mux probe): "Your piece passed validation — Lumen team is reviewing it"
- Auto-rejected (failed Mux probe): "Your piece didn't meet spec — [reasons]. Re-upload from your dashboard."
- Admin approved: "Your piece is live!" with public URL
- Admin rejected: "Lumen team passed on this submission — [admin's reason]"

Hook points: `/api/mux/webhook` (auto-validated/rejected) and `/api/admin/shows/[id]` (admin approve/reject).

### 3. Artist feedback in the dashboard
- Show pieces stuck in `status='preparing'` with a "Processing…" badge in ArtistStudio.
- For `rejected` pieces with auto-validation reasons (not admin rejection), show specific failures inline with a "Re-upload" CTA.
- For `rejected` pieces with admin reasons, show admin's note.

### 4. Asset type branching — image + loop uploads
This is the bigger feature that comes out of the "Show is too narrow" conversation.

- Add `asset_type` column to `shows` (text, enum-like: `'show' | 'image' | 'loop'`, default `'show'` for back-compat).
- Step 1 of the upload wizard: pick the type FIRST. Each path branches:
  - `show`: current Mux flow, no changes
  - `image`: simpler upload to Supabase Storage (no Mux), validation rules (3840×2160 PNG/JPG, sRGB, ≤20MB), goes straight to admin queue
  - `loop`: short video, similar to `show` but minimum duration drops to 5s (or whatever fits a "moving element" like flickering candles)
- Update Step2Media / Step3Confirm / SpecPanel to reflect the chosen type.
- Update venue Marketplace (see below) to filter by type.

### 5. Marketplace rename + ratings
The venue side becomes the marketplace.

- Rename "Show Library" → "Marketplace" in [DashboardNav.tsx](src/components/DashboardNav.tsx) and the page header.
- Add filter UI (by type, by rating, by category) and sort (newest, highest-rated, most-licensed).
- New `ratings` table:
  ```sql
  ratings (
    id uuid PRIMARY KEY,
    rater_id text REFERENCES users(clerk_id),
    target_type text CHECK (target_type IN ('piece','artist')),
    target_id text,          -- piece UUID or artist clerk_id
    score smallint CHECK (score BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz,
    UNIQUE (rater_id, target_type, target_id)
  )
  ```
- UI: star/heart picker on piece detail + artist profile pages (venue role only). Aggregate (avg + count) cached on `shows` and `users` to avoid expensive aggregates.
- Anti-spam: one rating per venue per piece (DB unique constraint handles it).

## Parked — needs co-founder Noel

### AI generation
The idea: artists can generate pieces inside Lumen via AI (Stable Diffusion / Runway / Sora / similar) and add them directly to the marketplace. This needs a real conversation before any build:
- **Which model / provider?** Each has different cost, latency, output quality, IP terms.
- **Who pays?** Per-generation cost (artist? platform? a generation credit pack as Stripe purchase?)
- **IP ownership** — outputs from most AI providers have ambiguous IP. We need clarity on whether artists own the work, whether Lumen does, what venues are licensing.
- **Curation gate** — do AI generations skip admin review or get the same gate as human uploads?
- **Branding** — do AI pieces get labelled in the marketplace? Venues might care about human vs AI provenance.

### Royalty / earnings model
Still parked from 2026-05-30. Need to decide between:
- €30 one-time license (current code)
- Per-use royalty (per play / per session) — requires play-event tracking from Lumen Player
- Subscription (venue pays monthly for full library access, artist earnings = % of revenue × usage share)
- Hybrid (license + per-use)

This blocks any earnings UX polish.

### Audio architecture (Sound Hub)
From the audio discussion: standard venue install is silent (Option 2), premium tier adds a Sound Hub for synced audio over the house PA (Option 1). Need to spec the Sound Hub before venue phase ships:
- Hardware (Raspberry Pi 4 ~£60? Apple TV? Custom?)
- Audio output to PA (3.5mm / RCA / AirPlay / Bluetooth / line-in)
- Sibling of Lumen Player subscribed to the same WebSocket sync protocol
- Per-venue audio offset calibration (typically −30 to −50ms)

## Things to NOT do

- Don't rename the `shows` DB table. Internal only — churn vs benefit ratio is bad.
- Don't add RLS to Supabase right now. Access control is at the proxy + server-side layer; the service-role client is server-only. Reconsider only if browser-side queries for sensitive data become necessary.
- Don't build features around the deferred royalty model — wait for Noel.
- Don't enable Mux signed playback yet. The Mux Signing Key Dan created can stay in his password manager for the day we want venue-only/paywalled playback. Public playback policy is correct for the current model.

## Quick architecture references (for future-me)

- Webhook event types we handle: `video.upload.asset_created`, `video.asset.ready`, `video.asset.errored`. Other Mux events are logged + acked.
- Webhook idempotency guard: only acts when `mux_status='waiting'` — prevents Mux retries from overriding admin-modified state.
- Show row lifecycle: `preparing` → (Mux probes) → `pending` (admin queue) | `rejected` (auto). Admin then sets `pending` → `published` | `rejected`.
- Race condition between submit and webhook: handled by [/api/shows/route.ts](src/app/api/shows/route.ts) calling `mux.video.uploads.retrieve` + `applyAssetReady` inline.
- Correlation across events uses Mux's `passthrough` field set to the show's UUID at upload-URL creation time. Resilient to event ordering.
