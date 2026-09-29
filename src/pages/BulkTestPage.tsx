import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EdgeFunctionError,
  describeEdgeFunctionError,
  invokeTestApiKey,
} from "@/lib/edge-function";
import { downloadCsv } from "@/lib/csv";
import type { TestApiKeyRequest } from "../../supabase/functions/_shared/api-contract.ts";
import type { ProviderId } from "../../supabase/functions/_shared/provider-contract.ts";
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
  dashGhostBtn,
  dashInput,
  dashPrimaryBtn,
  dashSelectContent,
  dashSelectTrigger,
  copyText,
  downloadBlob,
  Notice,
  PageHeader,
  PageShell,
  Panel,
} from "@/components/dashboard/ui";
import { supabase } from "@/integrations/supabase/client";
import { PROVIDERS, SELECTABLE_PROVIDERS, isProviderId } from "@/lib/providers";
import { cn } from "@/lib/utils";

type BulkStatus = "valid" | "invalid" | "limited";

type BulkResult = {
  status: BulkStatus;
  healthScore?: number;
  latencyMs?: number;
  error?: string;
  rateLimit?: { remaining?: number; resetAt?: string };
};

type BulkRow = {
  id: number;
  // The contract's provider id rather than a bare string, so a row cannot hold
  // an id the Edge Function would reject.
  provider: ProviderId | "";
  apiKey: string;
  customEndpoint: string;
  customAuthHeader: string;
  testing: boolean;
  result: BulkResult | null;
};

type PendingAction = number | "all" | null;

let nextId = 1;
const createRow = (): BulkRow => ({
  id: nextId++,
  provider: "",
  apiKey: "",
  customEndpoint: "",
  customAuthHeader: "Authorization: Bearer YOUR_KEY",
  testing: false,
  result: null,
});

const MAX_ROWS = 10;
const MAX_KEY_LENGTH = 512;

function validateRow(row: BulkRow): string | null {
  if (!isProviderId(row.provider)) return "Choose a provider";
  if (!row.apiKey.trim()) return "Enter an API key";
  if (row.apiKey.trim().length > MAX_KEY_LENGTH) return `API keys must be ${MAX_KEY_LENGTH} characters or fewer`;
  if (row.provider !== "custom") return null;
  if (!row.customEndpoint.trim()) return "Enter a custom endpoint URL";
  try {
    const url = new URL(row.customEndpoint.trim());
    if (url.protocol !== "https:") return "Custom endpoints must use HTTPS";
  } catch {
    return "Enter a valid custom endpoint URL";
  }
  return null;
}

function resultSummary(result: BulkResult) {
  return [
    `Status: ${result.status}`,
    result.healthScore !== undefined ? `Health score: ${result.healthScore}/100` : "",
    result.latencyMs !== undefined ? `Latency: ${result.latencyMs}ms` : "",
    result.rateLimit?.remaining !== undefined ? `Rate limit remaining: ${result.rateLimit.remaining}` : "",
    result.error ? `Error: ${result.error}` : "",
  ].filter(Boolean).join("\n");
}

