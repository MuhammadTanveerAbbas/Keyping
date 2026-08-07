import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import {
  Key, Shield, Zap, ArrowRight, Lock, Clock, BarChart3, ChevronRight,
  CheckCircle2, TrendingUp, Activity, AlertTriangle,
  EyeOff, Server, TerminalSquare,
  Sparkles, Code2, BarChart4, Tag, LayoutDashboard,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { PROVIDERS } from "@/lib/providers";
import { motion, useInView } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { BRAND_ICONS } from "@/components/BrandIcons";
import { Footer } from "@/components/Footer";
import type { LucideIcon } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const NAV_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Features", href: "#features", icon: LayoutDashboard },
  { label: "Providers", href: "#providers", icon: Code2 },
  { label: "Analytics", href: "#analytics", icon: BarChart4 },
  { label: "Pricing", href: "#pricing", icon: Tag },
];

const HERO_TERMINAL = {
  cmd: "$ keyping test sk-proj-abc123...",
  outputs: [
    { text: "▶ Provider detected: OpenAI", color: "text-cyan-400", bold: true },
    { text: "  ✓ Status: Valid", color: "text-emerald-400", bold: false },
    { text: "  ✓ Rate limit: 90,000 TPM remaining", color: "text-slate-300", bold: false },
    { text: "  ✓ Scopes: chat, embeddings, fine-tuning", color: "text-slate-300", bold: false },
    { text: "  ✓ Health Score: 94/100", color: "text-emerald-400", bold: true, icon: true },
  ],
};

function HeroTerminal() {
  const [charIdx, setCharIdx] = useState(0);
  const [showOutputs, setShowOutputs] = useState(false);
  const [outputIdx, setOutputIdx] = useState(0);
  const cmd = HERO_TERMINAL.cmd;

  useEffect(() => {
    if (charIdx < cmd.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 35);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowOutputs(true), 400);
    return () => clearTimeout(t);
  }, [charIdx, cmd.length]);

  useEffect(() => {
    if (!showOutputs) return;
    if (outputIdx < HERO_TERMINAL.outputs.length) {
      const t = setTimeout(() => setOutputIdx(i => i + 1), 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCharIdx(0); setShowOutputs(false); setOutputIdx(0);
    }, 4000);
    return () => clearTimeout(t);
  }, [showOutputs, outputIdx]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-3xl opacity-60" />
      <div className="relative bg-[#0c0c14] border border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.15),0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="bg-gradient-to-b from-[#12121c] to-[#0f0f18] border-b border-slate-700/40 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors cursor-pointer shadow-[0_0_4px_rgba(255,95,87,0.4)]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors cursor-pointer shadow-[0_0_4px_rgba(254,188,46,0.4)]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors cursor-pointer shadow-[0_0_4px_rgba(40,200,64,0.4)]" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <TerminalSquare className="h-3 w-3" />
            <span className="font-mono text-[11px] tracking-wide">keyping ~ bash</span>
          </div>
          <div className="w-16" />
        </div>
        <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[200px] bg-[#0c0c14]">
          <div className="flex items-start">
            <span className="text-emerald-400 mr-2 select-none">❯</span>
            <span className="text-slate-200">{cmd.slice(0, charIdx)}</span>
            {charIdx < cmd.length && (
              <span className="inline-block w-[7px] h-[16px] bg-blue-400 animate-pulse ml-0.5 rounded-[1px]" />
            )}
          </div>
          {showOutputs && (
            <div className="mt-3 space-y-1">
              {HERO_TERMINAL.outputs.slice(0, outputIdx).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`${line.color} ${line.bold ? 'font-semibold' : ''} flex items-center gap-2`}
                >
                  <span>{line.text}</span>
                  {line.icon && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </motion.div>
              ))}
            </div>
          )}
          {outputIdx === HERO_TERMINAL.outputs.length && showOutputs && (
            <div className="flex items-center mt-3">
              <span className="text-emerald-400 mr-2 select-none">❯</span>
              <span className="inline-block w-[7px] h-[16px] bg-slate-400/60 terminal-cursor rounded-[1px]" />
            </div>
          )}
        </div>
        <div className="border-t border-slate-700/30 px-4 py-1.5 flex items-center justify-between bg-[#0a0a12]">
          <span className="font-mono text-[10px] text-slate-600">utf-8</span>
          <span className="font-mono text-[10px] text-slate-600">Ln 1, Col 1</span>
          <span className="font-mono text-[10px] text-blue-400/60">● connected</span>
        </div>
      </div>
    </div>
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
    solution: "Set expiry reminders and get alerts before your app breaks.",
  },
  {
    icon: Shield,
    problem: "Not knowing what a key can do",
    solution: "See the exact scopes and permissions attached to any key before you ship.",
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
    solution: "Full keys are never stored. Tested at the edge and discarded. Only the last 4 chars are saved.",
  },
];

