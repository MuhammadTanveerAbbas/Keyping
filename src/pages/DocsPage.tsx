import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Code, Zap, Shield, Clock } from "lucide-react";
import { PROVIDERS } from "@/lib/providers";
import { PageHeader, PageShell, Panel } from "@/components/dashboard/ui";

const quickStartSteps = [
  { step: "1", title: "Select provider", desc: "Pick from the list or let auto-detect identify the key" },
  { step: "2", title: "Paste your key", desc: "The full secret is used once for validation, then discarded" },
  { step: "3", title: "Run test", desc: "Get status, latency, scopes, and a health score" },
  { step: "4", title: "Save & monitor", desc: "Optional save with nickname; track history and alerts" },
];

const features = [
  { icon: Zap, title: "Live validation", desc: "Tests against real provider endpoints via edge functions" },
  { icon: Shield, title: "Preview-only storage", desc: "Only the last four characters are persisted" },
  { icon: Clock, title: "Expiry reminders", desc: "In-app alerts when keys approach their expiry date" },
];

export default function DocsPage() {
  useEffect(() => {
    document.title = "Documentation | KeyPing";
  }, []);

  return (
    <DashboardLayout>
      <PageShell width="md">
        <PageHeader
          title="Documentation"
          description="How KeyPing works and what each dashboard section does."
        />

        <Panel title="Quick start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickStartSteps.map((s) => (
              <div key={s.step} className="flex gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Features">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Supported providers" description="AWS and Supabase have limited validation support">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2">
                <Code className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Keyboard shortcuts">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
            {[
              { keys: "⌘ + K", action: "Open command palette (dashboard)" },
              { keys: "Header icon", action: "Toggle light / dark theme" },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">{action}</span>
                <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </Panel>
      </PageShell>
    </DashboardLayout>
  );
}
