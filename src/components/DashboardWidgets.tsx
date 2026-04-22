import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import {
  Activity,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import { format, subDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type KeyTest = {
  id: string;
  provider: string;
  status: string;
  health_score: number | null;
  latency_ms: number | null;
  tested_at: string;
  nickname: string | null;
  key_preview: string;
};

function SparkLine({
  data,
  color,
  height = 28,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  sparkData,
  sparkColor,
  className,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; up: boolean };
  sparkData?: number[];
  sparkColor?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-2 card-hover-lift shadow-sm dark:shadow-xl dark:shadow-black/20",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-sans text-xs text-slate-500 dark:text-slate-400">
            {label}
          </span>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 font-mono text-xs font-medium",
              trend.up
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400",
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
        {subValue && (
          <p className="font-sans text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {subValue}
          </p>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <SparkLine data={sparkData} color={sparkColor || "#3B82F6"} />
      )}
    </div>
  );
}

function LatencyTrendChart({ tests }: { tests: KeyTest[] }) {
  const data = useMemo(() => {
    const days: Record<string, number[]> = {};
    for (let i = 13; i >= 0; i--) {
      days[format(subDays(new Date(), i), "MMM d")] = [];
    }
    tests.forEach((t) => {
      if (t.latency_ms !== null) {
        const d = format(new Date(t.tested_at), "MMM d");
        if (days[d]) days[d].push(t.latency_ms);
      }
    });
    return Object.entries(days).map(([name, vals]) => ({
      name,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : null,
    }));
  }, [tests]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm dark:shadow-xl dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          Latency Trend (14 days)
        </h3>
        <span className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40 border border-slate-200 dark:border-blue-500/20 rounded px-2 py-0.5">
          ms
        </span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <defs>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "JetBrains Mono",
            }}
            formatter={(v: number) => [`${v}ms`, "Avg Latency"]}
          />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#latencyGrad)"
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProviderUptime({ tests }: { tests: KeyTest[] }) {
  const providers = useMemo(() => {
    const map: Record<
      string,
      { total: number; valid: number; lastTest?: KeyTest }
    > = {};
    tests.forEach((t) => {
      if (!map[t.provider]) map[t.provider] = { total: 0, valid: 0 };
      map[t.provider].total++;
      if (t.status === "valid") map[t.provider].valid++;
      if (
        !map[t.provider].lastTest ||
        new Date(t.tested_at) > new Date(map[t.provider].lastTest!.tested_at)
      ) {
        map[t.provider].lastTest = t;
      }
    });
    return Object.entries(map)
      .map(([id, { total, valid, lastTest }]) => ({
        id,
        name: PROVIDERS.find((p) => p.id === id)?.name || id,
        uptime: Math.round((valid / total) * 100),
        total,
        lastStatus: lastTest?.status || "unknown",
        lastHealth: lastTest?.health_score,
        daysSince: lastTest
          ? differenceInDays(new Date(), new Date(lastTest.tested_at))
          : null,
      }))
      .sort((a, b) => b.total - a.total);
  }, [tests]);

  if (!providers.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm dark:shadow-xl dark:shadow-black/20">
      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        Provider Uptime
      </h3>
      <div className="space-y-3">
        {providers.slice(0, 6).map((p) => (
          <div key={p.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                  {p.name}
                </span>
                {p.lastStatus === "valid" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono font-bold",
                    p.uptime >= 90
                      ? "text-green-600 dark:text-green-400"
                      : p.uptime >= 60
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-red-500 dark:text-red-400",
                  )}
                >
                  {p.uptime}%
                </span>
                <span className="font-mono text-slate-400 dark:text-slate-600">
                  ({p.total})
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-blue-500/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  p.uptime >= 90
                    ? "bg-green-500 dark:bg-green-400"
                    : p.uptime >= 60
                      ? "bg-amber-400"
                      : "bg-red-500 dark:bg-red-400",
                )}
                style={{ width: `${p.uptime}%` }}
              />
            </div>
            {p.daysSince !== null && p.daysSince > 7 && (
              <p className="font-mono text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />
                Last tested {p.daysSince}d ago
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ tests }: { tests: KeyTest[] }) {
  const recent = tests.slice(0, 5);
  if (!recent.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm dark:shadow-xl dark:shadow-black/20">
      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        Recent Activity
      </h3>
      <div className="space-y-2">
        {recent.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-blue-500/10 last:border-0"
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                t.status === "valid"
                  ? "bg-green-500 dark:bg-green-400"
                  : t.status === "limited"
                    ? "bg-amber-400"
                    : "bg-red-500 dark:bg-red-400",
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {PROVIDERS.find((p) => p.id === t.provider)?.name || t.provider}
                {t.nickname && (
                  <span className="text-slate-400 dark:text-slate-500">
                    {" "}
                    · {t.nickname}
                  </span>
                )}
              </p>
              <p className="font-mono text-[10px] text-slate-400 dark:text-slate-600">
                {format(new Date(t.tested_at), "MMM d, h:mm a")}
                {t.latency_ms !== null && <span> · {t.latency_ms}ms</span>}
              </p>
            </div>
            {t.health_score !== null && (
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  t.health_score >= 80
                    ? "text-green-600 dark:text-green-400"
                    : t.health_score >= 50
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-red-500 dark:text-red-400",
                )}
              >
                {t.health_score}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardWidgets({
  refreshKey,
}: {
  refreshKey?: number;
}) {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("key_tests")
      .select(
        "id, provider, status, health_score, latency_ms, tested_at, nickname, key_preview",
      )
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setTests((data as KeyTest[]) || []);
        setLoading(false);
      });
  }, [user, refreshKey]);

  const stats = useMemo(() => {
    if (!tests.length) return null;

    const now = new Date();
    const last30 = tests.filter(
      (t) => new Date(t.tested_at) > subDays(now, 30),
    );
    const prev30 = tests.filter((t) => {
      const d = new Date(t.tested_at);
      return d > subDays(now, 60) && d <= subDays(now, 30);
    });

    const totalTests = tests.length;
    const monthlyTests = last30.length;
    const prevMonthlyTests = prev30.length;
    const testsTrend =
      prevMonthlyTests > 0
        ? Math.round(
            ((monthlyTests - prevMonthlyTests) / prevMonthlyTests) * 100,
          )
        : 0;

    const validTests = tests.filter((t) => t.status === "valid").length;
    const overallUptime = Math.round((validTests / totalTests) * 100);

    const avgLatency = tests.filter((t) => t.latency_ms !== null);
    const avgMs = avgLatency.length
      ? Math.round(
          avgLatency.reduce((s, t) => s + (t.latency_ms || 0), 0) /
            avgLatency.length,
        )
      : 0;

    const avgHealth = tests.filter((t) => t.health_score !== null);
    const healthAvg = avgHealth.length
      ? Math.round(
          avgHealth.reduce((s, t) => s + (t.health_score || 0), 0) /
            avgHealth.length,
        )
      : 0;

    // Sparkline data (last 14 days tests per day)
    const dailyCounts: number[] = [];
    const dailyLatency: number[] = [];
    const dailyHealth: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      const dayTests = tests.filter(
        (t) => format(new Date(t.tested_at), "yyyy-MM-dd") === d,
      );
      dailyCounts.push(dayTests.length);
      const lat = dayTests.filter((t) => t.latency_ms !== null);
      dailyLatency.push(
        lat.length
          ? Math.round(
              lat.reduce((s, t) => s + (t.latency_ms || 0), 0) / lat.length,
            )
          : 0,
      );
      const hl = dayTests.filter((t) => t.health_score !== null);
      dailyHealth.push(
        hl.length
          ? Math.round(
              hl.reduce((s, t) => s + (t.health_score || 0), 0) / hl.length,
            )
          : 0,
      );
    }

    return {
      totalTests,
      monthlyTests,
      testsTrend,
      overallUptime,
      avgMs,
      healthAvg,
      dailyCounts,
      dailyLatency,
      dailyHealth,
    };
  }, [tests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-slate-100 dark:bg-blue-500/5 animate-pulse"
            />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-52 rounded-2xl bg-slate-100 dark:bg-blue-500/5 animate-pulse" />
          <div className="h-52 rounded-2xl bg-slate-100 dark:bg-blue-500/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!tests.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center space-y-3 shadow-sm dark:shadow-xl dark:shadow-black/20">
        <Zap className="h-8 w-8 text-blue-400 mx-auto" />
        <p className="font-sans text-sm text-slate-500 dark:text-slate-400">
          No test data yet. Start testing keys to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="Total Tests"
          value={stats!.totalTests.toString()}
          subValue={`${stats!.monthlyTests} this month`}
          trend={
            stats!.testsTrend !== 0
              ? { value: stats!.testsTrend, up: stats!.testsTrend > 0 }
              : undefined
          }
          sparkData={stats!.dailyCounts}
          sparkColor="#3B82F6"
        />
        <StatCard
          icon={Shield}
          label="Uptime Rate"
          value={`${stats!.overallUptime}%`}
          subValue="Valid / Total tests"
          sparkData={stats!.dailyHealth}
          sparkColor={stats!.overallUptime >= 90 ? "#3B82F6" : "#F59E0B"}
        />
        <StatCard
          icon={Clock}
          label="Avg Latency"
          value={`${stats!.avgMs}ms`}
          subValue="Across all providers"
          sparkData={stats!.dailyLatency}
          sparkColor="#3B9EF5"
        />
        <StatCard
          icon={TrendingUp}
          label="Health Score"
          value={`${stats!.healthAvg}/100`}
          subValue="Average across keys"
          sparkData={stats!.dailyHealth}
          sparkColor={
            stats!.healthAvg >= 80
              ? "#3B82F6"
              : stats!.healthAvg >= 50
                ? "#F59E0B"
                : "#EF4444"
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-3">
        <LatencyTrendChart tests={tests} />
        <ProviderUptime tests={tests} />
      </div>

      {/* Recent Activity */}
      <RecentActivity tests={tests} />
    </div>
  );
}
