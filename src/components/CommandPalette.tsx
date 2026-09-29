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
import { ArrowRight, BarChart3, Bell, History, LogOut, Package, Settings, Users, Zap } from "lucide-react";

const navCommands = [
  { label: "Tester", icon: Zap, to: "/dashboard", keywords: "test api key ping", shortcut: "T" },
  { label: "Request lab", icon: ArrowRight, to: "/dashboard#request-lab", keywords: "request endpoint custom response", shortcut: "R" },
  { label: "Bulk Test", icon: Package, to: "/dashboard/bulk", keywords: "batch multiple", shortcut: "B" },
  { label: "Analytics", icon: BarChart3, to: "/dashboard/analytics", keywords: "statistics analytics charts", shortcut: "A" },
  { label: "History and Vault", icon: History, to: "/dashboard/history", keywords: "past results log vault", shortcut: "H" },
  { label: "Expiry alerts", icon: Bell, to: "/dashboard/alerts", keywords: "expiry reminders credentials", shortcut: "E" },
  { label: "Team Workspace", icon: Users, to: "/dashboard/team", keywords: "team share collaborate", shortcut: "W" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings", keywords: "preferences config alerts docs", shortcut: "S" },
];

/**
 * Whether the event came from somewhere the user is entering text.
 *
 * Checking only for INPUT, TEXTAREA, and contenteditable was not enough. A
 * Radix Switch, Select trigger, or AlertDialog trigger is a button or a div, so
 * focusing a preference switch and pressing "e" navigated to the alerts page
 * and discarded the switch the user was trying to operate. Any element that
 * carries a text entry role, or that is itself a control which reacts to a
 * bare keypress, is treated as a typing target.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

  // Walk up to find the nearest interactive ancestor. A key press that lands on
  // a switch, a select, a menu, a dialog, or a button belongs to that control.
  let current: HTMLElement | null = target;
  while (current) {
    if (current.getAttribute("role") !== null) return true;
    if (current.getAttribute("aria-expanded") !== null) return true;
    if (current.tagName === "BUTTON" || current.tagName === "A") return true;
    current = current.parentElement;
  }
  return false;
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
        setOpen((current) => !current);
        return;
      }
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      // The palette owns the keyboard while it is open, so a bare letter typed
      // into its search field cannot also trigger a navigation shortcut.
      if (open) return;
      const command = navCommands.find((item) => item.shortcut.toLowerCase() === event.key.toLowerCase());
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
      <CommandInput placeholder="Search commands, pages, and actions" aria-label="Search commands" />
      <CommandList>
        <CommandEmpty>
          <span className="text-blue-400/60">~/keyping</span>
          <span className="text-slate-600/50"> command not found</span>
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          {navCommands.map((command) => {
            const isActive = location.pathname === command.to || (command.to.includes("#") && location.pathname === command.to.split("#")[0] && location.hash === `#${command.to.split("#")[1]}`);
            return (
              <CommandItem key={command.to} value={`${command.label} ${command.keywords}`} onSelect={() => runCommand(() => navigate(command.to))} style={isActive ? { background: "linear-gradient(90deg, rgba(59,130,246,0.12), rgba(139,92,246,0.06))", borderLeft: "2px solid rgba(59,130,246,0.6)" } : undefined}>
                <command.icon className="mr-3 h-4 w-4 shrink-0" />
                <span className="flex-1 font-mono text-[13px]">{command.label}</span>
                {isActive && <span className="mr-2 rounded border border-blue-400/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-blue-300/70">active</span>}
                <CommandShortcut><span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">{command.shortcut}</span></CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="sign out logout" onSelect={() => runCommand(() => { void signOut().then(() => navigate("/")).catch(() => toast.error("Could not sign out")); })}>
            <LogOut className="mr-3 h-4 w-4 shrink-0 text-red-400/70" />
            <span className="flex-1 font-mono text-[13px] text-red-200/80">Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t border-blue-400/10 bg-white/[0.01] px-4 py-2.5">
        <div className="flex items-center gap-3">
          {[["Up", "navigate"], ["Enter", "select"], ["Esc", "close"]].map(([key, label]) => <span key={key} className="flex items-center gap-1"><kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] text-slate-500">{key}</kbd><span className="font-mono text-[9px] text-slate-600">{label}</span></span>)}
        </div>
        <span className="font-mono text-[9px] text-slate-600">keyping</span>
      </div>
    </CommandDialog>
  );
}
