/*
# Bot Admin Dashboard Schema

1. Overview
This migration creates the schema for a private admin dashboard that manages
a Node.js Messenger (Facebook) bot. It stores Facebook connection state,
bot session state, bot running status, and an activity log.

2. New Tables
- `bot_state` (single row): holds Facebook connection status, session status,
  bot running status, and timestamps. Enforced single-row via a check constraint.
- `bot_logs`: append-only log entries with level (info/warn/error/success),
  message, source, and created_at.

3. Columns
bot_state:
- id (int, primary key, always 1) — singleton row
- facebook_connected (boolean, default false)
- facebook_user_name (text, nullable) — display name of connected FB account
- session_active (boolean, default false)
- bot_running (boolean, default false)
- last_connected_at (timestamptz, nullable)
- last_disconnected_at (timestamptz, nullable)
- updated_at (timestamptz, default now())

bot_logs:
- id (uuid, primary key)
- level (text: info|warn|error|success, default 'info')
- message (text, not null)
- source (text, nullable) — which subsystem produced the log
- created_at (timestamptz, default now())

4. Security
- RLS enabled on both tables.
- This is a private admin dashboard with no sign-in screen (single-tenant).
  Policies use `TO anon, authenticated` so the anon-key frontend can read/write.
  Data is intentionally shared within this single private deployment.

5. Notes
- A trigger keeps bot_state.updated_at fresh on every update.
- A check constraint ensures only one bot_state row exists (id = 1).
- An index on bot_logs.created_at desc speeds up the recent-logs query.
*/

CREATE TABLE IF NOT EXISTS bot_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  facebook_connected boolean NOT NULL DEFAULT false,
  facebook_user_name text,
  session_active boolean NOT NULL DEFAULT false,
  bot_running boolean NOT NULL DEFAULT false,
  last_connected_at timestamptz,
  last_disconnected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bot_state" ON bot_state;
CREATE POLICY "anon_select_bot_state" ON bot_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bot_state" ON bot_state;
CREATE POLICY "anon_insert_bot_state" ON bot_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bot_state" ON bot_state;
CREATE POLICY "anon_update_bot_state" ON bot_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bot_state" ON bot_state;
CREATE POLICY "anon_delete_bot_state" ON bot_state FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS bot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error','success')),
  message text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bot_logs" ON bot_logs;
CREATE POLICY "anon_select_bot_logs" ON bot_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bot_logs" ON bot_logs;
CREATE POLICY "anon_insert_bot_logs" ON bot_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bot_logs" ON bot_logs;
CREATE POLICY "anon_delete_bot_logs" ON bot_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS bot_logs_created_at_idx ON bot_logs (created_at DESC);

-- Seed the singleton row if it doesn't exist
INSERT INTO bot_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- updated_at trigger for bot_state
CREATE OR REPLACE FUNCTION update_bot_state_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bot_state_updated_at ON bot_state;
CREATE TRIGGER bot_state_updated_at
  BEFORE UPDATE ON bot_state
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_state_updated_at();
