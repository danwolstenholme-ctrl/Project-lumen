# Project Lumen — Strategy for Next Session

What's shipped, what's blocking testing, and what to tackle next. Read [LUMEN_CONTEXT.md](LUMEN_CONTEXT.md) first if you haven't.

## What just shipped (this commit)

### Mux video pipeline (planks 1–4)
- Artist uploads route through Mux Direct Upload (`/api/shows/upload-url` returns Mux URL for video, Supabase signed URL for thumbnail).
- Server-side spec enforcement in `/api/mux/webhook` — 3840×2160, 60fps ±1%, ≥60s duration, stereo audio. Pieces flip to `status='pending'` (admin queue) on pass or `status='rejected'` with specific human-readable reasons on fail.
- Race-condition fix: `/api/shows` POST calls `mux.video.uploads.retrieve` inline at submit time so an asset.ready webhook that fired before the row existed doesn't leave the piece stuck in `preparing` forever.
- Schema migration ([LUMEN_SCHEMA_002_mux.sql](LUMEN_SCHEMA_002_mux.sql)) added `mux_*` columns + `video_metadata` jsonb, dropped `audio_url`, extended status enum with `preparing`.

### First-day artist UX
- New [WelcomePanel.tsx](src/app/dashboard/artist/WelcomePanel.tsx) replaces the demoralizing zero-stats grid + empty pieces list when a brand-new artist signs in. Hero copy + platform stats (artists / venues / published pieces from real Supabase counts) + a 3-step progress strip (Account created ✓ / Complete profile / Upload first piece). Auto-disappears the moment they upload their first piece.
- `preparing` status now has a proper badge — sky-blue with a spinning Loader2 icon. Without this, freshly-uploaded pieces incorrectly read as "Draft".
- `rejected` pieces get a **Re-upload** CTA inline (links to `/dashboard/artist/upload`). Rejection reasons widened to `line-clamp-2` so artists can actually read what failed.

### Terminology shift
- "Show" → "Piece" across all artist-facing UI. DB and code internals still use `show` (kept churn down). See § 1 of [LUMEN_CONTEXT.md](LUMEN_CONTEXT.md) for the convention.

## What's blocking full end-to-end on the live site

1. ~~**Push + deploy**~~ — done 2026-05-30. `main` is on `origin/main`, Vercel auto-deployed.
2. **End-to-end smoke test** on `app.projectlumen.io`:
   - Sign in as artist (zero pieces) → confirm WelcomePanel renders with real stats.
   - Set up profile (slug + bio + avatar) → return to dashboard, step 2 ticks green.
   - Upload a known-good 4K/60fps/60s+/stereo piece → bounce to dashboard, see "Processing" badge.
   - Wait ~2–5 min, refresh → status flips to "In Review" (with Supabase confirming `mux_status='ready'`, `video_metadata` populated, `mux_playback_id` set).
   - Sign in as admin → approve → artist dashboard now shows "Published" + Boost button.
   - Also test the unhappy path: upload a 1080p OR 30fps OR mono file → status flips to "Rejected" with specific reason from `applyAssetReady`, Re-upload CTA appears.
3. **Local-dev webhook** — Mux can't reach localhost. For local testing of the validation flow, tunnel via ngrok / cloudflared. Otherwise local uploads sit at `preparing` forever.

## Recommended next-session order

> **Note for June:** the first half of June is **operational** — see [PROJECT_LUMEN_HANDOVER.md § 4.3 Migration Sequence](PROJECT_LUMEN_HANDOVER.md) for the account ownership transfer to SRS Dynamic, shared password vault setup, and ISO 27001 baseline work. That work runs in parallel with the technical roadmap below — but if there's a sequencing conflict, **migration wins** (it's contractually required for the prototype hand-off). The technical items below assume migration is being handled in parallel.

