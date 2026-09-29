import {
  type ApiErrorCode,
  calculateHealthScore,
  type StructuredApiError,
  type TestApiKeyErrorResponse,
  type TestApiKeyResponse,
  type ValidationResult,
} from "../_shared/api-contract.ts";
import {
  getProviderCapability,
  getSupabaseProjectRef,
  normalizeProviderId,
  type ProviderCapability,
  type ProviderId,
  VALIDATION_CHECKS,
  type ValidationCheck,
} from "../_shared/provider-contract.ts";
import {
  buildCustomAuthHeader,
  CUSTOM_METHODS,
  EndpointValidationError,
  fetchPinnedCustomEndpoint,
  isValidSupabaseProjectRef,
  MAX_CUSTOM_BODY_BYTES,
  resolvePublicAddresses,
  validateCustomEndpointUrl,
  type CustomMethod,
} from "../_shared/ssrf.ts";
import { fetchWithRetry, isAbortError } from "../_shared/retry.ts";
import { resolveAllowedOrigin } from "../_shared/origins.ts";
import {
  createSupabaseLegacyRequest,
  PROVIDER_REQUESTS,
  type ProviderRequest,
} from "./providers.ts";

const MAX_REQUEST_BYTES = 160 * 1024;
const MAX_API_KEY_LENGTH = 512;
const PROVIDER_TIMEOUT_MS = 8000;

// Request budget applied per authenticated account in a fixed window. The
// limits live in the database so they are enforced server side and survive a
// cold start. These values only tell the database what the budget is.
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// Supabase Auth user ids are UUIDs.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function describeError(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

// Structured logging with no secret material in it.
//
// This function previously had no logging at all, which meant a bypassed SSRF
// control or a mishandled key would leave no trace. Every field passed here
// is either a fixed label, a provider id, an HTTP status, or an error class
// name. The API key, any custom endpoint, and any response body must never be
// passed to this function, and no value derived from them may be either.
function logEvent(event: string, fields: Record<string, unknown> = {}): void {
  const entries = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `"${key}":${JSON.stringify(value)}`)
    .join(",");
  console.log(`keyping ${event}${entries ? ` {${entries}}` : ""}`);
}

class UnsupportedCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedCheckError";
  }
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  // The allowlist is shared with the Vercel routes so the two cannot disagree.
  // The live deployment origin is the first entry, and the Vercel provided
  // origin is not known inside this runtime, so it is passed as null.
  const allowed = resolveAllowedOrigin(origin, null);

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function structuredError(
  code: ApiErrorCode,
  message: string,
  retryable = false,
): StructuredApiError {
  return { code, message, retryable };
}

function jsonResponse(
  payload: object,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function errorResponse(
  corsHeaders: Record<string, string>,
  status: number,
  code: ApiErrorCode,
  message: string,
  retryable = false,
  extra: Record<string, unknown> = {},
): Response {
  const payload = {
    status: status >= 500 ? "limited" : "invalid",
    error: message,
    errorDetails: structuredError(code, message, retryable),
    ...extra,
  } as TestApiKeyErrorResponse & Record<string, unknown>;
  return jsonResponse(payload, status, corsHeaders);
}

async function readRequestJson(
  request: Request,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Content-Type must be application/json",
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    if (
      !/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES
    ) {
      throw new EndpointValidationError(
        "INVALID_ENDPOINT",
        "Request body is too large",
      );
    }
  }

  if (!request.body) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Request body is required",
    );
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let raw = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new EndpointValidationError(
        "INVALID_ENDPOINT",
        "Request body is too large",
      );
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Request body must be valid JSON",
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Request body must be an object",
    );
  }
  return body as Record<string, unknown>;
}

function normalizeApiKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "API key is required",
    );
  }
  const apiKey = value.trim();
  if (!apiKey) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "API key is required",
    );
  }
  if (apiKey.length > MAX_API_KEY_LENGTH) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "API key exceeds maximum length",
    );
  }
  if (!/^[\u0021-\u007E]+$/.test(apiKey)) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "API key contains unsupported characters",
    );
  }
  return apiKey;
}

function getSupabaseGatewayKey(): string | null {
  const legacyKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyKey) return legacyKey;

  for (const name of ["SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_SECRET_KEYS"]) {
    const raw = Deno.env.get(name);
    if (!raw) continue;
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const value = keys.anon ?? keys.default ?? Object.values(keys)[0];
      if (typeof value === "string" && value) return value;
    } catch {
      continue;
    }
  }
  return null;
}

