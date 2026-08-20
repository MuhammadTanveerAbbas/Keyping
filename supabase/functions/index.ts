import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { fetchWithRetry, isAbortError } from "./_shared/retry.ts";

const ALLOWED_ORIGINS = [
 "https://keyping.app",
 "https://www.keyping.app",
 "https://keyping.vercel.app",
 "http://localhost:8080",
 "http://localhost:5173",
];

function getCorsHeaders(origin: string | null) {
 const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
 return {
  "Access-Control-Allow-Origin": allowed,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
 };
}

type ProviderConfig = {
 url: string;
 method: string;
 headers: (key: string) => Record<string, string>;
 body?: string;
 skipRequest?: boolean;
 parseResult: (res: Response) => Promise<{
  status: "valid" | "invalid" | "limited";
  scopes?: string[];
  rateLimit?: { remaining?: number; resetAt?: string };
  error?: string;
 }>;
};

function getRateLimitInfo(res: Response) {
 const remaining = res.headers.get("x-ratelimit-remaining");
 const reset = res.headers.get("x-ratelimit-reset");
 if (!remaining && !reset) return undefined;
 const parsedRemaining = remaining ? parseInt(remaining) : undefined;
 const parsedReset = reset ? parseInt(reset) : undefined;
 return {
  remaining: isNaN(parsedRemaining as number) ? undefined : parsedRemaining,
  resetAt: parsedReset && !isNaN(parsedReset) ? new Date(parsedReset * 1000).toISOString() : undefined,
 };
}

