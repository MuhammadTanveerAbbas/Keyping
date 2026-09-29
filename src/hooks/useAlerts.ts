import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { onDataChanged } from "@/lib/data-events";
import { createRequestGuard } from "./rows";

export type ExpiryAlert = {
  id: string;
  key_nickname: string;
  expiry_date: string;
  reminder_days: number;
  notified: boolean;
  created_at: string;
};

function normalizeAlerts(rows: unknown): ExpiryAlert[] {
  if (!Array.isArray(rows)) return [];
  const normalized: ExpiryAlert[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.length === 0) continue;
    normalized.push({
      id: item.id,
      key_nickname: typeof item.key_nickname === "string" ? item.key_nickname : "",
      expiry_date: typeof item.expiry_date === "string" ? item.expiry_date : new Date().toISOString(),
      reminder_days: typeof item.reminder_days === "number" && Number.isFinite(item.reminder_days)
        ? item.reminder_days
        : 7,
      notified: item.notified === true,
      created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
    });
  }
  return normalized;
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(createRequestGuard());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const isCurrent = guard.current.begin();

    if (!user) {
      if (!isCurrent()) return;
      setAlerts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("alerts")
      .select("id, key_nickname, expiry_date, reminder_days, notified, created_at")
      .eq("user_id", user.id)
      .order("expiry_date", { ascending: true });

    // A newer refresh superseded this one, or the component is gone.
    if (!isCurrent() || !mounted.current) return;

    if (queryError) {
      setError(queryError.message);
      setAlerts([]);
    } else {
      setAlerts(normalizeAlerts(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refetches when an alert is added or removed on another page, such as the
  // dashboard overview preview.
  useEffect(
    () => onDataChanged(["alerts"], () => void refresh()),
    [refresh],
  );

  const removeAlert = useCallback(async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const { error: deleteError } = await supabase.from("alerts").delete().eq("id", id);
    if (deleteError) {
      return { ok: false, message: deleteError.message };
    }
    setAlerts((previous) => previous.filter((alert) => alert.id !== id));
    return { ok: true };
  }, []);

  return { alerts, loading, error, refresh, removeAlert };
}
