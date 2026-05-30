-- ============================================================================
-- Project Lumen — Migration 002: Mux integration
-- ----------------------------------------------------------------------------
-- Adds Mux columns to `shows` for the bulletproof upload pipeline.
-- Drops `audio_url` — audio is folded into the video asset (single source).
-- Adds 'preparing' status for the window between Mux upload start and probe done.
--
-- Idempotent: safe to run multiple times.
--
-- ⚠ DESTRUCTIVE: dropping audio_url discards any data in that column. Confirmed
-- safe by Dan on 2026-05-30 (no real users yet).
-- ============================================================================

-- ── New Mux columns ─────────────────────────────────────────────────────────
ALTER TABLE shows ADD COLUMN IF NOT EXISTS mux_upload_id    TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS mux_asset_id     TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS mux_playback_id  TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS mux_status       TEXT;  -- waiting / ready / errored
ALTER TABLE shows ADD COLUMN IF NOT EXISTS video_metadata   JSONB; -- {width,height,frame_rate,duration,codec,audio:{...}}

-- ── Drop audio_url (audio now lives inside the video asset on Mux) ──────────
ALTER TABLE shows DROP COLUMN IF EXISTS audio_url;

-- ── Status enum: add 'preparing' for in-flight Mux processing ───────────────
-- artist submits → 'preparing' → Mux probes → 'pending' (pass) or 'rejected' (fail)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shows_status_check') THEN
    ALTER TABLE shows DROP CONSTRAINT shows_status_check;
  END IF;
  ALTER TABLE shows ADD CONSTRAINT shows_status_check
    CHECK (status IN ('draft','preparing','pending','published','rejected'));
END $$;

-- ── Indexes for webhook correlation ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shows_mux_asset_id  ON shows (mux_asset_id);
CREATE INDEX IF NOT EXISTS idx_shows_mux_upload_id ON shows (mux_upload_id);

-- ── Sanity check ────────────────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE mux_asset_id IS NOT NULL)  AS shows_with_mux_asset,
  COUNT(*) FILTER (WHERE status = 'preparing')      AS shows_preparing
FROM shows;
