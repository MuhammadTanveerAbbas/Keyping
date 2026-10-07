import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, MotionConfig, useInView } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  EyeOff,
  FileDown,
  Gauge,
  Globe2,
  History,
  KeyRound,
  Layers3,
  Loader2,
  Lock,
  LockKeyhole,
  Menu,
  Radio,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  X,
  Zap,
  GitBranch,
  Wifi,
  BarChart2,
  RefreshCw,
  User,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PROVIDERS, type ValidationCheck } from "@/lib/providers";
import { BRAND_ICONS } from "@/components/BrandIcons";
import { Footer } from "@/components/Footer";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Health", href: "#health" },
  { label: "Analytics", href: "#analytics" },
  { label: "Providers", href: "#providers" },
  { label: "Security", href: "#security" },
] as const;

const ACTIVE_BRANDED_PROVIDERS = PROVIDERS.filter(
  (provider) => provider.availability === "active" && BRAND_ICONS[provider.id],
);

const SUPPORTED_BRANDED_PROVIDERS = PROVIDERS.filter(
  (provider) =>
    BRAND_ICONS[provider.id] &&
    (provider.availability === "active" ||
      (provider.availability === "limited" && provider.validationKind === "legacy-api")),
);

const UNAVAILABLE_PROVIDERS = PROVIDERS.filter(
  (provider) => provider.availability === "planned" || provider.validationKind === "unsupported",
);

const CHECK_LABELS: Record<ValidationCheck, string> = {
  status: "Status",
  rateLimit: "Rate limit*",
  scopes: "Scopes*",
  docs: "Docs",
  responseTime: "Latency",
  healthScore: "Health score",
};

function ProviderMark({ provider, className }: { provider: string; className?: string }) {
  const BrandIcon = BRAND_ICONS[provider];
  if (!BrandIcon) return <ServerCog className={className} aria-hidden="true" />;
  return (
    <span className="inline-flex" aria-hidden="true">
      <BrandIcon className={className} />
    </span>
  );
}

