import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-white dark:bg-[#000000]">
      <div className="relative">
        <div className="text-8xl font-display font-extrabold text-blue-500/20 dark:text-blue-500/10 select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="h-10 w-10 text-blue-500 dark:text-blue-400" />
        </div>
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
        Page not found
      </h1>
      <p className="font-sans text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold rounded-xl">
          <Home className="h-4 w-4 mr-2" />
          Go home
        </Button>
      </Link>
    </div>
  );
}
