import { assertEquals, assertRejects } from "@std/assert";
import {
  buildCustomAuthHeader,
  type DnsResolver,
  EndpointValidationError,
  isPublicIpAddress,
  isValidSupabaseProjectRef,
  resolvePublicAddresses,
  validateCustomEndpointUrl,
} from "../_shared/ssrf.ts";

function assertEndpointBlocked(value: string): void {
  let error: unknown;
  try {
    validateCustomEndpointUrl(value);
  } catch (caught) {
    error = caught;
  }
  assertEquals(error instanceof EndpointValidationError, true);
}

Deno.test("custom endpoint URL accepts public HTTPS and rejects unsafe forms", () => {
  const endpoint = validateCustomEndpointUrl(
    " https://api.example.com:443/v1/verify ",
  );
  assertEquals(endpoint.hostname, "api.example.com");
  assertEquals(endpoint.url.port, "");

  assertEndpointBlocked("http://api.example.com/verify");
  assertEndpointBlocked("https://user:pass@api.example.com/verify");
  assertEndpointBlocked("https://api.example.com:8443/verify");
  assertEndpointBlocked("https://api.example.com/verify#fragment");
  assertEndpointBlocked("https://localhost/verify");
  assertEndpointBlocked("https://service.internal/verify");
  assertEndpointBlocked("https://metadata.google.internal/verify");
});

Deno.test("custom endpoint URL rejects alternate and private IP representations", () => {
  for (
    const value of [
      "https://127.0.0.1/verify",
      "https://127.1/verify",
      "https://2130706433/verify",
      "https://0x7f000001/verify",
      "https://017700000001/verify",
      "https://10.0.0.1/verify",
      "https://169.254.169.254/latest/meta-data",
      "https://100.100.100.200/verify",
      "https://[::1]/verify",
      "https://[fe80::1]/verify",
      "https://[fd00:ec2::254]/verify",
      "https://[::ffff:127.0.0.1]/verify",
    ]
  ) {
    assertEndpointBlocked(value);
  }
});

Deno.test("IP classifier permits global addresses only", () => {
  assertEquals(isPublicIpAddress("8.8.8.8"), true);
  assertEquals(isPublicIpAddress("2606:4700:4700::1111"), true);
  assertEquals(isPublicIpAddress("192.168.1.1"), false);
  assertEquals(isPublicIpAddress("fc00::1"), false);
  assertEquals(isPublicIpAddress("not-an-ip"), false);
});

Deno.test("DNS validation rejects the whole answer when any address is private", async () => {
  const endpoint = validateCustomEndpointUrl("https://mixed.example/verify");
  const resolver: DnsResolver = (_hostname, recordType) =>
    Promise.resolve(
      recordType === "A" ? ["93.184.216.34"] : ["fd00::1234"],
    );

  await assertRejects(
    () => resolvePublicAddresses(endpoint, resolver),
    EndpointValidationError,
    "public servers",
  );
});

// Regression test. An IPv4 only host rejects the AAAA lookup with NotFound.
// That rejection used to be treated as a resolution failure, so every real
// IPv4 only custom endpoint failed with DNS_RESOLUTION_FAILED.
Deno.test("DNS validation accepts an IPv4 only host with no AAAA record", async () => {
  const endpoint = validateCustomEndpointUrl("https://ipv4only.example/verify");
  const resolver: DnsResolver = (_hostname, recordType) => {
    if (recordType === "A") return Promise.resolve(["93.184.216.34"]);
    return Promise.reject(
      new DOMException("no AAAA record", "NotFound"),
    );
  };

  assertEquals(await resolvePublicAddresses(endpoint, resolver), [
    "93.184.216.34",
  ]);
});

// The mirror case: an IPv6 only host rejects the A lookup.
Deno.test("DNS validation accepts an IPv6 only host with no A record", async () => {
  const endpoint = validateCustomEndpointUrl("https://ipv6only.example/verify");
  const resolver: DnsResolver = (_hostname, recordType) => {
    if (recordType === "AAAA") return Promise.resolve(["2606:4700:4700::1111"]);
    return Promise.reject(new DOMException("no A record", "NotFound"));
  };

  assertEquals(await resolvePublicAddresses(endpoint, resolver), [
    "2606:4700:4700::1111",
  ]);
});

// A missing record for one family must not let a private address through in
// the other family.
Deno.test("DNS validation still blocks a private A answer when AAAA is absent", async () => {
  const endpoint = validateCustomEndpointUrl("https://mixed2.example/verify");
  const resolver: DnsResolver = (_hostname, recordType) => {
    if (recordType === "A") return Promise.resolve(["10.0.0.1"]);
    return Promise.reject(new DOMException("no AAAA record", "NotFound"));
  };

  await assertRejects(
    () => resolvePublicAddresses(endpoint, resolver),
    EndpointValidationError,
    "public servers",
  );
});

// A resolver that fails for a reason other than a missing record is still a
// hard failure. This is what keeps the fix from weakening SSRF protection.
Deno.test("DNS validation still fails on a real resolver error", async () => {
  const endpoint = validateCustomEndpointUrl("https://broken.example/verify");
  const resolver: DnsResolver = () =>
    Promise.reject(new Error("connection refused"));

  await assertRejects(
    () => resolvePublicAddresses(endpoint, resolver),
    EndpointValidationError,
    "DNS resolution failed",
  );
});

Deno.test("custom auth headers require one placeholder and reject unsafe names", () => {
  assertEquals(
    buildCustomAuthHeader("Authorization: Bearer YOUR_KEY", "secret"),
    { name: "Authorization", value: "Bearer secret" },
  );

  for (
    const template of [
      "Host: YOUR_KEY",
      "Content-Type: YOUR_KEY",
      "Transfer-Encoding: YOUR_KEY",
      "X-Forwarded-For: YOUR_KEY",
      "X-Original-URL: YOUR_KEY",
      "__proto__: YOUR_KEY",
      "Authorization: secret",
      "Authorization: YOUR_KEY YOUR_KEY",
      "Authorization: YOUR_KEY\r\nX-Test: value",
    ]
  ) {
    let error: unknown;
    try {
      buildCustomAuthHeader(template, "secret");
    } catch (caught) {
      error = caught;
    }
    assertEquals(error instanceof EndpointValidationError, true);
  }
});

Deno.test("Supabase project refs are constrained to DNS-safe labels", () => {
  assertEquals(isValidSupabaseProjectRef("abcdefghijklmnopqrst"), true);
  assertEquals(isValidSupabaseProjectRef("project.example.com"), false);
  assertEquals(isValidSupabaseProjectRef("project/ref"), false);
});
