import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

const authOptions = {
  storageKey: 'keyping-auth',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
} as const;

function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: authOptions,
  });
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createSupabaseClient()
  : (new Proxy({} as SupabaseClient<Database>, {
      get() {
        throw new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY).',
        );
      },
      apply() {
        throw new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY).',
        );
      },
    }) as SupabaseClient<Database>);
