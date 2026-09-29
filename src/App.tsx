import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalError } from "@/components/GlobalError";
import { SupabaseConfigError } from "@/components/SupabaseConfigError";
import DashboardLayout from "@/components/DashboardLayout";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Landing from "./pages/Landing";
import { Footer } from "@/components/Footer";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const BulkTestPage = lazy(() => import("./pages/BulkTestPage"));
const TeamWorkspacePage = lazy(() => import("./pages/TeamWorkspacePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="font-mono text-sm text-muted-foreground">Initializing KeyPing...</span>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    // The full path is carried so a sign in can return the user to the page
    // they actually asked for. AuthPage reads it from router state.
    return <Navigate to="/auth" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }
  return <Outlet />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  // Only redirects a signed in visitor away from public pages other than
  // /auth, which is what the landing page needs. Redirecting away from /auth is
  // left to AuthPage, which owns the post sign in navigation. Redirecting here
  // replaced AuthPage before its own effect could read the deep link, so the
  // deep link never ran and every protected redirect landed on /dashboard
  // instead of the page the user asked for.
  if (user && location.pathname !== "/auth") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppLayout() {
  const { pathname, hash } = useLocation();
  const showFooter = !pathname.startsWith("/dashboard") && pathname !== "/auth" && pathname !== "/";

  // Scrolls to the target of an in page anchor for any route.
  //
  // React Router does not scroll to a hash on a client side navigation, so
  // links such as the footer links to /#providers and the command palette item
  // for /dashboard#request-lab would change the route but leave the viewport
  // where it was. The raw href version had the mirror problem: a document
  // navigation tried to scroll before React had mounted the target.
  //
  // This runs on the hash of any route and after paint, by which time the
  // target section exists and layout has settled.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        {/* No key on the boundary. Keying it by pathname remounted the entire
            route tree on every navigation, which tore down the dashboard
            layout, the command palette, and the current page each time and
            re-ran their queries. The boundary still resets when the route
            changes because a thrown error unmounts the subtree it caught, and
            PageTransition already handles the visual transition. */}
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bulk" element={<BulkTestPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="team" element={<TeamWorkspacePage />} />
            <Route path="docs" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  if (!isSupabaseConfigured) {
    return <SupabaseConfigError />;
  }

  return (
    <GlobalError>
      <AuthProvider>
        <TooltipProvider>
          <Sonner richColors position="top-right" closeButton />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </GlobalError>
  );
};

export default App;
