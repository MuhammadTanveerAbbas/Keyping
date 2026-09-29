import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, KeyRound, Scale, ShieldCheck, Users } from "lucide-react";
import { KeyPingLogo } from "@/components/KeyPingLogo";

const sections: { id: string; title: string; content: ReactNode }[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    content: <p>By accessing or using KeyPing, you agree to these Terms of Service. If you do not agree, do not use the service.</p>,
  },
  {
    id: "description",
    title: "2. Description of service",
    content: <p>KeyPing is a developer tool for checking API key status, health, latency, scopes, and related provider responses. Results are provided for informational and operational use. Provider responses can change and may not describe every permission or usage condition.</p>,
  },
  {
    id: "registration",
    title: "3. Account registration",
    content: <p>You may create an account with email or Google sign-in when those options are available. You are responsible for keeping your credentials secure and for activity under your account. Provide accurate information and notify the project if you believe your account was accessed without permission.</p>,
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable use",
    content: (
      <>
        <p>Use KeyPing only with keys and endpoints that you own or are authorized to test. Do not use the service to probe systems without permission, impersonate another person, bypass provider controls, interfere with the service, or automate abusive traffic.</p>
        <p className="mt-3">You remain responsible for the security, permissions, and retention of the keys and endpoints you submit.</p>
      </>
    ),
  },
  {
    id: "key-handling",
    title: "5. API key handling",
    content: (
      <>
        <p>When you run a test, the full key is sent through the KeyPing validation request to the selected provider or to the custom HTTPS endpoint you specify. The application may hold the key in active browser memory while the tester or bulk page is open, but it does not write the full key to its saved test history. If you save a result, the application stores a masked preview made from the last four characters.</p>
        <p className="mt-3">A provider or custom endpoint may retain or process request data according to its own policies. You should not submit a key to an endpoint you do not trust.</p>
      </>
    ),
  },
  {
    id: "teams",
    title: "6. Teams and invite links",
    content: <p>Team owners can create workspaces and invite members. An invite link lets a signed-in person request membership; it does not bypass account authentication. Team owners are responsible for removing members who no longer need access and for reviewing the teams they manage.</p>,
  },
  {
    id: "data",
    title: "7. Your data and exports",
    content: <p>You can export visible saved test history as CSV and delete saved history from Settings. Bulk-test keys and results are session data and are not written to saved history by the bulk page. Account deletion may be blocked when team ownership must be transferred or removed first.</p>,
  },
  {
    id: "provider-results",
    title: "8. Provider results and availability",
    content: <p>We do not warrant that a provider response, health score, latency measurement, scope list, or rate-limit value will be complete, current, or uninterrupted. Keep your own fallback checks and do not rely on a single validation result for access-control decisions.</p>,
  },
  {
    id: "intellectual-property",
    title: "9. Intellectual property",
    content: <p>The KeyPing name, interface, and other project materials are protected by their applicable rights. The source repository is made available under its stated license. You may use and modify the licensed source subject to that license, but you may not imply that an unofficial modification is endorsed by the project.</p>,
  },
  {
    id: "termination",
    title: "10. Suspension and termination",
    content: <p>You may stop using the service or request account deletion from Settings. We may suspend or terminate access when necessary to protect users, comply with law, address abuse, or maintain the service. Sections that by their nature should survive termination will continue to apply.</p>,
  },
  {
    id: "liability",
    title: "11. Disclaimer and liability",
    content: <p>The service is provided on an as-is and as-available basis to the extent permitted by law. To the extent permitted by law, KeyPing is not liable for indirect, incidental, special, consequential, or lost-profit damages arising from use of the service or provider responses.</p>,
  },
  {
    id: "contact",
    title: "12. Contact and governing terms",
    content: <p>These terms are governed by the laws that apply where the service is operated, without conflicting mandatory law. For questions about these terms, email <a href="mailto:legal@keyping.dev" className="font-semibold text-blue-700 underline hover:text-blue-800">legal@keyping.dev</a>.</p>,
  },
];

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service | KeyPing";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#terms-content" className="sr-only fixed left-3 top-3 z-[60] rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only">Skip to terms content</a>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/" className="flex min-h-10 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="KeyPing home">
            <KeyPingLogo size={24} /><span className="font-display text-base font-bold text-slate-900">KeyPing</span>
          </Link>
        </div>
      </header>

      <main id="terms-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 max-w-3xl sm:mb-10">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-blue-600">KeyPing policies</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 font-mono text-xs text-slate-500">Last reviewed: September 24, 2026</p>
          <p className="mt-5 text-base leading-relaxed text-slate-600">Please read these terms before using KeyPing. They describe the service, acceptable use, key handling, and available controls.</p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" /><p className="text-sm leading-relaxed">Full keys are used for validation but are not written to saved history.</p></div>
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" /><p className="text-sm leading-relaxed">Use only keys and endpoints you are authorized to test.</p></div>
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm"><Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" /><p className="text-sm leading-relaxed">Team owners control membership and workspace deletion.</p></div>
        </div>

        <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Terms of service contents">
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
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <p className="text-sm leading-relaxed">These terms are a product summary for this deployment and do not replace advice from a qualified legal professional.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Back to KeyPing</Link>
          <Link to="/privacy" className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Privacy Policy <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Info className="h-3.5 w-3.5" aria-hidden="true" /> Last reviewed date is shown above so you can tell when this page changed.</p>
      </main>
    </div>
  );
}
