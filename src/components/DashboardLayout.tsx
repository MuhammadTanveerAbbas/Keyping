import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Zap,
  Package,
  Users,
  BarChart3,
  History,
  Settings,
  LogOut,
  Command,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import PageTransition from "@/components/PageTransition";
import CommandPalette from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { pageMeta } from "@/components/dashboard/pageMeta";

const navSections = [
  {
    label: "Core",
    items: [
      { to: "/dashboard", icon: Zap, label: "Tester", end: true },
      { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", end: false },
      { to: "/dashboard/history", icon: History, label: "History", end: false },
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
    items: [
      { to: "/dashboard/settings", icon: Settings, label: "Settings", end: false },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalTests, setTotalTests] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = pageMeta[location.pathname] ?? { title: "Dashboard" };

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("key_tests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count, error }) => {
        if (!error) setTotalTests(count || 0);
      });
  }, [user, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <KeyPingLogo size={26} />
          <span className="font-display text-base font-bold text-slate-900 tracking-tight">
            KeyPing
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )
                  }
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      location.pathname === to ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {user?.user_metadata?.full_name || "Account"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <CommandPalette />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-over sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden flex-col border-r border-slate-200/80 bg-white shadow-sm lg:flex" style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }}>
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mr-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">
                {meta.title}
              </p>
              {totalTests > 0 && (
                <p className="hidden text-xs font-medium text-slate-500 sm:block">
                  {totalTests.toLocaleString()} tests saved
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-95 sm:flex"
            >
              <Command className="h-3 w-3" />
              <span>K</span>
            </button>
            <ThemeToggle />
            <Button
              size="sm"
              className="h-10 min-w-[44px] rounded-lg bg-blue-600 px-3 font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all sm:px-4"
              onClick={() => navigate("/dashboard")}
            >
              <span className="hidden sm:inline">New test</span>
              <span className="sm:hidden">Test</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
