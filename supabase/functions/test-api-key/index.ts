import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  return {
    remaining: remaining ? parseInt(remaining) : undefined,
    resetAt: reset ? new Date(parseInt(reset) * 1000).toISOString() : undefined,
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
      return { status: "invalid", error: `HTTP ${res.status}` };
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
      return { status: "invalid", error: `HTTP ${res.status}` };
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
      return { status: "invalid", error: `HTTP ${res.status}` };
    },
  },
  stripe: {
    url: "https://api.stripe.com/v1/balance",
    method: "GET",
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
    parseResult: async (res) => {
      if (res.ok) return { status: "valid", scopes: ["balance.read"] };
      if (res.status === 401) return { status: "invalid", error: "Invalid API key" };
      return { status: "invalid", error: `HTTP ${res.status}` };
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
      return { status: "invalid", error: `HTTP ${res.status}` };
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
      return { status: "invalid", error: `HTTP ${res.status}` };
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
      return { status: "invalid", error: `HTTP ${res.status}` };
    },
  },
  aws: {
    url: "https://sts.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15",
    method: "GET",
    headers: () => {
      return { Authorization: "AWS4-HMAC-SHA256" };
    },
    parseResult: async (res) => {
      if (res.ok) return { status: "valid" };
      if (res.status === 403) return { status: "invalid", error: "Invalid credentials" };
      if (res.status === 401) return { status: "invalid", error: "Invalid credentials" };
      return { status: "invalid", error: `HTTP ${res.status}` };
    },
  },
  supabase: {
    url: "",
    method: "GET",
    headers: (key) => ({ apikey: key }),
    parseResult: async (res) => {
      if (res.ok || res.status === 200) return { status: "valid" };
      if (res.status === 401 || res.status === 403) return { status: "invalid", error: "Invalid key" };
      return { status: "invalid", error: `HTTP ${res.status}` };
    },
  },
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const jwt = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: supabaseAnonKey },
    });
    if (!response.ok) return null;
    const userData = await response.json();
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
    const { provider, apiKey, customEndpoint, customAuthHeader } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ status: "invalid", error: "Provider and API key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let url: string;
    let method: string;
    let headers: Record<string, string>;
    let body: string | undefined;
    let parseResult: ProviderConfig["parseResult"];

    if (provider === "custom") {
      if (!customEndpoint) {
        return new Response(
          JSON.stringify({ status: "invalid", error: "Custom endpoint URL required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      url = customEndpoint;
      method = "GET";
      const headerParts = (customAuthHeader || "Authorization: Bearer YOUR_KEY").split(":");
      const headerName = headerParts[0].trim();
      const headerValue = headerParts.slice(1).join(":").trim().replace("YOUR_KEY", apiKey);
      headers = { [headerName]: headerValue };
      parseResult = async (res) => {
        if (res.ok) return { status: "valid" };
        if (res.status === 401 || res.status === 403) return { status: "invalid", error: "Unauthorized" };
        return { status: "invalid", error: `HTTP ${res.status}` };
      };
    } else {
      const config = providers[provider];
      if (!config) {
        return new Response(
          JSON.stringify({ status: "invalid", error: `Unknown provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      url = config.url;
      method = config.method;
      headers = config.headers(apiKey);
      body = config.body;
      parseResult = config.parseResult;
    }

    const fetchOptions: RequestInit = { method, headers };
    if (body && method !== "GET") fetchOptions.body = body;

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
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
    return new Response(
      JSON.stringify({ status: "invalid", error: "Validation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
