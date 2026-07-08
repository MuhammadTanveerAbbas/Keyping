import { Link } from "react-router-dom";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { motion } from "framer-motion";

const fadeUp = {
 initial: { opacity: 0, y: 12 },
 animate: { opacity: 1, y: 0 },
 transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
 animate: { transition: { staggerChildren: 0.06 } },
};

export function Footer() {
 return (
  <footer className="relative border-t border-slate-200 bg-slate-100 overflow-hidden">
   <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
   <div className="absolute top-0 left-1/3 w-96 h-24 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
   <motion.div
    initial="initial"
    whileInView="animate"
    viewport={{ once: true, margin: "-50px" }}
    variants={stagger}
    className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12"
   >
    <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
     <div className="space-y-3">
      <div className="flex items-center gap-2.5">
       <KeyPingLogo size={28} />
       <span className="font-display text-base font-bold text-slate-900">KeyPing</span>
      </div>
      <p className="font-sans text-sm text-slate-500 leading-relaxed">Ping any API key. Know it works.</p>
     </div>
     <div className="space-y-3">
      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-800">Product</h4>
      <div className="flex flex-col gap-2">
       <Link to="/dashboard" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Dashboard
       </Link>
       <a href="/#providers" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Providers
       </a>
       <a href="/#pricing" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Pricing
       </a>
      </div>
     </div>
     <div className="space-y-3">
      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-800">Resources</h4>
      <div className="flex flex-col gap-2">
       <Link to="/dashboard/docs" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Documentation
       </Link>
       <a href="mailto:contact@keyping.dev" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Support
       </a>
      </div>
     </div>
     <div className="space-y-3">
      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-800">Legal</h4>
      <div className="flex flex-col gap-2">
       <Link to="/privacy" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Privacy Policy
       </Link>
       <Link to="/terms" className="group relative font-sans text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        Terms of Service
       </Link>
      </div>
     </div>
    </motion.div>
    <motion.div variants={fadeUp} className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
     <p className="font-mono text-xs text-slate-500">
      &copy; {new Date().getFullYear()} KeyPing
     </p>
     <a
      href="https://github.com/MuhammadTanveerAbbas/Keyping"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 font-sans text-xs text-slate-500 hover:text-blue-600 transition-colors"
     >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
       <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
      </svg>
      GitHub
     </a>
    </motion.div>
   </motion.div>
  </footer>
 );
}
