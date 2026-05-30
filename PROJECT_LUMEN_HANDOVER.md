<!--
  [ replace this comment block with Wolsten Studios brand cover ]
  [ logo · wordmark · client logo · "Confidential" classification ]
-->

# Project Lumen — Month 1 Delivery & Forward Plan

**Prepared by:** Wolsten Studios LTD
**Prepared for:** SRS Dynamic
**Project:** Project Lumen — immersive dining platform
**Period covered:** May 2026 (Month 1 of a 3-month prototype build)
**Document version:** 1.0
**Date:** [DATE]
**Classification:** Confidential — Wolsten Studios & SRS Dynamic

---

## 1. Executive Summary

Project Lumen is a two-sided platform connecting digital artists with luxury venues. Artists upload immersive content ("pieces") — 4K projection-table loops today, with images and AI-generated work on the Phase 2/3 roadmap. Venues license that content and run it on Lumen's table-mounted projector hardware via an iPad app.

In May 2026, Wolsten Studios delivered the complete first month of build for SRS Dynamic across **brand, marketing site, and platform application** — a working prototype that can already accept real artist signups, validate uploaded content against Lumen's technical specification, and route payments through Stripe.

This document covers:
- What shipped in Month 1
- The current technology architecture
- **Ownership and access controls (with a clear plan to transfer prod ownership to SRS Dynamic during Phase 2)**
- Business continuity arrangements
- The Phase 2 (June) and Phase 3 (July) roadmaps
- Risk register, infrastructure cost summary, and sign-off

A central goal of this document — and of Phase 2 — is to ensure that **Project Lumen exists independently of Wolsten Studios**. If, for any reason, Wolsten Studios becomes unavailable, SRS Dynamic must be able to continue operating and developing the product without interruption. Section 5 details how.

---

## 2. What Shipped in Month 1

### 2.1 Brand Identity
- Full brand system: name, logotype, colour palette (`#D946EF` magenta · `#A855F7` purple · `#F59E0B` amber on near-black `#09090B`), typography (Raleway headings, Manrope body), tone of voice
- Tagline: *"Where dining becomes theatre."*
- Visual language: gradient blob backdrops, dark-theme-first, cinematic motion

### 2.2 Marketing Site
- Public site live at **https://www.projectlumen.io**
- Hero, value proposition, featured shows, Artist of the Month spotlight, platform stats — all driven by real Supabase data
- Conversion-focused: pre-sign-in CTAs route both artists and venues into Clerk auth → onboarding → role-specific dashboards

### 2.3 Platform Application
Live at **https://app.projectlumen.io**. Three distinct dashboards:

**Artist surface (Month 1 priority — outreach-ready):**
- First-day welcome experience with platform stats and a 3-step progress strip
- Three-step upload wizard with thumbnail + full piece (video-with-audio)
- Server-side spec validation via Mux: 3840×2160, 60fps ±1%, ≥60s duration, stereo audio — pieces are auto-rejected with specific human-readable reasons if they don't meet spec
- Live status tracking on the dashboard (Processing → In Review → Published / Rejected)
- Re-upload affordance on rejected pieces
- Public artist profile pages (`/artists/{slug}`) for shareability
- Earnings dashboard with monthly chart, CSV export, payout settings
- Stripe-powered Featured Piece / Homepage Feature boost purchasing

**Venue surface (scaffolded, ready for Phase 2 polish):**
- Quick Play iPad page (one-tap "Start the Show" across every table)
- Show Library (browse + license at €30/show, 70/30 artist split)
- Control Panel (per-table playlist + volume + brightness)
- Table CRUD (projector IP/label management)

**Admin surface (operational baseline):**
- Pending-piece review queue with approve/reject + reason
- Platform stats: artist count, venue count, published pieces, pending payouts, total revenue

### 2.4 Infrastructure
All services provisioned, configured, and live:

| Service | Purpose | Status |
|---|---|---|
| Vercel | Hosting (Next.js 16 + automatic deploy from `main`) | Live |
| Supabase | Postgres + Storage + Realtime | Live |
| Clerk | Authentication + role management | Live |
| Mux | Video ingest, validation, HLS playback | Live (webhook configured) |
| Stripe | Payments (boost purchases, future licensing) | Live |
| Resend | Transactional email | Configured (lifecycle emails queued for Phase 2) |

### 2.5 Documentation
Three documents live in the repository:
- `LUMEN_CONTEXT.md` — comprehensive technical context (architecture, schema, conventions)
- `LUMEN_NEXT.md` — forward roadmap with what's queued for the next build session
- `LUMEN_SCHEMA.sql` + `LUMEN_SCHEMA_002_mux.sql` — database schema as code
- This handover document

---

## 3. Architecture Overview

