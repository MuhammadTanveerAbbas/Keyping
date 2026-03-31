
-- Add health_score and latency_ms to key_tests
ALTER TABLE public.key_tests ADD COLUMN IF NOT EXISTS health_score integer DEFAULT NULL;
ALTER TABLE public.key_tests ADD COLUMN IF NOT EXISTS latency_ms integer DEFAULT NULL;

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Shared results table
CREATE TABLE public.shared_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  key_test_id uuid REFERENCES public.key_tests(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid NOT NULL,
  shared_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

-- Alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_nickname text NOT NULL,
  expiry_date timestamptz NOT NULL,
  reminder_days integer NOT NULL DEFAULT 7,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()));

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete teams" ON public.teams
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- RLS policies for team_members
CREATE POLICY "Members can view their team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_members AS tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()));

CREATE POLICY "Owners can manage team members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Owners can remove team members" ON public.team_members
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid()) OR user_id = auth.uid());

-- RLS policies for shared_results
CREATE POLICY "Team members can view shared results" ON public.shared_results
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = shared_results.team_id AND team_members.user_id = auth.uid()));

CREATE POLICY "Users can share their results" ON public.shared_results
  FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can unshare their results" ON public.shared_results
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid());

-- RLS policies for alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own alerts" ON public.alerts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