### 0. Phase 2 operational work (first half of June)
- SRS Dynamic creates org-owned accounts (GitHub, Vercel, Supabase, Stripe, etc.)
- Shared password vault (1Password Business or Bitwarden Teams) provisioned
- Production accounts transferred week-by-week (Stripe is the priority — payments must legally route into SRS Dynamic's entity)
- ISO 27001 policy + control documentation drafted
- Recovery test once migration is complete
- All tracked against [PROJECT_LUMEN_HANDOVER.md](PROJECT_LUMEN_HANDOVER.md)

### 1. Plank 5 — Admin review UI with Mux player + spec checklist (~1 day)
- Replace blind preview in [AdminShows.tsx](src/app/dashboard/admin/shows/AdminShows.tsx) with `@mux/mux-player-react` (already installed) using `mux_playback_id`.
- Add a **spec checklist** above approve/reject — green tick + actual value per rule (resolution, fps, duration, audio), pulled from `shows.video_metadata`.
- Disable "Approve" until auto-validation passed (`status='pending'`). Auto-rejected pieces need re-upload, not admin override.
- Keep current free-form rejection reason for human-judgement rejections (composition, content, taste).

### 2. Resend lifecycle emails (~half day)
Hook into both `/api/mux/webhook` (auto-validated/rejected) and `/api/admin/shows/[id]` (admin approve/reject):
- Upload received → "We're checking your piece…"
- Auto-validated → "Your piece passed validation — Lumen team is reviewing it"
- Auto-rejected → "Your piece didn't meet spec — [reasons]. Re-upload from your dashboard."
- Admin approved → "Your piece is live!" with public URL + share buttons (Instagram / X / copy link)
- Admin rejected → "Lumen team passed on this submission — [reason]"

### 3. Status timeline on piece rows + real-time updates (~2 days)
Closes the "artist has to refresh" gap. The badge is in; the live experience is missing.
- Status timeline component (Uploaded → Validating → In Review → Live, current stage highlighted, tooltip per stage).
- Subscribe to `shows` row via Supabase Realtime (REPLICA IDENTITY already on for `tables`; need to add `shows` to the publication).
- Optional: when first piece flips from `pending` → `published`, fire a celebration modal on next login ("Your piece is live!" + share buttons).

### 4. "Live on Lumen right now" social-proof strip (~1 day, blocked on having content)
On the WelcomePanel, below the platform stats: 4 tiles of currently-published pieces with venue context ("Tonight at Sólen, Dublin · 12 tables"). Pulls from `shows where status='published' AND featured=true`, joined to `users` for artist name. Skipped this round because nothing is published yet — first thing to add once there are 4+ published pieces.

### 5. 3D table preview in upload wizard (~3 days)
The "ohh" moment. Show artists what their piece will look like projected on a Lumen table. Top-down restaurant mockup, their thumbnail (or video poster) composited onto a table surface. Static frame is fine — doesn't need to render the actual video. CSS-3D or simple Three.js. Reusable in marketing.

### 6. Asset type branching — image + loop uploads (~3 days)
Out of the "Show is too narrow" conversation. Add `asset_type` column to `shows` (`'show' | 'image' | 'loop'`, default `'show'`). Step 1 of the upload wizard becomes type-first, each branch has its own validator:
- `show`: current Mux flow.
- `image`: Supabase Storage (no Mux needed), validate 3840×2160 PNG/JPG, sRGB, ≤20MB.
- `loop`: shorter video, min duration 5s, otherwise same as show.
Update marketplace filter UI to switch by type.

### 7. Marketplace rename + ratings (~3 days)
- Rename venue "Show Library" → "Marketplace" in nav + page header.
- Add filter (type, rating, category) + sort (newest, highest-rated, most-licensed).
- New `ratings` table (target_type: 'piece' | 'artist', score 1–5, unique by rater × target).
- Star picker on piece detail + artist profile pages (venue role only).
- Aggregate (avg + count) cached on `shows` and `users` to avoid expensive aggregates on every list render.

## Parked — needs co-founder Noel

### AI generation
Artists generate pieces in-app via AI (Stable Diffusion / Runway / Sora / etc.) → add directly to marketplace. Needs Noel-level decisions:
- Which model / provider (cost, latency, IP terms)?
- Who pays for generation (artist? platform? credit pack via Stripe?)?
- IP ownership of outputs?
- Curation gate — same admin review as human uploads, or skip?
- Provenance — do AI pieces get visually labeled in the marketplace so venues know?

### Royalty / earnings model
Parked from 2026-05-30. Still need to decide: €30 one-time license (current) vs per-use royalty (needs play-event tracking from Lumen Player) vs subscription (venue pays monthly, artist earnings = % of revenue × usage share) vs hybrid.

### Audio architecture (Sound Hub)
From the audio conversation: standard install is silent (Lumen plays muted; venue uses own background music). Premium tier adds a Sound Hub — Raspberry Pi 4 (~£60) plugged into venue PA, runs a sibling of Lumen Player that subscribes to the same WebSocket sync protocol but plays the **audio-only HLS stream from the Mux asset**. Per-venue offset calibration (typically −30 to −50ms PA latency). Needs to be specced before venue phase ships.

## Things to NOT do

- **Don't rename the `shows` DB table** — internal-only, churn vs benefit ratio is bad. UI rename is enough.
- **Don't add RLS** — access control is at the proxy + server-side layer. The service-role client is server-only. Reconsider only if browser-side queries for sensitive data become necessary.
- **Don't build features around the deferred royalty model** — wait for Noel.
- **Don't enable Mux signed playback** — the Signing Key in Dan's password manager is unused. Public playback policy is correct until we want venue-only or paywalled playback.
- **Don't backfill old shows to Mux** — prototype data, fine to leave as legacy or wipe.

## Quick architecture references

- Webhook event types we handle: `video.upload.asset_created`, `video.asset.ready`, `video.asset.errored`. Other Mux events are logged + acked.
- Webhook idempotency guard: only acts when `mux_status='waiting'` — prevents Mux retries from overriding admin-modified state.
- Show row lifecycle: `preparing` → (Mux probes) → `pending` (admin queue) | `rejected` (auto, with specific reasons). Admin then sets `pending` → `published` | `rejected` (with free-form reason).
- Race condition between submit and webhook: handled by [/api/shows/route.ts](src/app/api/shows/route.ts) calling `mux.video.uploads.retrieve` + `applyAssetReady` inline.
- Correlation across Mux events uses `passthrough` field = show UUID, set at upload-URL creation time. Resilient to event ordering.
- Welcome panel auto-disappears when `shows.length > 0` — driven off the data, no flag-setting needed.
