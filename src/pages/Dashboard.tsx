import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import ApiKeyTester from "@/components/ApiKeyTester";
import { DashboardOverview } from "@/components/dashboard/Overview";
import { RequestLab } from "@/components/dashboard/RequestLab";
import { PageShell } from "@/components/dashboard/ui";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useHistory } from "@/hooks/useHistory";
import { notifyDataChanged } from "@/lib/data-events";

export default function Dashboard() {
  const location = useLocation();
  const { analytics, loading: analyticsLoading, error: analyticsError, refresh: refreshAnalytics } = useAnalytics();
  const { tests, loading: historyLoading, error: historyError, refresh: refreshHistory } = useHistory();
  const loading = analyticsLoading || historyLoading;
  const dataError = analyticsError ?? historyError;

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    window.requestAnimationFrame(() => {
      const container = target.closest("main") ?? target.parentElement;
      if (!container) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const HEADER_OFFSET = 88;
      const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top - HEADER_OFFSET;
      container.scrollBy({ top, behavior: "smooth" });
    });
  }, [location.hash]);

  const handleRefresh = useCallback(() => {
    refreshAnalytics();
    refreshHistory();
  }, [refreshAnalytics, refreshHistory]);

  const handleSave = useCallback(() => {
    handleRefresh();
    notifyDataChanged("key_tests");
  }, [handleRefresh]);

  return (
    <>
      <PageShell width="full">
        {dataError && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Some dashboard data could not be loaded. You can retry the refresh action.</span></div>}

        <DashboardOverview
          analytics={analytics}
          tests={tests}
          loading={loading}
          onRefresh={handleRefresh}
        />

        <div id="key-tester" className="pt-2">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Run a new validation</h2>
              <p className="mt-1 text-sm text-slate-600">Paste a key or use a custom endpoint to inspect the provider response.</p>
            </div>
            <p className="text-xs font-medium text-slate-500">Keys are tested server side and are not stored in full.</p>
          </div>
          <ApiKeyTester onSave={handleSave} />
        </div>

        <RequestLab />
      </PageShell>
    </>
  );
}
