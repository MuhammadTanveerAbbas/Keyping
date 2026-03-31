
-- Create table for saved API key test results
CREATE TABLE public.key_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  key_preview TEXT NOT NULL, -- last 4 chars only
  nickname TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('valid', 'invalid', 'limited')),
  scopes JSONB,
  rate_limit_info JSONB,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.key_tests ENABLE ROW LEVEL SECURITY;

-- Users can only access their own test results
CREATE POLICY "Users can view their own key tests"
  ON public.key_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own key tests"
  ON public.key_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own key tests"
  ON public.key_tests FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_key_tests_user_id ON public.key_tests(user_id);
CREATE INDEX idx_key_tests_provider ON public.key_tests(provider);
