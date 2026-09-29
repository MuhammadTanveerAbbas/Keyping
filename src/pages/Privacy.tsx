import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import { KeyPingLogo } from "@/components/KeyPingLogo";

const sections: { id: string; title: string; content: ReactNode }[] = [
  {
    id: "collect",
    title: "1. Information we collect",
    content: (
      <>
        <p>KeyPing processes account information such as your email address, authentication metadata, display name, team membership, and the results you choose to save.</p>
        <p className="mt-3">When you test a key, the full key is sent to the validation service for that request. If you save a result, KeyPing stores a masked preview made from the last four characters, along with the provider, status, timestamp, latency, health score, notes, scopes, and rate-limit information returned by the provider.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "2. How we use information",
    content: (
      <p>We use information to authenticate accounts, validate keys, display saved history and analytics, create team memberships, prevent abuse, and diagnose service errors. We do not use saved test history to advertise third-party products.</p>
    ),
  },
  {
    id: "providers",
    title: "3. Providers and custom endpoints",
    content: (
      <>
        <p>A validation request is sent to the API provider you select. If you choose the custom provider option, the request is sent to the HTTPS endpoint and with the authorization header that you provide. The selected provider or endpoint receives the information needed to authenticate that request.</p>
        <p className="mt-3">Those services have their own privacy and retention practices. Review the provider's documentation before sending a key to a custom endpoint.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "4. Security and storage",
    content: (
      <>
        <p>Authentication and application data are handled through Supabase. Database access is protected by Row Level Security, and network requests use encrypted connections where supported by the deployment.</p>
        <p className="mt-3">The KeyPing application does not write the full API key to its saved test history. The key may remain in active browser memory while the tester or bulk page is open, then is cleared by the page lifecycle or the tester's inactivity timer. The validation service handles it for the request, and a provider or custom endpoint may process it according to its own systems.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "5. Retention and deletion",
    content: (
      <>
        <p>Saved test history remains available until you delete it from Settings or delete your account. Automatic test-history deletion is not currently configured. Bulk-test keys remain in the browser page until you clear the session, close the page, or the browser releases the memory.</p>
        <p className="mt-3">Account deletion requests removal of the account and associated KeyPing data. Team ownership rules may require you to transfer or delete an owned team before an account can be removed.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "6. Cookies and account preferences",
    content: (
      <p>Supabase manages authentication session storage needed to keep you signed in. Notification preferences are stored in your KeyPing account so they can follow you across devices. These preferences are not sent as notification deliveries. KeyPing does not use advertising trackers.</p>
    ),
  },
  {
    id: "third-party",
    title: "7. Service providers",
    content: (
      <p>The deployment may use Supabase for authentication, database, and edge functions, a hosting provider for web delivery, and Google when you choose Google sign-in. Selected API providers receive validation requests as described above. Each service provider has its own terms and privacy policy.</p>
    ),
  },
  {
    id: "rights",
    title: "8. Your choices and rights",
    content: (
      <>
        <p>You can update your display name, export visible test history as CSV, delete saved test history, update notification preferences, or request account deletion from Settings.</p>
        <p className="mt-3">If you have questions about access, correction, or deletion, contact the project using the address listed in Section 9.</p>
      </>
    ),
  },
  {
    id: "changes",
    title: "9. Policy changes and contact",
    content: (
      <>
        <p>Material changes to this policy should be reflected on this page with an updated review date. Continuing to use the service after an update means the revised policy applies from that point onward.</p>
        <p className="mt-3">For privacy questions, email <a href="mailto:privacy@keyping.dev" className="font-semibold text-blue-700 underline hover:text-blue-800">privacy@keyping.dev</a>.</p>
      </>
    ),
  },
];

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | KeyPing";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#policy-content" className="sr-only fixed left-3 top-3 z-[60] rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only">Skip to policy content</a>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/" className="flex min-h-10 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="KeyPing home">
            <KeyPingLogo size={24} /><span className="font-display text-base font-bold text-slate-900">KeyPing</span>
          </Link>
        </div>
      </header>

      <main id="policy-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 max-w-3xl sm:mb-10">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-blue-600">KeyPing policies</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 font-mono text-xs text-slate-500">Last reviewed: September 24, 2026</p>
          <p className="mt-5 text-base leading-relaxed text-slate-600">This policy explains how the KeyPing deployment handles account information, validation requests, saved test records, and local browser preferences.</p>
        </div>

        <div className="mb-8 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 sm:p-5" role="note">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <div className="text-sm leading-relaxed"><p className="font-bold">Preview-only history</p><p className="mt-1">KeyPing does not write a full API key to its saved test records. A saved record contains a masked preview. The key is still sent to the provider or custom endpoint needed to perform the validation request.</p></div>
        </div>

        <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Privacy policy contents">
          <h2 className="mb-3 font-display text-sm font-bold text-slate-900">On this page</h2>
          <ol className="grid gap-1 sm:grid-cols-2 sm:gap-x-8">
            {sections.map(({ id, title }) => <li key={id}><a href={`#${id}`} className="block rounded py-1 text-sm text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{title}</a></li>)}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map(({ id, title, content }) => (
            <section id={id} key={id} className="scroll-mt-24">
              <h2 className="mb-3 font-display text-xl font-bold text-slate-900">{title}</h2>
              <div className="space-y-3 text-sm leading-7 text-slate-600">{content}</div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm sm:p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <p className="text-sm leading-relaxed">This summary is for clarity and does not replace the terms of a provider or hosting service. Review linked policies when sending sensitive information.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Back to KeyPing</Link>
          <Link to="/terms" className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Terms of Service <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
      </main>
    </div>
  );
}
