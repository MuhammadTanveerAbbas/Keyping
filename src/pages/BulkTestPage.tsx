import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PROVIDERS } from "@/lib/providers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    } catch (err: any) {
      updateRow(row.id, { testing: false, result: { status: "invalid", error: err.message } });
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          {rows.map((row, i) => (
            <div key={row.id}
              className={`bg-white dark:bg-[#000000] border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                row.result?.status === "invalid" ? "border-red-200 dark:border-red-800/40" : "border-slate-200 dark:border-blue-500/20"
              }`}>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-600 w-6 shrink-0">{i + 1}.</span>

              <Select value={row.provider} onValueChange={(v) => updateRow(row.id, { provider: v })}>
                <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 text-slate-900 dark:text-white rounded-xl">
                  <SelectValue placeholder="Provider..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-blue-500/20">
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

              <Input type="password" placeholder="API key..." value={row.apiKey} onChange={(e) => updateRow(row.id, { apiKey: e.target.value })}
                className="flex-1 font-mono text-sm bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 rounded-xl" />

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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => removeRow(row.id)} disabled={rows.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={addRow} disabled={rows.length >= 10}
            className="gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-sm rounded-xl border border-slate-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40">
            <Plus className="h-4 w-4" /> Add Key
          </Button>
          <Button onClick={testAll} disabled={testingAll}
            className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all border-0">
            {testingAll ? <><Loader2 className="h-4 w-4 animate-spin dark:text-black" /> Testing...</> : <><Zap className="h-4 w-4" /> Test All</>}
          </Button>
          {hasResults && (
            <Button variant="ghost" onClick={exportPdf}
              className="gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-sm rounded-xl border border-slate-200 dark:border-blue-500/20">
              <Download className="h-4 w-4" /> Export PDF
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkTestPage;
