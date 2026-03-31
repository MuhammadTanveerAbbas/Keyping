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
import { Eye, EyeOff, Copy, ExternalLink, Loader2, Lock, RotateCcw, Save, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";

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
    } catch (err: any) {
      toast.error(err.message || "Test failed");
      setResult({ status: "invalid", error: err.message });
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
        scopes: result.scopes ? (result.scopes as any) : null,
        rate_limit_info: result.rateLimit ? (result.rateLimit as any) : null,
        health_score: result.healthScore ?? null,
        latency_ms: result.latencyMs ?? null,
      });
      if (error) throw error;
      toast.success("Result saved!");
      setShowSaveDialog(false);
      setNickname("");
      setNotes("");
      onSave?.();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
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
    <div className="space-y-5">
      {/* Security notice */}
      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 px-4 py-2.5">
        <Lock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
        <span className="font-mono">Your full key is never stored. Only the last 4 characters are saved with results.</span>
      </div>

      {/* Step 1: Input */}
      <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            Enter Key
          </h2>
          <div className="flex items-center gap-2">
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 cursor-pointer" htmlFor="auto-detect-toggle">Auto-detect</Label>
            <Switch id="auto-detect-toggle" checked={autoDetect} onCheckedChange={setAutoDetect} className="data-[state=checked]:bg-blue-500 scale-90" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white h-10 rounded-xl">
                <SelectValue placeholder="Select..." />
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
          </div>

          <div className="space-y-1.5">
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Paste your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 font-mono text-sm bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 h-10 rounded-xl"
              />
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-400/40 hover:text-slate-600 dark:hover:text-blue-400 transition-colors" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {provider === "custom" && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1 border-t border-slate-100 dark:border-blue-500/10">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Endpoint URL</Label>
              <Input placeholder="https://api.example.com/v1/verify" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)}
                className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Auth Header Format</Label>
              <Input placeholder="Authorization: Bearer YOUR_KEY" value={customAuthHeader} onChange={(e) => setCustomAuthHeader(e.target.value)}
                className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 font-mono text-sm text-slate-900 dark:text-white h-10 rounded-xl" />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Options */}
      {showOptions && (
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            Configure & Test
          </h2>

          <div className="space-y-3">
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Checks</Label>
            <div className="flex flex-wrap gap-1.5">
              {checkChips.map(({ key, label }) => (
                <button key={key} onClick={() => toggleCheck(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150 flex items-center gap-1 ${
                    checks.includes(key)
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                      : "bg-slate-50 dark:bg-[#0A0A0A] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-blue-500/10 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}>
                  {checks.includes(key) && <Check className="h-2.5 w-2.5" />}{label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {(["save", "testOnly", "saveNoKey"] as const).map((val) => (
              <label key={val} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-sans">
                <input type="radio" name="saveOption" checked={saveOption === val} onChange={() => setSaveOption(val)} className="accent-blue-500" />
                {val === "save" ? "Save with notes" : val === "testOnly" ? "Test only" : "Save (no key)"}
              </label>
            ))}
          </div>

          <Button onClick={handleTest} disabled={testing || !apiKey}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_22px_rgba(59,130,246,0.55)] transition-all border-0 h-10">
            {testing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2 dark:text-black" /><span>Pinging {selectedProvider?.name || "provider"}</span><span className="terminal-cursor ml-1">▊</span></>
            ) : (
              <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Ping Key</span>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Result */}
      {result && (
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            Result
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {checks.includes("healthScore") && result.healthScore !== undefined && (
              <div className="shrink-0"><HealthScoreRing score={result.healthScore} /></div>
            )}

            <div className="flex-1 space-y-4">
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

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-blue-500/10">
            <Button variant="ghost" size="sm" onClick={copyResult} className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-xs rounded-xl">
              <Copy className="h-3 w-3" /> Copy Summary
            </Button>
            {saveOption !== "testOnly" && !showSaveDialog && (
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)} className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-xs rounded-xl">
                <Save className="h-3 w-3" /> Save Result
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleTest} className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-xs rounded-xl">
              <RotateCcw className="h-3 w-3" /> Re-test
            </Button>
          </div>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Save Result</h2>
          <div>
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nickname</Label>
            <Input placeholder="e.g. Production key" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 rounded-xl mt-1" />
          </div>
          <div>
            <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Notes</Label>
            <Textarea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)}
              className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 rounded-xl mt-1" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] border-0">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-500/5 font-sans text-sm rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
