import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { KeyTest } from "./useAnalytics";

export function useHistoryFilters() {
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  return { filterProvider, setFilterProvider, filterStatus, setFilterStatus };
}

export function useHistory() {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("key_tests")
      .select("id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms")
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false });

    if (filterProvider !== "all") query = query.eq("provider", filterProvider);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;
    if (!error && data) setTests(data as KeyTest[]);
    setLoading(false);
  }, [user, filterProvider, filterStatus]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const deleteTest = useCallback(async (id: string) => {
    const { error } = await supabase.from("key_tests").delete().eq("id", id);
    if (!error) setTests((prev) => prev.filter((t) => t.id !== id));
    return !error;
  }, []);

  return { tests, loading, refresh: fetchTests, deleteTest, filterProvider, setFilterProvider, filterStatus, setFilterStatus };
}
