import { useState, useEffect, useRef } from "react";
import { PROVIDERS, detectProvider } from "@/lib/providers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye, EyeOff, Copy, ExternalLink, Loader2, RotateCcw, Save,
  Zap, Check, AlertTriangle, ShieldCheck, ShieldX, ShieldAlert,
  Activity, Sparkles, ChevronRight, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

type CheckOption = "status" | "rateLimit" | "scopes" | "docs" | "responseTime" | "healthScore";
type SaveOption = "save" | "testOnly" | "saveNoKey";

type TestResult = {
  status: "valid" | "invalid" | "limited";
  scopes?: string[];
  rateLimit?: { remaining?: number; resetAt?: string };
  error?: string;
  latencyMs?: number;
  healthScore?: number;
};

const MAX_KEY_LENGTH = 512;

const checkChips: { key: CheckOption; label: string; icon: typeof Check }[] = [
  { key: "status", label: "Status", icon: ShieldCheck },
  { key: "rateLimit", label: "Rate Limit", icon: ShieldAlert },
  { key: "scopes", label: "Scopes", icon: ShieldCheck },
  { key: "docs", label: "Docs", icon: ExternalLink },
  { key: "responseTime", label: "Latency", icon: Zap },
  { key: "healthScore", label: "Health Score", icon: Activity },
];

