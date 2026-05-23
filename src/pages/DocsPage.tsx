import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Code, Zap, Shield, Clock } from "lucide-react";
import { PROVIDERS } from "@/lib/providers";

const quickStartSteps = [
  { step: "1", title: "Select Provider", desc: "Choose from 10+ supported API providers" },
  { step: "2", title: "Paste Your Key", desc: "Enter your API key securely — we never store the full key" },
  { step: "3", title: "Run Test", desc: "Get instant validation with health score & latency" },
  { step: "4", title: "Monitor", desc: "Track key health over time with alerts & history" },
];

const features = [
  { icon: Zap, title: "Instant Validation", desc: "Test API keys in real-time against live endpoints" },
  { icon: Shield, title: "Secure by Design", desc: "Only the last 4 characters of keys are ever stored" },
  { icon: Clock, title: "Expiry Alerts", desc: "Get notified before your API keys expire" },
];

export default function DocsPage() {
  useEffect(() => {
    document.title = "Documentation | KeyPing";
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            Documentation
          </h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">Learn how to use KeyPing effectively</p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans font-semibold text-card-foreground text-sm">Quick Start</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">Get up and running in seconds</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStartSteps.map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-card-foreground">{s.title}</p>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans font-semibold text-card-foreground text-sm">Key Features</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="bg-accent border border-border rounded-lg p-2.5 w-fit mb-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-sans font-semibold text-card-foreground text-sm">{title}</p>
                  <p className="font-sans text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans font-semibold text-card-foreground text-sm">Supported Providers</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">All API providers currently supported for key validation</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PROVIDERS.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <Code className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-sans text-sm font-medium text-card-foreground">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans font-semibold text-card-foreground text-sm">Keyboard Shortcuts</p>
          </div>
          <div className="p-5 space-y-2">
            {[
              { keys: "⌘ + K", action: "Open command palette" },
              { keys: "⌘ + B", action: "Toggle sidebar" },
              { keys: "⌘ + J", action: "Toggle theme" },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
                <span className="font-sans text-sm text-card-foreground">{action}</span>
                <span className="font-mono text-xs bg-accent border border-border text-muted-foreground rounded px-2 py-0.5">{keys}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
