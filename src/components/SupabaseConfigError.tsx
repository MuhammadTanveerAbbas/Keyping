import { AlertTriangle } from "lucide-react";

export function SupabaseConfigError() {
  const isProduction = import.meta.env.PROD;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-black">
      <div className="rounded-full bg-amber-500/10 p-6">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
      </div>
      <h1 className="font-display text-2xl font-bold text-white">
        Configuration Required
      </h1>
      <p className="font-sans text-sm text-slate-400 text-center max-w-lg">
        Supabase environment variables are missing. The app cannot connect to the
        database until they are set.
      </p>
      {isProduction ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 max-w-lg w-full">
          <p className="font-mono text-xs text-slate-300 mb-3">
            Add these in Vercel → Project Settings → Environment Variables, then
            redeploy:
          </p>
          <ul className="font-mono text-xs text-blue-400 space-y-1">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)</li>
          </ul>
          <p className="font-sans text-xs text-slate-500 mt-4">
            VITE_ variables are embedded at build time — a redeploy is required
            after adding them.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 max-w-lg w-full">
          <p className="font-mono text-xs text-slate-300 mb-3">
            Copy <code className="text-blue-400">.env.example</code> to{" "}
            <code className="text-blue-400">.env.local</code> and fill in your
            Supabase credentials.
          </p>
        </div>
      )}
    </div>
  );
}
