import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowRight, Mail, CheckCircle2, Zap, Shield, Activity } from "lucide-react";
import { toast } from "sonner";
import { KeyPingLogo } from "@/components/KeyPingLogo";

function GoogleIcon() {
 return (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
 );
}

function AuthIllustration() {
 const [activeStep, setActiveStep] = useState(0);
 const steps = [
  { label: "Paste key", color: "#3B82F6" },
  { label: "Detect provider", color: "#8B5CF6" },
  { label: "Validate", color: "#10B981" },
  { label: "Health score", color: "#F59E0B" },
 ];

 useEffect(() => {
  const interval = setInterval(() => {
   setActiveStep((prev) => (prev + 1) % steps.length);
  }, 2000);
  return () => clearInterval(interval);
 }, [steps.length]);

 return (
  <div className="relative w-full max-w-md mx-auto">
   {/* Main illustration card */}
   <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
    {/* Header */}
    <div className="flex items-center gap-2 mb-6">
     <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
      <Zap className="h-4 w-4 text-blue-400" />
     </div>
     <span className="text-sm font-medium text-white">Live Validation</span>
     <div className="ml-auto flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-xs text-emerald-400">Active</span>
     </div>
    </div>

    {/* Terminal mockup */}
    <div className="bg-black/40 rounded-xl p-4 font-mono text-xs border border-slate-700/30">
     <div className="flex items-center gap-2 mb-3">
      <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
     </div>
     <div className="space-y-2">
      <div className="flex items-center gap-2">
       <span className="text-emerald-400">$</span>
       <span className="text-slate-300">keyping test sk-proj-...</span>
      </div>
      <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       className="text-cyan-400"
      >
       ▶ Provider: OpenAI
      </motion.div>
      <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.2 }}
       className="text-emerald-400"
      >
       ✓ Status: Valid
      </motion.div>
      <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.4 }}
       className="text-slate-400"
      >
       ✓ Rate limit: 90,000 TPM
      </motion.div>
      <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.6 }}
       className="text-emerald-400 font-semibold"
      >
       ✓ Health Score: 94/100
      </motion.div>
     </div>
    </div>

    {/* Progress steps */}
    <div className="mt-6">
     <div className="flex items-center justify-between mb-3">
      {steps.map((step, i) => (
       <div key={step.label} className="flex items-center gap-1.5">
        <motion.div
         animate={{
          scale: activeStep === i ? 1.2 : 1,
          backgroundColor: activeStep === i ? step.color : `${step.color}33`,
         }}
         className="h-2 w-2 rounded-full"
        />
        <span className={`text-[10px] font-medium transition-colors ${activeStep === i ? "text-white" : "text-slate-500"}`}>
         {step.label}
        </span>
       </div>
      ))}
     </div>
     <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
      <motion.div
       className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
       animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
       transition={{ duration: 0.5 }}
      />
     </div>
    </div>

    {/* Stats row */}
    <div className="mt-6 grid grid-cols-3 gap-3">
     <div className="text-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <p className="text-lg font-bold text-white">10+</p>
      <p className="text-[10px] text-slate-400">Providers</p>
     </div>
     <div className="text-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <p className="text-lg font-bold text-emerald-400">2s</p>
      <p className="text-[10px] text-slate-400">Avg time</p>
     </div>
     <div className="text-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <p className="text-lg font-bold text-blue-400">100</p>
      <p className="text-[10px] text-slate-400">Max score</p>
     </div>
    </div>
   </div>

   {/* Floating elements */}
   <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -top-4 -right-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 backdrop-blur-sm"
   >
    <Shield className="h-5 w-5 text-emerald-400" />
   </motion.div>
   <motion.div
    animate={{ y: [0, 8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -bottom-4 -left-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 backdrop-blur-sm"
   >
    <Activity className="h-5 w-5 text-blue-400" />
   </motion.div>
  </div>
 );
}

export default function AuthPage() {
 const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
 const navigate = useNavigate();
 const [showPass, setShowPass] = useState(false);
 const [isSignUp, setIsSignUp] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [showReset, setShowReset] = useState(false);
 const [resetSent, setResetSent] = useState(false);

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [name, setName] = useState("");
 const [formErrors, setFormErrors] = useState<{ email?: string; password?: string; name?: string }>({});

 useEffect(() => {
  if (!loading && user) navigate("/dashboard", { replace: true });
 }, [user, loading, navigate]);

 if (loading)
  return (
   <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="h-8 w-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
   </div>
  );

 const validate = () => {
  const errors: typeof formErrors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
  if (!showReset) {
   if (!password) errors.password = "Password is required";
   else if (password.length < 6) errors.password = "Minimum 6 characters";
  }
  if (isSignUp && !name.trim()) errors.name = "Name is required";
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  setSubmitting(true);
  try {
   if (showReset) {
    await resetPassword(email);
    setResetSent(true);
   } else if (isSignUp) {
    await signUpWithEmail(email, password);
    toast.success("Account created! Check your email to verify.");
   } else {
    await signInWithEmail(email, password);
   }
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : "Something went wrong";
   toast.error(message);
  } finally {
   setSubmitting(false);
  }
 };

 const handleGoogle = async () => {
  setSubmitting(true);
  try {
   await signInWithGoogle();
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : "Google sign-in failed";
   toast.error(message);
  } finally {
   setSubmitting(false);
  }
 };

 return (
  <div className="min-h-screen flex bg-white">
   {/* Left brand panel - hidden on mobile, visible on lg+ */}
   <div className="hidden lg:flex lg:w-[48%] bg-slate-950 flex-col justify-between relative overflow-hidden p-8 xl:p-12">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
     backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
     backgroundSize: '32px 32px'
    }} />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/[0.07] rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
    <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-violet-500/[0.05] rounded-full blur-[100px] -translate-x-1/3 -translate-y-1/3" />

    {/* Logo */}
    <div className="relative z-10">
     <div className="flex items-center gap-2.5">
      <KeyPingLogo size={30} />
      <span className="font-display text-base font-semibold text-white tracking-tight">KeyPing</span>
     </div>
    </div>

    {/* Center illustration */}
    <div className="relative z-10 flex-1 flex items-center justify-center py-8">
     <AuthIllustration />
    </div>

    {/* Bottom */}
    <div className="relative z-10">
     <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
       <div className="h-2 w-2 rounded-full bg-emerald-400" />
       <span className="text-xs text-slate-400">Real-time validation</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="h-2 w-2 rounded-full bg-blue-400" />
       <span className="text-xs text-slate-400">Rate limit checks</span>
      </div>
     </div>
     <p className="text-xs text-slate-500">
      Open source - Privacy first - Full keys never stored
     </p>
    </div>
   </div>

   {/* Right form panel */}
   <div className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-10 py-8 sm:py-12">
    <motion.div
     initial={{ opacity: 0, y: 12 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
     className="w-full max-w-[380px]"
    >
     {/* Mobile logo */}
     <div className="lg:hidden flex items-center gap-2.5 mb-8 sm:mb-10">
      <KeyPingLogo size={28} />
      <span className="font-display text-base font-semibold text-slate-900 tracking-tight">KeyPing</span>
     </div>

     {/* Heading */}
     <div className="mb-6 sm:mb-8">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
       {showReset ? "Reset your password" : isSignUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
       {showReset
        ? "We will send a reset link to your email"
        : isSignUp
         ? "Start validating API keys for free"
         : "Welcome back to KeyPing"}
      </p>
     </div>

     {/* Reset sent confirmation */}
     {resetSent ? (
      <motion.div
       initial={{ opacity: 0, scale: 0.96 }}
       animate={{ opacity: 1, scale: 1 }}
       className="py-8 sm:py-10 text-center"
      >
       <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
       </div>
       <h3 className="font-display text-lg font-semibold text-slate-900">Check your inbox</h3>
       <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        We sent a password reset link to <span className="font-medium text-slate-700">{email}</span>
       </p>
       <button
        onClick={() => { setResetSent(false); setShowReset(false); }}
        className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
       >
        Back to sign in
       </button>
      </motion.div>
     ) : (
      <>
       {/* Google OAuth */}
       <button
        onClick={handleGoogle}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-sans font-medium text-sm transition-all duration-150
         bg-slate-50 border border-slate-200 text-slate-700
         hover:bg-slate-100 hover:border-slate-300
         disabled:opacity-50 disabled:cursor-not-allowed"
       >
        {submitting ? (
         <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
         <GoogleIcon />
        )}
        Continue with Google
       </button>

       {/* Divider */}
       <div className="flex items-center gap-4 my-5 sm:my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-slate-200" />
       </div>

       {/* Email form */}
       <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
         <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
          <input
           type="text"
           value={name}
           onChange={(e) => { setName(e.target.value); setFormErrors(p => ({ ...p, name: undefined })); }}
           placeholder="John Doe"
           className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-sans border transition-all duration-150
             bg-white placeholder:text-slate-400 text-slate-900
             ${formErrors.name ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}
             focus:outline-none focus:ring-4 focus:border-blue-500`}
          />
          {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
         </div>
        )}
        <div>
         <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
         <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFormErrors(p => ({ ...p, email: undefined })); }}
          placeholder="you@company.com"
          className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-sans border transition-all duration-150
            bg-white placeholder:text-slate-400 text-slate-900
            ${formErrors.email ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}
            focus:outline-none focus:ring-4 focus:border-blue-500`}
         />
         {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
        </div>
        {!showReset && (
         <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
          <div className="relative">
           <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFormErrors(p => ({ ...p, password: undefined })); }}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm font-sans border transition-all duration-150
              bg-white placeholder:text-slate-400 text-slate-900
              ${formErrors.password ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}
              focus:outline-none focus:ring-4 focus:border-blue-500`}
           />
           <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
           >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
           </button>
          </div>
          {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
         </div>
        )}

        {!showReset && !isSignUp && (
         <div className="text-right">
          <button
           type="button"
           onClick={() => setShowReset(true)}
           className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
           Forgot password?
          </button>
         </div>
        )}

        <button
         type="submit"
         disabled={submitting}
         className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-sans font-semibold text-sm transition-all duration-150
          bg-slate-900 text-white
          hover:bg-slate-800
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
         {submitting ? (
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
         ) : (
          <>
           {showReset ? (
            <>
             <Mail className="h-4 w-4" />
             Send Reset Link
            </>
           ) : isSignUp ? (
            <>
             Create Account
             <ArrowRight className="h-4 w-4" />
            </>
           ) : (
            <>
             Sign In
             <ArrowRight className="h-4 w-4" />
            </>
           )}
          </>
         )}
        </button>
       </form>

       {/* Toggle auth mode */}
       <p className="text-sm text-slate-500 text-center mt-5 sm:mt-6">
        {isSignUp ? "Already have an account?" : "Do not have an account?"}{' '}
        <button
         onClick={() => { setIsSignUp((s) => !s); setFormErrors({}); setShowReset(false); }}
         className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
        >
         {isSignUp ? "Sign in" : "Sign up free"}
        </button>
       </p>
      </>
     )}

     {/* Footer note */}
     <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-100">
      <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
       <Lock className="h-3 w-3" /> Secured by Supabase Auth - Row Level Security enabled
      </p>
     </div>
    </motion.div>
   </div>
  </div>
 );
}