function HeroProviderCluster() {
  return (
    <div className="relative mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 sm:mt-12 sm:gap-3" aria-label="Supported provider brands">
      {ACTIVE_BRANDED_PROVIDERS.slice(0, 8).map((provider, index) => {
        const BrandIcon = BRAND_ICONS[provider.id];
        if (!BrandIcon) return null;
        return (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{
              opacity: { duration: 0.35, delay: 0.08 * index },
              y: { duration: 5.4 + index * 0.22, delay: 0.08 * index, repeat: Infinity, ease: "easeInOut" },
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:h-12 sm:w-12 sm:rounded-2xl"
            style={{ color: provider.icon.brandColor, backgroundColor: provider.icon.backgroundColor }}
            title={provider.name}
          >
            <BrandIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        );
      })}
    </div>
  );
}

function LiveMetricIcon({ icon: Icon, tone, className }: { icon: LucideIcon; tone: "blue" | "emerald" | "violet" | "amber"; className?: string }) {
  const tones = {
    blue: "from-blue-500 to-blue-700 text-white shadow-blue-500/30",
    emerald: "from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30",
    violet: "from-violet-500 to-indigo-700 text-white shadow-violet-500/30",
    amber: "from-amber-400 to-orange-600 text-white shadow-amber-500/30",
  }[tone];
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-[0_8px_16px_var(--tw-shadow-color),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-black/5", tones, className)}>
      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}

function HeroResultPreview() {
  const scoreRef = useRef<HTMLDivElement>(null);
  const scoreInView = useInView(scoreRef, { once: true, margin: "-80px" });
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const score = 100;
  const offset = circumference * (1 - score / 100);
  const LATENCY_SPARK = [98, 112, 89, 134, 107, 121, 108, 142, 118, 131, 124, 142];
  const sparkMax = 160;
  const sparkW = 120;
  const sparkH = 44;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, delay: 0.25, ease: EASE }}
      className="relative mx-auto w-full max-w-[900px]"
      aria-labelledby="result-preview-caption"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-400/15 via-indigo-400/8 to-emerald-400/12 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.05)] ring-1 ring-white/80">

        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 sm:px-5">
          <div className="flex h-4 items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
            <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="truncate font-mono text-[11px] text-slate-500">app.keyping.dev/live/validation</span>
          </div>
          <motion.span
            animate={{ boxShadow: ["0 0 0 0 rgba(16,185,129,0)", "0 0 0 5px rgba(16,185,129,0.12)", "0 0 0 0 rgba(16,185,129,0)"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
          </motion.span>
        </div>

        {/* Scanning progress bar */}
        <div className="relative h-[3px] w-full overflow-hidden bg-slate-100">
          <motion.div
            aria-hidden="true"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          />
        </div>
        {/* Provider + status header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <ProviderMark provider="github" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-bold text-slate-900">GitHub token</p>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">Personal access</span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">ghp_xK9mP2qR...7A2F</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-500 sm:inline-flex">
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Just now
            </span>
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-gradient-to-b from-white to-emerald-50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.14)]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Valid
            </motion.span>
          </div>
        </div>

        {/* Main metrics grid */}
        <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">

          {/* Health ring */}
          <div ref={scoreRef} className="flex flex-col items-center justify-center rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/50 p-4 text-center shadow-[0_8px_24px_rgba(37,99,235,0.07),inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="hero-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
                <motion.circle
                  cx="50" cy="50" r={radius} fill="none"
                  stroke="url(#hero-score-gradient)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={scoreInView ? { strokeDashoffset: offset } : {}}
                  transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">{score}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Health</span>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-700">100 / 100</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">Composite score</p>
          </div>

          {/* Right metrics */}
          <div className="grid grid-cols-2 gap-3">

            {/* Latency with sparkline */}
            <div className="col-span-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] sm:col-span-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <LiveMetricIcon icon={Timer} tone="blue" className="h-6 w-6 rounded-md" /> Latency
                  </dt>
                  <dd className="mt-1.5 flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-extrabold text-slate-900">142</span>
                    <span className="font-mono text-sm font-semibold text-slate-400">ms</span>
                    <span className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                      <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" /> Fast
                    </span>
                  </dd>
                  <p className="mt-0.5 text-[10px] text-slate-400">p95 this session</p>
                </div>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="h-11 w-28 shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = LATENCY_SPARK.map((v, i) => ({
                      x: (i / (LATENCY_SPARK.length - 1)) * sparkW,
                      y: 4 + (sparkH - 8) - ((v - 80) / (sparkMax - 80)) * (sparkH - 8),
                    }));
                    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                    const areaPath = `${linePath} L ${pts[pts.length - 1]!.x} ${sparkH} L 0 ${sparkH} Z`;
                    return (
                      <>
                        <path d={areaPath} fill="url(#spark-grad)" />
                        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        {pts.map((p, i) => i === pts.length - 1 ? (
                          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" stroke="white" strokeWidth="1.5" />
                        ) : null)}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="mt-2.5 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/80">
                {[{ label: "Min", val: "89 ms" }, { label: "Avg", val: "118 ms" }, { label: "Max", val: "142 ms" }].map((s) => (
                  <div key={s.label} className="px-2 py-1.5 text-center">
                    <p className="font-mono text-[11px] font-bold text-slate-700">{s.val}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate limit */}
            <div className="col-span-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] sm:col-span-1">
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <LiveMetricIcon icon={Gauge} tone="violet" className="h-6 w-6 rounded-md" /> Rate limit
              </dt>
              <dd className="mt-1.5 font-mono text-xl font-extrabold text-slate-900">4,821 <span className="text-sm font-semibold text-slate-400">/ 5,000</span></dd>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={scoreInView ? { width: "96.4%" } : {}}
                  transition={{ duration: 1, delay: 0.5, ease: EASE }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">96.4% remaining</p>
            </div>

            {/* Checks passed mini row */}
            <div className="col-span-2 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/60 to-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(16,185,129,0.06)]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-slate-700">All checks passed</span>
              <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                {["Status", "Scopes", "Rate limit", "Latency"].map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 shadow-sm">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />{c}
                  </span>
                ))}
              </div>
            </div>

            {/* Scopes */}
            <div className="col-span-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <LiveMetricIcon icon={ShieldCheck} tone="emerald" className="h-6 w-6 rounded-md" /> Returned scopes
                </dt>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">5 granted</span>
              </div>
              <dd className="mt-2.5 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "read:user", level: "read", icon: User },
                    { label: "user:email", level: "read", icon: User },
                    { label: "repo", level: "write", icon: GitBranch },
                    { label: "repo:status", level: "read", icon: GitBranch },
                    { label: "gist", level: "write", icon: Lock },
                  ].map((scope) => {
                    const ScopeIcon = scope.icon;
                    return (
                      <span key={scope.label} className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]",
                        scope.level === "write"
                          ? "border-amber-200/80 bg-gradient-to-b from-amber-50 to-orange-50/60 text-amber-700"
                          : "border-blue-100/80 bg-gradient-to-b from-blue-50 to-indigo-50/60 text-blue-700"
                      )}>
                        <ScopeIcon className={cn("h-3 w-3", scope.level === "write" ? "text-amber-500" : "text-blue-500")} aria-hidden="true" />
                        {scope.label}
                        <span className={cn(
                          "rounded-sm px-1 py-px text-[9px] font-bold uppercase tracking-wide",
                          scope.level === "write" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                        )}>{scope.level}</span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-blue-400" /> 3 read
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> 2 write
                  </span>
                  <span className="sm:ml-auto text-[10px] font-semibold text-slate-400">via OAuth token</span>
                </div>
              </dd>
            </div>
          </div>
        </div>

        {/* Request timeline */}
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Request timeline</p>
          <div className="flex items-center gap-0">
            {[
              { label: "DNS", ms: 8, color: "bg-blue-400" },
              { label: "TLS", ms: 22, color: "bg-indigo-400" },
              { label: "TTFB", ms: 67, color: "bg-violet-500" },
              { label: "Read", ms: 45, color: "bg-emerald-400" },
            ].map((seg, i) => (
              <div key={seg.label} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  className={cn("h-2 w-full", seg.color, i === 0 && "rounded-l-full", i === 3 && "rounded-r-full")}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={scoreInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1, ease: EASE }}
                />
                <span className="font-mono text-[9px] font-semibold text-slate-400">{seg.label} {seg.ms}ms</span>
              </div>
            ))}
          </div>
        </div>

        {/* Token metadata row */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <User className="h-3 w-3 text-slate-400" aria-hidden="true" /> User
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <GitBranch className="h-3 w-3 text-slate-400" aria-hidden="true" /> github.com API v3
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Calendar className="h-3 w-3 text-slate-400" aria-hidden="true" /> Expires never
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Wifi className="h-3 w-3 text-emerald-500" aria-hidden="true" /> Provider up
          </span>
        </div>

        {/* Footer */}
        <motion.div
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col gap-2 border-t border-slate-100 bg-[linear-gradient(100deg,#f8fafc_20%,#ecfdf5_50%,#f8fafc_80%)] bg-[length:200%_100%] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <LiveMetricIcon icon={Check} tone="emerald" className="h-6 w-6 rounded-md" /> Provider request accepted
          </span>
          <figcaption id="result-preview-caption" className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Live example result
          </figcaption>
        </motion.div>

      </div>
    </motion.figure>
  );
}

function ValidatorLoop() {
  const providers = SUPPORTED_BRANDED_PROVIDERS;
  return (
    <div className="relative mt-8 overflow-hidden py-2" aria-label="Supported provider validators">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex w-max items-stretch gap-3 hover:[animation-play-state:paused]"
      >
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 gap-3" aria-hidden={group === 1}>
            {providers.map((provider) => {
              const BrandIcon = BRAND_ICONS[provider.id];
              if (!BrandIcon) return null;
              const isLimited = provider.availability === "limited";
              return (
                <div key={`${group}-${provider.id}`} className="flex w-52 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_18px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-black/5"
                    style={{ color: provider.icon.brandColor, backgroundColor: provider.icon.backgroundColor }}
                  >
                    <BrandIcon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-800">{provider.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span className={cn("h-1.5 w-1.5 rounded-full", isLimited ? "bg-amber-500" : "bg-emerald-500")} />
                      {isLimited ? "Limited" : "Active"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  icon: LucideIcon;
  align?: "center" | "left";
};

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  align = "center",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`mb-12 sm:mb-16 ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}`}
    >
      <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-blue-200/70 bg-gradient-to-b from-white to-blue-50 px-2 py-1.5 pr-4 text-xs font-bold text-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_5px_12px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-blue-900/10">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        {eyebrow}
      </span>
      <h2 id={id} className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className={`mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg ${align === "center" ? "mx-auto max-w-2xl" : ""}`}>
        {description}
      </p>
    </motion.div>
  );
}

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Choose or detect",
    description: "Select a provider or let supported key patterns fill it automatically. Custom public HTTPS endpoints are also available.",
    icon: Radio,
  },
  {
    number: "02",
    title: "Run the check",
    description: "An authenticated server function sends the smallest practical provider request and records status and response time.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Review the signals",
    description: "Review health, latency, and any rate limit or scope data returned by that provider. Save a masked result when useful.",
    icon: Activity,
  },
] as const;

const FEATURE_CARDS = [
  {
    icon: ShieldCheck,
    title: "Clear validation status",
    description: "Separate accepted keys, rejected keys, and rate-limited responses instead of reducing every check to pass or fail.",
  },
  {
    icon: Gauge,
    title: "Rate limit signals",
    description: "Surface remaining request counts and reset data when the selected provider returns those headers.",
  },
  {
    icon: LockKeyhole,
    title: "Permissions and scopes",
    description: "Show OAuth scopes or access details when a provider returns them. Some endpoints expose no permission metadata.",
  },
  {
    icon: Timer,
    title: "Measured latency",
    description: "Capture the round-trip time for each validation request and keep provider comparisons in analytics.",
  },
  {
    icon: Activity,
    title: "Composite health score",
    description: "Combine status, access signals, rate limit data, and latency into a transparent 0 to 100 result summary.",
  },
  {
    icon: History,
    title: "History that stays useful",
    description: "Filter saved results, compare status changes, export account data as CSV, and delete individual records or all data.",
  },
] as const;

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 border-y border-slate-200/60 bg-slate-50/70 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="features-title"
          eyebrow="One focused workflow"
          icon={Sparkles}
          title={<>Validate the key. <span className="text-blue-600">Understand the response.</span></>}
          description="KeyPing turns a provider check into a useful diagnostic. Optional signals stay optional, so the interface never implies data that an API did not return."
        />

        {/* Workflow steps horizontal timeline */}
        <ol className="grid gap-4 md:grid-cols-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: EASE }}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <LiveMetricIcon icon={Icon} tone={index === 0 ? "blue" : index === 1 ? "violet" : "emerald"} className="h-11 w-11 rounded-xl shadow-[0_10px_22px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.3)]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.07, ease: EASE }}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <LiveMetricIcon icon={Icon} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "violet" : "emerald"} className="mb-4 h-11 w-11 rounded-xl shadow-[0_9px_20px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.28)]" />
                <h3 className="font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const HEALTH_BREAKDOWN = [
  {
    label: "Provider status",
    detail: "Valid response",
    points: "50 / 50",
    percent: 100,
    color: "#10B981",
  },
  {
    label: "Access signal",
    detail: "Scopes returned",
    points: "15 / 15",
    percent: 100,
    color: "#8B5CF6",
  },
  {
    label: "Rate limit signal",
    detail: "4,821 remaining",
    points: "20 / 20",
    percent: 100,
    color: "#3B82F6",
  },
  {
    label: "Response time",
    detail: "142 ms",
    points: "15 / 15",
    percent: 100,
    color: "#06B6D4",
  },
] as const;

