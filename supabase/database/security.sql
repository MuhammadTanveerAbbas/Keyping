REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.add_team_owner_membership() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.key_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.usage_counters ENABLE ROW LEVEL SECURITY;

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

REVOKE ALL ON FUNCTION private.is_team_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_team_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_key_test(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_valid_shared_result(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.delete_auth_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_team_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_team_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_key_test(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_valid_shared_result(uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.delete_auth_user(uuid) TO authenticated;

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
  WHERE user_id = p_user_id
    AND window_start < _window;

  RETURN _count <= _max;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, integer, integer)
  TO service_role;

DROP POLICY IF EXISTS "Users can view own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can insert own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can update own key_tests" ON public.key_tests;
DROP POLICY IF EXISTS "Users can delete own key_tests" ON public.key_tests;

CREATE POLICY "Users can view own key_tests" ON public.key_tests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own key_tests" ON public.key_tests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own key_tests" ON public.key_tests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own key_tests" ON public.key_tests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete teams" ON public.teams
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT TO authenticated
  USING (private.is_team_member(id));

DROP POLICY IF EXISTS "Members can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Owner can insert own owner membership" ON public.team_members;
DROP POLICY IF EXISTS "Owners or members can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can update team member roles" ON public.team_members;

CREATE POLICY "Members can view their team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (private.is_team_member(team_id));
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
  FOR SELECT TO authenticated
  USING (private.is_team_owner(team_id));
CREATE POLICY "Owners can insert team invites" ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (private.is_team_owner(team_id) AND invited_by = auth.uid());
CREATE POLICY "Authenticated can accept team invites" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now())
  WITH CHECK (accepted_by = auth.uid() AND accepted_at IS NOT NULL);
CREATE POLICY "Owners can revoke team invites" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (private.is_team_owner(team_id) AND accepted_at IS NULL AND revoked_at IS NULL)
  WITH CHECK (revoked_at IS NOT NULL);
CREATE POLICY "Owners can delete team invites" ON public.team_invites
  FOR DELETE TO authenticated
  USING (private.is_team_owner(team_id));

DROP POLICY IF EXISTS "Team members can view shared results" ON public.shared_results;
DROP POLICY IF EXISTS "Users can share their results" ON public.shared_results;
DROP POLICY IF EXISTS "Users can unshare their results" ON public.shared_results;
DROP POLICY IF EXISTS "Users or team owners can unshare results" ON public.shared_results;

CREATE POLICY "Team members can view shared results" ON public.shared_results
  FOR SELECT TO authenticated
  USING (private.is_valid_shared_result(team_id, key_test_id, shared_by));
CREATE POLICY "Users can share their results" ON public.shared_results
  FOR INSERT TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND private.owns_key_test(key_test_id)
    AND private.is_valid_shared_result(team_id, key_test_id, shared_by)
  );
CREATE POLICY "Users or team owners can unshare results" ON public.shared_results
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid() OR private.is_team_owner(team_id));

DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.alerts;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own alerts" ON public.alerts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

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

REVOKE ALL ON private.usage_counters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.usage_counters TO service_role;

DROP POLICY IF EXISTS "Deny all direct access to usage_counters" ON private.usage_counters;
CREATE POLICY "Deny all direct access to usage_counters" ON private.usage_counters
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

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

  INSERT INTO public.team_invites (
    team_id, email, token_hash, invited_by, expires_at
  )
  VALUES (
    p_team_id, _email, _token_hash, _user_id,
    now() + make_interval(hours => p_expires_in_hours)
  );

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

  SELECT *
  INTO _invite
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
  SET accepted_by = _user_id,
      accepted_at = now()
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

CREATE OR REPLACE FUNCTION public.transfer_team_ownership(
  p_team_id uuid,
  p_new_owner_id uuid
)
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

  SELECT owner_id
  INTO _current_owner_id
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
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'The new owner must already be a team member';
  END IF;

  UPDATE public.team_members
  SET role = 'member'
  WHERE team_id = p_team_id
    AND role = 'owner'
    AND user_id <> p_new_owner_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (p_team_id, _current_owner_id, 'member')
  ON CONFLICT (team_id, user_id)
  DO UPDATE SET role = 'member';

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (p_team_id, p_new_owner_id, 'owner')
  ON CONFLICT (team_id, user_id)
  DO UPDATE SET role = 'owner';

  UPDATE public.teams
  SET owner_id = p_new_owner_id
  WHERE id = p_team_id;
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

  SELECT name
  INTO _team_name
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
