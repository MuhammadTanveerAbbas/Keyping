import { useState, useEffect } from "react";
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
import { BarChart3, Zap, Clock, TrendingUp } from "lucide-react";
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
} from "recharts";
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

 const totalTests = tests.length;
 const thisMonth = tests.filter(
  (t) => new Date(t.tested_at) > subDays(new Date(), 30),
 ).length;
 const avgHealth =
  tests.filter((t) => t.health_score !== null).length > 0
   ? Math.round(
     tests
      .filter((t) => t.health_score !== null)
      .reduce((s, t) => s + (t.health_score || 0), 0) /
      tests.filter((t) => t.health_score !== null).length,
    )
   : 0;

 const providerCounts: Record<string, number> = {};
 tests.forEach((t) => {
  providerCounts[t.provider] = (providerCounts[t.provider] || 0) + 1;
 });
 const topProvider = Object.entries(providerCounts).sort(
  (a, b) => b[1] - a[1],
 )[0];

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
  }))
  .sort((a, b) => a.avg - b.avg);

 const dailyTests: Record<string, number> = {};
 for (let i = 29; i >= 0; i--) {
  const d = format(subDays(new Date(), i), "MMM d");
  dailyTests[d] = 0;
 }
 tests.forEach((t) => {
  const d = format(new Date(t.tested_at), "MMM d");
  if (dailyTests[d] !== undefined) dailyTests[d]++;
 });
 const lineData = Object.entries(dailyTests).map(([name, count]) => ({
  name,
  count,
 }));

 const pieData = Object.entries(providerCounts).map(([id, value]) => ({
  name: PROVIDERS.find((p) => p.id === id)?.name || id,
  value,
 }));

 const healthDist = [
  {
   range: "80-100",
   count: tests.filter((t) => (t.health_score ?? 0) >= 80).length,
  },
  {
   range: "50-79",
   count: tests.filter(
    (t) => (t.health_score ?? 0) >= 50 && (t.health_score ?? 0) < 80,
   ).length,
  },
  {
   range: "0-49",
   count: tests.filter(
    (t) => (t.health_score ?? 0) < 50 && t.health_score !== null,
   ).length,
  },
 ];

 const statCards = [
  { icon: BarChart3, label: "Total Tests", value: totalTests.toString() },
  { icon: TrendingUp, label: "This Month", value: thisMonth.toString() },
  {
   icon: Zap,
   label: "Top Provider",
   value: topProvider
    ? PROVIDERS.find((p) => p.id === topProvider[0])?.name || topProvider[0]
    : "",
  },
  {
   icon: Clock,
   label: "Avg Health",
   value: avgHealth ? `${avgHealth}/100` : "",
  },
 ];

 return (
  <DashboardLayout>
   <PageShell>
    <PageHeader
     title="Stats"
     description="Trends and breakdowns from your saved validation history."
    />

    <StatGrid>
     {statCards.map(({ icon: Icon, label, value }) => (
       <Stat key={label} icon={Icon} label={label} value={value || "—"} />
      ))}
    </StatGrid>

    {loading ? (
     <div className="space-y-4">
      <SkeletonBlock className="h-64" />
      <div className="grid gap-4 md:grid-cols-2">
       <SkeletonBlock className="h-64" />
       <SkeletonBlock className="h-64" />
      </div>
     </div>
    ) : tests.length === 0 ? (
     <Panel>
      <EmptyState
       icon={BarChart3}
       title="No stats yet"
       description="Run your first key test to populate charts and summaries."
      />
     </Panel>
    ) : (
     <>
      <Panel title="Tests per day" description="Last 30 days">
       <ResponsiveContainer width="100%" height={220}>
        <LineChart data={lineData}>
         <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E2E8F0"
         />
         <XAxis
          dataKey="name"
          tick={{
           fontSize: 10,
           fill: "#94A3B8",
           fontFamily: "Fira Code, monospace",
          }}
          stroke="#E2E8F0"
          interval="preserveStartEnd"
         />
         <YAxis
          tick={{
           fontSize: 10,
           fill: "#94A3B8",
           fontFamily: "Fira Code, monospace",
          }}
          stroke="#E2E8F0"
         />
          <Tooltip
           contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 12,
            fontFamily: "Fira Code, monospace",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
           }}
          />
          <Line
          type="monotone"
          dataKey="count"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
         />
        </LineChart>
       </ResponsiveContainer>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
       <Panel title="Provider distribution">
        <ResponsiveContainer width="100%" height={220}>
         <PieChart>
          <Pie
           data={pieData}
           dataKey="value"
           nameKey="name"
           cx="50%"
           cy="50%"
           outerRadius={70}
           label={({ name, percent }) =>
            percent > 0.05
             ? `${name} ${(percent * 100).toFixed(0)}%`
             : ""
           }
           labelLine={false}
          >
           {pieData.map((_, i) => (
            <Cell
             key={i}
             fill={PIE_COLORS[i % PIE_COLORS.length]}
            />
           ))}
          </Pie>
           <Tooltip
            contentStyle={{
             background: "#fff",
             border: "1px solid #E2E8F0",
             borderRadius: 12,
             fontSize: 12,
             fontFamily: "Fira Code, monospace",
             boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
           />
          </PieChart>
        </ResponsiveContainer>
       </Panel>

       <Panel title="Health score distribution">
        <ResponsiveContainer width="100%" height={220}>
         <BarChart data={healthDist}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
           dataKey="range"
           tick={{
            fontSize: 10,
            fill: "#94A3B8",
            fontFamily: "Fira Code, monospace",
           }}
           stroke="#E2E8F0"
          />
          <YAxis
           tick={{
            fontSize: 10,
            fill: "#94A3B8",
            fontFamily: "Fira Code, monospace",
           }}
           stroke="#E2E8F0"
          />
           <Tooltip
            contentStyle={{
             background: "#fff",
             border: "1px solid #E2E8F0",
             borderRadius: 12,
             fontSize: 12,
             fontFamily: "Fira Code, monospace",
             boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
           />
           <Bar dataKey="count" radius={[4, 4, 0, 0]}>
           <Cell fill={CHART_COLORS.cyan} />
           <Cell fill={CHART_COLORS.amber} />
           <Cell fill={CHART_COLORS.red} />
          </Bar>
         </BarChart>
        </ResponsiveContainer>
       </Panel>
      </div>

      {latencyData.length > 0 && (
       <Panel title="Average latency by provider" description="Milliseconds per provider">
        <ResponsiveContainer width="100%" height={220}>
         <BarChart data={latencyData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
           type="number"
           tick={{
            fontSize: 10,
            fill: "#94A3B8",
            fontFamily: "Fira Code, monospace",
           }}
           stroke="#E2E8F0"
           unit="ms"
          />
          <YAxis
           dataKey="name"
           type="category"
           tick={{
            fontSize: 10,
            fill: "#94A3B8",
            fontFamily: "Fira Code, monospace",
           }}
           stroke="#E2E8F0"
           width={80}
          />
           <Tooltip
            contentStyle={{
             background: "#fff",
             border: "1px solid #E2E8F0",
             borderRadius: 12,
             fontSize: 12,
             fontFamily: "Fira Code, monospace",
             boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            formatter={(v: number) => `${v}ms`}
          />
          <Bar
           dataKey="avg"
           fill={CHART_COLORS.cyan}
           radius={[0, 4, 4, 0]}
          />
         </BarChart>
        </ResponsiveContainer>
       </Panel>
      )}
     </>
    )}
   </PageShell>
  </DashboardLayout>
 );
};

export default StatsPage;