function LatencyBar({ ms }: { ms: number }) {
  const pct = Math.min(100, (ms / 3000) * 100);
  const color = ms < 500 ? "from-emerald-400 to-emerald-500" : ms < 1000 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  const label = ms < 500 ? "Fast" : ms < 1000 ? "Moderate" : "Slow";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latency</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900">{ms}ms</span>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            ms < 500 ? "bg-emerald-100 text-emerald-700" : ms < 1000 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          )}>{label}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ApiKeyTester({ onSave }: { onSave?: () => void } = {}) {
  const { user } = useAuth();
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customAuthHeader, setCustomAuthHeader] = useState("Authorization: Bearer YOUR_KEY");
  const [checks, setChecks] = useState<CheckOption[]>(["status", "rateLimit", "scopes", "docs", "responseTime", "healthScore"]);
  const [saveOption, setSaveOption] = useState<SaveOption>("testOnly");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [nickname, setNickname] = useState("");
  const [notes, setNotes] = useState("");
  const [testError, setTestError] = useState<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setApiKey(""); setResult(null); setTestError(null);
      toast.info("API key cleared after 10 minutes of inactivity");
    }, 10 * 60 * 1000);
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [apiKey]);

  useEffect(() => {
    if (autoDetect && apiKey.length > 3) {
      const detected = detectProvider(apiKey);
      if (detected) setProvider(detected);
    }
  }, [apiKey, autoDetect]);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  const toggleCheck = (c: CheckOption) =>
    setChecks((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleTest = async () => {
    setTestError(null);
    if (!provider) { toast.error("Please select a provider first."); return; }
    if (!apiKey.trim()) { toast.error("Please enter an API key."); return; }
    if (apiKey.length > MAX_KEY_LENGTH) { toast.error(`API key is too long (max ${MAX_KEY_LENGTH} characters).`); return; }
    if (provider === "custom" && !customEndpoint.trim()) { toast.error("Please enter a custom endpoint URL."); return; }
    if (provider === "custom") {
      try {
        const url = new URL(customEndpoint);
        if (url.protocol !== "https:") { toast.error("Custom endpoint must use HTTPS."); return; }
      } catch { toast.error("Please enter a valid URL for the custom endpoint."); return; }
    }

    setTesting(true); setResult(null);
    try {
      const body: Record<string, string> = { provider, apiKey: apiKey.trim() };
      if (provider === "custom") { body.customEndpoint = customEndpoint.trim(); body.customAuthHeader = customAuthHeader; }
      const { data, error } = await supabase.functions.invoke("test-api-key", { body });
      if (error) throw new Error(error.message || "Edge function error occurred");
      if (!data) throw new Error("No response received from server. Please try again.");
      const testResult = data as TestResult;
      if (!testResult.status) throw new Error("Invalid response format from server.");
      setResult(testResult);
      if (testResult.status === "invalid" && testResult.error) toast.warning(testResult.error);
      else if (testResult.status === "limited") toast.warning("Key is rate limited or has limited access.");
      else if (testResult.status === "valid") toast.success("Key is valid!");
      if (saveOption !== "testOnly" && testResult.status) setShowSaveDialog(true);
    } catch (err: unknown) {
      let message = "Test failed";
      if (err instanceof Error) message = err.message;
      else if (typeof err === "string") message = err;
      if (message.includes("network") || message.includes("fetch")) message = "Network error - check your connection and try again.";
      else if (message.includes("timeout") || message.includes("Timeout")) message = "Request timed out - the provider may be slow or unreachable.";
      else if (message.includes("denied") || message.includes("CORS")) message = "Request blocked - CORS or network policy issue.";
      setTestError(message);
      toast.error(message);
      setResult({ status: "invalid", error: message });
    } finally { setTesting(false); }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    try {
      const { error } = await supabase.from("key_tests").insert({
        user_id: user.id, provider,
        key_preview: apiKey.slice(-4) || "****",
        nickname: nickname || null, notes: notes || null,
        status: result.status, scopes: result.scopes ?? null,
        rate_limit_info: result.rateLimit ?? null,
        health_score: result.healthScore ?? null,
        latency_ms: result.latencyMs ?? null,
      });
      if (error) throw error;
      toast.success("Result saved!");
      setShowSaveDialog(false); setNickname(""); setNotes("");
      onSave?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save result");
    }
  };

  const copyResult = () => {
    if (!result) return;
    const lines = [
      `Provider: ${selectedProvider?.name || provider}`,
      `Status: ${result.status}`,
      result.healthScore !== undefined ? `Health Score: ${result.healthScore}/100` : "",
      result.latencyMs !== undefined ? `Latency: ${result.latencyMs}ms` : "",
      result.scopes ? `Scopes: ${result.scopes.join(", ")}` : "",
      result.rateLimit?.remaining !== undefined ? `Rate Limit Remaining: ${result.rateLimit.remaining}` : "",
      result.error ? `Error: ${result.error}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Copied to clipboard!");
  };

  const inputBase = "h-11 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-400 focus-visible:bg-white font-medium transition-all duration-200 shadow-none";

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

        {/* Security notice — subtle top bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          <Lock className="h-3 w-3 text-slate-400 shrink-0" />
          <p className="text-[11px] font-medium text-slate-500">
            Your full key is never stored. Only the last 4 characters are saved when you choose to save a result.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-6">

          {/* Row 1: Provider + Key */}
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className={cn(inputBase, "cursor-pointer")}>
                  <SelectValue placeholder="Select provider…" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2.5">
                        <ProviderIcon provider={p.id} size="sm" />
                        <span className="font-medium">{p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">API Key</Label>
                <label className="flex items-center gap-1.5 cursor-pointer" htmlFor="auto-detect-toggle">
                  <span className="text-[11px] font-semibold text-slate-500">Auto-detect</span>
                  <Switch id="auto-detect-toggle" checked={autoDetect} onCheckedChange={setAutoDetect}
                    className="data-[state=checked]:bg-blue-600 scale-75 origin-right" />
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Paste your API key…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  maxLength={MAX_KEY_LENGTH}
                  className={cn("pr-10 font-mono text-sm", inputBase)}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Custom endpoint fields */}
          {provider === "custom" && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Endpoint URL</Label>
                <Input placeholder="https://api.example.com/v1/verify" value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)} className={inputBase} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Auth Header</Label>
                <Input placeholder="Authorization: Bearer YOUR_KEY" value={customAuthHeader}
                  onChange={(e) => setCustomAuthHeader(e.target.value)} className={cn("font-mono text-sm", inputBase)} />
              </div>
            </div>
          )}

          {/* Checks + Save option + CTA */}
          {!!provider && (
            <div className="space-y-4 pt-2 border-t border-slate-100">

              {/* Check chips */}
              <div className="flex flex-wrap gap-1.5">
                {checkChips.map(({ key, label, icon: ChipIcon }) => {
                  const active = checks.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleCheck(key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      )}>
                      {active ? <Check className="h-3 w-3" /> : <ChipIcon className="h-3 w-3" />}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Save option */}
              <div className="flex flex-wrap gap-4">
                {(["testOnly", "save", "saveNoKey"] as const).map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer group">
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                      saveOption === val ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400"
                    )} onClick={() => setSaveOption(val)}>
                      {saveOption === val && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                      {val === "save" ? "Save with notes" : val === "testOnly" ? "Test only" : "Save (no key)"}
                    </span>
                  </label>
                ))}
              </div>

              {/* CTA button */}
              <button
                onClick={handleTest}
                disabled={testing || !apiKey.trim()}
                className={cn(
                  "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200",
                  "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200",
                  "hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                )}>
                {testing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Testing {selectedProvider?.name || "provider"}…</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Ping Key<ChevronRight className="h-4 w-4 opacity-70" /></>
                )}
              </button>

              {testError && !result && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-700">{testError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div className={cn(
          "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-300",
          result.status === "valid" ? "border-emerald-200" : result.status === "limited" ? "border-amber-200" : "border-red-200"
        )}>
          {/* Colored top accent */}
          <div className={cn("h-1 w-full",
            result.status === "valid" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            result.status === "limited" ? "bg-gradient-to-r from-amber-400 to-amber-500" :
            "bg-gradient-to-r from-red-400 to-red-500"
          )} />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">

              {/* Health ring */}
              {checks.includes("healthScore") && result.healthScore !== undefined && (
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <HealthScoreRing score={result.healthScore} size={96} />
                </div>
              )}

              <div className="flex-1 space-y-4 min-w-0">
                {/* Provider + status */}
                <div className="flex items-center gap-3 flex-wrap">
                  <ProviderIconBadge provider={provider} />
                  <span className="font-bold text-slate-900 text-base">{selectedProvider?.name}</span>
                  <StatusBadge status={result.status} />
                  <span className="font-mono text-xs text-slate-400 ml-auto">****{apiKey.slice(-4) || "****"}</span>
                </div>

                {/* Error */}
                {result.error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <ShieldX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{result.error}</p>
                  </div>
                )}

                {/* Latency bar */}
                {checks.includes("responseTime") && result.latencyMs !== undefined && (
                  <LatencyBar ms={result.latencyMs} />
                )}

                {/* Rate limit */}
                {checks.includes("rateLimit") && result.rateLimit && (
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</p>
                      <p className="font-mono text-sm font-bold text-slate-900">{result.rateLimit.remaining ?? "N/A"}</p>
                    </div>
                    {result.rateLimit.resetAt && (
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resets At</p>
                        <p className="font-mono text-sm font-bold text-slate-900">{result.rateLimit.resetAt}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Scopes */}
                {checks.includes("scopes") && result.scopes && result.scopes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permissions / Scopes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.scopes.map((s) => (
                        <span key={s} className="font-mono text-xs font-semibold bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-blue-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Docs link */}
                {checks.includes("docs") && selectedProvider?.docsUrl && (
                  <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    <ExternalLink className="h-3 w-3" /> Provider docs
                  </a>
                )}
              </div>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100">
              <button onClick={copyResult}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Copy className="h-3 w-3" /> Copy summary
              </button>
              {saveOption !== "testOnly" && !showSaveDialog && (
                <button onClick={() => setShowSaveDialog(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
                  <Save className="h-3 w-3" /> Save result
                </button>
              )}
              <button onClick={handleTest} disabled={testing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50">
                <RotateCcw className="h-3 w-3" /> Re-test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-slate-900">Save result</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nickname</Label>
              <Input placeholder="e.g. Production key" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputBase} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</Label>
              <Textarea placeholder="Optional notes…" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-400 focus-visible:bg-white font-medium transition-all duration-200 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => setShowSaveDialog(false)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
