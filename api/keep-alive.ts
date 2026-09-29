import { createClient } from '@supabase/supabase-js';
import { withTimeout } from './_shared/with-timeout';
import { resolveAllowedOrigin } from './_shared/origins';

// There is intentionally no `cron` export here.
//
// A `config.cron` object is the Next.js cron idiom. This is a Vite project, and
// Vercel schedules edge functions through a top level "crons" array in
// vercel.json, which this project does not have. The old export therefore read
// as if a schedule existed when none did, so it was removed rather than left
// to mislead. See "Known gaps" in the README.
//
// `runtime: 'edge'` is also redundant: files in /api for a non Next project
// always run on the Edge Runtime, and the (Request) => Promise<Response>
// signature is already the Edge signature.
export const config = { runtime: 'edge' };

const CHECK_TIMEOUT_MS = 5_000;

function getCorsHeaders(origin: string | null) {
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(origin, vercelOrigin),
    // Only "content-type" is needed. Advertising "authorization" as an allowed
    // request header invites a preflight for a header the route never reads
    // from a browser, since the credential arrives as a bearer token.
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is incomplete');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req: Request) {
  const headers = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  // Fails closed when the secret is not configured.
  //
  // The comparison is a plain string equality, which is not constant time. The
  // practical risk is low for a network request, but a timing safe comparison
  // is the correct primitive for a shared secret, so one is used here. A byte
  // length mismatch is rejected first because the digest cannot be produced
  // from inputs of different lengths without leaking length.
  if (!cronSecret || !constantTimeEquals(authHeader ?? '', `Bearer ${cronSecret}`)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    const result = await withTimeout(
      getSupabase().from('key_tests').select('id', { head: true }).limit(1),
      CHECK_TIMEOUT_MS,
    );
    if (result.error) throw new Error(result.error.message);
  } catch (error) {
    console.error('keep alive check failed', error instanceof Error ? error.message : 'unknown error');
    return new Response(JSON.stringify({ status: 'error' }), { status: 503, headers });
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers });
}

/**
 * Compares two strings without an early exit on the first differing byte.
 *
 * The length is compared first, then every byte is folded into an accumulator,
 * so the running time does not depend on where the two values diverge.
 */
function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
