import { useAuth } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import {
  Key, Shield, Zap, ArrowRight, Lock, Clock, BarChart3, ChevronRight,
  Bot, Brain, CreditCard, Github, Twitter, StickyNote, Database, Wrench, Cloud,
  CheckCircle2, Mail, Heart, TrendingUp, Activity, AlertTriangle, Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { PROVIDERS } from "@/lib/providers";
import { motion, useInView } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const providerIcons: Record<string, LucideIcon> = {
  openai: Bot, groq: Zap, anthropic: Brain, stripe: CreditCard,
  github: Github, twitter: Twitter, notion: StickyNote, supabase: Database,
  aws: Cloud, gemini: Sparkles, custom: Wrench,
};

const EASE = [0.16, 1, 0.3, 1] as const;

function KeyPingLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#kp-grad-land)" />
      <circle cx="12" cy="14" r="5" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <rect x="16.5" y="13" width="9" height="2.2" rx="1.1" fill="white" />
      <rect x="22" y="15.2" width="2" height="2.5" rx="0.8" fill="white" />
      <rect x="18.5" y="15.2" width="2" height="1.8" rx="0.8" fill="white" />
      <circle cx="26" cy="8" r="3" fill="#22D3EE" opacity="0.9" />
      <circle cx="26" cy="8" r="1.5" fill="white" />
      <defs>
        <linearGradient id="kp-grad-land" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HeroTerminal() {
  const lines = [
    { cmd: "> keyping test sk-proj-abc123...", outputs: [
      { text: "✓ Provider detected: OpenAI", color: "text-blue-400" },
      { text: "✓ Key valid", color: "text-green-400" },
      { text: "✓ Rate limit: 90,000 TPM remaining", color: "text-white" },
      { text: "✓ Scopes: chat, embeddings, fine-tuning", color: "text-white" },
      { text: "✓ Health Score: 94/100", color: "text-green-400 animate-pulse", icon: true },
    ]},
  ];
  const [charIdx, setCharIdx] = useState(0);
  const [showOutputs, setShowOutputs] = useState(false);
  const [outputIdx, setOutputIdx] = useState(0);
  const cmd = lines[0].cmd;

  useEffect(() => {
    if (charIdx < cmd.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 40);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowOutputs(true), 300);
    return () => clearTimeout(t);
  }, [charIdx, cmd.length]);

  useEffect(() => {
    if (!showOutputs) return;
    if (outputIdx < lines[0].outputs.length) {
      const t = setTimeout(() => setOutputIdx(i => i + 1), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCharIdx(0); setShowOutputs(false); setOutputIdx(0);
    }, 3500);
    return () => clearTimeout(t);
  }, [showOutputs, outputIdx, lines]);

  return (
    <div className="bg-gradient-to-br from-[#000000] to-[#0a0a0a] border border-blue-500/40 rounded-2xl w-full max-w-2xl mx-auto overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.25)] hover:shadow-[0_0_50px_rgba(59,130,246,0.35)] transition-shadow relative scanline-overlay">
      <div className="bg-gradient-to-r from-[#050505] to-[#0a0a0a] border-b border-blue-500/30 px-5 py-3 flex items-center gap-2.5">
        <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
        <span className="font-mono text-xs text-blue-400/80 ml-2 flex items-center gap-2">
          <Zap className="h-3 w-3" />
          keyping-terminal
        </span>
      </div>
      <div className="p-6 font-mono text-sm min-h-[180px] relative z-10">
        <div className="flex items-start gap-1">
          <span className="text-green-400 mr-1">$</span>
          <span className="text-white">{cmd.slice(0, charIdx)}</span>
          {charIdx < cmd.length && (
            <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-0.5" />
          )}
        </div>
        {showOutputs && lines[0].outputs.slice(0, outputIdx).map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={`mt-2 ${line.color} flex items-center gap-2`}>
            <span>{line.text}</span>
            {line.icon && <CheckCircle2 className="h-4 w-4 text-green-400 inline-block animate-pulse" />}
          </motion.div>
        ))}
        {outputIdx === lines[0].outputs.length && showOutputs && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-green-400">$</span>
            <span className="inline-block w-2 h-5 bg-blue-400 terminal-cursor ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function LiveStats() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    supabase.from("key_tests").select("id", { count: "exact", head: true }).then(({ count: c }) => setCount(c ?? 0));
  }, []);

  const stats = [
    { label: "Supported Providers", value: 10, suffix: "+" },
    { label: "Average Validation Time", value: 2, suffix: "s" },
    { label: "Uptime", value: 99, suffix: ".9%" },
    { label: "Keys Validated", value: count ?? 50, suffix: "K+" },
  ];

  return (
    <section className="bg-slate-50 dark:bg-[#000000] border-y border-slate-200 dark:border-blue-500/20 py-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.04),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-40 pointer-events-none dark:block hidden bg-grid-dark" />
      <div className="max-w-5xl mx-auto relative z-10">
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Built for teams that move fast</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ label, value, suffix }) => (
            <div key={label} className="flex flex-col items-center">
              <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">
                <CountUp target={value} suffix={suffix} />
              </p>
              <p className="font-mono text-xs text-blue-500/70 dark:text-blue-300/70 uppercase tracking-widest mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY_CARDS = [
  {
    icon: Clock,
    problem: "Wasted hours debugging",
    solution: "You paste a key, get a result in under 2 seconds. No more guessing if the key is the problem.",
  },
  {
    icon: AlertTriangle,
    problem: "Keys expiring silently in prod",
    solution: "KeyPing shows expiry dates and sends alerts before your app breaks at 3am.",
  },
  {
    icon: Shield,
    problem: "Not knowing what a key can do",
    solution: "See the exact scopes and permissions attached to any key  before you ship.",
  },
  {
    icon: BarChart3,
    problem: "Hitting rate limits unexpectedly",
    solution: "Check remaining quota and rate limit windows before they become incidents.",
  },
  {
    icon: Key,
    problem: "Managing keys across environments",
    solution: "Bulk test dev, staging, and prod keys in one go. Spot the broken one instantly.",
  },
  {
    icon: Lock,
    problem: "Worried about key exposure",
    solution: "Keys are never stored. Tested at the edge and discarded. Only the last 4 chars are saved.",
  },
];

