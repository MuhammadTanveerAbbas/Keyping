import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import { format, subDays, differenceInDays } from "date-fns";

export type RateLimitInfo = {
  remaining?: number;
  resetAt?: string;
};

export type KeyTest = {
  id: string;
  provider: string;
  key_preview: string;
  nickname: string | null;
  notes: string | null;
  status: string;
  scopes: unknown[] | null;
  rate_limit_info: RateLimitInfo | null;
  tested_at: string;
  health_score: number | null;
  latency_ms: number | null;
};

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
  dailyCounts: number[];
  dailyLatency: number[];
  dailyHealth: number[];
};

const CHART_COLORS = {
  blue: "#3B82F6",
  blueLight: "#93C5FD",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  slate: "#94A3B8",
};

export function useKeyTests(options?: { limit?: number }) {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("key_tests")
      .select("id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms")
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (!error && data) setTests(data as KeyTest[]);
    setLoading(false);
  }, [user, options?.limit]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const refresh = useCallback(() => fetchTests(), [fetchTests]);

  return { tests, loading, refresh };
}

export function useAnalytics(): { analytics: AnalyticsResult | null; loading: boolean; refresh: () => void } {
  const { tests, loading, refresh } = useKeyTests({ limit: 500 });

  const analytics = useMemo((): AnalyticsResult | null => {
    if (!tests.length) return null;

    const now = new Date();
    const last30 = tests.filter((t) => new Date(t.tested_at) > subDays(now, 30));
    const prev30 = tests.filter((t) => {
      const d = new Date(t.tested_at);
      return d > subDays(now, 60) && d <= subDays(now, 30);
    });

    const totalTests = tests.length;
    const monthlyTests = last30.length;
    const prevMonthlyTests = prev30.length;
    const testsTrend = prevMonthlyTests > 0
      ? Math.round(((monthlyTests - prevMonthlyTests) / prevMonthlyTests) * 100)
      : monthlyTests > 0 ? 100 : 0;

    const validTests = tests.filter((t) => t.status === "valid").length;
    const limitedTests = tests.filter((t) => t.status === "limited").length;
    const invalidTests = tests.filter((t) => t.status === "invalid").length;
    const overallUptime = Math.round((validTests / totalTests) * 100);

    const avgLatency = tests.filter((t) => t.latency_ms !== null);
    const avgMs = avgLatency.length
      ? Math.round(avgLatency.reduce((s, t) => s + (t.latency_ms || 0), 0) / avgLatency.length)
      : 0;

    const avgHealth = tests.filter((t) => t.health_score !== null);
    const healthAvg = avgHealth.length
      ? Math.round(avgHealth.reduce((s, t) => s + (t.health_score || 0), 0) / avgHealth.length)
      : 0;

    const providerCounts: Record<string, number> = {};
    tests.forEach((t) => {
      providerCounts[t.provider] = (providerCounts[t.provider] || 0) + 1;
    });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

    const providerLatency: Record<string, number[]> = {};
    tests.forEach((t) => {
      if (t.latency_ms !== null) {
        const bucket = providerLatency[t.provider] ?? [];
        bucket.push(t.latency_ms);
        providerLatency[t.provider] = bucket;
      }
    });
    const latencyData = Object.entries(providerLatency)
      .map(([p, vals]) => ({
        name: PROVIDERS.find((pr) => pr.id === p)?.name || p,
        avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        tests: vals.length,
      }))
      .sort((a, b) => a.avg - b.avg);

    const dailyTests: Record<string, { count: number; valid: number; invalid: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      dailyTests[d] = { count: 0, valid: 0, invalid: 0 };
    }
    tests.forEach((t) => {
      const d = format(new Date(t.tested_at), "MMM d");
      if (dailyTests[d] !== undefined) {
        dailyTests[d].count++;
        if (t.status === "valid") dailyTests[d].valid++;
        if (t.status === "invalid") dailyTests[d].invalid++;
      }
    });
    const lineData = Object.entries(dailyTests).map(([name, data]) => ({
      name,
      count: data.count,
      valid: data.valid,
      invalid: data.invalid,
    }));

    const dailyLatency: Record<string, number[]> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      dailyLatency[d] = [];
    }
    tests.forEach((t) => {
      if (t.latency_ms !== null) {
        const d = format(new Date(t.tested_at), "MMM d");
        if (dailyLatency[d] !== undefined) dailyLatency[d].push(t.latency_ms);
      }
    });
    const latencyTrendData = Object.entries(dailyLatency).map(([name, vals]) => ({
      name,
      avg: vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null,
    }));

    const pieData = Object.entries(providerCounts).map(([id, value]) => ({
      name: PROVIDERS.find((p) => p.id === id)?.name || id,
      value,
    }));

    const healthDist = [
      { range: "80-100", count: tests.filter((t) => (t.health_score ?? 0) >= 80).length, color: CHART_COLORS.green },
      { range: "50-79", count: tests.filter((t) => (t.health_score ?? 0) >= 50 && (t.health_score ?? 0) < 80).length, color: CHART_COLORS.amber },
      { range: "0-49", count: tests.filter((t) => (t.health_score ?? 0) < 50 && t.health_score !== null).length, color: CHART_COLORS.red },
    ];

    const statusBreakdown = [
      { name: "Valid", value: validTests, color: CHART_COLORS.green },
      { name: "Limited", value: limitedTests, color: CHART_COLORS.amber },
      { name: "Invalid", value: invalidTests, color: CHART_COLORS.red },
    ];

    const providerUptime = Object.entries(
      tests.reduce<Record<string, { total: number; valid: number }>>((acc, t) => {
        if (!acc[t.provider]) acc[t.provider] = { total: 0, valid: 0 };
        const existing = acc[t.provider] || { total: 0, valid: 0 };
        existing.total++;
        if (t.status === "valid") existing.valid++;
        acc[t.provider] = existing;
        return acc;
      }, {})
    )
      .map(([id, { total, valid }]) => ({
        name: PROVIDERS.find((p) => p.id === id)?.name || id,
        uptime: Math.round((valid / total) * 100),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const staleThreshold = 7;
    const staleProviders = providerUptime.filter((p) => {
      const providerTests = tests.filter((t) => PROVIDERS.find((pr) => pr.id === t.provider)?.name === p.name || t.provider === p.name);
      if (!providerTests.length) return false;
      const firstTest = providerTests[0];
      if (!firstTest?.tested_at) return false;
      const lastTest = new Date(firstTest.tested_at);
      return differenceInDays(now, lastTest) > staleThreshold;
    });

    const dailyCounts: number[] = [];
    const dailyLatencyArr: number[] = [];
    const dailyHealthArr: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      const dayTests = tests.filter((t) => format(new Date(t.tested_at), "yyyy-MM-dd") === d);
      dailyCounts.push(dayTests.length);
      const lat = dayTests.filter((t) => t.latency_ms !== null);
      dailyLatencyArr.push(
        lat.length ? Math.round(lat.reduce((s, t) => s + (t.latency_ms || 0), 0) / lat.length) : 0
      );
      const hl = dayTests.filter((t) => t.health_score !== null);
      dailyHealthArr.push(
        hl.length ? Math.round(hl.reduce((s, t) => s + (t.health_score || 0), 0) / hl.length) : 0
      );
    }

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
      dailyCounts,
      dailyLatency: dailyLatencyArr,
      dailyHealth: dailyHealthArr,
    };
  }, [tests]);

  return { analytics, loading, refresh };
}
