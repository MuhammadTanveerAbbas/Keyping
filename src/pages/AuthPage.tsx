import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

function KeyPingLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#kp-auth-g)" />
      <circle cx="12" cy="14" r="5" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <rect x="16.5" y="13" width="9" height="2.2" rx="1.1" fill="white" />
      <rect x="22" y="15.2" width="2" height="2.5" rx="0.8" fill="white" />
      <rect x="18.5" y="15.2" width="2" height="1.8" rx="0.8" fill="white" />
      <circle cx="26" cy="8" r="3" fill="#22D3EE" opacity="0.9" />
      <circle cx="26" cy="8" r="1.5" fill="white" />
      <defs>
        <linearGradient id="kp-auth-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AuthTerminal() {
  const lines = [
    { text: "> keyping test sk-proj-abc123...", color: "text-white" },
    { text: "✓ Provider detected: OpenAI", color: "text-blue-400" },
    { text: "✓ Key valid", color: "text-green-400" },
    { text: "✓ Rate limit: 90,000 TPM remaining", color: "text-white" },
    { text: " Health Score: 94/100 🟢", color: "text-blue-300" },
  ];
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines < lines.length) {
      const t = setTimeout(() => setVisibleLines(v => v + 1), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleLines(0), 3000);
    return () => clearTimeout(t);
  }, [visibleLines, lines.length]);

  return (
    <div className="bg-[#050505] border border-blue-500/20 rounded-xl p-5 font-mono text-sm w-full max-w-sm">
      {lines.slice(0, visibleLines).map((line, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={`${line.color} ${i > 0 ? "mt-1" : ""}`}>
          {line.text}
        </motion.div>
      ))}
      <span className="inline-block w-2 h-4 bg-blue-400 terminal-cursor ml-0.5 translate-y-0.5 mt-1" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#000000]">
      <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const handleGoogle = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); } finally { setSigningIn(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel  always dark, hidden on mobile */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#000000] flex-col relative overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-grid-dark opacity-60 pointer-events-none" />
        {/* Blue beam */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(59,130,246,0.06),transparent)] pointer-events-none" />
        {/* Scanlines */}
        <div className="absolute inset-0 scanline-overlay pointer-events-none" />
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="particle absolute w-1 h-1 rounded-full bg-blue-500/40"
              style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 25}%`, '--duration': `${5 + i}s`, '--delay': `${i * 0.7}s` } as React.CSSProperties} />
          ))}
        </div>

        {/* Logo top-left */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2.5">
            <KeyPingLogo size={28} />
            <span className="font-display text-base font-bold text-blue-400">KeyPing</span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-12">
          <AuthTerminal />
          <p className="font-mono text-sm text-blue-400/60 mt-8 text-center">Validate faster. Ship with confidence.</p>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 p-8">
          <p className="font-mono text-xs text-blue-400/30">🔒 Your keys never leave our edge functions</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#000000] border-l border-blue-500/20 px-4 sm:px-6 py-12 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <KeyPingLogo size={28} />
            <span className="font-display text-base font-bold text-slate-900 dark:text-white">KeyPing</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isSignUp ? "Start validating API keys in 30 seconds" : "Sign in to your KeyPing account"}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-sans font-medium text-sm transition-all
              bg-white border-slate-300 text-slate-700 hover:bg-slate-50
              dark:bg-[#000000] dark:border-blue-500/30 dark:text-white dark:hover:bg-blue-500/5 dark:hover:border-blue-500/60 dark:hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]
              disabled:opacity-60"
          >
            {signingIn ? (
              <div className="h-4 w-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            ) : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-slate-200 dark:border-blue-500/15" />
            <span className="font-mono text-xs text-slate-400 dark:text-blue-400/40">OR</span>
            <div className="flex-1 border-t border-slate-200 dark:border-blue-500/15" />
          </div>

          {/* Email form */}
          <div className="space-y-3">
            {isSignUp && (
              <input
                type="text"
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl border text-sm font-sans
                  border-slate-300 bg-white placeholder:text-slate-400 text-slate-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:border-blue-500/20 dark:bg-[#0A0A0A] dark:text-white dark:placeholder:text-blue-400/30
                  dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all"
              />
            )}
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full px-4 py-3 rounded-xl border text-sm font-sans
                border-slate-300 bg-white placeholder:text-slate-400 text-slate-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:border-blue-500/20 dark:bg-[#0A0A0A] dark:text-white dark:placeholder:text-blue-400/30
                dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all"
            />
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder={isSignUp ? "Create a password" : "••••••••"}
                className="w-full px-4 py-3 pr-10 rounded-xl border text-sm font-sans
                  border-slate-300 bg-white placeholder:text-slate-400 text-slate-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:border-blue-500/20 dark:bg-[#0A0A0A] dark:text-white dark:placeholder:text-blue-400/30
                  dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-400/40 hover:text-slate-600 dark:hover:text-blue-400 transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isSignUp && (
              <div className="text-right">
                <button className="font-sans text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
              </div>
            )}
          </div>

          <button
            onClick={handleGoogle}
            className="w-full mt-4 py-3 rounded-xl font-sans font-semibold text-sm transition-all
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-black
              dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_22px_rgba(59,130,246,0.55)]"
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </button>

          <p className="font-sans text-sm text-slate-500 dark:text-slate-400 text-center mt-5">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => setIsSignUp(s => !s)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              {isSignUp ? "Sign in " : "Sign up free "}
            </button>
          </p>

          <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/30 text-center mt-6">
            🔒 Your keys never leave our edge functions
          </p>
        </motion.div>
      </div>
    </div>
  );
}