const PRICING = [
  {
    name: "Free", price: "$0", period: "/mo",
    features: ["API key validation", "All supported providers", "Test history & stats", "Google sign-in"],
    cta: "Get Started", ctaVariant: "outline" as const, popular: false, locked: false,
  },
  {
    name: "Pro", price: "$12", period: "/mo",
    features: ["Higher usage limits", "Expiry alerts", "Bulk testing", "Export reports"],
    cta: "Available Soon", ctaVariant: "solid" as const, popular: true, locked: true,
  },
  {
    name: "Team", price: "$39", period: "/mo",
    features: ["Everything in Pro", "Team workspaces", "Shared results", "Priority support"],
    cta: "Coming Soon", ctaVariant: "outline" as const, popular: false, locked: true,
  },
];

const HEALTH_FACTORS = [
  { label: "Validity", score: 100, icon: CheckCircle2, color: "#10B981", desc: "Key is active and recognized" },
  { label: "Rate Limit", score: 85, icon: Zap, color: "#3B82F6", desc: "90,000 TPM remaining" },
  { label: "Scopes", score: 90, icon: Shield, color: "#8B5CF6", desc: "chat, embeddings, fine-tuning" },
  { label: "Latency", score: 95, icon: Activity, color: "#06B6D4", desc: "142ms avg response" },
];

function HealthScoreSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const overallScore = Math.round(HEALTH_FACTORS.reduce((s, f) => s + f.score, 0) / HEALTH_FACTORS.length);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 overflow-hidden bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-14 sm:mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 border border-emerald-200/50 text-xs text-emerald-600 font-medium mb-5">
            <Activity className="h-3.5 w-3.5" /> Health Score
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
            One score that tells<br /><span className="text-blue-600">the whole story.</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            Every key gets a 0–100 health score based on validity, rate limits, permissions, and response latency.
          </p>
        </motion.div>

        <div ref={ref} className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Key Health Report</p>
                    <p className="text-[11px] text-slate-400">sk-proj-abc123...xyz</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">Live Preview</span>
              </div>
              <div className="px-5 sm:px-6 py-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {HEALTH_FACTORS.map(({ label, score, icon: Icon, color, desc }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">{label}</span>
                          <span className="text-xs font-bold" style={{ color }}>{score}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200/60 overflow-hidden mb-1.5">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                            initial={{ width: 0 }} animate={inView ? { width: score + '%' } : {}}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.16,1,0.3,1] }} />
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <motion.circle cx="20" cy="20" r="16" fill="none" stroke="url(#scoreGrad)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={100.53}
                        initial={{ strokeDashoffset: 100.53 }}
                        animate={inView ? { strokeDashoffset: 100.53 * (1 - overallScore / 100) } : {}}
                        transition={{ duration: 1, delay: 0.5, ease: [0.16,1,0.3,1] }} />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{overallScore}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Overall Health</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Excellent - fully operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <motion.p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}>
                    {overallScore}/100
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const LATENCY_DATA = [
  { name: "Groq", ms: 67, color: "#22C55E" },
  { name: "OpenAI", ms: 142, color: "#3B82F6" },
  { name: "Stripe", ms: 89, color: "#EAB308" },
  { name: "GitHub", ms: 201, color: "#06B6D4" },
  { name: "Anthropic", ms: 178, color: "#A855F7" },
  { name: "Notion", ms: 115, color: "#EC4899" },
];
const MAX_MS = 250;

const ACTIVITY_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const VALID_DATA  = [12, 19, 15, 28, 24, 8, 31];
const INVALID_DATA = [2, 1, 3, 1, 4, 0, 2];
const MAX_VAL = 35;

