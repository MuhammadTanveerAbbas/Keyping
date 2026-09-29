import { createClient } from '@supabase/supabase-js';
import { withTimeout } from './_shared/with-timeout';
import { resolveAllowedOrigin } from './_shared/origins';

export const config = { runtime: 'edge' };

const CHECK_TIMEOUT_MS = 5_000;

function getCorsHeaders(origin: string | null) {
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(origin, vercelOrigin),
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
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
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(JSON.stringify({ status: 'error', error: 'Method not allowed' }), { status: 405, headers });
  }

  let databaseHealthy = false;
  try {
    const result = await withTimeout(
      getSupabase().from('key_tests').select('id', { head: true }).limit(1),
      CHECK_TIMEOUT_MS,
    );
    databaseHealthy = !result.error;
  } catch (error) {
    console.error('health check failed', error instanceof Error ? error.message : 'unknown error');
  }

  const body = JSON.stringify({
    status: databaseHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    // Read from the environment with a fallback, rather than a literal that
    // silently drifts away from package.json.
    version: process.env.npm_package_version ?? '1.0.0',
    checks: { database: databaseHealthy ? 'ok' : 'unavailable' },
  });

  return new Response(req.method === 'HEAD' ? null : body, {
    status: databaseHealthy ? 200 : 503,
    headers,
  });
}
