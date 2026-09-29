import { useEffect, useMemo, useRef, useState } from "react";
import { PROVIDERS, SELECTABLE_PROVIDERS, detectProvider, isProviderId, isProviderSelectable } from "@/lib/providers";
import type { ProviderId } from "../../supabase/functions/_shared/provider-contract.ts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Key,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { describeEdgeFunctionError, invokeTestApiKey } from "@/lib/edge-function";
import type {
  TestApiKeyRequest,
  TestApiKeyResponse,
} from "../../supabase/functions/_shared/api-contract.ts";

type CheckOption = "status" | "rateLimit" | "scopes" | "docs" | "responseTime" | "healthScore";
type SaveOption = "save" | "testOnly" | "saveNoKey";

type TestError = string | { code?: string; message?: string; retryable?: boolean };
type TestResult = {
  status: "valid" | "invalid" | "limited";
  scopes?: string[];
  rateLimit?: { remaining?: number; resetAt?: string };
  error?: TestError;
  latencyMs?: number;
  healthScore?: number;
};

const MAX_KEY_LENGTH = 512;

const CHECK_OPTIONS: { key: CheckOption; label: string; icon: typeof Check }[] = [
  { key: "status", label: "Status", icon: ShieldCheck },
  { key: "rateLimit", label: "Rate limit", icon: Gauge },
  { key: "scopes", label: "Scopes", icon: Key },
  { key: "docs", label: "Docs", icon: ExternalLink },
  { key: "responseTime", label: "Latency", icon: Timer },
  { key: "healthScore", label: "Health score", icon: Activity },
];

const DEFAULT_CHECKS: CheckOption[] = CHECK_OPTIONS.map((item) => item.key);

function providerSupportsCheck(provider: { supportedChecks?: readonly string[] }, check: CheckOption) {
  if (Array.isArray(provider.supportedChecks)) return provider.supportedChecks.includes(check);
  return true;
}

function errorMessage(error: TestError | undefined) {
  if (!error) return "";
  return typeof error === "string" ? error : error.message ?? error.code ?? "Validation failed";
}

async function copyToClipboard(value: string) {
  if (!navigator.clipboard) {
    toast.error("Clipboard access is not available in this browser");
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    toast.error("Could not copy to clipboard");
    return false;
  }
}

