-- ============================================================
-- KeyPing: Final Consolidated Schema
-- Safe to re-run — drops everything first then recreates
-- ============================================================

-- ── Drop in leaf-to-root dependency order ───────────────────
DROP TABLE IF EXISTS public.shared_results CASCADE;
DROP TABLE IF EXISTS public.team_members   CASCADE;
DROP TABLE IF EXISTS public.alerts         CASCADE;
DROP TABLE IF EXISTS public.key_tests      CASCADE;
DROP TABLE IF EXISTS public.teams          CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_account();
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ── Shared trigger function ──────────────────────────────────
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── key_tests ────────────────────────────────────────────────
CREATE TABLE public.key_tests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT        NOT NULL,
  key_preview     TEXT        NOT NULL,
  nickname        TEXT,
  notes           TEXT,
  status          TEXT        NOT NULL CHECK (status IN ('valid', 'invalid', 'limited')),
  scopes          JSONB,
  rate_limit_info JSONB,
  health_score    INTEGER,
  latency_ms      INTEGER,
  tested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE public.key_tests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_key_tests_user_id   ON public.key_tests(user_id);
CREATE INDEX idx_key_tests_tested_at ON public.key_tests(tested_at DESC);
CREATE INDEX idx_key_tests_provider  ON public.key_tests(provider);
CREATE INDEX idx_key_tests_status    ON public.key_tests(status);

CREATE TRIGGER set_key_tests_updated_at
  BEFORE UPDATE ON public.key_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own key_tests"   ON public.key_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own key_tests" ON public.key_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own key_tests" ON public.key_tests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own key_tests" ON public.key_tests FOR DELETE USING (auth.uid() = user_id);

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can create teams"  ON public.teams FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update teams" ON public.teams FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete teams" ON public.teams FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ── team_members ─────────────────────────────────────────────
CREATE TABLE public.team_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view their team members" ON public.team_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members AS tm
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  ));

CREATE POLICY "Owners can manage team members" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Owners can remove team members" ON public.team_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ── teams SELECT policy (needs team_members to exist first) ──
CREATE POLICY "Team members can view their teams" ON public.teams FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()
  ));

-- ── shared_results ───────────────────────────────────────────
CREATE TABLE public.shared_results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  key_test_id UUID        NOT NULL REFERENCES public.key_tests(id) ON DELETE CASCADE,
  shared_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_shared_results_updated_at
  BEFORE UPDATE ON public.shared_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Team members can view shared results" ON public.shared_results FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = shared_results.team_id AND team_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can share their results"   ON public.shared_results FOR INSERT TO authenticated WITH CHECK (shared_by = auth.uid());
CREATE POLICY "Users can unshare their results" ON public.shared_results FOR DELETE TO authenticated USING (shared_by = auth.uid());

-- ── alerts ───────────────────────────────────────────────────
CREATE TABLE public.alerts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_nickname  TEXT        NOT NULL,
  expiry_date   TIMESTAMPTZ NOT NULL,
  reminder_days INTEGER     NOT NULL DEFAULT 7,
  notified      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_alerts_user_id     ON public.alerts(user_id);
CREATE INDEX idx_alerts_expiry_date ON public.alerts(expiry_date ASC);

CREATE TRIGGER set_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own alerts"   ON public.alerts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── delete_user_account RPC ──────────────────────────────────
CREATE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _team_record RECORD;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Block deletion if user is the last owner of any team
  FOR _team_record IN
    SELECT t.id, t.name
    FROM public.teams t
    WHERE t.owner_id = _user_id
      AND (
        SELECT COUNT(*) FROM public.team_members tm
        WHERE tm.team_id = t.id AND tm.role = 'owner'
      ) = 1
  LOOP
    RAISE EXCEPTION 'Cannot delete account: you are the last owner of team "%". Transfer ownership or delete the team first.', _team_record.name;
  END LOOP;

  DELETE FROM public.shared_results WHERE shared_by = _user_id;
  DELETE FROM public.team_members   WHERE user_id   = _user_id;
  DELETE FROM public.teams          WHERE owner_id  = _user_id;
  DELETE FROM public.alerts         WHERE user_id   = _user_id;
  DELETE FROM public.key_tests      WHERE user_id   = _user_id;
  DELETE FROM auth.users            WHERE id        = _user_id;
END;
$$;
