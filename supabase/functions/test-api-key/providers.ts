import {
  type RateLimitInfo,
  type StructuredApiError,
  type ValidationResult,
} from "../_shared/api-contract.ts";
import type { ProviderId } from "../_shared/provider-contract.ts";

export type ProviderRequest = {
  url: string;
  method: "GET";
  headers: (apiKey: string) => Record<string, string>;
  parseResult: (response: Response) => ValidationResult;
};

type CommonAuthOptions = {
  invalidCode?: "INVALID_API_KEY" | "INVALID_TOKEN";
  invalidMessage?: string;
};

function parseNonNegativeInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function parseResetAt(value: string | null): string | undefined {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric)) return undefined;
  const date = new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function getRateLimitInfo(
  response: Response,
): RateLimitInfo | undefined {
  const remainingValues = [
    "anthropic-ratelimit-requests-remaining",
    "anthropic-ratelimit-input-tokens-remaining",
    "anthropic-ratelimit-output-tokens-remaining",
    "x-ratelimit-remaining-requests",
    "x-ratelimit-remaining",
    "x-rate-limit-remaining",
    "ratelimit-remaining",
  ];
  const resetValues = [
    "anthropic-ratelimit-requests-reset",
    "anthropic-ratelimit-input-tokens-reset",
    "anthropic-ratelimit-output-tokens-reset",
    "x-ratelimit-reset-requests",
    "x-ratelimit-reset",
    "x-rate-limit-reset",
    "ratelimit-reset",
  ];

  let remaining: number | undefined;
  for (const name of remainingValues) {
    remaining = parseNonNegativeInteger(response.headers.get(name));
    if (remaining !== undefined) break;
  }

  let resetAt: string | undefined;
  for (const name of resetValues) {
    resetAt = parseResetAt(response.headers.get(name));
    if (resetAt) break;
  }

  return remaining === undefined && !resetAt
    ? undefined
    : { remaining, resetAt };
}

function providerError(
  code: StructuredApiError["code"],
  message: string,
  retryable = false,
): StructuredApiError {
  return { code, message, retryable };
}

function parseCommonAuthResult(
  response: Response,
  options: CommonAuthOptions = {},
): ValidationResult {
  const rateLimit = getRateLimitInfo(response);
  const invalidCode = options.invalidCode ?? "INVALID_API_KEY";
  const invalidMessage = options.invalidMessage ?? "Invalid API key";

  if (response.ok) return { status: "valid", rateLimit };
  if (response.status === 400 || response.status === 401) {
    return {
      status: "invalid",
      rateLimit,
      error: providerError(invalidCode, invalidMessage),
    };
  }
  if (response.status === 403 && rateLimit?.remaining === 0) {
    return {
      status: "limited",
      rateLimit,
      error: providerError(
        "RATE_LIMITED",
        "Provider rate limit reached",
        true,
      ),
    };
  }
  if (response.status === 403) {
    return {
      status: "limited",
      rateLimit,
      error: providerError(
        "ACCESS_FORBIDDEN",
        "Provider accepted the request but denied the required access",
      ),
    };
  }
  if (response.status === 429) {
    return {
      status: "limited",
      rateLimit,
      error: providerError("RATE_LIMITED", "Provider rate limit reached", true),
    };
  }
  if (response.status >= 500) {
    return {
      status: "limited",
      rateLimit,
      error: providerError(
        "PROVIDER_UNAVAILABLE",
        `Provider returned HTTP ${response.status}`,
        true,
      ),
    };
  }

  return {
    status: "limited",
    rateLimit,
    error: providerError(
      "PROVIDER_REJECTED",
      `Provider returned HTTP ${response.status}`,
    ),
  };
}

function withoutScopes(result: ValidationResult): ValidationResult {
  if (!result.scopes) return result;
  const { scopes: _scopes, ...rest } = result;
  return rest;
}

const standardHeaders = (key: string): Record<string, string> => ({
  Authorization: `Bearer ${key}`,
  "User-Agent": "KeyPing/1.0",
});

export const PROVIDER_REQUESTS: Partial<Record<ProviderId, ProviderRequest>> = {
  openai: {
    url: "https://api.openai.com/v1/models?limit=1",
    method: "GET",
    headers: standardHeaders,
    parseResult: (response) => withoutScopes(parseCommonAuthResult(response)),
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/models?limit=1",
    method: "GET",
    headers: (key) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "User-Agent": "KeyPing/1.0",
    }),
    parseResult: (response) => withoutScopes(parseCommonAuthResult(response)),
  },
  groq: {
    url: "https://api.groq.com/openai/v1/models",
    method: "GET",
    headers: standardHeaders,
    parseResult: (response) => withoutScopes(parseCommonAuthResult(response)),
  },
  stripe: {
    url: "https://api.stripe.com/v1/balance",
    method: "GET",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "User-Agent": "KeyPing/1.0",
    }),
    parseResult: (response) => withoutScopes(parseCommonAuthResult(response)),
  },
  github: {
    url: "https://api.github.com/user",
    method: "GET",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "KeyPing/1.0",
    }),
    parseResult: (response) => {
      const base = parseCommonAuthResult(response, {
        invalidCode: "INVALID_TOKEN",
        invalidMessage: "Invalid GitHub token",
      });
      if (!response.ok) return base;

      const rawScopes = response.headers.get("x-oauth-scopes");
      const scopes = rawScopes
        ? rawScopes.split(",")
          .map((scope) => scope.trim().slice(0, 200))
          .filter(Boolean)
          .slice(0, 100)
        : [];
      return { ...base, scopes };
    },
  },
  twitter: {
    url: "https://api.twitter.com/2/users/me?user.fields=id",
    method: "GET",
    headers: standardHeaders,
    parseResult: (response) =>
      withoutScopes(parseCommonAuthResult(response, {
        invalidCode: "INVALID_TOKEN",
        invalidMessage: "Invalid X access token",
      })),
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
    method: "GET",
    headers: (key) => ({
      "x-goog-api-key": key,
      "User-Agent": "KeyPing/1.0",
    }),
    parseResult: (response) =>
      withoutScopes(parseCommonAuthResult(response, {
        invalidMessage: "Invalid Gemini API key",
      })),
  },
};

export function createSupabaseLegacyRequest(
  projectRef: string,
): ProviderRequest {
  return {
    url: `https://${projectRef}.supabase.co/auth/v1/settings`,
    method: "GET",
    headers: (key) => ({
      apikey: key,
      "User-Agent": "KeyPing/1.0",
    }),
    parseResult: (response) =>
      withoutScopes(parseCommonAuthResult(response, {
        invalidMessage: "Invalid Supabase legacy API key",
      })),
  };
}
