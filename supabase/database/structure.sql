CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.key_tests (
  id               UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         TEXT        NOT NULL,
  key_preview      TEXT        NOT NULL,
  nickname         TEXT,
  notes            TEXT,
  status           TEXT        NOT NULL,
  scopes           JSONB,
  rate_limit_info  JSONB,
  health_score     INTEGER,
  latency_ms       INTEGER,
  tested_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT key_tests_provider_supported
    CHECK (provider IN ('openai', 'groq', 'anthropic', 'stripe', 'github', 'twitter', 'notion', 'supabase', 'aws', 'gemini', 'custom')),
  CONSTRAINT key_tests_key_preview_length
    CHECK (char_length(key_preview) BETWEEN 1 AND 4),
  CONSTRAINT key_tests_nickname_length
    CHECK (nickname IS NULL OR char_length(nickname) <= 200),
  CONSTRAINT key_tests_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 2000),
  CONSTRAINT key_tests_status_supported
    CHECK (status IN ('valid', 'invalid', 'limited')),
  CONSTRAINT key_tests_scopes_array
    CHECK (scopes IS NULL OR jsonb_typeof(scopes) IN ('array', 'null')),
  CONSTRAINT key_tests_rate_limit_object
    CHECK (rate_limit_info IS NULL OR jsonb_typeof(rate_limit_info) IN ('object', 'null')),
  CONSTRAINT key_tests_health_score_range
    CHECK (health_score IS NULL OR health_score BETWEEN 0 AND 100),
  CONSTRAINT key_tests_latency_nonnegative
    CHECK (latency_ms IS NULL OR latency_ms >= 0),
  CONSTRAINT key_tests_updated_after_created
    CHECK (updated_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_key_tests_user_id
  ON public.key_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_key_tests_tested_at
  ON public.key_tests(tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_created_at
  ON public.key_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_updated_at
  ON public.key_tests(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_provider
  ON public.key_tests(provider);
CREATE INDEX IF NOT EXISTS idx_key_tests_status
  ON public.key_tests(status);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_tested_at
  ON public.key_tests(user_id, tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_created_at
  ON public.key_tests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_provider
  ON public.key_tests(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_status
  ON public.key_tests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_key_preview
  ON public.key_tests(user_id, key_preview);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_health_score
  ON public.key_tests(user_id, health_score)
  WHERE health_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_key_tests_user_latency_ms
  ON public.key_tests(user_id, latency_ms)
  WHERE latency_ms IS NOT NULL;

DROP TRIGGER IF EXISTS set_key_tests_updated_at ON public.key_tests;
CREATE TRIGGER set_key_tests_updated_at
  BEFORE INSERT OR UPDATE ON public.key_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT teams_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  CONSTRAINT teams_updated_after_created CHECK (updated_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_teams_owner_id
  ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at
  ON public.teams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_updated_at
  ON public.teams(updated_at DESC);

DROP TRIGGER IF EXISTS set_teams_updated_at ON public.teams;
CREATE TRIGGER set_teams_updated_at
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.team_members (
  id         UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT team_members_role_supported CHECK (role IN ('owner', 'member')),
  CONSTRAINT team_members_updated_after_joined CHECK (updated_at >= joined_at),
  CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id
  ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id
  ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_role
  ON public.team_members(team_id, role);
CREATE INDEX IF NOT EXISTS idx_team_members_joined_at
  ON public.team_members(joined_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_owner_per_team_idx
  ON public.team_members(team_id)
  WHERE role = 'owner';

DROP TRIGGER IF EXISTS set_team_members_updated_at ON public.team_members;
CREATE TRIGGER set_team_members_updated_at
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION private.add_team_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (team_id, user_id)
  DO UPDATE SET role = 'owner';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_team_owner_membership ON public.teams;
CREATE TRIGGER set_team_owner_membership
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION private.add_team_owner_membership();

CREATE TABLE IF NOT EXISTS public.team_invites (
  id           UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  team_id      UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email        TEXT,
  token_hash   TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'member',
  invited_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by  UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ  NOT NULL,
  accepted_at  TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT team_invites_role_supported CHECK (role IN ('member')),
  CONSTRAINT team_invites_email_length
    CHECK (email IS NULL OR (char_length(email) BETWEEN 3 AND 320 AND position('@' IN email) > 1)),
  CONSTRAINT team_invites_token_hash_format
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT team_invites_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT team_invites_expiry_limit CHECK (expires_at <= created_at + INTERVAL '720 hours'),
  CONSTRAINT team_invites_acceptance_pair
    CHECK ((accepted_at IS NULL) = (accepted_by IS NULL)),
  CONSTRAINT team_invites_accepted_after_creation
    CHECK (accepted_at IS NULL OR accepted_at >= created_at),
  CONSTRAINT team_invites_revoked_after_creation
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
  CONSTRAINT team_invites_terminal_state
    CHECK (accepted_at IS NULL OR revoked_at IS NULL),
  CONSTRAINT team_invites_updated_after_created
    CHECK (updated_at >= created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_token_hash_unique_idx
  ON public.team_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id
  ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_active
  ON public.team_invites(team_id, expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_invites_invited_by
  ON public.team_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_team_invites_accepted_by
  ON public.team_invites(accepted_by)
  WHERE accepted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at
  ON public.team_invites(expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

DROP TRIGGER IF EXISTS set_team_invites_updated_at ON public.team_invites;
CREATE TRIGGER set_team_invites_updated_at
  BEFORE INSERT OR UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.shared_results (
  id          UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  team_id     UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  key_test_id UUID        NOT NULL REFERENCES public.key_tests(id) ON DELETE CASCADE,
  shared_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT shared_results_team_key_unique UNIQUE (team_id, key_test_id),
  CONSTRAINT shared_results_updated_after_shared CHECK (updated_at >= shared_at)
);

CREATE INDEX IF NOT EXISTS idx_shared_results_team_id
  ON public.shared_results(team_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_key_test_id
  ON public.shared_results(key_test_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_shared_by
  ON public.shared_results(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_results_shared_at
  ON public.shared_results(shared_at DESC);

DROP TRIGGER IF EXISTS set_shared_results_updated_at ON public.shared_results;
CREATE TRIGGER set_shared_results_updated_at
  BEFORE INSERT OR UPDATE ON public.shared_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.alerts (
  id            UUID        PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_nickname  TEXT        NOT NULL,
  expiry_date   TIMESTAMPTZ  NOT NULL,
  reminder_days INTEGER     NOT NULL DEFAULT 7,
  notified      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT alerts_key_nickname_length CHECK (char_length(key_nickname) BETWEEN 1 AND 200),
  CONSTRAINT alerts_reminder_days_range CHECK (reminder_days BETWEEN 1 AND 365),
  CONSTRAINT alerts_updated_after_created CHECK (updated_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id
  ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_expiry_date
  ON public.alerts(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_expiry_date
  ON public.alerts(user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user_reminder_days
  ON public.alerts(user_id, reminder_days);
CREATE INDEX IF NOT EXISTS idx_alerts_reminder_days_expiry
  ON public.alerts(reminder_days, expiry_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unnotified_expiry
  ON public.alerts(user_id, expiry_date)
  WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at
  ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_updated_at
  ON public.alerts(updated_at DESC);

DROP TRIGGER IF EXISTS set_alerts_updated_at ON public.alerts;
CREATE TRIGGER set_alerts_updated_at
  BEFORE INSERT OR UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications  BOOLEAN     NOT NULL DEFAULT true,
  expiry_alerts        BOOLEAN     NOT NULL DEFAULT true,
  weekly_digest        BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_updated_after_created
    CHECK (updated_at >= created_at)
);

DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE INSERT OR UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS private.usage_counters (
  user_id       UUID        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  request_count INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT usage_counters_primary_key PRIMARY KEY (user_id, window_start),
  CONSTRAINT usage_counters_count_nonnegative CHECK (request_count >= 0)
);
