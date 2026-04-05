-- ============================================================
-- KeyPing: Performance Indexes + RLS Policies
-- Run in Supabase → SQL Editor
-- ============================================================

-- ── Indexes for key_tests ──
CREATE INDEX IF NOT EXISTS idx_key_tests_user_id ON key_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_key_tests_created_at ON key_tests(tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_tests_provider ON key_tests(provider);
CREATE INDEX IF NOT EXISTS idx_key_tests_status ON key_tests(status);

-- ── Indexes for alerts ──
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_expiry_date ON alerts(expiry_date ASC);

-- ── Enable RLS ──
ALTER TABLE key_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies: key_tests ──
DROP POLICY IF EXISTS "Users can view own key_tests" ON key_tests;
CREATE POLICY "Users can view own key_tests" ON key_tests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own key_tests" ON key_tests;
CREATE POLICY "Users can insert own key_tests" ON key_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own key_tests" ON key_tests;
CREATE POLICY "Users can delete own key_tests" ON key_tests
  FOR DELETE USING (auth.uid() = user_id);

-- ── RLS Policies: alerts ──
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own alerts" ON alerts;
CREATE POLICY "Users can delete own alerts" ON alerts
  FOR DELETE USING (auth.uid() = user_id);
