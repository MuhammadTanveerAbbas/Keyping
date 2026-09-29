import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createRequestGuard } from "./rows";

export type UserPreferences = {
  email_notifications: boolean;
  expiry_alerts: boolean;
  weekly_digest: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  email_notifications: true,
  expiry_alerts: true,
  weekly_digest: false,
};

function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_PREFERENCES;
  const record = value as Record<string, unknown>;
  return {
    email_notifications: typeof record.email_notifications === "boolean" ? record.email_notifications : DEFAULT_PREFERENCES.email_notifications,
    expiry_alerts: typeof record.expiry_alerts === "boolean" ? record.expiry_alerts : DEFAULT_PREFERENCES.expiry_alerts,
    weekly_digest: typeof record.weekly_digest === "boolean" ? record.weekly_digest : DEFAULT_PREFERENCES.weekly_digest,
  };
}

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
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
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("notification_preferences")
      .select("email_notifications, expiry_alerts, weekly_digest")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isCurrent() || !mounted.current) return;

    if (queryError) {
      setError(queryError.message);
      setPreferences(DEFAULT_PREFERENCES);
    } else {
      setPreferences(normalizePreferences(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const savePreferences = useCallback(
    async (updates: Partial<UserPreferences>): Promise<{ ok: boolean; error: string | null }> => {
      if (!user) return { ok: false, error: "Sign in to save preferences" };
      const previous = preferences;
      const next = { ...previous, ...updates };
      // Applied optimistically so the switch responds immediately.
      setPreferences(next);
      setError(null);

      const { error: saveError } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            email_notifications: next.email_notifications,
            expiry_alerts: next.expiry_alerts,
            weekly_digest: next.weekly_digest,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (saveError) {
        // Restores the previous values. Without this the switch stayed
        // visually flipped while the database kept the old value, so the
        // interface claimed a preference that was never saved.
        setPreferences(previous);
        setError(saveError.message);
        return { ok: false, error: saveError.message };
      }
      return { ok: true, error: null };
    },
    [preferences, user],
  );

  return { preferences, loading, error, refresh, savePreferences };
}