const providers: Record<string, ProviderConfig> = {
 openai: {
  url: "https://api.openai.com/v1/models",
  method: "GET",
  headers: (key) => ({ Authorization: `Bearer ${key}` }),
  parseResult: async (res) => {
   const rl = getRateLimitInfo(res);
   if (res.ok) return { status: "valid", rateLimit: rl };
   if (res.status === 401) return { status: "invalid", error: "Invalid API key" };
   if (res.status === 429) return { status: "limited", error: "Rate limited", rateLimit: rl };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - key may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 groq: {
  url: "https://api.groq.com/openai/v1/models",
  method: "GET",
  headers: (key) => ({ Authorization: `Bearer ${key}` }),
  parseResult: async (res) => {
   const rl = getRateLimitInfo(res);
   if (res.ok) return { status: "valid", rateLimit: rl };
   if (res.status === 401) return { status: "invalid", error: "Invalid API key" };
   if (res.status === 429) return { status: "limited", error: "Rate limited", rateLimit: rl };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - key may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 anthropic: {
  url: "https://api.anthropic.com/v1/messages",
  method: "POST",
  headers: (key) => ({
   "x-api-key": key,
   "Content-Type": "application/json",
   "anthropic-version": "2023-06-01",
  }),
  body: JSON.stringify({
   model: "claude-3-haiku-20240307",
   max_tokens: 1,
   messages: [{ role: "user", content: "hi" }],
  }),
  parseResult: async (res) => {
   const rl = getRateLimitInfo(res);
   if (res.ok) return { status: "valid", rateLimit: rl };
   if (res.status === 401) return { status: "invalid", error: "Invalid API key" };
   if (res.status === 429) return { status: "limited", error: "Rate limited", rateLimit: rl };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - key may lack required permissions" };
   if (res.status === 400) {
    try {
     const body = await res.json();
     if (body?.error?.message) return { status: "invalid", error: body.error.message };
    } catch { /* ignore parse error */ }
   }
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 stripe: {
  url: "https://api.stripe.com/v1/balance",
  method: "GET",
  headers: (key) => ({ Authorization: `Bearer ${key}` }),
  parseResult: async (res) => {
   if (res.ok) return { status: "valid", scopes: ["balance.read"] };
   if (res.status === 401) return { status: "invalid", error: "Invalid API key" };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - key may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 github: {
  url: "https://api.github.com/user",
  method: "GET",
  headers: (key) => ({ Authorization: `Bearer ${key}`, "User-Agent": "KeyPing" }),
  parseResult: async (res) => {
   const rl = getRateLimitInfo(res);
   if (res.ok) {
    const scopes = res.headers.get("x-oauth-scopes");
    return {
     status: "valid",
     scopes: scopes ? scopes.split(",").map((s) => s.trim()) : [],
     rateLimit: rl,
    };
   }
   if (res.status === 401) return { status: "invalid", error: "Invalid token" };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - token may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 twitter: {
  url: "https://api.twitter.com/2/users/me",
  method: "GET",
  headers: (key) => ({ Authorization: `Bearer ${key}` }),
  parseResult: async (res) => {
   const rl = getRateLimitInfo(res);
   if (res.ok) return { status: "valid", rateLimit: rl };
   if (res.status === 401) return { status: "invalid", error: "Invalid token" };
   if (res.status === 429) return { status: "limited", error: "Rate limited", rateLimit: rl };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - token may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
 notion: {
  url: "https://api.notion.com/v1/users/me",
  method: "GET",
  headers: (key) => ({
   Authorization: `Bearer ${key}`,
   "Notion-Version": "2022-06-28",
  }),
  parseResult: async (res) => {
   if (res.ok) return { status: "valid" };
   if (res.status === 401) return { status: "invalid", error: "Invalid token" };
   if (res.status === 403) return { status: "invalid", error: "Access forbidden - token may lack required permissions" };
   return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
  },
 },
  aws: {
   url: "",
   method: "GET",
   headers: () => {
    return {};
   },
   parseResult: async () => {
    return { status: "invalid", error: "AWS key validation requires SigV4 signing which is not currently supported. Use the AWS CLI or SDK to verify keys." };
   },
   skipRequest: true,
  },
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
 const authHeader = req.headers.get("authorization");
 if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

 const jwt = authHeader.slice(7);
 if (!jwt || jwt.split(".").length !== 3) return null;

 const supabaseUrl = Deno.env.get("SUPABASE_URL");
 const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

 if (!supabaseUrl || !supabaseAnonKey) return null;

 try {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
   headers: { Authorization: `Bearer ${jwt}`, apikey: supabaseAnonKey },
  });
  if (!response.ok) return null;
  const userData = await response.json();
  if (!userData?.id) return null;
  return { userId: userData.id };
 } catch {
  return null;
 }
}

serve(async (req) => {
 const origin = req.headers.get("origin");
 const corsHeaders = getCorsHeaders(origin);

 if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
 }

 const auth = await verifyAuth(req);
 if (!auth) {
  return new Response(
   JSON.stringify({ status: "invalid", error: "Authentication required" }),
   { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
 }

 try {
  const body = await req.json();

  if (!body || typeof body !== "object") {
   return new Response(
    JSON.stringify({ status: "invalid", error: "Invalid request body" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
   );
  }

  const { provider, apiKey, customEndpoint, customAuthHeader } = body;

  if (!provider || typeof provider !== "string") {
   return new Response(
    JSON.stringify({ status: "invalid", error: "Provider is required" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
   );
  }

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
   return new Response(
    JSON.stringify({ status: "invalid", error: "API key is required" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
   );
  }

  if (apiKey.length > 512) {
   return new Response(
    JSON.stringify({ status: "invalid", error: "API key exceeds maximum length" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
   );
  }

  let url: string;
  let method: string;
  let headers: Record<string, string>;
  let reqBody: string | undefined;
  let parseResult: ProviderConfig["parseResult"];

  if (provider === "custom") {
   if (!customEndpoint || typeof customEndpoint !== "string" || !customEndpoint.trim()) {
    return new Response(
     JSON.stringify({ status: "invalid", error: "Custom endpoint URL required" }),
     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
   }
   // SSRF protection: require HTTPS and reject private hostnames
   let parsedUrl: URL;
   try {
    parsedUrl = new URL(customEndpoint);
   } catch {
    return new Response(
     JSON.stringify({ status: "invalid", error: "Invalid endpoint URL" }),
     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
   }
   if (parsedUrl.protocol !== "https:") {
    return new Response(
     JSON.stringify({ status: "invalid", error: "Endpoint URL must use HTTPS" }),
     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
   }
    const privateHostnames = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]", "169.254.169.254", "100.100.100.200", "[fd00:ec2::254]", "metadata.google.internal"];
    const privatePrefixes = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "169.254.", "fd00:", "fe80:", "100.64.", "198.18.", "198.19."];
    const host = parsedUrl.hostname.toLowerCase();
    if (privateHostnames.includes(host) || privatePrefixes.some(p => host.startsWith(p))) {
     return new Response(
      JSON.stringify({ status: "invalid", error: "Endpoint URL must point to a public server" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
     );
    }
    if (parsedUrl.port && parsedUrl.port !== "443") {
     return new Response(
      JSON.stringify({ status: "invalid", error: "Custom endpoint must use standard HTTPS port 443" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
     );
    }
   url = customEndpoint;
   method = "GET";
   const headerParts = (customAuthHeader || "Authorization: Bearer YOUR_KEY").split(":");
   const headerName = headerParts[0].trim();
   const headerValue = headerParts.slice(1).join(":").trim().replace("YOUR_KEY", apiKey);
   headers = { [headerName]: headerValue, "User-Agent": "KeyPing" };
   parseResult = async (res) => {
    if (res.ok) return { status: "valid" };
    if (res.status === 401 || res.status === 403) return { status: "invalid", error: "Unauthorized - check your key and endpoint" };
    if (res.status === 429) return { status: "limited", error: "Rate limited by custom endpoint" };
    return { status: "invalid", error: `HTTP ${res.status}: ${res.statusText || "Unknown error"}` };
   };
  } else {
   const config = providers[provider];
   if (!config) {
    return new Response(
     JSON.stringify({ status: "invalid", error: `Unknown provider: ${provider}` }),
     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
   }
   if (config.skipRequest) {
    const result = await config.parseResult(new Response(null, { status: 400 }));
    return new Response(JSON.stringify({ ...result, latencyMs: 0, healthScore: 0 }), {
     headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
   }
   url = config.url;
   method = config.method;
   headers = config.headers(apiKey);
   headers["User-Agent"] = "KeyPing";
   reqBody = config.body;
   parseResult = config.parseResult;
  }

  const fetchOptions: RequestInit = { method, headers };
  if (reqBody && method !== "GET") fetchOptions.body = reqBody;

  const startTime = Date.now();
  let response: Response;
  try {
   response = await fetchWithRetry(url, fetchOptions, {
    onRetry: (attempt, reason) => {
     console.warn(`[test-api-key] retry ${attempt} for ${provider}: ${reason}`);
    },
   });
  } catch (fetchError) {
   if (isAbortError(fetchError)) {
    return new Response(
     JSON.stringify({ status: "invalid", error: "Request timed out - provider may be unreachable" }),
     { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
   }
   return new Response(
    JSON.stringify({ status: "invalid", error: `Network error: ${fetchError instanceof Error ? fetchError.message : "Failed to reach provider"}` }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
   );
  }

  const latencyMs = Date.now() - startTime;

  const result = await parseResult(response);

  let healthScore = 0;
  if (result.status === "valid") healthScore += 50;
  else if (result.status === "limited") healthScore += 25;

  if (result.scopes && result.scopes.length > 0) healthScore += 15;
  else if (result.status === "valid") healthScore += 10;

  if (result.rateLimit?.remaining !== undefined) {
   if (result.rateLimit.remaining > 100) healthScore += 20;
   else if (result.rateLimit.remaining > 10) healthScore += 10;
   else healthScore += 5;
  } else if (result.status === "valid") {
   healthScore += 15;
  }

  if (latencyMs < 500) healthScore += 15;
  else if (latencyMs < 1000) healthScore += 10;
  else if (latencyMs < 3000) healthScore += 5;

  healthScore = Math.min(100, healthScore);

  return new Response(JSON.stringify({ ...result, latencyMs, healthScore }), {
   headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return new Response(
   JSON.stringify({ status: "invalid", error: `Validation failed: ${message}` }),
   { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
 }
});
