import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import { differenceInDays, format, subDays } from "date-fns";
import { onDataChanged } from "@/lib/data-events";
import { KEY_TEST_FIELDS, createRequestGuard, normalizeKeyTests } from "./rows";
import type { KeyTest } from "./rows";

export type { KeyTest, RateLimitInfo } from "./rows";

export type AnalyticsResult = {
  totalTests: number;
  monthlyTests: number;
  testsTrend: number;
  overallUptime: number;
  validTests: number;
  limitedTests: number;
  invalidTests: number;
  avgMs: number;
  healthAvg: number;
  topProvider: [string, number] | undefined;
  latencyData: { name: string; avg: number; tests: number }[];
  lineData: { name: string; count: number; valid: number; invalid: number }[];
  latencyTrendData: { name: string; avg: number | null }[];
  pieData: { name: string; value: number }[];
  healthDist: { range: string; count: number; color: string }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  providerUptime: { name: string; uptime: number; total: number }[];
  staleProviders: { name: string; uptime: number; total: number }[];
};

const CHART_COLORS = {
  blue: "#3B82F6",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  slate: "#94A3B8",
};

const SELECT_FIELDS = KEY_TEST_FIELDS;

export function useKeyTests(options?: { limit?: number }) {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(createRequestGuard());
  const mounted = useRef(true);
  const limit = options?.limit;

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
    let query = supabase
      .from("key_tests")
      .select(KEY_TEST_FIELDS)
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error: queryError } = await query;

    // Discard a result that a newer request has already superseded, and never
    // write state after unmount.
    if (!isCurrent() || !mounted.current) return;

    if (queryError) {
      setError(queryError.message);
      setTests([]);
    } else {
      setTests(normalizeKeyTests(data));
    }
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    void fetchTests();
  }, [fetchTests]);

  // Keeps the dashboard and analytics figures in step when a result is saved
  // or deleted somewhere else.
  useEffect(
    () => onDataChanged(["key_tests"], () => void fetchTests()),
    [fetchTests],
  );

  const refresh = useCallback(() => fetchTests(), [fetchTests]);

  return { tests, loading, error, refresh };
}

