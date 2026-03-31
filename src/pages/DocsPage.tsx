import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Code, Zap, Shield, Clock } from "lucide-react";
import { PROVIDERS } from "@/lib/providers";

const quickStartSteps = [
  { step: "1", title: "Select Provider", desc: "Choose from 10+ supported API providers" },
  { step: "2", title: "Paste Your Key", desc: "Enter your API key securely  we never store the full key" },
  { step: "3", title: "Run Test", desc: "Get instant validation with health score & latency" },
  { step: "4", title: "Monitor", desc: "Track key health over time with alerts & history" },
];

const features = [
  { icon: Zap, title: "Instant Validation", desc: "Test API keys in real-time against live endpoints" },
  { icon: Shield, title: "Secure by Design", desc: "Only the last 4 characters of keys are ever stored" },
  { icon: Clock, title: "Expiry Alerts", desc: "Get notified before your API keys expire" },
];

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-white/70" />
            Documentation
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Learn how to use KeyPing effectively</p>
        </div>

        {/* Quick Start */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl card-accent overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222222]">
            <p className="font-sans font-semibold text-white text-sm">Quick Start</p>
            <p className="font-sans text-xs text-slate-500 mt-0.5">Get up and running in seconds</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStartSteps.map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg border border-[#222222]">
                  <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-white font-mono text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-white">{s.title}</p>
                    <p className="font-sans text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl card-accent overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222222]">
            <p className="font-sans font-semibold text-white text-sm">Key Features</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-lg border border-[#222222] hover:bg-white/[0.02] transition-colors">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 w-fit mb-3">
                    <Icon className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="font-sans font-semibold text-white text-sm">{title}</p>
                  <p className="font-sans text-sm text-slate-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supported Providers */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl card-accent overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222222]">
            <p className="font-sans font-semibold text-white text-sm">Supported Providers</p>
            <p className="font-sans text-xs text-slate-500 mt-0.5">All API providers currently supported for key validation</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PROVIDERS.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border border-[#222222] hover:bg-white/[0.02] transition-colors">
                  <Code className="h-4 w-4 text-white/70 shrink-0" />
                  <span className="font-sans text-sm font-medium text-slate-300">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl card-accent overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222222]">
            <p className="font-sans font-semibold text-white text-sm">Keyboard Shortcuts</p>
          </div>
          <div className="p-5 space-y-2">
            {[
              { keys: "⌘ + K", action: "Open command palette" },
              { keys: "⌘ + B", action: "Toggle sidebar" },
              { keys: "⌘ + J", action: "Toggle theme" },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="font-sans text-sm text-slate-300">{action}</span>
                <span className="font-mono text-xs bg-[#161616] border border-[#222222] text-slate-400 rounded px-2 py-0.5">{keys}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
