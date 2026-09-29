/**
 * The single source of truth for which browser origins may call the API.
 *
 * This module is the canonical copy. `api/_shared/origins.ts` re-exports it so
 * the Edge Function and the Vercel routes share one list, and
 * `src/components/SupabaseConfigError.tsx` guidance stays consistent with it.
 *
 * Three places previously each carried their own copy of this list and they had
 * drifted. More seriously, none of them contained the origin the app is
 * actually served from, so the browser blocked the Edge Function response and
 * the core feature could not work in production.
 *
 * Which origins are real was verified rather than assumed:
 *
 *   https://key-ping.vercel.app   200, the live KeyPing deployment
 *   https://keyping.vercel.app    404, not deployed
 *   https://keyping.app           200, an unrelated third party site
 *
 * `keyping.app` and `www.keyping.app` are a different product that happens to
 * share the name, so they were removed. Allowing a foreign origin to read API
 * responses is a weakness and that domain is not ours to trust.
 *
 * The live Vercel deployment origin is also accepted at runtime through
 * `VERCEL_URL`, which covers preview deployments without enumerating them.
 */

export const DEFAULT_ORIGIN = "https://key-ping.vercel.app";

export const ALLOWED_ORIGINS: readonly string[] = [
  DEFAULT_ORIGIN,
  "https://www.key-ping.vercel.app",
  // Local development. Loopback only, so a remote page cannot reach these.
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

/**
 * Resolves the value to send in `Access-Control-Allow-Origin`.
 *
 * An origin that is not allowlisted receives the default origin rather than a
 * wildcard, so an unknown page never receives `*`. `Vary: Origin` must be sent
 * with this because the response body differs per request origin.
 */
export function resolveAllowedOrigin(
  origin: string | null | undefined,
  deploymentOrigin: string | null | undefined,
): string {
  if (!origin) return DEFAULT_ORIGIN;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (deploymentOrigin && origin === deploymentOrigin) return origin;
  return DEFAULT_ORIGIN;
}
