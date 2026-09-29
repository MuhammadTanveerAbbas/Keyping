import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  SkeletonBlock,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "#3B82F6",
  "#1D4ED8",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#A855F7",
  "#EC4899",
  "#EAB308",
  "#14B8A6",
  "#84CC16",
];

const CHART_COLORS = {
  blue: "#2563EB",
  amber: "#D97706",
  red: "#DC2626",
  green: "#059669",
  slate: "#64748B",
};

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "'PT Sans', 'Valley Sans', sans-serif",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

function ChartFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} tabIndex={0} className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const { analytics, loading, error, refresh } = useAnalytics();

  const statCards = analytics
    ? [
        { icon: BarChart3, label: "Total tests", value: analytics.totalTests.toLocaleString(), tone: "default" as const },
        {
          icon: TrendingUp,
          label: "Last 30 days",
          value: analytics.monthlyTests.toLocaleString(),
          subValue: analytics.testsTrend !== 0 ? `${analytics.testsTrend > 0 ? "+" : ""}${analytics.testsTrend}% vs prior 30 days` : "No prior period to compare",
          tone: "default" as const,
        },
        {
          icon: Activity,
          label: "Valid rate",
          value: `${analytics.overallUptime}%`,
          subValue: `${analytics.validTests.toLocaleString()} valid of ${analytics.totalTests.toLocaleString()}`,
          tone: analytics.overallUptime >= 90 ? ("success" as const) : analytics.overallUptime >= 60 ? ("warning" as const) : ("danger" as const),
        },
        {
          icon: Zap,
          label: "Average health",
          value: `${analytics.healthAvg}/100`,
          subValue: `Average latency: ${analytics.avgMs}ms`,
          tone: analytics.healthAvg >= 80 ? ("success" as const) : analytics.healthAvg >= 50 ? ("warning" as const) : ("danger" as const),
        },
      ]
    : [];

  return (
    <>
      <PageShell>
        <PageHeader
          title="Analytics"
          description="Understand validation volume, provider health, and latency from your saved results."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={refresh} disabled={loading} className="h-10 border-slate-200 bg-white">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
                Refresh
              </Button>
              <Button asChild className="h-10 bg-blue-600 hover:bg-blue-700">
                <Link to="/dashboard">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Run a test
                </Link>
              </Button>
            </div>
          }
        />

        {error && <Notice variant="warning"><span>Analytics could not be loaded: {error}</span><Button type="button" variant="link" onClick={refresh} className="ml-2 h-auto p-0 text-amber-800 underline">Try again</Button></Notice>}

        {loading ? (
          <div className="space-y-4" role="status" aria-label="Loading analytics" aria-live="polite">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-28" />)}
            </div>
            <SkeletonBlock className="h-80" />
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-72" />
              <SkeletonBlock className="h-72" />
            </div>
            <span className="sr-only">Loading your analytics.</span>
          </div>
        ) : !analytics ? (
          <Panel ariaLabel="Analytics empty state">
            <EmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Save a validation result to start seeing trends, provider comparisons, and health signals."
              action={
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/dashboard">Open the tester</Link>
                </Button>
              }
            />
          </Panel>
        ) : (
          <>
            <StatGrid>
              {statCards.map(({ icon, label, value, subValue, tone }) => (
                <Stat key={label} icon={icon} label={label} value={value} tone={tone} subValue={subValue} />
              ))}
            </StatGrid>

            {analytics.staleProviders.length > 0 && (
              <Notice variant="warning">
                <span className="font-bold">Provider activity needs review.</span>{" "}
                {analytics.staleProviders.map((provider) => provider.name).join(", ")} may need a current validation. Re-run those keys before relying on the health view.
              </Notice>
            )}

            <Panel title="Report coverage" description="A quick view of the saved results behind this report.">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    Saved records
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{analytics.totalTests.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Used for every chart on this page</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock3 className="h-4 w-4 text-violet-600" aria-hidden="true" />
                    Time window
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">30 days</p>
                  <p className="mt-1 text-xs text-slate-500">Trend window for volume and latency</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    Leading provider
                  </div>
                  <p className="mt-2 truncate text-2xl font-bold text-slate-900">{analytics.topProvider?.[0] || "Not available"}</p>
                  <p className="mt-1 text-xs text-slate-500">{analytics.topProvider ? `${analytics.topProvider[1].toLocaleString()} saved tests` : "Add more results to compare"}</p>
                </div>
              </div>
            </Panel>

            <Panel title="Tests over time" description="Daily total, valid, and invalid results across the last 30 days.">
              <ChartFrame label="Area chart showing total, valid, and invalid tests over the last 30 days.">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.lineData} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="colorValid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.16} />
                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#colorTests)" name="Total" />
                    <Area type="monotone" dataKey="valid" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#colorValid)" name="Valid" />
                    <Area type="monotone" dataKey="invalid" stroke={CHART_COLORS.red} strokeWidth={1.5} fill="none" name="Invalid" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFrame>
              <p className="mt-3 text-xs text-slate-500">Use the provider uptime section below when you need exact rates rather than a visual trend.</p>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Provider distribution" description="Share of saved tests by provider.">
                <ChartFrame label="Donut chart showing the distribution of tests by provider.">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={analytics.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} innerRadius={44} paddingAngle={2} label={({ name, percent }) => (percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
                        {analytics.pieData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>

              <Panel title="Status breakdown" description="Valid, limited, and invalid saved results.">
                <ChartFrame label="Donut chart showing valid, limited, and invalid status counts.">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} innerRadius={42} paddingAngle={3}>
                        {analytics.statusBreakdown.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <div className="flex flex-wrap justify-center gap-3 pb-1 pt-1">
                  {analytics.statusBreakdown.map((status) => (
                    <div key={status.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
                      <span>{status.name}</span>
                      <span className="tabular-nums text-slate-500">({status.value})</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Health score distribution" description="Grouped by saved health range.">
                <ChartFrame label="Bar chart showing saved tests grouped by health score range.">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={analytics.healthDist} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: CHART_COLORS.slate }} stroke="#E2E8F0" />
                      <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tests">
                        {analytics.healthDist.map((entry, index) => <Cell key={`${entry.range}-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>

              <Panel title="Latency trend" description="Average response time over the last 30 days.">
                <ChartFrame label="Line chart showing average response latency over the last 30 days.">
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={analytics.latencyTrendData} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" unit="ms" width={48} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => (value ? [`${value}ms`, "Average latency"] : ["No data", "Average latency"])} />
                      <Line type="monotone" dataKey="avg" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>
            </div>

            {analytics.latencyData.length > 0 && (
              <Panel title="Average latency by provider" description="Milliseconds per provider, sorted fastest first.">
                <ChartFrame label="Horizontal bar chart comparing average latency by provider.">
                  <ResponsiveContainer width="100%" height={Math.max(180, analytics.latencyData.length * 42)}>
                    <BarChart data={analytics.latencyData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.slate }} stroke="#E2E8F0" unit="ms" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: CHART_COLORS.slate }} stroke="#E2E8F0" width={92} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}ms`, "Average latency"]} />
                      <Bar dataKey="avg" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} name="Average latency" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>
            )}

            {analytics.providerUptime.length > 0 && (
              <Panel title="Provider uptime" description="Valid-result rate for each provider in your saved history.">
                <div className="space-y-4">
                  {analytics.providerUptime.map((provider) => {
                    const tone = provider.uptime >= 90 ? "success" : provider.uptime >= 60 ? "warning" : "danger";
                    return (
                      <div key={provider.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-semibold text-slate-800">{provider.name}</span>
                            {provider.uptime >= 90 ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Healthy" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-label="Needs attention" />}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={cn("font-mono text-sm font-bold", tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-red-600")}>{provider.uptime}%</span>
                            <span className="font-mono text-xs text-slate-500">({provider.total} tests)</span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${provider.name} valid-result rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={provider.uptime}>
                          <div className={cn("h-full rounded-full transition-all duration-500", tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-400" : "bg-red-500")} style={{ width: `${Math.max(0, Math.min(100, provider.uptime))}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            <Panel title="Need a closer look?" description="Keep the raw saved results close to the metrics." noPadding>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">History keeps the context</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Open a saved result to inspect latency, scopes, notes, and its validation timeline.</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="h-10 shrink-0 border-slate-200 bg-white">
                  <Link to="/dashboard/history">Open history</Link>
                </Button>
              </div>
            </Panel>
          </>
        )}
      </PageShell>
    </>
  );
}
