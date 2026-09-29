import { AlertTriangle, Settings2 } from "lucide-react";

export function SupabaseConfigError() {
  const isProduction = import.meta.env.PROD;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 p-8 text-center" role="alert">
      <div className="rounded-full bg-amber-500/10 p-6"><AlertTriangle className="h-12 w-12 text-amber-400" /></div>
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Configuration required</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">KeyPing needs Supabase credentials before it can load authentication and saved validation data.</p>
      </div>
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left">
        <div className="mb-3 flex items-center gap-2 text-slate-300"><Settings2 className="h-4 w-4" /><span className="font-mono text-xs">{isProduction ? "Vercel setup" : "Local setup"}</span></div>
        {isProduction ? (
          <>
            <p className="mb-3 text-sm leading-relaxed text-slate-400">Add these environment variables in Vercel, then redeploy the app.</p>
            <ul className="space-y-1 font-mono text-xs text-blue-300"><li>VITE_SUPABASE_URL</li><li>VITE_SUPABASE_ANON_KEY</li><li>or VITE_SUPABASE_PUBLISHABLE_KEY</li></ul>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-slate-400">Copy <code className="text-blue-300">.env.example</code> to <code className="text-blue-300">.env.local</code>, add your Supabase URL and client key, then restart the dev server.</p>
        )}
      </div>
    </div>
  );
}
