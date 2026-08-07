import DashboardLayout from "@/components/DashboardLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
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
import { PageHeader, PageShell, Panel, Stat, StatGrid, EmptyState, SkeletonBlock } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "#3B82F6", "#1D4ED8", "#F59E0B", "#EF4444", "#3B9EF5",
  "#A855F7", "#EC4899", "#EAB308", "#14B8A6", "#84CC16",
];

const CHART_COLORS = {
  blue: "#3B82F6",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  slate: "#94A3B8",
};

export default function AnalyticsPage() {
  const { analytics, loading } = useAnalytics();

  const statCards = analytics ? [
    { icon: BarChart3, label: "Total Tests", value: analytics.totalTests.toString(), tone: "default" as const },
    { icon: TrendingUp, label: "This Month", value: analytics.monthlyTests.toString(), subValue: analytics.testsTrend !== 0 ? `${analytics.testsTrend > 0 ? "+" : ""}${analytics.testsTrend}% vs last month` : undefined, tone: "default" as const },
    { icon: Activity, label: "Uptime Rate", value: `${analytics.overallUptime}%`, subValue: `${analytics.validTests} valid of ${analytics.totalTests}`, tone: analytics.overallUptime >= 90 ? "success" as const : analytics.overallUptime >= 60 ? "warning" as const : "danger" as const },
    { icon: Zap, label: "Avg Health", value: `${analytics.healthAvg}/100`, subValue: `Avg latency: ${analytics.avgMs}ms`, tone: analytics.healthAvg >= 80 ? "success" as const : analytics.healthAvg >= 50 ? "warning" as const : "danger" as const },
  ] : [];

  return (
    <DashboardLayout>
      <PageShell>
        <PageHeader
          title="Analytics"
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
        ) : !analytics ? (
          <Panel>
            <EmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Run your first key test to populate charts and summaries."
            />
          </Panel>
        ) : (
          <>
            <StatGrid>
              {statCards.map(({ icon: Icon, label, value, subValue, tone }) => (
                <Stat key={label} icon={Icon} label={label} value={value} tone={tone} subValue={subValue} />
              ))}
            </StatGrid>

            {analytics.staleProviders.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Stale keys detected</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {analytics.staleProviders.map((p) => p.name).join(", ")} - not tested in 7+ days. Consider re-validating.
                  </p>
                </div>
              </div>
            )}

            <Panel title="Tests over time" description="Last 30 days - total, valid, and invalid">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.lineData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  <Area type="monotone" dataKey="count" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#colorTests)" name="Total" />
                  <Area type="monotone" dataKey="valid" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#colorValid)" name="Valid" />
                  <Area type="monotone" dataKey="invalid" stroke={CHART_COLORS.red} strokeWidth={1.5} fill="none" name="Invalid" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Provider distribution" description="Share of tests by provider">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={analytics.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} label={({ name, percent }) => percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                      {analytics.pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Status breakdown" description="Valid, limited, and invalid results">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                      {analytics.statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 -mt-2 pb-2">
                  {analytics.statusBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-medium text-slate-700">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="Health score distribution" description="Grouped by health range">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.healthDist} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#475569", fontFamily: "Inter, sans-serif", fontWeight: 500 }} stroke="#E2E8F0" />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tests">
                    {analytics.healthDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Latency trend" description="Average response time over last 30 days">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.latencyTrendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" unit="ms" />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} formatter={(v: number) => v ? [`${v}ms`, "Avg Latency"] : ["N/A", "Avg Latency"]} />
                  <Line type="monotone" dataKey="avg" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            {analytics.latencyData.length > 0 && (
              <Panel title="Average latency by provider" description="Milliseconds per provider (sorted)">
                <ResponsiveContainer width="100%" height={Math.max(160, analytics.latencyData.length * 40)}>
                  <BarChart data={analytics.latencyData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.slate, fontFamily: "Inter, sans-serif" }} stroke="#E2E8F0" unit="ms" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569", fontFamily: "Inter, sans-serif", fontWeight: 500 }} stroke="#E2E8F0" width={90} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} formatter={(v: number) => [`${v}ms`, "Avg Latency"]} />
                    <Bar dataKey="avg" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} name="Avg Latency" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}

            {analytics.providerUptime.length > 0 && (
              <Panel title="Provider uptime" description="Success rate per provider">
                <div className="space-y-3">
                  {analytics.providerUptime.map((p) => (
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
                          <span className={cn("font-mono font-bold text-sm", p.uptime >= 90 ? "text-green-600" : p.uptime >= 60 ? "text-amber-600" : "text-red-600")}>
                            {p.uptime}%
                          </span>
                          <span className="font-mono text-xs text-slate-500">({p.total} tests)</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", p.uptime >= 90 ? "bg-green-500" : p.uptime >= 60 ? "bg-amber-400" : "bg-red-500")} style={{ width: `${p.uptime}%` }} />
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
}
