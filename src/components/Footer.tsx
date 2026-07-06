import { Link } from "react-router-dom";
import { KeyPingLogo } from "@/components/KeyPingLogo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-blue-500/10 bg-slate-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <KeyPingLogo size={28} />
              <span className="font-display text-base font-bold text-slate-900 dark:text-white">KeyPing</span>
            </div>
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400">Ping any API key. Know it works.</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Product</h4>
            <div className="flex flex-col gap-2">
              <Link to="/dashboard" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
              <a href="/#providers" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Providers</a>
              <a href="/#pricing" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Resources</h4>
            <div className="flex flex-col gap-2">
              <Link to="/dashboard/docs" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentation</Link>
              <a href="mailto:contact@keyping.dev" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-sm font-semibold text-slate-800 dark:text-white">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link to="/privacy" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="font-sans text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-blue-500/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-slate-400 dark:text-blue-400/40">
            &copy; {new Date().getFullYear()} KeyPing
          </p>
          <a
            href="https://github.com/MuhammadTanveerAbbas/Keyping"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
