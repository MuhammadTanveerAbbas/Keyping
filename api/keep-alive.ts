import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const config = {
  runtime: 'edge',
  cron: {
    schedule: 'every 5 days'
  }
};

export default async function handler(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { error } = await supabase.from('users').select('id').limit(1);
  
  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  return new Response('OK', { status: 200 });
}