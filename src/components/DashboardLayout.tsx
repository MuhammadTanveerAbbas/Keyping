import { BarChart3, Bell, Command, History, LogOut, Package, PanelLeftClose, PanelLeftOpen, Settings, Users, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CommandPalette from "@/components/CommandPalette";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/components/dashboard/pageMeta";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { onDataChanged } from "@/lib/data-events";

const navSections = [
  {
    label: "Core",
    items: [
      { to: "/dashboard", icon: Zap, label: "Tester", end: true },
      { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", end: false },
      { to: "/dashboard/history", icon: History, label: "History", end: false },
      { to: "/dashboard/alerts", icon: Bell, label: "Expiry Alerts", end: false },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/dashboard/bulk", icon: Package, label: "Bulk Test", end: false },
      { to: "/dashboard/team", icon: Users, label: "Team", end: false },
    ],
  },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalTests, setTotalTests] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const avatarLetter = (user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();
  const meta = pageMeta[location.pathname] ?? { title: "Workspace", description: "Monitor credentials and validation performance." };

  useEffect(() => {
    document.title = `${meta.title} | KeyPing`;
  }, [meta.title]);

  useEffect(() => {
    if (!user) {
      setTotalTests(null);
      return;
    }

    let active = true;
    const refreshCount = () => {
      void supabase
        .from("key_tests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count, error }) => {
          if (active && !error) setTotalTests(count || 0);
        });
    };

    refreshCount();
    const unsubscribe = onDataChanged(["key_tests"], () => void refreshCount());

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const openCommandPalette = () => {
    const useMeta = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: useMeta,
        ctrlKey: !useMeta,
        bubbles: true,
      }),
    );
  };

  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      setAccountOpen(false);
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign out.";
      toast.error(message);
    } finally {
      setSigningOut(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header: logo only */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200/80 px-4">
        <NavLink
          to="/dashboard"
          className={cn(
            "flex h-11 items-center rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            sidebarOpen ? "gap-2.5" : "w-full justify-center",
          )}
          aria-label="KeyPing tester home"
        >
          <KeyPingLogo size={26} />
          {sidebarOpen && (
            <span className="font-display text-base font-bold tracking-tight text-slate-900">KeyPing</span>
          )}
        </NavLink>
      </div>

      {/* Nav with category labels */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4" aria-label="Primary navigation">
        <div className="space-y-1">
          {navSections.map((section, si) => (
            <div key={section.label} className={cn(si > 0 && "mt-4")}>
              {sidebarOpen ? (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none">
                  {section.label}
                </p>
              ) : si > 0 ? (
                <div className="mx-2 mb-2 h-px bg-slate-100" />
              ) : null}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium",
                        "transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                        sidebarOpen ? "gap-3" : "justify-center",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] scale-[1.01]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute inset-0 rounded-xl bg-white/10 blur-sm" aria-hidden="true" />
                        )}
                        <span
                          className={cn(
                            "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.15)]"
                              : "bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.08)] group-hover:from-blue-50 group-hover:to-blue-100 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(37,99,235,0.12)]",
                          )}
                          aria-hidden="true"
                        >
                          <Icon
                            className={cn(
                              "h-[15px] w-[15px] transition-all duration-200",
                              isActive ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110",
                            )}
                          />
                        </span>
                        {sidebarOpen && <span className="relative">{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Settings + Collapse toggle — pinned to bottom */}
      <div className="shrink-0 border-t border-slate-200/80 px-2 pt-2 pb-1">
        <NavLink
          to="/dashboard/settings"
          end={false}
          title="Settings"
          className={({ isActive }) =>
            cn(
              "group relative flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium",
              "transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              sidebarOpen ? "gap-3" : "justify-center",
              isActive
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] scale-[1.01]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-white/10 blur-sm" aria-hidden="true" />
              )}
              <span
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.15)]"
                    : "bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.08)] group-hover:from-blue-50 group-hover:to-blue-100 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(37,99,235,0.12)]",
                )}
                aria-hidden="true"
              >
                <Settings
                  className={cn(
                    "h-[15px] w-[15px] transition-all duration-200",
                    isActive ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110",
                  )}
                />
              </span>
              {sidebarOpen && <span className="relative">Settings</span>}
            </>
          )}
        </NavLink>
      </div>
      <div className="shrink-0 px-2 pb-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "group flex w-full min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium",
            "text-slate-500 transition-all duration-200 ease-out",
            "hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm",
            "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            sidebarOpen ? "gap-3" : "justify-center",
          )}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 transition-colors group-hover:border-slate-300 group-hover:bg-white"
            aria-hidden="true"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-[15px] w-[15px] text-slate-500 transition-colors group-hover:text-slate-700" />
            ) : (
              <PanelLeftOpen className="h-[15px] w-[15px] text-slate-500 transition-colors group-hover:text-slate-700" />
            )}
          </span>
          {sidebarOpen && <span className="relative">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-50">
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-[70] rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only"
      >
        Skip to content
      </a>
      <CommandPalette />

      {/* Mobile bottom nav with safe area support */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-slate-200/90 bg-white/95 pb-safe backdrop-blur-md lg:hidden" aria-label="Mobile navigation">
        {[
          { to: "/dashboard", icon: Zap, label: "Tester", end: true },
          { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", end: false },
          { to: "/dashboard/history", icon: History, label: "History", end: false },
          { to: "/dashboard/alerts", icon: Bell, label: "Alerts", end: false },
          { to: "/dashboard/bulk", icon: Package, label: "Bulk", end: false },
          { to: "/dashboard/team", icon: Users, label: "Team", end: false },
          { to: "/dashboard/settings", icon: Settings, label: "Settings", end: false },
        ].map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[9px] font-medium transition-colors min-w-0",
                isActive ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn("flex h-[26px] w-[26px] items-center justify-center rounded-lg transition-colors", isActive ? "bg-blue-50 text-blue-600" : "text-slate-500")}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="truncate max-w-full px-0.5">{label}</span>
              </>
            )}
          </NavLink>
        ))}

      </nav>

      <aside
        className={cn(
          "hidden h-dvh shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex",
          "transition-[width] duration-200 ease-in-out",
          sidebarOpen ? "w-64" : "w-16",
        )}
        aria-label="Workspace navigation"
      >
        {sidebarContent}
      </aside>

      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* On small screens show the brand; on large screens the sidebar carries it */}
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:hidden"
              aria-label="KeyPing home"
            >
              <KeyPingLogo size={22} />
              <span className="font-display text-sm font-bold tracking-tight text-slate-900">KeyPing</span>
            </NavLink>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">{meta.title}</p>
              <div className="flex items-center gap-2">
                {meta.description && <p className="hidden max-w-[34rem] truncate text-xs font-medium text-slate-500 md:block">{meta.description}</p>}
                {totalTests !== null && totalTests > 0 && (
                  <span className="hidden whitespace-nowrap text-[11px] font-medium text-slate-400 sm:inline">
                    {totalTests.toLocaleString()} saved
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              className="hidden h-10 touch-manipulation touch-target items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 sm:flex"
            >
              <Command className="h-3 w-3" aria-hidden="true" />
              <span>K</span>
            </button>
            <Button
              type="button"
              size="sm"
              className="h-11 min-w-[44px] touch-manipulation touch-target rounded-lg bg-blue-600 px-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md sm:h-10 sm:min-w-0"
              onClick={() => navigate("/dashboard")}
            >
              <span className="hidden sm:inline">New test</span>
              <span className="sm:hidden">Test</span>
            </Button>
            <div ref={accountRef} className="relative">
              <button
                type="button"
                aria-label="Account menu"
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm ring-2 ring-white transition-all hover:shadow-md hover:ring-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
              >
                {avatarLetter}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-64 max-sm:fixed max-sm:right-3 max-sm:top-14 max-sm:w-[calc(100vw-1.5rem)]">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/30">
                        {avatarLetter}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white">{displayName}</p>
                        <p className="truncate text-[10px] text-blue-100">{user?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAccountOpen(false)}
                        aria-label="Close"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/15 text-white transition-colors hover:bg-white/25"
                      >
                        <span className="text-xs leading-none">&times;</span>
                      </button>
                    </div>
                  </div>

                  <div className="px-1.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => { setAccountOpen(false); navigate("/dashboard/settings"); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                      </span>
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 px-1.5 pb-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <LogOut className="h-3.5 w-3.5 text-red-500" />
                      </span>
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-none p-4 pb-24 outline-none sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
