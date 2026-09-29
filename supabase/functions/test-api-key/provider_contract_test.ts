import { assertEquals } from "@std/assert";
import { calculateHealthScore } from "../_shared/api-contract.ts";
import { PROVIDER_CAPABILITIES } from "../_shared/provider-contract.ts";
import {
  detectProvider,
  getSupabaseProjectRef,
  matchesProviderKey,
  normalizeProviderKey,
} from "../../../src/lib/providers.ts";
import { PROVIDER_REQUESTS } from "./providers.ts";

function encodeSegment(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

Deno.test("detectProvider trims input and prioritizes Anthropic", () => {
  assertEquals(detectProvider("  sk-ant-api03-example_key  "), "anthropic");
  assertEquals(detectProvider(" sk-proj-example "), "openai");
  assertEquals(detectProvider("   "), null);
});

Deno.test("provider matching is pure for stateful regular expressions", () => {
  const provider = {
    id: "openai" as const,
    detectionPriority: 1,
    keyPatterns: [/^sk-/g],
  };
  assertEquals(matchesProviderKey(provider, " sk-example "), true);
  assertEquals(matchesProviderKey(provider, "sk-example"), true);
  assertEquals(normalizeProviderKey(null), "");
});

Deno.test("Supabase detection covers modern keys and valid legacy JWTs", () => {
  const legacy = [
    encodeSegment({ alg: "HS256", typ: "JWT" }),
    encodeSegment({
      iss: "supabase",
      role: "anon",
      ref: "abcdefghijklmnopqrst",
    }),
    "signature",
  ].join(".");

  assertEquals(detectProvider("sb_publishable_example_key"), "supabase");
  assertEquals(detectProvider(legacy), "supabase");
  assertEquals(getSupabaseProjectRef(legacy), "abcdefghijklmnopqrst");
  assertEquals(
    getSupabaseProjectRef(
      "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJvdGhlciJ9.signature",
    ),
    null,
  );
});

Deno.test("canonical capabilities mark active, limited, and planned states", () => {
  const byId = Object.fromEntries(
    PROVIDER_CAPABILITIES.map((provider) => [provider.id, provider]),
  );
  assertEquals(byId.gemini?.availability, "active");
  assertEquals(byId.supabase?.availability, "limited");
  assertEquals(byId.aws?.availability, "limited");
  assertEquals(byId.aws?.validationKind, "unsupported");
});

Deno.test("every active API provider has a backend validator", () => {
  for (const provider of PROVIDER_CAPABILITIES) {
    if (
      provider.availability === "active" && provider.validationKind === "api"
    ) {
      assertEquals(Boolean(PROVIDER_REQUESTS[provider.id]), true, provider.id);
    }
  }
  assertEquals(Boolean(PROVIDER_REQUESTS.gemini), true);
  assertEquals(Boolean(PROVIDER_REQUESTS.aws), false);
  assertEquals(Boolean(PROVIDER_REQUESTS.supabase), false);
});

Deno.test("provider parsers classify auth, permission, and quota results", () => {
  const openai = PROVIDER_REQUESTS.openai;
  if (!openai) throw new Error("OpenAI validator is missing");

  const valid = openai.parseResult(
    new Response(null, {
      status: 200,
      headers: { "x-ratelimit-remaining-requests": "200" },
    }),
  );
  assertEquals(valid.status, "valid");
  assertEquals(valid.rateLimit?.remaining, 200);

  const forbidden = openai.parseResult(new Response(null, { status: 403 }));
  assertEquals(forbidden.status, "limited");
  assertEquals(forbidden.error?.code, "ACCESS_FORBIDDEN");

  const rateLimited = openai.parseResult(
    new Response(null, {
      status: 429,
      headers: { "x-ratelimit-remaining-requests": "0" },
    }),
  );
  assertEquals(rateLimited.status, "limited");
  assertEquals(rateLimited.error?.code, "RATE_LIMITED");
});

Deno.test("health score is bounded and invalid keys score zero", () => {
  assertEquals(calculateHealthScore({ status: "invalid" }, 10), 0);
  assertEquals(
    calculateHealthScore(
      { status: "valid", scopes: ["repo"], rateLimit: { remaining: 200 } },
      100,
    ),
    100,
  );
  assertEquals(calculateHealthScore({ status: "limited" }, 5000), 25);
});
