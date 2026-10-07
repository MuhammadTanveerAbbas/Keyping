import { BarChart3, Bell, Command, History, LogOut, Package, Settings, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
  {
    label: "Settings",
    items: [{ to: "/dashboard/settings", icon: Settings, label: "Settings", end: false }],
  },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalTests, setTotalTests] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);
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
    supabase
      .from("key_tests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count, error }) => {
        if (active && !error) setTotalTests(count || 0);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const refreshCount = () => {
      void supabase
        .from("key_tests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count, error }) => {
          if (!error) setTotalTests(count || 0);
        });
    };
    return onDataChanged(["key_tests"], () => void refreshCount());
  }, [user]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      setSigningOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  };

  const openCommandPalette = () => {
    // Dispatches the same event a real keyboard would produce, using the
    // modifier that matches the platform. It previously set metaKey and
    // ctrlKey together, which no keyboard can do, so the button took a
    // different path through the handler than the real shortcut.
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

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-200/80 px-4 py-3.5">
        <NavLink
          to="/dashboard"
          className="flex min-h-11 items-center gap-2.5 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="KeyPing tester home"
        >
          <KeyPingLogo size={26} />
          <span className="font-display text-base font-bold tracking-tight text-slate-900">KeyPing</span>
        </NavLink>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Primary navigation">
        <div className="space-y-0.5">
          {navSections.flatMap((section, si) =>
            [
              si > 0 && (
                <div key={`sep-${section.label}`} className="my-3 mx-2 h-px bg-slate-100" />
              ),
              ...section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                      "transition-all duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
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
                      <span className="relative">{label}</span>
                    </>
                  )}
                </NavLink>
              )),
            ].filter(Boolean)
          )}
        </div>
      </nav>

      <div className="shrink-0 border-t border-slate-200/80 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm" aria-hidden="true">
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">{user?.user_metadata?.full_name || "Account"}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email || "Signed in"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? "Signing out..." : "Sign out"}
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
                <span className={cn("flex h-6.5 w-6.5 items-center justify-center rounded-lg transition-colors", isActive ? "bg-blue-50 text-blue-600" : "text-slate-500")}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="truncate max-w-full px-0.5">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <aside className="hidden h-dvh w-64 min-h-0 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex" aria-label="Workspace navigation">
        {sidebarContent}
      </aside>

      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0">
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
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 sm:flex"
            >
              <Command className="h-3 w-3" aria-hidden="true" />
              <span>K</span>
            </button>
            <Button
              type="button"
              size="sm"
              className="h-10 min-w-[44px] rounded-lg bg-blue-600 px-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              onClick={() => navigate("/dashboard")}
            >
              <span className="hidden sm:inline">New test</span>
              <span className="sm:hidden">Test</span>
            </Button>
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
