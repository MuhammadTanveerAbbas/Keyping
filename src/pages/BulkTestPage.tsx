import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PROVIDERS } from "@/lib/providers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PageHeader,
  PageShell,
  dashInput,
  dashSelectTrigger,
  dashSelectContent,
  dashPrimaryBtn,
  dashGhostBtn,
} from "@/components/dashboard/ui";
import { Loader2, Plus, Trash2, Download, Zap } from "lucide-react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";

type BulkRow = {
  id: number;
  provider: string;
  apiKey: string;
  testing: boolean;
  result: null | {
    status: "valid" | "invalid" | "limited";
    healthScore?: number;
    latencyMs?: number;
    error?: string;
  };
};

let nextId = 1;
const createRow = (): BulkRow => ({ id: nextId++, provider: "", apiKey: "", testing: false, result: null });

const BulkTestPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BulkRow[]>([createRow(), createRow()]);
  const [testingAll, setTestingAll] = useState(false);

  const updateRow = (id: number, updates: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRow = () => {
    if (rows.length >= 10) { toast.error("Maximum 10 keys at once"); return; }
    setRows(prev => [...prev, createRow()]);
  };

  const removeRow = (id: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const testSingle = async (row: BulkRow) => {
    if (!row.provider || !row.apiKey) return;
    updateRow(row.id, { testing: true, result: null });
    try {
      const { data, error } = await supabase.functions.invoke("test-api-key", {
        body: { provider: row.provider, apiKey: row.apiKey },
      });
      if (error) throw error;
      updateRow(row.id, { testing: false, result: data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      updateRow(row.id, { testing: false, result: { status: "invalid", error: message } });
    }
  };

  const testAll = async () => {
    const valid = rows.filter(r => r.provider && r.apiKey);
    if (valid.length === 0) { toast.error("Add at least one key to test"); return; }
    setTestingAll(true);
    await Promise.all(valid.map(r => testSingle(r)));
    setTestingAll(false);
    toast.success(`Tested ${valid.length} key(s)`);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("KeyPing  Bulk Test Report", 20, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString(), 20, 30);

    let y = 45;
    rows.forEach((row, i) => {
      if (!row.result) return;
      const pName = PROVIDERS.find(p => p.id === row.provider)?.name || row.provider;
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${pName}`, 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Status: ${row.result.status}`, 25, y); y += 5;
      if (row.result.healthScore !== undefined) { doc.text(`Health Score: ${row.result.healthScore}/100`, 25, y); y += 5; }
      if (row.result.latencyMs !== undefined) { doc.text(`Latency: ${row.result.latencyMs}ms`, 25, y); y += 5; }
      doc.text(`Key: ****${row.apiKey.slice(-4)}`, 25, y); y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save("keyping-bulk-report.pdf");
    toast.success("PDF exported!");
  };

  const hasResults = rows.some(r => r.result);

  return (
    <DashboardLayout>
      <PageShell width="md">
        <PageHeader
          title="Bulk Test"
          description="Validate up to 10 keys at once. Results stay in this session until you export a PDF."
        />

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${
                row.result?.status === "invalid"
                  ? "border-red-200 dark:border-red-900/50"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="w-6 shrink-0 text-xs tabular-nums text-slate-400">{i + 1}.</span>

                <Select value={row.provider} onValueChange={(v) => updateRow(row.id, { provider: v })}>
                  <SelectTrigger className={`w-full sm:w-44 ${dashSelectTrigger}`}>
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent className={dashSelectContent}>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <ProviderIcon provider={p.id} size="sm" />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="password"
                placeholder="API key"
                value={row.apiKey}
                onChange={(e) => updateRow(row.id, { apiKey: e.target.value })}
                className={`flex-1 font-mono text-sm ${dashInput}`}
              />

              <div className="flex items-center gap-2 shrink-0">
                {row.testing && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {row.result && (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.result.status} size="sm" />
                    {row.result.healthScore !== undefined && (
                      <span className={`font-mono text-xs font-bold ${
                        row.result.healthScore >= 80 ? "text-green-600 dark:text-green-400" : row.result.healthScore >= 50 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        {row.result.healthScore}
                      </span>
                    )}
                  </div>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      disabled={rows.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove this key from the test list. Test history is not affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-sans text-sm rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeRow(row.id)}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-500 text-white font-sans text-sm rounded-xl">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addRow} disabled={rows.length >= 10} className={dashGhostBtn + " border-slate-200 dark:border-slate-700"}>
            <Plus className="h-4 w-4 mr-1.5" /> Add row
          </Button>
          <Button onClick={testAll} disabled={testingAll} className={dashPrimaryBtn}>
            {testingAll ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Testing...</> : <><Zap className="h-4 w-4 mr-1.5" /> Test all</>}
          </Button>
          {hasResults && (
            <Button variant="outline" onClick={exportPdf} className={dashGhostBtn + " border-slate-200 dark:border-slate-700"}>
              <Download className="h-4 w-4 mr-1.5" /> Export PDF
            </Button>
          )}
        </div>
      </PageShell>
    </DashboardLayout>
  );
};

export default BulkTestPage;