export function useAnalytics(): { analytics: AnalyticsResult | null; loading: boolean; error: string | null; refresh: () => void } {
  const { tests, loading, error, refresh } = useKeyTests({ limit: 500 });

  const analytics = useMemo((): AnalyticsResult | null => {
    if (!tests.length) return null;

    const now = new Date();
    const last30 = tests.filter((test) => new Date(test.tested_at) > subDays(now, 30));
    const prev30 = tests.filter((test) => {
      const date = new Date(test.tested_at);
      return date > subDays(now, 60) && date <= subDays(now, 30);
    });

    const totalTests = tests.length;
    const monthlyTests = last30.length;
    const prevMonthlyTests = prev30.length;
    const testsTrend = prevMonthlyTests > 0
      ? Math.round(((monthlyTests - prevMonthlyTests) / prevMonthlyTests) * 100)
      : monthlyTests > 0 ? 100 : 0;

    const validTests = tests.filter((test) => test.status === "valid").length;
    const limitedTests = tests.filter((test) => test.status === "limited").length;
    const invalidTests = tests.filter((test) => test.status === "invalid").length;
    const overallUptime = Math.round((validTests / totalTests) * 100);

    const latencyTests = tests.filter((test) => test.latency_ms !== null);
    const avgMs = latencyTests.length
      ? Math.round(latencyTests.reduce((sum, test) => sum + (test.latency_ms ?? 0), 0) / latencyTests.length)
      : 0;

    const healthTests = tests.filter((test) => test.health_score !== null);
    const healthAvg = healthTests.length
      ? Math.round(healthTests.reduce((sum, test) => sum + (test.health_score ?? 0), 0) / healthTests.length)
      : 0;

    const providerCounts: Record<string, number> = {};
    tests.forEach((test) => {
      providerCounts[test.provider] = (providerCounts[test.provider] ?? 0) + 1;
    });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

    const providerLatency: Record<string, number[]> = {};
    tests.forEach((test) => {
      if (test.latency_ms !== null) {
        const bucket = providerLatency[test.provider] ?? [];
        bucket.push(test.latency_ms);
        providerLatency[test.provider] = bucket;
      }
    });
    const latencyData = Object.entries(providerLatency)
      .map(([provider, values]) => ({
        name: PROVIDERS.find((item) => item.id === provider)?.name ?? provider,
        avg: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
        tests: values.length,
      }))
      .sort((a, b) => a.avg - b.avg);

    const dayKeys = Array.from({ length: 30 }, (_, index) => {
      const date = subDays(now, 29 - index);
      return { key: format(date, "yyyy-MM-dd"), label: format(date, "MMM d") };
    });
    const dailyTests = new Map<string, { count: number; valid: number; invalid: number }>();
    dayKeys.forEach(({ key }) => dailyTests.set(key, { count: 0, valid: 0, invalid: 0 }));
    tests.forEach((test) => {
      const key = format(new Date(test.tested_at), "yyyy-MM-dd");
      const bucket = dailyTests.get(key);
      if (!bucket) return;
      bucket.count += 1;
      if (test.status === "valid") bucket.valid += 1;
      if (test.status === "invalid") bucket.invalid += 1;
    });
    const lineData = dayKeys.map(({ key, label }) => {
      const bucket = dailyTests.get(key) ?? { count: 0, valid: 0, invalid: 0 };
      return { name: label, ...bucket };
    });

    const dailyLatency = new Map<string, number[]>();
    dayKeys.forEach(({ key }) => dailyLatency.set(key, []));
    tests.forEach((test) => {
      if (test.latency_ms === null) return;
      const key = format(new Date(test.tested_at), "yyyy-MM-dd");
      dailyLatency.get(key)?.push(test.latency_ms);
    });
    const latencyTrendData = dayKeys.map(({ key, label }) => {
      const values = dailyLatency.get(key) ?? [];
      return { name: label, avg: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null };
    });

    const pieData = Object.entries(providerCounts).map(([id, value]) => ({
      name: PROVIDERS.find((provider) => provider.id === id)?.name ?? id,
      value,
    }));

    const healthDist = [
      { range: "80-100", count: tests.filter((test) => (test.health_score ?? 0) >= 80).length, color: CHART_COLORS.green },
      { range: "50-79", count: tests.filter((test) => (test.health_score ?? 0) >= 50 && (test.health_score ?? 0) < 80).length, color: CHART_COLORS.amber },
      { range: "0-49", count: tests.filter((test) => test.health_score !== null && (test.health_score ?? 0) < 50).length, color: CHART_COLORS.red },
    ];

    const statusBreakdown = [
      { name: "Valid", value: validTests, color: CHART_COLORS.green },
      { name: "Limited", value: limitedTests, color: CHART_COLORS.amber },
      { name: "Invalid", value: invalidTests, color: CHART_COLORS.red },
    ];

    const providerTotals = new Map<string, { total: number; valid: number }>();
    tests.forEach((test) => {
      const current = providerTotals.get(test.provider) ?? { total: 0, valid: 0 };
      current.total += 1;
      if (test.status === "valid") current.valid += 1;
      providerTotals.set(test.provider, current);
    });
    const providerUptime = Array.from(providerTotals.entries())
      .map(([id, value]) => ({
        name: PROVIDERS.find((provider) => provider.id === id)?.name ?? id,
        uptime: Math.round((value.valid / value.total) * 100),
        total: value.total,
      }))
      .sort((a, b) => b.total - a.total);

    const latestByProvider = new Map<string, string>();
    tests.forEach((test) => {
      const current = latestByProvider.get(test.provider);
      if (!current || new Date(test.tested_at) > new Date(current)) latestByProvider.set(test.provider, test.tested_at);
    });

    // Built from the provider id directly. It previously recovered the id by
    // matching the already display-named entry back through PROVIDERS, which
    // was a lossy inverse of the mapping above, silently ambiguous if two
    // providers ever shared a display name, and quadratic in the provider count.
    const staleProviders = Array.from(latestByProvider.entries())
      .map(([id, latest]) => ({
        id,
        name: PROVIDERS.find((provider) => provider.id === id)?.name ?? id,
        daysSinceLastTest: differenceInDays(now, new Date(latest)),
      }))
      .filter((entry) => entry.daysSinceLastTest > 7)
      .map((entry) => {
        const totals = providerTotals.get(entry.id);
        return {
          name: entry.name,
          uptime: totals ? Math.round((totals.valid / totals.total) * 100) : 0,
          total: totals?.total ?? 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      totalTests,
      monthlyTests,
      testsTrend,
      overallUptime,
      validTests,
      limitedTests,
      invalidTests,
      avgMs,
      healthAvg,
      topProvider,
      latencyData,
      lineData,
      latencyTrendData,
      pieData,
      healthDist,
      statusBreakdown,
      providerUptime,
      staleProviders,
    };
  }, [tests]);

  return { analytics, loading, error, refresh };
}
