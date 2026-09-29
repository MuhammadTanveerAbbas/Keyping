import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";

const illustrationSteps = [
  { label: "Paste key", color: "#3B82F6" },
  { label: "Detect provider", color: "#8B5CF6" },
  { label: "Validate", color: "#10B981" },
  { label: "Health score", color: "#F59E0B" },
];

const activeValidatorCount = PROVIDERS.filter((provider) => provider.availability === "active").length;

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AuthIllustration() {
  const [activeStep, setActiveStep] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setActiveStep((previous) => (previous + 1) % illustrationSteps.length);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20"><Zap className="h-4 w-4 text-blue-400" /></div>
          <span className="text-sm font-medium text-white">Live validation</span>
          <div className="ml-auto flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-emerald-400">Active</span></div>
        </div>

        <div className="rounded-xl border border-slate-700/30 bg-black/40 p-4 font-mono text-xs">
          <div className="mb-3 flex items-center gap-2" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-red-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-green-500/80" /></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span className="text-emerald-400">$</span><span className="text-slate-300">keyping test sk-proj-...</span></div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.35 }} className="text-cyan-400">▶ Provider: OpenAI</motion.div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.1 }} className="text-emerald-400">✓ Status: Valid</motion.div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.2 }} className="text-slate-400">✓ Rate limit: provider response</motion.div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.3 }} className="font-semibold text-emerald-400">✓ Health score: 94/100</motion.div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-1">
            {illustrationSteps.map((step, index) => (
              <div key={step.label} className="flex min-w-0 items-center gap-1.5">
                <motion.span animate={reduceMotion ? undefined : { scale: activeStep === index ? 1.2 : 1, backgroundColor: activeStep === index ? step.color : `${step.color}33` }} className="h-2 w-2 shrink-0 rounded-full" />
                <span className={`truncate text-[10px] font-medium transition-colors ${activeStep === index ? "text-white" : "text-slate-500"}`}>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-700"><motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" animate={{ width: `${((activeStep + 1) / illustrationSteps.length) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.45 }} /></div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-700/30 bg-slate-800/50 p-2 text-center"><p className="text-lg font-bold text-white">{activeValidatorCount}</p><p className="text-[10px] text-slate-400">Active validators</p></div>
          <div className="rounded-lg border border-slate-700/30 bg-slate-800/50 p-2 text-center"><p className="text-lg font-bold text-emerald-400">Fast</p><p className="text-[10px] text-slate-400">Typical check</p></div>
          <div className="rounded-lg border border-slate-700/30 bg-slate-800/50 p-2 text-center"><p className="text-lg font-bold text-blue-400">100</p><p className="text-[10px] text-slate-400">Max score</p></div>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-500">Illustrative response only</p>
      </div>

      <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-4 -top-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 backdrop-blur-sm"><Shield className="h-5 w-5 text-emerald-400" /></motion.div>
      <motion.div animate={reduceMotion ? undefined : { y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 backdrop-blur-sm"><Activity className="h-5 w-5 text-blue-400" /></motion.div>
    </div>
  );
}

export default function AuthPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedDestination = (location.state as { from?: string } | null)?.from;
  const reduceMotion = useReducedMotion();
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [showPass, setShowPass] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate(requestedDestination || "/dashboard", { replace: true });
  }, [user, loading, navigate, requestedDestination]);

  useEffect(() => {
    document.title = `${showReset ? "Reset password" : isSignUp ? "Create account" : "Sign in"} | KeyPing`;
  }, [isSignUp, showReset]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status" aria-label="Loading authentication">
        <div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /><span className="text-sm font-medium text-slate-500">Checking your session...</span></div>
      </div>
    );
  }

  const validate = () => {
    const errors: typeof formErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.email = "Enter a valid email";
    if (!showReset) {
      if (!password) errors.password = "Password is required";
      else if (password.length < 6) errors.password = "Use at least 6 characters";
    }
    setFormErrors(errors);
    if (errors.email) emailRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (showReset) {
        await resetPassword(email.trim());
        setResetSent(true);
      } else if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
        toast.success("Account created. Check your email to verify it.");
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Try again.";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    setGeneralError(null);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google sign-in failed. Try again.";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((previous) => !previous);
    setFormErrors({});
    setGeneralError(null);
    setShowReset(false);
    setResetSent(false);
  };

  const returnToSignIn = () => {
    setShowReset(false);
    setResetSent(false);
    setFormErrors({});
    setGeneralError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-slate-950 p-8 lg:flex xl:w-1/2 xl:p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/[0.07] blur-[120px]" />
        <div className="absolute left-0 top-0 h-[300px] w-[300px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-violet-500/[0.05] blur-[100px]" />

        <div className="relative z-10 flex items-center gap-2.5"><KeyPingLogo size={30} /><span className="font-display text-base font-semibold tracking-tight text-white">KeyPing</span></div>
        <div className="relative z-10 flex flex-1 items-center justify-center py-8"><AuthIllustration /></div>
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-slate-400">Provider validation</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" /><span className="text-xs text-slate-400">Preview-only history</span></div>
          </div>
          <p className="text-xs text-slate-500">Open source - Privacy first - Full keys stay out of saved history</p>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-10 sm:py-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-8 flex items-center gap-2.5 sm:mb-10 lg:hidden"><KeyPingLogo size={28} /><span className="font-display text-base font-semibold tracking-tight text-slate-900">KeyPing</span></div>

          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{showReset ? "Reset your password" : isSignUp ? "Create your account" : "Sign in"}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{showReset ? "We will send a reset link to your email." : isSignUp ? "Start validating API keys with a secure preview-only history." : "Welcome back to your KeyPing workspace."}</p>
          </div>

          {resetSent ? (
            <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center sm:py-10" role="status" aria-live="polite">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50"><CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" /></div>
              <h2 className="font-display text-lg font-semibold text-slate-900">Check your inbox</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">If an account exists for <span className="font-medium text-slate-700">{email.trim()}</span>, a password reset link is on its way.</p>
              <button type="button" onClick={returnToSignIn} className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Back to sign in</button>
            </motion.div>
          ) : (
            <>
              {!showReset && (
                <>
                  <button type="button" onClick={() => void handleGoogle()} disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 font-sans text-sm font-medium text-slate-700 transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden="true" /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                  <div className="my-5 flex items-center gap-4 sm:my-6"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span><div className="h-px flex-1 bg-slate-200" /></div>
                </>
              )}

              {generalError && <div id={formErrorId} role="alert" aria-live="assertive" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">{generalError}</div>}

              <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={submitting} aria-describedby={generalError ? formErrorId : undefined}>
                <div>
                  <label htmlFor={emailId} className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                  <input ref={emailRef} id={emailId} name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); setGeneralError(null); setFormErrors((previous) => ({ ...previous, email: undefined })); }} placeholder="you@company.com" aria-invalid={Boolean(formErrors.email)} aria-describedby={formErrors.email ? emailErrorId : undefined} className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-sans text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 ${formErrors.email ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.email && <p id={emailErrorId} className="mt-1 text-xs font-medium text-red-600">{formErrors.email}</p>}
                </div>

                {!showReset && (
                  <div>
                    <label htmlFor={passwordId} className="mb-1.5 block text-xs font-semibold text-slate-600">Password</label>
                    <div className="relative">
                      <input ref={passwordRef} id={passwordId} name="password" type={showPass ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} required value={password} onChange={(event) => { setPassword(event.target.value); setGeneralError(null); setFormErrors((previous) => ({ ...previous, password: undefined })); }} placeholder="At least 6 characters" aria-invalid={Boolean(formErrors.password)} aria-describedby={formErrors.password ? passwordErrorId : undefined} className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm font-sans text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 ${formErrors.password ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                      <button type="button" onClick={() => setShowPass((previous) => !previous)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={showPass ? "Hide password" : "Show password"} aria-pressed={showPass}>
                        {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                    {formErrors.password && <p id={passwordErrorId} className="mt-1 text-xs font-medium text-red-600">{formErrors.password}</p>}
                  </div>
                )}

                {!showReset && !isSignUp && <div className="text-right"><button type="button" onClick={() => { setShowReset(true); setGeneralError(null); setFormErrors({}); }} className="rounded text-xs font-semibold text-slate-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Forgot password?</button></div>}

                <button type="submit" disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-sans text-sm font-semibold text-white transition-all duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" /> : showReset ? <><Mail className="h-4 w-4" aria-hidden="true" /> Send reset link</> : isSignUp ? <>Create account <ArrowRight className="h-4 w-4" aria-hidden="true" /></> : <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                </button>
              </form>

              {!showReset && <p className="mt-5 text-center text-sm text-slate-500 sm:mt-6">{isSignUp ? "Already have an account?" : "Do not have an account?"} <button type="button" onClick={switchMode} className="rounded font-semibold text-slate-900 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{isSignUp ? "Sign in" : "Create an account"}</button></p>}
              {showReset && <button type="button" onClick={returnToSignIn} className="mt-5 w-full rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Back to sign in</button>}
            </>
          )}

          <div className="mt-8 border-t border-slate-200 pt-5 sm:mt-10 sm:pt-6">
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400"><Lock className="h-3 w-3 shrink-0" aria-hidden="true" /> Secured by Supabase Auth - Row Level Security enabled</p>
            <p className="mt-3 text-center text-[11px] text-slate-400">By continuing, you agree to the <Link to="/terms" className="font-medium text-slate-600 underline hover:text-blue-600">Terms</Link> and <Link to="/privacy" className="font-medium text-slate-600 underline hover:text-blue-600">Privacy Policy</Link>.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
