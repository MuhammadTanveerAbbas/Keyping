import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        relative p-2 rounded-lg border transition-all duration-200
        border-slate-200 bg-white hover:bg-slate-100
        dark:border-blue-500/30 dark:bg-black dark:hover:bg-blue-500/10
        dark:shadow-[0_0_8px_rgba(59,130,246,0.2)]
      "
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 text-slate-600 dark:hidden" />
      <Moon className="h-4 w-4 text-blue-400 hidden dark:block" />
    </button>
  );
}
