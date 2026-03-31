import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

function KeyPingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#kp-terms-g)" />
      <circle cx="12" cy="14" r="5" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <rect x="16.5" y="13" width="9" height="2.2" rx="1.1" fill="white" />
      <rect x="22" y="15.2" width="2" height="2.5" rx="0.8" fill="white" />
      <rect x="18.5" y="15.2" width="2" height="1.8" rx="0.8" fill="white" />
      <defs>
        <linearGradient id="kp-terms-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms", content: "By accessing or using KeyPing, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service." },
  { id: "description", title: "2. Description of Service", content: "KeyPing is an API key validation SaaS tool. We do not warrant the accuracy of provider API responses. Results are provided as-is for informational purposes." },
  { id: "registration", title: "3. Account Registration", content: "Google OAuth is required to create an account. You are responsible for maintaining the security of your account credentials and all activity under your account." },
  { id: "acceptable-use", title: "4. Acceptable Use", content: "You may validate your own API keys for legitimate development purposes. You may not validate keys you do not own, use automated scraping, or abuse the service in any way." },
  { id: "key-handling", title: "5. API Key Handling", content: "We never store your API keys. Keys are validated in-transit via encrypted Edge Functions and immediately discarded after validation." },
  { id: "ip", title: "6. Intellectual Property", content: "The KeyPing brand, user interface, and underlying code are proprietary. You may not copy, modify, or distribute any part of the service without written permission." },
  { id: "disclaimer", title: "7. Disclaimer of Warranties", content: "The service is provided 'as is' without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free service." },
  { id: "liability", title: "8. Limitation of Liability", content: "KeyPing shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service." },
  { id: "termination", title: "9. Termination", content: "We may suspend or terminate accounts for violations of these terms. You may delete your account at any time from the Settings page." },
  { id: "governing-law", title: "10. Governing Law", content: "These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration." },
  { id: "contact", title: "11. Contact", content: "For legal inquiries, email legal@keyping.dev." },
];

export default function Terms() {
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
          <h1 className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="font-mono text-sm text-blue-500 dark:text-blue-400/60 mt-2">Effective: March 31, 2025</p>
          <p className="font-sans text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            By using KeyPing, you agree to these terms. Please read them carefully.
          </p>
        </div>

        {/* Key handling callout */}
        <div className="flex gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/5 dark:border-blue-500/30 dark:text-blue-300 dark:shadow-[inset_0_0_20px_rgba(59,130,246,0.03)] mb-8">
          <span>🔒</span>
          <p className="font-sans text-sm">We never store your API keys. Keys are validated in-transit via encrypted Edge Functions and immediately discarded.</p>
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

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-blue-500/10 flex items-center justify-between">
          <Link to="/" className="font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to KeyPing</Link>
          <Link to="/privacy" className="font-sans text-sm text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy </Link>
        </div>
      </main>
    </div>
  );
}
