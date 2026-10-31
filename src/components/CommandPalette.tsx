import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ArrowRight,
  BarChart3,
  Bell,
  History,
  LogOut,
  Package,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navCommands = [
  { label: "Tester",          icon: Zap,       to: "/dashboard",             keywords: "test api key ping",               shortcut: "T", description: "Validate an API key" },
  { label: "Request Lab",     icon: ArrowRight, to: "/dashboard#request-lab", keywords: "request endpoint custom response", shortcut: "R", description: "Custom HTTP request builder" },
  { label: "Bulk Test",       icon: Package,    to: "/dashboard/bulk",        keywords: "batch multiple",                  shortcut: "B", description: "Test many keys at once" },
  { label: "Analytics",       icon: BarChart3,  to: "/dashboard/analytics",   keywords: "statistics charts graphs",        shortcut: "A", description: "Usage stats and charts" },
  { label: "History & Vault", icon: History,    to: "/dashboard/history",     keywords: "past results log vault",          shortcut: "H", description: "Past tests and saved keys" },
  { label: "Expiry Alerts",   icon: Bell,       to: "/dashboard/alerts",      keywords: "expiry reminders credentials",    shortcut: "E", description: "Key expiry notifications" },
  { label: "Team Workspace",  icon: Users,      to: "/dashboard/team",        keywords: "team share collaborate",          shortcut: "W", description: "Manage team members" },
  { label: "Settings",        icon: Settings,   to: "/dashboard/settings",    keywords: "preferences config",              shortcut: "S", description: "App preferences and config" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  let current: HTMLElement | null = target;
  while (current) {
    if (current.getAttribute("role") !== null) return true;
    if (current.getAttribute("aria-expanded") !== null) return true;
    if (current.tagName === "BUTTON" || current.tagName === "A") return true;
    current = current.parentElement;
  }
  return false;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-slate-500 shadow-[0_1px_0_rgba(0,0,0,0.07)]">
      {children}
    </kbd>
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((c) => !c);
        return;
      }
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (open) return;
      const command = navCommands.find(
        (item) => item.shortcut.toLowerCase() === event.key.toLowerCase(),
      );
      if (command) {
        event.preventDefault();
        navigate(command.to);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, open]);

  const runCommand = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and actions…" aria-label="Search commands" />

      <CommandList>
        {/* Empty state */}
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-3xl leading-none">⌘</span>
            <p className="text-sm font-medium text-slate-500">No results found</p>
            <p className="text-xs text-slate-400">Try a different keyword</p>
          </div>
        </CommandEmpty>

        {/* Pages */}
        <CommandGroup heading="Pages">
          {navCommands.map((command) => {
            const isActive =
              location.pathname === command.to ||
              (command.to.includes("#") &&
                location.pathname === command.to.split("#")[0] &&
                location.hash === `#${command.to.split("#")[1]}`);

            return (
              <CommandItem
                key={command.to}
                value={`${command.label} ${command.keywords}`}
                onSelect={() => runCommand(() => navigate(command.to))}
              >
                {/* Icon box: blue only when this is the active page, else slate */}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                      : "bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.07)]",
                  )}
                  aria-hidden="true"
                >
                  <command.icon
                    className={cn(
                      "h-[15px] w-[15px]",
                      isActive ? "text-white" : "text-slate-400",
                    )}
                  />
                </span>

                {/* Label + description */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn(
                    "text-[13px] font-medium leading-none",
                    isActive ? "text-blue-600" : "text-slate-800",
                  )}>
                    {command.label}
                  </span>
                  <span className="truncate text-[11px] leading-none text-slate-400">
                    {command.description}
                  </span>
                </div>

                {/* Active badge */}
                {isActive && (
                  <span className="hidden shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-500 sm:inline-flex">
                    current
                  </span>
                )}

                {/* Shortcut key */}
                <CommandShortcut className="hidden sm:block">
                  <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-slate-500">
                    {command.shortcut}
                  </kbd>
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            value="sign out logout"
            onSelect={() =>
              runCommand(() => {
                void signOut()
                  .then(() => navigate("/"))
                  .catch(() => toast.error("Could not sign out"));
              })
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-red-50 to-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.06)]">
              <LogOut className="h-[15px] w-[15px] text-red-400" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-medium leading-none text-slate-800">Sign out</span>
              <span className="text-[11px] leading-none text-slate-400">End your current session</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Kbd>↑</Kbd><Kbd>↓</Kbd>
            <span className="ml-0.5">navigate</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Kbd>↵</Kbd>
            <span className="ml-0.5">open</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Kbd>Esc</Kbd>
            <span className="ml-0.5">close</span>
          </span>
        </div>
        <span className="hidden text-[11px] text-slate-400 sm:block">
          Press a letter key to jump directly
        </span>
      </div>
    </CommandDialog>
  );
}
