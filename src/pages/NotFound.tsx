import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#000000]">
      <div className="text-center space-y-4">
        <p className="font-mono text-xs text-blue-500 dark:text-blue-400/60 tracking-[0.2em] uppercase mb-2">· 404 ERROR</p>
        <h1 className="font-display text-8xl font-extrabold text-slate-100 dark:text-blue-500/10 leading-none">404</h1>
        <p className="font-sans text-lg text-slate-600 dark:text-slate-400">Page not found</p>
        <p className="font-mono text-sm text-slate-400 dark:text-blue-400/40">&gt; The route you requested does not exist.</p>
        <Button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl px-5 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all border-0 gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