function AnalyticsSection() {
  const chartRef = useRef<HTMLDivElement>(null);
  const latencyRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-80px" });
  const latencyInView = useInView(latencyRef, { once: true, margin: "-80px" });
  const sorted = [...LATENCY_DATA].sort((a, b) => a.ms - b.ms);

  const W = 400; const H = 100; const PAD = 10;
  const getPoints = (data: number[]) => data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - (v / MAX_VAL) * (H - PAD * 2),
  }));

  const smoothLine = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0]!.x},${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!; const p1 = pts[i]!;
      const p2 = pts[i + 1]!; const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
      const t = 0.3;
      path += ` C ${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const smoothArea = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    return `${smoothLine(pts)} L ${pts[pts.length - 1]!.x},${H - PAD} L ${pts[0]!.x},${H - PAD} Z`;
  };

  const validPoints = getPoints(VALID_DATA);
  const invalidPoints = getPoints(INVALID_DATA);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-14 sm:mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50/80 border border-violet-200/50 text-xs text-violet-600 font-medium mb-5">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics & Latency
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
            Track validations.<br /><span className="text-blue-600">Measure speed.</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            See your full validation history and provider response times in one dashboard. Spot issues before they become incidents.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div ref={chartRef} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-800">Weekly Activity</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-500" /> Valid</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-red-400" /> Invalid</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Preview</span>
            </div>
            <div className="px-5 pt-4 pb-2">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
                <defs>
                  <linearGradient id="validGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="invalidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <motion.path d={smoothArea(validPoints)} fill="url(#validGrad)" initial={{ opacity: 0 }} animate={chartInView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.3 }} />
                <motion.path d={smoothArea(invalidPoints)} fill="url(#invalidGrad)" initial={{ opacity: 0 }} animate={chartInView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.5 }} />
                <motion.path d={smoothLine(validPoints)} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={chartInView ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }} />
                <motion.path d={smoothLine(invalidPoints)} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" initial={{ pathLength: 0, opacity: 0 }} animate={chartInView ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }} />
                {validPoints.map((p, i) => (
                  <motion.circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3B82F6" stroke="white" strokeWidth="2" initial={{ scale: 0, opacity: 0 }} animate={chartInView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 300 }} />
                ))}
              </svg>
              <div className="flex justify-between px-1 mt-1 mb-3">
                {ACTIVITY_DAYS.map(d => <span key={d} className="text-[10px] text-slate-400 font-medium">{d}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-slate-100">
              {[
                { label: "Tests", value: VALID_DATA.reduce((a,b)=>a+b,0) + INVALID_DATA.reduce((a,b)=>a+b,0), color: "text-slate-900" },
                { label: "Success", value: Math.round(VALID_DATA.reduce((a,b)=>a+b,0) / (VALID_DATA.reduce((a,b)=>a+b,0) + INVALID_DATA.reduce((a,b)=>a+b,0)) * 100) + "%", color: "text-emerald-600" },
                { label: "Peak", value: "Thu", color: "text-blue-600" },
              ].map(({ label, value, color }, i) => (
                <div key={label} className={`px-4 py-3 text-center ${i < 2 ? 'border-r border-slate-100' : ''}`}>
                  <motion.p className={`text-lg font-bold ${color}`} initial={{ opacity: 0, y: 6 }} animate={chartInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}>{value}</motion.p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div ref={latencyRef} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-slate-800">Response Times</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Preview</span>
            </div>
            <div className="space-y-3">
              {sorted.map(({ name, ms, color }, i) => {
                const BrandIcon = BRAND_ICONS[name.toLowerCase()] || null;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      {BrandIcon ? <BrandIcon className="h-4 w-4 text-slate-400 shrink-0" /> : <Clock className="h-4 w-4 text-slate-400 shrink-0" />}
                      <span className="text-xs text-slate-600 font-medium truncate">{name}</span>
                    </div>
                    <div className="flex-1 h-6 bg-slate-50 rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                        initial={{ width: 0 }}
                        animate={latencyInView ? { width: `${(ms / MAX_MS) * 100}%` } : {}}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16,1,0.3,1] }}
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow-sm">{ms}ms</span>
                      </motion.div>
                    </div>
                    {i === 0 && (
                      <motion.span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 shrink-0 font-medium"
                        initial={{ opacity: 0, x: 8, scale: 0.9 }} animate={latencyInView ? { opacity: 1, x: 0, scale: 1 } : {}} transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}>
                        fastest
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 ml-[104px] flex justify-between">
              {[0, 50, 100, 150, 200, 250].map(v => <span key={v} className="text-[9px] text-slate-400 font-mono">{v}ms</span>)}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
              {[
                { label: "Fastest", value: "Groq", sub: "67ms avg" },
                { label: "Slowest", value: "GitHub", sub: "201ms avg" },
                { label: "Avg RTT", value: "132ms", sub: "All providers" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="text-center">
                  <p className="text-sm font-bold text-slate-800">{value}</p>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const handleCTA = () => { if (user) navigate("/dashboard"); else navigate("/auth"); };
  const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE } };

  return (
    <div className="min-h-screen bg-white relative">
      <div className="fixed inset-0 pointer-events-none hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_80%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-light opacity-60" />
      </div>
      <div className="fixed inset-0 pointer-events-none block">
        <div className="absolute inset-0 bg-grid-light opacity-50" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-4 sm:px-6 py-3 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyPingLogo size={30} />
            <span className="font-display text-lg font-bold text-slate-900 tracking-tight">KeyPing</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} className="group flex items-center gap-1.5 font-sans text-[13px] text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-2 rounded-lg transition-all duration-200">
                <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-medium text-[13px] rounded-lg px-4 py-2 shadow-sm shadow-blue-500/20 transition-all duration-200"
            >
              {user ? "Dashboard" : "Get Started"} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />
          <div className="absolute top-32 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-48 right-1/4 w-48 h-48 bg-indigo-500/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

          <motion.div className="max-w-4xl mx-auto text-center relative z-10" initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div {...fadeUp} className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-indigo-500/5 border border-blue-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-xs text-blue-600 tracking-wide font-medium uppercase">Developer Tool for API Keys</span>
            </motion.div>

            <motion.h1 {...fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 tracking-[-0.04em] leading-[1.07] mb-6">
              Ping Any API Key.<br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">Know It Works.</span>
            </motion.h1>

            <motion.p {...fadeUp} className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Validate keys across <span className="font-semibold text-slate-700">10+ providers</span> in seconds. Check health scores, rate limits, and permissions from one dashboard.
            </motion.p>

            <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={handleCTA}
                className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base rounded-xl px-8 py-4 transition-all duration-200 shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="h-4.5 w-4.5" />
                Start Validating Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#providers"
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-base transition-colors px-5 py-3 rounded-xl hover:bg-slate-100/60"
              >
                <Shield className="h-4 w-4" />
                See Supported Providers
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            <motion.div {...fadeUp} className="flex flex-wrap items-center justify-center gap-4 mb-14">
              {[
                { icon: CheckCircle2, text: "No credit card" },
                { icon: Lock, text: "Full keys never stored" },
                { icon: Zap, text: "Results in 2s" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50/80 border border-slate-200/60">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeUp}>
              <HeroTerminal />
            </motion.div>
          </motion.div>
        </section>

        <section id="how" className="py-0" />
        <HealthScoreSection />

         <section id="providers" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/40">
          <div className="max-w-6xl mx-auto">
            <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-200/50 text-xs text-blue-600 font-medium mb-5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Supported Providers
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Works with every major API</h2>
              <p className="text-slate-500 text-[15px]">Auto-detected from key pattern - no manual selection needed.</p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-14">
              {PROVIDERS.filter(p => p.id !== "custom").map((p, i) => {
                const BrandIcon = BRAND_ICONS[p.id];
                const limited = p.id === "aws";
                const descriptions: Record<string, string> = {
                  openai: "GPT-4, DALL-E models",
                  groq: "Ultra-fast LLM inference",
                  anthropic: "Claude AI assistant",
                  stripe: "Payment processing API",
                  github: "Code repository access",
                  twitter: "Social media data",
                  notion: "Workspace integration tool",
                  supabase: "Open source backend",
                  aws: "Cloud infrastructure services",
                  gemini: "Google AI models",
                };
                const brandColors: Record<string, string> = {
                  openai: "#10A37F",
                  groq: "#F55036",
                  anthropic: "#CC785C",
                  stripe: "#635BFF",
                  github: "#24292F",
                  twitter: "#000000",
                  notion: "#000000",
                  supabase: "#3ECF8E",
                  aws: "#FF9900",
                  gemini: "#4285F4",
                };
                const color = brandColors[p.id] || "#3B82F6";
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="provider-card bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 cursor-default group hover:shadow-lg"
                    data-brand-color={color}
                  >
                    <div className="provider-icon-wrapper h-14 w-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-3 transition-all duration-300">
                      {BrandIcon ? (
                        <BrandIcon className="provider-icon h-7 w-7 text-slate-500 transition-colors duration-300" />
                      ) : (
                        <Key className="provider-icon h-7 w-7 text-slate-500 transition-colors duration-300" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 block mb-1">{p.name}</span>
                    <span className="text-[11px] text-slate-500 leading-snug block mb-3 min-h-[32px]">{descriptions[p.id] || "API key validation"}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1 transition-colors ${
                      limited
                        ? "text-amber-700 bg-amber-50 border border-amber-200 ring-1 ring-amber-100"
                        : "text-emerald-700 bg-emerald-50 border border-emerald-200 ring-1 ring-emerald-100"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${limited ? "bg-amber-500" : "bg-emerald-500"}`} />
                      {limited ? "Limited" : "Auto"}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              id="security"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <EyeOff className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Full keys never stored</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Tested at the edge and immediately discarded</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Lock className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">End-to-end secure</p>
                  <p className="text-xs text-slate-400 leading-relaxed">TLS encrypted, only last 4 chars saved</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Server className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Edge validated</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Serverless functions close to providers</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="analytics">
          <AnalyticsSection />
        </section>

        <section id="pricing" className="py-24 sm:py-28 px-4 sm:px-6 bg-slate-50/50 border-y border-slate-200/50">
          <div className="max-w-5xl mx-auto">
            <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-200/50 text-xs text-blue-600 font-medium mb-5">
                <Zap className="h-3.5 w-3.5" /> Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                Simple pricing.<br /><span className="text-blue-600">No surprises.</span>
              </h2>
              <p className="text-slate-500 max-w-md mx-auto text-[15px]">Start free, upgrade when you need more.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
              {PRICING.map(({ name, price, period, features, cta, ctaVariant, popular, locked }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }}
                  className={`relative rounded-2xl border p-7 lg:p-8 text-left transition-all duration-300 ${
                    popular
                      ? "bg-white border-blue-500/50 md:scale-105 shadow-[0_8px_40px_rgba(59,130,246,0.12)] hover:shadow-[0_12px_50px_rgba(59,130,246,0.18)]"
                      : "bg-white border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                  }`}>
                  {popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  )}
                  {locked && (
                    <span className="absolute top-5 right-5 text-[10px] text-slate-400 bg-slate-100 border border-slate-200/80 rounded-full px-2.5 py-1 uppercase tracking-wider font-medium">
                      {name === "Pro" ? "Available Soon" : "Coming Soon"}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">{price}</span>
                    <span className="text-slate-400 text-sm ml-1">{period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={locked ? undefined : handleCTA}
                    disabled={locked}
                    className={`w-full rounded-xl py-3 font-semibold text-sm transition-all duration-200 ${
                      locked
                        ? "border border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                        : ctaVariant === "solid"
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {cta}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 sm:py-28 px-4 sm:px-6 bg-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.03),transparent_70%)]" />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-200/50 text-xs text-blue-600 font-medium mb-5">
                <Shield className="h-3.5 w-3.5" /> Why KeyPing
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                Built to solve<br /><span className="text-blue-600">real problems.</span>
              </h2>
              <p className="text-slate-500 max-w-md mx-auto text-[15px]">No fake quotes. Just the actual reasons developers reach for KeyPing.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {WHY_CARDS.map(({ icon: Icon, problem, solution }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16,1,0.3,1] }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white border border-slate-200/80 hover:border-blue-400/50 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="h-10 w-10 rounded-lg bg-blue-50/80 border border-blue-100/60 flex items-center justify-center mb-4 group-hover:bg-blue-100/80 group-hover:border-blue-200 transition-all duration-200">
                    <Icon className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">{problem}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{solution}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/15 rounded-full blur-[80px]" />
          </div>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Stop guessing. Start pinging.</h2>
            <p className="text-blue-100/90 mb-10 text-lg">Free forever. No credit card required.</p>
            <button onClick={handleCTA} className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base rounded-xl px-10 py-4 transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0">
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
