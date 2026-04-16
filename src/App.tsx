import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import BulkTestPage from "./pages/BulkTestPage";
import TeamWorkspacePage from "./pages/TeamWorkspacePage";
import StatsPage from "./pages/StatsPage";
import AlertsPage from "./pages/AlertsPage";
import VaultPage from "./pages/VaultPage";
import DocsPage from "./pages/DocsPage";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // cache 5 minutes
      retry: 1,
    },
  },
});

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

/** Blocks access to protected pages  redirects to / if not logged in */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Blocks landing/auth pages when already logged in  redirects to /dashboard */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes  redirect to /dashboard if already logged in */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* Protected routes  redirect to / if not logged in */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkTestPage /></ProtectedRoute>} />
        <Route path="/dashboard/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
        <Route path="/dashboard/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
        <Route path="/dashboard/team" element={<ProtectedRoute><TeamWorkspacePage /></ProtectedRoute>} />
        <Route path="/dashboard/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/dashboard/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/dashboard/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Legal  always public */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner richColors theme="system" />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
