import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { KeyPingLogo } from "@/components/KeyPingLogo";

const GITHUB_URL = "https://github.com/MuhammadTanveerAbbas/Keyping";
const DOCUMENTATION_URL = `${GITHUB_URL}#readme`;
const SUPPORT_URL = `${GITHUB_URL}/issues`;

const footerLink =
  "inline-flex w-fit items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

const footerHeading = "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-50">
      <div className="pointer-events-none absolute left-1/3 top-0 h-24 w-96 rounded-full bg-blue-400/8 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="col-span-full lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="KeyPing home"
            >
              <KeyPingLogo size={26} />
              <span className="font-display text-[14px] font-extrabold tracking-tight text-slate-950">KeyPing</span>
            </Link>
            <p className="mt-3 max-w-[260px] text-[12px] leading-5 text-slate-500">
              Validate API keys with status, latency, health, and provider-aware diagnostics.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Live validation
            </span>
          </div>

          {/* Nav cols */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:col-span-3">
            <nav aria-labelledby="footer-product-heading">
              <h2 id="footer-product-heading" className={footerHeading}>Product</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                <Link to="/dashboard" className={footerLink}>API tester</Link>
                <Link to="/#providers" className={footerLink}>Coverage</Link>
                <Link to="/#analytics" className={footerLink}>Analytics</Link>
                <Link to="/#security" className={footerLink}>Key handling</Link>
              </div>
            </nav>

            <nav aria-labelledby="footer-resources-heading">
              <h2 id="footer-resources-heading" className={footerHeading}>Resources</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                <a href={DOCUMENTATION_URL} target="_blank" rel="noopener noreferrer" className={footerLink} aria-label="Documentation (opens in a new tab)">
                  Docs <ExternalLink className="h-2.5 w-2.5 opacity-50" aria-hidden="true" />
                </a>
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={footerLink} aria-label="Support (opens in a new tab)">
                  Support <ExternalLink className="h-2.5 w-2.5 opacity-50" aria-hidden="true" />
                </a>
              </div>
            </nav>

            <nav aria-labelledby="footer-legal-heading">
              <h2 id="footer-legal-heading" className={footerHeading}>Legal</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                <Link to="/privacy" className={footerLink}>Privacy</Link>
                <Link to="/terms" className={footerLink}>Terms</Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-start gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} KeyPing. All rights reserved.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="KeyPing on GitHub (opens in a new tab)"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63.297 12 .297z" />
            </svg>
            View on GitHub
          </a>
        </div>

      </div>
    </footer>
  );
}