function HealthScoreSection() {
  const healthRef = useRef<HTMLDivElement>(null);
  const healthInView = useInView(healthRef, { once: true, margin: "-80px" });
  const score = 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <section id="health" className="scroll-mt-28 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="health-title"
          eyebrow="Health score"
          icon={Activity}
          title={<>A useful summary, <span className="text-blue-600">not a black box.</span></>}
          description="The score reflects the signals from one validation request. It is designed to make results comparable, not to promise future uptime or quota."
        />

        <div ref={healthRef} className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                  <ProviderMark provider="github" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Example health report</p>
                  <p className="font-mono text-[11px] text-slate-500">GitHub token ending in 7A2F</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Interface preview
              </span>
            </div>

            <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[220px_1fr] lg:items-center">
              <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
                    <defs>
                      <linearGradient id="health-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="9" />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke="url(#health-score-gradient)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={healthInView ? { strokeDashoffset: offset } : {}}
                      transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tight text-slate-950">{score}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">out of 100</span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-800">All example signals returned</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">A different provider response can produce a different score.</p>
              </div>

              <div className="space-y-3">
                {HEALTH_BREAKDOWN.map((factor, index) => (
                  <div key={factor.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{factor.label}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">{factor.detail}</p>
                      </div>
                      <span className="font-mono text-xs font-bold" style={{ color: factor.color }}>
                        {factor.points}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={factor.label}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={factor.percent}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: factor.color }}
                        initial={{ width: 0 }}
                        animate={healthInView ? { width: `${factor.percent}%` } : {}}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: EASE }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 px-5 py-3.5 sm:px-7">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-xs font-medium leading-5 text-blue-800">
                Valid means the provider accepted the request. Check your provider dashboard for live permissions and quota.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ACTIVITY_DATA = [8, 12, 10, 18, 14, 22, 19, 25, 21, 28, 24, 31];
const ACTIVITY_MAX = 35;
const CHART_WIDTH = 560;
const CHART_HEIGHT = 210;
const CHART_PADDING = 18;

const RECENT_RESULTS = [
  { provider: "github", key: "ghp_...7A2F", status: "Valid", score: 100, latency: "142 ms" },
  { provider: "stripe", key: "sk_live_...91QK", status: "Valid", score: 90, latency: "188 ms" },
  { provider: "groq", key: "gsk_...M4PL", status: "Limited", score: 60, latency: "96 ms" },
] as const;

const ACTIVITY_POINTS = ACTIVITY_DATA.map((value, index) => ({
  x: CHART_PADDING + (index / (ACTIVITY_DATA.length - 1)) * (CHART_WIDTH - CHART_PADDING * 2),
  y: CHART_HEIGHT - CHART_PADDING - (value / ACTIVITY_MAX) * (CHART_HEIGHT - CHART_PADDING * 2),
}));

const ACTIVITY_PATH = ACTIVITY_POINTS.map(
  (point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`,
).join(" ");

const ACTIVITY_AREA = `${ACTIVITY_PATH} L ${ACTIVITY_POINTS[ACTIVITY_POINTS.length - 1]?.x},${CHART_HEIGHT - CHART_PADDING} L ${ACTIVITY_POINTS[0]?.x},${CHART_HEIGHT - CHART_PADDING} Z`;

function AnalyticsSection() {
  const analyticsRef = useRef<HTMLDivElement>(null);
  const analyticsInView = useInView(analyticsRef, { once: true, margin: "-80px" });

  return (
    <section id="analytics" className="scroll-mt-28 border-y border-slate-200/60 bg-slate-50/70 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="analytics-title"
          eyebrow="History and analytics"
          icon={BarChart3}
          title={<>Turn one-off checks into <span className="text-blue-600">clear patterns.</span></>}
          description="Saved results power provider distribution, status breakdowns, health ranges, latency trends, provider success rates, and stale key hints."
        />

        <div ref={analyticsRef} className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900">Test activity</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">30 day volume in the analytics workspace</p>
              </div>
              <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Example data
              </span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 sm:grid-cols-4 sm:divide-y-0">
              {[
                { label: "Total tests", value: "148", icon: BarChart3 },
                { label: "Valid rate", value: "92%", icon: ShieldCheck },
                { label: "Avg health", value: "87", icon: Activity },
                { label: "Avg latency", value: "186 ms", icon: Clock3 },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-4 sm:p-5">
                    <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <p className="mt-2 text-xl font-extrabold text-slate-900">{stat.value}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-5">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-auto w-full overflow-visible"
                role="img"
                aria-labelledby="activity-chart-title activity-chart-description"
              >
                <title id="activity-chart-title">Example test activity over 12 periods</title>
                <desc id="activity-chart-description">The line rises from 8 tests to 31 tests across the displayed period.</desc>
                <defs>
                  <linearGradient id="analytics-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => {
                  const y = CHART_PADDING + (line / 3) * (CHART_HEIGHT - CHART_PADDING * 2);
                  return <line key={line} x1={CHART_PADDING} x2={CHART_WIDTH - CHART_PADDING} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="4 6" />;
                })}
                <motion.path
                  d={ACTIVITY_AREA}
                  fill="url(#analytics-area-gradient)"
                  initial={{ opacity: 0 }}
                  animate={analyticsInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.7, delay: 0.4 }}
                />
                <motion.path
                  d={ACTIVITY_PATH}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={analyticsInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
                />
                {ACTIVITY_POINTS.map((point, index) => (
                  <motion.circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill="#2563EB"
                    stroke="white"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={analyticsInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.25, delay: 0.3 + index * 0.05 }}
                  />
                ))}
              </svg>
              <div className="mt-2 flex items-center justify-center gap-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent saved results</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Masked references with status, score, and latency.</p>
              </div>
              <History className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
            </div>

            <div className="mt-5 space-y-3">
              {RECENT_RESULTS.map((result, index) => (
                <motion.div
                  key={result.key}
                  initial={{ opacity: 0, x: 12 }}
                  animate={analyticsInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.25 + index * 0.08 }}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                      <ProviderMark provider={result.provider} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-semibold text-slate-700">{result.key}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{result.latency}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${
                        result.status === "Valid"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs">
                    <span className="text-slate-500">Health score</span>
                    <span className="font-mono font-bold text-slate-800">{result.score} / 100</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Provider mix", "Health ranges", "Latency trend", "Success rate"].map((label) => (
                <span key={label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: EASE }}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:h-11 sm:w-11">
                <History className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 sm:text-lg">History and vault</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Save results with nicknames and notes, filter by provider or status, inspect returned scopes and rate data, and track changes under the same nickname.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              {["Status changelog", "CSV account export", "Record deletion"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-4">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" /> {item}
                </span>
              ))}
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk testing</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add up to 10 provider and key pairs, test them concurrently, compare status and health at a glance, then export the current report as a PDF.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileDown className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-700">Bulk results stay in this session</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Export when the comparison is ready</p>
                </div>
              </div>
              <span className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-blue-700">PDF</span>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function ProvidersSection() {
  return (
    <section id="providers" className="scroll-mt-28 bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="providers-title"
          eyebrow="Provider coverage"
          icon={ShieldCheck}
          title={<>Know the endpoint. <span className="text-blue-600">Know the signal coverage.</span></>}
          description="Provider checks are not identical. The cards below come from the shared provider registry and only advertise validators that can currently run."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_BRANDED_PROVIDERS.map((provider, index) => {
            const BrandIcon = BRAND_ICONS[provider.id];
            if (!BrandIcon) return null;
            const isLimited = provider.availability === "limited";
            const canAutoDetect = provider.detectionPriority < 1000;
            const signals = provider.supportedChecks
              .filter((check) => check !== "docs")
              .map((check) => CHECK_LABELS[check]);

            return (
              <motion.article
                key={provider.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.06, ease: EASE }}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl border shadow-[0_10px_24px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.34)] ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2"
                    style={{
                      color: provider.icon.brandColor,
                      backgroundColor: provider.icon.backgroundColor,
                      borderColor: `${provider.icon.brandColor}24`,
                    }}
                  >
                    <span className="inline-flex" aria-hidden="true">
                      <BrandIcon className="h-6 w-6" />
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_10px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] ${
                      isLimited
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isLimited ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {isLimited ? "Limited" : "Active"}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{provider.name}</h3>
                <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{provider.availabilityNote}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {signals.map((signal) => (
                    <span key={signal} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {signal}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-medium text-slate-500">
                    {canAutoDetect ? "Pattern detection" : "Manual selection"}
                  </span>
                  {provider.docsUrl && (
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label={`Open ${provider.name} documentation in a new tab`}
                    >
                      Docs <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="flex gap-4 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-600">
              <Globe2 className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Custom HTTPS endpoint</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                Custom validation uses an authenticated GET request to public HTTPS on port 443. The runner rejects private destinations, pins a resolved address, and does not follow redirects.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-500">* Rate limit and scope data appears only when the provider returns it.</p>
      </div>
    </section>
  );
}

const SECURITY_CARDS = [
  {
    icon: EyeOff,
    title: "Masked saved results",
    description: "The full key is not written to KeyPing history. When you save a result, its reference keeps only the last four characters.",
  },
  {
    icon: Clock3,
    title: "Automatic input clearing",
    description: "The tester clears the key from its input after 10 minutes without activity and removes the current result at the same time.",
  },
  {
    icon: LockKeyhole,
    title: "Authenticated test runner",
    description: "The server test function requires a valid signed-in user before it forwards a validation request to a provider.",
  },
  {
    icon: ServerCog,
    title: "Custom endpoint guardrails",
    description: "Custom URLs require public HTTPS on port 443. The runner rejects private destinations, pins a resolved address, and does not follow redirects.",
  },
] as const;

function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-28 border-y border-slate-200/60 bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-blue-200/70 bg-gradient-to-b from-white to-blue-50 px-2.5 py-1.5 pr-4 text-xs font-bold text-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_5px_12px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-blue-900/10">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Key handling
            </span>
            <h2 id="security-title" className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Keep the useful history. <span className="text-blue-600">Not the full secret.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              KeyPing explains exactly what the app does with test inputs and saved records. Security claims stay tied to the implemented behavior.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SECURITY_CARDS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: (index % 2) * 0.08, ease: EASE }}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_8px_18px_rgba(37,99,235,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-blue-900/10">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
        <span className="sr-only">Loading KeyPing</span>
      </div>
    );
  }

  const handleCTA = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen overflow-x-hidden bg-white text-slate-900">

        <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4" aria-label="Main navigation">
          <div className="relative mx-auto max-w-6xl">
            <div className="flex min-h-14 items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-4">
              <a href="#top" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label="KeyPing home">
                <KeyPingLogo size={27} />
                <span className="font-display text-[15px] font-extrabold tracking-tight text-slate-950">KeyPing</span>
              </a>

              <nav className="hidden items-center rounded-xl border border-slate-200/70 bg-slate-50/80 p-1 lg:flex" aria-label="Product sections">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-[0_5px_16px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_8px_20px_rgba(37,99,235,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-4 sm:text-[13px]"
                >
                  <span className="sm:hidden">{user ? "Open" : "Test"}</span>
                  <span className="hidden sm:inline">{user ? "Dashboard" : "Open tester"}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:hidden"
                  aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  {mobileMenuOpen ? <X className="h-4.5 w-4.5" aria-hidden="true" /> : <Menu className="h-4.5 w-4.5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <motion.nav
              id="mobile-navigation"
              initial={false}
              animate={{ opacity: mobileMenuOpen ? 1 : 0, y: mobileMenuOpen ? 0 : -6 }}
              className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
              aria-label="Mobile product navigation"
              aria-hidden={!mobileMenuOpen}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className="flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                </a>
              ))}
            </motion.nav>
          </div>
        </header>

        <main className="relative z-10">
          <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              className="relative z-10 mx-auto max-w-6xl text-center"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
                className="mx-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-blue-200/90 bg-white/90 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-sm backdrop-blur"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                </span>
                Built for reliable API operations
              </motion.div>

              <motion.h1
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }}
                className="mx-auto mt-7 max-w-5xl text-balance font-display text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
              >
                Validate every key.
                <span className="mt-1 block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Ship with confidence.</span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8"
              >
                Test credentials through an authenticated server check, then turn provider responses into clear health, latency, scope, and rate-limit signals your team can act on.
              </motion.p>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_10px_28px_rgba(37,99,235,0.24)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  {user ? "Open dashboard" : "Test an API key"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href="#features"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-6 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Explore the workflow
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </motion.div>

              <motion.ul
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.45, delay: 0.15 } } }}
                className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm"
              >
                {["Masked saved history", "10 minute secret clearing", "Provider-aware results"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </motion.ul>

              <HeroProviderCluster />

              <div className="mt-8 sm:mt-10">
                <HeroResultPreview />
              </div>
            </motion.div>
          </section>

          <section className="border-y border-slate-200/70 bg-white/95 px-4 py-12 sm:px-6 sm:py-14" aria-labelledby="coverage-title">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                  <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
                  Live provider registry
                </span>
                <h2 id="coverage-title" className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Supported validators</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">Active and limited coverage comes from the shared provider registry, using official brand assets and current availability state.</p>
              </div>
              <ValidatorLoop />
            </div>
          </section>

          <FeaturesSection />
          <HealthScoreSection />
          <AnalyticsSection />
          <ProvidersSection />
          <SecuritySection />

          <section className="relative overflow-hidden border-t border-slate-200/60 bg-gradient-to-br from-white via-blue-50/40 to-white px-4 py-20 sm:px-6 sm:py-24">
            <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-200/25 blur-[90px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-indigo-200/20 blur-[80px]" aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative mx-auto max-w-3xl text-center"
            >
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-[0_12px_28px_rgba(37,99,235,0.26),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-blue-900/10">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Run the next check with context.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
                Sign in to validate one key, compare up to 10 keys, and keep only the result details you choose to save.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_10px_28px_rgba(37,99,235,0.22)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  {user ? "Go to dashboard" : "Open the tester"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href="https://github.com/MuhammadTanveerAbbas/Keyping#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Read documentation
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </motion.div>
          </section>
        </main>

        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </MotionConfig>
  );
};

export default Landing;
