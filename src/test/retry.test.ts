import { describe, it, expect, vi, afterEach } from "vitest";
import {
  backoffDelay,
  fetchWithRetry,
  isRetryableHttpStatus,
  isAbortError,
  jitteredDelay,
  parseRetryAfter,
  sleep,
} from "../../supabase/functions/_shared/retry";

const GROQ_URL = "https://api.groq.com/openai/v1/models";

function abortingFetch(): ReturnType<typeof vi.fn> {
  return vi.fn(
    (_url: string | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("The operation was aborted."), { name: "AbortError" }));
        });
      }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("parseRetryAfter", () => {
  it("returns null for missing or empty header", () => {
    expect(parseRetryAfter(null, Date.now())).toBeNull();
    expect(parseRetryAfter("", Date.now())).toBeNull();
  });

  it("parses seconds", () => {
    expect(parseRetryAfter("5", Date.now())).toBe(5000);
    expect(parseRetryAfter("0", Date.now())).toBe(0);
  });

  it("parses HTTP-date and clamps past dates to zero", () => {
    const now = new Date("2026-08-20T12:00:00Z").getTime();
    const future = new Date("2026-08-20T12:00:10Z");
    expect(parseRetryAfter(future.toUTCString(), now)).toBe(10000);
    const past = new Date("2026-08-20T11:00:00Z");
    expect(parseRetryAfter(past.toUTCString(), now)).toBe(0);
  });

  it("returns null for invalid values", () => {
    expect(parseRetryAfter("not-a-number", Date.now())).toBeNull();
  });
});

describe("backoffDelay", () => {
  it("grows exponentially and is capped", () => {
    expect(backoffDelay(0, 300, 5000)).toBe(300);
    expect(backoffDelay(1, 300, 5000)).toBe(600);
    expect(backoffDelay(2, 300, 5000)).toBe(1200);
    expect(backoffDelay(5, 300, 5000)).toBe(5000);
  });
});

describe("jitteredDelay", () => {
  it("is bounded by the requested delay", () => {
    for (let i = 0; i < 50; i++) {
      const value = jitteredDelay(1000);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1000);
    }
  });

  it("is deterministic with an injected random source", () => {
    expect(jitteredDelay(1000, () => 0.5)).toBe(500);
    expect(jitteredDelay(1000, () => 0)).toBe(0);
    expect(jitteredDelay(1, () => 0.5)).toBe(0);
  });
});

describe("isRetryableHttpStatus", () => {
  it("treats 429 and 5xx as retryable", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
  });

  it("does not retry other statuses", () => {
    expect(isRetryableHttpStatus(200)).toBe(false);
    expect(isRetryableHttpStatus(401)).toBe(false);
    expect(isRetryableHttpStatus(404)).toBe(false);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });
});

describe("isAbortError", () => {
  it("detects AbortError-named errors", () => {
    expect(isAbortError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe(true);
    expect(isAbortError(new TypeError("fetch failed"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

describe("fetchWithRetry", () => {
  it("returns a successful response on the first attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(GROQ_URL, { method: "GET" });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 that provides Retry-After", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("limited", { status: 429, headers: { "Retry-After": "0" } }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(GROQ_URL, { method: "GET" });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a 429 without Retry-After using bounded backoff", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("limited", { status: 429 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(
      GROQ_URL,
      { method: "GET" },
      { baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers from a temporary 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(
      GROQ_URL,
      { method: "GET" },
      { baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops after the maximum retry count and returns the last response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("error", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(
      GROQ_URL,
      { method: "GET" },
      { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("recovers from a network error", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(
      GROQ_URL,
      { method: "GET" },
      { baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after repeated network failures", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry(GROQ_URL, { method: "GET" }, { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 2 }),
    ).rejects.toThrow("fetch failed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws an AbortError after timeouts are exhausted", async () => {
    const fetchMock = abortingFetch();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry(GROQ_URL, { method: "GET" }, { timeoutMs: 5, maxRetries: 1, baseDelayMs: 1 }),
    ).rejects.toSatisfy((err: unknown) => isAbortError(err));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-idempotent methods on 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(GROQ_URL, { method: "POST" });

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry 401 invalid-key responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("invalid", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry(GROQ_URL, { method: "GET" });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports retries through onRetry without leaking details", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("limited", { status: 429 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const onRetry = vi.fn();

    await fetchWithRetry(
      GROQ_URL,
      { method: "GET" },
      { baseDelayMs: 1, maxDelayMs: 2, onRetry },
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, "HTTP 429");
  });

  it("sleep is a no-op for non-positive delays", async () => {
    await expect(sleep(0)).resolves.toBeUndefined();
    await expect(sleep(-5)).resolves.toBeUndefined();
  });
});