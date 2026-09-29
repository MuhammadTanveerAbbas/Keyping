import { assertEquals } from "@std/assert";
import { handleTestApiKey } from "./handler.ts";
import { DEFAULT_ORIGIN } from "../_shared/origins.ts";

// Regression test. The origin the app is actually served from was missing from
// the allowlist, so the browser blocked the response and the endpoint was
// unusable in production. The default origin is asserted here so that list
// cannot silently lose the live host again.
Deno.test("OPTIONS allows the live deployment origin", async () => {
  const response = await handleTestApiKey(
    new Request("https://function.example", {
      method: "OPTIONS",
      headers: { origin: DEFAULT_ORIGIN },
    }),
  );
  assertEquals(response.status, 204);
  assertEquals(
    response.headers.get("access-control-allow-origin"),
    DEFAULT_ORIGIN,
  );
  assertEquals(response.headers.get("vary"), "Origin");
});

Deno.test("OPTIONS falls back to the default for an unknown origin", async () => {
  // keyping.app is a different product that shares the name. It must not be
  // echoed back, and it must not receive a wildcard.
  const response = await handleTestApiKey(
    new Request("https://function.example", {
      method: "OPTIONS",
      headers: { origin: "https://keyping.app" },
    }),
  );
  assertEquals(response.status, 204);
  assertEquals(
    response.headers.get("access-control-allow-origin"),
    DEFAULT_ORIGIN,
  );
});

Deno.test("handler returns an explicit method error for a non POST", async () => {
  const response = await handleTestApiKey(
    new Request("https://function.example", { method: "GET" }),
  );
  const body = await response.json();
  assertEquals(response.status, 405);
  assertEquals(body.status, "invalid");
  assertEquals(body.errorDetails.code, "INVALID_REQUEST");
});
