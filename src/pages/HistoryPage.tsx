import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { format, isValid } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  LayoutGrid,
  List,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  copyText,
  dashSelectContent,
  dashSelectTrigger,
  EmptyState,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  SkeletonBlock,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { useHistory } from "@/hooks/useHistory";
import { PROVIDERS } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv";
import type { KeyTest } from "@/hooks/useAnalytics";
import { notifyDataChanged } from "@/lib/data-events";

function formatTestDate(value: string, pattern: string) {
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : "Unknown date";
}

function statusIcon(status: string) {
  if (status === "valid") {
    return <span role="img" aria-label="Valid"><CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>;
  }
  if (status === "invalid") {
    return <span role="img" aria-label="Invalid"><XCircle className="h-3 w-3 text-red-500" /></span>;
  }
  return <span role="img" aria-label="Limited"><AlertTriangle className="h-3 w-3 text-amber-500" /></span>;
}

export default function HistoryPage() {
  const { tests, loading, error, refresh, deleteTest, filterProvider, setFilterProvider, filterStatus, setFilterStatus } = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const reduceMotion = useReducedMotion();

  const hasFilters = filterProvider !== "all" || filterStatus !== "all";

  const toggleReveal = (id: string) => {
    setRevealedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPreview = async (preview: string) => {
    const copied = await copyText(`****${preview}`);
    if (copied) toast.success("Key preview copied");
    else toast.error("Could not access the clipboard");
  };

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(true);
    try {
      // The reason is shown rather than a generic failure, so a permission or
      // connectivity problem is distinguishable from a real failure to delete.
      const result = await deleteTest(id);
      if (result.ok) {
        notifyDataChanged("key_tests");
        setExpandedId((current) => (current === id ? null : current));
        setPendingDelete(null);
        toast.success("Saved result deleted");
      } else {
        toast.error(result.message || "Could not delete the saved result");
      }
    } catch {
      toast.error("Could not delete the saved result");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilterProvider("all");
    setFilterStatus("all");
  };

  const exportHistory = () => {
    if (tests.length === 0) {
      toast.info("There are no visible results to export");
      return;
    }
    const headers = ["Provider", "Key preview", "Nickname", "Status", "Health score", "Latency (ms)", "Tested at", "Notes"];
    const rows = tests.map((test) => [
      PROVIDERS.find((provider) => provider.id === test.provider)?.name || test.provider,
      `****${test.key_preview}`,
      test.nickname || "",
      test.status,
      test.health_score ?? "",
      test.latency_ms ?? "",
      formatTestDate(test.tested_at, "yyyy-MM-dd HH:mm:ss"),
      test.notes || "",
    ]);
    // Shared exporter, so this file gets the same spreadsheet formula
    // injection guard and UTF-8 handling as the other two exporters.
    try {
      downloadCsv("keyping-history", [headers, ...rows]);
      toast.success("Visible history exported");
    } catch {
      toast.error("Could not start the download");
    }
  };

  const providerName = (id: string) => PROVIDERS.find((provider) => provider.id === id)?.name || id;

  // Changelogs are grouped by nickname once per render instead of filtering
  // the full test list inside the row loop. Filtering per row was quadratic,
  // so every expand, collapse, or delete re-scanned the whole list for each
  // visible row.
  const changelogsByNickname = useMemo(() => {
    const grouped = new Map<string, KeyTest[]>();
    for (const test of tests) {
      if (!test.nickname) continue;
      const existing = grouped.get(test.nickname);
      if (existing) existing.push(test);
      else grouped.set(test.nickname, [test]);
    }
    return grouped;
  }, [tests]);

  const getChangelog = (nickname: string | null, currentId: string) => {
    if (!nickname) return [];
    const group = changelogsByNickname.get(nickname);
    if (!group) return [];
    return group.filter((test) => test.id !== currentId).slice(0, 5);
  };

  const validKeys = tests.filter((test) => test.status === "valid");
  const unhealthy = tests.filter((test) => test.status !== "valid").length;
  const pendingTest = pendingDelete ? tests.find((test) => test.id === pendingDelete) : undefined;

  return (
    <>
      <PageShell>
        <PageHeader
          title="History & Vault"
          description="Review saved validation results, inspect changes over time, and manage your preview-only records."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="History view">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="List view"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
                  )}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  aria-pressed={viewMode === "cards"}
                  aria-label="Card view"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    viewMode === "cards" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <Button type="button" variant="outline" onClick={exportHistory} disabled={loading || tests.length === 0} className="h-10 border-slate-200 bg-white">
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={refresh} disabled={loading} className="h-10 border-slate-200 bg-white">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
                Refresh
              </Button>
            </div>
          }
        />

        <StatGrid cols={3}>
          <Stat icon={Key} label="Visible results" value={tests.length.toLocaleString()} subValue={hasFilters ? "Filtered view" : "All saved results"} />
          <Stat icon={Shield} label="Valid" value={validKeys.length.toLocaleString()} tone="success" />
          <Stat icon={AlertTriangle} label="Needs attention" value={unhealthy.toLocaleString()} tone={unhealthy > 0 ? "warning" : "default"} />
        </StatGrid>

        <Notice variant="info">
          Saved records contain only a masked key preview. The full API key is used for the validation request and is not written to KeyPing history.
        </Notice>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-4" aria-label="History filters">
          <div className="grid gap-3 sm:flex">
            <div className="space-y-1.5">
              <label htmlFor="history-provider-filter" className="text-xs font-semibold text-slate-600">Provider</label>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger id="history-provider-filter" aria-label="Filter by provider" className={cn("w-full sm:w-44", dashSelectTrigger)}>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent className={dashSelectContent}>
                  <SelectItem value="all">All providers</SelectItem>
                  {PROVIDERS.map((provider) => <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="history-status-filter" className="text-xs font-semibold text-slate-600">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="history-status-filter" aria-label="Filter by status" className={cn("w-full sm:w-40", dashSelectTrigger)}>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className={dashSelectContent}>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters} className="h-10 self-start text-slate-600 sm:self-end">
              Clear filters
            </Button>
          )}
        </div>

        {error && <Notice variant="warning"><span>History could not be loaded: {error}</span><Button type="button" variant="link" onClick={() => void refresh()} className="ml-2 h-auto p-0 text-amber-800 underline">Try again</Button></Notice>}

        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading saved history" aria-live="polite">
            <SkeletonBlock className="h-20" />
            <SkeletonBlock className="h-20" />
            <SkeletonBlock className="h-20" />
            <span className="sr-only">Loading your saved results.</span>
          </div>
        ) : tests.length === 0 ? (
          <Panel ariaLabel="History empty state">
            <EmptyState
              icon={hasFilters ? Key : CheckCircle2}
              title={hasFilters ? "No matching results" : "No saved tests yet"}
              description={hasFilters ? "Try a different provider or status filter." : "Save a result from the tester to build a searchable history."}
              action={hasFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          </Panel>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {tests.map((test) => {
              const isRevealed = revealedKeys.has(test.id);
              return (
                <motion.article
                  key={test.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-card-hover"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <ProviderIconBadge provider={test.provider} className="h-7 w-7" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{test.nickname || providerName(test.provider)}</p>
                        <p className="text-[11px] text-slate-500">{providerName(test.provider)}</p>
                      </div>
                    </div>
                    <StatusBadge status={test.status} size="sm" />
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-500">{isRevealed ? `****${test.key_preview}` : "••••••••"}</span>
                    {test.health_score !== null && <span className={cn("font-mono text-xs font-bold", test.health_score >= 80 ? "text-emerald-600" : test.health_score >= 50 ? "text-amber-600" : "text-red-600")}>{test.health_score}/100</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="font-mono text-[11px] text-slate-400">{formatTestDate(test.tested_at, "MMM d, yyyy")}</span>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => toggleReveal(test.id)} aria-label={isRevealed ? "Hide key preview" : "Show key preview"}>
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => void copyPreview(test.key_preview)} aria-label="Copy key preview">
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingDelete(test.id)} aria-label="Delete saved result">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {tests.map((test) => {
              const changelog = getChangelog(test.nickname, test.id);
              const isExpanded = expandedId === test.id;
              return (
                <article key={test.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-card-hover">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    onClick={() => setExpandedId(isExpanded ? null : test.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`history-details-${test.id}`}
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <ProviderIconBadge provider={test.provider} className="h-8 w-8" />
                      <StatusBadge status={test.status} size="sm" />
                      <span className="min-w-0 truncate text-sm font-medium text-slate-700">{test.nickname || providerName(test.provider)}</span>
                      <span className="hidden font-mono text-xs text-slate-400 sm:inline">{revealedKeys.has(test.id) ? `****${test.key_preview}` : "••••••••"}</span>
                      {test.health_score !== null && <span className={cn("hidden font-mono text-xs font-bold sm:inline", test.health_score >= 80 ? "text-emerald-600" : test.health_score >= 50 ? "text-amber-600" : "text-red-600")}>{test.health_score}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {test.latency_ms !== null && <span className="hidden font-mono text-xs text-slate-400 sm:inline">{test.latency_ms}ms</span>}
                      <span className="font-mono text-[11px] text-slate-400 md:hidden">{formatTestDate(test.tested_at, "MMM d, HH:mm")}</span>
                      <span className="hidden font-mono text-xs text-slate-400 md:inline">{formatTestDate(test.tested_at, "MMM d, yyyy HH:mm")}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={`history-details-${test.id}`}
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="space-y-4 p-4">
                          <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                            {test.health_score !== null && <HealthScoreRing score={test.health_score} size={80} strokeWidth={6} />}
                            <div className="min-w-0 flex-1 space-y-2 text-sm">
                              <p><span className="text-slate-500">Provider: </span><span className="text-slate-800">{providerName(test.provider)}</span></p>
                              <p><span className="text-slate-500">Preview: </span><span className="font-mono text-slate-800">{revealedKeys.has(test.id) ? `****${test.key_preview}` : "••••••••"}</span></p>
                              {test.latency_ms !== null && <p><span className="text-slate-500">Latency: </span><span className="font-mono text-slate-800">{test.latency_ms}ms</span></p>}
                              {test.notes && <p className="break-words"><span className="text-slate-500">Notes: </span><span className="text-slate-800">{test.notes}</span></p>}
                              {test.scopes && test.scopes.length > 0 && (
                                <div>
                                  <span className="text-slate-500">Scopes: </span>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {test.scopes.map((scope, index) => <span key={`${String(scope)}-${index}`} className="inline-block rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">{String(scope)}</span>)}
                                  </div>
                                </div>
                              )}
                              {test.rate_limit_info && test.rate_limit_info.remaining !== undefined && <p><span className="text-slate-500">Rate limit remaining: </span><span className="font-mono text-slate-800">{test.rate_limit_info.remaining ?? "N/A"}</span></p>}
                            </div>
                          </div>

                          {changelog.length > 0 && (
                            <div className="border-t border-slate-100 pt-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status changelog</p>
                              <div className="space-y-2 border-l-2 border-blue-200 pl-3">
                                <div className="relative pl-4">
                                  <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-blue-500" aria-hidden="true" />
                                  <span className="flex items-center gap-1 font-mono text-xs text-slate-700">{formatTestDate(test.tested_at, "MMM d")} {statusIcon(test.status)} {test.status}</span>
                                </div>
                                {changelog.map((change) => (
                                  <div key={change.id} className="relative pl-4">
                                    <span className="absolute -left-[9px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                                    <span className="flex items-center gap-1 font-mono text-xs text-slate-500">{formatTestDate(change.tested_at, "MMM d")} {statusIcon(change.status)} {change.status}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingDelete(test.id)}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => void copyPreview(test.key_preview)}>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy preview
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900" onClick={() => toggleReveal(test.id)}>
                              {revealedKeys.has(test.id) ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                              {revealedKeys.has(test.id) ? "Hide preview" : "Reveal preview"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open && !deleting) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved result?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTest ? `This removes the saved ${providerName(pendingTest.provider)} result for ****${pendingTest.key_preview}.` : "This removes the selected saved result."} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={(event) => { event.preventDefault(); if (pendingDelete) void handleDelete(pendingDelete); }} className="bg-red-600 text-white hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete result"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
