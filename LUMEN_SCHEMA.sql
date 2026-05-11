-- ============================================================================
-- Project Lumen — Supabase Schema Bootstrap
-- ----------------------------------------------------------------------------
-- Idempotent: safe to run as many times as you like.
-- Order matters: tables with foreign keys come after the ones they reference.
-- After running this, also create two Storage buckets via the Supabase
-- Storage UI (or API): 'shows' and 'users', both public.
-- ============================================================================

-- ── 1. users (mirrors Clerk identities) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
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
  payout_method      TEXT,
  payout_email       TEXT,
  payout_iban        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for older deployments
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified          BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS featured          BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_of_month   BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_on_license BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_method     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_email      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_iban       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug              TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio               TEXT;

-- Add the slug uniqueness if it wasn't there
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_slug_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_slug_key UNIQUE (slug);
  END IF;
END $$;


-- ── 2. shows (uploaded by artists) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         TEXT REFERENCES users(clerk_id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  tags              TEXT[],
  thumbnail_url     TEXT,
  preview_url       TEXT,
  video_url         TEXT,
  audio_url         TEXT,
  status            TEXT CHECK (status IN ('draft','pending','published','rejected')) DEFAULT 'pending',
  rejection_reason  TEXT,
  featured          BOOLEAN DEFAULT false,
  featured_until    TIMESTAMPTZ,
  homepage_featured BOOLEAN DEFAULT false,
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shows ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS featured          BOOLEAN DEFAULT false;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS featured_until    TIMESTAMPTZ;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS homepage_featured BOOLEAN DEFAULT false;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMPTZ;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS reviewed_by       TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS tags              TEXT[];
ALTER TABLE shows ADD COLUMN IF NOT EXISTS audio_url         TEXT;

CREATE INDEX IF NOT EXISTS idx_shows_artist_id ON shows (artist_id);
CREATE INDEX IF NOT EXISTS idx_shows_status    ON shows (status);
CREATE INDEX IF NOT EXISTS idx_shows_featured  ON shows (featured);


-- ── 3. venues (one per venue user) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT UNIQUE REFERENCES users(clerk_id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  default_show_id     UUID REFERENCES shows(id) ON DELETE SET NULL,
  default_volume      INTEGER DEFAULT 80,
  default_brightness  INTEGER DEFAULT 90,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_show_id    UUID REFERENCES shows(id) ON DELETE SET NULL;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_volume     INTEGER DEFAULT 80;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS default_brightness INTEGER DEFAULT 90;


-- ── 4. tables (projectors) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  ip_address  TEXT,
  status      TEXT CHECK (status IN ('online_playing','online_idle','offline')) DEFAULT 'offline',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tables_venue_id ON tables (venue_id);

-- Enable Supabase Realtime for live status pulse
ALTER TABLE tables REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  END IF;
END $$;


-- ── 5. licenses (venue → show) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     TEXT REFERENCES users(clerk_id) ON DELETE CASCADE,
  show_id      UUID REFERENCES shows(id) ON DELETE CASCADE,
  licensed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, show_id)
);

CREATE INDEX IF NOT EXISTS idx_licenses_venue_id ON licenses (venue_id);
CREATE INDEX IF NOT EXISTS idx_licenses_show_id  ON licenses (show_id);


-- ── 6. earnings (royalty ledger) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     TEXT REFERENCES users(clerk_id) ON DELETE CASCADE,
  venue_id      TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  show_id       UUID REFERENCES shows(id) ON DELETE SET NULL,
  license_fee   NUMERIC(10,2),
  artist_share  NUMERIC(10,2),
  status        TEXT CHECK (status IN ('pending','paid')) DEFAULT 'pending',
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_artist_id ON earnings (artist_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status    ON earnings (status);


-- ============================================================================
-- After this runs, head to Supabase Storage and create two buckets:
--   • shows  — public, used for thumbnail/preview/show/audio uploads
--   • users  — public, used for avatar uploads
-- Both should allow public read; writes happen via the service role key from
-- the Next.js server routes only.
-- ============================================================================

-- Quick sanity check:
SELECT
  (SELECT count(*) FROM users)    AS users_count,
  (SELECT count(*) FROM shows)    AS shows_count,
  (SELECT count(*) FROM venues)   AS venues_count,
  (SELECT count(*) FROM tables)   AS tables_count,
  (SELECT count(*) FROM licenses) AS licenses_count,
  (SELECT count(*) FROM earnings) AS earnings_count;