export default function BulkTestPage() {
  const [rows, setRows] = useState<BulkRow[]>([createRow(), createRow()]);
  const [testingAll, setTestingAll] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!rows.some((row) => row.apiKey.trim() || row.customEndpoint.trim())) return;
    const timer = window.setTimeout(() => {
      setRows((previous) => previous.map((row) => ({ ...row, apiKey: "", result: null })));
      toast.info("Bulk test keys cleared after 10 minutes of inactivity");
    }, 10 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [rows]);

  const updateRow = (id: number, updates: Partial<BulkRow>) => {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      toast.error(`Maximum ${MAX_ROWS} keys at once`);
      return;
    }
    setRows((previous) => [...previous, createRow()]);
  };

  const removeRow = (id: number) => {
    if (rows.length <= 1) return;
    setRows((previous) => previous.filter((row) => row.id !== id));
    setRevealedKeys((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  };

  const clearAll = () => {
    setRows([createRow(), createRow()]);
    setRevealedKeys(new Set());
  };

  const toggleReveal = (id: number) => {
    setRevealedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const testSingle = async (row: BulkRow): Promise<boolean> => {
    const validationError = validateRow(row);
    if (validationError) {
      toast.error(`Row ${rows.findIndex((item) => item.id === row.id) + 1}: ${validationError}`);
      return false;
    }

    // validateRow already rejected a row without a real provider id, so this
    // narrows the value for the compiler as well as for the caller.
    if (!isProviderId(row.provider)) return false;

    updateRow(row.id, { testing: true, result: null });
    try {
      const body: TestApiKeyRequest = { provider: row.provider, apiKey: row.apiKey.trim() };
      if (row.provider === "custom") {
        body.customEndpoint = row.customEndpoint.trim();
        body.customAuthHeader = row.customAuthHeader.trim() || "Authorization: Bearer YOUR_KEY";
      }
      const response = (await invokeTestApiKey(body)) as Partial<BulkResult>;
      if (!response.status || !["valid", "invalid", "limited"].includes(response.status)) {
        throw new EdgeFunctionError("The validation service returned an incomplete result.");
      }
      updateRow(row.id, {
        testing: false,
        result: {
          status: response.status,
          healthScore: response.healthScore,
          latencyMs: response.latencyMs,
          error: response.error,
          rateLimit: response.rateLimit,
        },
      });
      return true;
    } catch (error: unknown) {
      // The row shows the real reason, so a 429 or an expired session is
      // distinguishable from an invalid key instead of every failure reading
      // as the same generic string.
      const message = describeEdgeFunctionError(error);
      updateRow(row.id, { testing: false, result: { status: "invalid", error: message } });
      return false;
    }
  };

  const testAll = async () => {
    if (testingAll) return;
    const readyRows = rows.filter((row) => !validateRow(row));
    if (readyRows.length === 0) {
      const firstError = rows.map(validateRow).find(Boolean);
      toast.error(firstError || "Add at least one complete key to test");
      return;
    }

    setTestingAll(true);
    const results = await Promise.all(readyRows.map((row) => testSingle(row)));
    setTestingAll(false);
    const completed = results.filter(Boolean).length;
    if (completed === readyRows.length) {
      toast.success(`Tested ${completed} key${completed === 1 ? "" : "s"}`);
    } else {
      toast.warning(`${completed} of ${readyRows.length} tests completed`);
    }
    if (readyRows.length < rows.length) {
      toast.info(`${rows.length - readyRows.length} incomplete row${rows.length - readyRows.length === 1 ? " was" : "s were"} skipped`);
    }
  };

  const exportCsv = () => {
    const completedRows = rows.filter((row) => row.result);
    if (completedRows.length === 0) {
      toast.info("Run a test before exporting");
      return;
    }
    setExporting("csv");
    try {
      const headers = ["Row", "Provider", "Key preview", "Status", "Health score", "Latency (ms)", "Error"];
      const data = completedRows.map((row, index) => [
        index + 1,
        PROVIDERS.find((provider) => provider.id === row.provider)?.name || row.provider,
        `****${row.apiKey.trim().slice(-4)}`,
        row.result?.status || "",
        row.result?.healthScore ?? "",
        row.result?.latencyMs ?? "",
        row.result?.error || "",
      ]);
      // Goes through the shared exporter so the formula injection guard and
      // the encoding stay identical to the other two exporters.
      downloadCsv("keyping-bulk-results", [headers, ...data]);
      toast.success("CSV exported");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not export CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    const completedRows = rows.filter((row) => row.result);
    if (completedRows.length === 0) {
      toast.info("Run a test before exporting");
      return;
    }

    setExporting("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const safe = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 120);
      doc.setFontSize(20);
      doc.text("KeyPing Bulk Test Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated ${new Date().toLocaleString()}`, 20, 29);
      doc.setFontSize(11);
      doc.text(`Completed results: ${completedRows.length}`, 20, 38);

      let y = 52;
      completedRows.forEach((row, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const result = row.result;
        if (!result) return;
        const providerName = PROVIDERS.find((provider) => provider.id === row.provider)?.name || row.provider;
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${safe(providerName)}`, 20, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(safe(resultSummary(result)), 25, y, { maxWidth: 160 });
        y += 16;
        doc.text(`Key: ****${safe(row.apiKey.trim().slice(-4))}`, 25, y);
        y += 12;
      });
      doc.save("keyping-bulk-report.pdf");
      toast.success("PDF exported");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not export PDF");
    } finally {
      setExporting(null);
    }
  };

  const hasResults = rows.some((row) => row.result);
  const hasSessionData = rows.some((row) => row.apiKey.trim() || row.customEndpoint.trim() || row.result);
  const completedCount = rows.filter((row) => row.result).length;
  const testingCount = rows.filter((row) => row.testing).length;

  return (
    <>
      <PageShell width="md">
        <PageHeader
          title="Bulk Test"
          description="Validate up to 10 keys in one session. Add a custom HTTPS endpoint when a provider is not listed."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={exportCsv} disabled={!hasResults || exporting !== null} className={cn("h-10 border-slate-200 bg-white", dashGhostBtn)}>
                {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => void exportPdf()} disabled={!hasResults || exporting !== null} className={cn("h-10 border-slate-200 bg-white", dashGhostBtn)}>
                {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                Export PDF
              </Button>
            </div>
          }
        />

        <Notice variant="info">
          Keys are held in memory for this page only. Saved history is not created by bulk testing, and exports include only a masked preview.
        </Notice>

        <Panel
          title="Bulk run"
          description="Rows are validated in parallel. A single row can also be tested on its own."
          headerAction={<span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600" aria-live="polite">{completedCount}/{rows.length} complete</span>}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
              <span>{testingAll ? "Running validation requests..." : `${rows.length} of ${MAX_ROWS} rows used`}</span>
              {testingCount > 0 && <span className="inline-flex items-center gap-1.5 text-blue-600"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />{testingCount} active</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Bulk test completion" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={completedCount}>
              <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${rows.length ? (completedCount / rows.length) * 100 : 0}%` }} />
            </div>
          </div>
        </Panel>

        <div className="space-y-3" aria-label="Bulk key inputs">
          {rows.map((row, index) => {
            const isRevealed = revealedKeys.has(row.id);
            const result = row.result;
            return (
              <motion.article
                key={row.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-sm transition-shadow duration-200",
                  result?.status === "invalid" ? "border-red-200" : result?.status === "limited" ? "border-amber-200" : result?.status === "valid" ? "border-emerald-200" : "border-slate-200",
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-500" aria-label={`Row ${index + 1}`}>{index + 1}</span>
                  <div className="min-w-0 flex-1 space-y-3 lg:contents">
                    <div className="min-w-0 lg:w-48 lg:flex-none">
                      <label htmlFor={`bulk-provider-${row.id}`} className="sr-only">Provider for row {index + 1}</label>
                      <Select
                        value={row.provider}
                        onValueChange={(value) => {
                          if (isProviderId(value)) {
                            updateRow(row.id, { provider: value, result: null });
                          }
                        }}
                      >
                        <SelectTrigger id={`bulk-provider-${row.id}`} aria-label={`Provider for row ${index + 1}`} className={cn("w-full", dashSelectTrigger)}>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className={dashSelectContent}>
                          {SELECTABLE_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <span className="flex items-center gap-2"><ProviderIcon provider={provider.id} size="sm" />{provider.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor={`bulk-key-${row.id}`} className="sr-only">API key for row {index + 1}</label>
                      <Input
                        id={`bulk-key-${row.id}`}
                        type={isRevealed ? "text" : "password"}
                        placeholder="Paste API key"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={MAX_KEY_LENGTH}
                        value={row.apiKey}
                        onChange={(event) => updateRow(row.id, { apiKey: event.target.value, result: null })}
                        className={cn("pr-10 font-mono text-sm", dashInput)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleReveal(row.id)}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={isRevealed ? `Hide API key in row ${index + 1}` : `Show API key in row ${index + 1}`}
                        aria-pressed={isRevealed}
                      >
                        {isRevealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 lg:ml-1">
                    {row.testing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label={`Testing row ${index + 1}`} />}
                    {result && <StatusBadge status={result.status} size="sm" />}
                    <Button type="button" variant="outline" size="sm" onClick={() => void testSingle(row)} disabled={row.testing || testingAll} className="h-9 border-slate-200 bg-white px-3 text-xs">
                    <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Test row</span>
                      <span className="sm:hidden">Test</span>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingAction(row.id)} disabled={rows.length <= 1 || testingAll} aria-label={`Remove row ${index + 1}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {row.provider === "custom" && (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor={`bulk-endpoint-${row.id}`} className="text-xs font-semibold text-slate-600">HTTPS endpoint</label>
                          <Input id={`bulk-endpoint-${row.id}`} type="url" inputMode="url" placeholder="https://api.example.com/v1/verify" value={row.customEndpoint} onChange={(event) => updateRow(row.id, { customEndpoint: event.target.value, result: null })} autoComplete="url" spellCheck={false} className={dashInput} />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor={`bulk-header-${row.id}`} className="text-xs font-semibold text-slate-600">Auth header</label>
                          <Input id={`bulk-header-${row.id}`} placeholder="Authorization: Bearer YOUR_KEY" value={row.customAuthHeader} onChange={(event) => updateRow(row.id, { customAuthHeader: event.target.value, result: null })} autoComplete="off" spellCheck={false} className={cn("font-mono text-xs", dashInput)} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {result && (
                  <div className={cn("mt-4 rounded-xl border px-3 py-3", result.status === "valid" ? "border-emerald-100 bg-emerald-50/60" : result.status === "limited" ? "border-amber-100 bg-amber-50/60" : "border-red-100 bg-red-50/60")} role="status" aria-live="polite">
                    <div className="flex flex-wrap items-center gap-3">
                      {result.healthScore !== undefined && <HealthScoreRing score={result.healthScore} size={54} strokeWidth={5} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold capitalize text-slate-800">{result.status}</span>{result.latencyMs !== undefined && <span className="font-mono text-xs text-slate-500">{result.latencyMs}ms</span>}</div>
                        {result.error && <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{result.error}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={async () => { const copied = await copyText(resultSummary(result)); if (copied) toast.success("Result summary copied"); else toast.error("Could not access the clipboard"); }} className="h-9 text-xs">
                        Copy summary
                      </Button>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={addRow} disabled={rows.length >= MAX_ROWS || testingAll} className={cn("border-slate-200 bg-white", dashGhostBtn)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add row
          </Button>
          <Button type="button" onClick={() => void testAll()} disabled={testingAll} className={cn("h-10", dashPrimaryBtn)}>
            {testingAll ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Testing...</> : <><Zap className="h-4 w-4" aria-hidden="true" /> Test all</>}
          </Button>
          {hasSessionData && (
            <Button type="button" variant="ghost" onClick={() => setPendingAction("all")} disabled={testingAll} className="h-10 text-slate-500 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear session
            </Button>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          <p>Custom requests are sent to the endpoint you provide. Use only services you trust and never paste a production secret into an untrusted URL.</p>
        </div>
      </PageShell>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction === "all" ? "Clear this bulk session?" : "Remove this row?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "all" ? "All keys and results in this page will be cleared from browser memory. No saved history is affected." : "The selected key and its in-memory result will be removed. No saved history is affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (pendingAction === "all") clearAll();
                else if (typeof pendingAction === "number") removeRow(pendingAction);
                setPendingAction(null);
              }}
            >
              {pendingAction === "all" ? "Clear session" : "Remove row"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
