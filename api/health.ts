import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

function getCorsHeaders() {
  const vercelUrl = process.env.VERCEL_URL;
  const corsOrigin = vercelUrl
    ? `https://${vercelUrl}`
    : 'https://key-ping.vercel.app';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'content-type',
    'Content-Type': 'application/json',
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(url, key);
}

export default async function handler(req: Request) {
  const headers = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const checks: Record<string, string | boolean> = {};

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('key_tests').select('id').limit(1);
    checks.database = error ? `error: ${error.message}` : true;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  const healthy = checks.database === true;

  return new Response(
    JSON.stringify({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks,
    }),
    {
      status: healthy ? 200 : 503,
      headers,
    },
  );
}