Plain-English summary suitable for stakeholder or investor share:

> Project Lumen runs on a modern, supplier-redundant stack. The web application is built in Next.js 16 (React) and hosted on Vercel, with auto-deploy from the GitHub repository. User accounts and authentication are managed by Clerk. Data lives in a Supabase Postgres database. Artist video content is processed and delivered through Mux, a managed video API that validates technical specifications and streams the content to projectors via HLS. Payments are processed by Stripe. Transactional emails (welcome, validation, approval) flow through Resend. The projector software (the "Lumen Player") is a separate, lightweight application running on each table's mini-PC and is currently in scope for Phase 3.

```
                    ┌─────────────────────────┐
                    │  projectlumen.io        │
                    │  (marketing site)       │
                    └────────────┬────────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       │                         │                         │
  ┌────▼─────┐            ┌──────▼──────┐           ┌──────▼──────┐
  │ Artists  │            │   Venues    │           │   Admin     │
  │ upload + │            │ Quick Play  │           │ Review +    │
  │ portfolio│            │ + License + │           │ Platform    │
  │          │            │ Control     │           │ Stats       │
  └────┬─────┘            └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       └─────────────┬───────────┴─────────────────────────┘
                     │
            ┌────────▼────────┐
            │ Vercel (Next.js)│
            │  app.projectlumen.io
            └────────┬────────┘
                     │
    ┌────────┬───────┼───────┬─────────┬─────────┐
    │        │       │       │         │         │
  ┌─▼──┐  ┌─▼──┐  ┌─▼──┐  ┌─▼──┐   ┌──▼──┐   ┌──▼──┐
  │Clerk│  │Supa│  │Mux │  │Stripe│ │Resend│   │ WS  │ ──── projectors
  │auth │  │base│  │video│ │ pay  │ │email │   │ to  │ ──── (Lumen Player)
  └─────┘  └────┘  └────┘  └─────┘  └─────┘   │tables│
                                              └──────┘
```

---

## 4. Access & Ownership Matrix

### 4.1 Current State (as of [DATE])

All production services are currently provisioned under **Wolsten Studios LTD** accounts. This was operationally efficient during the May sprint but is **not** the target state. Section 4.2 lays out the transition.

| Service | Owner | Operator | Notes |
|---|---|---|---|
| Domain — `projectlumen.io` | Wolsten Studios | Wolsten Studios | Registrar: [REGISTRAR]. Renewal: [DATE]. |
| GitHub repository | Wolsten Studios | Wolsten Studios | `[github.com/danwolstenholme-ctrl/Project-lumen]` — private |
| Vercel project | Wolsten Studios | Wolsten Studios | Auto-deploys `main` to production |
| Supabase project | Wolsten Studios | Wolsten Studios | Single project serves dev + prod |
| Clerk application | Wolsten Studios | Wolsten Studios | Production keys live |
| Mux environment | Wolsten Studios | Wolsten Studios | Webhook configured to production URL |
| Stripe account | Wolsten Studios | Wolsten Studios | **Priority migration target** — payments must legally flow into SRS Dynamic |
| Resend account | Wolsten Studios | Wolsten Studios | Domain verification: [DATE] |
| Brand assets (Figma) | Wolsten Studios | Wolsten Studios | [LINK TO BRAND FILES] |

### 4.2 Target State (end of Phase 2)

| Service | Owner | Operator | Migration approach |
|---|---|---|---|
| Domain | **SRS Dynamic** | Wolsten Studios (tech contact) | Domain transfer or registrant change at registrar |
| GitHub repository | **SRS Dynamic** organisation | Wolsten Studios (collaborator) | GitHub org transfer |
| Vercel project | **SRS Dynamic** team | Wolsten Studios (member) | Vercel project transfer between teams |
| Supabase project | **SRS Dynamic** organisation | Wolsten Studios (member) | Org transfer or database migration |
| Clerk application | **SRS Dynamic** | Wolsten Studios (admin) | App ownership transfer |
| Mux environment | **SRS Dynamic** | Wolsten Studios (admin) | Account ownership transfer |
| Stripe account | **SRS Dynamic** (priority) | Wolsten Studios (admin) | New Stripe account opened under SRS Dynamic legal entity, env vars rotated |
| Resend account | **SRS Dynamic** | Wolsten Studios (admin) | Account transfer + domain re-verification |
| Brand assets | **SRS Dynamic** workspace | Wolsten Studios (editor) | Figma workspace transfer |

### 4.3 Migration Sequence