function resolveChecks(
  value: unknown,
  capability: ProviderCapability,
): readonly ValidationCheck[] {
  if (value === undefined) return capability.supportedChecks;
  if (!Array.isArray(value) || value.length > VALIDATION_CHECKS.length) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "checks must be an array of supported check names",
    );
  }

  const selected = new Set<ValidationCheck>();
  for (const check of value) {
    if (
      typeof check !== "string" ||
      !VALIDATION_CHECKS.includes(check as ValidationCheck)
    ) {
      throw new EndpointValidationError(
        "INVALID_ENDPOINT",
        "checks contains an unknown check",
      );
    }
    if (!capability.supportedChecks.includes(check as ValidationCheck)) {
      throw new UnsupportedCheckError(
        `${capability.name} does not support the ${check} check`,
      );
    }
    selected.add(check as ValidationCheck);
  }

  selected.add("status");
  return VALIDATION_CHECKS.filter((check) => selected.has(check));
}

// Resolves the caller to a Supabase Auth user id, or null when the caller is
// not authenticated.
//
// Verification is done by asking Supabase Auth about the token rather than by
// decoding it locally, so the signature, issuer, audience, expiry, and role
// are all enforced by the authority that issued the token. A locally decoded
// but unverified token would be attacker controlled.
//
// The returned id is the only identity this function trusts, and it is what
// the rate limiter charges.
async function resolveAuthenticatedUser(request: Request): Promise<string | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const jwt = authorization.slice(7).trim();
  if (!jwt || jwt.split(".").length !== 3) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = getSupabaseGatewayKey();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const userUrl = new URL("/auth/v1/user", supabaseUrl);
    if (userUrl.protocol !== "https:") return null;
    const response = await fetch(userUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: supabaseAnonKey,
      },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: unknown };
    if (typeof user.id !== "string" || user.id.length === 0) return null;
    // A Supabase Auth user id is a UUID. Rejecting anything else keeps a
    // malformed response from reaching the rate limit table as a key.
    if (!UUID_PATTERN.test(user.id)) return null;
    return user.id;
  } catch {
    return null;
  }
}

// Charges one unit of the caller's request budget.
//
// The budget lives in the database rather than in this function so it is
// enforced for every caller of the endpoint, cannot be reset by restarting the
// function, and cannot be bypassed by calling the function more directly.
//
// The RPC is only executable by service_role, and the user id passed in is the
// one Supabase Auth just confirmed, so a caller can neither charge someone else
// nor call the limiter directly.
//
// Fails closed. If the limiter cannot be reached the request is refused
// rather than allowed through unmetered, because an unmetered endpoint can be
// used to burn other people's provider quota.
async function consumeRequestBudget(userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    logEvent("rate_limit_unconfigured", { userId });
    return false;
  }

  try {
    const rpcUrl = new URL("/rest/v1/rpc/consume_rate_limit", supabaseUrl);
    if (rpcUrl.protocol !== "https:") return false;
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      logEvent("rate_limit_rpc_failed", { userId, httpStatus: response.status });
      return false;
    }
    const allowed = await response.json();
    if (allowed !== true) {
      logEvent("rate_limit_exceeded", { userId });
    }
    return allowed === true;
  } catch (error) {
    logEvent("rate_limit_error", { userId, reason: describeError(error) });
    return false;
  }
}

function completedResponse(
  corsHeaders: Record<string, string>,
  provider: ProviderId,
  capability: ProviderCapability,
  checks: readonly ValidationCheck[],
  result: ValidationResult,
  latencyMs: number,
  extra: Partial<TestApiKeyResponse> = {},
): Response {
  const payload: TestApiKeyResponse = {
    provider,
    capability: capability.availability,
    checks: [...checks],
    status: result.status,
  };

  if (checks.includes("docs") && capability.docsUrl) {
    payload.docsUrl = capability.docsUrl;
  }
  if (checks.includes("scopes") && result.scopes !== undefined) {
    payload.scopes = result.scopes;
  }
  if (checks.includes("rateLimit") && result.rateLimit !== undefined) {
    payload.rateLimit = result.rateLimit;
  }
  if (checks.includes("responseTime")) payload.latencyMs = latencyMs;
  if (checks.includes("healthScore")) {
    payload.healthScore = calculateHealthScore(result, latencyMs);
  }
  if (result.error) {
    payload.error = result.error.message;
    payload.errorDetails = result.error;
  }
  Object.assign(payload, extra);

  return jsonResponse(payload, 200, corsHeaders);
}

async function runProviderRequest(
  request: ProviderRequest,
  apiKey: string,
): Promise<{ response: Response; latencyMs: number }> {
  const startedAt = Date.now();
  const response = await fetchWithRetry(
    request.url,
    {
      method: request.method,
      headers: request.headers(apiKey),
      redirect: "error",
    },
    {
      timeoutMs: PROVIDER_TIMEOUT_MS,
      maxRetries: 1,
      baseDelayMs: 200,
      maxDelayMs: 1000,
    },
  );
  return { response, latencyMs: Date.now() - startedAt };
}

