/**
 * The origin allowlist for the Vercel Edge routes.
 *
 * This is intentionally a self contained copy rather than a re-export of
 * `supabase/functions/_shared/origins.ts`. The Vercel Edge bundler refuses to
 * follow a relative import that escapes the `api/` directory, so a shared
 * module cannot be used from both runtimes. The Edge Function keeps its own
 * copy for the same reason.
 *
 * The two files must stay in sync. The values below were verified rather than
 * assumed:
 *
 *   https://key-ping.vercel.app   200, the live KeyPing deployment
 *   https://keyping.vercel.app    404, not deployed
 *   https://keyping.app           200, an unrelated third party site
 *
 * `keyping.app` and `www.keyping.app` are a different product that happens to
 * share the name, so they are not allowed. Allowing a foreign origin to read
 * API responses is a weakness and that domain is not ours to trust.
 *
 * If you change this list, change `supabase/functions/_shared/origins.ts` to
 * match. A mismatch means the browser blocks one of the two.
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
 * with this because the response differs per request origin.
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
