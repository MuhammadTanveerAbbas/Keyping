import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalError } from "@/components/GlobalError";
import { SupabaseConfigError } from "@/components/SupabaseConfigError";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Landing from "./pages/Landing";
import { Footer } from "@/components/Footer";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BulkTestPage = lazy(() => import("./pages/BulkTestPage"));
const TeamWorkspacePage = lazy(() => import("./pages/TeamWorkspacePage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const VaultPage = lazy(() => import("./pages/VaultPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
 defaultOptions: {
  queries: {
   staleTime: 1000 * 60 * 5,
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

function PageLoader() {
 return (
  <div className="flex min-h-[40vh] items-center justify-center">
   <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
 );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
 const { user, loading } = useAuth();
 if (loading) return <FullScreenLoader />;
 if (!user) return <Navigate to="/" replace />;
 return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
 const { user, loading } = useAuth();
 if (loading) return <FullScreenLoader />;
 if (user) return <Navigate to="/dashboard" replace />;
 return <>{children}</>;
}

function AppLayout() {
 const { pathname } = useLocation();
 const showFooter = !pathname.startsWith("/dashboard") && pathname !== "/auth" && pathname !== "/";

 return (
  <div className="flex min-h-screen flex-col">
   <div className="flex-1">
    <ErrorBoundary>
     <AppRoutes />
    </ErrorBoundary>
   </div>
   {showFooter && <Footer />}
  </div>
 );
}

const AppRoutes = () => {
 const location = useLocation();
 return (
  <AnimatePresence mode="wait">
   <Suspense fallback={<PageLoader />}>
    <Routes location={location} key={location.pathname}>
     <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
     <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

     <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
     <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkTestPage /></ProtectedRoute>} />
     <Route path="/dashboard/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
     <Route path="/dashboard/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
     <Route path="/dashboard/team" element={<ProtectedRoute><TeamWorkspacePage /></ProtectedRoute>} />
     <Route path="/dashboard/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
     <Route path="/dashboard/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
     <Route path="/dashboard/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
     <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

     <Route path="/privacy" element={<Privacy />} />
     <Route path="/terms" element={<Terms />} />

     <Route path="*" element={<NotFound />} />
    </Routes>
   </Suspense>
  </AnimatePresence>
 );
};

const App = () => {
 if (!isSupabaseConfigured) {
  return <SupabaseConfigError />;
 }

 return (
 <GlobalError>
  <QueryClientProvider client={queryClient}>
   <AuthProvider>
    <TooltipProvider>
     <Toaster />
     <Sonner richColors />
     <BrowserRouter>
      <AppLayout />
     </BrowserRouter>
    </TooltipProvider>
   </AuthProvider>
  </QueryClientProvider>
 </GlobalError>
 );
};

export default App;