function providerRequestFor(
  provider: ProviderId,
  apiKey: string,
): ProviderRequest | null {
  if (provider === "supabase") {
    const projectRef = getSupabaseProjectRef(apiKey);
    return projectRef && isValidSupabaseProjectRef(projectRef)
      ? createSupabaseLegacyRequest(projectRef)
      : null;
  }
  return PROVIDER_REQUESTS[provider] ?? null;
}

function normalizeCustomMethod(value: unknown): CustomMethod {
  const method = typeof value === "string" ? value.toUpperCase() : "GET";
  if (!CUSTOM_METHODS.includes(method as CustomMethod)) {
    throw new EndpointValidationError("INVALID_ENDPOINT", "Custom request method is not supported");
  }
  return method as CustomMethod;
}

function normalizeCustomBody(method: CustomMethod, value: unknown): string | undefined {
  if (method === "GET" || value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new EndpointValidationError("INVALID_ENDPOINT", "Custom request body must be text");
  if (new TextEncoder().encode(value).byteLength > MAX_CUSTOM_BODY_BYTES) throw new EndpointValidationError("INVALID_ENDPOINT", "Custom request body is too large");
  return value;
}

async function handleCustomRequest(
  apiKey: string,
  customEndpoint: unknown,
  customAuthHeader: unknown,
  methodValue: unknown,
  bodyValue: unknown,
): Promise<Response> {
  const endpoint = validateCustomEndpointUrl(customEndpoint);
  const authHeader = buildCustomAuthHeader(
    customAuthHeader ?? "Authorization: Bearer YOUR_KEY",
    apiKey,
  );
  const method = normalizeCustomMethod(methodValue);
  const body = normalizeCustomBody(method, bodyValue);
  const addresses = await resolvePublicAddresses(endpoint);
  const headers = Object.create(null) as Record<string, string>;
  headers.Accept = "*/*";
  headers["User-Agent"] = "KeyPing/1.0";
  headers[authHeader.name] = authHeader.value;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return await fetchPinnedCustomEndpoint(endpoint, addresses, headers, { method, body });
}

export async function handleTestApiKey(request: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return errorResponse(
      corsHeaders,
      405,
      "INVALID_REQUEST",
      "Method not allowed",
      false,
    );
  }

  const callerId = await resolveAuthenticatedUser(request);
  if (!callerId) {
    return errorResponse(
      corsHeaders,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  // Charged before the body is read and before any provider call, so an
  // authenticated caller cannot reach a provider without paying for it.
  if (!await consumeRequestBudget(callerId)) {
    return errorResponse(
      corsHeaders,
      429,
      "RATE_LIMITED",
      "Too many validation requests. Wait a moment and try again.",
      true,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readRequestJson(request);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Invalid request body";
    return errorResponse(corsHeaders, 400, "INVALID_REQUEST", message);
  }

  if (typeof body.provider !== "string" || body.provider.length > 64) {
    return errorResponse(
      corsHeaders,
      400,
      "INVALID_PROVIDER",
      "Provider is required",
    );
  }
  const provider = normalizeProviderId(body.provider);
  const capability = provider ? getProviderCapability(provider) : undefined;
  if (!provider || !capability) {
    return errorResponse(
      corsHeaders,
      400,
      "INVALID_PROVIDER",
      "Unknown provider",
    );
  }

  let apiKey: string;
  let checks: readonly ValidationCheck[];
  try {
    apiKey = normalizeApiKey(body.apiKey);
    checks = resolveChecks(body.checks, capability);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return errorResponse(
      corsHeaders,
      400,
      error instanceof UnsupportedCheckError
        ? "UNSUPPORTED_CHECK"
        : "INVALID_REQUEST",
      message,
      false,
      { provider, capability: capability.availability },
    );
  }

  if (capability.availability === "planned") {
    return errorResponse(
      corsHeaders,
      422,
      "PROVIDER_PLANNED",
      `${capability.name} validation is planned but not available`,
      false,
      { provider, capability: capability.availability, checks: [...checks] },
    );
  }

  if (provider === "custom") {
    const errorContext: Record<string, unknown> = {
      provider,
      capability: capability.availability,
      checks: [...checks],
    };
    try {
      const startedAt = Date.now();
      const response = await handleCustomRequest(
        apiKey,
        body.customEndpoint,
        body.customAuthHeader,
        body.method,
        body.requestBody,
      );
      const responseBody = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());
      const latencyMs = Date.now() - startedAt;
      const result = response.ok
        ? { status: "valid" as const }
        : response.status === 401 || response.status === 403
        ? {
          status: "invalid" as const,
          error: structuredError(
            "INVALID_API_KEY",
            "Custom endpoint rejected the key",
          ),
        }
        : response.status === 429
        ? {
          status: "limited" as const,
          error: structuredError(
            "RATE_LIMITED",
            "Custom endpoint rate limit reached",
            true,
          ),
        }
        : response.status >= 300 && response.status < 400
        ? {
          status: "invalid" as const,
          error: structuredError(
            "ENDPOINT_REDIRECT",
            "Custom endpoint redirects are not allowed",
          ),
        }
        : response.status >= 500
        ? {
          status: "limited" as const,
          error: structuredError(
            "PROVIDER_UNAVAILABLE",
            `Custom endpoint returned HTTP ${response.status}`,
            true,
          ),
        }
        : {
          status: "invalid" as const,
          error: structuredError(
            "PROVIDER_REJECTED",
            `Custom endpoint returned HTTP ${response.status}`,
          ),
        };
      return completedResponse(
        corsHeaders,
        provider,
        capability,
        checks,
        result,
        latencyMs,
        { statusCode: response.status, headers: responseHeaders, body: responseBody },
      );
    } catch (error) {
      if (error instanceof EndpointValidationError) {
        if (error.code === "ENDPOINT_TIMEOUT") {
          return errorResponse(
            corsHeaders,
            504,
            "ENDPOINT_TIMEOUT",
            error.message,
            true,
            errorContext,
          );
        }
        if (error.code === "DNS_RESOLUTION_FAILED") {
          // 502, not 400. A name that will not resolve is a condition of the
          // endpoint or of DNS, not a malformed request, and marking it
          // retryable on a 4xx told the client to retry something it could
          // not fix.
          return errorResponse(
            corsHeaders,
            502,
            "DNS_RESOLUTION_FAILED",
            error.message,
            true,
            errorContext,
          );
        }
        if (error.code === "NETWORK_ERROR") {
          return errorResponse(
            corsHeaders,
            502,
            "NETWORK_ERROR",
            error.message,
            true,
            errorContext,
          );
        }
        if (error.code === "INVALID_ENDPOINT") {
          // The caller sent something we will not accept, so this is a request
          // error and must not be reported as the endpoint having rejected us.
          return errorResponse(
            corsHeaders,
            400,
            "INVALID_REQUEST",
            error.message,
            false,
            errorContext,
          );
        }
        return errorResponse(
          corsHeaders,
          400,
          "ENDPOINT_REJECTED",
          error.message,
          false,
          errorContext,
        );
      }
      return errorResponse(
        corsHeaders,
        502,
        "NETWORK_ERROR",
        "Custom endpoint request failed",
        true,
        errorContext,
      );
    }
  }

  if (provider === "aws") {
    const result: ValidationResult = {
      status: "limited",
      error: structuredError(
        "VALIDATION_UNAVAILABLE",
        "AWS validation requires a SigV4-signed STS request and is not available",
      ),
    };
    return completedResponse(
      corsHeaders,
      provider,
      capability,
      checks,
      result,
      0,
    );
  }

  const providerRequest = providerRequestFor(provider, apiKey);
  if (!providerRequest) {
    const result: ValidationResult = {
      status: "limited",
      error: structuredError(
        "VALIDATION_UNAVAILABLE",
        "This Supabase key format has no project ref. Validate it with a custom HTTPS endpoint that includes the project URL.",
      ),
    };
    return completedResponse(
      corsHeaders,
      provider,
      capability,
      checks,
      result,
      0,
    );
  }

  try {
    const { response, latencyMs } = await runProviderRequest(
      providerRequest,
      apiKey,
    );
    // Provider parsers read only the status and bounded headers, so the body
    // is always released. This runs in a finally so a parser that throws still
    // returns the connection instead of leaking it, and the parser bug is no
    // longer misreported to the client as a network fault.
    let result: ValidationResult;
    try {
      result = providerRequest.parseResult(response);
    } finally {
      try {
        await response.body?.cancel();
      } catch {
        // The body may already be consumed or errored. Nothing to release.
      }
    }
    return completedResponse(
      corsHeaders,
      provider,
      capability,
      checks,
      result,
      latencyMs,
    );
  } catch (error) {
    if (isAbortError(error)) {
      logEvent("provider_timeout", { provider, error: describeError(error) });
      return errorResponse(
        corsHeaders,
        504,
        "PROVIDER_TIMEOUT",
        "Provider request timed out",
        true,
        { provider, capability: capability.availability, checks: [...checks] },
      );
    }
    logEvent("provider_request_failed", {
      provider,
      error: describeError(error),
    });
    return errorResponse(
      corsHeaders,
      502,
      "NETWORK_ERROR",
      "Provider request failed",
      true,
      { provider, capability: capability.availability, checks: [...checks] },
    );
  }
}
