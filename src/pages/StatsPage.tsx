import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import { BarChart3, Zap, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays } from "date-fns";

type KeyTest = {
  id: string;
  provider: string;
  status: string;
  health_score: number | null;
  latency_ms: number | null;
  tested_at: string;
};

const CHART_COLORS = {
  cyan: "#3B82F6",
  amber: "#F59E0B",
  red: "#EF4444",
  muted: "#555555",
};

const PIE_COLORS = [
  "#3B82F6", "#1D4ED8", "#F59E0B",
  "#EF4444", "#3B9EF5", "#A855F7",
  "#EC4899", "#EAB308", "#14B8A6", "#84CC16",
];

const StatsPage = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("key_tests").select("id, provider, status, health_score, latency_ms, tested_at")
      .order("tested_at", { ascending: false })
      .then(({ data }) => {
        setTests((data as KeyTest[]) || []);
        setLoading(false);
      });
  }, [user]);

  const totalTests = tests.length;
  const thisMonth = tests.filter(t => new Date(t.tested_at) > subDays(new Date(), 30)).length;
  const avgHealth = tests.filter(t => t.health_score !== null).length > 0
    ? Math.round(tests.filter(t => t.health_score !== null).reduce((s, t) => s + (t.health_score || 0), 0) / tests.filter(t => t.health_score !== null).length)
    : 0;

  const providerCounts: Record<string, number> = {};
  tests.forEach(t => { providerCounts[t.provider] = (providerCounts[t.provider] || 0) + 1; });
  const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

  const providerLatency: Record<string, number[]> = {};
  tests.forEach(t => {
    if (t.latency_ms !== null) {
      providerLatency[t.provider] = providerLatency[t.provider] || [];
      providerLatency[t.provider].push(t.latency_ms);
    }
  });
  const latencyData = Object.entries(providerLatency).map(([p, vals]) => ({
    name: PROVIDERS.find(pr => pr.id === p)?.name || p,
    avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
  })).sort((a, b) => a.avg - b.avg);

  const dailyTests: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM d");
    dailyTests[d] = 0;
  }
  tests.forEach(t => {
    const d = format(new Date(t.tested_at), "MMM d");
    if (dailyTests[d] !== undefined) dailyTests[d]++;
  });
  const lineData = Object.entries(dailyTests).map(([name, count]) => ({ name, count }));

  const pieData = Object.entries(providerCounts).map(([id, value]) => ({
    name: PROVIDERS.find(p => p.id === id)?.name || id,
    value,
  }));

  const healthDist = [
    { range: "80-100", count: tests.filter(t => (t.health_score ?? 0) >= 80).length },
    { range: "50-79", count: tests.filter(t => (t.health_score ?? 0) >= 50 && (t.health_score ?? 0) < 80).length },
    { range: "0-49", count: tests.filter(t => (t.health_score ?? 0) < 50 && t.health_score !== null).length },
  ];

  const statCards = [
    { icon: BarChart3, label: "Total Tests", value: totalTests.toString() },
    { icon: TrendingUp, label: "This Month", value: thisMonth.toString() },
    { icon: Zap, label: "Top Provider", value: topProvider ? (PROVIDERS.find(p => p.id === topProvider[0])?.name || topProvider[0]) : "" },
    { icon: Clock, label: "Avg Health", value: avgHealth ? `${avgHealth}/100` : "" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-center gap-3 card-hover-lift shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.05)]">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-8 text-center font-sans text-sm text-slate-500 dark:text-slate-400">Loading stats...</div>
        ) : tests.length === 0 ? (
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-8 text-center font-sans text-sm text-slate-500 dark:text-slate-400">
            No test data yet. Start testing keys to see your stats.
          </div>
        ) : (
          <>
            {/* Tests per day */}
            <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">Tests per Day (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:[stroke:#1A1A2E]" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">Provider Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">Health Score Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={healthDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      <Cell fill={CHART_COLORS.cyan} />
                      <Cell fill={CHART_COLORS.amber} />
                      <Cell fill={CHART_COLORS.red} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {latencyData.length > 0 && (
              <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">Average Latency by Provider</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={latencyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" unit="ms" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }} stroke="#E2E8F0" width={80} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "JetBrains Mono" }} formatter={(v: number) => `${v}ms`} />
                    <Bar dataKey="avg" fill={CHART_COLORS.cyan} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;
