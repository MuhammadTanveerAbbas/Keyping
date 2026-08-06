import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
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

export default function AuthPage() {
 const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
 const navigate = useNavigate();
 const [showPass, setShowPass] = useState(false);
 const [isSignUp, setIsSignUp] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [showReset, setShowReset] = useState(false);
 const [resetSent, setResetSent] = useState(false);

 // Form state
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
   {/* Left brand panel */}
   <div className="hidden lg:flex lg:w-[48%] bg-slate-950 flex-col justify-between relative overflow-hidden p-12">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
     backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
     backgroundSize: '32px 32px'
    }} />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/[0.07] rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

    {/* Logo */}
    <div className="relative z-10">
     <div className="flex items-center gap-2.5">
      <KeyPingLogo size={30} />
      <span className="font-display text-base font-semibold text-white tracking-tight">KeyPing</span>
     </div>
    </div>

    {/* Center content */}
    <div className="relative z-10 max-w-sm">
     <h2 className="text-2xl font-display font-semibold text-white leading-snug tracking-tight">
      Validate any API key in milliseconds
     </h2>
     <p className="text-sm text-slate-400 mt-3 leading-relaxed">
      Test OpenAI, Anthropic, Google, and 40+ providers before they break your app.
     </p>
     <div className="mt-8 space-y-3">
      <div className="flex items-center gap-2.5">
       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
       <span className="text-sm text-slate-300">Real-time key validation</span>
      </div>
      <div className="flex items-center gap-2.5">
       <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
       <span className="text-sm text-slate-300">Rate limit &amp; quota checks</span>
      </div>
      <div className="flex items-center gap-2.5">
       <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
       <span className="text-sm text-slate-300">Keys never leave your browser</span>
      </div>
     </div>
    </div>

    {/* Bottom */}
    <div className="relative z-10">
     <p className="text-xs text-slate-500">
      Open source · Privacy first · No keys stored
     </p>
    </div>
   </div>

   {/* Right form panel */}
   <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
    <motion.div
     initial={{ opacity: 0, y: 12 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
     className="w-full max-w-[380px]"
    >
     {/* Mobile logo */}
     <div className="lg:hidden flex items-center gap-2.5 mb-10">
      <KeyPingLogo size={28} />
      <span className="font-display text-base font-semibold text-slate-900 tracking-tight">KeyPing</span>
     </div>

     {/* Heading */}
     <div className="mb-8">
      <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
       {showReset ? "Reset your password" : isSignUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
       {showReset
        ? "We'll send a reset link to your email"
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
       className="py-10 text-center"
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
       <div className="flex items-center gap-4 my-6">
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
       <p className="text-sm text-slate-500 text-center mt-6">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
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
     <div className="mt-10 pt-6 border-t border-slate-100">
      <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
       <Lock className="h-3 w-3" /> Secured by Supabase · SOC 2 compliant
      </p>
     </div>
    </motion.div>
   </div>
  </div>
 );
}
