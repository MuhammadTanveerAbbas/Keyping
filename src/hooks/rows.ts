/**
 * Shared normalization for `key_tests` rows.
 *
 * History and Analytics each had their own copy of these three functions. The
 * copies had already drifted: Analytics guarded the numeric fields with
 * `Number.isFinite` and History did not, so a non-finite `latency_ms` survived
 * the History path and was then fed to the health score ring, the day
 * difference calculation, rounding, and the CSV exporter. One copy removes the
 * possibility of that divergence returning.
 *
 * The database constrains `key_preview` to between 1 and 4 characters and
 * `health_score` to 0 through 100, but rows are still normalized defensively
 * because this data is rendered and exported.
 */

export type RateLimitInfo = {
  remaining?: number;
  resetAt?: string;
};

export type KeyTest = {
  id: string;
  provider: string;
  key_preview: string;
  nickname: string | null;
  notes: string | null;
  status: string;
  scopes: string[] | null;
  rate_limit_info: RateLimitInfo | null;
  tested_at: string;
  health_score: number | null;
  latency_ms: number | null;
};

/** The columns every key_tests read needs. */
export const KEY_TEST_FIELDS =
  "id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeScopes(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((scope): scope is string => typeof scope === "string");
}

export function normalizeRateLimit(value: unknown): RateLimitInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const remaining = finiteNumber(record.remaining) ?? undefined;
  const resetAt = typeof record.resetAt === "string" ? record.resetAt : undefined;
  if (remaining === undefined && resetAt === undefined) return null;
  return {
    ...(remaining === undefined ? {} : { remaining }),
    ...(resetAt === undefined ? {} : { resetAt }),
  };
}

/**
 * Converts an untrusted query result into rows the interface can render.
 *
 * A row without a usable id is dropped rather than repaired, because every
 * later operation, delete, expand, and key, is addressed by id.
 */
export function normalizeKeyTests(rows: unknown): KeyTest[] {
  if (!Array.isArray(rows)) return [];
  const normalized: KeyTest[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.length === 0) continue;
    normalized.push({
      id: item.id,
      provider: typeof item.provider === "string" ? item.provider : "unknown",
      key_preview: typeof item.key_preview === "string" && item.key_preview.length > 0
        ? item.key_preview.slice(-4)
        : "****",
      nickname: typeof item.nickname === "string" ? item.nickname : null,
      notes: typeof item.notes === "string" ? item.notes : null,
      status: typeof item.status === "string" ? item.status : "invalid",
      scopes: normalizeScopes(item.scopes),
      rate_limit_info: normalizeRateLimit(item.rate_limit_info),
      tested_at: typeof item.tested_at === "string" ? item.tested_at : new Date().toISOString(),
      health_score: finiteNumber(item.health_score),
      latency_ms: finiteNumber(item.latency_ms),
    });
  }
  return normalized;
}

/**
 * Guards against an older response landing after a newer one.
 *
 * Each of the data hooks refetches whenever a dependency changes, so a slow
 * first request could resolve after a fast second one and overwrite fresh state
 * with stale data. Returning the guard function lets a caller mark a request
 * obsolete, and the request id means only the most recent request is allowed to
 * write state.
 */
export function createRequestGuard() {
  let latest = 0;
  return {
    /** Marks a new request as current and returns a checker for it. */
    begin(): () => boolean {
      latest += 1;
      const mine = latest;
      return () => mine === latest;
    },
  };
}
