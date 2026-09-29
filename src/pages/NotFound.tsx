import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Compass, LayoutDashboard, SearchX, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function NotFound() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.title = "404 - Page Not Found | KeyPing";
    mainRef.current?.focus();
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <motion.main
        ref={mainRef}
        tabIndex={-1}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex w-full max-w-xl flex-col items-center text-center outline-none"
      >
        <div className="relative mb-5 flex h-32 w-32 items-center justify-center" aria-hidden="true">
          <div className="absolute inset-0 rounded-[2rem] border border-blue-200 bg-blue-50/70" />
          <div className="absolute inset-3 rounded-[1.5rem] border border-blue-100 bg-white/80" />
          <SearchX className="relative h-10 w-10 text-blue-600" />
          <span className="absolute -right-2 top-2 rounded-full bg-slate-900 px-2 py-1 font-mono text-[10px] font-bold text-white">404</span>
        </div>
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-blue-600">Route not found</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">This page took a wrong turn</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">The address may be outdated, or the page may have moved. Your saved dashboard data is not affected.</p>
        {location.pathname !== "/" && <code className="mt-4 max-w-full truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-500">{location.pathname}</code>}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button asChild disabled={loading} className="h-11 bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">
            <Link to={user ? "/dashboard" : "/"}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{user ? "Back to dashboard" : "Back to home"}</Link>
          </Button>
          {user && <Button asChild disabled={loading} variant="outline" className="h-11 border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50"><Link to="/dashboard/history"><LayoutDashboard className="h-4 w-4" aria-hidden="true" />Open saved history</Link></Button>}
        </div>

        <div className="mt-10 grid w-full max-w-md gap-2 text-left sm:grid-cols-2">
          <Link to={user ? "/dashboard" : "/auth"} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Compass className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" /><span className="text-xs font-semibold text-slate-700">{user ? "Open tester" : "Sign in to KeyPing"}</span>
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /><span className="text-xs font-semibold text-slate-700">Your data is safe</span>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
