import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  LifeBuoy,
  Lock,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { KeyPingLogo } from "@/components/KeyPingLogo";

const GITHUB_URL = "https://github.com/MuhammadTanveerAbbas/Keyping";
const DOCUMENTATION_URL = `${GITHUB_URL}#readme`;
const SUPPORT_URL = `${GITHUB_URL}/issues`;

// A 44px square touch target on phones, shrinking to a 16px icon once a mouse
// is in play. Width alone cannot tell the two apart, because a tablet is wide
// but still driven by touch. Tailwind 3 has no pointer type variant, they only
// arrived in v4, so the rule lives in src/index.css as .footer-touch.
const footerLink =
  "inline-flex min-h-11 w-fit items-center gap-2.5 rounded-lg px-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 footer-touch";

const footerHeading = "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400";

type FooterLinkItem = {
  label: string;
  href: string;
  icon: typeof Zap;
  external?: boolean;
};

const PRODUCT_LINKS: FooterLinkItem[] = [
  { label: "API tester", href: "/dashboard", icon: Zap },
  { label: "Coverage", href: "/#providers", icon: ShieldCheck },
  { label: "Analytics", href: "/#analytics", icon: BarChart3 },
  { label: "Key handling", href: "/#security", icon: Lock },
];

const RESOURCE_LINKS: FooterLinkItem[] = [
  { label: "Docs", href: DOCUMENTATION_URL, icon: BookOpen, external: true },
  { label: "Support", href: SUPPORT_URL, icon: LifeBuoy, external: true },
];

const LEGAL_LINKS: FooterLinkItem[] = [
  { label: "Privacy", href: "/privacy", icon: Lock },
  { label: "Terms", href: "/terms", icon: BookOpen },
];

function FooterNav({
  headingId,
  heading,
  links,
}: {
  headingId: string;
  heading: string;
  links: FooterLinkItem[];
}) {
  return (
    <nav aria-labelledby={headingId}>
      <h2 id={headingId} className={footerHeading}>{heading}</h2>
      <ul className="mt-2 flex flex-col gap-0.5 sm:mt-3">
        {links.map(({ label, href, icon: Icon, external }) => (
          <li key={label}>
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
                aria-label={`${label} (opens in a new tab)`}
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
              </a>
            ) : (
              <Link to={href} className={footerLink}>
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="flex-1">{label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white">
      <div className="pointer-events-none absolute left-1/3 top-0 h-24 w-96 rounded-full bg-blue-400/8 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">

        {/* Main grid. The three link columns stack into a single column on the
            narrowest phones, because three side by side columns of 13px links
            get cramped below about 380px. */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="col-span-full sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="KeyPing home"
            >
              <KeyPingLogo size={30} />
              <span className="font-display text-[15px] font-extrabold tracking-tight text-slate-950">KeyPing</span>
            </Link>
            <p className="mt-2 max-w-[34ch] text-[13px] leading-6 text-slate-600">
              Validate API keys with status, latency, health, and provider-aware diagnostics.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-emerald-700">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live validation
            </span>
          </div>

          {/* Nav cols */}
          <div className="col-span-full grid gap-8 sm:col-span-2 sm:grid-cols-3 sm:gap-6 lg:col-span-3">
            <FooterNav headingId="footer-product-heading" heading="Product" links={PRODUCT_LINKS} />
            <FooterNav headingId="footer-resources-heading" heading="Resources" links={RESOURCE_LINKS} />
            <FooterNav headingId="footer-legal-heading" heading="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        {/* Bottom bar. Stacks with the button full width on phones so neither
            line is squeezed into a clipped single row. */}
        <div className="mt-10 flex flex-col items-start gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[12px] text-slate-500">
            &copy; {new Date().getFullYear()} KeyPing. All rights reserved.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
            aria-label="KeyPing on GitHub (opens in a new tab)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63.297 12 .297z" />
            </svg>
            View on GitHub
          </a>
        </div>

      </div>
    </footer>
  );
}