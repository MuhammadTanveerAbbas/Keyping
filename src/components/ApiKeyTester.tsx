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
import { Eye, EyeOff, Copy, ExternalLink, Loader2, RotateCcw, Save, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Panel,
  Notice,
  dashInput,
  dashSelectTrigger,
  dashSelectContent,
  dashTextarea,
  dashPrimaryBtn,
  dashGhostBtn,
} from "@/components/dashboard/ui";

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
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear key after 10 minutes of inactivity
  useEffect(() => {
    if (!apiKey) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setApiKey("");
      toast.info("API key cleared after 10 minutes of inactivity");
    }, 10 * 60 * 1000);
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [apiKey]);

  // Auto-detect
  useEffect(() => {
    if (autoDetect && apiKey.length > 3) {
      const detected = detectProvider(apiKey);
      if (detected) setProvider(detected);
    }
  }, [apiKey, autoDetect]);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);
  const showOptions = !!provider;

  const toggleCheck = (c: CheckOption) =>
    setChecks((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleTest = async () => {
    if (!provider || !apiKey) {
      toast.error("Select a provider and enter your API key.");
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const body: Record<string, string> = { provider, apiKey };
      if (provider === "custom") {
        body.customEndpoint = customEndpoint;
        body.customAuthHeader = customAuthHeader;
      }

      const { data, error } = await supabase.functions.invoke("test-api-key", { body });
      if (error) throw error;
      setResult(data as TestResult);

      if (saveOption !== "testOnly" && data?.status) {
        setShowSaveDialog(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Test failed";
      toast.error(message);
      setResult({ status: "invalid", error: message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    try {
      const keyPreview = apiKey.slice(-4);
      const { error } = await supabase.from("key_tests").insert({
        user_id: user.id,
        provider,
        key_preview: keyPreview,
        nickname: nickname || null,
        notes: notes || null,
        status: result.status,
        scopes: result.scopes ?? null,
        rate_limit_info: result.rateLimit ?? null,
        health_score: result.healthScore ?? null,
        latency_ms: result.latencyMs ?? null,
      });
      if (error) throw error;
      toast.success("Result saved!");
      setShowSaveDialog(false);
      setNickname("");
      setNotes("");
      onSave?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save result";
      toast.error(message);
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

  const checkChips: { key: CheckOption; label: string }[] = [
    { key: "status", label: "Valid/Invalid" },
    { key: "rateLimit", label: "Rate Limit" },
    { key: "scopes", label: "Scopes" },
    { key: "docs", label: "Docs Link" },
    { key: "responseTime", label: "Response Time" },
    { key: "healthScore", label: "Health Score" },
  ];

  return (
    <div className="space-y-4">
      <Notice variant="info">
        Your full key is never stored. Only the last four characters are saved when you choose to save a result.
      </Notice>

      <Panel title="1 · Enter key">
        <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Label className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer" htmlFor="auto-detect-toggle">Auto-detect provider</Label>
          <Switch id="auto-detect-toggle" checked={autoDetect} onCheckedChange={setAutoDetect} className="data-[state=checked]:bg-blue-600 scale-90" />
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className={dashSelectTrigger}>
                <SelectValue placeholder="Select..." />
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">API key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Paste your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`pr-10 font-mono text-sm ${dashInput}`}
              />
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-400/40 hover:text-slate-600 dark:hover:text-blue-400 transition-colors" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {provider === "custom" && (
          <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Endpoint URL</Label>
              <Input placeholder="https://api.example.com/v1/verify" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)} className={dashInput} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Auth header</Label>
              <Input placeholder="Authorization: Bearer YOUR_KEY" value={customAuthHeader} onChange={(e) => setCustomAuthHeader(e.target.value)} className={`font-mono text-sm ${dashInput}`} />
            </div>
          </div>
        )}
        </div>
      </Panel>

      {showOptions && (
        <Panel title="2 · Configure & test">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">Checks to include</Label>
              <div className="flex flex-wrap gap-1.5">
                {checkChips.map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => toggleCheck(key)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors flex items-center gap-1 ${
                      checks.includes(key)
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                        : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}>
                    {checks.includes(key) && <Check className="h-2.5 w-2.5" />}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              {(["save", "testOnly", "saveNoKey"] as const).map((val) => (
                <label key={val} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                  <input type="radio" name="saveOption" checked={saveOption === val} onChange={() => setSaveOption(val)} className="accent-blue-600" />
                  {val === "save" ? "Save with notes" : val === "testOnly" ? "Test only" : "Save (no key)"}
                </label>
              ))}
            </div>

            <Button onClick={handleTest} disabled={testing || !apiKey} className={`w-full h-10 ${dashPrimaryBtn}`}>
              {testing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /><span>Testing {selectedProvider?.name || "provider"}…</span></>
              ) : (
                <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Ping key</span>
              )}
            </Button>
          </div>
        </Panel>
      )}

      {result && (
        <Panel title="3 · Result">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {checks.includes("healthScore") && result.healthScore !== undefined && (
              <div className="shrink-0"><HealthScoreRing score={result.healthScore} /></div>
            )}

            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <ProviderIconBadge provider={provider} />
                <span className="font-display font-bold text-slate-900 dark:text-white">{selectedProvider?.name}</span>
                <StatusBadge status={result.status} />
              </div>

              {result.error && <p className="font-sans text-sm text-red-500 dark:text-red-400">{result.error}</p>}

              {checks.includes("responseTime") && result.latencyMs !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-slate-500 dark:text-slate-400">Latency:</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{result.latencyMs}ms</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-blue-500/10 overflow-hidden max-w-32">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      result.latencyMs < 500 ? "bg-green-500" : result.latencyMs < 1000 ? "bg-amber-400" : "bg-red-500"
                    }`} style={{ width: `${Math.min(100, (result.latencyMs / 3000) * 100)}%` }} />
                  </div>
                </div>
              )}

              {checks.includes("rateLimit") && result.rateLimit && (
                <div className="font-mono text-sm space-y-1">
                  <p className="text-slate-500 dark:text-slate-400">
                    Rate limit remaining: <span className="text-slate-900 dark:text-white font-medium">{result.rateLimit.remaining ?? "N/A"}</span>
                  </p>
                  {result.rateLimit.resetAt && (
                    <p className="text-slate-500 dark:text-slate-400">
                      Resets at: <span className="text-slate-900 dark:text-white font-medium">{result.rateLimit.resetAt}</span>
                    </p>
                  )}
                </div>
              )}

              {checks.includes("scopes") && result.scopes && result.scopes.length > 0 && (
                <div>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mb-1.5">Permissions / Scopes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.scopes.map((s) => (
                      <span key={s} className="font-mono text-xs bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded px-2 py-0.5 text-blue-600 dark:text-blue-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
                Key preview: <span className="text-slate-600 dark:text-slate-400">****{apiKey.slice(-4)}</span>
              </p>

              {checks.includes("docs") && selectedProvider?.docsUrl && (
                <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                  <ExternalLink className="h-3 w-3" /> Provider docs
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={copyResult} className={dashGhostBtn}>
              <Copy className="h-3 w-3 mr-1" /> Copy summary
            </Button>
            {saveOption !== "testOnly" && !showSaveDialog && (
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)} className={dashGhostBtn}>
                <Save className="h-3 w-3 mr-1" /> Save result
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleTest} className={dashGhostBtn}>
              <RotateCcw className="h-3 w-3 mr-1" /> Re-test
            </Button>
          </div>
        </Panel>
      )}

      {showSaveDialog && (
        <Panel title="Save result">
          <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nickname</Label>
            <Input placeholder="e.g. Production key" value={nickname} onChange={(e) => setNickname(e.target.value)} className={`mt-1 ${dashInput}`} />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</Label>
            <Textarea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className={`mt-1 ${dashTextarea}`} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className={dashPrimaryBtn}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)} className={dashGhostBtn}>
              Cancel
            </Button>
          </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