function LatencyBar({ ms }: { ms: number }) {
  const pct = Math.min(100, (ms / 3000) * 100);
  const color = ms < 500 ? "from-emerald-400 to-emerald-500" : ms < 1000 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  const label = ms < 500 ? "Fast" : ms < 1000 ? "Moderate" : "Slow";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latency</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900">{ms}ms</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", ms < 500 ? "bg-emerald-100 text-emerald-700" : ms < 1000 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{label}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ApiKeyTester({ onSave }: { onSave?: () => void } = {}) {
  const { user } = useAuth();
  // Typed as the contract's provider id rather than a bare string, so an
  // invalid id cannot reach the request body or the save path. The Select
  // handler narrows the incoming string before storing it.
  const [provider, setProvider] = useState<ProviderId | "">("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customAuthHeader, setCustomAuthHeader] = useState("Authorization: Bearer YOUR_KEY");
  const [checks, setChecks] = useState<CheckOption[]>(DEFAULT_CHECKS);
  const [saveOption, setSaveOption] = useState<SaveOption>("testOnly");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [nickname, setNickname] = useState("");
  const [notes, setNotes] = useState("");
  const [testError, setTestError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const endpointRef = useRef<HTMLInputElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const availableProviders = useMemo(() => SELECTABLE_PROVIDERS, []);
  const selectedProvider = availableProviders.find((item) => item.id === provider) ?? PROVIDERS.find((item) => item.id === provider);
  const visibleChecks = useMemo(() => CHECK_OPTIONS.filter((item) => !selectedProvider || providerSupportsCheck(selectedProvider, item.key)), [selectedProvider]);

  useEffect(() => {
    if (!apiKey) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setApiKey("");
      setResult(null);
      setTestError(null);
      toast.info("API key cleared after 10 minutes of inactivity");
    }, 10 * 60 * 1000);
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!result) return;
    resultHeadingRef.current?.focus({ preventScroll: true });
    resultHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  // Any input that the result describes must invalidate that result.
  //
  // handleSave writes the current provider and the last four characters of the
  // current key alongside the previous run's status, health score, and latency.
  // Changing the provider, the key, or the custom endpoint without discarding
  // the result meant a row could be stored claiming, for example, an OpenAI
  // provider and an OpenAI key suffix while carrying a GitHub test's numbers.
  useEffect(() => {
    setResult(null);
    setTestError(null);
  }, [provider, apiKey, customEndpoint, customAuthHeader]);

  useEffect(() => {
    if (!autoDetect || apiKey.trim().length <= 3) return;
    const detected = detectProvider(apiKey.trim());
    const detectedProvider = PROVIDERS.find((item) => item.id === detected);
    if (detected && detectedProvider && isProviderSelectable(detectedProvider)) setProvider(detected);
  }, [apiKey, autoDetect]);

  useEffect(() => {
    if (!selectedProvider) return;
    const supported = new Set(visibleChecks.map((item) => item.key));
    setChecks((previous) => {
      const next = previous.filter((item) => supported.has(item));
      return next.length === previous.length ? previous : next;
    });
  }, [selectedProvider, visibleChecks]);

  const toggleCheck = (check: CheckOption) => {
    setChecks((previous) => previous.includes(check) ? previous.filter((item) => item !== check) : [...previous, check]);
  };

  const handleTest = async () => {
    setTestError(null);
    setFieldErrors({});
    const trimmedKey = apiKey.trim();
    const errors: Record<string, string> = {};
    // Returned separately so the compiler knows provider is a real provider id
    // past this point. Reporting every problem at once would leave the type
    // unproven, and an unchecked id must never reach the request body.
    if (!provider) {
      setFieldErrors({ provider: "Select a provider to continue." });
      return;
    }
    if (!trimmedKey) errors.apiKey = "Enter an API key to validate.";
    if (trimmedKey.length > MAX_KEY_LENGTH) errors.apiKey = `API keys must be ${MAX_KEY_LENGTH} characters or fewer.`;
    if (provider === "custom" && !customEndpoint.trim()) {
      errors.endpoint = "Enter a custom endpoint URL.";
    } else if (provider === "custom") {
      try {
        const url = new URL(customEndpoint.trim());
        if (url.protocol !== "https:") errors.endpoint = "Custom endpoints must use HTTPS.";
      } catch {
        errors.endpoint = "Enter a valid custom endpoint URL.";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.apiKey) apiKeyRef.current?.focus();
      else if (errors.endpoint) endpointRef.current?.focus();
      return;
    }

    setTesting(true);
    setResult(null);
    setTestError(null);
    try {
      const body: TestApiKeyRequest = { provider, apiKey: trimmedKey, checks };
      if (provider === "custom") {
        body.customEndpoint = customEndpoint.trim();
        body.customAuthHeader = customAuthHeader;
      }
      const testResult = (await invokeTestApiKey(body)) as TestResult;
      setResult(testResult);
      if (testResult.status === "invalid" && testResult.error) toast.warning(errorMessage(testResult.error));
      else if (testResult.status === "limited") toast.warning("Key is rate limited or has limited access");
      else if (testResult.status === "valid") toast.success("Key is valid");
      if (saveOption !== "testOnly") setShowSaveDialog(true);
    } catch (error: unknown) {
      // The Edge Function builds a sentence that is safe to show, so it is
      // used directly. describeEdgeFunctionError only substitutes its own text
      // when the payload could not be read at all.
      const message = describeEdgeFunctionError(error);
      setTestError(message);
      toast.error(message);
      setResult({ status: "invalid", error: message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) {
      if (!user) toast.error("Sign in to save a result");
      return;
    }
    const trimmedKey = apiKey.trim();
    const shouldSaveMetadata = saveOption === "save";
    try {
      const { error } = await supabase.from("key_tests").insert({
        user_id: user.id,
        provider,
        key_preview: trimmedKey.slice(-4) || "****",
        nickname: shouldSaveMetadata ? nickname.trim() || null : null,
        notes: shouldSaveMetadata ? notes.trim() || null : null,
        status: result.status,
        scopes: result.scopes ?? null,
        rate_limit_info: result.rateLimit ?? null,
        health_score: result.healthScore ?? null,
        latency_ms: result.latencyMs ?? null,
      });
      if (error) throw error;
      toast.success("Result saved");
      setShowSaveDialog(false);
      setNickname("");
      setNotes("");
      onSave?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not save this result");
    }
  };

  const copyResult = async () => {
    if (!result) return;
    const lines = [
      `Provider: ${selectedProvider?.name ?? provider}`,
      `Status: ${result.status}`,
      result.healthScore !== undefined ? `Health score: ${result.healthScore}/100` : "",
      result.latencyMs !== undefined ? `Latency: ${result.latencyMs}ms` : "",
      result.scopes?.length ? `Scopes: ${result.scopes.join(", ")}` : "",
      result.rateLimit?.remaining !== undefined ? `Rate limit remaining: ${result.rateLimit.remaining}` : "",
      result.error ? `Error: ${errorMessage(result.error)}` : "",
    ].filter(Boolean).join("\n");
    if (await copyToClipboard(lines)) toast.success("Summary copied");
  };

  const inputBase = "h-11 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_2px_6px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20";

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07),0_2px_6px_rgba(15,23,42,0.03)]">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
            <Lock className="h-4.5 w-4.5 text-blue-300" strokeWidth={2.25} aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">End-to-end secure</p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-300">Your full key is tested at the edge and never stored. Only a short preview is saved when you choose to save.</p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 sm:inline-flex">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Secure
          </span>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => {
                  if (isProviderId(value)) setProvider(value);
                }}
              >
                <SelectTrigger className={cn(inputBase, "cursor-pointer", fieldErrors.provider && "border-red-400 focus-visible:ring-red-500/20")} aria-label="Select provider" aria-invalid={Boolean(fieldErrors.provider)} aria-describedby={fieldErrors.provider ? "provider-error" : undefined}>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-xl">
                  {availableProviders.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2.5">
                        <ProviderIcon provider={item.id} size="sm" />
                        <span className="font-medium">{item.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.provider && <p id="provider-error" className="px-1 text-xs font-medium text-red-600" role="alert">{fieldErrors.provider}</p>}
              {selectedProvider && <p className="px-1 text-[11px] text-slate-500">{selectedProvider.availabilityNote ?? "Auto detection is available for supported key formats."}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="api-key" className="text-xs font-semibold uppercase tracking-wider text-slate-600">API key</Label>
                <label htmlFor="auto-detect-toggle" className="flex cursor-pointer items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Auto detect</span>
                  <Switch id="auto-detect-toggle" checked={autoDetect} onCheckedChange={setAutoDetect} className="scale-75 origin-right data-[state=checked]:bg-blue-600" />
                </label>
              </div>
              <div className="relative">
                <Input
                  ref={apiKeyRef}
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  placeholder="Paste your API key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  maxLength={MAX_KEY_LENGTH}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(inputBase, "pr-10 font-mono text-sm", fieldErrors.apiKey && "border-red-400 focus-visible:ring-red-500/20")}
                  aria-invalid={Boolean(fieldErrors.apiKey)}
                  aria-describedby={fieldErrors.apiKey ? "api-key-error" : undefined}
                />
                <button type="button" aria-label={showKey ? "Hide API key" : "Show API key"} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" onClick={() => setShowKey((current) => !current)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.apiKey && <p id="api-key-error" className="text-xs font-medium text-red-600" role="alert">{fieldErrors.apiKey}</p>}
            </div>
          </div>

          {provider === "custom" && (
            <div className="grid gap-4 border-t border-slate-100 pt-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="custom-endpoint" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Endpoint URL</Label>
                <Input ref={endpointRef} id="custom-endpoint" type="url" placeholder="https://api.example.com/v1/verify" value={customEndpoint} onChange={(event) => setCustomEndpoint(event.target.value)} autoComplete="off" className={cn(inputBase, fieldErrors.endpoint && "border-red-400 focus-visible:ring-red-500/20")} aria-invalid={Boolean(fieldErrors.endpoint)} aria-describedby={fieldErrors.endpoint ? "endpoint-error" : undefined} />
                {fieldErrors.endpoint && <p id="endpoint-error" className="text-xs font-medium text-red-600" role="alert">{fieldErrors.endpoint}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-auth-header" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Auth header</Label>
                <Input id="custom-auth-header" placeholder="Authorization: Bearer YOUR_KEY" value={customAuthHeader} onChange={(event) => setCustomAuthHeader(event.target.value)} autoComplete="off" className={cn(inputBase, "font-mono text-sm")} />
              </div>
            </div>
          )}

          {provider && (
            <div className="space-y-4 border-t border-slate-100 pt-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Checks to run</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleChecks.map(({ key, label, icon: ChipIcon }) => {
                    const active = checks.includes(key);
                    return (
                      <button key={key} type="button" onClick={() => toggleCheck(key)} aria-pressed={active} className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", active ? "border-blue-700 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-[0_6px_14px_rgba(37,99,235,0.24),inset_0_1px_0_rgba(255,255,255,0.25)]" : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700")}>
                        {active ? <Check className="h-3 w-3" /> : <ChipIcon className="h-3 w-3" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">After the test</p>
                <div className="flex flex-wrap gap-4">
                  {(["testOnly", "save", "saveNoKey"] as const).map((value) => {
                    const label = value === "save" ? "Save with notes" : value === "saveNoKey" ? "Save without notes" : "Test only";
                    return (
                      <label key={value} className="group flex cursor-pointer items-center gap-2">
                        <input type="radio" name="save-option" value={value} checked={saveOption === value} onChange={() => setSaveOption(value)} className="sr-only" />
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors", saveOption === value ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400")}>
                          {saveOption === value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 transition-colors group-hover:text-slate-900">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="button" onClick={handleTest} disabled={testing} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.24),inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors hover:from-blue-700 hover:to-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none">
                {testing ? <><Loader2 className="h-4 w-4 animate-spin" />Testing {selectedProvider?.name ?? "provider"}</> : <><Sparkles className="h-4 w-4" />Run validation<ChevronRight className="h-4 w-4 opacity-70" /></>}
              </button>

              {testError && !result && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{testError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300", result.status === "valid" ? "border-emerald-200" : result.status === "limited" ? "border-amber-200" : "border-red-200")} aria-live="polite">
          <div className={cn("h-1 w-full", result.status === "valid" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : result.status === "limited" ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-red-400 to-red-500")} />
          <div className="p-5 sm:p-6">
            <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">Validation result</h2>
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              {checks.includes("healthScore") && result.healthScore !== undefined && <div className="flex shrink-0 flex-col items-center gap-1"><HealthScoreRing score={result.healthScore} size={96} /></div>}
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <ProviderIconBadge provider={provider} />
                  <span className="text-base font-bold text-slate-900">{selectedProvider?.name ?? provider}</span>
                  <StatusBadge status={result.status} />
                  <span className="ml-auto font-mono text-xs text-slate-400">****{apiKey.trim().slice(-4) || "****"}</span>
                </div>

                {result.error && <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p className="text-sm font-medium text-red-700">{errorMessage(result.error)}</p></div>}
                {checks.includes("responseTime") && result.latencyMs !== undefined && <LatencyBar ms={result.latencyMs} />}
                {checks.includes("rateLimit") && result.rateLimit && <div className="flex flex-wrap gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining</p><p className="font-mono text-sm font-bold text-slate-900">{result.rateLimit.remaining ?? "N/A"}</p></div>{result.rateLimit.resetAt && <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resets at</p><p className="font-mono text-sm font-bold text-slate-900">{result.rateLimit.resetAt}</p></div>}</div>}
                {checks.includes("scopes") && result.scopes && result.scopes.length > 0 && <div className="space-y-1.5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permissions and scopes</p><div className="flex flex-wrap gap-1.5">{result.scopes.map((scope) => <span key={scope} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">{scope}</span>)}</div></div>}
                {checks.includes("docs") && selectedProvider?.docsUrl && <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"><ExternalLink className="h-3 w-3" />Provider documentation</a>}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={copyResult} className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
                <Copy className="h-3.5 w-3.5" />
                Copy summary
              </Button>
              {saveOption !== "testOnly" && !showSaveDialog && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="h-9 gap-1.5 rounded-xl border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 shadow-sm hover:border-blue-300 hover:bg-blue-100/70">
                  <Save className="h-3.5 w-3.5" />
                  Save result
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testing} className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">
                <RotateCcw className={cn("h-3.5 w-3.5", testing && "animate-spin")} />
                Retest
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Save className="h-4 w-4" /></div><div><p className="text-sm font-bold text-slate-900">Save this result</p><p className="text-xs text-slate-500">Only the final four characters are retained.</p></div></div>
          {saveOption === "save" && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="result-nickname" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Nickname</Label><Input id="result-nickname" placeholder="Production key" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={100} className={inputBase} /></div><div className="space-y-1.5"><Label htmlFor="result-notes" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Notes</Label><Textarea id="result-notes" placeholder="Optional notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} className="rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/40" /></div></div>}
          <div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={handleSave} className="gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"><Save className="h-3.5 w-3.5" />Save result</Button><Button type="button" variant="ghost" onClick={() => setShowSaveDialog(false)} className="rounded-xl text-slate-600 hover:bg-slate-50">Cancel</Button></div>
        </div>
      )}
    </div>
  );
}
