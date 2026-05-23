import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const vercelUrl = Deno.env.get('VERCEL_URL');
const corsOrigin = vercelUrl
  ? `https://${vercelUrl}`
  : 'https://keyping.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export const config = {
  runtime: 'edge',
  cron: { schedule: 'every 5 days' },
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { error } = await supabase.from('key_tests').select('id').limit(1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: corsHeaders,
  });
}
