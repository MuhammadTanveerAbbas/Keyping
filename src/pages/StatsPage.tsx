import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import { toast } from "sonner";
import {
 PageHeader,
 PageShell,
 Panel,
 Stat,
 StatGrid,
 EmptyState,
 SkeletonBlock,
} from "@/components/dashboard/ui";
import { BarChart3, Zap, TrendingUp, Activity, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 LineChart,
 Line,
 AreaChart,
 Area,
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
};

const CHART_COLORS = {
 blue: "#3B82F6",
 blueLight: "#93C5FD",
 amber: "#F59E0B",
 red: "#EF4444",
 green: "#10B981",
 slate: "#94A3B8",
};

const PIE_COLORS = [
 "#3B82F6",
 "#1D4ED8",
 "#F59E0B",
 "#EF4444",
 "#3B9EF5",
 "#A855F7",
 "#EC4899",
 "#EAB308",
 "#14B8A6",
 "#84CC16",
];

const StatsPage = () => {
 const { user } = useAuth();
 const [tests, setTests] = useState<KeyTest[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!user) return;
  supabase
   .from("key_tests")
   .select("id, provider, status, health_score, latency_ms, tested_at")
   .eq("user_id", user.id)
   .order("tested_at", { ascending: false })
   .limit(500)
   .then(({ data, error }) => {
    if (error) toast.error("Failed to load stats: " + error.message);
    else setTests((data as KeyTest[]) || []);
    setLoading(false);
   });
 }, [user]);

 const stats = useMemo(() => {
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

  // Provider stats
  const providerCounts: Record<string, number> = {};
  tests.forEach((t) => {
   providerCounts[t.provider] = (providerCounts[t.provider] || 0) + 1;
  });
  const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

  // Latency by provider
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

  // Daily tests (30 days)
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

  // Daily latency trend
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

  // Pie data
  const pieData = Object.entries(providerCounts).map(([id, value]) => ({
   name: PROVIDERS.find((p) => p.id === id)?.name || id,
   value,
  }));

  // Health distribution
  const healthDist = [
   { range: "80-100", count: tests.filter((t) => (t.health_score ?? 0) >= 80).length, color: CHART_COLORS.green },
   { range: "50-79", count: tests.filter((t) => (t.health_score ?? 0) >= 50 && (t.health_score ?? 0) < 80).length, color: CHART_COLORS.amber },
   { range: "0-49", count: tests.filter((t) => (t.health_score ?? 0) < 50 && t.health_score !== null).length, color: CHART_COLORS.red },
  ];

  // Status breakdown
  const statusBreakdown = [
   { name: "Valid", value: validTests, color: CHART_COLORS.green },
   { name: "Limited", value: limitedTests, color: CHART_COLORS.amber },
   { name: "Invalid", value: invalidTests, color: CHART_COLORS.red },
  ];

  // Provider uptime
  const providerUptime = Object.entries(
   tests.reduce<Record<string, { total: number; valid: number }>>((acc, t) => {
    if (!acc[t.provider]) acc[t.provider] = { total: 0, valid: 0 };
    acc[t.provider].total++;
    if (t.status === "valid") acc[t.provider].valid++;
    return acc;
   }, {})
  )
   .map(([id, { total, valid }]) => ({
    name: PROVIDERS.find((p) => p.id === id)?.name || id,
    uptime: Math.round((valid / total) * 100),
    total,
   }))
   .sort((a, b) => b.total - a.total);

  // Recent stale keys
  const staleThreshold = 7;
  const staleProviders = providerUptime.filter((p) => {
   const providerTests = tests.filter((t) => PROVIDERS.find((pr) => pr.id === t.provider)?.name === p.name || t.provider === p.name);
   if (!providerTests.length) return false;
   const lastTest = new Date(providerTests[0].tested_at);
   return differenceInDays(now, lastTest) > staleThreshold;
  });

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

 const statCards = stats ? [
  { icon: BarChart3, label: "Total Tests", value: stats.totalTests.toString(), tone: "default" as const },
  { icon: TrendingUp, label: "This Month", value: stats.monthlyTests.toString(), subValue: stats.testsTrend !== 0 ? `${stats.testsTrend > 0 ? "+" : ""}${stats.testsTrend}% vs last month` : undefined, tone: "default" as const },
  { icon: Activity, label: "Uptime Rate", value: `${stats.overallUptime}%`, subValue: `${stats.validTests} valid of ${stats.totalTests}`, tone: stats.overallUptime >= 90 ? "success" as const : stats.overallUptime >= 60 ? "warning" as const : "danger" as const },
  { icon: Zap, label: "Avg Health", value: `${stats.healthAvg}/100`, subValue: `Avg latency: ${stats.avgMs}ms`, tone: stats.healthAvg >= 80 ? "success" as const : stats.healthAvg >= 50 ? "warning" as const : "danger" as const },
 ] : [];

 return (
  <DashboardLayout>
   <PageShell>
    <PageHeader
     title="Analytics & Stats"
     description="Comprehensive breakdowns of your API key validation history."
    />

    {loading ? (
     <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
       {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-28" />
       ))}
      </div>
      <SkeletonBlock className="h-72" />
      <div className="grid gap-4 md:grid-cols-2">
       <SkeletonBlock className="h-64" />
       <SkeletonBlock className="h-64" />
      </div>
     </div>
    ) : !stats ? (
     <Panel>
      <EmptyState
       icon={BarChart3}
       title="No analytics yet"
       description="Run your first key test to populate charts and summaries."
      />
     </Panel>
    ) : (
     <>
      {/* Stat Cards */}
      <StatGrid>
       {statCards.map(({ icon: Icon, label, value, subValue, tone }) => (
        <Stat key={label} icon={Icon} label={label} value={value} tone={tone} />
       ))}
      </StatGrid>

      {/* Stale Keys Warning */}
      {stats.staleProviders.length > 0 && (
       <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
         <p className="text-sm font-semibold text-amber-800">Stale keys detected</p>
         <p className="text-xs text-amber-700 mt-0.5">
          {stats.staleProviders.map((p) => p.name).join(", ")} — not tested in 7+ days. Consider re-validating.
         </p>
        </div>
       </div>
      )}

      {/* Tests Over Time */}
      <Panel title="Tests over time" description="Last 30 days — total, valid, and invalid">
       <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={stats.lineData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
         <defs>
          <linearGradient id="colorValid" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
           <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.15} />
           <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
          </linearGradient>
         </defs>
         <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
         <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
          stroke="#E2E8F0"
          interval="preserveStartEnd"
         />
         <YAxis
          tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
          stroke="#E2E8F0"
          allowDecimals={false}
         />
         <Tooltip
          contentStyle={{
           background: "#fff",
           border: "1px solid #E2E8F0",
           borderRadius: 12,
           fontSize: 12,
           fontFamily: "Inter, sans-serif",
           boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
         />
         <Area type="monotone" dataKey="count" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#colorTests)" name="Total" />
         <Area type="monotone" dataKey="valid" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#colorValid)" name="Valid" />
         <Area type="monotone" dataKey="invalid" stroke={CHART_COLORS.red} strokeWidth={1.5} fill="none" name="Invalid" strokeDasharray="4 4" />
        </AreaChart>
       </ResponsiveContainer>
      </Panel>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
       {/* Provider Distribution */}
       <Panel title="Provider distribution" description="Share of tests by provider">
        <ResponsiveContainer width="100%" height={240}>
         <PieChart>
          <Pie
           data={stats.pieData}
           dataKey="value"
           nameKey="name"
           cx="50%"
           cy="50%"
           outerRadius={80}
           innerRadius={40}
           paddingAngle={2}
           label={({ name, percent }) =>
            percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
           }
           labelLine={false}
          >
           {stats.pieData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
           ))}
          </Pie>
          <Tooltip
           contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
           }}
          />
         </PieChart>
        </ResponsiveContainer>
       </Panel>

       {/* Status Breakdown */}
       <Panel title="Status breakdown" description="Valid, limited, and invalid results">
        <ResponsiveContainer width="100%" height={240}>
         <PieChart>
          <Pie
           data={stats.statusBreakdown}
           dataKey="value"
           nameKey="name"
           cx="50%"
           cy="50%"
           outerRadius={80}
           innerRadius={40}
           paddingAngle={3}
          >
           {stats.statusBreakdown.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
           ))}
          </Pie>
          <Tooltip
           contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
           }}
          />
         </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 -mt-2 pb-2">
         {stats.statusBreakdown.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
           <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
           <span className="text-xs font-medium text-slate-700">{s.name} ({s.value})</span>
          </div>
         ))}
        </div>
       </Panel>
      </div>

      {/* Health Score Distribution */}
      <Panel title="Health score distribution" description="Grouped by health range">
       <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stats.healthDist} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
         <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
         <XAxis
          dataKey="range"
          tick={{ fontSize: 11, fill: "#475569", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
          stroke="#E2E8F0"
         />
         <YAxis
          tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
          stroke="#E2E8F0"
          allowDecimals={false}
         />
         <Tooltip
          contentStyle={{
           background: "#fff",
           border: "1px solid #E2E8F0",
           borderRadius: 12,
           fontSize: 12,
           fontFamily: "Inter, sans-serif",
           boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
         />
         <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tests">
          {stats.healthDist.map((entry, i) => (
           <Cell key={i} fill={entry.color} />
          ))}
         </Bar>
        </BarChart>
       </ResponsiveContainer>
      </Panel>

      {/* Latency Trend */}
      <Panel title="Latency trend" description="Average response time over last 30 days">
       <ResponsiveContainer width="100%" height={200}>
        <LineChart data={stats.latencyTrendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
         <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
         <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
          stroke="#E2E8F0"
          interval="preserveStartEnd"
         />
         <YAxis
          tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
          stroke="#E2E8F0"
          unit="ms"
         />
         <Tooltip
          contentStyle={{
           background: "#fff",
           border: "1px solid #E2E8F0",
           borderRadius: 12,
           fontSize: 12,
           fontFamily: "Inter, sans-serif",
           boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          formatter={(v: number) => v ? [`${v}ms`, "Avg Latency"] : ["N/A", "Avg Latency"]}
         />
         <Line
          type="monotone"
          dataKey="avg"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          dot={false}
          connectNulls
         />
        </LineChart>
       </ResponsiveContainer>
      </Panel>

      {/* Latency by Provider */}
      {stats.latencyData.length > 0 && (
       <Panel title="Average latency by provider" description="Milliseconds per provider (sorted)">
        <ResponsiveContainer width="100%" height={Math.max(160, stats.latencyData.length * 40)}>
         <BarChart data={stats.latencyData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
           type="number"
           tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Fira Code, monospace" }}
           stroke="#E2E8F0"
           unit="ms"
          />
          <YAxis
           dataKey="name"
           type="category"
           tick={{ fontSize: 11, fill: "#475569", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
           stroke="#E2E8F0"
           width={90}
          />
          <Tooltip
           contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
           }}
           formatter={(v: number) => [`${v}ms`, "Avg Latency"]}
          />
          <Bar dataKey="avg" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} name="Avg Latency" />
         </BarChart>
        </ResponsiveContainer>
       </Panel>
      )}

      {/* Provider Uptime Table */}
      {stats.providerUptime.length > 0 && (
       <Panel title="Provider uptime" description="Success rate per provider">
        <div className="space-y-3">
         {stats.providerUptime.map((p) => (
          <div key={p.name} className="space-y-1.5">
           <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
             <span className="font-semibold text-slate-800">{p.name}</span>
             {p.uptime >= 90 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
             ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
             )}
            </div>
            <div className="flex items-center gap-2">
             <span className={cn(
              "font-mono font-bold text-sm",
              p.uptime >= 90 ? "text-green-600" : p.uptime >= 60 ? "text-amber-600" : "text-red-600"
             )}>
              {p.uptime}%
             </span>
             <span className="font-mono text-xs text-slate-500">({p.total} tests)</span>
            </div>
           </div>
           <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
             className={cn(
              "h-full rounded-full transition-all duration-500",
              p.uptime >= 90 ? "bg-green-500" : p.uptime >= 60 ? "bg-amber-400" : "bg-red-500"
             )}
             style={{ width: `${p.uptime}%` }}
            />
           </div>
          </div>
         ))}
        </div>
       </Panel>
      )}
     </>
    )}
   </PageShell>
  </DashboardLayout>
 );
};

export default StatsPage;