| Week | Action | Owner |
|---|---|---|
| Week 1 (June) | SRS Dynamic creates: company GitHub org, Vercel team, Supabase org, Stripe account under legal entity | SRS Dynamic + Wolsten Studios |
| Week 1 (June) | Shared password manager (1Password Business or Bitwarden Teams) provisioned; both parties added | SRS Dynamic |
| Week 2 (June) | Repository, Vercel project, and Supabase project transferred. Smoke test prod | Wolsten Studios |
| Week 3 (June) | Stripe account migration (new account, keys rotated, webhook re-pointed). Most sensitive — schedule a downtime window | Wolsten Studios |
| Week 4 (June) | Clerk, Mux, Resend, and domain transferred. Final smoke test | Wolsten Studios |
| End of Phase 2 | Sign-off: SRS Dynamic confirms ownership of all production accounts | Both parties |

---

## 5. Business Continuity Plan

### 5.1 Why this matters

Project Lumen currently has a key-person dependency on Wolsten Studios (specifically the founder, Dan Wolstenholme). If Wolsten Studios is unavailable for an extended period, SRS Dynamic must be able to continue operating Project Lumen, including: (a) accessing the codebase and infrastructure, (b) communicating with users, (c) processing payments, and (d) onboarding a new development partner.

### 5.2 Controls in place during Phase 1

| Control | Status |
|---|---|
| Source code committed and pushed to GitHub on every change | Live |
| All technical context documented in repo (`LUMEN_CONTEXT.md`, `LUMEN_NEXT.md`) | Live |
| Database schema captured as SQL files in repo | Live |
| No credentials stored in code (all in `.env.local` / Vercel env vars) | Live |
| Live production deployments require code in `main` branch — no manual production state | Live |

### 5.3 Controls being added in Phase 2

| Control | Owner | Deadline |
|---|---|---|
| **Shared password vault** (1Password Business or Bitwarden Teams) — every production credential stored, both parties as members | SRS Dynamic to provision; Wolsten Studios to populate | Week 1 of June |
| **Account ownership transferred** (see § 4.3) | Wolsten Studios | End of June |
| **Emergency contact list** — Wolsten Studios provides nominated backup contact + business contingency procedure | Wolsten Studios | Week 1 of June |
| **Backup admin email under SRS Dynamic control** with documented access to all third-party services | SRS Dynamic | Week 1 of June |
| **Documented escalation procedure** (this document, § 5.4) — circulated to SRS Dynamic leadership | Wolsten Studios | At sign-off of this document |

### 5.4 Escalation procedure if Wolsten Studios becomes unreachable

| Time elapsed | Action | Responsible party |
|---|---|---|
| 0–24h | Standard project communication channels. Email, Slack/WhatsApp, scheduled calls. | Both |
| 24–72h | SRS Dynamic emails Wolsten Studios' nominated backup contact: **[BACKUP CONTACT NAME, EMAIL, PHONE]** | SRS Dynamic |
| 72h+ | SRS Dynamic accesses the shared password vault using its admin recovery procedure. Production infrastructure remains operational. Phase 2 onwards, **all ownership is under SRS Dynamic** so no admin recovery is needed for the accounts themselves. | SRS Dynamic |
| Persistent | If Wolsten Studios is permanently unavailable, SRS Dynamic engages a new development partner. The documentation in this repository (`LUMEN_CONTEXT.md`, `LUMEN_NEXT.md`, `PROJECT_LUMEN_HANDOVER.md`) is designed to bring a new developer up to speed within 1–2 weeks. | SRS Dynamic |

### 5.5 Recovery testing

