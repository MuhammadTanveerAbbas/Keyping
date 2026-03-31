import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Zap, Package, Users, BarChart3, History, Bell, Settings,
  LogOut, Moon, Sun, Search,
} from "lucide-react";
import { useTheme } from "next-themes";

const navCommands = [
  { label: "Tester", icon: Zap, to: "/dashboard", keywords: "test api key ping" },
  { label: "Bulk Test", icon: Package, to: "/dashboard/bulk", keywords: "batch multiple" },
  { label: "Team Workspace", icon: Users, to: "/dashboard/team", keywords: "team share collaborate" },
  { label: "Stats", icon: BarChart3, to: "/dashboard/stats", keywords: "statistics analytics" },
  { label: "History", icon: History, to: "/dashboard/history", keywords: "past results log" },
  { label: "Alerts", icon: Bell, to: "/dashboard/alerts", keywords: "notifications expiry reminder" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings", keywords: "preferences config" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." className="font-mono text-sm" />
      <CommandList>
        <CommandEmpty className="font-mono text-sm text-slate-600 py-6 text-center">&gt; No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navCommands.map((cmd) => (
            <CommandItem
              key={cmd.to}
              value={`${cmd.label} ${cmd.keywords}`}
              onSelect={() => runCommand(() => navigate(cmd.to))}
              className={location.pathname === cmd.to ? "bg-white/5 text-white/70" : ""}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span className="font-sans text-sm">{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span className="font-sans text-sm">Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
          <CommandItem
            value="sign out logout"
            onSelect={() => runCommand(async () => {
              await signOut();
              navigate("/");
            })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="font-sans text-sm">Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
