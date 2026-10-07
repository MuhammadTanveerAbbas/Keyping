import { useEffect, useRef, useState } from "react";
import {
  Braces,
  CheckCircle2,
  Clipboard,
  Code2,
  FileJson,
  Loader2,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { describeEdgeFunctionError, invokeTestApiKey } from "@/lib/edge-function";
import type { TestApiKeyRequest } from "../../../supabase/functions/_shared/api-contract.ts";

type LabTab = "form" | "text" | "banner";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type LabError = string | { code?: string; message?: string; retryable?: boolean };
type LabResponse = {
  status?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  latencyMs?: number;
  error?: LabError;
};

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function errorMessage(error: LabError | undefined) {
  if (!error) return "";
  return typeof error === "string" ? error : error.message ?? error.code ?? "Request failed";
}

function responseText(body: unknown) {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Clipboard access is not available");
  }
}

export function RequestLab() {
  const [tab, setTab] = useState<LabTab>("form");
  const [method, setMethod] = useState<Method>("GET");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authHeader, setAuthHeader] = useState("Authorization: Bearer YOUR_KEY");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<LabResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const endpointRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    if (keyTimer.current) clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => {
      setApiKey("");
      setResponse(null);
      setTab("form");
      toast.info("Request lab key cleared after 10 minutes");
    }, 10 * 60 * 1000);
    return () => {
      if (keyTimer.current) clearTimeout(keyTimer.current);
    };
  }, [apiKey]);

  const sendRequest = async () => {
    const errors: Record<string, string> = {};
    if (!endpoint.trim()) errors.endpoint = "Enter an endpoint URL.";
    else {
      try {
        if (new URL(endpoint.trim()).protocol !== "https:") errors.endpoint = "The endpoint must use HTTPS.";
      } catch {
        errors.endpoint = "Enter a valid endpoint URL.";
      }
    }
    if (!apiKey.trim()) errors.apiKey = "Enter an API key.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.apiKey) keyRef.current?.focus();
      else endpointRef.current?.focus();
      return;
    }
    setFieldErrors({});
    if (method !== "GET" && !body.trim()) toast.info("The request body is empty");

    setSending(true);
    setResponse(null);
    try {
      const requestBody: TestApiKeyRequest = {
        provider: "custom",
        apiKey: apiKey.trim(),
        customEndpoint: endpoint.trim(),
        customAuthHeader: authHeader,
        method,
        checks: ["status", "responseTime", "healthScore"],
      };
      if (method !== "GET" && body.trim()) requestBody.requestBody = body;

      const result = (await invokeTestApiKey(requestBody)) as LabResponse;
      setResponse(result);
      setTab("text");
      if (result.error) toast.warning(errorMessage(result.error));
      else toast.success("Request completed");
    } catch (error: unknown) {
      const message = describeEdgeFunctionError(error);
      setResponse({ status: "invalid", error: message });
      setTab("banner");
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const clearLab = () => {
    setEndpoint("");
    setApiKey("");
    setAuthHeader("Authorization: Bearer YOUR_KEY");
    setBody("");
    setResponse(null);
    setTab("form");
  };

  const tabs: { id: LabTab; label: string; icon: typeof Braces }[] = [
    { id: "form", label: "Form", icon: Braces },
    { id: "text", label: "Response", icon: Code2 },
    { id: "banner", label: "Status", icon: ShieldAlert },
  ];

  const bodyText = responseText(response?.body);

  return (
    <section id="request-lab" className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Request lab</h2>
            <p className="mt-0.5 text-xs text-slate-500">Send a safe request and inspect the response without saving the secret.</p>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
          role="tablist"
          aria-label="Request lab views"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`request-lab-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                tab === id
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form tab */}
      {tab === "form" && (
        <div id="request-lab-form" role="tabpanel" className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="lab-method" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Method
              </Label>
              <Select value={method} onValueChange={(value) => setMethod(value as Method)}>
                <SelectTrigger id="lab-method" className="h-10 rounded-xl border-slate-200 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((item) => (
                    <SelectItem key={item} value={item} className="font-mono">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-endpoint" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                HTTPS endpoint
              </Label>
              <Input
                ref={endpointRef}
                id="lab-endpoint"
                type="url"
                placeholder="https://api.example.com/v1/models"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className={cn("h-10 rounded-xl border-slate-200 font-mono text-sm", fieldErrors.endpoint && "border-red-400")}
                aria-invalid={Boolean(fieldErrors.endpoint)}
                aria-describedby={fieldErrors.endpoint ? "lab-endpoint-error" : undefined}
              />
              {fieldErrors.endpoint && (
                <p id="lab-endpoint-error" className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.endpoint}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lab-key" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                API key
              </Label>
              <Input
                ref={keyRef}
                id="lab-key"
                type="password"
                placeholder="Paste a key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                maxLength={512}
                autoComplete="off"
                spellCheck={false}
                className={cn("h-10 rounded-xl border-slate-200 font-mono text-sm", fieldErrors.apiKey && "border-red-400")}
                aria-invalid={Boolean(fieldErrors.apiKey)}
                aria-describedby={fieldErrors.apiKey ? "lab-key-error" : undefined}
              />
              {fieldErrors.apiKey && (
                <p id="lab-key-error" className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.apiKey}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-auth" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Auth header
              </Label>
              <Input
                id="lab-auth"
                placeholder="Authorization: Bearer YOUR_KEY"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                className="h-10 rounded-xl border-slate-200 font-mono text-sm"
              />
            </div>
          </div>

          {method !== "GET" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="lab-body" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request body
                </Label>
                <span className="text-[11px] text-slate-400">JSON or text</span>
              </div>
              <Textarea
                id="lab-body"
                maxLength={128 * 1024}
                placeholder={'{\n  "example": true\n}'}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-32 rounded-xl border-slate-200 bg-slate-950 font-mono text-xs leading-relaxed text-slate-100 placeholder:text-slate-500"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={sendRequest}
              disabled={sending}
              className="h-10 gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Sending</>
              ) : (
                <><Send className="h-4 w-4" />Send request</>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={clearLab}
              disabled={sending}
              className="h-10 gap-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-slate-400 sm:ml-auto">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              Public HTTPS endpoints only
            </span>
          </div>
        </div>
      )}

      {/* Text response tab */}
      {tab === "text" && (
        <div id="request-lab-text" role="tabpanel" className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                response?.status === "valid"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : response?.status === "limited"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {response?.status === "valid" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <FileJson className="h-3.5 w-3.5" />
              )}
              {response?.status ?? "No request yet"}
            </span>
            {response?.statusCode && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                HTTP {response.statusCode}
              </span>
            )}
            {response?.latencyMs !== undefined && (
              <span className="font-mono text-xs text-slate-500">{response.latencyMs}ms</span>
            )}
            {bodyText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyText(bodyText)}
                className="ml-auto gap-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Clipboard className="h-3.5 w-3.5" />
                Copy
              </Button>
            )}
          </div>

          {response?.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {errorMessage(response.error)}
            </p>
          )}

          {bodyText ? (
            <pre className="max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
              {bodyText}
            </pre>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Code2 className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Response text will appear here</p>
              <p className="mt-1 text-xs text-slate-500">Send a request from the Form tab to inspect the response.</p>
            </div>
          )}
        </div>
      )}

      {/* Status banner tab */}
      {tab === "banner" && (
        <div id="request-lab-banner" role="tabpanel" className="p-5 sm:p-6">
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4",
              !response
                ? "border-slate-200 bg-slate-50"
                : response.status === "valid"
                  ? "border-emerald-200 bg-emerald-50"
                  : response.status === "limited"
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                !response
                  ? "bg-slate-100 text-slate-400"
                  : response.status === "valid"
                    ? "bg-emerald-100 text-emerald-600"
                    : response.status === "limited"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-red-100 text-red-600",
              )}
            >
              {response?.status === "valid" ? (
                <CheckCircle2 className="h-4.5 w-4.5" />
              ) : (
                <ShieldAlert className="h-4.5 w-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-bold",
                  !response
                    ? "text-slate-700"
                    : response.status === "valid"
                      ? "text-emerald-800"
                      : response.status === "limited"
                        ? "text-amber-800"
                        : "text-red-800",
                )}
              >
                {!response
                  ? "Request lab is ready"
                  : response.status === "valid"
                    ? "Request completed successfully"
                    : response.status === "limited"
                      ? "Request completed with limits"
                      : "Request needs attention"}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm",
                  !response
                    ? "text-slate-500"
                    : response.status === "valid"
                      ? "text-emerald-700"
                      : response.status === "limited"
                        ? "text-amber-700"
                        : "text-red-700",
                )}
              >
                {!response
                  ? "Use the Form tab to send a request to a public HTTPS endpoint."
                  : errorMessage(response.error) || "The response is available in the Response tab."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTab("form")}
              className="gap-2 rounded-xl border-slate-200 bg-white shadow-sm hover:border-slate-300"
            >
              <Play className="h-3.5 w-3.5" />
              Open form
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearLab}
              className="gap-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear lab
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
