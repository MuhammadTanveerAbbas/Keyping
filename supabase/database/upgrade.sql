DO $revoke_rls_helper$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END
$revoke_rls_helper$;

DO $rename_team_member_unique$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.team_members'::regclass
      AND conname = 'team_members_team_id_user_id_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.team_members'::regclass
      AND conname = 'team_members_team_user_unique'
  ) THEN
    EXECUTE 'ALTER TABLE public.team_members
             RENAME CONSTRAINT team_members_team_id_user_id_key TO team_members_team_user_unique';
  END IF;
END
$rename_team_member_unique$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

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

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_token_hash_unique_idx
  ON public.team_invites(token_hash);

INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, t.owner_id, 'owner'
FROM public.teams AS t
ON CONFLICT (team_id, user_id)
DO UPDATE SET role = 'owner';

ALTER TABLE public.key_tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE public.key_tests SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.key_tests ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.key_tests ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE public.teams SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.teams ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.teams ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE public.team_members SET updated_at = COALESCE(updated_at, joined_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.team_members ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.team_members ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.shared_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE public.shared_results SET updated_at = COALESCE(updated_at, shared_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.shared_results ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.shared_results ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE public.alerts SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.alerts ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.alerts ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_provider_supported') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_provider_supported
      CHECK (provider IN ('openai', 'groq', 'anthropic', 'stripe', 'github', 'twitter', 'notion', 'supabase', 'aws', 'gemini', 'custom')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_key_preview_length') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_key_preview_length
      CHECK (char_length(key_preview) BETWEEN 1 AND 4) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_nickname_length') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_nickname_length
      CHECK (nickname IS NULL OR char_length(nickname) <= 200) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_notes_length') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_notes_length
      CHECK (notes IS NULL OR char_length(notes) <= 2000) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_status_supported') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_status_supported
      CHECK (status IN ('valid', 'invalid', 'limited')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_scopes_array') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_scopes_array
      CHECK (scopes IS NULL OR jsonb_typeof(scopes) IN ('array', 'null')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_rate_limit_object') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_rate_limit_object
      CHECK (rate_limit_info IS NULL OR jsonb_typeof(rate_limit_info) IN ('object', 'null')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_health_score_range') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_health_score_range
      CHECK (health_score IS NULL OR health_score BETWEEN 0 AND 100) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_latency_nonnegative') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_latency_nonnegative
      CHECK (latency_ms IS NULL OR latency_ms >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.key_tests'::regclass AND conname = 'key_tests_updated_after_created') THEN
    ALTER TABLE public.key_tests ADD CONSTRAINT key_tests_updated_after_created
      CHECK (updated_at >= created_at) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.teams'::regclass AND conname = 'teams_name_length') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_name_length
      CHECK (char_length(btrim(name)) BETWEEN 1 AND 100) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.teams'::regclass AND conname = 'teams_updated_after_created') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_updated_after_created
      CHECK (updated_at >= created_at) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.team_members'::regclass AND conname = 'team_members_role_supported') THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_supported
      CHECK (role IN ('owner', 'member')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.team_members'::regclass AND conname = 'team_members_updated_after_joined') THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_updated_after_joined
      CHECK (updated_at >= joined_at) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.shared_results'::regclass AND conname = 'shared_results_updated_after_shared') THEN
    ALTER TABLE public.shared_results ADD CONSTRAINT shared_results_updated_after_shared
      CHECK (updated_at >= shared_at) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.alerts'::regclass AND conname = 'alerts_key_nickname_length') THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_key_nickname_length
      CHECK (char_length(key_nickname) BETWEEN 1 AND 200) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.alerts'::regclass AND conname = 'alerts_reminder_days_range') THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_reminder_days_range
      CHECK (reminder_days BETWEEN 1 AND 365) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.alerts'::regclass AND conname = 'alerts_updated_after_created') THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_updated_after_created
      CHECK (updated_at >= created_at) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.shared_results'::regclass AND conname = 'shared_results_team_key_unique'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shared_results GROUP BY team_id, key_test_id HAVING count(*) > 1
    ) THEN
      ALTER TABLE public.shared_results ADD CONSTRAINT shared_results_team_key_unique UNIQUE (team_id, key_test_id);
    ELSE
      RAISE NOTICE 'shared_results contains duplicate team/key pairs; unique constraint was not added';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_key_tests_user_id ON public.key_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_key_tests_tested_at ON public.key_tests(tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_created_at ON public.key_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_updated_at ON public.key_tests(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_provider ON public.key_tests(provider);
CREATE INDEX IF NOT EXISTS idx_key_tests_status ON public.key_tests(status);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_tested_at ON public.key_tests(user_id, tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_created_at ON public.key_tests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_provider ON public.key_tests(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_status ON public.key_tests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_key_preview ON public.key_tests(user_id, key_preview);
CREATE INDEX IF NOT EXISTS idx_key_tests_user_health_score
  ON public.key_tests(user_id, health_score) WHERE health_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_key_tests_user_latency_ms
  ON public.key_tests(user_id, latency_ms) WHERE latency_ms IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_updated_at ON public.teams(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_role ON public.team_members(team_id, role);
CREATE INDEX IF NOT EXISTS idx_team_members_joined_at ON public.team_members(joined_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE role = 'owner' GROUP BY team_id HAVING count(*) > 1
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_owner_per_team_idx ON public.team_members(team_id) WHERE role = ''owner''';
  ELSE
    RAISE NOTICE 'team_members contains multiple owner rows for a team; owner uniqueness index was not added';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_active
  ON public.team_invites(team_id, expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_invites_invited_by ON public.team_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_team_invites_accepted_by
  ON public.team_invites(accepted_by) WHERE accepted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at
  ON public.team_invites(expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shared_results_team_id ON public.shared_results(team_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_key_test_id ON public.shared_results(key_test_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_shared_by ON public.shared_results(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_results_shared_at ON public.shared_results(shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_expiry_date ON public.alerts(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_expiry_date ON public.alerts(user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user_reminder_days ON public.alerts(user_id, reminder_days);
CREATE INDEX IF NOT EXISTS idx_alerts_reminder_days_expiry ON public.alerts(reminder_days, expiry_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unnotified_expiry
  ON public.alerts(user_id, expiry_date) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_updated_at ON public.alerts(updated_at DESC);

CREATE OR REPLACE FUNCTION private.is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams AS t
    WHERE t.id = p_team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.team_members AS tm
          WHERE tm.team_id = t.id
            AND tm.user_id = auth.uid()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION private.is_team_owner(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams AS t
    WHERE t.id = p_team_id
      AND t.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.owns_key_test(p_key_test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.key_tests AS kt
    WHERE kt.id = p_key_test_id
      AND kt.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.is_valid_shared_result(
  p_team_id uuid,
  p_key_test_id uuid,
  p_shared_by uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.key_tests AS kt
    WHERE kt.id = p_key_test_id
      AND kt.user_id = p_shared_by
  )
  AND EXISTS (
    SELECT 1
    FROM public.teams AS t
    WHERE t.id = p_team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.team_members AS tm
          WHERE tm.team_id = t.id
            AND tm.user_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.is_team_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_team_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_key_test(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_valid_shared_result(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_team_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_team_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_key_test(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_valid_shared_result(uuid, uuid, uuid) TO authenticated, service_role;

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

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

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

REVOKE ALL ON FUNCTION private.add_team_owner_membership() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_key_tests_updated_at ON public.key_tests;
CREATE TRIGGER set_key_tests_updated_at
  BEFORE INSERT OR UPDATE ON public.key_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_teams_updated_at ON public.teams;
CREATE TRIGGER set_teams_updated_at
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_team_owner_membership ON public.teams;
CREATE TRIGGER set_team_owner_membership
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION private.add_team_owner_membership();

DROP TRIGGER IF EXISTS set_team_members_updated_at ON public.team_members;
CREATE TRIGGER set_team_members_updated_at
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_team_invites_updated_at ON public.team_invites;
CREATE TRIGGER set_team_invites_updated_at
  BEFORE INSERT OR UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_shared_results_updated_at ON public.shared_results;
CREATE TRIGGER set_shared_results_updated_at
  BEFORE INSERT OR UPDATE ON public.shared_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_alerts_updated_at ON public.alerts;
CREATE TRIGGER set_alerts_updated_at
  BEFORE INSERT OR UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE INSERT OR UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION private.delete_auth_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private.delete_auth_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.delete_auth_user(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can insert own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can update own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can delete own key_tests" ON public.key_tests;

CREATE POLICY "Users can view own key_tests" ON public.key_tests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own key_tests" ON public.key_tests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own key_tests" ON public.key_tests
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own key_tests" ON public.key_tests
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete teams" ON public.teams
  FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT TO authenticated USING (private.is_team_member(id));

DROP POLICY IF EXISTS "Members can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Owner can insert own owner membership" ON public.team_members;
DROP POLICY IF EXISTS "Owners or members can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can update team member roles" ON public.team_members;

CREATE POLICY "Members can view their team members" ON public.team_members
  FOR SELECT TO authenticated USING (private.is_team_member(team_id));
CREATE POLICY "Owners can add team members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      private.is_team_owner(team_id)
      AND role = 'member'
      AND user_id <> auth.uid()
    )
    OR (
      user_id = auth.uid()
      AND role = 'owner'
      AND EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
    )
  );
CREATE POLICY "Owners or members can remove team members" ON public.team_members
  FOR DELETE TO authenticated
  USING (
    (user_id = auth.uid() AND role <> 'owner')
    OR (private.is_team_owner(team_id) AND user_id <> auth.uid())
  );
CREATE POLICY "Owners can update team member roles" ON public.team_members
  FOR UPDATE TO authenticated
  USING (private.is_team_owner(team_id))
  WITH CHECK (private.is_team_owner(team_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can view team invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owners can insert team invites" ON public.team_invites;
DROP POLICY IF EXISTS "Authenticated can accept team invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owners can revoke team invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owners can delete team invites" ON public.team_invites;

CREATE POLICY "Owners can view team invites" ON public.team_invites
  FOR SELECT TO authenticated USING (private.is_team_owner(team_id));
CREATE POLICY "Owners can insert team invites" ON public.team_invites
  FOR INSERT TO authenticated WITH CHECK (private.is_team_owner(team_id) AND invited_by = auth.uid());
CREATE POLICY "Authenticated can accept team invites" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now())
  WITH CHECK (accepted_by = auth.uid() AND accepted_at IS NOT NULL);
CREATE POLICY "Owners can revoke team invites" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (private.is_team_owner(team_id) AND accepted_at IS NULL AND revoked_at IS NULL)
  WITH CHECK (revoked_at IS NOT NULL);
CREATE POLICY "Owners can delete team invites" ON public.team_invites
  FOR DELETE TO authenticated USING (private.is_team_owner(team_id));

DROP POLICY IF EXISTS "Team members can view shared results" ON public.shared_results;
DROP POLICY IF EXISTS "Users can share their results" ON public.shared_results;
DROP POLICY IF EXISTS "Users can unshare their results" ON public.shared_results;
DROP POLICY IF EXISTS "Users or team owners can unshare results" ON public.shared_results;

CREATE POLICY "Team members can view shared results" ON public.shared_results
  FOR SELECT TO authenticated USING (private.is_valid_shared_result(team_id, key_test_id, shared_by));
CREATE POLICY "Users can share their results" ON public.shared_results
  FOR INSERT TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND private.owns_key_test(key_test_id)
    AND private.is_valid_shared_result(team_id, key_test_id, shared_by)
  );
CREATE POLICY "Users or team owners can unshare results" ON public.shared_results
  FOR DELETE TO authenticated USING (shared_by = auth.uid() OR private.is_team_owner(team_id));

DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.alerts;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own alerts" ON public.alerts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own alerts" ON public.alerts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public.key_tests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.teams FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.team_members FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.team_invites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.shared_results FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.alerts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.notification_preferences FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.key_tests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON public.shared_results TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_team_with_owner(team_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
  _team_name text;
  _team_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _team_name := btrim(team_name);
  IF _team_name IS NULL OR char_length(_team_name) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Team name must be between 1 and 100 characters';
  END IF;

  INSERT INTO public.teams (name, owner_id)
  VALUES (_team_name, _user_id)
  RETURNING id INTO _team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (_team_id, _user_id, 'owner')
  ON CONFLICT (team_id, user_id)
  DO UPDATE SET role = 'owner';

  RETURN _team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_team_id uuid,
  p_email text DEFAULT NULL,
  p_expires_in_hours integer DEFAULT 168
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
  _email text;
  _token text;
  _token_hash text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  PERFORM 1
  FROM public.teams
  WHERE id = p_team_id
    AND owner_id = _user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the team owner can create an invite';
  END IF;
  IF p_expires_in_hours IS NULL OR p_expires_in_hours NOT BETWEEN 1 AND 720 THEN
    RAISE EXCEPTION 'Invite expiry must be between 1 and 720 hours';
  END IF;

  _email := NULLIF(btrim(p_email), '');
  IF _email IS NOT NULL AND (char_length(_email) NOT BETWEEN 3 AND 320 OR position('@' IN _email) <= 1) THEN
    RAISE EXCEPTION 'Invite email is invalid';
  END IF;

  _token := replace(pg_catalog.gen_random_uuid()::text, '-', '') || replace(pg_catalog.gen_random_uuid()::text, '-', '');
  _token_hash := encode(sha256(convert_to(_token, 'UTF8')), 'hex');

  INSERT INTO public.team_invites (team_id, email, token_hash, invited_by, expires_at)
  VALUES (p_team_id, _email, _token_hash, _user_id, now() + make_interval(hours => p_expires_in_hours));

  RETURN _token;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
  _invite public.team_invites%ROWTYPE;
  _token_hash text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_token IS NULL
     OR char_length(btrim(p_token)) <> 64
     OR btrim(p_token) !~ '^[0-9a-fA-F]{64}$' THEN
    RAISE EXCEPTION 'Invite token is invalid';
  END IF;

  _token_hash := encode(sha256(convert_to(lower(btrim(p_token)), 'UTF8')), 'hex');

  SELECT * INTO _invite
  FROM public.team_invites
  WHERE token_hash = _token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite token is invalid';
  END IF;
  IF _invite.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite has already been accepted';
  END IF;
  IF _invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite has been revoked';
  END IF;
  IF _invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;
  IF _invite.email IS NOT NULL AND lower(_invite.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'Invite email does not match the signed-in account';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (_invite.team_id, _user_id, _invite.role)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.team_invites
  SET accepted_by = _user_id, accepted_at = now()
  WHERE id = _invite.id;

  RETURN _invite.team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_team_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.team_invites
  SET revoked_at = now()
  WHERE id = p_invite_id
    AND accepted_at IS NULL
    AND revoked_at IS NULL
    AND private.is_team_owner(team_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite is not available or you are not the team owner';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_team_ownership(p_team_id uuid, p_new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
  _current_owner_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_new_owner_id IS NULL THEN
    RAISE EXCEPTION 'New owner is required';
  END IF;

  SELECT owner_id INTO _current_owner_id
  FROM public.teams
  WHERE id = p_team_id
  FOR UPDATE;

  IF NOT FOUND OR _current_owner_id <> _user_id THEN
    RAISE EXCEPTION 'Only the current team owner can transfer ownership';
  END IF;
  IF p_new_owner_id = _user_id THEN
    RAISE EXCEPTION 'The new owner must be different from the current owner';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'The new owner must already be a team member';
  END IF;

  UPDATE public.team_members SET role = 'member'
  WHERE team_id = p_team_id AND role = 'owner' AND user_id <> p_new_owner_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (p_team_id, _current_owner_id, 'member')
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'member';

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (p_team_id, p_new_owner_id, 'owner')
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'owner';

  UPDATE public.teams SET owner_id = p_new_owner_id WHERE id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  _user_id uuid;
  _team_name text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT name INTO _team_name
  FROM public.teams
  WHERE owner_id = _user_id
  ORDER BY created_at
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Cannot delete account: transfer or delete team "%" first.', _team_name;
  END IF;

  DELETE FROM public.shared_results WHERE shared_by = _user_id;
  DELETE FROM public.team_invites WHERE invited_by = _user_id OR accepted_by = _user_id;
  DELETE FROM public.team_members WHERE user_id = _user_id;
  DELETE FROM public.teams WHERE owner_id = _user_id;
  DELETE FROM public.alerts WHERE user_id = _user_id;
  DELETE FROM public.notification_preferences WHERE user_id = _user_id;
  DELETE FROM public.key_tests WHERE user_id = _user_id;
  PERFORM private.delete_auth_user(_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_team_with_owner(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_team_invite(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_team_invite(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_team_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transfer_team_ownership(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_team_with_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invite(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_team_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_team_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

CREATE TABLE IF NOT EXISTS private.usage_counters (
  user_id       UUID        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  request_count INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT usage_counters_primary_key PRIMARY KEY (user_id, window_start),
  CONSTRAINT usage_counters_count_nonnegative CHECK (request_count >= 0)
);

ALTER TABLE private.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_user_id uuid,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  _max integer;
  _window_length integer;
  _window timestamptz;
  _count integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  _max := GREATEST(p_max_requests, 1);
  _window_length := GREATEST(LEAST(p_window_seconds, 86400), 1);
  _window := to_timestamp(
    floor(extract(epoch FROM pg_catalog.now()) / _window_length) * _window_length
  );

  INSERT INTO private.usage_counters (user_id, window_start, request_count)
  VALUES (p_user_id, _window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = private.usage_counters.request_count + 1
  RETURNING request_count INTO _count;

  DELETE FROM private.usage_counters
  WHERE user_id = p_user_id AND window_start < _window;

  RETURN _count <= _max;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, integer, integer)
  TO service_role;

REVOKE ALL ON private.usage_counters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.usage_counters TO service_role;

DROP POLICY IF EXISTS "Deny all direct access to usage_counters" ON private.usage_counters;
CREATE POLICY "Deny all direct access to usage_counters" ON private.usage_counters
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (false) WITH CHECK (false);

COMMENT ON FUNCTION public.create_team_invite(uuid, text, integer) IS
  'Creates a hashed, expiring team invite. Only the current team owner may call it.';
COMMENT ON FUNCTION public.accept_team_invite(text) IS
  'Atomically validates and accepts an unexpired, unrevoked team invite.';
COMMENT ON FUNCTION public.revoke_team_invite(uuid) IS
  'Revokes an outstanding invite. Only the current team owner may call it.';
COMMENT ON FUNCTION public.transfer_team_ownership(uuid, uuid) IS
  'Transfers a team to an existing member; direct owner_id updates are blocked.';
COMMENT ON FUNCTION public.delete_user_account() IS
  'Deletes the calling account and its data. Refuses while the caller still owns a team.';
COMMENT ON FUNCTION public.consume_rate_limit(uuid, integer, integer) IS
  'Consumes one unit of a fixed window request budget. Callable only by service_role.';
COMMENT ON TABLE public.notification_preferences IS
  'One durable notification preference row per authenticated user.';
COMMENT ON TABLE public.team_invites IS
  'Team invitations. Only a SHA-256 hash of the token is stored; the raw token is returned once at creation.';
COMMENT ON TABLE private.usage_counters IS
  'Fixed window request counters for Edge Function rate limiting. Not exposed through PostgREST.';

DO $validate_checks$
DECLARE
  _check record;
  _blocking text;
BEGIN
  FOR _check IN
    SELECT c.conname, c.conrelid::regclass::text AS table_name
    FROM pg_constraint c
    WHERE c.connamespace = 'public'::regnamespace
      AND c.contype = 'c'
      AND NOT c.convalidated
    ORDER BY c.conname
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', _check.table_name, _check.conname);
    EXCEPTION WHEN others THEN
      GET STACKED DIAGNOSTICS _blocking = MESSAGE_TEXT;
      RAISE NOTICE 'left NOT VALID: %.% because %', _check.table_name, _check.conname, _blocking;
    END;
  END LOOP;
END
$validate_checks$;
