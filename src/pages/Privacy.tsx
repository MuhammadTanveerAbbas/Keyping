import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

function KeyPingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#kp-priv-g)" />
      <circle cx="12" cy="14" r="5" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <rect x="16.5" y="13" width="9" height="2.2" rx="1.1" fill="white" />
      <rect x="22" y="15.2" width="2" height="2.5" rx="0.8" fill="white" />
      <rect x="18.5" y="15.2" width="2" height="1.8" rx="0.8" fill="white" />
      <defs>
        <linearGradient id="kp-priv-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const sections = [
  { id: "collect", title: "1. Information We Collect", content: "We collect API keys temporarily during validation (never stored permanently  validated in-flight and discarded), usage data (validation counts, timestamps), and account data (email, name via Google OAuth)." },
  { id: "use", title: "2. How We Use Your Information", content: "We use your information to provide and improve the service, send expiry alerts and notifications, and analyze aggregate usage patterns to improve performance." },
  { id: "security", title: "3. Data Security", content: "All data is encrypted in transit via TLS. Keys are validated server-side via Edge Functions and never persisted. Supabase Row Level Security (RLS) protects all user data." },
  { id: "third-party", title: "4. Third-Party Services", content: "We use Supabase for database and authentication, Google OAuth for sign-in, and Vercel for hosting. Each service has its own privacy policy." },
  { id: "cookies", title: "5. Cookies & Tracking", content: "We use session cookies for authentication only. We do not use advertising trackers or third-party analytics cookies." },
  { id: "retention", title: "6. Data Retention", content: "Test history is retained per your settings (default 90 days). Account deletion removes all associated data within 30 days." },
  { id: "rights", title: "7. Your Rights", content: "You may access, correct, or delete your data at any time. You can export your test history as CSV from Settings. Contact us at privacy@keyping.dev." },
  { id: "changes", title: "8. Changes to This Policy", content: "We will notify you via email for any material changes to this policy." },
  { id: "contact", title: "9. Contact", content: "For privacy-related questions, email privacy@keyping.dev or visit our support page." },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000000]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/85 border-b border-slate-200 dark:border-blue-500/20 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <KeyPingLogo size={24} />
          <span className="font-display text-base font-bold text-slate-900 dark:text-white">KeyPing</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="max-w-3xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="font-mono text-sm text-blue-500 dark:text-blue-400/60 mt-2">Last updated: March 31, 2025</p>
          <p className="font-sans text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            KeyPing is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>

        {/* Security callout */}
        <div className="flex gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/5 dark:border-blue-500/30 dark:text-blue-300 dark:shadow-[inset_0_0_20px_rgba(59,130,246,0.03)] mb-8">
          <span>🔒</span>
          <p className="font-sans text-sm">We take your API key security seriously. Keys are never stored  only validated in transit via encrypted Edge Functions and immediately discarded.</p>
        </div>

        {/* Table of contents */}
        <div className="bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-blue-500/20 rounded-xl p-5 mb-10">
          <p className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">Table of Contents</p>
          <ol className="space-y-1">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a href={`#${id}`} className="font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline">{title}</a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(({ id, title, content }) => (
            <section key={id} id={id}>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
              <p className="font-sans text-slate-600 dark:text-slate-400 leading-relaxed">{content}</p>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="flex gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/5 dark:border-blue-500/30 dark:text-blue-300 mt-12">
          <span>🔒</span>
          <p className="font-sans text-sm">We take your API key security seriously. Keys are never stored  only validated in transit.</p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-blue-500/10 flex items-center justify-between">
          <Link to="/" className="font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to KeyPing</Link>
          <Link to="/terms" className="font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline">Terms of Service </Link>
        </div>
      </main>
    </div>
  );
}
