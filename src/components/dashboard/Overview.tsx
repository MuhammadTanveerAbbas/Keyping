import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Gauge,
  KeyRound,
  Layers3,
  Plus,
  ShieldAlert,
  Sparkles,
  Terminal,
  Timer,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import type { AnalyticsResult, KeyTest } from "@/hooks/useAnalytics";
import { useAlerts } from "@/hooks/useAlerts";
import { Stat, StatGrid } from "@/components/dashboard/ui";
import { ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

type OverviewProps = {
  analytics: AnalyticsResult | null;
  tests: KeyTest[];
  loading: boolean;
  onRefresh: () => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SummaryBanner({ analytics, tests }: Pick<OverviewProps, "analytics" | "tests">) {
  const invalid = tests.filter((test) => test.status === "invalid").length;
  const limited = tests.filter((test) => test.status === "limited").length;
  const stale = analytics?.staleProviders ?? [];

  if (tests.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-5 shadow-sm">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Your validation workspace is ready</p>
              <p className="mt-1 text-sm text-slate-600">Run a key test to start building your health and latency history.</p>
            </div>
          </div>
          <a href="#key-tester" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            Start a test <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const hasAttention = invalid > 0 || limited > 0 || stale.length > 0;
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
      hasAttention ? "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50" : "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50",
    )}>
      <div className={cn("absolute -right-10 -top-16 h-40 w-40 rounded-full blur-3xl", hasAttention ? "bg-amber-200/40" : "bg-emerald-200/40")} />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg", hasAttention ? "bg-amber-500 shadow-amber-200" : "bg-emerald-500 shadow-emerald-200")}>
            {hasAttention ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{hasAttention ? "A few keys need attention" : "Your key workspace looks healthy"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {hasAttention
                ? `${invalid} invalid, ${limited} limited${stale.length ? `, and ${stale.length} provider${stale.length > 1 ? "s" : ""} not tested recently` : ""}.`
                : "No invalid or limited results were found in your saved validations."}
            </p>
          </div>
        </div>
        <Link to="/dashboard/history" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
          Review results <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function CapabilityCards() {
  const cards = [
    {
      title: "Key validation",
      description: "Check authentication and active status against supported providers.",
      icon: KeyRound,
      tone: "blue",
    },
    {
      title: "Health signals",
      description: "Review latency, rate limits, scopes, and a composite health score.",
      icon: Activity,
      tone: "violet",
    },
    {
      title: "Secure history",
      description: "Save a key reference and monitor changes without storing the secret.",
      icon: Layers3,
      tone: "emerald",
    },
  ] as const;

  const toneClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(({ title, description, icon: Icon, tone }) => (
        <div key={title} className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md sm:flex-col sm:items-start sm:gap-0">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 sm:mb-3", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProviderHealth({ analytics }: { analytics: AnalyticsResult | null }) {
  if (!analytics?.providerUptime.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
        <p className="text-sm font-semibold text-slate-700">Provider health appears after your first saved test</p>
        <p className="mt-1 text-xs text-slate-500">Compare uptime and latency across providers here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analytics.providerUptime.slice(0, 6).map((provider) => (
        <div key={provider.name} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-slate-800">{provider.name}</span>
              <span className="text-slate-400">({provider.total} tests)</span>
            </div>
            <span className={cn("font-mono font-bold", provider.uptime >= 90 ? "text-emerald-600" : provider.uptime >= 60 ? "text-amber-600" : "text-red-600")}>
              {provider.uptime}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${provider.name} validation success rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={provider.uptime}>
            <div className={cn("h-full rounded-full transition-all duration-700", provider.uptime >= 90 ? "bg-emerald-500" : provider.uptime >= 60 ? "bg-amber-400" : "bg-red-500")} style={{ width: `${provider.uptime}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentTests({ tests, loading }: Pick<OverviewProps, "tests" | "loading">) {
  if (loading) {
    return <div className="space-y-2" role="status" aria-label="Loading recent validations">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>;
  }
  if (!tests.length) {
    return <p className="py-5 text-center text-sm text-slate-500">No saved tests yet.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {tests.slice(0, 5).map((test) => (
        <div key={test.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 items-center gap-3">
            <ProviderIconBadge provider={test.provider} className="h-8.5 w-8.5 rounded-lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{test.nickname || test.provider}</p>
              <p className="truncate text-xs text-slate-500">{format(new Date(test.tested_at), "MMM d, yyyy, h:mm a")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {test.health_score !== null && (
              <span className="hidden rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 sm:inline-block">
                {test.health_score}/100
              </span>
            )}
            {test.latency_ms !== null && (
              <span className="hidden font-mono text-xs text-slate-400 md:inline-block">
                {test.latency_ms}ms
              </span>
            )}
            <StatusBadge status={test.status} size="sm" />
          </div>
        </div>
      ))}
      <div className="pt-3">
        <Link to="/dashboard/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700">
          View all history <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function AlertsPreview() {
  const { alerts, loading, removeAlert } = useAlerts();

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
        <CalendarClock className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-700">No expiry alerts</p>
        <p className="mt-1 text-xs text-slate-500">Create reminders in Expiry Alerts when a key has an expiry date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.slice(0, 3).map((alert) => {
        const days = differenceInDays(new Date(alert.expiry_date), new Date());
        const urgent = days <= alert.reminder_days;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-colors",
              urgent ? "border-amber-200 bg-amber-50/80 shadow-sm" : "border-slate-200/90 bg-white shadow-sm hover:border-slate-300"
            )}
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", urgent ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{alert.key_nickname}</p>
              <p className={cn("text-xs font-medium", urgent ? "text-amber-700" : "text-slate-500")}>
                {days < 0 ? "Expired" : days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Delete ${alert.key_nickname} alert`}
              onClick={() => { void removeAlert(alert.id); }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {alerts.length > 3 && (
        <div className="pt-1 text-center">
          <Link to="/dashboard/alerts" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View all {alerts.length} alerts →
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Request lab", description: "Inspect a custom response", to: "/dashboard#request-lab", icon: Terminal },
    { label: "Bulk test", description: "Check up to 10 keys", to: "/dashboard/bulk", icon: Zap },
    { label: "Analytics", description: "Explore trends and uptime", to: "/dashboard/analytics", icon: BarChart3 },
    { label: "Team workspace", description: "Collaborate on results", to: "/dashboard/team", icon: Users },
  ];

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {actions.map(({ label, description, to, icon: Icon }) => (
        <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-200">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="truncate text-xs text-slate-500">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
        </Link>
      ))}
    </div>
  );
}

export function DashboardOverview({ analytics, tests, loading, onRefresh }: OverviewProps) {
  const invalidCount = tests.filter((test) => test.status === "invalid").length;
  const averageHealth = analytics?.healthAvg ?? 0;
  const averageLatency = analytics?.avgMs ?? 0;
  const uptime = analytics?.overallUptime ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{getGreeting()}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your API key command center</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Validate credentials, understand provider health, and keep every integration visible from one focused workspace.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto">
          <Activity className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {loading ? "Refreshing" : "Refresh data"}
        </button>
      </div>

      <SummaryBanner analytics={analytics} tests={tests} />

      <StatGrid>
        <Stat icon={KeyRound} label="Saved tests" value={tests.length} loading={loading} />
        <Stat icon={CheckCircle2} label="Valid rate" value={`${uptime}%`} tone={uptime >= 90 ? "success" : uptime >= 60 ? "warning" : "danger"} subValue={`${invalidCount} need attention`} loading={loading} />
        <Stat icon={Timer} label="Average latency" value={`${averageLatency}ms`} tone={averageLatency > 0 && averageLatency < 500 ? "success" : "default"} loading={loading} />
        <Stat icon={Gauge} label="Average health" value={`${averageHealth}/100`} tone={averageHealth >= 80 ? "success" : averageHealth >= 50 ? "warning" : "danger"} loading={loading} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent validations</h3>
              <p className="mt-0.5 text-xs text-slate-500">Your latest saved provider checks</p>
            </div>
            <Link to="/dashboard/history" className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <RecentTests tests={tests} loading={loading} />
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Provider health</h3>
              <p className="mt-0.5 text-xs text-slate-500">Uptime across saved tests</p>
            </div>
            <Activity className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <ProviderHealth analytics={analytics} />
        </section>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Validation capabilities</h3>
            <p className="text-xs text-slate-500">Everything included in one key test</p>
          </div>
        </div>
        <CapabilityCards />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">Expiry alerts</h3>
              <p className="text-xs text-slate-500">Upcoming credential reminders</p>
            </div>
            <Link to="/dashboard/alerts" className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700">Manage</Link>
          </div>
          <AlertsPreview />
        </section>
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
              <p className="text-xs text-slate-500">Move to another workflow</p>
            </div>
          </div>
          <QuickActions />
        </section>
      </div>
    </div>
  );
}
