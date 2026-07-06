import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  cron: { schedule: 'every 5 days' },
};

function getCorsHeaders() {
  const vercelUrl = process.env.VERCEL_URL;
  const corsOrigin = vercelUrl
    ? `https://${vercelUrl}`
    : 'https://key-ping.vercel.app';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
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

  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  const { error } = await getSupabase().from('key_tests').select('id').limit(1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers,
  });
}
