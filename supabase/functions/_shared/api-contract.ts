import type {
  ProviderAvailability,
  ProviderId,
  ValidationCheck,
} from "./provider-contract.ts";

export type ValidationStatus = "valid" | "invalid" | "limited";

export type ApiErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_REQUEST"
  | "INVALID_PROVIDER"
  | "UNSUPPORTED_CHECK"
  | "PROVIDER_PLANNED"
  | "VALIDATION_UNAVAILABLE"
  | "ENDPOINT_REJECTED"
  | "DNS_RESOLUTION_FAILED"
  | "ENDPOINT_REDIRECT"
  | "ENDPOINT_TIMEOUT"
  | "PROVIDER_TIMEOUT"
  | "NETWORK_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INVALID_API_KEY"
  | "INVALID_TOKEN"
  | "ACCESS_FORBIDDEN"
  | "PROVIDER_REJECTED"
  | "INTERNAL_ERROR";

export type StructuredApiError = {
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
};

export type RateLimitInfo = {
  remaining?: number;
  resetAt?: string;
};

export type TestApiKeyRequest = {
  provider: ProviderId;
  apiKey: string;
  checks?: ValidationCheck[];
  customEndpoint?: string;
  customAuthHeader?: string;
  method?: string;
  requestBody?: string;
};

export type TestApiKeyResponse = {
  provider: ProviderId;
  capability: ProviderAvailability;
  checks: ValidationCheck[];
  status: ValidationStatus;
  docsUrl?: string;
  scopes?: string[];
  rateLimit?: RateLimitInfo;
  latencyMs?: number;
  healthScore?: number;
  error?: string;
  errorDetails?: StructuredApiError;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
};

export type TestApiKeyErrorResponse = {
  status: ValidationStatus;
  error: string;
  errorDetails: StructuredApiError;
  provider?: ProviderId;
  capability?: ProviderAvailability;
  checks?: ValidationCheck[];
};

export type ValidationResult = {
  status: ValidationStatus;
  scopes?: string[];
  rateLimit?: RateLimitInfo;
  error?: StructuredApiError;
};

export function calculateHealthScore(
  result: Pick<ValidationResult, "status" | "scopes" | "rateLimit">,
  latencyMs: number,
): number {
  if (result.status === "invalid") return 0;

  let score = result.status === "valid" ? 50 : 25;

  if (result.scopes && result.scopes.length > 0) score += 15;
  else if (result.status === "valid") score += 10;

  if (result.rateLimit?.remaining !== undefined) {
    if (result.rateLimit.remaining > 100) score += 20;
    else if (result.rateLimit.remaining > 10) score += 10;
    else score += 5;
  } else if (result.status === "valid") {
    score += 15;
  }

  if (latencyMs < 500) score += 15;
  else if (latencyMs < 1000) score += 10;
  else if (latencyMs < 3000) score += 5;

  return Math.min(100, score);
}
