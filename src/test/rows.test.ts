import { describe, expect, it } from "vitest";
import {
  KEY_TEST_FIELDS,
  createRequestGuard,
  normalizeKeyTests,
  normalizeRateLimit,
  normalizeScopes,
} from "@/hooks/rows";

describe("normalizeScopes", () => {
  it("keeps only string entries", () => {
    expect(normalizeScopes(["read", "write", 7, null])).toEqual(["read", "write"]);
  });

  it("returns null for a non-array", () => {
    expect(normalizeScopes("read")).toBeNull();
    expect(normalizeScopes(null)).toBeNull();
  });
});

describe("normalizeRateLimit", () => {
  it("keeps a finite remaining count and a reset time", () => {
    expect(normalizeRateLimit({ remaining: 120, resetAt: "2026-01-01T00:00:00Z" })).toEqual({
      remaining: 120,
      resetAt: "2026-01-01T00:00:00Z",
    });
  });

  // Regression test. The History hook's copy of this function omitted the
  // finite check, so a non-finite value survived into the health score ring,
  // the day arithmetic, and the CSV exporter.
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects a non-finite remaining value (%s)",
    (value) => {
      expect(normalizeRateLimit({ remaining: value })).toBeNull();
    },
  );

  it("returns null when nothing usable is present", () => {
    expect(normalizeRateLimit({})).toBeNull();
    expect(normalizeRateLimit([1, 2])).toBeNull();
    expect(normalizeRateLimit(null)).toBeNull();
  });
});

describe("normalizeKeyTests", () => {
  const validRow = {
    id: "row-1",
    provider: "openai",
    key_preview: "ab12",
    nickname: "prod",
    notes: "rotated quarterly",
    status: "valid",
    scopes: ["read"],
    rate_limit_info: { remaining: 100 },
    tested_at: "2026-01-01T00:00:00.000Z",
    health_score: 90,
    latency_ms: 120,
  };

  it("keeps a well formed row intact", () => {
    expect(normalizeKeyTests([validRow])).toEqual([validRow]);
  });

  it("drops rows without a usable id, because every later action is keyed by id", () => {
    expect(normalizeKeyTests([{ ...validRow, id: undefined }])).toEqual([]);
    expect(normalizeKeyTests([{ ...validRow, id: "" }])).toEqual([]);
    expect(normalizeKeyTests([null, "nope", 7])).toEqual([]);
  });

  it("replaces missing fields with safe defaults rather than undefined", () => {
    const row = normalizeKeyTests([{ id: "row-2" }])[0]!;
    expect(row).toEqual({
      id: "row-2",
      provider: "unknown",
      key_preview: "****",
      nickname: null,
      notes: null,
      status: "invalid",
      scopes: null,
      rate_limit_info: null,
      tested_at: expect.any(String),
      health_score: null,
      latency_ms: null,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects a non-finite health_score (%s)",
    (value) => {
      const rows = normalizeKeyTests([
        { ...validRow, health_score: value, latency_ms: value },
      ]);
      expect(rows[0]?.health_score).toBeNull();
      expect(rows[0]?.latency_ms).toBeNull();
    },
  );

  it("returns an empty array for a non-array input", () => {
    expect(normalizeKeyTests(undefined)).toEqual([]);
    expect(normalizeKeyTests({ rows: [] })).toEqual([]);
  });

  it("exports one shared field list so the hooks cannot select different columns", () => {
    expect(KEY_TEST_FIELDS).toBe(
      "id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms",
    );
  });
});

describe("createRequestGuard", () => {
  it("treats the first request as current", () => {
    const guard = createRequestGuard();
    expect(guard.begin()()).toBe(true);
  });

  // Regression test. The data hooks refetch on every dependency change, so a
  // slow earlier response could resolve after a fast later one and overwrite
  // fresh state with stale data.
  it("invalidates an earlier request once a newer one begins", () => {
    const guard = createRequestGuard();
    const first = guard.begin();
    const second = guard.begin();

    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });

  it("invalidates every earlier request after many have been issued", () => {
    const guard = createRequestGuard();
    const issued = Array.from({ length: 5 }, () => guard.begin());
    const latest = issued[issued.length - 1]!;
    expect(latest()).toBe(true);
    for (const isCurrent of issued.slice(0, -1)) {
      expect(isCurrent()).toBe(false);
    }
  });
});
