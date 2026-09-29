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
      // The endpoint's response body can itself contain sensitive material, so
      // it is discarded at the same moment the key is. Clearing only the key
      // left the previous response sitting on screen.
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
    if (method !== "GET" && !body.trim()) {
      toast.info("The request body is empty");
    }

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
      // A rejected custom endpoint, a blocked address, and a DNS failure all
      // have distinct explanations on the server. Using the server's message
      // is what makes the request lab usable for diagnosing them.
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
    { id: "text", label: "Text response", icon: Code2 },
    { id: "banner", label: "Status banner", icon: ShieldAlert },
  ];

  const bodyText = responseText(response?.body);

  return (
    <section id="request-lab" className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm"><Terminal className="h-4 w-4" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Request lab</h2>
            <p className="mt-0.5 text-xs text-slate-500">Send a safe request and inspect the response without saving the secret.</p>
          </div>
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Request lab views">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={`request-lab-${id}`} onClick={() => setTab(id)} className={cn("inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", tab === id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "form" && (
        <div id="request-lab-form" role="tabpanel" className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[150px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="lab-method" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Method</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as Method)}>
                <SelectTrigger id="lab-method" className="h-11 rounded-xl border-slate-200 bg-slate-50/60 font-mono text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((item) => <SelectItem key={item} value={item} className="font-mono">{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-endpoint" className="text-xs font-semibold uppercase tracking-wider text-slate-600">HTTPS endpoint</Label>
              <Input ref={endpointRef} id="lab-endpoint" type="url" placeholder="https://api.example.com/v1/models" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/60 font-mono text-sm", fieldErrors.endpoint && "border-red-400")} aria-invalid={Boolean(fieldErrors.endpoint)} aria-describedby={fieldErrors.endpoint ? "lab-endpoint-error" : undefined} />
              {fieldErrors.endpoint && <p id="lab-endpoint-error" className="text-xs font-medium text-red-600" role="alert">{fieldErrors.endpoint}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lab-key" className="text-xs font-semibold uppercase tracking-wider text-slate-600">API key</Label>
              <Input ref={keyRef} id="lab-key" type="password" placeholder="Paste a key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} maxLength={512} autoComplete="off" spellCheck={false} className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/60 font-mono text-sm", fieldErrors.apiKey && "border-red-400")} aria-invalid={Boolean(fieldErrors.apiKey)} aria-describedby={fieldErrors.apiKey ? "lab-key-error" : undefined} />
              {fieldErrors.apiKey && <p id="lab-key-error" className="text-xs font-medium text-red-600" role="alert">{fieldErrors.apiKey}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-auth" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Auth header</Label>
              <Input id="lab-auth" placeholder="Authorization: Bearer YOUR_KEY" value={authHeader} onChange={(event) => setAuthHeader(event.target.value)} className="h-11 rounded-xl border-slate-200 bg-slate-50/60 font-mono text-sm" />
            </div>
          </div>

          {method !== "GET" && <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor="lab-body" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Request body</Label><span className="text-[11px] text-slate-400">JSON or text</span></div><Textarea id="lab-body" maxLength={128 * 1024} placeholder={'{\n  "example": true\n}'} value={body} onChange={(event) => setBody(event.target.value)} className="min-h-32 rounded-xl border-slate-200 bg-slate-950 font-mono text-xs leading-relaxed text-slate-100 placeholder:text-slate-500" /></div>}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={sendRequest} disabled={sending} className="h-11 gap-2 rounded-xl bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700">
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending request</> : <><Send className="h-4 w-4" />Send request</>}
            </Button>
            <Button type="button" variant="ghost" onClick={clearLab} disabled={sending} className="h-11 gap-2 rounded-xl text-slate-600 hover:bg-slate-50"><RotateCcw className="h-4 w-4" />Reset</Button>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><ShieldAlert className="h-3.5 w-3.5" />Public HTTPS endpoints only</span>
          </div>
        </div>
      )}

      {tab === "text" && (
        <div id="request-lab-text" role="tabpanel" className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", response?.status === "valid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : response?.status === "limited" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
              {response?.status === "valid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileJson className="h-3.5 w-3.5" />}
              {response?.status ?? "No request yet"}
            </span>
            {response?.statusCode && <span className="font-mono text-xs text-slate-500">HTTP {response.statusCode}</span>}
            {response?.latencyMs !== undefined && <span className="font-mono text-xs text-slate-500">{response.latencyMs}ms</span>}
            {bodyText && <Button type="button" variant="ghost" size="sm" onClick={() => copyText(bodyText)} className="ml-auto gap-1.5 text-slate-600"><Clipboard className="h-3.5 w-3.5" />Copy response</Button>}
          </div>
          {response?.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage(response.error)}</p>}
          {bodyText ? <pre className="max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">{bodyText}</pre> : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 text-center"><Code2 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">Response text will appear here</p><p className="mt-1 text-xs text-slate-500">Send a request from the Form tab to inspect the response.</p></div>}
        </div>
      )}

      {tab === "banner" && (
        <div id="request-lab-banner" role="tabpanel" className="p-5 sm:p-6">
          <div className={cn("flex items-start gap-3 rounded-xl border p-4", !response ? "border-slate-200 bg-slate-50/70" : response.status === "valid" ? "border-emerald-200 bg-emerald-50" : response.status === "limited" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50")}>
            {response?.status === "valid" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <ShieldAlert className={cn("mt-0.5 h-5 w-5 shrink-0", !response ? "text-slate-400" : "text-red-500")} />}
            <div className="min-w-0"><p className={cn("text-sm font-bold", !response ? "text-slate-700" : response.status === "valid" ? "text-emerald-800" : response.status === "limited" ? "text-amber-800" : "text-red-800")}>{!response ? "Request lab is ready" : response.status === "valid" ? "Request completed successfully" : response.status === "limited" ? "Request completed with limits" : "Request needs attention"}</p><p className={cn("mt-1 text-sm", !response ? "text-slate-500" : response.status === "valid" ? "text-emerald-700" : response.status === "limited" ? "text-amber-700" : "text-red-700")}>{!response ? "Use the Form tab to send a request to a public HTTPS endpoint." : errorMessage(response.error) || "The response is available in the Text response tab."}</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5"><Button type="button" variant="outline" size="sm" onClick={() => setTab("form")} className="gap-2 rounded-xl border-slate-200 bg-white shadow-sm"><Play className="h-3.5 w-3.5" />Open form</Button><Button type="button" variant="ghost" size="sm" onClick={clearLab} className="gap-2 rounded-xl text-slate-600 hover:bg-slate-100"><Trash2 className="h-3.5 w-3.5" />Clear lab</Button></div>
        </div>
      )}
    </section>
  );
}
