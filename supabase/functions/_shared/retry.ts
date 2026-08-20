// Lightweight bounded retry helper for outbound provider requests.
// Pure TypeScript - no Deno/Node specific imports so it can be unit-tested.

export interface FetchRetryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, reason: string) => void;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 5_000;
const MAX_RETRY_AFTER_MS = 10_000;

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "DELETE"]);

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

export { isAbortError };

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function parseRetryAfter(header: string | null, now: number): number | null {
  if (!header) return null;
  const value = header.trim();
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - now);
  }

  return null;
}

export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

export function jitteredDelay(delayMs: number, random: () => number = Math.random): number {
  if (delayMs <= 1) return 0;
  return Math.floor(random() * delayMs);
}

export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(
  status: number,
  retryAfter: string | null,
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  now: number,
): number {
  if (status === 429) {
    const retryAfterMs = parseRetryAfter(retryAfter, now);
    if (retryAfterMs !== null) {
      return Math.min(retryAfterMs, MAX_RETRY_AFTER_MS);
    }
  }
  return jitteredDelay(backoffDelay(attempt, baseDelayMs, maxDelayMs));
}

/**
 * Fetches with bounded retries.
 *
 * - Retries HTTP 429 (respecting `Retry-After`, capped) and 5xx responses,
 *   but only for idempotent methods (GET/HEAD/OPTIONS/DELETE).
 * - Retries network errors and timeouts for any method, since the request
 *   may never have reached the provider.
 * - Uses exponential backoff with jitter and a small maximum retry count.
 * - On timeout throws an "AbortError"-named error; on network failure throws
 *   the underlying fetch error; on exhausted HTTP retries returns the last
 *   response so callers can classify it.
 */
export async function fetchWithRetry(
  url: string | URL,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const onRetry = options.onRetry;

  const method = (init.method ?? "GET").toUpperCase();
  const idempotent = IDEMPOTENT_METHODS.has(method);

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (init.signal?.aborted) {
      clearTimeout(timer);
      throw init.signal.reason ?? new Error("Request aborted");
    }
    const abortListener = () => controller.abort();
    init.signal?.addEventListener("abort", abortListener, { once: true });

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (idempotent && isRetryableHttpStatus(response.status) && attempt < maxRetries) {
        const delayMs = retryDelayMs(
          response.status,
          response.headers.get("retry-after"),
          attempt,
          baseDelayMs,
          maxDelayMs,
          Date.now(),
        );
        onRetry?.(attempt + 1, `HTTP ${response.status}`);
        await sleep(delayMs);
        continue;
      }

      return response;
    } catch (err) {
      if (init.signal?.aborted) throw err;
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = jitteredDelay(backoffDelay(attempt, baseDelayMs, maxDelayMs));
        onRetry?.(attempt + 1, isAbortError(err) ? "timeout" : "network error");
        await sleep(delayMs);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", abortListener);
    }
  }

  throw lastError;
}