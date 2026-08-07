import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useHistory } from "@/hooks/useHistory";
import { PROVIDERS } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Copy, Key, Shield, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell, Panel, Stat, StatGrid, EmptyState, SkeletonBlock, dashSelectTrigger, dashSelectContent } from "@/components/dashboard/ui";
import { format } from "date-fns";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { tests, loading, deleteTest, filterProvider, setFilterProvider, filterStatus, setFilterStatus } = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPreview = (preview: string) => {
    navigator.clipboard.writeText(`****${preview}`);
    toast.success("Key preview copied");
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTest(id);
    if (success) toast.success("Deleted");
    else toast.error("Failed to delete");
  };

  const providerName = (id: string) => PROVIDERS.find((p) => p.id === id)?.name || id;

  const statusIcon = (s: string) => {
    if (s === "valid") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    if (s === "invalid") return <XCircle className="h-3 w-3 text-red-400" />;
    return <AlertTriangle className="h-3 w-3 text-amber-400" />;
  };

  const getChangelog = (nickname: string | null, currentId: string) => {
    if (!nickname) return [];
    return tests.filter((t) => t.nickname === nickname && t.id !== currentId).slice(0, 5);
  };

  const validKeys = tests.filter((k) => k.status === "valid");
  const unhealthy = tests.filter((k) => k.status !== "valid").length;

  return (
    <DashboardLayout>
      <PageShell>
        <PageHeader
          title="History & Vault"
          description="Filter, expand, and manage saved results. Full keys are never stored."
          action={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600")}>
                  <List className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode("cards")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "cards" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600")}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          }
        />

        <StatGrid cols={3}>
          <Stat icon={Key} label="Total saved" value={tests.length} />
          <Stat icon={Shield} label="Valid" value={validKeys.length} tone="success" />
          <Stat icon={Key} label="Needs attention" value={unhealthy} tone={unhealthy > 0 ? "warning" : "default"} />
        </StatGrid>

        <div className="flex flex-wrap gap-3">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className={`w-40 ${dashSelectTrigger}`}>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className={dashSelectContent}>
              <SelectItem value="all">All providers</SelectItem>
              {PROVIDERS.filter((p) => p.id !== "custom").map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className={`w-36 ${dashSelectTrigger}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={dashSelectContent}>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
        ) : tests.length === 0 ? (
          <Panel>
            <EmptyState icon={CheckCircle2} title="No saved tests" description="Results appear here after you save a test from the tester." />
          </Panel>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {tests.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ProviderIconBadge provider={t.provider} className="h-6 w-6" />
                    <span className="text-sm font-medium text-slate-800 truncate">{t.nickname || providerName(t.provider)}</span>
                  </div>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <p className="font-mono text-xs text-slate-500 mb-3">
                  {revealedKeys.has(t.id) ? `****${t.key_preview}` : "••••••••"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">{format(new Date(t.tested_at), "MMM d, yyyy")}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleReveal(t.id)} aria-label={revealedKeys.has(t.id) ? "Hide preview" : "Show preview"}>
                      {revealedKeys.has(t.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyPreview(t.key_preview)} aria-label="Copy preview">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(t.id)} aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {tests.map((t) => {
              const changelog = getChangelog(t.nickname, t.id);
              return (
                <div key={t.id} className="rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-xl" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <ProviderIconBadge provider={t.provider} className="h-7 w-7" />
                      <StatusBadge status={t.status} size="sm" />
                      <span className="font-sans text-sm font-medium text-slate-700 truncate">{t.nickname || providerName(t.provider)}</span>
                      <span className="font-mono text-xs text-slate-400">****{t.key_preview}</span>
                      {t.health_score !== null && (
                        <span className={cn("font-mono text-xs font-bold", t.health_score >= 80 ? "text-green-600" : t.health_score >= 50 ? "text-amber-500" : "text-red-500")}>
                          {t.health_score}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.latency_ms !== null && <span className="font-mono text-xs text-slate-400 hidden sm:inline">{t.latency_ms}ms</span>}
                      <span className="font-mono text-xs text-slate-400 hidden sm:inline">{format(new Date(t.tested_at), "MMM d, yyyy HH:mm")}</span>
                      {expandedId === t.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedId === t.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {t.health_score !== null && <HealthScoreRing score={t.health_score} size={80} strokeWidth={6} />}
                        <div className="flex-1 space-y-2 font-sans text-sm">
                          <p><span className="text-slate-500">Provider: </span><span className="text-slate-800">{providerName(t.provider)}</span></p>
                          {t.latency_ms !== null && <p><span className="text-slate-500">Latency: </span><span className="font-mono text-slate-800">{t.latency_ms}ms</span></p>}
                          {t.notes && <p><span className="text-slate-500">Notes: </span><span className="text-slate-800">{t.notes}</span></p>}
                          {t.scopes && t.scopes.length > 0 && (
                            <div>
                              <span className="text-slate-500">Scopes: </span>
                              {t.scopes.map((s) => (
                                <span key={String(s)} className="font-mono text-xs bg-blue-50 border border-blue-100 text-blue-600 rounded px-2 py-0.5 mr-1 mb-1 inline-block">{String(s)}</span>
                              ))}
                            </div>
                          )}
                          {t.rate_limit_info && t.rate_limit_info.remaining !== undefined && (
                            <p><span className="text-slate-500">Rate limit remaining: </span><span className="font-mono text-slate-800">{t.rate_limit_info.remaining ?? "N/A"}</span></p>
                          )}
                        </div>
                      </div>

                      {changelog.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <p className="font-sans text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Status Changelog</p>
                          <div className="space-y-2 pl-3 border-l-2 border-blue-200">
                            <div className="relative pl-4">
                              <div className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-blue-500" />
                              <span className="font-mono text-xs text-slate-700 flex items-center gap-1">
                                {format(new Date(t.tested_at), "MMM d")} {statusIcon(t.status)} {t.status}
                              </span>
                            </div>
                            {changelog.map((cl) => (
                              <div key={cl.id} className="relative pl-4">
                                <div className="absolute -left-[9px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                                <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                                  {format(new Date(cl.tested_at), "MMM d")} {statusIcon(cl.status)} {cl.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 hover:bg-red-50 gap-1 font-sans text-xs rounded-xl" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 gap-1 font-sans text-xs rounded-xl" onClick={() => copyPreview(t.key_preview)}>
                          <Copy className="h-3 w-3" /> Copy preview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageShell>
    </DashboardLayout>
  );
}
