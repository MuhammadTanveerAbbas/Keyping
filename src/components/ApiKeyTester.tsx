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
import { Eye, EyeOff, Copy, ExternalLink, Loader2, RotateCcw, Save, Zap, Check, AlertTriangle, ShieldCheck, ShieldX, ShieldAlert, Activity } from "lucide-react";
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

 // Auto-clear key after 10 minutes of inactivity
 useEffect(() => {
  if (!apiKey) return;
  if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  inactivityTimer.current = setTimeout(() => {
   setApiKey("");
   setResult(null);
   setTestError(null);
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
  setTestError(null);

  // Validation
  if (!provider) {
   toast.error("Please select a provider first.");
   return;
  }
  if (!apiKey.trim()) {
   toast.error("Please enter an API key.");
   return;
  }
  if (apiKey.length > MAX_KEY_LENGTH) {
   toast.error(`API key is too long (max ${MAX_KEY_LENGTH} characters).`);
   return;
  }
  if (provider === "custom" && !customEndpoint.trim()) {
   toast.error("Please enter a custom endpoint URL.");
   return;
  }
  if (provider === "custom") {
   try {
    const url = new URL(customEndpoint);
    if (url.protocol !== "https:") {
     toast.error("Custom endpoint must use HTTPS.");
     return;
    }
   } catch {
    toast.error("Please enter a valid URL for the custom endpoint.");
    return;
   }
  }

  setTesting(true);
  setResult(null);
  try {
   const body: Record<string, string> = { provider, apiKey: apiKey.trim() };
   if (provider === "custom") {
    body.customEndpoint = customEndpoint.trim();
    body.customAuthHeader = customAuthHeader;
   }

   const { data, error } = await supabase.functions.invoke("test-api-key", { body });

   if (error) {
    const message = error.message || "Edge function error occurred";
    throw new Error(message);
   }

   if (!data) {
    throw new Error("No response received from server. Please try again.");
   }

   const testResult = data as TestResult;

   if (!testResult.status) {
    throw new Error("Invalid response format from server.");
   }

   setResult(testResult);

   if (testResult.status === "invalid" && testResult.error) {
    toast.warning(testResult.error);
   } else if (testResult.status === "limited") {
    toast.warning("Key is rate limited or has limited access.");
   } else if (testResult.status === "valid") {
    toast.success("Key is valid!");
   }

   if (saveOption !== "testOnly" && testResult.status) {
    setShowSaveDialog(true);
   }
  } catch (err: unknown) {
   let message = "Test failed";
   if (err instanceof Error) {
    message = err.message;
   } else if (typeof err === "string") {
    message = err;
   }

   // Handle specific edge cases
   if (message.includes("network") || message.includes("fetch")) {
    message = "Network error — check your connection and try again.";
   } else if (message.includes("timeout") || message.includes("Timeout")) {
    message = "Request timed out — the provider may be slow or unreachable.";
   } else if (message.includes("denied") || message.includes("CORS")) {
    message = "Request blocked — CORS or network policy issue.";
   }

   setTestError(message);
   toast.error(message);
   setResult({ status: "invalid", error: message });
  } finally {
   setTesting(false);
  }
 };

 const handleSave = async () => {
  if (!result || !user) return;
  try {
   const keyPreview = apiKey.slice(-4) || "****";
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

 const checkChips: { key: CheckOption; label: string; icon: typeof Check }[] = [
  { key: "status", label: "Valid/Invalid", icon: ShieldCheck },
  { key: "rateLimit", label: "Rate Limit", icon: ShieldAlert },
  { key: "scopes", label: "Scopes", icon: ShieldCheck },
  { key: "docs", label: "Docs Link", icon: ExternalLink },
  { key: "responseTime", label: "Response Time", icon: Zap },
  { key: "healthScore", label: "Health Score", icon: Activity },
 ];

 return (
  <div className="space-y-4">
   <Notice variant="info">
    Your full key is never stored. Only the last four characters are saved when you choose to save a result.
   </Notice>

   <Panel title="1 · Enter key">
    <div className="space-y-4">
     <div className="flex items-center justify-end gap-2">
      <Label className="text-xs font-semibold text-slate-700 cursor-pointer" htmlFor="auto-detect-toggle">Auto-detect provider</Label>
      <Switch id="auto-detect-toggle" checked={autoDetect} onCheckedChange={setAutoDetect} className="data-[state=checked]:bg-blue-600 scale-90" />
     </div>

     <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-slate-700">Provider</Label>
       <Select value={provider} onValueChange={setProvider}>
        <SelectTrigger className={dashSelectTrigger}>
         <SelectValue placeholder="Select provider..." />
        </SelectTrigger>
        <SelectContent className={dashSelectContent}>
         {PROVIDERS.map((p) => (
          <SelectItem key={p.id} value={p.id}>
           <span className="flex items-center gap-2">
            <ProviderIcon provider={p.id} size="sm" />
            <span className="font-medium">{p.name}</span>
           </span>
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-slate-700">API key</Label>
       <div className="relative">
        <Input
         type={showKey ? "text" : "password"}
         placeholder="Paste your API key..."
         value={apiKey}
         onChange={(e) => setApiKey(e.target.value)}
         maxLength={MAX_KEY_LENGTH}
         className={cn("pr-10 font-mono text-sm", dashInput)}
        />
        <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors" onClick={() => setShowKey(!showKey)}>
         {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
       </div>
      </div>
     </div>

     {provider === "custom" && (
      <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4">
       <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700">Endpoint URL</Label>
        <Input placeholder="https://api.example.com/v1/verify" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)} className={dashInput} />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700">Auth header</Label>
        <Input placeholder="Authorization: Bearer YOUR_KEY" value={customAuthHeader} onChange={(e) => setCustomAuthHeader(e.target.value)} className={cn("font-mono text-sm", dashInput)} />
       </div>
      </div>
     )}
    </div>
   </Panel>

   {showOptions && (
    <Panel title="2 · Configure & test">
     <div className="space-y-4">
      <div>
       <Label className="text-xs font-semibold text-slate-700 block mb-2">Checks to include</Label>
       <div className="flex flex-wrap gap-1.5">
        {checkChips.map(({ key, label, icon: ChipIcon }) => (
         <button key={key} type="button" onClick={() => toggleCheck(key)}
          className={cn(
           "px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all flex items-center gap-1",
           checks.includes(key)
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}>
          {checks.includes(key) && <Check className="h-3 w-3" />}<ChipIcon className="h-3 w-3" />{label}
         </button>
        ))}
       </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
       {(["save", "testOnly", "saveNoKey"] as const).map((val) => (
        <label key={val} className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer hover:text-slate-900">
         <input type="radio" name="saveOption" checked={saveOption === val} onChange={() => setSaveOption(val)} className="accent-blue-600" />
         {val === "save" ? "Save with notes" : val === "testOnly" ? "Test only" : "Save (no key)"}
        </label>
       ))}
      </div>

      <Button onClick={handleTest} disabled={testing || !apiKey.trim()} className={cn("w-full h-10", dashPrimaryBtn)}>
       {testing ? (
        <><Loader2 className="h-4 w-4 animate-spin mr-2" /><span>Testing {selectedProvider?.name || "provider"}…</span></>
       ) : (
        <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Ping key</span>
       )}
      </Button>

      {testError && !result && (
       <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-red-700">{testError}</p>
       </div>
      )}
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
        <span className="font-display font-bold text-slate-900">{selectedProvider?.name}</span>
        <StatusBadge status={result.status} />
       </div>

       {result.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
         <ShieldX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
         <p className="text-sm font-medium text-red-700">{result.error}</p>
        </div>
       )}

       {checks.includes("responseTime") && result.latencyMs !== undefined && (
        <div className="flex items-center gap-3">
         <span className="font-sans text-xs font-semibold text-slate-600">Latency:</span>
         <span className="font-mono text-sm font-bold text-slate-900">{result.latencyMs}ms</span>
         <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-32">
          <div className={cn("h-full rounded-full transition-all duration-500",
           result.latencyMs < 500 ? "bg-green-500" : result.latencyMs < 1000 ? "bg-amber-400" : "bg-red-500"
          )} style={{ width: `${Math.min(100, (result.latencyMs / 3000) * 100)}%` }} />
         </div>
        </div>
       )}

       {checks.includes("rateLimit") && result.rateLimit && (
        <div className="font-mono text-sm space-y-1">
         <p className="text-slate-600 font-medium">
          Rate limit remaining: <span className="text-slate-900 font-bold">{result.rateLimit.remaining ?? "N/A"}</span>
         </p>
         {result.rateLimit.resetAt && (
          <p className="text-slate-600 font-medium">
           Resets at: <span className="text-slate-900 font-bold">{result.rateLimit.resetAt}</span>
          </p>
         )}
        </div>
       )}

       {checks.includes("scopes") && result.scopes && result.scopes.length > 0 && (
        <div>
         <p className="font-sans text-xs font-semibold text-slate-700 mb-1.5">Permissions / Scopes</p>
         <div className="flex flex-wrap gap-1.5">
          {result.scopes.map((s) => (
           <span key={s} className="font-mono text-xs font-medium bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-700">{s}</span>
          ))}
         </div>
        </div>
       )}

       <p className="font-mono text-xs text-slate-500 font-medium">
        Key preview: <span className="text-slate-700 font-bold">****{apiKey.slice(-4) || "****"}</span>
       </p>

       {checks.includes("docs") && selectedProvider?.docsUrl && (
        <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer"
         className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-blue-600 hover:underline transition-colors">
         <ExternalLink className="h-3 w-3" /> Provider docs
        </a>
       )}
      </div>
     </div>

     <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100">
      <Button variant="ghost" size="sm" onClick={copyResult} className={dashGhostBtn}>
       <Copy className="h-3 w-3 mr-1" /> Copy summary
      </Button>
      {saveOption !== "testOnly" && !showSaveDialog && (
       <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)} className={dashGhostBtn}>
        <Save className="h-3 w-3 mr-1" /> Save result
       </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleTest} disabled={testing} className={dashGhostBtn}>
       <RotateCcw className="h-3 w-3 mr-1" /> Re-test
      </Button>
     </div>
    </Panel>
   )}

   {showSaveDialog && (
    <Panel title="Save result">
     <div className="space-y-4">
      <div>
       <Label className="text-xs font-semibold text-slate-700">Nickname</Label>
       <Input placeholder="e.g. Production key" value={nickname} onChange={(e) => setNickname(e.target.value)} className={cn("mt-1", dashInput)} />
      </div>
      <div>
       <Label className="text-xs font-semibold text-slate-700">Notes</Label>
       <Textarea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className={cn("mt-1", dashTextarea)} />
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
