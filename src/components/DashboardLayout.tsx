import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Zap, Package, Users, BarChart3, History, Bell, Settings, LogOut, Menu,
  Shield, BookOpen, PanelLeftClose, PanelLeft, Command, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import PageTransition from "@/components/PageTransition";
import CommandPalette from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";

function KeyPingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#kp-sb-g)" />
      <circle cx="12" cy="14" r="5" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <rect x="16.5" y="13" width="9" height="2.2" rx="1.1" fill="white" />
      <rect x="22" y="15.2" width="2" height="2.5" rx="0.8" fill="white" />
      <rect x="18.5" y="15.2" width="2" height="1.8" rx="0.8" fill="white" />
      <circle cx="26" cy="8" r="3" fill="#22D3EE" opacity="0.9" />
      <circle cx="26" cy="8" r="1.5" fill="white" />
      <defs>
        <linearGradient id="kp-sb-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const navItems = [
  { to: "/dashboard", icon: Zap, label: "Tester", end: true },
  { to: "/dashboard/bulk", icon: Package, label: "Bulk Test", end: false },
  { to: "/dashboard/vault", icon: Shield, label: "Key Vault", end: false },
  { to: "/dashboard/team", icon: Users, label: "Team", end: false },
  { to: "/dashboard/stats", icon: BarChart3, label: "Stats", end: false },
  { to: "/dashboard/history", icon: History, label: "History", end: false },
  { to: "/dashboard/alerts", icon: Bell, label: "Alerts", end: false },
  { to: "/dashboard/docs", icon: BookOpen, label: "Docs", end: false },
  { to: "/dashboard/settings", icon: Settings, label: "Settings", end: false },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "API Key Tester",
  "/dashboard/bulk": "Bulk Test",
  "/dashboard/vault": "Key Vault",
  "/dashboard/team": "Team Workspace",
  "/dashboard/stats": "Stats",
  "/dashboard/history": "Test History",
  "/dashboard/alerts": "Alerts",
  "/dashboard/docs": "Documentation",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [totalTests, setTotalTests] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("key_tests").select("id", { count: "exact", head: true }).then(({ count }) => {
      setTotalTests(count || 0);
    });
  }, [user, location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-blue-500/20">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="shrink-0"><KeyPingLogo size={28} /></div>
          {!collapsed && <span className="font-display text-base font-bold text-slate-900 dark:text-blue-400">KeyPing</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {!collapsed && (
          <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40 uppercase tracking-widest px-3 mt-2 mb-2">Main</p>
        )}
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-150",
              isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border-l-2 dark:border-blue-500 dark:pl-[10px]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-blue-300 dark:hover:bg-blue-500/5"
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 pb-2">
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-500/5 transition-all w-full border border-dashed border-slate-200 dark:border-blue-500/10">
          {collapsed ? <PanelLeft className="h-4 w-4 shrink-0" /> : (
            <><PanelLeftClose className="h-4 w-4 shrink-0" /><span className="font-sans text-xs">Collapse</span></>
          )}
        </button>
      </div>

      {/* User row */}
      <div className="p-3 border-t border-slate-200 dark:border-blue-500/20 space-y-2">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-default">
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 ring-2 ring-white dark:ring-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="font-mono text-[10px] text-slate-400 dark:text-blue-400/40 truncate">Free plan</p>
              </div>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full font-sans">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 ring-2 ring-white dark:ring-black" />
            </div>
            <button onClick={handleSignOut} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] flex overflow-x-hidden">
      <CommandPalette />

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-slate-200 dark:border-blue-500/20 bg-white dark:bg-[#000000] transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80vw] border-r border-slate-200 dark:border-blue-500/20 bg-white dark:bg-[#000000]">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="bg-white/80 dark:bg-[#000000]/80 backdrop-blur-sm border-b border-slate-200 dark:border-blue-500/20 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-slate-500 shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <KeyPingLogo size={24} />
              <span className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">KeyPing</span>
            </div>
            <span className="hidden md:inline font-mono text-sm text-slate-400 dark:text-blue-400/60 truncate">
              keyping
              {pathSegments.map((seg, i) => (
                <span key={i}>
                  <span className="mx-1 text-slate-300 dark:text-blue-500/30">/</span>
                  <span className={i === pathSegments.length - 1 ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-blue-400/60"}>{seg}</span>
                </span>
              ))}
            </span>
            {totalTests > 0 && (
              <span className="hidden sm:inline font-mono text-[10px] text-slate-400 dark:text-blue-400/40 border border-slate-200 dark:border-blue-500/20 rounded px-2 py-0.5 shrink-0">
                {totalTests} tests
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400 dark:text-blue-400/40 border border-slate-200 dark:border-blue-500/20 rounded-lg px-2.5 py-1.5 hover:border-slate-300 dark:hover:border-blue-500/40 hover:text-slate-600 dark:hover:text-blue-400 transition-colors"
            >
              <Command className="h-3 w-3" /><span>K</span>
            </button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 dark:text-blue-400/60 hover:text-slate-700 dark:hover:text-blue-400" onClick={() => navigate("/dashboard/alerts")}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="sm"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-xs rounded-lg px-3 sm:px-4 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_22px_rgba(59,130,246,0.55)] transition-all border-0 h-9 min-w-[44px]"
              onClick={() => navigate("/dashboard")}>
              <span className="hidden sm:inline">+ Add Key</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
