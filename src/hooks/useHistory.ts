import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { onDataChanged } from "@/lib/data-events";
import { KEY_TEST_FIELDS, createRequestGuard, normalizeKeyTests } from "./rows";
import type { KeyTest } from "./rows";

export function useHistory() {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const guard = useRef(createRequestGuard());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchTests = useCallback(async () => {
    const isCurrent = guard.current.begin();

    if (!user) {
      if (!isCurrent()) return;
      setTests([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Row level security already scopes this to the caller. The explicit
    // filter is kept because it makes the query self describing and matches
    // the partial index on user_id.
    let query = supabase
      .from("key_tests")
      .select(KEY_TEST_FIELDS)
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false })
      // A bounded window keeps a large account from shipping its whole table
      // to the browser on every dashboard and history mount.
      .limit(500);

    if (filterProvider !== "all") query = query.eq("provider", filterProvider);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error: queryError } = await query;

    // A newer request started while this one was in flight, so this result is
    // stale and must not be written.
    if (!isCurrent() || !mounted.current) return;

    if (queryError) {
      setError(queryError.message);
      setTests([]);
    } else {
      setTests(normalizeKeyTests(data));
    }
    setLoading(false);
  }, [user, filterProvider, filterStatus]);

  useEffect(() => {
    void fetchTests();
  }, [fetchTests]);

  // Refetches when another page changes key_tests, so saving on the dashboard
  // or deleting in Settings is reflected here without the caller having to
  // reach into this hook.
  useEffect(
    () => onDataChanged(["key_tests"], () => void fetchTests()),
    [fetchTests],
  );

  const deleteTest = useCallback(async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const { error: deleteError } = await supabase.from("key_tests").delete().eq("id", id);
    if (deleteError) {
      // The reason is returned rather than discarded, so the page can tell the
      // user what actually went wrong instead of a generic failure.
      return { ok: false, message: deleteError.message };
    }
    setTests((previous) => previous.filter((test) => test.id !== id));
    return { ok: true };
  }, []);

  return {
    tests,
    loading,
    error,
    refresh: fetchTests,
    deleteTest,
    filterProvider,
    setFilterProvider,
    filterStatus,
    setFilterStatus,
  };
}
