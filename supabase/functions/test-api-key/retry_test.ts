import { assertEquals, assertRejects } from "@std/assert";
import { fetchWithRetry } from "../_shared/retry.ts";

Deno.test("retry helper never replays a non-idempotent network failure", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => {
    calls += 1;
    return Promise.reject(new TypeError("fetch failed"));
  };

  try {
    await assertRejects(
      () =>
        fetchWithRetry(
          "https://api.example.com/v1/action",
          { method: "POST" },
          { maxRetries: 3, baseDelayMs: 0, maxDelayMs: 0 },
        ),
      TypeError,
      "fetch failed",
    );
    assertEquals(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("retry helper caps caller-supplied retry counts", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => {
    calls += 1;
    return Promise.resolve(new Response("unavailable", { status: 503 }));
  };

  try {
    const response = await fetchWithRetry(
      "https://api.example.com/v1/models",
      { method: "GET" },
      { maxRetries: 99, baseDelayMs: 0, maxDelayMs: 0 },
    );
    assertEquals(response.status, 503);
    assertEquals(calls, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