const PRICING = [
  {
    name: "Free", price: "$0", period: "/mo",
    features: ["50 validations/day", "3 providers", "No history"],
    cta: "Get Started", ctaVariant: "outline" as const, popular: false, locked: false,
  },
  {
    name: "Pro", price: "$12", period: "/mo",
    features: ["Unlimited validations", "All providers", "Full history", "Expiry alerts", "Bulk testing"],
    cta: "Available Soon", ctaVariant: "solid" as const, popular: true, locked: true,
  },
  {
    name: "Team", price: "$39", period: "/mo",
    features: ["Everything in Pro", "Team workspaces", "API access", "Priority support"],
    cta: "Coming Soon", ctaVariant: "outline" as const, popular: false, locked: true,
  },
];

/* ─────────────────────────────────────────────
   SECTION 1  Provider Health Score Bar Chart
───────────────────────────────────────────── */
const HEALTH_BARS = [
  { name: "OpenAI",    score: 94, color: "#3B82F6", icon: Bot },
  { name: "Anthropic", score: 91, color: "#A855F7", icon: Brain },
  { name: "Groq",      score: 97, color: "#22C55E", icon: Zap },
  { name: "Stripe",    score: 88, color: "#EAB308", icon: CreditCard },
  { name: "GitHub",    score: 99, color: "#06B6D4", icon: Github },
  { name: "Supabase",  score: 85, color: "#EC4899", icon: Database },
];

function HealthBarChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 px-4 sm:px-6 bg-white dark:bg-[#000000] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 font-mono text-xs text-green-600 dark:text-green-400 mb-5">
              <Activity className="h-3.5 w-3.5" /> LIVE HEALTH SCORES
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
              Know your key's health<br />
              <span className="text-blue-500 dark:text-blue-400">at a glance.</span>
            </h2>
            <p className="font-sans text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Every validation produces a 0–100 health score calculated from validity, rate limits, active scopes, and response latency. No more guessing.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "90–100", desc: "Excellent  fully operational", color: "bg-green-500" },
                { label: "70–89",  desc: "Good  minor limits apply",    color: "bg-blue-500" },
                { label: "50–69",  desc: "Fair  degraded performance",  color: "bg-yellow-400" },
                { label: "0–49",   desc: "Poor  action required",       color: "bg-red-500" },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${color} shrink-0`} />
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-14">{label}</span>
                  <span className="font-sans text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right  animated bars */}
          <div ref={ref} className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_30px_rgba(59,130,246,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-sm font-bold text-slate-700 dark:text-white">Provider Health Scores</span>
              <span className="font-mono text-xs text-slate-400 dark:text-blue-400/50 bg-slate-100 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="space-y-4">
              {HEALTH_BARS.map(({ name, score, color, icon: Icon }, i) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
                    </div>
                    <motion.span
                      className="font-mono text-sm font-bold"
                      style={{ color }}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: i * 0.12 + 0.4 }}
                    >
                      {score}
                    </motion.span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${score}%` } : {}}
                      transition={{ duration: 1, delay: i * 0.12, ease: [0.16,1,0.3,1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-blue-500/10 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40 uppercase tracking-widest">Avg Score</span>
              <motion.span
                className="font-display text-lg font-bold text-blue-500 dark:text-blue-400"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1, duration: 0.4 }}
              >
                {Math.round(HEALTH_BARS.reduce((s, b) => s + b.score, 0) / HEALTH_BARS.length)}/100
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 2  Latency Race Chart
───────────────────────────────────────────── */
const LATENCY_DATA = [
  { name: "Groq",      ms: 67,  color: "#22C55E" },
  { name: "OpenAI",    ms: 142, color: "#3B82F6" },
  { name: "Stripe",    ms: 89,  color: "#EAB308" },
  { name: "GitHub",    ms: 201, color: "#06B6D4" },
  { name: "Anthropic", ms: 178, color: "#A855F7" },
  { name: "Supabase",  ms: 115, color: "#EC4899" },
];
const MAX_MS = 250;

function LatencyRaceChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const sorted = [...LATENCY_DATA].sort((a, b) => a.ms - b.ms);

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-[#000000] border-y border-slate-100 dark:border-blue-500/10 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left  chart */}
          <div ref={ref} className="bg-white dark:bg-[#050505] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_30px_rgba(59,130,246,0.08)] order-2 lg:order-1">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-sm font-bold text-slate-700 dark:text-white">Response Latency</span>
              <span className="font-mono text-xs text-slate-400 dark:text-blue-400/50">milliseconds</span>
            </div>
            <div className="space-y-3">
              {sorted.map(({ name, ms, color }, i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-slate-500 dark:text-slate-400 w-20 shrink-0 text-right">{name}</span>
                  <div className="flex-1 h-7 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg flex items-center justify-end pr-2"
                      style={{ backgroundColor: color + "22", borderRight: `3px solid ${color}` }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${(ms / MAX_MS) * 100}%` } : {}}
                      transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16,1,0.3,1] }}
                    >
                      <motion.span
                        className="font-mono text-xs font-bold"
                        style={{ color }}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: i * 0.1 + 0.6 }}
                      >
                        {ms}ms
                      </motion.span>
                    </motion.div>
                    {/* Rank badge for fastest */}
                    {i === 0 && (
                      <motion.div
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 1.2, type: "spring" }}
                      />
                    )}
                  </div>
                  {i === 0 && (
                    <motion.span
                      className="font-mono text-[10px] text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full px-2 py-0.5 shrink-0"
                      initial={{ opacity: 0, x: 8 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 1.1 }}
                    >
                      fastest
                    </motion.span>
                  )}
                </div>
              ))}
            </div>
            {/* X-axis ticks */}
            <div className="mt-3 ml-[88px] flex justify-between">
              {[0, 50, 100, 150, 200, 250].map(v => (
                <span key={v} className="font-mono text-[9px] text-slate-300 dark:text-blue-500/20">{v}</span>
              ))}
            </div>
          </div>

          {/* Right copy */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 font-mono text-xs text-blue-600 dark:text-blue-400 mb-5">
              <Clock className="h-3.5 w-3.5" /> LATENCY BENCHMARKS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
              See exactly how fast<br />
              <span className="text-blue-500 dark:text-blue-400">each provider responds.</span>
            </h2>
            <p className="font-sans text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              KeyPing measures real round-trip latency to each provider's auth endpoint. Spot slow keys before they slow down your users.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Fastest recorded", value: "67ms", sub: "Groq", color: "text-green-500 dark:text-green-400" },
                { label: "Avg across providers", value: "132ms", sub: "All providers", color: "text-blue-500 dark:text-blue-400" },
                { label: "Slowest threshold", value: ">2s", sub: "Flagged as slow", color: "text-red-500 dark:text-red-400" },
                { label: "Measurement precision", value: "±5ms", sub: "Edge function", color: "text-purple-500 dark:text-purple-400" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-blue-500/10 rounded-xl p-3">
                  <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                  <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 3  Key Activity Graph + Illustration
───────────────────────────────────────────── */
const ACTIVITY_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const VALID_DATA   = [12, 19, 15, 28, 24, 8, 31];
const INVALID_DATA = [2,  1,  3,  1,  4,  0,  2];
const MAX_VAL = 35;

function ActivityGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // Build SVG polyline points for area chart
  const W = 400; const H = 120; const PAD = 10;
  const pts = (data: number[]) =>
    data.map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - (v / MAX_VAL) * (H - PAD * 2);
      return `${x},${y}`;
    }).join(" ");

  const validPts   = pts(VALID_DATA);
  const invalidPts = pts(INVALID_DATA);
  const validArea  = `${PAD},${H - PAD} ${validPts} ${W - PAD},${H - PAD}`;
  const invalidArea = `${PAD},${H - PAD} ${invalidPts} ${W - PAD},${H - PAD}`;

  return (
    <section className="py-20 px-4 sm:px-6 bg-white dark:bg-[#000000] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 font-mono text-xs text-purple-600 dark:text-purple-400 mb-5">
            <TrendingUp className="h-3.5 w-3.5" /> VALIDATION ANALYTICS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Track every validation,<br />
            <span className="text-blue-500 dark:text-blue-400">spot issues early.</span>
          </h2>
          <p className="font-sans text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Your full validation history in one view. See trends, catch spikes in failures, and know when keys start degrading.
          </p>
        </motion.div>

        {/* Main card */}
        <div ref={ref} className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(59,130,246,0.08)]">
          {/* Top bar */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-blue-500/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-display text-sm font-bold text-slate-700 dark:text-white">Weekly Validations</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Valid
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-red-400" /> Invalid
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.span
                className="font-display text-sm font-bold text-green-500 dark:text-green-400"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
              >
                ↑ 28%
              </motion.span>
              <span className="font-mono text-xs text-slate-400 dark:text-blue-400/40">vs last week</span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="px-6 pt-4 pb-2">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
              <defs>
                <linearGradient id="validGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="invalidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
                </linearGradient>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((t, i) => (
                  <line key={i}
                    x1={PAD} y1={PAD + (1 - t) * (H - PAD * 2)}
                    x2={W - PAD} y2={PAD + (1 - t) * (H - PAD * 2)}
                    stroke="currentColor" strokeOpacity="0.06" strokeWidth="1"
                    className="text-slate-900 dark:text-blue-400"
                  />
                ))}
              </defs>

              {/* Area fills */}
              <motion.polygon
                points={validArea}
                fill="url(#validGrad)"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <motion.polygon
                points={invalidArea}
                fill="url(#invalidGrad)"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              {/* Lines */}
              <motion.polyline
                points={validPts}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              />
              <motion.polyline
                points={invalidPts}
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              />

              {/* Dots on valid line */}
              {VALID_DATA.map((v, i) => {
                const x = PAD + (i / (VALID_DATA.length - 1)) * (W - PAD * 2);
                const y = H - PAD - (v / MAX_VAL) * (H - PAD * 2);
                return (
                  <motion.circle key={i} cx={x} cy={y} r="4"
                    fill="#3B82F6" stroke="white" strokeWidth="2"
                    className="dark:[stroke:#000]"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 300 }}
                  />
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between px-[10px] mt-1 mb-3">
              {ACTIVITY_DAYS.map(d => (
                <span key={d} className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40">{d}</span>
              ))}
            </div>
          </div>

          {/* Bottom stat row */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-blue-500/10 border-t border-slate-200 dark:border-blue-500/10">
            {[
              { label: "Total this week", value: VALID_DATA.reduce((a,b)=>a+b,0) + INVALID_DATA.reduce((a,b)=>a+b,0), suffix: " tests", color: "text-slate-900 dark:text-white" },
              { label: "Success rate",    value: Math.round(VALID_DATA.reduce((a,b)=>a+b,0) / (VALID_DATA.reduce((a,b)=>a+b,0) + INVALID_DATA.reduce((a,b)=>a+b,0)) * 100), suffix: "%", color: "text-green-500 dark:text-green-400" },
              { label: "Peak day",        value: "Thu", suffix: " · 28 tests", color: "text-blue-500 dark:text-blue-400" },
            ].map(({ label, value, suffix, color }) => (
              <div key={label} className="px-6 py-4 text-center">
                <motion.p
                  className={`font-display text-2xl font-bold ${color}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  {value}{suffix}
                </motion.p>
                <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating alert illustration */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, color: "text-green-500 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20", title: "All keys healthy", sub: "Last checked 2 min ago", delay: 0 },
            { icon: AlertTriangle, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", title: "Stripe key expiring", sub: "7 days remaining", delay: 0.1 },
            { icon: TrendingUp, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", title: "Rate limit at 82%", sub: "OpenAI · resets in 1h", delay: 0.2 },
          ].map(({ icon: Icon, color, bg, title, sub, delay }) => (
            <motion.div
              key={title}
              className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${bg}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay, duration: 0.4 }}
            >
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className={`font-sans text-sm font-semibold ${color}`}>{title}</p>
                <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Landing = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const howRef = useRef<HTMLElement>(null);
  const howInView = useInView(howRef, { once: true });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#000000]">
      <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const handleCTA = () => { if (user) navigate("/dashboard"); else navigate("/auth"); };
  const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE } };

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] relative overflow-x-hidden">
      {/* Dark mode hero glow */}
      <div className="fixed inset-0 pointer-events-none dark:block hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_80%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
      </div>
      {/* Light mode dot grid */}
      <div className="fixed inset-0 pointer-events-none dark:hidden block">
        <div className="absolute inset-0 bg-grid-light opacity-50" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 dark:bg-black/85 dark:border-blue-500/20 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyPingLogo size={32} />
            <span className="font-display text-lg font-bold text-slate-900 dark:text-white">KeyPing</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {[["How it works","#how"],["Features","#features"],["Providers","#providers"],["Pricing","#pricing"],["Security","#security"]].map(([label, href]) => (
              <a key={label} href={href} className="font-sans text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl px-4 py-2 transition-all dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {user ? "Dashboard" : "Get Started Free"} <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-500/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-blue-500/20 mt-3 pt-4 pb-2 flex flex-col gap-1">
            {[["How it works","#how"],["Features","#features"],["Providers","#providers"],["Pricing","#pricing"],["Security","#security"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-blue-500/5 transition-colors">
                {label}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate(user ? "/dashboard" : "/auth"); }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl px-4 py-3 transition-all min-h-[44px]"
            >
              {user ? "Dashboard" : "Get Started Free"} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <motion.div className="max-w-4xl mx-auto text-center relative z-10" initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.07 } } }}>
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-200 dark:border-blue-500/30 shadow-sm">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 tracking-widest uppercase font-semibold">Developer Tool</span>
              <span className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
            </motion.div>
            
            <motion.h1 {...fadeUp} className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
              Ping Any API Key.<br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">Know It Works.</span>
            </motion.h1>
            
            <motion.p {...fadeUp} className="font-sans text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Validate keys across <span className="font-semibold text-blue-600 dark:text-blue-400">10+ providers</span> in seconds. Check health scores, rate limits, and permissions from one dashboard.
            </motion.p>
            
            <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button 
                onClick={handleCTA} 
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-bold text-base rounded-xl px-8 py-4 transition-all shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105"
              >
                <Zap className="h-5 w-5" />
                Start Validating Free 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#providers" 
                className="group font-sans text-base text-slate-600 hover:text-slate-900 dark:text-blue-300 dark:hover:text-blue-200 flex items-center gap-2 transition-colors px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-blue-500/5"
              >
                <Shield className="h-4 w-4" />
                See Supported Providers 
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            {/* Feature badges */}
            <motion.div {...fadeUp} className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {[
                { icon: CheckCircle2, text: "No credit card", color: "text-green-600 dark:text-green-400" },
                { icon: Lock, text: "Keys never stored", color: "text-blue-600 dark:text-blue-400" },
                { icon: Zap, text: "Results in 2s", color: "text-purple-600 dark:text-purple-400" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-blue-500/20 shadow-sm">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span className="font-sans text-xs text-slate-600 dark:text-slate-300 font-medium">{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeUp} className="mt-8">
              <HeroTerminal />
            </motion.div>
          </motion.div>
        </section>

        {/* Provider marquee */}
        <section className="py-8 border-y border-slate-100 dark:border-blue-500/10 overflow-hidden">
          <p className="text-center font-mono text-xs text-slate-400 dark:text-blue-400/60 uppercase tracking-widest mb-4">Supported Providers</p>
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {[...PROVIDERS, ...PROVIDERS].map((p, i) => {
              const Icon = providerIcons[p.id] || Key;
              return (
                <span key={i} className="inline-flex items-center gap-2 font-mono text-sm text-slate-400 dark:text-blue-300/50 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                  <Icon className="h-4 w-4" /> {p.name}
                </span>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        {/* Stats */}
        <LiveStats />

        {/* Section 1  Health Score Bar Chart */}
        <HealthBarChart />

        {/* Providers grid */}
        <section id="providers" className="py-20 px-4 sm:px-6 bg-white dark:bg-[#000000]">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-3">Works with every major API</h2>
            <p className="font-sans text-slate-500 dark:text-slate-400 mb-10">Auto-detected from key pattern  no manual selection needed.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PROVIDERS.filter(p => p.id !== "custom").map((p, i) => {
                const Icon = providerIcons[p.id] || Key;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all cursor-default group">
                    <Icon className="h-5 w-5 text-slate-400 dark:text-blue-400/60 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="font-mono text-xs text-slate-500 dark:text-blue-300/50 group-hover:text-slate-700 dark:group-hover:text-blue-300 transition-colors">{p.name}</span>
                    <span className="font-mono text-[10px] text-blue-500 dark:text-blue-500/60 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-full px-2 py-0.5">Auto-detected</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3  Activity Graph */}
        <ActivityGraph />

        {/* Section 2  Latency Race Chart */}
        <LatencyRaceChart />

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-[#000000] border-y border-slate-100 dark:border-blue-500/10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple pricing. No surprises.</h2>
            <p className="font-sans text-slate-500 dark:text-slate-400 mb-10">Start free, upgrade when you need more.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {PRICING.map(({ name, price, period, features, cta, ctaVariant, popular, locked }) => (
                <div key={name} className={`relative rounded-2xl border p-6 text-left transition-all ${
                  popular
                    ? "bg-white dark:bg-[#000000] border-blue-500 dark:border-blue-500/60 scale-105 shadow-lg dark:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    : "bg-white dark:bg-[#000000] border-slate-200 dark:border-blue-500/20"
                }`}>
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  {locked && (
                    <span className="absolute top-4 right-4 font-mono text-[10px] text-slate-400 dark:text-blue-400/40 bg-slate-100 dark:bg-blue-500/5 border border-slate-200 dark:border-blue-500/10 rounded-full px-2 py-0.5 uppercase tracking-widest">
                      {name === "Pro" ? "Available Soon" : "Coming Soon"}
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                    <span className="font-sans text-slate-500 dark:text-slate-400">{period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2 font-sans text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={locked ? undefined : handleCTA}
                    disabled={locked}
                    className={`w-full rounded-xl py-2.5 font-sans font-semibold text-sm transition-all ${
                      locked
                        ? "border border-slate-200 dark:border-blue-500/10 text-slate-400 dark:text-blue-400/30 cursor-not-allowed"
                        : ctaVariant === "solid"
                          ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          : "border border-slate-300 dark:border-blue-500/30 text-slate-700 dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-blue-500/5"
                    }`}
                  >
                    {cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why KeyPing */}
        <section id="features" className="py-24 px-4 sm:px-6 bg-white dark:bg-[#000000] relative overflow-hidden">
          {/* subtle background accent */}
          <div className="absolute inset-0 pointer-events-none dark:block hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.05),transparent_70%)]" />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            {/* heading */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="text-center mb-14">
              <span className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 tracking-widest uppercase">· Why KeyPing</span>
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Built to solve real problems</h2>
              <p className="font-sans text-slate-500 dark:text-slate-400 max-w-md mx-auto">No fake quotes. Just the actual reasons developers reach for KeyPing.</p>
            </motion.div>

            {/* cards grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {WHY_CARDS.map(({ icon: Icon, problem, solution }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                  className="group relative bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/15 hover:border-blue-400 dark:hover:border-blue-500/40 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] overflow-hidden"
                >
                  {/* card glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />

                  {/* icon */}
                  <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:border-blue-300 dark:group-hover:border-blue-500/40 transition-all duration-200">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* problem pill */}
                  <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-400/80" />
                    <span className="font-mono text-[10px] text-red-500 dark:text-red-400/80 uppercase tracking-wide">{problem}</span>
                  </div>

                  {/* solution */}
                  <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{solution}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-[#000000] border-y border-slate-100 dark:border-blue-500/10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">We never store your full key  ever.</h2>
            <p className="font-sans text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your API key is transmitted securely to our edge functions, tested against the provider, and immediately discarded. Only the last 4 characters are saved as a preview.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-4 sm:px-6 bg-blue-600 dark:bg-[#000000] dark:border-y dark:border-blue-500/30 relative overflow-hidden">
          <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="font-display text-4xl font-extrabold text-white mb-3">Stop guessing. Start pinging.</h2>
            <p className="font-sans text-blue-100 dark:text-blue-400/70 mb-8">Free forever. No credit card required.</p>
            <button onClick={handleCTA} className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-blue-500 dark:text-black dark:hover:bg-blue-400 font-sans font-bold text-sm rounded-xl px-8 py-3 transition-all dark:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Get Started Free 
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 dark:bg-[#000000] border-t border-slate-200 dark:border-blue-500/20 py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <KeyPingLogo size={28} />
                  <span className="font-display text-base font-bold text-slate-900 dark:text-white">KeyPing</span>
                </div>
                <p className="font-sans text-sm text-slate-500 dark:text-slate-400">Ping any API key. Know it works.</p>
                <p className="font-mono text-xs text-slate-400 dark:text-blue-400/40">© 2025 Muhammad Tanveer Abbas</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Product</h4>
                <div className="flex flex-col gap-2">
                  <Link to="/dashboard" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
                  <a href="#providers" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Providers</a>
                  <a href="#pricing" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Resources</h4>
                <div className="flex flex-col gap-2">
                  <Link to="/dashboard/docs" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentation</Link>
                  <a href="https://themvpguy.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</a>
                  <a href="mailto:contact@keyping.dev" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</a>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Legal</h4>
                <div className="flex flex-col gap-2">
                  <Link to="/privacy" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
                  <a href="mailto:contact@keyping.dev" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Contact</a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-blue-500/10 pt-6 flex justify-between items-center">
              <p className="font-mono text-xs text-slate-400 dark:text-blue-400/40">
                <a href="https://themvpguy.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">themvpguy.vercel.app</a>
              </p>
              <p className="font-mono text-xs text-slate-400 dark:text-blue-400/40 flex items-center gap-1">
                Built with <Heart className="h-3 w-3 text-red-500 mx-1" /> for developers
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