Once the migration in § 4.3 completes, **the parties will jointly perform a recovery test**: SRS Dynamic will sign in to each production account using its own admin credentials (without Wolsten Studios' help) to verify that ownership has truly transferred. This is documented as audit evidence.

---

## 6. Phase 2 — June 2026 Roadmap

The first half of June is **migration and continuity work** (see § 4.3 and § 5.3). The remainder builds the platform forward:

### 6.1 Admin review experience (~3 days)
- Mux player integrated into the admin review queue (so admins see the real piece, not a blind preview)
- Spec checklist UI — admins approve from green-tick validation evidence, not guesswork

### 6.2 Artist lifecycle emails (~2 days)
Resend-powered notifications: upload received, validated, approved, rejected. Closes the silence between submission and outcome.

### 6.3 Real-time status updates (~2 days)
Artist dashboard subscribes to their pieces via Supabase Realtime — no more manual refresh to see status changes. Optional first-piece-published celebration moment.

### 6.4 Venue dashboard polish (~5 days)
- Show Library renamed to **Marketplace** with filters and sort
- Polish Quick Play and Control Panel based on real iPad testing
- Status indicators for table connection health

### 6.5 Ratings (~3 days)
- New `ratings` table (venue rates piece + artist)
- Aggregated star displays on marketplace and artist profile
- Helps Lumen's curation surface its best content

### 6.6 ISO 27001 alignment work (ongoing)
Information security policy draft, access control documentation, incident response runbook. Targets Annex A.5.16, A.5.29, A.5.30, A.8 controls.

---

## 7. Phase 3 — July 2026 Roadmap

July is **pilot-readiness** — preparing Project Lumen for its first live venue installation.

### 7.1 Asset type branching (~3–5 days)
Expand "pieces" beyond longform 4K video to also include:
- Static images (different upload pipeline, no Mux required)
- Short loops (5–60s, ambient micro-content)
- Themed packs (multiple pieces grouped under a theme — e.g. "Chinese New Year")

### 7.2 First venue pilot (~5 days)
- Onboarding flow for the first pilot venue
- Hardware specification finalised (projectors + mini-PCs + tables)
- On-site installation runbook
- Initial venue support procedures

### 7.3 Sound Hub (~3–5 days, conditional on SRS Dynamic green-light)
Optional venue add-on: a small networked device (Raspberry Pi 4 or similar) that plays the audio track of the active piece through the venue's house PA system, synchronised to the projectors. Premium tier upgrade.

### 7.4 AI generation foundation (~5+ days, conditional on SRS Dynamic strategy decisions)
Enables artists to generate pieces in-app via AI providers (Stable Diffusion / Runway / similar). Requires SRS Dynamic decisions on: provider selection, payment model, IP terms, curation gate, provenance disclosure. **Decision required by 15 June 2026 to be included in Phase 3.**

### 7.5 ISO 27001 initial audit readiness (ongoing)
Targeting external audit/certification in [Q4 2026 / Q1 2027 — adjust to plan].

---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Key-person dependency on Wolsten Studios** | Medium | High | Documentation in repo, ownership transfer in Phase 2, shared password vault, recovery test, ISO 27001 continuity controls |
| 2 | **Stripe account legally tied to wrong entity** | High (currently) | High | Migration scheduled Week 3 of June (§ 4.3). Until then, no real payments processed in production |
| 3 | **Mux usage cost spikes with venue scale** | Medium | Medium | Estimated £20–50/mo at prototype scale; monitor against budget; option to negotiate volume pricing with Mux above £500/mo |
| 4 | **Royalty / earnings model not yet decided** | High | High | Wolsten Studios paused all earnings UX work pending SRS Dynamic decision. To be resolved by [DATE] |
| 5 | **AI generation legal / IP ambiguity** | Medium | High | Decision required from SRS Dynamic on provider, IP terms, and curation gate before any build commences |
| 6 | **ISO 27001 audit timeline slippage** | Medium | Medium | Phase 2 includes initial policy + control documentation; full audit deferred to later quarter |
| 7 | **Venue projector hardware supply chain** | Low | Medium | Mitigated by Phase 3 spec → procurement lead time |
| 8 | **Single Supabase project for dev + prod** | Medium | Medium | Phase 2 will split into separate prod and staging projects |

---

## 9. Cost Summary

Approximate monthly infrastructure run-rate at current prototype scale. All figures subject to actual usage; Wolsten Studios will provide actual figures from billing dashboards at sign-off:

| Service | Tier | Estimated monthly cost (€) | Notes |
|---|---|---|---|
| Vercel | [Hobby / Pro] | [TBD] | [Hobby = free; Pro = €20/mo per member] |
| Supabase | [Free / Pro] | [TBD] | Free tier sufficient at current scale |
| Clerk | [Free / Pro] | [TBD] | Free tier up to 10k MAUs |
| Mux | Pay-as-you-go | €20–50 | Scales with storage + delivery |
| Stripe | Pay-as-you-go | Per-transaction | 1.4% + €0.25 per EU transaction (no monthly fee) |
| Resend | [Free / Pro] | [TBD] | Free tier = 3,000 emails/mo |
| Domain | — | ~£15/year | Renewal: [DATE] |
| 1Password Business | New (Phase 2) | ~£7/seat/mo | 2 seats = £14/mo |
| **Estimated total** | | **€[TBD]/mo** | Excluding Stripe processing fees |

---

## 10. Sign-Off

By signing below, both parties confirm the contents of this document represent an accurate record of Month 1 delivery, an agreed plan for ownership transfer during Phase 2, and acceptance of the Phase 2 and Phase 3 roadmaps as scoped.

**Wolsten Studios LTD**
Name: Dan Wolstenholme
Signature: ___________________________
Date: ___________________________

**SRS Dynamic**
Name: Noel [SURNAME]
Signature: ___________________________
Date: ___________________________

---

<!--
  [ replace this comment block with Wolsten Studios brand footer ]
  [ contact details · registered office · company number ]
-->

*This document is confidential. © Wolsten Studios LTD 2026. All rights reserved.*
