import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
 Zap,
 Package,
 Users,
 BarChart3,
 History,
 Bell,
 Settings,
 LogOut,
 Menu,
 Shield,
 BookOpen,
 PanelLeftClose,
 PanelLeft,
 Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import PageTransition from "@/components/PageTransition";
import CommandPalette from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyPingLogo } from "@/components/KeyPingLogo";
import { pageMeta } from "@/components/dashboard/pageMeta";

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
 const { user, signOut } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [collapsed, setCollapsed] = useState(false);
 const [totalTests, setTotalTests] = useState<number>(0);

 const meta = pageMeta[location.pathname] ?? { title: "Dashboard" };

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
   <div className="border-b border-slate-200 px-4 py-4">
    <button
     type="button"
     onClick={() => setCollapsed(!collapsed)}
     className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
     aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
     <KeyPingLogo size={28} />
     {!collapsed && (
      <span className="font-display text-base font-semibold text-slate-900">
       KeyPing
      </span>
     )}
    </button>
   </div>

   <nav className="flex-1 space-y-0.5 p-3">
    {!collapsed && (
     <p className="mb-2 mt-1 px-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
      Menu
     </p>
    )}
    {navItems.map(({ to, icon: Icon, label, end }) => (
     <NavLink
      key={to}
      to={to}
      end={end}
      onClick={() => setSidebarOpen(false)}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
       cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        isActive
          ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500 pl-[10px]"
          : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900",
       )
      }
     >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
     </NavLink>
    ))}
   </nav>

   <div className="px-3 pb-2">
    <button
     type="button"
     onClick={() => setCollapsed(!collapsed)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-500 opacity-60 hover:opacity-100 transition-colors hover:bg-slate-50 hover:text-slate-700"
    >
     {collapsed ? (
      <PanelLeft className="h-4 w-4 shrink-0" />
     ) : (
      <>
       <PanelLeftClose className="h-4 w-4 shrink-0" />
       <span className="text-xs">Collapse</span>
      </>
     )}
    </button>
   </div>

   <div className="space-y-2 border-t border-slate-100 p-3">
    {!collapsed ? (
     <>
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
        {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
         user?.email?.[0]?.toUpperCase() ||
         "U"}
       </div>
       <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">
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
       className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
       <LogOut className="h-4 w-4" /> Sign out
      </button>
     </>
    ) : (
     <div className="flex flex-col items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
       {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
        user?.email?.[0]?.toUpperCase() ||
        "U"}
      </div>
      <button
       type="button"
       onClick={handleSignOut}
       aria-label="Sign out"
       className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
       <LogOut className="h-4 w-4" />
      </button>
     </div>
    )}
   </div>
  </div>
 );

 return (
  <div className="flex min-h-screen overflow-x-hidden bg-slate-100">
   <CommandPalette />

   <aside
    className={cn(
     "hidden shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200 md:flex",
     collapsed ? "w-[4.5rem]" : "w-60",
    )}
   >
    {sidebarContent}
   </aside>

   {sidebarOpen && (
    <div className="fixed inset-0 z-50 md:hidden">
     <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setSidebarOpen(false)}
      aria-hidden
     />
     <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-elevated animate-in slide-in-from-left transition-transform duration-300">
      {sidebarContent}
     </aside>
    </div>
   )}

   <div className="flex min-h-screen min-w-0 flex-1 flex-col">
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm shadow-sm sm:px-6">
     <div className="flex min-w-0 items-center gap-3">
      <Button
       variant="ghost"
       size="icon"
       className="h-10 w-10 shrink-0 text-slate-600 md:hidden"
       onClick={() => setSidebarOpen(true)}
       aria-label="Open menu"
      >
       <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0">
       <p className="truncate font-display text-sm font-semibold text-slate-900 sm:text-base">
        {meta.title}
       </p>
       {totalTests > 0 && (
        <p className="hidden text-xs text-slate-500 sm:block">
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
        className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-95 sm:flex"
      >
       <Command className="h-3 w-3" />
       <span>K</span>
      </button>
      <ThemeToggle />
      <Button
       variant="ghost"
       size="icon"
       className="h-10 w-10 text-slate-600"
       onClick={() => navigate("/dashboard/alerts")}
       aria-label="Alerts"
      >
       <Bell className="h-4 w-4" />
      </Button>
      <Button
       size="sm"
        className="h-10 min-w-[44px] rounded-lg bg-blue-600 px-3 font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md sm:px-4"
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
