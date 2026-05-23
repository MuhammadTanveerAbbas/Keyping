import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const vercelUrl = Deno.env.get('VERCEL_URL');
const corsOrigin = vercelUrl
  ? `https://${vercelUrl}`
  : 'https://keyping.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Headers': 'content-type',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const checks: Record<string, string | boolean> = {};

  try {
    const { error } = await supabase.from('key_tests').select('id').limit(1);
    checks.database = error ? `error: ${error.message}` : true;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  const healthy = checks.database === true;

  return new Response(JSON.stringify({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
  }), {
    status: healthy ? 200 : 503,
    headers: corsHeaders,
  });
}
